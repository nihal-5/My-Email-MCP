import { WhatsAppClient } from '../whatsapp-client.js';
import { logger } from '../utils/logger.js';
import {
  parseJD,
  tailorResume,
  validateResume,
  renderAndEmail,
  generatePersonalizedEmail
} from '../resume-tools/index.js';
import { submitForApproval } from '../approval-integration.js';

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (client: WhatsAppClient, params: any) => Promise<any>;
}

export const tools: Tool[] = [
  {
    name: 'send_message',
    description: 'Send a text message to a WhatsApp contact or group',
    parameters: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'Chat ID (e.g., phone number with country code + @c.us for contacts, or group ID)',
        },
        message: {
          type: 'string',
          description: 'Message text to send',
        },
      },
      required: ['chatId', 'message'],
    },
    handler: async (client, params) => {
      await client.sendMessage(params);
      return { success: true, message: 'Message sent successfully' };
    },
  },
  {
    name: 'get_chats',
    description: 'Get list of recent chats (conversations)',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of chats to return (default: all)',
        },
      },
    },
    handler: async (client, params) => {
      const chats = await client.getChats(params?.limit);
      return { chats };
    },
  },
  {
    name: 'get_messages',
    description: 'Get messages from a specific chat',
    parameters: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'Chat ID to retrieve messages from',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return (default: 50)',
        },
      },
      required: ['chatId'],
    },
    handler: async (client, params) => {
      const messages = await client.getMessages(params);
      return { messages };
    },
  },
  {
    name: 'search_messages',
    description: 'Search for messages containing specific text',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        chatId: {
          type: 'string',
          description: 'Optional: limit search to specific chat',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
      },
      required: ['query'],
    },
    handler: async (client, params) => {
      const messages = await client.searchMessages(params);
      return { messages };
    },
  },
  {
    name: 'get_contacts',
    description: 'Get list of all contacts',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async (client, params) => {
      const contacts = await client.getContacts();
      return { contacts };
    },
  },
  {
    name: 'get_groups',
    description: 'Get list of all group chats',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async (client, params) => {
      const groups = await client.getGroups();
      return { groups };
    },
  },
  {
    name: 'get_chat_info',
    description: 'Get detailed information about a specific chat',
    parameters: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description: 'Chat ID to get information for',
        },
      },
      required: ['chatId'],
    },
    handler: async (client, params) => {
      const chatInfo = await client.getChatInfo(params.chatId);
      return { chatInfo };
    },
  },
  // Resume Automation Tools
  {
    name: 'parse_jd',
    description: 'Parse job description to extract role, cloud focus, location, and recruiter info',
    parameters: {
      type: 'object',
      properties: {
        jd: {
          type: 'string',
          description: 'Full job description text',
        },
      },
      required: ['jd'],
    },
    handler: async (client, params) => {
      const parsed = parseJD(params.jd);  // Sync regex parsing for orchestrator
      return parsed;
    },
  },
  {
    name: 'tailor_resume',
    description: 'Generate tailored LaTeX resume with cloud-specific substitutions',
    parameters: {
      type: 'object',
      properties: {
        cloud: {
          type: 'string',
          enum: ['azure', 'aws', 'gcp'],
          description: 'Cloud platform focus',
        },
        role: {
          type: 'string',
          description: 'Job role/title',
        },
        location: {
          type: 'string',
          description: 'Job location',
        },
      },
      required: ['cloud', 'role'],
    },
    handler: async (client, params) => {
      const latex = tailorResume(params);
      return { latex };
    },
  },
  {
    name: 'validate_resume',
    description: 'Validate resume LaTeX against strict formatting rules',
    parameters: {
      type: 'object',
      properties: {
        latex: {
          type: 'string',
          description: 'LaTeX resume content',
        },
        cloud: {
          type: 'string',
          enum: ['azure', 'aws', 'gcp'],
          description: 'Expected cloud platform',
        },
      },
      required: ['latex', 'cloud'],
    },
    handler: async (client, params) => {
      const validation = validateResume(params.latex, params.cloud);
      return validation;
    },
  },
  {
    name: 'generate_personalized_email',
    description: 'Generate AI-powered personalized email subject and body for job application',
    parameters: {
      type: 'object',
      properties: {
        candidateInfo: {
          type: 'object',
          description: 'Candidate information',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            title: { type: 'string' }
          },
          required: ['name', 'email', 'phone', 'title']
        },
        jdAnalysis: {
          type: 'object',
          description: 'Parsed JD analysis',
          properties: {
            title: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            technologies: { type: 'array', items: { type: 'string' } },
            requirements: { type: 'array', items: { type: 'string' } }
          }
        },
        originalJD: {
          type: 'string',
          description: 'Original job description text'
        }
      },
      required: ['candidateInfo', 'jdAnalysis', 'originalJD'],
    },
    handler: async (client, params) => {
      const result = await generatePersonalizedEmail(
        params.candidateInfo,
        params.jdAnalysis,
        params.originalJD
      );
      return result;
    },
  },
  {
    name: 'render_and_email',
    description: 'Compile LaTeX to PDF and email to recruiter with attachment',
    parameters: {
      type: 'object',
      properties: {
        latex: {
          type: 'string',
          description: 'LaTeX resume content',
        },
        to: {
          type: 'string',
          description: 'Recruiter email address',
        },
        cc: {
          type: 'string',
          description: 'CC email address (optional)',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        body: {
          type: 'string',
          description: 'Email body text',
        },
        filenameBase: {
          type: 'string',
          description: 'Base filename for PDF (default: Nihal_Veeramalla_Resume)',
        },
      },
      required: ['latex', 'to', 'subject', 'body'],
    },
    handler: async (client, params) => {
      const result = await renderAndEmail(params);
      return result;
    },
  },
  {
    name: 'submit_for_approval',
    description: 'Submit resume for manual approval before sending to recruiter',
    parameters: {
      type: 'object',
      properties: {
        jd: {
          type: 'string',
          description: 'Original job description text',
        },
        source: {
          type: 'string',
          description: 'Source of the JD: email, whatsapp, or manual',
        },
        parsedData: {
          type: 'object',
          description: 'Parsed JD data (role, cloud, location, recruiter)',
        },
        latex: {
          type: 'string',
          description: 'LaTeX resume content',
        },
        validation: {
          type: 'object',
          description: 'Validation result',
        },
        emailSubject: {
          type: 'string',
          description: 'Email subject line',
        },
        emailBody: {
          type: 'string',
          description: 'Email body text',
        },
        srinuChatId: {
          type: 'string',
          description: 'Srinu WhatsApp chat ID for notifications',
        },
      },
      required: ['jd', 'parsedData', 'latex', 'validation', 'emailSubject', 'emailBody'],
    },
    handler: async (client, params) => {
      const result = await submitForApproval(params);
      return result;
    },
  },
];

export async function executeTool(
  client: WhatsAppClient,
  toolName: string,
  params: any
): Promise<any> {
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  logger.info(`Executing tool: ${toolName}`, params);

  try {
    const result = await tool.handler(client, params);
    logger.info(`Tool ${toolName} executed successfully`);
    return result;
  } catch (error) {
    logger.error(`Tool ${toolName} failed:`, error);
    throw error;
  }
}
