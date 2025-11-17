/**
 * Approval Dashboard Server
 * Web interface for reviewing and approving resumes before sending to recruiters
 */

import http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './utils/logger.js';
import { getConfig } from './utils/config.js';
import { renderAndEmail, renderPDF, aiCustomizeApplication } from './resume-tools/index.js';
import { WhatsAppClient } from './whatsapp-client.js';
import { parseJD, parseJDWithAI } from './resume-tools/parsers/jd-parser.js';
import { tailorResume } from './resume-tools/parsers/resume-tailor.js';
import { validateResume } from './resume-tools/validators/resume-validator.js';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

export interface PendingApproval {
  id: string;
  timestamp: number;
  jd: string;
  source?: 'email' | 'whatsapp' | 'manual';  // Track where JD came from
  parsedData: {
    role: string;
    cloud: string;
    location: string;
    recruiterEmail: string;
    recruiterName?: string;
  };
  latex: string;
  pdfPath: string;
  texPath: string;
  emailSubject: string;
  emailBody: string;
  validation: {
    ok: boolean;
    errors: string[];
  };
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  myNotificationChatId?: string;  // YOUR WhatsApp number for receiving notifications (NEVER send to Srinu!)
}

export class ApprovalServer {
  private server: http.Server;
  private config = getConfig();
  private approvalQueuePath: string;
  private whatsappClient?: WhatsAppClient;

