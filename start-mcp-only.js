#!/usr/bin/env node
/**
 * Start MCP Server Only (without WhatsApp, with Dashboard)
 * For testing - provides both port 3000 (MCP) and port 3001 (Dashboard)
 */

import 'dotenv/config';
import { MCPServer } from './dist/mcp-server.js';
import { ApprovalServer } from './dist/approval-server.js';
import { logger } from './dist/utils/logger.js';

async function main() {
  logger.info('='.repeat(80));
  logger.info('🚀 Starting MCP + Dashboard (No WhatsApp)');
  logger.info('='.repeat(80));
  
  // Start MCP Server on port 3000
  const mcpServer = new MCPServer(3000);
  await mcpServer.start();
  logger.info('✅ MCP Server running on port 3000');
  
  // Start Dashboard on port 3001
  const approvalServer = new ApprovalServer(3001);
  await approvalServer.start();
  logger.info('✅ Dashboard running on port 3001');
  
  logger.info('='.repeat(80));
  logger.info('✅ Ready to process JDs!');
  logger.info('🌐 Dashboard: http://localhost:3001/approval');
  logger.info('='.repeat(80));
}

main().catch(err => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
