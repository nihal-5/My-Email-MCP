/**
 * Power Monitor - Detects low battery and power loss
 * Sends WhatsApp notification when laptop is about to shut down
 */

import { WhatsAppClient } from './whatsapp-client.js';
import { logger } from './utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MY_WHATSAPP_NUMBER = process.env.MY_WHATSAPP_NUMBER || '15715026464';
const BATTERY_CHECK_INTERVAL = 120000; // Check every 2 minutes
const LOW_BATTERY_THRESHOLD = 30; // Alert when battery < 30% (changed from 10%)
const CRITICAL_BATTERY_THRESHOLD = 10; // Critical alert when < 10%

export class PowerMonitor {
  private client: WhatsAppClient;
  private isMonitoring: boolean = false;
  private batteryCheckInterval?: NodeJS.Timeout;
  private myChatId: string = '';
  private lastBatteryWarning: number = 0;
  private wasOnBattery: boolean = false;

  constructor(client: WhatsAppClient) {
    this.client = client;
    this.myChatId = `${MY_WHATSAPP_NUMBER}@c.us`;
  }

  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Power monitor already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('🔋 Power Monitor started');

    // Start periodic battery checks
    this.batteryCheckInterval = setInterval(() => {
      this.checkBattery();
    }, BATTERY_CHECK_INTERVAL);

    // Initial check
    this.checkBattery();
  }

  stop(): void {
    if (this.batteryCheckInterval) {
      clearInterval(this.batteryCheckInterval);
    }
    this.isMonitoring = false;
    logger.info('🔋 Power Monitor stopped');
  }

  private async checkBattery(): Promise<void> {
    try {
      // Get battery info on macOS
      const { stdout } = await execAsync('pmset -g batt');
      
      // Parse battery percentage
      const percentMatch = stdout.match(/(\d+)%/);
      const chargingMatch = stdout.match(/(charging|AC Power|discharging)/i);
      
      if (!percentMatch) return;
      
      const batteryPercent = parseInt(percentMatch[1]);
      const isCharging = chargingMatch && 
        (chargingMatch[1].toLowerCase() === 'charging' || 
         chargingMatch[1].toLowerCase().includes('ac power'));
      
      logger.debug(`Battery: ${batteryPercent}%, Charging: ${isCharging}`);

      // Detect power state change
      const onBattery = !isCharging;
      
      // ⚠️ ONLY NOTIFY WHEN BATTERY < 30% AND UNPLUGGED
      // Don't spam with notifications on every plug/unplug
      if (onBattery && !this.wasOnBattery) {
        // Just switched to battery power
        if (batteryPercent < LOW_BATTERY_THRESHOLD) {
          await this.sendNotification('🔌⚠️ Power Unplugged - LOW BATTERY',
            `⚠️ Mac is now running on BATTERY (${batteryPercent}%)\n\n` +
            `🔋 Battery: ${batteryPercent}% - Below 30% threshold!\n` +
            `⏰ ${new Date().toLocaleString()}\n\n` +
            `� PLUG IN CHARGER to ensure 24/7 operation\n` +
            `⚡ Bot will continue running until battery dies`
          );
        }
        // If battery > 30%, no notification (silent)
      } else if (!onBattery && this.wasOnBattery) {
        // Just plugged in - only notify if battery WAS low
        if (batteryPercent < LOW_BATTERY_THRESHOLD + 10) { // Within 40%
          await this.sendNotification('🔌 Power Connected',
            `✅ Mac is now plugged in\n\n` +
            `🔋 Battery: ${batteryPercent}%\n` +
            `⏰ ${new Date().toLocaleString()}\n\n` +
            `✨ 24/7 operation restored!`
          );
        }
        // If battery was high, no notification (silent)
      }
      
      this.wasOnBattery = onBattery;

      // Low battery warning (30% threshold)
      if (onBattery && batteryPercent <= LOW_BATTERY_THRESHOLD) {
        const now = Date.now();
        // Only send warning once every 10 minutes
        if (now - this.lastBatteryWarning > 600000) {
          await this.sendNotification('⚠️ LOW BATTERY WARNING',
            `⚠️ Battery at ${batteryPercent}%!\n\n` +
            `⏰ ${new Date().toLocaleString()}\n\n` +
            `🔌 Please plug in charger\n` +
            `💡 Bot will continue running but may shut down if battery dies`
          );
          this.lastBatteryWarning = now;
        }
      }

      // CRITICAL battery warning (10% threshold)
      if (onBattery && batteryPercent <= CRITICAL_BATTERY_THRESHOLD) {
        const now = Date.now();
        // Send critical warning every 5 minutes
        if (now - this.lastBatteryWarning > 300000) {
          await this.sendNotification('🚨 CRITICAL BATTERY WARNING',
            `🚨 CRITICAL: Battery at ${batteryPercent}%!\n\n` +
            `⏰ ${new Date().toLocaleString()}\n\n` +
            `🔌 PLUG IN CHARGER NOW!\n` +
            `⚡ Mac will shut down soon and bot will stop\n\n` +
            `💡 Bot will send shutdown notification before Mac dies`
          );
          this.lastBatteryWarning = now;
        }
      }
    } catch (error) {
      logger.debug('Error checking battery:', error);
      // Non-critical error, continue monitoring
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
      logger.info(`📱 Sent power notification: ${title}`);
    } catch (error) {
      logger.error('Failed to send power notification:', error);
    }
  }

  // Manual power status check
  async sendPowerStatus(): Promise<void> {
    try {
      const { stdout } = await execAsync('pmset -g batt');
      const percentMatch = stdout.match(/(\d+)%/);
      const chargingMatch = stdout.match(/(charging|AC Power|discharging)/i);
      
      const batteryPercent = percentMatch ? percentMatch[1] : 'unknown';
      const powerStatus = chargingMatch ? chargingMatch[1] : 'unknown';
      
      await this.sendNotification('🔋 Power Status',
        `Current power status:\n\n` +
        `🔋 Battery: ${batteryPercent}%\n` +
        `🔌 Status: ${powerStatus}\n` +
        `⏰ ${new Date().toLocaleString()}\n\n` +
        `✅ Bot is running normally`
      );
    } catch (error) {
      logger.error('Error getting power status:', error);
    }
  }
}