  constructor(whatsappClient?: WhatsAppClient) {
    this.whatsappClient = whatsappClient;
    this.approvalQueuePath = path.join(process.cwd(), 'data', 'approval-queue.json');
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // GET /approval - Dashboard UI
    if (req.method === 'GET' && req.url === '/approval') {
      await this.serveDashboard(req, res);
      return;
    }

    // GET /approval/api/pending - Get all pending approvals
    if (req.method === 'GET' && req.url === '/approval/api/pending') {
      await this.getPendingApprovals(req, res);
      return;
    }

    // GET /approval/api/inbox - Get all classified emails
    if (req.method === 'GET' && req.url === '/approval/api/inbox') {
      await this.getEmailInbox(req, res);
      return;
    }

    // GET /approval/api/inbox/stats - Get inbox statistics
    if (req.method === 'GET' && req.url === '/approval/api/inbox/stats') {
      await this.getInboxStats(req, res);
      return;
    }

    // GET /approval/api/submission/:id - Get specific submission
    if (req.method === 'GET' && req.url?.startsWith('/approval/api/submission/')) {
      const id = req.url.split('/').pop();
      await this.getSubmission(id!, req, res);
      return;
    }

    // POST /approval/api/approve/:id - Approve and send
    if (req.method === 'POST' && req.url?.startsWith('/approval/api/approve/')) {
      const id = req.url.split('/').pop();
      await this.approveSubmission(id!, req, res);
      return;
    }

    // POST /approval/api/reject/:id - Reject
    if (req.method === 'POST' && req.url?.startsWith('/approval/api/reject/')) {
      const id = req.url.split('/').pop();
      await this.rejectSubmission(id!, req, res);
      return;
    }

    // POST /approval/api/request-changes/:id - Request changes
    if (req.method === 'POST' && req.url?.startsWith('/approval/api/request-changes/')) {
      const id = req.url.split('/').pop();
      await this.requestChanges(id!, req, res);
      return;
    }

    // DELETE /approval/api/delete/:id - Delete submission
    if (req.method === 'DELETE' && req.url?.startsWith('/approval/api/delete/')) {
      const id = req.url.split('/').pop();
      await this.deleteSubmission(id!, req, res);
      return;
    }

    // DELETE /approval/api/delete-all - Delete all submissions
    if (req.method === 'DELETE' && req.url === '/approval/api/delete-all') {
      await this.deleteAllSubmissions(req, res);
      return;
    }

    // POST /approval/api/manual-submit - Manually submit JD
    if (req.method === 'POST' && req.url === '/approval/api/manual-submit') {
      await this.manualSubmit(req, res);
      return;
    }

    // POST /approval/api/regenerate-email - Regenerate email with AI
    if (req.method === 'POST' && req.url === '/approval/api/regenerate-email') {
      await this.regenerateEmail(req, res);
      return;
    }

    // POST /approval/api/send-now/:id - One-click send with auto-attach
    if (req.method === 'POST' && req.url?.startsWith('/approval/api/send-now/')) {
      const id = req.url.split('/').pop();
      await this.sendNowOneClick(id!, req, res);
      return;
    }

    // POST /approval/api/ai-fix-resend/:id - AI analyze and improve email
    if (req.method === 'POST' && req.url?.startsWith('/approval/api/ai-fix-resend/')) {
      const id = req.url.split('/').pop();
      await this.aiFixAndResend(id!, req, res);
      return;
    }

    // GET /approval/pdf/:id - View PDF
    if (req.method === 'GET' && req.url?.startsWith('/approval/pdf/')) {
      const id = req.url.split('/').pop();
      await this.servePDF(id!, req, res);
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  private async serveDashboard(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const html = await this.generateDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private async generateDashboardHTML(): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Approval Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            color: #333;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .main-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .left-panel {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .right-panel {
            width: 600px;
            background: white;
            border-left: 2px solid #e0e0e0;
            overflow-y: auto;
            padding: 20px;
        }
        .right-panel.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            text-align: center;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-card h3 { color: #666; font-size: 12px; margin-bottom: 8px; }
        .stat-card .number { font-size: 28px; font-weight: bold; color: #667eea; }
        
        .manual-jd-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .manual-jd-section h2 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #667eea;
        }
        .manual-jd-section textarea {
            width: 100%;
            min-height: 150px;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        .manual-jd-section textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .manual-jd-section .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 12px;
        }
        .manual-jd-section .btn-primary {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
        }
        .manual-jd-section .btn-secondary {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .submissions {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .submissions-header {
            background: #f9f9f9;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .submissions-header h2 { font-size: 18px; }
        .submission-card {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            transition: all 0.2s;
            cursor: pointer;
            position: relative;
        }
        .submission-card:hover { background: #f9f9f9; }
        .submission-card.active { background: #e3f2fd; border-left: 4px solid #667eea; }
        .submission-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
        }
        .submission-title h3 { font-size: 16px; margin-bottom: 5px; }
        .submission-meta { color: #666; font-size: 13px; display: flex; flex-wrap: wrap; gap: 8px; }
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge.pending { background: #fff3cd; color: #856404; }
        .badge.approved { background: #d4edda; color: #155724; }
        .badge.rejected { background: #f8d7da; color: #721c24; }
        .badge.azure { background: #e3f2fd; color: #0d47a1; }
        .badge.aws { background: #fff3e0; color: #e65100; }
        .badge.gcp { background: #e8f5e9; color: #1b5e20; }
        .badge.email { background: #e8eaf6; color: #3f51b5; }
        .badge.whatsapp { background: #e0f2f1; color: #00695c; }
        .badge.manual { background: #f3e5f5; color: #6a1b9a; }
        .submission-details {
            margin: 12px 0;
            padding: 12px;
            background: #f9f9f9;
            border-radius: 5px;
            font-size: 13px;
        }
        .submission-details p { margin: 4px 0; }
        .actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
        .btn-approve { background: #28a745; color: white; }
        .btn-reject { background: #dc3545; color: white; }
        .btn-delete { background: #6c757d; color: white; }
        .btn-delete-all { background: #dc3545; color: white; }
        .btn-view-pdf { background: #007bff; color: white; }
        .btn-preview { background: #17a2b8; color: white; }
        .btn-ai-fix { background: #f39c12; color: white; font-weight: 600; }
        .btn-ai-fix:hover { background: #e67e22; }
        .btn-send-now { 
            background: #28a745; 
            color: white; 
            font-weight: 700;
            font-size: 1.05em;
            border: 2px solid #20c997;
        }
        .btn-send-now:hover { 
            background: #20c997; 
            border-color: #28a745;
        }
        
        /* Email Preview Modal */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal.show { display: flex; align-items: center; justify-content: center; }
        .modal-content {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h2 { font-size: 20px; margin: 0; }
        .modal-close {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            line-height: 1;
        }
        .modal-close:hover { color: #333; }
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        .email-field {
            margin-bottom: 15px;
        }
        .email-field label {
            display: block;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        .email-field input,
        .email-field textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: inherit;
            font-size: 14px;
        }
        .email-field textarea {
            min-height: 300px;
            font-family: monospace;
            resize: vertical;
        }
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .modal-footer .btn {
            padding: 10px 20px;
        }
        
        .jd-panel {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
        }
        .jd-panel h3 { font-size: 14px; margin-bottom: 10px; color: #333; }
        .jd-content {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            color: #555;
            max-height: 600px;
            overflow-y: auto;
            background: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Resume Approval Dashboard</h1>
        <p>Review and approve resumes before sending to recruiters • View all classified emails</p>
        
        <!-- Navigation Tabs -->
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button onclick="switchTab('approvals')" id="tab-approvals" style="background: rgba(255,255,255,0.3); color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: 600;">
                📋 Job Approvals
            </button>
            <button onclick="switchTab('inbox')" id="tab-inbox" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: 600;">
                📬 Email Inbox
            </button>
        </div>
    </div>

    <div class="main-container">
        <!-- APPROVALS TAB -->
        <div class="left-panel" id="approvals-panel">
            <div class="stats">
                <div class="stat-card">
                    <h3>Pending</h3>
                    <div class="number" id="stat-pending">0</div>
                </div>
                <div class="stat-card">
                    <h3>Approved</h3>
                    <div class="number" id="stat-approved">0</div>
                </div>
                <div class="stat-card">
                    <h3>Total</h3>
                    <div class="number" id="stat-total">0</div>
                </div>
            </div>

            <div class="manual-jd-section">
                <h2>🤖 Manual Job Application</h2>
                <p style="color: #666; font-size: 13px; margin-bottom: 12px;">Paste a job description below to generate a customized resume</p>
                <textarea id="manual-jd-input" placeholder="Paste the full job description here..."></textarea>
                <div class="btn-group">
                    <button class="btn-primary" onclick="submitManualJD()">🚀 Process Job & Generate Resume</button>
                    <button class="btn-secondary" onclick="clearManualInput()">Clear</button>
                </div>
                <div id="manual-submit-status" style="margin-top: 10px;"></div>
            </div>

            <div class="submissions">
                <div class="submissions-header">
                    <h2>Pending Approvals</h2>
                    <button class="btn btn-delete-all" onclick="deleteAllCards()" id="delete-all-btn" style="display: none;">
                        🗑️ Delete All
                    </button>
                </div>
                <div id="submissions-list">
                    <div class="empty-state">
                        <h3>No pending approvals</h3>
                        <p>Submissions will appear here when JDs are processed</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- INBOX TAB -->
        <div class="left-panel" id="inbox-panel" style="display: none;">
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Emails</h3>
                    <div class="number" id="inbox-stat-total">0</div>
                </div>
                <div class="stat-card">
                    <h3>Today</h3>
                    <div class="number" id="inbox-stat-today">0</div>
                </div>
                <div class="stat-card">
                    <h3>Need Reply</h3>
                    <div class="number" id="inbox-stat-reply">0</div>
                </div>
            </div>

            <div class="manual-jd-section">
                <h2>📊 Email Categories</h2>
                <div id="inbox-categories" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
                    <!-- Categories will be dynamically populated -->
                </div>
            </div>

            <div class="submissions">
                <div class="submissions-header">
                    <h2>📬 All Classified Emails</h2>
                    <select id="category-filter" onchange="filterInbox()" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                        <option value="all">All Categories</option>
                        <option value="job_opportunity">🎯 Job Opportunities</option>
                        <option value="newsletter">📰 Newsletters</option>
                        <option value="shopping_order">🛒 Shopping</option>
                        <option value="sales_marketing">💼 Sales/Marketing</option>
                        <option value="personal">👤 Personal</option>
                        <option value="client_business">💼 Client/Business</option>
                        <option value="report_analytics">📊 Reports</option>
                        <option value="spam">🚫 Spam</option>
                        <option value="other">📁 Other</option>
                    </select>
                </div>
                <div id="inbox-list">
                    <div class="empty-state">
                        <h3>No classified emails yet</h3>
                        <p>Emails will appear here when classified by local AI</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="right-panel empty" id="right-panel">
            <div>
                <p style="font-size: 48px; margin-bottom: 10px;">📄</p>
                <p><strong>No card selected</strong></p>
                <p style="margin-top: 8px; font-size: 13px;">Click on any card to view<br>the original job posting</p>
            </div>
        </div>
    </div>

    <!-- Email Preview Modal -->
    <div id="email-preview-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>📧 Preview & Edit Email</h2>
                <button class="modal-close" onclick="closeEmailPreview()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="email-field">
                    <label>To:</label>
                    <input type="email" id="email-to" placeholder="recruiter@company.com" />
                </div>
                <div class="email-field">
                    <label>CC:</label>
                    <input type="email" id="email-cc" placeholder="cc@company.com (optional)" />
                </div>
                <div class="email-field">
                    <label>Subject:</label>
                    <input type="text" id="email-subject" placeholder="Application for [Role]" />
                </div>
                <div class="email-field">
                    <label>Body:</label>
                    <textarea id="email-body" placeholder="Email body..."></textarea>
                </div>
                <div class="email-field" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                    <label>🤖 Regenerate Email with AI Comments:</label>
                    <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                        Add instructions to regenerate the email (e.g., "make it more formal", "add my GitHub link", "emphasize Kubernetes experience")
                    </p>
                    <textarea id="email-regenerate-comments" placeholder="Add your instructions here..." style="min-height: 80px;"></textarea>
                    <button class="btn btn-preview" onclick="regenerateEmail()" style="margin-top: 10px; width: 100%;">
                        🔄 Regenerate Email with Comments
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeEmailPreview()">Cancel</button>
                <button class="btn btn-approve" onclick="sendEditedEmail()">✅ Send Email</button>
            </div>
        </div>
    </div>

    <script>
        let activeCardId = null;
        let allSubmissions = [];
        let allEmails = [];
        let currentTab = 'approvals';

        // Tab switching
        function switchTab(tab) {
            currentTab = tab;
            
            // Update tab buttons
            document.getElementById('tab-approvals').style.background = 
                tab === 'approvals' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
            document.getElementById('tab-inbox').style.background = 
                tab === 'inbox' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
            
            // Show/hide panels
            document.getElementById('approvals-panel').style.display = 
                tab === 'approvals' ? 'block' : 'none';
            document.getElementById('inbox-panel').style.display = 
                tab === 'inbox' ? 'block' : 'none';
            
            // Load data for the active tab
            if (tab === 'inbox') {
                loadInbox();
            } else {
                loadSubmissions();
            }
        }

        async function loadSubmissions() {
            try {
                const res = await fetch('/approval/api/pending');
                const data = await res.json();
                allSubmissions = data.submissions;

                updateStats(allSubmissions);
                renderSubmissions(allSubmissions);
            } catch (error) {
                console.error('Error loading submissions:', error);
            }
        }

        async function loadInbox() {
            try {
                // Load emails
                const emailRes = await fetch('/approval/api/inbox');
                const emailData = await emailRes.json();
                allEmails = emailData.emails || [];

                // Load stats
                const statsRes = await fetch('/approval/api/inbox/stats');
                const stats = await statsRes.json();

                updateInboxStats(stats);
                updateInboxCategories(stats.byCategory);
                renderInbox(allEmails);
            } catch (error) {
                console.error('Error loading inbox:', error);
            }
        }

        function updateInboxStats(stats) {
            document.getElementById('inbox-stat-total').textContent = stats.total || 0;
            document.getElementById('inbox-stat-today').textContent = stats.today || 0;
            document.getElementById('inbox-stat-reply').textContent = stats.needsReply || 0;
        }

        function updateInboxCategories(byCategory) {
            const container = document.getElementById('inbox-categories');
            const categoryIcons = {
                job_opportunity: '🎯',
                newsletter: '📰',
                shopping_order: '🛒',
                sales_marketing: '💼',
                personal: '👤',
                client_business: '💼',
                report_analytics: '📊',
                spam: '🚫',
                other: '📁'
            };
            
            const html = Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => \`
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; cursor: pointer;" onclick="filterInboxByCategory('\${cat}')">
                        <div style="font-size: 24px;">\${categoryIcons[cat] || '📁'}</div>
                        <div style="font-weight: 600; font-size: 18px; margin-top: 5px;">\${count}</div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase;">\${cat.replace('_', ' ')}</div>
                    </div>
                \`).join('');
            
            container.innerHTML = html || '<p style="color: #999;">No categories yet</p>';
        }

        function filterInboxByCategory(category) {
            document.getElementById('category-filter').value = category;
            filterInbox();
        }

        function filterInbox() {
            const filter = document.getElementById('category-filter').value;
            const filtered = filter === 'all' 
                ? allEmails 
                : allEmails.filter(e => e.category === filter);
            renderInbox(filtered);
        }

        function renderInbox(emails) {
            const list = document.getElementById('inbox-list');
            
            if (emails.length === 0) {
                list.innerHTML = \`
                    <div class="empty-state">
                        <h3>No emails in this category</h3>
                        <p>Emails will appear here when classified</p>
                    </div>
                \`;
                return;
            }

            const categoryIcons = {
                job_opportunity: '🎯',
                newsletter: '📰',
                shopping_order: '🛒',
                sales_marketing: '💼',
                personal: '👤',
                client_business: '💼',
                report_analytics: '📊',
                spam: '🚫',
                other: '📁'
            };

            const priorityColors = {
                urgent: '#dc3545',
                high: '#fd7e14',
                medium: '#ffc107',
                low: '#28a745'
            };

            list.innerHTML = emails.map(email => {
                const date = new Date(email.timestamp);
                const timeAgo = getTimeAgo(date);
                const icon = categoryIcons[email.category] || '📁';
                const priorityColor = priorityColors[email.priority] || '#6c757d';
                
                return \`
                    <div class="card" style="margin-bottom: 15px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <div style="font-size: 32px;">\${icon}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                                            \${email.sender || 'Unknown'}
                                        </div>
                                        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                                            \${email.subject || 'No subject'}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 11px; color: #999;">\${timeAgo}</div>
                                        <div style="display: inline-block; background: \${priorityColor}; color: white; font-size: 10px; padding: 2px 8px; border-radius: 3px; margin-top: 4px;">
                                            \${email.priority || 'low'}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                                    <span style="background: #e7f3ff; color: #0066cc; font-size: 11px; padding: 3px 8px; border-radius: 3px;">
                                        \${email.category.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span style="background: #f0f0f0; color: #666; font-size: 11px; padding: 3px 8px; border-radius: 3px;">
                                        \${Math.round(email.confidence * 100)}% confidence
                                    </span>
                                    \${email.needsReply ? '<span style="background: #fff3cd; color: #856404; font-size: 11px; padding: 3px 8px; border-radius: 3px;">📝 Needs Reply</span>' : ''}
                                    \${email.subcategory ? \`<span style="background: #f8f9fa; color: #666; font-size: 11px; padding: 3px 8px; border-radius: 3px;">\${email.subcategory}</span>\` : ''}
                                </div>
                                \${email.suggestedAction ? \`
                                    <div style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-left: 3px solid #667eea; font-size: 12px; color: #555;">
                                        💡 <strong>Suggestion:</strong> \${email.suggestedAction}
                                    </div>
                                \` : ''}
                                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
                                    💰 Classification cost: <strong>$0.00</strong> (Local AI)
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function getTimeAgo(date) {
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return \`\${Math.floor(seconds / 60)}m ago\`;
            if (seconds < 86400) return \`\${Math.floor(seconds / 3600)}h ago\`;
            if (seconds < 604800) return \`\${Math.floor(seconds / 86400)}d ago\`;
            return date.toLocaleDateString();
        }

        function updateStats(submissions) {
            const pending = submissions.filter(s => s.status === 'pending').length;
            const approved = submissions.filter(s => s.status === 'approved').length;
            const total = submissions.length;

            document.getElementById('stat-pending').textContent = pending;
            document.getElementById('stat-approved').textContent = approved;
            document.getElementById('stat-total').textContent = total;

            // Show/hide Delete All button
            const deleteAllBtn = document.getElementById('delete-all-btn');
            if (total > 0) {
                deleteAllBtn.style.display = 'block';
            } else {
                deleteAllBtn.style.display = 'none';
            }
        }

        function renderSubmissions(submissions) {
            const list = document.getElementById('submissions-list');
            const pending = submissions.filter(s => s.status === 'pending');

            if (pending.length === 0) {
                list.innerHTML = \`
                    <div class="empty-state">
                        <h3>No pending approvals</h3>
                        <p>Submissions will appear here when JDs are processed</p>
                    </div>
                \`;
                return;
            }

            list.innerHTML = pending.map(sub => {
                // Determine source with fallback
                const source = sub.source || 'manual';
                const sourceIcon = source === 'email' ? '📧 EMAIL' : source === 'whatsapp' ? '📱 WHATSAPP' : '📝 MANUAL';
                
                return \`
                <div class="submission-card \${activeCardId === sub.id ? 'active' : ''}" id="card-\${sub.id}" onclick="selectCard('\${sub.id}')">
                    <div class="submission-header">
                        <div class="submission-title">
                            <h3>\${sub.parsedData.role}</h3>
                            <div class="submission-meta">
                                <span>\${new Date(sub.timestamp).toLocaleString()}</span>
                                <span class="badge \${sub.parsedData.cloud}">\${sub.parsedData.cloud.toUpperCase()}</span>
                                <span class="badge \${source}">\${sourceIcon}</span>
                                <span class="badge \${sub.status}">\${sub.status.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="submission-details">
                        <p><strong>Location:</strong> \${sub.parsedData.location || 'N/A'}</p>
                        <p><strong>Recruiter:</strong> \${sub.parsedData.recruiterEmail}</p>
                        <p><strong>Subject:</strong> \${sub.emailSubject || 'N/A'}</p>
                    </div>

                    <div class="actions" onclick="event.stopPropagation()">
                        <button class="btn btn-view-pdf" onclick="viewPDF('\${sub.id}')">📄 View PDF</button>
                        <button class="btn btn-preview" onclick="previewEmail('\${sub.id}')">✏️ Edit Email</button>
                        <button class="btn btn-send-now btn-approve" onclick="sendNowOneClick('\${sub.id}')">✅ Send Now</button>
                        <button class="btn btn-ai-fix" onclick="aiFixAndResend('\${sub.id}')" style="background: #f39c12;">🤔 AI Fix & Resend</button>
                        <button class="btn btn-reject" onclick="reject('\${sub.id}')">❌ Reject</button>
                    </div>
                </div>
            \`;
            }).join('');
        }

        function selectCard(id) {
            activeCardId = id;
            
            // Update active state
            document.querySelectorAll('.submission-card').forEach(card => {
                card.classList.remove('active');
            });
            document.getElementById(\`card-\${id}\`)?.classList.add('active');

            // Show JD in right panel
            const submission = allSubmissions.find(s => s.id === id);
            if (submission) {
                const rightPanel = document.getElementById('right-panel');
                rightPanel.classList.remove('empty');
                
                const source = submission.source || 'manual';
                const sourceIcon = source === 'email' ? '📧 EMAIL' : source === 'whatsapp' ? '📱 WHATSAPP' : '📝 MANUAL';
                
                rightPanel.innerHTML = \`
                    <div>
                        <h2 style="font-size: 18px; margin-bottom: 10px;">Original Job Posting</h2>
                        <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                            <span class="badge \${source}">\${sourceIcon}</span>
                            <span class="badge \${submission.parsedData.cloud}">\${submission.parsedData.cloud.toUpperCase()}</span>
                        </div>
                        <div class="jd-panel">
                            <h3>Job Description</h3>
                            <div class="jd-content">\${submission.jd || 'No job description available'}</div>
                        </div>
                    </div>
                \`;
            }
        }

        function viewPDF(id) {
            window.open(\`/approval/pdf/\${id}\`, '_blank');
        }

        function previewEmail(id) {
            const submission = allSubmissions.find(s => s.id === id);
            if (!submission) {
                console.error('Submission not found:', id);
                return;
            }

            console.log('Opening preview for submission:', id);

            // Populate modal with email content
            const toField = document.getElementById('email-to');
            const ccField = document.getElementById('email-cc');
            const subjectField = document.getElementById('email-subject');
            const bodyField = document.getElementById('email-body');
            const commentsField = document.getElementById('email-regenerate-comments');
            
            if (!toField || !ccField || !subjectField || !bodyField || !commentsField) {
                console.error('Modal fields not found!');
                return;
            }

            toField.value = submission.parsedData.recruiterEmail || '';
            ccField.value = ''; // CC will be empty by default, user can add if needed
            subjectField.value = submission.emailSubject || '';
            bodyField.value = submission.emailBody || '';
            commentsField.value = '';
            
            // Store current submission ID for sending
            const modal = document.getElementById('email-preview-modal');
            if (!modal) {
                console.error('Modal element not found!');
                return;
            }
            
            modal.dataset.submissionId = id;
            
            // Show modal
            modal.classList.add('show');
            console.log('Modal opened');
        }

        function closeEmailPreview() {
            document.getElementById('email-preview-modal').classList.remove('show');
        }

        async function regenerateEmail() {
            const modal = document.getElementById('email-preview-modal');
            const id = modal.dataset.submissionId;
            const comments = document.getElementById('email-regenerate-comments').value.trim();
            
            if (!comments) {
                alert('Please add instructions for email regeneration');
                return;
            }

            const submission = allSubmissions.find(s => s.id === id);
            if (!submission) return;

            // Show loading state
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Regenerating...';
            btn.disabled = true;

            try {
                const response = await fetch('/approval/api/regenerate-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        submissionId: id,
                        jd: submission.jd,
                        role: submission.parsedData.role,
                        company: submission.parsedData.company,
                        currentSubject: document.getElementById('email-subject').value,
                        currentBody: document.getElementById('email-body').value,
                        comments: comments
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Update the fields with regenerated content
                    document.getElementById('email-subject').value = result.subject;
                    document.getElementById('email-body').value = result.body;
                    alert('✅ Email regenerated successfully!');
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error regenerating email: ' + error.message);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        async function sendEditedEmail() {
            const modal = document.getElementById('email-preview-modal');
            const id = modal.dataset.submissionId;
            const editedTo = document.getElementById('email-to').value.trim();
            const editedCC = document.getElementById('email-cc').value.trim();
            const editedSubject = document.getElementById('email-subject').value.trim();
            const editedBody = document.getElementById('email-body').value.trim();

            if (!editedTo) {
                alert('Please enter recipient email address');
                return;
            }

            if (!editedSubject || !editedBody) {
                alert('Please enter subject and body');
                return;
            }

            if (!confirm(\`Send email to \${editedTo}?\`)) return;

            try {
                const res = await fetch(\`/approval/api/approve/\${id}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        editedTo,
                        editedCC,
                        editedSubject,
                        editedBody
                    })
                });
                const result = await res.json();

                if (result.success) {
                    alert('✅ Email sent successfully!');
                    closeEmailPreview();
                    // Update card status immediately
                    const card = document.getElementById(\`card-\${id}\`);
                    if (card) {
                        card.style.opacity = '0.5';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => loadSubmissions(), 500);
                    } else {
                        loadSubmissions();
                    }
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error sending email: ' + error.message);
            }
        }

        // 🚀 ONE-CLICK SEND - Auto-attaches resume and sends immediately
        async function sendNowOneClick(id) {
            const submission = allSubmissions.find(s => s.id === id);
            if (!submission) {
                alert('Submission not found');
                return;
            }

            // Quick confirmation with all details visible
            const confirmMsg = \`✅ SEND NOW - One Click!

📧 To: \${submission.parsedData.recruiterEmail}
📋 Role: \${submission.parsedData.role}
🏢 Company: \${submission.parsedData.cloud || 'N/A'}
📎 Attachment: Resume.pdf (auto-attached)

Subject: \${submission.emailSubject}

Ready to send?\`;

            if (!confirm(confirmMsg)) return;

            try {
                // Show loading state on card
                const card = document.getElementById(\`card-\${id}\`);
                if (card) {
                    const btn = card.querySelector('.btn-send-now');
                    if (btn) {
                        btn.innerHTML = '⏳ Sending...';
                        btn.disabled = true;
                    }
                }

                const res = await fetch(\`/approval/api/send-now/\${id}\`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await res.json();

                if (result.success) {
                    alert('✅ Email sent successfully with resume attached!');
                    // Update card status immediately
                    if (card) {
                        card.style.opacity = '0.5';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => loadSubmissions(), 500);
                    } else {
                        loadSubmissions();
                    }
                } else {
                    alert('Error: ' + result.error);
                    if (card) {
                        const btn = card.querySelector('.btn-send-now');
                        if (btn) {
                            btn.innerHTML = '✅ Send Now';
                            btn.disabled = false;
                        }
                    }
                }
            } catch (error) {
                alert('Error sending email: ' + error.message);
                const card = document.getElementById(\`card-\${id}\`);
                if (card) {
                    const btn = card.querySelector('.btn-send-now');
                    if (btn) {
                        btn.innerHTML = '✅ Send Now';
                        btn.disabled = false;
                    }
                }
            }
        }

        // 🤔 AI FIX & RESEND - Analyzes why user hesitated and improves email
        async function aiFixAndResend(id) {
            const submission = allSubmissions.find(s => s.id === id);
            if (!submission) {
                alert('Submission not found');
                return;
            }

            // Ask user WHY they're not sending (optional feedback)
            const userFeedback = prompt(\`🤔 AI FIX & RESEND

I'll analyze this email and make it better!

Optional: Tell me what's bothering you about this email?
(Or leave blank and I'll figure it out)

Examples:
- "Too formal"
- "Not enthusiastic enough"  
- "Missing my AWS experience"
- "Subject line is boring"
- Leave blank for automatic analysis\`);

            // User cancelled
            if (userFeedback === null) return;

            try {
                // Show loading state
                const card = document.getElementById(\`card-\${id}\`);
                if (card) {
                    const btn = card.querySelector('.btn-ai-fix');
                    if (btn) {
                        btn.innerHTML = '⏳ AI Analyzing...';
                        btn.disabled = true;
                    }
                }

                const res = await fetch(\`/approval/api/ai-fix-resend/\${id}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userFeedback: userFeedback?.trim() || ''
                    })
                });
                const result = await res.json();

                if (result.success) {
                    // Show what changed
                    const changesMsg = \`✨ AI IMPROVED YOUR EMAIL!

📊 Analysis: \${result.analysis}

🔄 What Changed:
\${result.changes.map(c => \`  • \${c}\`).join('\\n')}

📧 NEW Subject: \${result.newSubject}

Would you like to review before sending?\`;

                    const shouldReview = confirm(changesMsg);

                    if (shouldReview) {
                        // Open preview modal with new content
                        previewEmail(id);
                        // The content will be reloaded from server (which now has updated email)
                        setTimeout(() => loadSubmissions(), 500);
                    } else {
                        // Send immediately with new version
                        sendNowOneClick(id);
                    }
                } else {
                    alert('Error: ' + result.error);
                    if (card) {
                        const btn = card.querySelector('.btn-ai-fix');
                        if (btn) {
                            btn.innerHTML = '🤔 AI Fix & Resend';
                            btn.disabled = false;
                        }
                    }
                }
            } catch (error) {
                alert('Error with AI fix: ' + error.message);
                const card = document.getElementById(\`card-\${id}\`);
                if (card) {
                    const btn = card.querySelector('.btn-ai-fix');
                    if (btn) {
                        btn.innerHTML = '🤔 AI Fix & Resend';
                        btn.disabled = false;
                    }
                }
            }
        }

        async function submitManualJD() {
            const input = document.getElementById('manual-jd-input');
            const statusDiv = document.getElementById('manual-submit-status');
            const jobDescription = input.value.trim();

            if (!jobDescription) {
                alert('Please paste a job description first');
                return;
            }

            statusDiv.innerHTML = '<p style="color: #667eea;">⏳ Processing job description...</p>';

            try {
                const res = await fetch('/approval/api/manual-submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobDescription })
                });

                const result = await res.json();

                if (result.success) {
                    statusDiv.innerHTML = '<p style="color: #28a745;">✅ Application generated successfully! Check the pending approvals below.</p>';
                    input.value = '';
                    setTimeout(() => {
                        statusDiv.innerHTML = '';
                    }, 5000);
                    loadSubmissions();
                } else {
                    statusDiv.innerHTML = \`<p style="color: #dc3545;">❌ Error: \${result.error}</p>\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`<p style="color: #dc3545;">❌ Error: \${error.message}</p>\`;
            }
        }

        function clearManualInput() {
            document.getElementById('manual-jd-input').value = '';
            document.getElementById('manual-submit-status').innerHTML = '';
        }

        async function approve(id) {
            if (!confirm('Send this resume to the recruiter now?')) return;

            try {
                const res = await fetch(\`/approval/api/approve/\${id}\`, { method: 'POST' });
                const result = await res.json();

                if (result.success) {
                    alert('✅ Resume sent successfully!');
                    // Update card status immediately
                    const card = document.getElementById(\`card-\${id}\`);
                    if (card) {
                        card.style.opacity = '0.5';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => loadSubmissions(), 500);
                    } else {
                        loadSubmissions();
                    }
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error approving: ' + error.message);
            }
        }

        async function reject(id) {
            if (!confirm('Reject this submission? It will not be sent.')) return;

            try {
                const res = await fetch(\`/approval/api/reject/\${id}\`, { method: 'POST' });
                const result = await res.json();

                if (result.success) {
                    alert('Submission rejected');
                    // Update card status immediately
                    const card = document.getElementById(\`card-\${id}\`);
                    if (card) {
                        card.style.opacity = '0.5';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => loadSubmissions(), 500);
                    } else {
                        loadSubmissions();
                    }
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error rejecting: ' + error.message);
            }
        }

        async function deleteSubmission(id) {
            if (!confirm('Delete this submission permanently?')) return;

            try {
                const res = await fetch(\`/approval/api/delete/\${id}\`, { method: 'DELETE' });
                const result = await res.json();

                if (result.success) {
                    // Remove card immediately with animation
                    const card = document.getElementById(\`card-\${id}\`);
                    if (card) {
                        card.style.transition = 'all 0.3s';
                        card.style.transform = 'translateX(-100%)';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            loadSubmissions();
                            if (activeCardId === id) {
                                // Clear right panel if this card was selected
                                const rightPanel = document.getElementById('right-panel');
                                rightPanel.classList.add('empty');
                                rightPanel.innerHTML = \`
                                    <div>
                                        <p style="font-size: 48px; margin-bottom: 10px;">📄</p>
                                        <p><strong>No card selected</strong></p>
                                        <p style="margin-top: 8px; font-size: 13px;">Click on any card to view<br>the original job posting</p>
                                    </div>
                                \`;
                                activeCardId = null;
                            }
                        }, 300);
                    }
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error deleting: ' + error.message);
            }
        }

        async function deleteAllCards() {
            const count = allSubmissions.length;
            if (!confirm(\`Delete ALL \${count} cards permanently? This cannot be undone!\`)) return;

            try {
                const res = await fetch('/approval/api/delete-all', { method: 'DELETE' });
                const result = await res.json();

                if (result.success) {
                    alert(\`✅ Deleted \${result.deletedCount} submissions\`);
                    activeCardId = null;
                    loadSubmissions();
                    // Clear right panel
                    const rightPanel = document.getElementById('right-panel');
                    rightPanel.classList.add('empty');
                    rightPanel.innerHTML = \`
                        <div>
                            <p style="font-size: 48px; margin-bottom: 10px;">📄</p>
                            <p><strong>No card selected</strong></p>
                            <p style="margin-top: 8px; font-size: 13px;">Click on any card to view<br>the original job posting</p>
                        </div>
                    \`;
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error deleting all: ' + error.message);
            }
        }

        // Load submissions on page load
        loadSubmissions();

        // Refresh every 10 seconds
        setInterval(() => {
            if (currentTab === 'approvals') {
                loadSubmissions();
            } else if (currentTab === 'inbox') {
                loadInbox();
            }
        }, 10000);
    </script>
</body>
</html>
    `;
  }

  private async getPendingApprovals(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ submissions }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async getEmailInbox(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const dbPath = path.join(process.cwd(), 'data', 'email-classifications.json');

      let emailDB: Record<string, any> = {};
      try {
        const data = await fs.readFile(dbPath, 'utf-8');
        emailDB = JSON.parse(data);
        console.log(`[DEBUG] Loaded email database with ${Object.keys(emailDB).length} classifications`);
      } catch (error) {
        // Database doesn't exist yet or is empty
        emailDB = {};
        console.log(`[DEBUG] Email database is empty or doesn't exist`);
      }

      // Convert to array with email IDs
      const emails = Object.entries(emailDB).map(([id, data]) => ({
        id,
        ...data
      }));

      // Sort by timestamp (newest first)
      emails.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      });

      console.log(`[DEBUG] Returning ${emails.length} emails via API`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ emails }));
    } catch (error: any) {
      console.error(`[DEBUG] Error in getEmailInbox:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async getInboxStats(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const dbPath = path.join(process.cwd(), 'data', 'email-classifications.json');

      let emailDB: Record<string, any> = {};
      try {
        const data = await fs.readFile(dbPath, 'utf-8');
        emailDB = JSON.parse(data);
        console.log(`[DEBUG] Loaded email database for stats with ${Object.keys(emailDB).length} classifications`);
      } catch (error) {
        emailDB = {};
        console.log(`[DEBUG] Email database empty for stats`);
      }

      const emails = Object.values(emailDB);

      // Calculate statistics
      const stats = {
        total: emails.length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        needsReply: emails.filter((e: any) => e.needsReply).length,
        today: emails.filter((e: any) => {
          const emailDate = new Date(e.timestamp);
          const today = new Date();
          return emailDate.toDateString() === today.toDateString();
        }).length
      };

      // Count by category
      emails.forEach((email: any) => {
        const cat = email.category || 'unknown';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

        const pri = email.priority || 'unknown';
        stats.byPriority[pri] = (stats.byPriority[pri] || 0) + 1;
      });

      console.log(`[DEBUG] Calculated stats:`, stats);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } catch (error: any) {
      console.error(`[DEBUG] Error in getInboxStats:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async getSubmission(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(submission));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  private async approveSubmission(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Read request body for edited email content
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      await new Promise(resolve => req.on('end', resolve));
      
      const editedContent = body ? JSON.parse(body) : {};
      
      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      // Use edited content if provided, otherwise use original
      const emailTo = editedContent.editedTo || submission.parsedData.recruiterEmail;
      const emailCC = editedContent.editedCC || process.env.CC_EMAIL;
      const emailSubject = editedContent.editedSubject || submission.emailSubject;
      const emailBody = editedContent.editedBody || submission.emailBody;

      // Send email
      logger.info(`Sending approved resume to ${emailTo} (CC: ${emailCC || 'none'})`);

      const emailResult = await renderAndEmail({
        latex: submission.latex,
        to: emailTo,
        cc: emailCC || undefined,
        subject: emailSubject,
        body: emailBody,
        filenameBase: 'Nihal_Veeramalla_Resume'
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Email failed');
      }

      // Update status
      submission.status = 'approved';
      await this.saveQueue(submissions);

      // ⚠️ CRITICAL: NEVER send WhatsApp messages to Srinu or anyone else on approve!
      // Only YOU receive notifications, and only ONCE when resume is ready for review.
      // This prevents spamming Srinu with status updates.

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, emailResult }));
    } catch (error: any) {
      logger.error('Error approving submission:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  private async rejectSubmission(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      submission.status = 'rejected';
      await this.saveQueue(submissions);

      // ⚠️ CRITICAL: NEVER send WhatsApp messages to Srinu or anyone else on reject!
      // Only YOU receive notifications, and only ONCE when resume is ready for review.

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  private async deleteSubmission(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const index = submissions.findIndex(s => s.id === id);

      if (index === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      // Remove the submission from the queue entirely
      submissions.splice(index, 1);
      await this.saveQueue(submissions);

      logger.info(`Submission ${id} deleted from queue`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  private async deleteAllSubmissions(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const count = submissions.length;

      // Clear the queue entirely
      await this.saveQueue([]);

      logger.info(`Deleted all ${count} submissions from queue`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deletedCount: count }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  /**
   * Regenerate email content using AI based on user comments
   */
  private async regenerateEmail(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Read request body
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      await new Promise((resolve) => req.on('end', resolve));

      const data = JSON.parse(body);
      const { submissionId, jd, role, company, currentSubject, currentBody, comments } = data;

      logger.info(`🔄 Regenerating email for submission ${submissionId} with comments: ${comments}`);

      // Call OpenAI GPT-5 to regenerate email
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at crafting professional job application emails. You tailor emails to match specific job requirements while maintaining a professional yet personable tone.'
          },
          {
            role: 'user',
            content: `I need to customize this job application email based on specific instructions.

Current Email:
Subject: ${currentSubject}

Body:
${currentBody}

Job Details:
- Role: ${role}
- Company: ${company}
- Full Job Description: ${jd}

User's Instructions for Changes: ${comments}

Please generate an improved email with updated subject and body based on these instructions. Keep it professional, tailored to the job, and maintain appropriate length. Return ONLY a JSON object with this exact format (no markdown, no additional text):
{"subject": "the new subject line", "body": "the new email body"}`,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 2000,
      });

      const responseText = completion.choices[0].message.content?.trim() || '';
      
      // Try to extract JSON from response (in case AI wraps it in markdown)
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

      logger.info('✅ Email regenerated successfully');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          subject: result.subject,
          body: result.body,
        })
      );
    } catch (error: any) {
      logger.error('❌ Error regenerating email:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: error.message || 'Failed to regenerate email',
        })
      );
    }
  }

  /**
   * ONE-CLICK SEND - Auto-attaches resume and sends immediately
   */
  private async sendNowOneClick(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      const emailTo = submission.parsedData.recruiterEmail;
      const emailCC = process.env.CC_EMAIL;
      const emailSubject = submission.emailSubject;
      const emailBody = submission.emailBody;

      logger.info(`✅ ONE-CLICK SEND to ${emailTo}`);

      // Send email with auto-attached resume
      const emailResult = await renderAndEmail({
        latex: submission.latex,
        to: emailTo,
        cc: emailCC || undefined,
        subject: emailSubject,
        body: emailBody,
        filenameBase: 'Nihal_Veeramalla_Resume'
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Email failed');
      }

      // Update status
      submission.status = 'approved';
      await this.saveQueue(submissions);

      logger.info(`✅ Email sent successfully with resume attached!`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, emailResult }));
    } catch (error: any) {
      logger.error('Error in sendNowOneClick:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  /**
   * AI FIX & RESEND - Analyzes why user hesitated and improves email
   */
  private async aiFixAndResend(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Read request body
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      await new Promise((resolve) => req.on('end', resolve));

      const data = JSON.parse(body);
      const { userFeedback } = data;

      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Submission not found' }));
        return;
      }

      logger.info(`🤔 AI FIX & RESEND for submission ${id}`);
      logger.info(`User feedback: "${userFeedback || 'none provided - automatic analysis'}"`);

      // Call GPT-5 to analyze and improve the email
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const analysisPrompt = userFeedback
        ? `The user said: "${userFeedback}". Fix this specific issue and improve the email.`
        : `The user hesitated to send this email. Analyze what might be wrong and improve it. Common issues: 
           - Too generic/not tailored enough
           - Missing enthusiasm
           - Not highlighting relevant skills
           - Boring subject line
           - Too formal or too casual
           - Missing key qualifications from JD`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `You are an expert email analyzer and improver. Your job is to:
1. Analyze what's wrong with a job application email
2. Fix the issues
3. Make it more compelling and tailored
4. Return clear explanations of what you changed`
          },
          {
            role: 'user',
            content: `Current Email:
Subject: ${submission.emailSubject}

Body:
${submission.emailBody}

Job Details:
- Role: ${submission.parsedData.role}
- Company: ${submission.parsedData.cloud || 'N/A'}
- Location: ${submission.parsedData.location}

Task: ${analysisPrompt}

Return a JSON object with:
{
  "analysis": "Brief analysis of what was wrong (2-3 sentences)",
  "changes": ["Change 1", "Change 2", "Change 3"],
  "newSubject": "improved subject line",
  "newBody": "improved email body"
}

Make it professional, enthusiastic, and tailored to the specific role and company.`,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 2000,
      });

      const responseText = completion.choices[0].message.content?.trim() || '';
      
      // Extract JSON
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

      // Update the submission with improved email
      submission.emailSubject = result.newSubject;
      submission.emailBody = result.newBody;
      await this.saveQueue(submissions);

      logger.info('✨ Email improved by AI!');
      logger.info(`Analysis: ${result.analysis}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          analysis: result.analysis,
          changes: result.changes,
          newSubject: result.newSubject,
          newBody: result.newBody
        })
      );
    } catch (error: any) {
      logger.error('❌ Error in aiFixAndResend:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: error.message || 'Failed to improve email',
        })
      );
    }
  }

  private async manualSubmit(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => body += chunk);

    req.on('end', async () => {
      try {
        let jobDescription: string;
        
        // Try to parse JSON with better error handling
        try {
          const parsed = JSON.parse(body);
          jobDescription = parsed.jobDescription;
        } catch (parseError: any) {
          logger.error(`JSON parse error: ${parseError.message}`);
          logger.error(`Body preview: ${body.substring(0, 200)}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `Invalid JSON: ${parseError.message}. Please check for special characters.` 
          }));
          return;
        }

        if (!jobDescription) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Job description is required' }));
          return;
        }

        logger.info('Received manually submitted job description');

        // Parse JD with AI for better extraction
        const parsedData = await parseJDWithAI(jobDescription);
        const latex = tailorResume({
          cloud: parsedData.cloud,
          role: parsedData.role,
          location: parsedData.location
        });

        // Use AI to customize the email based on JD
        logger.info('Generating AI-customized email...');
        const aiResult = await aiCustomizeApplication(
          latex,
          jobDescription,
          {
            name: 'Nihal Veeramalla',
            email: 'nihal.veeramalla@gmail.com',
            phone: '313-288-2859',
            title: 'Data Scientist'
          }
        );

        // Update cloud platform with AI-detected platform (overrides regex detection)
        if (aiResult.analysis.cloudPlatform) {
          const cloudMap: Record<string, 'azure' | 'aws' | 'gcp'> = {
            'Google Cloud Platform': 'gcp',
            'GCP': 'gcp',
            'Azure': 'azure',
            'AWS': 'aws'
          };
          const detectedCloud = cloudMap[aiResult.analysis.cloudPlatform];
          if (detectedCloud) {
            parsedData.cloud = detectedCloud;
            logger.info(`✅ Cloud platform updated to: ${parsedData.cloud} (AI-detected: ${aiResult.analysis.cloudPlatform})`);
          }
        }

        // Validate resume
        const validation = validateResume(latex, parsedData.cloud);
        if (!validation.ok) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Resume validation failed',
            validationErrors: validation.errors 
          }));
          return;
        }

        // Generate PDF
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const filenameBase = `Nihal_Veeramalla_Resume_${timestamp}`;
        const pdfResult = await renderPDF(latex, filenameBase);

        if (!pdfResult.success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `PDF generation failed: ${pdfResult.error}` 
          }));
          return;
        }

        // Get my WhatsApp chat ID for notifications
        let myChatId = '';
        if (this.whatsappClient) {
          const myNumber = process.env.MY_WHATSAPP_NUMBER || '15715026464';
          try {
            myChatId = `${myNumber}@c.us`; // Standard WhatsApp chat ID format
            logger.info(`Will send notifications to: ${myChatId}`);
          } catch (error) {
            logger.warn(`Could not get WhatsApp chat ID for ${myNumber}`);
          }
        }

        // Create new submission with AI-customized email
        const newSubmission: PendingApproval = {
          id: `submission_${Date.now()}`,
          timestamp: Date.now(),
          jd: jobDescription,
          source: 'manual',  // Manual submission from dashboard
          parsedData: {
            role: parsedData.role,
            cloud: parsedData.cloud,
            location: parsedData.location,
            recruiterEmail: parsedData.recruiterEmail || 'unknown@example.com',
            recruiterName: parsedData.recruiterName
          },
          latex,
          pdfPath: pdfResult.pdfPath || '',
          texPath: pdfResult.texPath || '',
          emailSubject: aiResult.email.subject,
          emailBody: aiResult.email.body,
          validation: { ok: true, errors: [] },
          status: 'pending',
          myNotificationChatId: myChatId  // YOUR number for receiving notifications ONLY (NEVER send to Srinu!)
        };

        // Add to queue
        const submissions = await this.loadQueue();
        submissions.push(newSubmission);
        await this.saveQueue(submissions);

        // Send WhatsApp notification to you
        if (this.whatsappClient && myChatId) {
          try {
            // Get local IP address for phone access
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            let localIP = 'localhost';
            
            // Find first non-internal IPv4 address
            for (const name of Object.keys(networkInterfaces)) {
              for (const net of networkInterfaces[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                  localIP = net.address;
                  break;
                }
              }
              if (localIP !== 'localhost') break;
            }

            await this.whatsappClient.sendMessage({
              chatId: myChatId,
              message: `📋 New Resume Ready for Approval!\n\n` +
                       `Role: ${parsedData.role}\n` +
                       `Company: ${aiResult.analysis.company || 'Unknown'}\n` +
                       `Cloud: ${parsedData.cloud.toUpperCase()}\n` +
                       `Location: ${parsedData.location}\n\n` +
                       `✅ Review on Computer:\n` +
                       `http://localhost:3001/approval\n\n` +
                       `📱 Review on Phone:\n` +
                       `http://${localIP}:3001/approval`
            });
            logger.info(`✅ WhatsApp notification sent to your number`);
          } catch (error: any) {
            logger.warn(`Failed to send WhatsApp notification: ${error.message}`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Job description processed and added to queue' }));

      } catch (error: any) {
        logger.error(`Error processing manual submission: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  private async requestChanges(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => body += chunk);

    req.on('end', async () => {
      try {
        const { comments } = JSON.parse(body);

        const submissions = await this.loadQueue();
        const submission = submissions.find(s => s.id === id);

        if (!submission) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Submission not found' }));
          return;
        }

        submission.status = 'changes_requested';
        submission.comments = comments;
        await this.saveQueue(submissions);

        // ⚠️ CRITICAL: NEVER send WhatsApp messages to Srinu or anyone else!
        // The system should ONLY receive JDs from Srinu and send notifications to YOU.
        // No status updates, no changes requested messages - NOTHING to Srinu!

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  private async servePDF(id: string, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const submissions = await this.loadQueue();
      const submission = submissions.find(s => s.id === id);

      if (!submission || !submission.pdfPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('PDF not found');
        return;
      }

      const pdfData = await fs.readFile(submission.pdfPath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(submission.pdfPath)}"`
      });
      res.end(pdfData);
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading PDF: ' + error.message);
    }
  }

  async addToQueue(submission: PendingApproval): Promise<void> {
    const submissions = await this.loadQueue();
    submissions.push(submission);
    await this.saveQueue(submissions);
    logger.info(`Added submission ${submission.id} to approval queue`);

    // ⚠️ CRITICAL: This notification is sent to YOU, not Srinu!
    // The myNotificationChatId contains YOUR WhatsApp number for receiving notifications.
    // Srinu only SENDS JDs to the system - he NEVER receives any messages from us.
    if (this.whatsappClient && submission.myNotificationChatId) {
      await this.whatsappClient.sendMessage({
        chatId: submission.myNotificationChatId,
        message: `📋 Resume ready for your approval!\n\n` +
                 `Role: ${submission.parsedData.role}\n` +
                 `Cloud: ${submission.parsedData.cloud}\n` +
                 `Location: ${submission.parsedData.location}\n\n` +
                 `Review at: http://localhost:${this.config.approvalPort || 3001}/approval`
      });
    }
  }

  private async loadQueue(): Promise<PendingApproval[]> {
    try {
      const data = await fs.readFile(this.approvalQueuePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Queue doesn't exist yet
      return [];
    }
  }

  private async saveQueue(submissions: PendingApproval[]): Promise<void> {
    await fs.mkdir(path.dirname(this.approvalQueuePath), { recursive: true });
    await fs.writeFile(this.approvalQueuePath, JSON.stringify(submissions, null, 2));
  }

  start(port?: number): Promise<void> {
    const approvalPort = port || this.config.approvalPort || 3001;
    return new Promise((resolve) => {
      this.server.listen(approvalPort, () => {
        logger.info(`Approval Dashboard: http://localhost:${approvalPort}/approval`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
