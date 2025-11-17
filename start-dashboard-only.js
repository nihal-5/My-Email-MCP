#!/usr/bin/env node
/**
 * Start Approval Dashboard Only (without WhatsApp)
 * For testing and manual approval of queued submissions
 */

import 'dotenv/config';
import http from 'http';
import * as fs from 'fs/promises';
import path from 'path';
import { renderAndEmail, tailorResume, renderPDF, parseJD, aiCustomizeApplication } from './dist/resume-tools/index.js';
import { validateResume } from './dist/resume-tools/validators/resume-validator.js';

const PORT = 3001;
const QUEUE_FILE = './data/approval-queue.json';

// Load queue
async function loadQueue() {
  try {
    const data = await fs.readFile(QUEUE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save queue
async function saveQueue(queue) {
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /approval - Dashboard HTML
  if (url.pathname === '/approval' && req.method === 'GET') {
    const queue = await loadQueue();
    const pending = queue.filter(s => s.status === 'pending');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume Approval Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .stats { display: flex; gap: 20px; margin-top: 20px; }
    .stat { background: rgba(255,255,255,0.2); padding: 15px 25px; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 14px; opacity: 0.9; margin-top: 5px; }

    .bulk-actions { background: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; display: none; align-items: center; gap: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .bulk-actions.visible { display: flex; }
    .bulk-actions .count { font-weight: 600; color: #667eea; }

    .submissions { display: grid; gap: 20px; }
    .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.2s; position: relative; }
    .card.selected { border: 2px solid #667eea; background: #f0f4ff; }
    .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

    .checkbox-wrapper { position: absolute; top: 20px; right: 20px; }
    .checkbox-wrapper input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }

    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; padding-right: 40px; }
    .role { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 5px; }
    .meta { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #666; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge.azure { background: #e3f2fd; color: #1976d2; }
    .badge.gcp { background: #e8f5e9; color: #388e3c; }
    .badge.aws { background: #fff3e0; color: #f57c00; }

    .recruiter { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 15px; }
    .recruiter-name { font-weight: 600; color: #333; margin-bottom: 4px; }
    .recruiter-email { font-size: 14px; color: #666; }

    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn { padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .btn-view-pdf { background: #667eea; color: white; }
    .btn-preview { background: #4caf50; color: white; }
    .btn-approve { background: #2196f3; color: white; }
    .btn-reject { background: #f44336; color: white; }
    .btn-request { background: #ff9800; color: white; }
    .btn-delete { background: #9e9e9e; color: white; }

    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000; align-items: center; justify-content: center; }
    .modal.visible { display: flex; }
    .modal-content { background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-header { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
    .modal-body { white-space: pre-wrap; line-height: 1.6; }
    .modal-close { position: absolute; top: 15px; right: 15px; font-size: 28px; cursor: pointer; color: #666; }

    .empty { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 64px; margin-bottom: 20px; }

    .jd-input-box { background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .jd-input-header { display: flex; align-items: center; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Resume Approval Dashboard</h1>
    <p>Review and approve AI-generated resumes before sending to recruiters</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${pending.length}</div>
        <div class="stat-label">Pending Review</div>
      </div>
      <div class="stat">
        <div class="stat-value">${queue.filter(s => s.status === 'approved').length}</div>
        <div class="stat-label">Approved & Sent</div>
      </div>
    </div>
  </div>

  <div class="jd-input-box">
    <div class="jd-input-header">
      <span style="font-size: 24px; margin-right: 10px;">💬</span>
      <span style="font-weight: 600; font-size: 18px;">Paste Job Description</span>
    </div>
    <textarea id="jd-input"
      placeholder="Paste the job description here...

Example:
Title: Senior AI Engineer
Location: Remote
Cloud: GCP

Requirements:
- 5+ years ML experience
- Python, FastAPI, Kubernetes
- Vertex AI, BigQuery

Contact: recruiter@company.com"
      style="width: 100%; min-height: 200px; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; resize: vertical; margin-bottom: 15px;"
    ></textarea>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn" onclick="clearJDInput()" style="background: #ccc; color: #333;">Clear</button>
      <button class="btn btn-approve" onclick="processJD()" style="background: #667eea; color: white;">
        🚀 Generate Resume
      </button>
    </div>
    <div id="processing-status" style="display: none; margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 6px; color: #1976d2;">
      <span style="display: inline-block; margin-right: 10px;">⏳</span>
      <span id="processing-message">Processing JD...</span>
    </div>
  </div>

  <div class="bulk-actions" id="bulk-actions">
    <span class="count"><span id="selected-count">0</span> selected</span>
    <button class="btn btn-view-pdf" onclick="bulkViewPDF()">📄 View All PDFs</button>
    <button class="btn btn-approve" onclick="bulkApprove()">✅ Approve All</button>
    <button class="btn btn-delete" onclick="bulkDelete()">🗑️ Delete All</button>
    <button class="btn" onclick="clearSelection()">Clear Selection</button>
  </div>

  <div class="submissions" id="submissions">
    ${pending.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">✅</div>
        <h2>No pending submissions</h2>
        <p>All resumes have been reviewed!</p>
      </div>
    ` : pending.map(sub => `
      <div class="card" id="card-${sub.id}">
        <div class="checkbox-wrapper">
          <input type="checkbox" id="check-${sub.id}" onchange="toggleSelection('${sub.id}')">
        </div>
        <div class="card-header">
          <div>
            <div class="role">${sub.parsedData.role}</div>
            <div class="meta">
              <div class="meta-item">
                <span class="badge ${sub.parsedData.cloud}">${sub.parsedData.cloud.toUpperCase()}</span>
              </div>
              <div class="meta-item">📍 ${sub.parsedData.location || 'Location not specified'}</div>
            </div>
          </div>
        </div>

        <div class="recruiter">
          <div class="recruiter-name">👤 ${sub.parsedData.recruiterName || 'Recruiter'}</div>
          <div class="recruiter-email">📧 ${sub.parsedData.recruiterEmail}</div>
        </div>

        <div class="actions">
          <button class="btn btn-view-pdf" onclick="viewPDF('${sub.pdfPath}')">📄 View PDF</button>
          <button class="btn btn-preview" onclick="previewEmail('${sub.id}')">📧 Preview Email</button>
          <button class="btn btn-request" onclick="requestChanges('${sub.id}')">💬 Request Changes</button>
          <button class="btn btn-approve" onclick="approve('${sub.id}')">✅ Approve & Send</button>
          <button class="btn btn-delete" onclick="deleteSubmission('${sub.id}')">🗑️ Delete</button>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="modal" id="email-modal">
    <div class="modal-content" style="position: relative; max-width: 1400px; width: 98%; max-height: 95vh; overflow-y: auto; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.25);">
      <span class="modal-close" onclick="closeModal('email-modal')" style="position: absolute; right: 25px; top: 25px; font-size: 32px; font-weight: 300; color: #999; cursor: pointer; line-height: 1; z-index: 10;">&times;</span>

      <div class="modal-header" style="padding: 20px 40px; border-bottom: 1px solid #e0e0e0; background: #f9f9f9;">
        <h2 id="modal-title" style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600; color: #333;">📧 Email Preview</h2>
        <div style="display: flex; gap: 12px;">
          <button id="btn-edit" onclick="toggleEditMode()" style="background: #ff9800; color: white; padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255,152,0,0.3);">
            ✏️ Edit Email
          </button>
          <button id="btn-send" onclick="sendEditedEmail()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 10px rgba(102,126,234,0.4);">
            ✉️ Send Now
          </button>
          <button id="btn-draft" onclick="saveToDrafts()" style="background: #4caf50; color: white; padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s;">
            📥 Save to Drafts
          </button>
        </div>
      </div>

      <!-- Email Preview (Gmail Style) -->
      <div id="preview-section" class="modal-body" style="padding: 15px 25px; background: white;">

        <!-- Email Header -->
        <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; margin-right: 10px;">
              N
            </div>
            <div>
              <div style="font-weight: 600; font-size: 14px; color: #202124;">Nihal Veeramalla</div>
              <div style="font-size: 12px; color: #5f6368;">nihal.veeramalla@gmail.com</div>
            </div>
          </div>

          <div style="font-size: 12px; color: #5f6368; line-height: 1.4; margin-left: 42px;">
            <div><span style="color: #202124; font-weight: 500;">to</span> <span id="preview-to">recruiter@company.com</span></div>
            <div><span style="color: #202124; font-weight: 500;">cc</span> Srinu, Abhishek</div>
          </div>
        </div>

        <!-- Subject -->
        <div style="margin-bottom: 10px;">
          <h3 id="preview-subject" style="font-size: 17px; font-weight: 400; color: #202124; margin: 0;">Application – Title AI Engineer – Nihal Veeramalla</h3>
        </div>

        <!-- Email Body -->
        <div style="font-size: 13px; color: #202124; line-height: 1.5; font-family: Arial, sans-serif;">
          <p style="margin: 0 0 8px 0;">Hi Abhishek,</p>

          <p id="preview-body" style="margin: 0 0 8px 0;">
            I'm interested in the Agentic AI Technical Specialist role. I've built and shipped agentic AI systems end to end: LangGraph-based copilot workflows, private LLM inference on Kubernetes, RAG over enterprise knowledge, and secure integrations with platforms like ServiceNow, SAP (via Mulesoft), Databricks, and Snowflake. My background includes API design, OAuth2, CI/CD with Terraform and Azure DevOps, VNET networking, and production observability with OpenTelemetry.
          </p>

          <p style="margin: 0 0 8px 0;">I've attached my resume</p>

          <!-- Signature -->
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0 0 2px 0; color: #1a73e8; font-weight: 600; font-size: 13px;">Thanks & Regards,</p>
            <p style="margin: 0 0 2px 0; color: #1a73e8; font-weight: 600; font-size: 13px;">Nihal Veeramalla</p>
            <p style="margin: 0 0 2px 0; color: #5f6368; font-size: 12px;">Data Scientist</p>
            <p style="margin: 0 0 2px 0;"><a href="https://linkedin.com/in/nihalveeramalla" style="color: #1a73e8; text-decoration: none; font-size: 12px;">Linkedin</a></p>
            <p style="margin: 0 0 2px 0; color: #5f6368; font-size: 12px;">Ph: 313-288-2859 📞</p>
            <p style="margin: 0; font-size: 12px;"><span style="color: #5f6368;">Email : </span><a href="mailto:nihal.veeramalla@gmail.com" style="color: #1a73e8; text-decoration: none;">nihal.veeramalla@gmail.com</a></p>
          </div>
        </div>

        <!-- Attachment Section (Gmail Style) -->
        <div style="margin-top: 12px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; background: #f8f9fa;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; background: #d93025; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 500; font-size: 13px; color: #202124;">Nihal_Resume_CV.pdf</div>
              <div style="font-size: 11px; color: #5f6368; margin-top: 1px;">PDF</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Edit Mode (Form) -->
      <div id="edit-section" class="modal-body" style="padding: 20px 40px; background: white; display: none;">

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #333; font-size: 14px;">To:</label>
          <input type="email" id="edit-to" style="width: 100%; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #333; font-size: 14px;">CC:</label>
          <input type="text" id="edit-cc" value="Srinu@blueridgeinfotech.com" style="width: 100%; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #333; font-size: 14px;">Subject:</label>
          <input type="text" id="edit-subject" style="width: 100%; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #333; font-size: 14px;">Message:</label>
          <textarea id="edit-body" style="width: 100%; height: 200px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: Arial, sans-serif; line-height: 1.5;"></textarea>
        </div>

        <div style="padding: 12px; background: #f5f7fa; border-radius: 6px; border-left: 4px solid #667eea;">
          <div style="font-size: 13px; color: #666;">
            <span style="font-size: 16px;">📎</span> <strong style="color: #333;">Attachment:</strong> Nihal_Resume_CV.pdf
          </div>
        </div>

      </div>
    </div>
  </div>

  <div class="modal" id="changes-modal">
    <div class="modal-content" style="position: relative;">
      <span class="modal-close" onclick="closeModal('changes-modal')">&times;</span>
      <div class="modal-header">💬 Request Changes</div>
      <div class="modal-body">
        <p style="margin-bottom: 15px; color: #666;">Provide specific instructions for how to improve the resume:</p>
        <textarea id="change-instructions"
          style="width: 100%; min-height: 150px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 14px; line-height: 1.5;"
          placeholder="Example:&#10;- Emphasize Kubernetes experience more&#10;- Add more metrics to the Fiserv bullets&#10;- Make the summary shorter&#10;- Highlight Python and FastAPI skills"></textarea>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn" onclick="closeModal('changes-modal')" style="background: #ccc; color: #333;">Cancel</button>
          <button class="btn btn-request" onclick="submitChanges()" style="background: #ff9800; color: white;">🔄 Regenerate Resume</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const pendingData = ${JSON.stringify(pending)};
    let selectedSubmissions = new Set();
    let currentSubmissionId = null;

    function toggleSelection(id) {
      const checkbox = document.getElementById('check-' + id);
      const card = document.getElementById('card-' + id);

      if (checkbox.checked) {
        selectedSubmissions.add(id);
        card.classList.add('selected');
      } else {
        selectedSubmissions.delete(id);
        card.classList.remove('selected');
      }
      updateBulkActions();
    }

    function updateBulkActions() {
      const bulkBar = document.getElementById('bulk-actions');
      const count = document.getElementById('selected-count');
      count.textContent = selectedSubmissions.size;

      if (selectedSubmissions.size > 0) {
        bulkBar.classList.add('visible');
      } else {
        bulkBar.classList.remove('visible');
      }
    }

    function clearSelection() {
      selectedSubmissions.forEach(id => {
        document.getElementById('check-' + id).checked = false;
        document.getElementById('card-' + id).classList.remove('selected');
      });
      selectedSubmissions.clear();
      updateBulkActions();
    }

    async function bulkViewPDF() {
      for (const id of selectedSubmissions) {
        const sub = pendingData.find(s => s.id === id);
        if (sub) {
          const filename = sub.pdfPath.split('/').pop();
          window.open('/pdf/' + encodeURIComponent(filename), '_blank');
        }
      }
    }

    async function bulkApprove() {
      if (!confirm(\`Approve and send \${selectedSubmissions.size} resumes to recruiters?\`)) return;

      let success = 0;
      let failed = 0;

      for (const id of selectedSubmissions) {
        try {
          const res = await fetch('/approval/api/approve/' + id, { method: 'POST' });
          const result = await res.json();
          if (result.success) success++;
          else failed++;
        } catch (error) {
          failed++;
        }
      }

      alert(\`✅ Approved: \${success}\\n❌ Failed: \${failed}\`);
      clearSelection();
      location.reload();
    }

    async function bulkDelete() {
      if (!confirm(\`Delete \${selectedSubmissions.size} submissions?\`)) return;

      let success = 0;
      let failed = 0;

      for (const id of selectedSubmissions) {
        try {
          const res = await fetch('/approval/api/delete/' + id, { method: 'POST' });
          const result = await res.json();
          if (result.success) success++;
          else failed++;
        } catch (error) {
          failed++;
        }
      }

      alert(\`✅ Deleted: \${success}\\n❌ Failed: \${failed}\`);
      clearSelection();
      location.reload();
    }

    function viewPDF(path) {
      const filename = path.split('/').pop();
      window.open('/pdf/' + encodeURIComponent(filename), '_blank');
    }

    async function previewEmail(id) {
      currentSubmissionId = id;
      const sub = pendingData.find(s => s.id === id);
      if (!sub) return;

      // Populate preview fields
      document.getElementById('preview-to').textContent = sub.parsedData.recruiterEmail || 'recruiter@company.com';
      document.getElementById('preview-subject').textContent = sub.emailSubject || 'Application – Job Title – Your Name';
      document.getElementById('preview-body').textContent = sub.emailBody || '';

      // Store data for edit mode
      window.currentEmailData = {
        to: sub.parsedData.recruiterEmail || '',
        cc: 'Srinu@blueridgeinfotech.com',
        subject: sub.emailSubject || '',
        body: sub.emailBody || ''
      };

      document.getElementById('email-modal').classList.add('visible');
    }

    let isEditMode = false;

    function toggleEditMode() {
      const previewSection = document.getElementById('preview-section');
      const editSection = document.getElementById('edit-section');
      const btnEdit = document.getElementById('btn-edit');
      const modalTitle = document.getElementById('modal-title');

      if (!isEditMode) {
        // Switch to EDIT mode
        document.getElementById('edit-to').value = window.currentEmailData.to;
        document.getElementById('edit-cc').value = window.currentEmailData.cc;
        document.getElementById('edit-subject').value = window.currentEmailData.subject;
        document.getElementById('edit-body').value = window.currentEmailData.body;

        previewSection.style.display = 'none';
        editSection.style.display = 'block';
        btnEdit.textContent = '👁️ Preview';
        btnEdit.style.background = '#2196f3';
        modalTitle.textContent = '✏️ Edit Email';
        isEditMode = true;
      } else {
        // Switch to PREVIEW mode - save changes
        window.currentEmailData.to = document.getElementById('edit-to').value;
        window.currentEmailData.cc = document.getElementById('edit-cc').value;
        window.currentEmailData.subject = document.getElementById('edit-subject').value;
        window.currentEmailData.body = document.getElementById('edit-body').value;

        // Update preview
        document.getElementById('preview-to').textContent = window.currentEmailData.to;
        document.getElementById('preview-subject').textContent = window.currentEmailData.subject;
        document.getElementById('preview-body').textContent = window.currentEmailData.body;

        previewSection.style.display = 'block';
        editSection.style.display = 'none';
        btnEdit.textContent = '✏️ Edit Email';
        btnEdit.style.background = '#ff9800';
        modalTitle.textContent = '📧 Email Preview';
        isEditMode = false;
      }
    }

    async function sendEditedEmail() {
      if (!currentSubmissionId) return;

      // If in edit mode, save changes first
      if (isEditMode) {
        window.currentEmailData.to = document.getElementById('edit-to').value;
        window.currentEmailData.cc = document.getElementById('edit-cc').value;
        window.currentEmailData.subject = document.getElementById('edit-subject').value;
        window.currentEmailData.body = document.getElementById('edit-body').value;
      }

      const to = window.currentEmailData.to.trim();
      const cc = window.currentEmailData.cc.trim();
      const subject = window.currentEmailData.subject.trim();
      const body = window.currentEmailData.body.trim();

      if (!to || !subject || !body) {
        alert('⚠️ Please fill in all fields');
        return;
      }

      console.log('Sending email with data:', { to, cc, subject, body });

      if (!confirm('Send this email to ' + to + (cc ? ' (CC: ' + cc + ')' : '') + '?')) return;

      try {
        const res = await fetch('/approval/api/send-edited/' + currentSubmissionId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, cc, subject, body })
        });

        const result = await res.json();

        if (result.success) {
          alert('✅ Email sent successfully!');
          closeModal('email-modal');
          location.reload();
        } else {
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }

    async function saveToDrafts() {
      if (!currentSubmissionId) return;

      // If in edit mode, save changes first
      if (isEditMode) {
        window.currentEmailData.to = document.getElementById('edit-to').value;
        window.currentEmailData.cc = document.getElementById('edit-cc').value;
        window.currentEmailData.subject = document.getElementById('edit-subject').value;
        window.currentEmailData.body = document.getElementById('edit-body').value;
      }

      const to = window.currentEmailData.to.trim();
      const cc = window.currentEmailData.cc.trim();
      const subject = window.currentEmailData.subject.trim();
      const body = window.currentEmailData.body.trim();

      if (!to || !subject || !body) {
        alert('⚠️ Please fill in all fields');
        return;
      }

      console.log('Opening Gmail draft with data:', { to, cc, subject, body });

      // Body already contains everything needed (email content + signature)
      const fullBody = body;

      // Encode for URL
      const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1' +
        '&to=' + encodeURIComponent(to) +
        (cc ? '&cc=' + encodeURIComponent(cc) : '') +
        '&su=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(fullBody);

      // Open Gmail in new tab
      window.open(gmailUrl, '_blank');

      alert('✅ Gmail opened in new tab!\\n\\nThe email is pre-filled. You can:\\n1. Review and edit if needed\\n2. Attach your resume PDF\\n3. Save as draft (just close the tab)\\n4. Or send directly from Gmail');

      closeModal('email-modal');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('visible');

      // Reset to preview mode when closing email modal
      if (modalId === 'email-modal' && isEditMode) {
        isEditMode = false;
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('edit-section').style.display = 'none';
        document.getElementById('btn-edit').textContent = '✏️ Edit Email';
        document.getElementById('btn-edit').style.background = '#ff9800';
        document.getElementById('modal-title').textContent = '📧 Email Preview';
      }
    }

    function requestChanges(id) {
      currentSubmissionId = id;
      document.getElementById('change-instructions').value = '';
      document.getElementById('changes-modal').classList.add('visible');
    }

    async function submitChanges() {
      const instructions = document.getElementById('change-instructions').value.trim();

      if (!instructions) {
        alert('⚠️ Please provide change instructions');
        return;
      }

      if (!confirm('Regenerate resume with these instructions?')) return;

      try {
        const res = await fetch('/approval/api/regenerate/' + currentSubmissionId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructions })
        });

        const result = await res.json();

        if (result.success) {
          alert('✅ Resume regenerated successfully! The updated resume is now in the queue.');
          closeModal('changes-modal');
          location.reload();
        } else {
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }

    async function approve(id) {
      if (!confirm('Send this resume to the recruiter?')) return;

      try {
        const res = await fetch('/approval/api/approve/' + id, { method: 'POST' });
        const result = await res.json();

        if (result.success) {
          alert('✅ Resume sent successfully!');
          location.reload();
        } else {
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }

    async function deleteSubmission(id) {
      if (!confirm('Delete this submission?')) return;

      try {
        const res = await fetch('/approval/api/delete/' + id, { method: 'POST' });
        const result = await res.json();

        if (result.success) {
          alert('✅ Submission deleted');
          location.reload();
        } else {
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }

    function clearJDInput() {
      document.getElementById('jd-input').value = '';
    }

    async function processJD() {
      const jdText = document.getElementById('jd-input').value.trim();

      if (!jdText) {
        alert('⚠️ Please paste a job description');
        return;
      }

      if (jdText.length < 50) {
        alert('⚠️ JD seems too short. Please paste the full job description.');
        return;
      }

      // Show processing status
      const statusDiv = document.getElementById('processing-status');
      const messageSpan = document.getElementById('processing-message');
      statusDiv.style.display = 'block';
      messageSpan.textContent = 'Processing JD...';

      try {
        // Step 1: Parse JD
        messageSpan.textContent = '1/4 Parsing job description...';
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Generate resume
        messageSpan.textContent = '2/4 Generating tailored resume...';
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Validate
        messageSpan.textContent = '3/4 Validating resume...';
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 4: Render PDF
        messageSpan.textContent = '4/4 Rendering PDF...';

        const res = await fetch('/approval/api/process-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jdText })
        });

        const result = await res.json();

        if (result.success) {
          statusDiv.style.display = 'none';
          alert(\`✅ Resume generated successfully!\\n\\nRole: \${result.role}\\nCloud: \${result.cloud}\\nLocation: \${result.location}\`);

          // Clear input and reload
          clearJDInput();
          location.reload();
        } else {
          statusDiv.style.display = 'none';
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        statusDiv.style.display = 'none';
        alert('❌ Error: ' + error.message);
      }
    }
  </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // POST /approval/api/approve/:id
  if (url.pathname.startsWith('/approval/api/approve/') && req.method === 'POST') {
    const id = url.pathname.split('/').pop();
    const queue = await loadQueue();
    const submission = queue.find(s => s.id === id);

    if (!submission) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Submission not found' }));
      return;
    }

    try {
      // Send email with resume
      const result = await renderAndEmail({
        latex: submission.latex,
        to: submission.parsedData.recruiterEmail,
        cc: 'Srinu@blueridgeinfotech.com',
        subject: submission.emailSubject,
        body: submission.emailBody,
        filenameBase: 'Nihal_Veeramalla_Resume'
      });

      if (result.success) {
        submission.status = 'approved';
        submission.approvedAt = Date.now();
        await saveQueue(queue);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: result.messageId }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.error }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // POST /approval/api/delete/:id
  if (url.pathname.startsWith('/approval/api/delete/') && req.method === 'POST') {
    const id = url.pathname.split('/').pop();
    let queue = await loadQueue();
    const initialLength = queue.length;

    queue = queue.filter(s => s.id !== id);

    if (queue.length === initialLength) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Submission not found' }));
      return;
    }

    await saveQueue(queue);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // POST /approval/api/regenerate/:id
  if (url.pathname.startsWith('/approval/api/regenerate/') && req.method === 'POST') {
    const id = url.pathname.split('/').pop();

    // Read request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { instructions } = JSON.parse(body);

    const queue = await loadQueue();
    const submission = queue.find(s => s.id === id);

    if (!submission) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Submission not found' }));
      return;
    }

    try {
      console.log(`\n🔄 Regenerating resume for: ${submission.parsedData.role}`);
      console.log(`Instructions: ${instructions}\n`);

      // Store instructions in submission
      if (!submission.changeHistory) {
        submission.changeHistory = [];
      }
      submission.changeHistory.push({
        timestamp: Date.now(),
        instructions
      });

      // Regenerate resume with same parameters
      const latex = tailorResume({
        cloud: submission.parsedData.cloud,
        role: submission.parsedData.role,
        location: submission.parsedData.location
      });

      // Validate
      const validation = validateResume(latex, submission.parsedData.cloud);
      if (!validation.ok) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Validation failed: ' + validation.errors.join(', ')
        }));
        return;
      }

      // Render PDF
      const pdfResult = await renderPDF(latex, 'Nihal_Veeramalla_Resume');
      if (!pdfResult.success) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: pdfResult.error }));
        return;
      }

      // Update submission
      submission.latex = latex;
      submission.pdfPath = pdfResult.pdfPath;
      submission.texPath = pdfResult.texPath || '';
      submission.validation = validation;
      submission.lastRegenerated = Date.now();

      await saveQueue(queue);

      console.log(`✅ Resume regenerated successfully`);
      console.log(`New PDF: ${pdfResult.pdfPath}\n`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        pdfPath: pdfResult.pdfPath,
        message: 'Resume regenerated with your instructions'
      }));
    } catch (error) {
      console.error('❌ Regeneration error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // POST /approval/api/process-jd
  if (url.pathname === '/approval/api/process-jd' && req.method === 'POST') {
    // Read request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { jdText } = JSON.parse(body);

    if (!jdText || jdText.length < 50) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid JD text' }));
      return;
    }

    try {
      console.log('\n🚀 Processing JD from dashboard with AI customization...\n');

      // Step 1: Parse JD
      console.log('Step 1: Parsing JD...');
      const parsed = parseJD(jdText);
      console.log(`  Role: ${parsed.role}`);
      console.log(`  Cloud: ${parsed.cloud}`);
      console.log(`  Location: ${parsed.location}`);

      // Step 2: Get base resume template
      console.log('Step 2: Getting base resume template...');
      const baseLatex = tailorResume({
        cloud: parsed.cloud,
        role: parsed.role,
        location: parsed.location
      });
      console.log(`  Base template: ${baseLatex.length} chars of LaTeX`);

      // Step 3: AI-powered customization
      console.log('Step 3: AI customizing resume and email...');
      console.log('  (This may take 10-20 seconds)');

      let aiResult;
      try {
        aiResult = await aiCustomizeApplication(
          baseLatex,
          jdText,
          {
            name: 'Nihal Veeramalla',
            email: 'nihal.veeramalla@gmail.com',
            phone: '313-288-2859',
            title: 'Data Scientist'
          }
        );
        console.log(`  ✅ AI Analysis: ${aiResult.analysis.title}`);
        console.log(`  ✅ Required Skills: ${aiResult.analysis.requiredSkills.slice(0, 3).join(', ')}`);
        console.log(`  ✅ Customized Resume: ${aiResult.customizedResume.length} chars`);
        console.log(`  ✅ Email Subject: ${aiResult.email.subject}`);
      } catch (aiError) {
        console.warn('  ⚠️  AI customization failed, falling back to base template');
        console.warn(`  Error: ${aiError.message}`);
        // Fallback to base template if AI fails
        aiResult = {
          customizedResume: baseLatex,
          email: {
            subject: `Application – ${parsed.role} – Nihal Veeramalla`,
            body: `Hi ${parsed.recruiterName || 'Hiring Manager'},\n\n` +
              `I'm interested in the ${parsed.role} role${parsed.location ? ' in ' + parsed.location : ''}. ` +
              `I've built production agentic systems and RAG-backed assistants, integrated them with enterprise microservices, ` +
              `and shipped low-latency model serving with strong observability and governance. ` +
              `At Fiserv, I delivered an internal copilot that combined multi-agent orchestration, retrieval, and private LLMs, ` +
              `integrated via REST/gRPC with existing services.\n\n` +
              `I've attached my resume for your review.\n\n` +
              `--\n` +
              `Thanks & Regards,\n` +
              `Nihal Veeramalla\n` +
              `Data Scientist\n` +
              `Linkedin: https://www.linkedin.com/in/nihal-veeramalla/\n` +
              `Ph: 313-288-2859\n` +
              `Email: nihal.veeramalla@gmail.com`
          },
          analysis: {
            title: parsed.role,
            requiredSkills: [],
            preferredSkills: [],
            keyResponsibilities: [],
            cloudPlatform: parsed.cloud,
            experience: '',
            technologies: [],
            keywords: [],
            tone: 'formal'
          }
        };
      }

      const latex = aiResult.customizedResume;

      // Step 4: Validate
      console.log('Step 4: Validating customized resume...');
      const validation = validateResume(latex, parsed.cloud);
      if (!validation.ok) {
        console.error('  Validation failed:', validation.errors);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Validation failed: ' + validation.errors.join(', ')
        }));
        return;
      }
      console.log('  ✅ Validation passed');

      // Step 5: Render PDF
      console.log('Step 5: Rendering PDF...');
      const pdfResult = await renderPDF(latex, 'Nihal_Veeramalla_Resume');
      if (!pdfResult.success) {
        console.error('  PDF rendering failed:', pdfResult.error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: pdfResult.error }));
        return;
      }
      console.log(`  ✅ PDF: ${pdfResult.pdfPath}`);

      // Step 6: Create submission
      const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const emailSubject = aiResult.email.subject;
      const emailBody = aiResult.email.body;

      const submission = {
        id: submissionId,
        timestamp: Date.now(),
        jd: jdText,
        parsedData: {
          role: parsed.role,
          cloud: parsed.cloud,
          location: parsed.location,
          recruiterEmail: parsed.recruiterEmail || '',
          recruiterName: parsed.recruiterName || '',
          company: parsed.company || ''
        },
        latex,
        pdfPath: pdfResult.pdfPath,
        texPath: pdfResult.texPath || '',
        emailSubject,
        emailBody,
        validation,
        status: 'pending',
        srinuChatId: '',
        source: 'dashboard'
      };

      // Add to queue
      const queue = await loadQueue();
      queue.push(submission);
      await saveQueue(queue);

      console.log(`✅ Submission created: ${submissionId}\n`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        submissionId,
        role: parsed.role,
        cloud: parsed.cloud,
        location: parsed.location,
        pdfPath: pdfResult.pdfPath
      }));
    } catch (error) {
      console.error('❌ Error processing JD:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // POST /approval/api/send-edited/:id
  if (url.pathname.startsWith('/approval/api/send-edited/') && req.method === 'POST') {
    const id = url.pathname.split('/').pop();

    // Read request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { to, subject, body: emailBody } = JSON.parse(body);

    const queue = await loadQueue();
    const submission = queue.find(s => s.id === id);

    if (!submission) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Submission not found' }));
      return;
    }

    try {
      console.log(`\n✉️ Sending edited email for: ${submission.parsedData.role}`);

      const result = await renderAndEmail({
        latex: submission.latex,
        to,
        cc: 'Srinu@blueridgeinfotech.com',
        subject,
        body: emailBody,
        filenameBase: 'Nihal_Veeramalla_Resume'
      });

      if (result.success) {
        submission.status = 'approved';
        submission.approvedAt = Date.now();
        submission.emailSubject = subject;
        submission.emailBody = emailBody;
        submission.parsedData.recruiterEmail = to;
        await saveQueue(queue);

        console.log(`✅ Email sent successfully\n`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: result.messageId }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.error }));
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // POST /approval/api/save-draft/:id
  if (url.pathname.startsWith('/approval/api/save-draft/') && req.method === 'POST') {
    const id = url.pathname.split('/').pop();

    // Read request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { to, subject, body: emailBody } = JSON.parse(body);

    const queue = await loadQueue();
    const submission = queue.find(s => s.id === id);

    if (!submission) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Submission not found' }));
      return;
    }

    try {
      console.log(`\n📥 Creating draft for: ${submission.parsedData.role}`);

      // Create draft ID
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Read PDF file
      const pdfBuffer = await fs.readFile(submission.pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Create .eml file content with attachment
      const boundary = `----=_Part_${Date.now()}`;
      const emlContent = [
        `To: ${to}`,
        `Cc: Srinu@blueridgeinfotech.com`,
        `From: ${process.env.FROM_EMAIL || 'nihal.veeramalla@gmail.com'}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        emailBody,
        ``,
        `--${boundary}`,
        `Content-Type: application/pdf; name="Nihal_Veeramalla_Resume.pdf"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="Nihal_Veeramalla_Resume.pdf"`,
        ``,
        pdfBase64,
        ``,
        `--${boundary}--`
      ].join('\r\n');

      // Save .eml file
      const draftsDir = './data/drafts';
      await fs.mkdir(draftsDir, { recursive: true });
      const emlPath = path.join(draftsDir, `${draftId}.eml`);
      await fs.writeFile(emlPath, emlContent);

      console.log(`✅ Draft saved: ${emlPath}\n`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        draftId,
        emlPath
      }));
    } catch (error) {
      console.error('❌ Error creating draft:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // GET /approval/api/download-draft/:id
  if (url.pathname.startsWith('/approval/api/download-draft/') && req.method === 'GET') {
    const draftId = url.pathname.split('/').pop();
    const emlPath = path.join('./data/drafts', `${draftId}.eml`);

    try {
      const emlContent = await fs.readFile(emlPath);
      res.writeHead(200, {
        'Content-Type': 'message/rfc822',
        'Content-Disposition': `attachment; filename="${draftId}.eml"`
      });
      res.end(emlContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Draft not found');
    }
    return;
  }

  // Serve PDF files
  if (url.pathname.startsWith('/pdf/') && req.method === 'GET') {
    const filename = decodeURIComponent(url.pathname.substring(5));
    const pdfPath = path.join(process.cwd(), 'outbox', filename);

    try {
      const pdfData = await fs.readFile(pdfPath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`
      });
      res.end(pdfData);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('PDF not found');
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('================================================================================');
  console.log('📋 Approval Dashboard (Standalone Mode)');
  console.log('================================================================================');
  console.log('');
  console.log(`🌐 Dashboard: http://localhost:${PORT}/approval`);
  console.log('');
  console.log('✅ Running without WhatsApp integration');
  console.log('✅ You can review and approve queued submissions');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('================================================================================');
  console.log('');
});
