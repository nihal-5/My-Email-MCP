import { config as dotenvConfig } from 'dotenv';
import { WhatsAppConfig } from '../types/whatsapp.js';

// Load environment variables
dotenvConfig();

export function getConfig(): WhatsAppConfig {
  return {
    mcpPort: parseInt(process.env.MCP_PORT || '3000', 10),
    approvalPort: parseInt(process.env.APPROVAL_PORT || '3001', 10),
    sessionStoragePath: process.env.SESSION_STORAGE_PATH || './data',
    autoLogin: process.env.AUTO_LOGIN !== 'false',
    logLevel: (process.env.LOG_LEVEL as WhatsAppConfig['logLevel']) || 'info',
  };
}
