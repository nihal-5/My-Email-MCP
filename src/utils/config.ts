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
    enableEmailMonitor: process.env.EMAIL_MONITOR_ENABLED !== 'false'
  };
}

/**
 * AI Model Configuration
 * All models use OpenAI API - configured via environment variables
 */
export function getAIConfig() {
  return {
    // Email classification - use cheaper model to save costs
    emailClassificationModel: process.env.OPENAI_EMAIL_CLASSIFICATION_MODEL || 'gpt-3.5-turbo',
    emailClassificationFallbackModel: process.env.OPENAI_EMAIL_CLASSIFICATION_FALLBACK_MODEL || 'gpt-4o-mini',
    
    // Resume generation - use advanced model for quality
    resumeGenerationModel: process.env.OPENAI_RESUME_GENERATION_MODEL || 'gpt-5',
    
    // Email generation - use advanced model for quality
    emailGenerationModel: process.env.OPENAI_EMAIL_GENERATION_MODEL || 'gpt-5',
    
    // JD analysis - use advanced model for quality
    jdAnalysisModel: process.env.OPENAI_JD_ANALYSIS_MODEL || 'gpt-5',
    
    // API Key - must be set
    apiKey: process.env.OPENAI_API_KEY || (() => {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    })(),
  };
}
