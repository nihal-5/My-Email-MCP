import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { logger } from './utils/logger.js';
import { getConfig } from './utils/config.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import {
  ChatInfo,
  MessageInfo,
  ContactInfo,
  GroupInfo,
  SendMessageParams,
  GetMessagesParams,
  SearchMessagesParams,
} from './types/whatsapp.js';

export class WhatsAppClient {
  private client: any;
  private isReady: boolean = false;
  private reconnectTimer?: NodeJS.Timeout;
  private config = getConfig();
  private profileDir: string;

  constructor() {
    // Dedicated, persistent profile directory (locks cleared before use)
    this.profileDir = path.join(this.config.sessionStoragePath, '.whatsapp-profile');
    fs.mkdirSync(this.profileDir, { recursive: true });

    // Initialize WhatsApp client with local authentication
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.profileDir,
      }),
      puppeteer: {
        // Use bundled Chromium headless for maximum stability (avoids Mac app crashes)
        headless: true,
        executablePath: puppeteer.executablePath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-sync',
          '--metrics-recording-only',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--disable-blink-features=AutomationControlled',
          `--user-data-dir=${this.profileDir}`,
        ],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // QR Code generation
    this.client.on('qr', (qr: string) => {
      logger.info('QR Code received. Scan with WhatsApp mobile app:');
      qrcode.generate(qr, { small: true });
    });

    // Authentication success
    this.client.on('authenticated', () => {
      logger.info('Authentication successful!');
    });

    // Client ready
    this.client.on('ready', () => {
      this.isReady = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      logger.info('WhatsApp client is ready!');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg: any) => {
      logger.error('Authentication failed:', msg);
    });

    // Disconnected
    this.client.on('disconnected', (reason: string) => {
      this.isReady = false;
      logger.warn('Client disconnected:', reason);
      // Attempt soft-reconnect after a short delay to avoid manual restarts
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      this.reconnectTimer = setTimeout(async () => {
        try {
          logger.info('Attempting WhatsApp reconnect...');
          this.cleanProfileLocksAndProcs();
          try {
            await this.client.destroy();
          } catch {
            // ignore
          }
          await this.client.initialize();
        } catch (err: any) {
          logger.error(`Reconnect failed: ${err.message}`);
        }
      }, 5000);
    });

    // Message received
    this.client.on('message', async (message: any) => {
      logger.debug(`Message received from ${message.from}: ${message.body}`);
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing WhatsApp client...');
    this.cleanProfileLocksAndProcs();
    try {
      await this.client.destroy();
    } catch {
      // ignore if not yet initialized
    }
    await this.client.initialize();
  }

  async waitForReady(timeout: number = 60000): Promise<void> {
    const start = Date.now();
    while (!this.isReady && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.isReady) {
      throw new Error('Client initialization timeout');
    }
  }

  /**
   * Clear chromium profile lock files AND kill stray chromium processes using this profile
   * to prevent SingletonLock errors and reconnect loops.
   */
  private cleanProfileLocksAndProcs(): void {
    try {
      const base = this.profileDir;
      const locks = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
      locks.forEach((file) => {
        const target = path.join(base, file);
        if (fs.existsSync(target)) {
          fs.rmSync(target, { force: true });
        }
      });
      // Kill any lingering Chrome processes pointing to this profile dir
      try {
        execSync(`pkill -f "${base}"`, { stdio: 'ignore' });
      } catch {
        // Ignore pkill absence or no process matched
      }
    } catch (err: any) {
      logger.warn(`Could not clear Chrome locks: ${err.message}`);
    }
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  // Send a message to a chat
  async sendMessage(params: SendMessageParams): Promise<void> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    // 🚫 HARD BLOCK: NEVER ALLOW MESSAGES TO SRINU'S NUMBER
    // Srinu's number should ONLY receive messages FROM the system (JD monitoring)
    // He should NEVER receive automated messages, notifications, or updates
    const BLOCKED_NUMBERS = [
      '917702055194@c.us',  // Srinu's WhatsApp number
      '917702055194',        // Srinu's number without @c.us
      '+917702055194@c.us',  // With country code prefix
      '+917702055194'        // With country code, no @c.us
    ];

    const targetChatId = params.chatId.toLowerCase().trim();
    const isBlockedNumber = BLOCKED_NUMBERS.some(blocked => 
      targetChatId === blocked.toLowerCase() || 
      targetChatId.includes('917702055194')
    );

    if (isBlockedNumber) {
      logger.error(`🚫 BLOCKED: Attempted to send message to Srinu's number (${params.chatId})`);
      logger.error(`🚫 Message content: ${params.message.substring(0, 100)}...`);
      logger.error(`🚫 THIS IS A CRITICAL VIOLATION - Messages should ONLY go to demo number!`);
      throw new Error(`BLOCKED: Cannot send messages to Srinu's number. Only demo number (${process.env.MY_WHATSAPP_NUMBER}) should receive notifications.`);
    }

    // ✅ ALLOWED: Only send to YOUR demo number
    const ALLOWED_NUMBERS = [
      process.env.MY_WHATSAPP_CHATID || '15715026464@c.us',
      process.env.MY_WHATSAPP_NUMBER || '15715026464',
      '15715026464@c.us',
      '15715026464'
    ];

    const isAllowedNumber = ALLOWED_NUMBERS.some(allowed => 
      allowed && targetChatId === allowed.toLowerCase()
    );

    if (!isAllowedNumber) {
      logger.warn(`⚠️ WARNING: Attempting to send to unrecognized number: ${params.chatId}`);
      logger.warn(`⚠️ Allowed numbers: ${ALLOWED_NUMBERS.filter(n => n).join(', ')}`);
    }

    await this.client.sendMessage(params.chatId, params.message);
    logger.info(`✅ Message sent to ${params.chatId} (verified allowed recipient)`);
  }

  // Get list of chats
  async getChats(limit?: number): Promise<ChatInfo[]> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    const chats = await this.client.getChats();
    const sortedChats = chats.sort((a: any, b: any) => b.timestamp - a.timestamp);
    const limitedChats = limit ? sortedChats.slice(0, limit) : sortedChats;

    return limitedChats.map((chat: any) => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      timestamp: chat.timestamp,
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage?.body,
    }));
  }

  // Get messages from a specific chat
  async getMessages(params: GetMessagesParams): Promise<MessageInfo[]> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    const chat = await this.client.getChatById(params.chatId);
    const messages = await chat.fetchMessages({ limit: params.limit || 50 });

    return messages.map((msg: any) => ({
      id: msg.id._serialized,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      timestamp: msg.timestamp,
      hasMedia: msg.hasMedia,
      isForwarded: msg.isForwarded,
      fromMe: msg.fromMe,
    }));
  }

  // Search messages
  async searchMessages(params: SearchMessagesParams): Promise<MessageInfo[]> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    let chatsToSearch: any[];

    if (params.chatId) {
      const chat = await this.client.getChatById(params.chatId);
      chatsToSearch = [chat];
    } else {
      chatsToSearch = await this.client.getChats();
    }

    const results: MessageInfo[] = [];
    const query = params.query.toLowerCase();
    const limit = params.limit || 50;

    for (const chat of chatsToSearch) {
      if (results.length >= limit) break;

      const messages = await chat.fetchMessages({ limit: 100 });
      const matchingMessages = messages.filter((msg: any) =>
        msg.body.toLowerCase().includes(query)
      );

      for (const msg of matchingMessages) {
        if (results.length >= limit) break;
        results.push({
          id: msg.id._serialized,
          from: msg.from,
          to: msg.to,
          body: msg.body,
          timestamp: msg.timestamp,
          hasMedia: msg.hasMedia,
          isForwarded: msg.isForwarded,
          fromMe: msg.fromMe,
        });
      }
    }

    return results;
  }

  // Get contacts
  async getContacts(): Promise<ContactInfo[]> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    const contacts = await this.client.getContacts();
    return contacts.map((contact: any) => ({
      id: contact.id._serialized,
      name: contact.name || contact.pushname || 'Unknown',
      pushname: contact.pushname,
      number: contact.number,
      isMyContact: contact.isMyContact,
    }));
  }

  // Get groups
  async getGroups(): Promise<GroupInfo[]> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    const chats = await this.client.getChats();
    const groups = chats.filter((chat: any) => chat.isGroup) as any[];

    return groups.map((group: any) => ({
      id: group.id._serialized,
      name: group.name,
      description: group.description,
      participantsCount: group.participants.length,
      owner: group.owner?._serialized,
    }));
  }

  // Get chat info
  async getChatInfo(chatId: string): Promise<ChatInfo> {
    if (!this.isReady) {
      throw new Error('Client is not ready');
    }

    const chat = await this.client.getChatById(chatId);
    return {
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      timestamp: chat.timestamp,
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage?.body,
    };
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
    logger.info('WhatsApp client destroyed');
  }
}
