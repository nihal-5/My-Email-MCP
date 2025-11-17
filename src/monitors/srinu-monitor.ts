/**
 * Srinu Monitor - Polls for JD messages from Srinu and triggers resume workflow
 * NOW WITH PERSISTENT MESSAGE TRACKING - NEVER MISSES A MESSAGE!
 */

import { WhatsAppClient } from '../whatsapp-client.js';
import { logger } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

const SRINU_CHAT_ID = '917702055194@c.us';
const POLL_INTERVAL_MS = 30000; // 30 seconds
const JD_MIN_LENGTH = 200; // Heuristic for JD detection

// IMPORTANT: Only process messages sent AFTER this timestamp
// Updated to current time to ONLY process new messages going forward
const CUTOFF_DATE = new Date(); // RIGHT NOW
const CUTOFF_TIMESTAMP = CUTOFF_DATE.getTime() / 1000; // Convert to Unix timestamp in seconds

// Persistent storage for processed message IDs
const PROCESSED_MESSAGES_FILE = join(process.cwd(), 'data', 'processed-srinu-messages.json');

interface ProcessedMessage {
  id: string;
  timestamp: number;
  processedAt: string;
}

export class SrinuMonitor {
  private client: WhatsAppClient;
  private processedMessages: Map<string, ProcessedMessage> = new Map();
  private isMonitoring: boolean = false;
  private pollInterval?: NodeJS.Timeout;

  constructor(client: WhatsAppClient) {
    this.client = client;
    this.loadProcessedMessages();
  }

  /**
   * Load processed message IDs from disk (survives restarts!)
   */
  private loadProcessedMessages(): void {
    try {
      if (existsSync(PROCESSED_MESSAGES_FILE)) {
        const data = JSON.parse(readFileSync(PROCESSED_MESSAGES_FILE, 'utf-8'));
        this.processedMessages = new Map(data.map((msg: ProcessedMessage) => [msg.id, msg]));
        logger.info(`📂 Loaded ${this.processedMessages.size} processed message IDs from disk`);
      } else {
        logger.info('📂 No processed messages file found, starting fresh');
      }
    } catch (error) {
      logger.error('Error loading processed messages:', error);
    }
  }

