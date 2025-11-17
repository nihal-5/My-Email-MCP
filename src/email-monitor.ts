/**
 * Email Monitor - Monitors Gmail inbox for JDs from recruiters
 * Automatically processes job postings received via email
 * Uses hybrid rule-based + LLM classification for maximum accuracy
 */

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { logger } from './utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { HybridAI } from './ai/hybrid-ai.js';
import { UniversalEmailClassifier, EmailDatabase, CostTracker } from './ai/universal-classifier.js';

const execAsync = promisify(exec);

interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export class EmailMonitor {
  private imap: any;
  private config: EmailConfig;
  private processedEmails: Set<string> = new Set();
  private isMonitoring: boolean = false;
  private reconnectTimer?: NodeJS.Timeout;
  private hybridAI: HybridAI; // 🤖 LOCAL + CLOUD AI (saves $300/month!)
  private universalClassifier: UniversalEmailClassifier; // 🏷️ Classifies ALL emails!
  private emailDB: EmailDatabase; // 💾 Stores all classifications
  private costTracker: CostTracker; // 💰 Tracks savings

  constructor() {
    this.config = {
      user: process.env.GMAIL_USER || process.env.FROM_EMAIL || '',
      password: process.env.GMAIL_APP_PASSWORD || '',
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    };

    if (!this.config.user || !this.config.password) {
      throw new Error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }

    // Initialize AI systems
    this.hybridAI = new HybridAI();
    this.universalClassifier = new UniversalEmailClassifier();
    this.emailDB = new EmailDatabase();
    this.costTracker = new CostTracker();
    
    logger.info('🤖 Hybrid AI initialized (Groq + GPT-5)');
    logger.info('🏷️  Universal Email Classifier ready (FREE with Groq API!)');
    logger.info('💾 Email database loaded');
  }

  /**
   * Start monitoring inbox for new emails
   */
  async start(): Promise<void> {
    logger.info('📧 Starting email monitor...');
    await this.emailDB.waitUntilReady();
    logger.info('📂 Email classification database ready');
    
    this.imap = new Imap({
      user: this.config.user,
      password: this.config.password,
      host: this.config.host,
      port: this.config.port,
      tls: this.config.tls,
      tlsOptions: { rejectUnauthorized: false }
    });

    this.imap.once('ready', () => {
      logger.info('✅ Email monitor connected to Gmail');
      this.openInbox();
    });

    this.imap.once('error', (err: Error) => {
      logger.error('❌ Email monitor error:', err.message);
      this.scheduleReconnect();
    });

    this.imap.once('end', () => {
      logger.warn('Email monitor connection ended');
      this.scheduleReconnect();
    });

    this.imap.connect();
    this.isMonitoring = true;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    logger.info('Stopping email monitor...');
    this.isMonitoring = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.imap) {
      this.imap.end();
    }
  }

  /**
   * Schedule reconnection after disconnect
   */
  private scheduleReconnect(): void {
    if (!this.isMonitoring) return;

    logger.info('Scheduling email monitor reconnection in 30 seconds...');
    this.reconnectTimer = setTimeout(() => {
      logger.info('Reconnecting email monitor...');
      this.start();
    }, 30000);
  }

  /**
   * Open inbox and start listening for new emails
   */
  private openInbox(): void {
    this.imap.openBox('INBOX', false, (err: Error) => {
      if (err) {
        logger.error('Failed to open inbox:', err.message);
        return;
      }

      logger.info('📬 Inbox opened, listening for new emails...');

      // Listen for new emails
      this.imap.on('mail', (numNewMsgs?: number) => {
        logger.info(`📨 New email detected! Processing UNSEEN emails only...`);
        // ALWAYS use checkNewEmails() which safely searches for UNSEEN emails
        // NEVER call fetchRecentEmails() - it causes UID errors
        this.checkNewEmails();
      });

      // System is now LIVE - only watches for NEW incoming emails
      logger.info('✅ Email monitor is LIVE - watching for NEW incoming emails only (not historical)');
    });
  }

  /**
   * Check for new unread emails
   */
  private checkNewEmails(): void {
    // Search for UNSEEN (unread) emails
    this.imap.search(['UNSEEN'], (err: Error, results: number[]) => {
      if (err) {
        logger.error('Email search error:', err.message);
        return;
      }

      if (!results || results.length === 0) {
        logger.info('No unread emails found');
        return;
      }

      logger.info(`Found ${results.length} unread email(s)`);

      const fetch = this.imap.fetch(results, {
        bodies: '',
        markSeen: false // Don't mark as read yet
      });

      fetch.on('message', (msg: any) => {
        msg.on('body', (stream: any) => {
          this.parseEmail(stream);
        });
      });

      fetch.once('error', (err: Error) => {
        logger.error('Fetch error:', err.message);
      });
    });
  }

  /**
   * Fetch the most recent emails regardless of read status
   */
  private fetchRecentEmails(count: number = 1): void {
    if (!this.imap) return;

    const safeCount = Math.max(1, Math.min(count, 200));

    // Don't call status() when box is already open - use the box from openInbox
    logger.info(`📥 Fetching last ${safeCount} emails from inbox...`);

    // Fetch from the end of the mailbox (most recent)
    const fetch = this.imap.seq.fetch(`-${safeCount}:*`, {
      bodies: '',
      markSeen: false
    });

    fetch.on('message', (msg: any) => {
      msg.on('body', (stream: any) => {
        this.parseEmail(stream);
      });
    });

    fetch.once('error', (fetchErr: Error) => {
      logger.error('Fetch recent emails error:', fetchErr.message);
    });
  }

  /**
   * 🧪 MANUAL TEST: Fetch last 20 emails for classification testing
   */
  private fetchLast20Emails(): void {
    if (!this.imap) return;

    logger.info('🧪 Fetching last 20 emails for testing...');

    // Use ALL search to get all emails, then fetch the last 20
    this.imap.search(['ALL'], (err: Error, results: number[]) => {
      if (err) {
        logger.error('Search error:', err.message);
        return;
      }

      if (!results || results.length === 0) {
        logger.info('No emails found in inbox');
        return;
      }

      // Get the last 20 UIDs
      const last20 = results.slice(-20);
      logger.info(`📥 Found ${results.length} total emails, fetching last 20: [${last20.join(', ')}]`);

      const fetch = this.imap.fetch(last20, {
        bodies: '',
        markSeen: false
      });

      fetch.on('message', (msg: any) => {
        msg.on('body', (stream: any) => {
          this.parseEmail(stream);
        });
      });

      fetch.once('error', (fetchErr: Error) => {
        logger.error('Fetch last 20 emails error:', fetchErr.message);
      });

      fetch.once('end', () => {
        logger.info('✅ Finished fetching last 10 emails');
      });
    });
  }

  /**
   * Generate a deterministic ID for emails without a Message-ID header
   */
  private generateEmailId(email: ParsedMail, content: string): string {
    if (email.messageId) {
      return email.messageId;
    }

    const hash = createHash('sha256');
    hash.update(email.from?.text || '');
    hash.update(email.subject || '');
    hash.update(email.date ? email.date.toISOString() : '');
    hash.update(content.substring(0, 500));

    return hash.digest('hex');
  }

  /**
   * Parse email content and check if it's a JD
   */
  private async parseEmail(stream: any): Promise<void> {
    try {
      // Parse email with timeout to prevent hangs
      const parsePromise = simpleParser(stream);
      const parserTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email parsing timeout after 10s')), 10000);
      });
      
      const parsed = await Promise.race([parsePromise, parserTimeout]) as ParsedMail;
      
      // Skip if already processed
      if (parsed.messageId && this.processedEmails.has(parsed.messageId)) {
        logger.info('Email already processed, skipping');
        return;
      }

      logger.info(`📧 Email from: ${parsed.from?.text || 'Unknown'}`);
      logger.info(`   Subject: ${parsed.subject || 'No subject'}`);

      // Extract email content
      const emailText = parsed.text || '';
      const emailHtml = parsed.html || '';
      const fullContent = emailText + ' ' + emailHtml;
      const from = parsed.from?.text || '';
      const subject = parsed.subject || '';
      const emailId = this.generateEmailId(parsed, fullContent);

      if (await this.emailDB.hasEmail(emailId)) {
        logger.info(`📂 Email already stored (ID: ${emailId}), skipping duplicate`);
        return;
      }

      // 🏷️ CLASSIFY ALL EMAILS (FREE with Groq!)
      
      logger.info('🏷️  Classifying email with GROQ (FREE & BETTER!)...');
      
      // Add timeout to prevent hangs
      const classificationPromise = this.universalClassifier.classifyEmail(
        from,
        subject,
        fullContent
      );
      
      const classificationTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Classification timeout after 30s')), 30000);
      });
      
      const classification = await Promise.race([
        classificationPromise,
        classificationTimeout
      ]) as any;
      
      // Track cost savings
      this.costTracker.trackLocal();
      
      // Save to database
      await this.emailDB.saveClassification(emailId, classification);

      // Log classification
      logger.info(`✅ Email classified: ${classification.category.toUpperCase()}`);
      logger.info(`   Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
      logger.info(`   Priority: ${classification.priority}`);
      logger.info(`   Needs reply: ${classification.needsReply ? 'YES' : 'NO'}`);
      if (classification.suggestedAction) {
        logger.info(`   Suggested: ${classification.suggestedAction}`);
      }
      logger.info(`   💰 Cost: $0 (vs $0.10 with GPT-5)`);

      // Show cost savings
      const stats = this.costTracker.getReport();
      logger.info(`   📊 Total savings: $${stats.costSaved.toFixed(2)} (${stats.localClassifications} emails)`);

      // DEBUG LOG: Email saved to database
      logger.info(`   🗄️  Email saved to database with ID: ${emailId}`);
      console.log(`[DEBUG] Email classification saved:`, {
        id: emailId,
        category: classification.category,
        confidence: classification.confidence,
        timestamp: classification.timestamp
      });

      // Check if this is a JD/job posting (for job processing)
      if (classification.category === 'job_opportunity' ||
          await this.isJobDescription(parsed, fullContent)) {
        logger.info('✅ Detected job description in email!');

        await this.processJobDescription(parsed, emailText);

        // Mark as processed
        if (parsed.messageId) {
          this.processedEmails.add(parsed.messageId);
        }

        // Mark email as read
        this.markAsRead(parsed.messageId);
      } else {
        logger.info(`📁 Email stored in category: ${classification.category}`);
        logger.info(`   All emails are classified and saved! 🎉`);

        // DEBUG LOG: Email categorized but not processed as JD
        console.log(`[DEBUG] Email categorized as ${classification.category} (not job opportunity)`);
      }

    } catch (error: any) {
      logger.error('❌ Email processing failed (non-fatal):', error.message);
      logger.error('   Stack:', error.stack?.substring(0, 200));
      logger.error('   Email will be skipped, system continues running');
      
      // Don't crash the entire system - just skip this email
      // The IMAP connection will remain active for next emails
    }
  }

  /**
   * Detect if email contains a job description
   * Uses hybrid rule-based + LLM classification
   */
  private async isJobDescription(email: ParsedMail, content: string): Promise<boolean> {
    const subject = (email.subject || '').toLowerCase();
    const lowerContent = content.toLowerCase();
    const fromEmail = email.from?.value[0]?.address?.toLowerCase() || '';

    // EXCLUDE: Reply/thread emails (critical to prevent reprocessing)
    const isReply = email.inReplyTo || 
                    email.references || 
                    subject.startsWith('re:') || 
                    subject.startsWith('fwd:') ||
                    subject.includes('re:') ||
                    subject.includes('fwd:');

    if (isReply) {
      logger.info(`❌ Excluded: This is a reply/forwarded email (subject: "${email.subject}")`);
      return false;
    }

    // EXCLUDE: Known non-JD senders
    const excludedDomains = [
      'linkedin.com',        // LinkedIn newsletters, alerts
      'noreply@',           // No-reply automated emails
      'newsletters@',       // Newsletter services
      'updates@',           // Update notifications
      'alerts@',            // Alert services
      'notifications@'      // Notification services
    ];

    const isExcludedSender = excludedDomains.some(domain => fromEmail.includes(domain));
    
    if (isExcludedSender) {
      logger.info(`❌ Excluded sender domain: ${fromEmail}`);
      return false;
    }

    // EXCLUDE: Newsletter/marketing subject patterns
    const excludedSubjectPatterns = [
      /newsletter/i,
      /digest/i,
      /alert/i,
      /notification/i,
      /update/i,
      /highlights/i,
      /weekly|monthly|daily/i,
      /new.*jobs.*match/i,     // LinkedIn "X new jobs match your preferences"
      /recommended.*for.*you/i
    ];

    const hasExcludedSubject = excludedSubjectPatterns.some(pattern => pattern.test(subject));
    
    if (hasExcludedSubject) {
      logger.info(`❌ Excluded subject pattern: ${subject}`);
      return false;
    }

    // REQUIRE: Direct job posting indicators in subject
    const jobTitleKeywords = [
      'engineer', 'developer', 'scientist', 'analyst', 'manager',
      'architect', 'consultant', 'specialist', 'lead', 'senior',
      'junior', 'intern', 'director', 'coordinator', 'administrator'
    ];

    const locationIndicators = [
      /\bin\s+[A-Z][a-z]+/,  // "in Boston", "in NYC"
      /[A-Z]{2}$/,            // State codes at end "MI", "CA"
      /remote/i,
      /hybrid/i,
      /onsite/i,
      /on-site/i
    ];

    const hasJobTitle = jobTitleKeywords.some(title => subject.includes(title));
    const hasLocation = locationIndicators.some(pattern => pattern.test(subject));

    // Strong subject indicator: Has job title AND location
    const hasStrongSubject = hasJobTitle && hasLocation;

    // REQUIRE: Core JD content indicators (must have MOST of these)
    const coreJDIndicators = [
      /\b\d+\+?\s*(years?|yrs?)\s*(of)?\s*experience\b/i,              // "5+ years experience"
      /\b(bachelor'?s?|master'?s?|phd|degree)\b/i,                     // Education requirements
      /\b(required|must.have|should.have)\s+(skills?|qualifications?|experience)\b/i,
      /\bresume\b.*\b(submit|send|apply|attach)\b/i,                   // "submit resume", "send resume"
      /\bresponsibilities\s*:/i,                                       // "Responsibilities:"
      /\brequirements\s*:/i,                                           // "Requirements:"
      /\bqualifications\s*:/i,                                         // "Qualifications:"
      /\b(full.?time|part.?time|contract|w2|c2c|1099)\b/i,            // Employment type
      /\b(competitive\s+)?(salary|compensation|pay|rate)\b/i,         // Compensation
      /\bbenefits\b/i,                                                 // Benefits
      /\blocation\s*:/i,                                               // "Location:"
      /\bapply\b.*\b(now|today|here|link)\b/i                         // Call to action
    ];

    const coreMatchCount = coreJDIndicators.filter(pattern => pattern.test(content)).length;

    // REQUIRE: Technical/domain keywords (for IT/Data Science roles)
    const technicalKeywords = [
      /\b(python|java|javascript|typescript|react|node|angular|vue)\b/i,
      /\b(aws|azure|gcp|cloud)\b/i,
      /\b(sql|nosql|mongodb|postgres|mysql)\b/i,
      /\b(docker|kubernetes|terraform|jenkins)\b/i,
      /\b(machine.learning|deep.learning|ai|ml|data.science)\b/i,
      /\b(tensorflow|pytorch|scikit.learn|keras)\b/i,
      /\b(api|rest|graphql|microservices)\b/i,
      /\b(git|github|gitlab|version.control)\b/i
    ];

    const hasTechnicalContent = technicalKeywords.some(pattern => pattern.test(content));

    // DECISION LOGIC (prioritize NOT missing any real JDs from recruiters)
    
    // Option 1: Strong subject (job title + location) - Trust the subject line!
    // If recruiter mentions a job title AND location, it's almost certainly a JD
    // Even if email content is brief (just "Are you interested? Call me")
    if (hasStrongSubject) {
      logger.info(`✅ JD detected (Strong subject): Job title + location in subject`);
      return true;
    }

    // Option 2: Job title in subject + ANY of these signals:
    // - At least 2 core indicators OR
    // - Technical content mentioned OR
    // - Keywords like "opportunity", "hiring", "position"
    const hasJobOpportunityKeywords = /\b(opportunity|opening|hiring|position|role|vacancy)\b/i.test(subject);
    
    if (hasJobTitle && (coreMatchCount >= 2 || hasTechnicalContent || hasJobOpportunityKeywords)) {
      logger.info(`✅ JD detected (Job title + signals): ${coreMatchCount} core indicators, tech=${hasTechnicalContent}`);
      return true;
    }

    // Option 3: Very strong content match (6+ core indicators)
    // This catches emails with detailed JD content even without perfect subject
    if (coreMatchCount >= 6) {
      logger.info(`✅ JD detected (Strong content): ${coreMatchCount} core indicators`);
      return true;
    }

    // Option 4: UNCERTAIN CASES - Use LLM as safety net!
    // If we have some signals but not enough to be certain, ask LLM
    const isUncertain = (hasJobTitle && coreMatchCount >= 1) || coreMatchCount >= 3;
    
    if (isUncertain) {
      logger.info(`🤔 Uncertain case - using LLM classifier: Job title=${hasJobTitle}, Core=${coreMatchCount}/12`);
      return await this.askLLMClassification(email, content);
    }

    logger.info(`❌ Not a JD: Subject match=${hasStrongSubject}, Job title=${hasJobTitle}, Core=${coreMatchCount}/12, Technical=${hasTechnicalContent}`);
    return false;
  }

  /**
   * Use LLM to classify uncertain emails
   * Only called for ~20% of emails that pass initial filters but aren't clearly JDs
   */
  private async askLLMClassification(email: ParsedMail, content: string): Promise<boolean> {
    try {
      const subject = email.subject || '';
      const from = email.from?.text || '';
      const snippet = content.substring(0, 800); // First 800 chars for context

      const emailContent = `From: ${from}
Subject: ${subject}

Content:
${snippet}`;

      logger.info('🤖 Using LOCAL Llama 3B for email classification (FREE!)...');
      
      // Use HybridAI (Local Llama 3B) for classification
      const classification = await this.hybridAI.classifyEmail(emailContent);
      
      const isJD = classification.isJob;
      
      if (isJD) {
        logger.info(`✅ JOB DETECTED! (Confidence: ${(classification.confidence * 100).toFixed(0)}%)`);
        logger.info(`   Company: ${classification.company || 'N/A'}`);
        logger.info(`   Role: ${classification.role || 'N/A'}`);
        logger.info(`   Recruiter: ${classification.recruiterName || 'N/A'} (${classification.recruiterEmail || 'N/A'})`);
        logger.info(`   💰 Cost: $0 (vs $0.10 with GPT-5)`);
      } else {
        logger.info(`❌ NOT a job (Confidence: ${(classification.confidence * 100).toFixed(0)}%)`);
        logger.info(`   💰 Cost: $0 (saved $0.10!)`);
      }
      
      return isJD;

    } catch (error: any) {
      logger.error(`❌ Hybrid AI classification failed: ${error.message}`);
      logger.warn('   Falling back to conservative NO (better than risking false positive)');
      return false; // Conservative fallback
    }
  }

  /**
   * Process job description by calling orchestrator
   */
  private async processJobDescription(email: ParsedMail, jdText: string): Promise<void> {
    try {
      logger.info('🚀 Processing job description from email...');

      // Extract recruiter info
      const recruiterEmail = email.from?.value[0]?.address || '';
      const recruiterName = email.from?.value[0]?.name || recruiterEmail.split('@')[0];
      const subject = email.subject || 'Job Opportunity';

      // Create session file with email source metadata
      const timestamp = new Date().toISOString();
      const sessionFile = path.join(
        process.cwd(),
        'data',
        'session',
        `email_${timestamp.replace(/[:.]/g, '-')}.json`
      );

      await fs.mkdir(path.dirname(sessionFile), { recursive: true });

      const sessionData = {
        source: 'email',
        timestamp,
        recruiterEmail,
        recruiterName,
        subject,
        jdText,
        messageId: email.messageId
      };

      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
      logger.info(`✅ Saved email JD to: ${sessionFile}`);

      // Call Python orchestrator
      const cmd = `cd ${process.cwd()}/orchestrator && python main.py "${sessionFile}"`;
      
      logger.info('Calling orchestrator to process email JD...');
      const { stdout, stderr } = await execAsync(cmd);

      if (stderr) {
        logger.warn('Orchestrator stderr:', stderr);
      }

      if (stdout) {
        logger.info('Orchestrator output:', stdout);
      }

      logger.info('✅ Email JD processed successfully');

    } catch (error: any) {
      logger.error('Error processing email JD:', error.message);
    }
  }

  /**
   * Mark email as read
   */
  private markAsRead(messageId?: string): void {
    if (!messageId) return;

    try {
      // Search for the message and mark it as seen
      this.imap.search([['HEADER', 'MESSAGE-ID', messageId]], (err: Error, results: number[]) => {
        if (err || !results || results.length === 0) return;

        this.imap.addFlags(results, ['\\Seen'], (flagErr: Error) => {
          if (flagErr) {
            logger.error('Failed to mark email as read:', flagErr.message);
          } else {
            logger.info('✅ Marked email as read');
          }
        });
      });
    } catch (error: any) {
      logger.error('Error marking email as read:', error.message);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { monitoring: boolean; processedCount: number } {
    return {
      monitoring: this.isMonitoring,
      processedCount: this.processedEmails.size
    };
  }
}
