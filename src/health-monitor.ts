/**
 * Health Monitor - Sends WhatsApp notifications when bot goes down or comes back up
 */

import { WhatsAppClient } from './whatsapp-client.js';
import { logger } from './utils/logger.js';

const MY_WHATSAPP_NUMBER = process.env.MY_WHATSAPP_NUMBER || '15715026464';
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds
const FAILURE_THRESHOLD = 3; // Consider down after 3 consecutive failures

export class HealthMonitor {
  private client: WhatsAppClient;
  private isMonitoring: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private consecutiveFailures: number = 0;
  private lastStatus: 'up' | 'down' = 'up';
  private myChatId: string = '';

  constructor(client: WhatsAppClient) {
    this.client = client;
    this.myChatId = `${MY_WHATSAPP_NUMBER}@c.us`;
  }

  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Health monitor already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('🏥 Health Monitor started');
    
    // Send startup notification
    await this.sendNotification('✅ System Started', 
      '🚀 WhatsApp Resume Bot is now LIVE!\n\n' +
      '📋 Dashboard: http://10.0.0.138:3001/approval\n' +
      '🔍 Monitoring Srinu for job descriptions\n' +
      '⏰ Checking health every 60 seconds'
    );

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.isMonitoring = false;
    logger.info('🏥 Health Monitor stopped');
  }

  // Send shutdown notification before stopping
  async sendShutdownNotification(): Promise<void> {
    await this.sendNotification('🛑 System Stopped', 
      '⚠️ WhatsApp Resume Bot has been STOPPED\n\n' +
      `⏰ Stopped at ${new Date().toLocaleString()}\n` +
      '📋 Dashboard is offline\n' +
      '🔍 Monitoring paused\n\n' +
      '💡 To restart, run:\n' +
      'pm2 start whatsapp-resume-bot'
    );
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // If WhatsApp client is not ready, treat as unhealthy but do not spam sendMessage errors
      if (!(this.client as any).isClientReady || !(this.client as any).isClientReady()) {
        this.consecutiveFailures++;
        logger.warn(`⚠️ Health check skipped (client not ready) (${this.consecutiveFailures}/${FAILURE_THRESHOLD})`);
        if (this.consecutiveFailures >= FAILURE_THRESHOLD && this.lastStatus === 'up') {
          this.lastStatus = 'down';
          logger.error('❌ System is DOWN (client not ready)!');
        }
        return;
      }

      // Check if WhatsApp client is connected
      const isHealthy = await this.checkHealth();

      if (isHealthy) {
        // System is healthy
        if (this.consecutiveFailures > 0) {
          this.consecutiveFailures = 0;
        }

        // If was down and now up, send recovery notification
        if (this.lastStatus === 'down') {
          this.lastStatus = 'up';
          logger.info('✅ System recovered!');
          await this.sendNotification('✅ System Recovered', 
            '🎉 WhatsApp Resume Bot is back ONLINE!\n\n' +
            '📋 Dashboard: http://10.0.0.138:3001/approval\n' +
            '🔍 Monitoring resumed\n' +
            `⏰ Downtime recovered at ${new Date().toLocaleString()}`
          );
        }
      } else {
        // System is unhealthy
        this.consecutiveFailures++;
        logger.warn(`⚠️ Health check failed (${this.consecutiveFailures}/${FAILURE_THRESHOLD})`);

        // If reached threshold and was up, send alert
        if (this.consecutiveFailures >= FAILURE_THRESHOLD && this.lastStatus === 'up') {
          this.lastStatus = 'down';
          logger.error('❌ System is DOWN!');
          await this.sendNotification('❌ SYSTEM DOWN', 
            '🚨 WhatsApp Resume Bot is DOWN!\n\n' +
            `⏰ Detected at ${new Date().toLocaleString()}\n` +
            '🔄 PM2 should auto-restart in 2 seconds\n' +
            '📱 You will be notified when it recovers\n\n' +
            '🛠️ If it doesn\'t recover, run:\n' +
            'pm2 restart whatsapp-resume-bot'
          );
        }
      }
    } catch (error) {
      logger.error('Error in health check:', error);
    }
  }

  private async checkHealth(): Promise<boolean> {
    try {
      // Check if client exists and is ready
      if (!this.client) {
        return false;
      }

      // Check if WhatsApp client state is connected
      const state = (this.client as any).client?.info?.wid?._serialized;
      
      // If we can get state, we're healthy
      return !!state;
    } catch (error) {
      return false;
    }
  }

  private async sendNotification(title: string, message: string): Promise<void> {
    try {
      if (!this.client) {
        logger.warn('Cannot send notification - WhatsApp client not available');
        return;
      }

      const fullMessage = `*${title}*\n\n${message}`;
      
      await this.client.sendMessage({
        chatId: this.myChatId,
        message: fullMessage
      });
      logger.info(`📱 Sent health notification: ${title}`);
    } catch (error) {
      logger.error('Failed to send health notification:', error);
    }
  }

  // Public method to send manual status update
  async sendStatusUpdate(): Promise<void> {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await this.sendNotification('📊 System Status', 
      '✅ WhatsApp Resume Bot is ONLINE\n\n' +
      `⏱️ Uptime: ${hours}h ${minutes}m\n` +
      `💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
      `🔍 Monitoring: Active\n` +
      `📋 Dashboard: http://10.0.0.138:3001/approval\n` +
      `⏰ Status checked at ${new Date().toLocaleString()}`
    );
  }
}
