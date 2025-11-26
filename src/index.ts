#!/usr/bin/env node

import { WhatsAppClient } from './whatsapp-client.js';
import { MCPServer } from './mcp-server.js';
import { ApprovalServer } from './approval-server.js';
import { EmailMonitor } from './email-monitor.js';
import { SrinuMonitor } from './monitors/srinu-monitor.js';
import { HealthMonitor } from './health-monitor.js';
import { PowerMonitor } from './power-monitor.js';
import { logger } from './utils/logger.js';
import { getConfig } from './utils/config.js';
import { setApprovalServer } from './approval-integration.js';

async function main() {
  const config = getConfig();

  logger.info('='.repeat(80));
  logger.info('📧 Email-Only Resume Automation (Cloud-Ready)');
  logger.info('='.repeat(80));
  logger.info(`Configuration:`);
  logger.info(`  - MCP Port: ${config.mcpPort}`);
  logger.info(`  - Approval Port: ${config.approvalPort}`);
  logger.info(`  - Log Level: ${config.logLevel}`);
  logger.info('='.repeat(80));

  // Initialize MCP server (declare early for shutdown handler)
  let mcpServer: MCPServer | null = null;
  let approvalServer: ApprovalServer | null = null;
  let emailMonitor: EmailMonitor | null = null;
  let whatsappClient: WhatsAppClient | null = null;
  let srinuMonitor: SrinuMonitor | null = null;
  let healthMonitor: HealthMonitor | null = null;
  let powerMonitor: PowerMonitor | null = null;

    // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    try {
      // if (powerMonitor) {
      //   powerMonitor.stop();
      // }
      // if (healthMonitor) {
      //   healthMonitor.stop();
      // }
      // if (srinuMonitor) {
      //   srinuMonitor.stop();
      // }
      if (emailMonitor) {
        emailMonitor.stop();
      }
      if (approvalServer) {
        await approvalServer.stop();
      }
      if (mcpServer) {
        await mcpServer.stop();
      }
      if (whatsappClient) {
        // await whatsappClient.destroy(); // Skipped for now
      }
      logger.info('✅ Shutdown complete');
      process.exit(0);
    } catch (error: any) {
      logger.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Start Approval Dashboard FIRST
    logger.info('Starting Approval Dashboard...');
    approvalServer = new ApprovalServer();
    await approvalServer.start();

    // Set approval server for tools
    setApprovalServer(approvalServer);

    logger.info(`✅ Dashboard is running at http://localhost:${config.approvalPort}/approval`);
    logger.info('');

    // Start MCP server
    logger.info(`Starting MCP server on port ${config.mcpPort}...`);
    mcpServer = new MCPServer();
    await mcpServer.start();
    logger.info(`✅ MCP server is ready on port ${config.mcpPort}`);

    // Initialize WhatsApp Client
    logger.info('');
    logger.info('Starting WhatsApp client...');
    whatsappClient = new WhatsAppClient();
    await whatsappClient.initialize();
    logger.info('✅ WhatsApp client initialized');
    // Wait until the client is ready before starting monitors to avoid "Client is not ready"
    try {
      await whatsappClient.waitForReady(60000);
      logger.info('✅ WhatsApp client is ready - proceeding to start monitors');
    } catch (error: any) {
      logger.warn(`⚠️ WhatsApp client not ready after waiting: ${error.message}`);
      logger.warn('   Monitors will start, but you may see temporary "Client is not ready" until it connects');
    }

    // Start WhatsApp monitors
    logger.info('Starting WhatsApp monitors...');
    srinuMonitor = new SrinuMonitor(whatsappClient);
    await srinuMonitor.start();
    logger.info('✅ Srinu Monitor started');

    healthMonitor = new HealthMonitor(whatsappClient);
    await healthMonitor.start();
    logger.info('✅ Health Monitor started');

    powerMonitor = new PowerMonitor(whatsappClient);
    await powerMonitor.start();
    logger.info('✅ Power Monitor started');

    // Start Email monitor (required for this version)
    if (config.enableEmailMonitor) {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        try {
          logger.info('Starting Email monitor for incoming JDs...');
          emailMonitor = new EmailMonitor();
          await emailMonitor.start();
          logger.info('✅ Email monitor started - watching inbox for JDs');
        } catch (error: any) {
          logger.warn(`⚠️ Email monitor not started: ${error.message}`);
          logger.info('   Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to enable');
        }
      } else {
        logger.info('✋ Email monitor REQUIRES Gmail credentials');
        logger.info('   Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
        logger.info('   Then restart the application');
      }
    } else {
      logger.info('⏸️ Email monitor disabled (EMAIL_MONITOR_ENABLED=false)');
    }

    logger.info('='.repeat(80));
    logger.info('✅ Email-Only Resume Automation with WhatsApp Monitoring is running!');
    logger.info('='.repeat(80));
    logger.info('');
    logger.info('Available endpoints:');
    logger.info(`  GET  http://localhost:${config.mcpPort}/health`);
    logger.info(`  GET  http://localhost:${config.mcpPort}/tools`);
    logger.info(`  POST http://localhost:${config.mcpPort}/execute`);
    logger.info('');
    logger.info('📋 Approval Dashboard:');
    logger.info(`  🌐 http://localhost:${config.approvalPort}/approval`);
    logger.info(`  Review and approve resumes before sending to recruiters`);
    logger.info('');
    logger.info('Email Monitoring:');
    logger.info(`  📧 Monitoring Gmail inbox for job descriptions`);
    logger.info(`  🤖 AI classifies ALL emails (FREE with local AI)`);
    logger.info(`  ⏸️  Pauses for approval before emailing`);
    logger.info('');
    logger.info('WhatsApp Monitoring:');
    logger.info(`  📱 WhatsApp client connected and ready`);
    logger.info(`  👤 Srinu Monitor active - watching for JD messages`);
    logger.info(`  💚 Health Monitor - checking system status`);
    logger.info(`  🔋 Power Monitor - monitoring system power`);
    logger.info(`  🔄 Polling every 30 seconds for new messages`);
    logger.info('');
    logger.info('Example usage:');
    logger.info(`  curl http://localhost:${config.mcpPort}/tools`);
    logger.info(`  open http://localhost:${config.approvalPort}/approval`);
    logger.info('');
    logger.info('Press Ctrl+C to stop');
    logger.info('='.repeat(80));
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
