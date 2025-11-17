/**
 * 🏷️ UNIVERSAL EMAIL CLASSIFIER
 * 
 * Classifies ALL emails into categories using GROQ API (FREE & FAST!)
 * Using llama-3.3-70b-versatile for better accuracy
 * 
 * Categories:
 * - job_opportunity
 * - newsletter
 * - shopping_order
 * - sales_marketing
 * - personal
 * - client_business
 * - report_analytics
 * - spam
 * - other
 */

import Groq from 'groq-sdk';

export interface EmailClassification {
  category: EmailCategory;
  confidence: number;
  subcategory?: string;
  sender: string;
  subject: string;
  priority: Priority;
  needsReply: boolean;
  suggestedAction?: string;
  timestamp: string;
}

export type EmailCategory = 
  | 'job_opportunity'
  | 'newsletter'
  | 'shopping_order'
  | 'sales_marketing'
  | 'personal'
  | 'client_business'
  | 'report_analytics'
  | 'spam'
  | 'other';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export class UniversalEmailClassifier {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  /**
   * Classify ANY email into categories (FAST rule-based classification!)
   */
  async classifyEmail(
    from: string,
    subject: string,
    content: string
  ): Promise<EmailClassification> {
    
    // Use enhanced rule-based classification directly (no LLM needed!)
    return this.enhancedRuleBasedClassification(from, subject, content);
  }

  /**
   * 🎯 SIMPLE & ACCURATE - Detect job position names in subject/heading
   */
  private enhancedRuleBasedClassification(from: string, subject: string, content: string): EmailClassification {
    const lower = (subject + ' ' + content.substring(0, 300)).toLowerCase(); // Subject + first 300 chars
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    let category: EmailCategory = 'other';
    let priority: Priority = 'medium';
    let confidence = 0.85;
    
    // ✅ JOB POSITION TITLES - If subject or heading contains these, it's likely a job
    const jobPositions = /\b(software engineer|data engineer|data scientist|ml engineer|ai engineer|machine learning engineer|devops engineer|backend engineer|frontend engineer|full stack engineer|fullstack engineer|web developer|mobile developer|ios developer|android developer|python developer|java developer|javascript developer|react developer|node developer|go developer|rust developer|c\+\+ developer|senior developer|junior developer|lead developer|principal engineer|staff engineer|engineering manager|technical lead|tech lead|product manager|project manager|program manager|scrum master|business analyst|data analyst|systems analyst|quality analyst|qa engineer|test engineer|sre|site reliability engineer|cloud engineer|security engineer|network engineer|database administrator|solutions architect|software architect|technical architect|systems architect)\b/i;
    
    // ✅ Common job titles (single words)
    const singleWordPositions = /\b(developer|engineer|analyst|scientist|architect|specialist|consultant|coordinator|administrator|technician|designer|researcher|strategist|manager|director|supervisor|lead|principal|staff)\b/i;
    
    // ❌ EXCLUSIONS - Not job postings even if they contain position names
    const excludedPhrases = /\b(oauth|access token|security alert|notification|birthday|wishes|friend suggestion|connection request|start a conversation|delivery status|unsubscribe|develop smarter|third-party|personal access|congratulations|welcome|thank you|reset password)\b/i;
    const excludedDomains = /@(github\.com|gitlab\.com|facebook|facebookmail|reddit|google\.com|jetbrains\.com|microsoft\.com|apple\.com|notifications|no-reply|no_reply|mailer-daemon|donotreply)\b/i;
    
    // STEP 1: Check exclusions first
    if (excludedPhrases.test(subjectLower) || excludedDomains.test(fromLower)) {
      category = 'other';
      confidence = 0.9;
    }
    // STEP 2: Check if subject or beginning of email has a job position name
    else if (jobPositions.test(subjectLower) || jobPositions.test(lower)) {
      category = 'job_opportunity';
      priority = 'high';
      confidence = 0.95;
    }
    // STEP 3: Check for single-word positions ONLY if also has job context
    else if (singleWordPositions.test(subjectLower) && 
             (lower.includes('job') || lower.includes('position') || lower.includes('role') || 
              lower.includes('hiring') || lower.includes('opportunity') || lower.includes('opening'))) {
      category = 'job_opportunity';
      priority = 'high';
      confidence = 0.9;
    }
    
    // Newsletter detection
    else if (lower.match(/\b(newsletter|digest|update|blog|weekly|daily|subscription|unsubscribe)\b/)) {
      category = 'newsletter';
      priority = 'low';
      confidence = 0.9;
    }
    
    // Shopping/Order detection
    else if (lower.match(/\b(order|shipped|shipping|delivery|receipt|invoice|payment|tracking|amazon|ebay|etsy)\b/)) {
      category = 'shopping_order';
      priority = 'medium';
      confidence = 0.9;
    }
    
    // Sales/Marketing detection
    else if (lower.match(/\b(sale|discount|offer|deal|promo|promotion|limited.?time|exclusive|save|coupon)\b/)) {
      category = 'sales_marketing';
      priority = 'low';
      confidence = 0.85;
    }
    
    // Personal email detection
    else if (lower.match(/\b(hi|hello|hey|dear|thanks|thank you|regards|cheers)\b/) && 
             !fromLower.match(/@(noreply|no-reply|donotreply|notifications?|support|info|hello|team)\./)) {
      category = 'personal';
      priority = 'medium';
      confidence = 0.75;
    }
    
    // Report/Analytics detection
    else if (lower.match(/\b(report|analytics|dashboard|metrics|statistics|summary|analysis|insights)\b/)) {
      category = 'report_analytics';
      priority = 'medium';
      confidence = 0.85;
    }
    
    // Spam detection
    else if (lower.match(/\b(winner|prize|click here|act now|urgent|verify account|suspended|confirm identity|congratulations)\b/) ||
             lower.match(/\b(viagra|cialis|casino|lottery|million dollars)\b/)) {
      category = 'spam';
      priority = 'low';
      confidence = 0.95;
    }
    
    // Client/Business detection (meetings, proposals, contracts)
    else if (lower.match(/\b(meeting|proposal|contract|agreement|invoice|client|project|deadline|followup|follow.?up)\b/)) {
      category = 'client_business';
      priority = 'high';
      confidence = 0.8;
    }

    return {
      category,
      confidence,
      sender: from,
      subject,
      priority,
      needsReply: ['job_opportunity', 'client_business', 'personal'].includes(category),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback classification (kept for compatibility)
   */
  private fallbackClassification(from: string, subject: string): EmailClassification {
    return this.enhancedRuleBasedClassification(from, subject, '');
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJSON(text: string): any {
    try {
      let cleaned = text.trim();
      cleaned = cleaned.replace(/```json\n?/g, '');
      cleaned = cleaned.replace(/```\n?/g, '');
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON:', text);
      return {};
    }
  }
}

/**
 * 💾 EMAIL DATABASE
 * 
 * Stores ALL classified emails for later retrieval
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export class EmailDatabase {
  private dbPath: string;
  private emails: Map<string, EmailClassification> = new Map();
  private ready: Promise<void>;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'email-classifications.json');
    this.ready = this.loadDatabase();
  }

  /**
   * Load existing classifications from disk
   */
  private async loadDatabase() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.emails = new Map(Object.entries(parsed));
      console.log(`📊 Loaded ${this.emails.size} classified emails`);
    } catch (error) {
      console.log('📊 Starting fresh email database');
    }
  }

  /**
   * Wait until the database is loaded
   */
  async waitUntilReady(): Promise<void> {
    await this.ready;
  }

  /**
   * Save classification to database
   */
  async saveClassification(emailId: string, classification: EmailClassification) {
    await this.ready;
    this.emails.set(emailId, classification);
    await this.persist();
  }

  /**
   * Check if an email has already been stored
   */
  async hasEmail(emailId: string): Promise<boolean> {
    await this.ready;
    return this.emails.has(emailId);
  }

  /**
   * Get all emails by category
   */
  async getByCategory(category: EmailCategory): Promise<EmailClassification[]> {
    await this.ready;
    return Array.from(this.emails.values())
      .filter(email => email.category === category);
  }

  /**
   * Get stats
   */
  async getStats() {
    await this.ready;
    const categories: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    
    for (const email of this.emails.values()) {
      categories[email.category] = (categories[email.category] || 0) + 1;
      priorities[email.priority] = (priorities[email.priority] || 0) + 1;
    }

    return {
      total: this.emails.size,
      categories,
      priorities,
      needsReply: Array.from(this.emails.values()).filter(e => e.needsReply).length
    };
  }

  /**
   * Persist to disk
   */
  private async persist() {
    try {
      const data = JSON.stringify(Object.fromEntries(this.emails), null, 2);
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      await fs.writeFile(this.dbPath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to persist database:', error);
    }
  }
}

/**
 * 💰 COST TRACKING
 */

export class CostTracker {
  private localClassifications = 0;
  private cloudClassifications = 0;

  trackLocal() {
    this.localClassifications++;
  }

  trackCloud(cost: number) {
    this.cloudClassifications++;
  }

  getReport() {
    const saved = this.localClassifications * 0.10; // $0.10 per classification if using GPT-5
    
    return {
      localClassifications: this.localClassifications,
      cloudClassifications: this.cloudClassifications,
      costSaved: saved,
      monthlyProjection: (saved / this.localClassifications) * 3000 // 100 emails/day
    };
  }
}
