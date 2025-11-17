/**
 * Authentication Manager
 * Handles user login, registration, and session management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'subscriber';
  status: 'active' | 'suspended';
  subscription: {
    plan: 'free' | 'basic' | 'pro';
    startDate: number;
    endDate: number | null;
  };
  settings: {
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    whatsappNumber?: string;
    recruiterChatId?: string;
  };
  createdAt: number;
  lastLogin: number | null;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

const USERS_FILE = './data/users.json';
const SESSIONS_FILE = './data/sessions.json';

export class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();

  async initialize() {
    await this.loadUsers();
    await this.loadSessions();
    await this.createAdminIfNotExists();
  }

  private async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      const users = JSON.parse(data);
      this.users = new Map(Object.entries(users));
    } catch (error) {
      this.users = new Map();
    }
  }

  private async saveUsers() {
    const usersObj = Object.fromEntries(this.users);
    await fs.writeFile(USERS_FILE, JSON.stringify(usersObj, null, 2));
  }

  private async loadSessions() {
    try {
      const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
      const sessions = JSON.parse(data);
      this.sessions = new Map(Object.entries(sessions));
    } catch (error) {
      this.sessions = new Map();
    }
  }

  private async saveSessions() {
    const sessionsObj = Object.fromEntries(this.sessions);
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessionsObj, null, 2));
  }

  private async createAdminIfNotExists() {
    // Check if admin exists
    const adminExists = Array.from(this.users.values()).some(u => u.role === 'admin');

    if (!adminExists) {
      // Create default admin
      const adminId = this.generateId();
      const admin: User = {
        id: adminId,
        username: 'admin',
        email: 'admin@localhost',
        passwordHash: this.hashPassword('admin123'),
        role: 'admin',
        status: 'active',
        subscription: {
          plan: 'pro',
          startDate: Date.now(),
          endDate: null
        },
        settings: {
          smtpUser: process.env.SMTP_USER || '',
          smtpPass: process.env.SMTP_PASS || '',
          fromEmail: process.env.FROM_EMAIL || ''
        },
        createdAt: Date.now(),
        lastLogin: null
      };

      this.users.set(adminId, admin);
      await this.saveUsers();

      console.log('');
      console.log('⚠️  DEFAULT ADMIN CREATED');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   CHANGE THIS PASSWORD IMMEDIATELY!');
      console.log('');
    }
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
    const user = Array.from(this.users.values()).find(u => u.username === username);

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (user.status !== 'active') {
      return { success: false, error: 'Account is suspended' };
    }

    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Create session
    const token = this.generateToken();
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.sessions.set(token, session);
    await this.saveSessions();

    // Update last login
    user.lastLogin = Date.now();
    this.users.set(user.id, user);
    await this.saveUsers();

    return { success: true, token, user };
  }

  async validateSession(token: string): Promise<User | null> {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      await this.saveSessions();
      return null;
    }

    const user = this.users.get(session.userId);
    return user || null;
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
    await this.saveSessions();
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'subscriber';
    plan: 'free' | 'basic' | 'pro';
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    // Check if username exists
    const exists = Array.from(this.users.values()).some(u => u.username === data.username);
    if (exists) {
      return { success: false, error: 'Username already exists' };
    }

    const userId = this.generateId();
    const user: User = {
      id: userId,
      username: data.username,
      email: data.email,
      passwordHash: this.hashPassword(data.password),
      role: data.role,
      status: 'active',
      subscription: {
        plan: data.plan,
        startDate: Date.now(),
        endDate: data.plan === 'free' ? null : Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days for paid plans
      },
      settings: {
        smtpUser: data.smtpUser,
        smtpPass: data.smtpPass,
        fromEmail: data.fromEmail
      },
      createdAt: Date.now(),
      lastLogin: null
    };

    this.users.set(userId, user);
    await this.saveUsers();

    // Create user's data directory
    const userDataDir = path.join('./data/users', userId);
    await fs.mkdir(userDataDir, { recursive: true });
    await fs.writeFile(path.join(userDataDir, 'approval-queue.json'), '[]');

    return { success: true, user };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    Object.assign(user, updates);
    this.users.set(userId, user);
    await this.saveUsers();

    return { success: true };
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'admin') {
      // Don't allow deleting the last admin
      const admins = Array.from(this.users.values()).filter(u => u.role === 'admin');
      if (admins.length === 1) {
        return { success: false, error: 'Cannot delete the last admin' };
      }
    }

    this.users.delete(userId);
    await this.saveUsers();

    return { success: true };
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async changePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.passwordHash = this.hashPassword(newPassword);
    this.users.set(userId, user);
    await this.saveUsers();

    return { success: true };
  }
}

export const authManager = new AuthManager();
