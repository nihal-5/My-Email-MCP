/**
 * 🏷️ UNIVERSAL EMAIL CLASSIFIER
 * 
 * Classifies ALL emails into categories using OpenAI GPT-3.5-turbo (Cost-effective!)
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

import OpenAI from 'openai';
import { getAIConfig } from '../utils/config.js';

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
  private openai: OpenAI;
  private aiConfig: ReturnType<typeof getAIConfig>;
  private useAI: boolean = true; // Set to false to use rule-based only

  constructor() {
    this.aiConfig = getAIConfig();
    this.openai = new OpenAI({
      apiKey: this.aiConfig.apiKey
    });
  }

  /**
   * Classify ANY email into categories
   * Uses GPT-3.5-turbo for AI classification (cost-effective)
   * Falls back to rule-based if AI fails
   */
  async classifyEmail(
    from: string,
    subject: string,
    content: string
  ): Promise<EmailClassification> {
    
    // Try AI classification first if enabled
    if (this.useAI) {
      try {
        return await this.classifyWithAI(from, subject, content);
      } catch (error: any) {
        console.warn('⚠️ AI classification failed, falling back to rule-based:', error.message);
        // Fall through to rule-based
      }
    }
    
    // Use rule-based classification as fallback or primary
    return this.enhancedRuleBasedClassification(from, subject, content);
  }

  /**
   * Classify email using OpenAI GPT-3.5-turbo
   */
  private async classifyWithAI(
    from: string,
    subject: string,
    content: string
  ): Promise<EmailClassification> {
    const emailSnippet = content.substring(0, 1000); // First 1000 chars for context
    
    const prompt = `Classify this email into one of these categories:
- job_opportunity: Job postings, recruitment emails
- newsletter: Newsletters, digests, subscriptions
- shopping_order: Order confirmations, shipping, receipts
- sales_marketing: Promotions, deals, marketing emails
- personal: Personal messages from individuals
- client_business: Business meetings, proposals, contracts
- report_analytics: Reports, dashboards, analytics
- spam: Spam, phishing, scams
- other: Everything else

Email From: ${from}
Subject: ${subject}
Content: ${emailSnippet}

Return ONLY valid JSON (no markdown):
{
  "category": "one of the categories above",
  "confidence": 0.0 to 1.0,
  "priority": "urgent|high|medium|low",
  "needsReply": true or false,
  "suggestedAction": "brief action suggestion or null"
}`;

    const model = this.aiConfig.emailClassificationModel;
    const completion = await this.openai.chat.completions.create({
      model: model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 200
    });

    const result = this.parseJSON(completion.choices[0].message.content || '{}');
    
    return {
      category: result.category || 'other',
      confidence: result.confidence || 0.8,
      sender: from,
      subject: subject,
      priority: result.priority || 'medium',
      needsReply: result.needsReply || false,
      suggestedAction: result.suggestedAction,
      timestamp: new Date().toISOString()
    };
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
  private cloudClassifications = 0;
  private totalCost = 0;

  trackCloud(cost: number) {
    this.cloudClassifications++;
    this.totalCost += cost;
  }

  getReport() {
    return {
      cloudClassifications: this.cloudClassifications,
      totalCost: this.totalCost,
      averageCostPerEmail: this.cloudClassifications > 0 ? this.totalCost / this.cloudClassifications : 0,
      monthlyProjection: this.totalCost * 30 // Project daily cost to monthly
    };
  }
}