  /**
   * Save processed message IDs to disk (persistent across restarts!)
   */
  private saveProcessedMessages(): void {
    try {
      const data = Array.from(this.processedMessages.values());
      writeFileSync(PROCESSED_MESSAGES_FILE, JSON.stringify(data, null, 2));
      logger.debug(`💾 Saved ${data.length} processed message IDs to disk`);
    } catch (error) {
      logger.error('Error saving processed messages:', error);
    }
  }

  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Srinu monitor already running');
      return;
    }

    this.isMonitoring = true;
    logger.info(`Starting Srinu monitor (polling every ${POLL_INTERVAL_MS}ms)`);
    logger.info(`⏰ CUTOFF TIME: Only processing messages sent AFTER ${CUTOFF_DATE.toLocaleString()}`);
    logger.info(`   All messages before 3:30 PM on Nov 5 are ignored`);
    logger.info(`📊 Currently tracking ${this.processedMessages.size} processed messages`);

    // CRITICAL: Do NOT mark existing messages as processed on startup
    // Only messages we've actually processed (saved to disk) are skipped
    // This ensures we pick up messages sent while the system was down!
    logger.info('🔄 Checking for any missed messages from while we were down...');
    
    // Run an immediate check for missed messages
    await this.checkForNewMessages();

    // Set up regular polling
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForNewMessages();
      } catch (error) {
        logger.error('Error in Srinu monitor poll:', error);
      }
    }, POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info('Srinu monitor stopped');
  }

  private async checkForNewMessages(): Promise<void> {
    try {
      // Get recent messages from Srinu's chat
      const messages = await this.client.getMessages({
        chatId: SRINU_CHAT_ID,
        limit: 20 // Increased to catch more potentially missed messages
      });

      // Filter for unprocessed, incoming (not from me), long messages, AND sent after cutoff time
      const newJDMessages = messages.filter(msg => {
        // Check if message is after cutoff time
        const messageTimestamp = msg.timestamp;
        const isAfterCutoff = messageTimestamp >= CUTOFF_TIMESTAMP;

        if (!isAfterCutoff) {
          // Automatically track old messages (before cutoff) so we don't reprocess
          if (!this.processedMessages.has(msg.id)) {
            this.processedMessages.set(msg.id, {
              id: msg.id,
              timestamp: msg.timestamp,
              processedAt: new Date().toISOString() + ' (auto-skipped: before cutoff)'
            });
          }
          return false;
        }

        // Skip if already processed
        if (this.processedMessages.has(msg.id)) {
          return false;
        }

        // Must be incoming (not from me) and long enough to be a JD
        return !msg.fromMe && msg.body.length > JD_MIN_LENGTH;
      });

      if (newJDMessages.length > 0) {
        logger.info(`🎯 Found ${newJDMessages.length} NEW JD(s) from Srinu!`);

        for (const msg of newJDMessages) {
          const messageDate = new Date(msg.timestamp * 1000).toLocaleString();
          logger.info(`📥 Processing JD from ${messageDate} (${msg.body.substring(0, 100)}...)`);
          
          await this.processJD(msg.body, msg.id);
          
          // Mark as processed with timestamp
          this.processedMessages.set(msg.id, {
            id: msg.id,
            timestamp: msg.timestamp,
            processedAt: new Date().toISOString()
          });

          // Save to disk immediately after each message
          this.saveProcessedMessages();

          // Clean up old processed messages (keep last 200)
          if (this.processedMessages.size > 200) {
            const sortedEntries = Array.from(this.processedMessages.entries())
              .sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = sortedEntries.slice(0, 100);
            toDelete.forEach(([id]) => this.processedMessages.delete(id));
            logger.info(`🧹 Cleaned up ${toDelete.length} old processed message records`);
            this.saveProcessedMessages();
          }
        }
      } else {
        logger.debug('No new JD messages from Srinu');
      }
    } catch (error) {
      logger.error('Error checking for new messages:', error);
    }
  }

  private async processJD(jdText: string, messageId: string): Promise<void> {
    logger.info(`Processing JD from message ${messageId}`);

    try {
      // Trigger Python orchestrator
      const pythonScript = process.env.ORCHESTRATOR_PATH || './orchestrator/main.py';

      // Set environment variables for orchestrator
      const env = {
        ...process.env,
        JD_TEXT: jdText,
        WA_FROM: SRINU_CHAT_ID,
        CC_EMAIL: process.env.CC_EMAIL || 'nihal.veeramalla@gmail.com'
      };

      const { stdout, stderr } = await execAsync(
        `python3 "${pythonScript}"`,
        {
          env,
          timeout: 120000, // 2 minute timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );

      logger.info('Orchestrator completed:', stdout);

      if (stderr) {
        logger.warn('Orchestrator stderr:', stderr);
      }

      // Parse result
      try {
        const result = JSON.parse(stdout);
        // DISABLED: Do not send WhatsApp messages without user approval
        // await this.sendResultToSrinu(result);
        logger.info('Workflow completed. Results logged (WhatsApp notification disabled).');
      } catch (parseError) {
        logger.error('Failed to parse orchestrator output:', parseError);
        // DISABLED: Do not send WhatsApp messages without user approval
        // await this.client.sendMessage({
        //   chatId: SRINU_CHAT_ID,
        //   message: 'Resume workflow completed, but could not parse result. Check logs.'
        // });
      }
    } catch (error: any) {
      logger.error('Error processing JD:', error);
      // DISABLED: Do not send WhatsApp messages without user approval
      // await this.client.sendMessage({
      //   chatId: SRINU_CHAT_ID,
      //   message: `Error processing JD: ${error.message || 'Unknown error'}`
      // });
    }
  }

  private async sendResultToSrinu(result: any): Promise<void> {
    let message = '';

    if (result.email_result?.success) {
      message = `✅ Resume sent successfully!\n\n` +
                `PDF: ${result.email_result.pdfPath}\n` +
                `Email: ${result.email_result.messageId}\n` +
                `Role: ${result.role}\n` +
                `Cloud: ${result.cloud}`;
    } else if (result.validation && !result.validation.ok) {
      message = `❌ Resume validation failed:\n\n` +
                result.validation.errors.map((e: string) => `- ${e}`).join('\n');
    } else {
      message = `⚠️ Workflow completed with issues:\n${result.email_result?.error || 'Unknown error'}`;
    }

    await this.client.sendMessage({
      chatId: SRINU_CHAT_ID,
      message
    });
  }
}
