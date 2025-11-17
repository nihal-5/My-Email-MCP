/**
 * WhatsApp MCP Types
 */

export interface WhatsAppConfig {
  mcpPort: number;
  approvalPort: number;
  sessionStoragePath: string;
  autoLogin: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ChatInfo {
  id: string;
  name: string;
  isGroup: boolean;
  timestamp: number;
  unreadCount: number;
  lastMessage?: string;
}

export interface MessageInfo {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  isForwarded: boolean;
  fromMe: boolean;
}

export interface ContactInfo {
  id: string;
  name: string;
  pushname: string;
  number: string;
  isMyContact: boolean;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  participantsCount: number;
  owner?: string;
}

export interface SendMessageParams {
  chatId: string;
  message: string;
}

export interface GetMessagesParams {
  chatId: string;
  limit?: number;
}

export interface SearchMessagesParams {
  query: string;
  chatId?: string;
  limit?: number;
}
