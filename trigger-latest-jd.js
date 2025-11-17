#!/usr/bin/env node
/**
 * Manually Trigger Latest JD Email from Inbox
 * Processes the most recent recruiter JD and displays in dashboard
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();
const execAsync = promisify(exec);

const config = {
  user: process.env.GMAIL_USER || process.env.FROM_EMAIL || '',
  password: process.env.GMAIL_APP_PASSWORD || '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Check if email is a JD (same logic as email-monitor.ts)
function isJobDescription(email, content) {
  const subject = (email.subject || '').toLowerCase();
  const fromEmail = email.from?.value[0]?.address?.toLowerCase() || '';

  // Exclude replies
  const isReply = email.inReplyTo || 
                  email.references || 
                  subject.startsWith('re:') || 
                  subject.startsWith('fwd:') ||
                  subject.includes('re:') ||
                  subject.includes('fwd:');

  if (isReply) {
    return { isJD: false, reason: 'Reply/forwarded email' };
  }

  // Exclude known non-JD senders
  const excludedDomains = [
    'linkedin.com', 'noreply@', 'newsletters@', 'updates@', 'alerts@', 'notifications@'
  ];

  if (excludedDomains.some(domain => fromEmail.includes(domain))) {
    return { isJD: false, reason: `Excluded sender: ${fromEmail}` };
  }

  // Exclude newsletter subjects
  const excludedSubjects = [
    /newsletter/i, /digest/i, /alert/i, /notification/i, /update/i, /highlights/i,
    /weekly|monthly|daily/i, /new.*jobs.*match/i, /recommended.*for.*you/i
  ];

  if (excludedSubjects.some(pattern => pattern.test(subject))) {
    return { isJD: false, reason: 'Newsletter/alert subject' };
  }

  // Check for job title keywords
  const jobTitleKeywords = [
    'engineer', 'developer', 'scientist', 'analyst', 'manager',
    'architect', 'consultant', 'specialist', 'lead', 'senior'
  ];
  const hasJobTitle = jobTitleKeywords.some(title => subject.includes(title));

  // Check for location indicators
  const locationIndicators = [
    /\bin\s+[A-Z][a-z]+/, /[A-Z]{2}$/, /remote/i, /hybrid/i, /onsite/i, /on-site/i
  ];
  const hasLocation = locationIndicators.some(pattern => pattern.test(subject));

  // Strong signal: job title + location in subject
  if (hasJobTitle && hasLocation) {
    return { isJD: true, reason: 'Strong subject (job title + location)' };
  }

  // Check content indicators
  const coreIndicators = [
    /\b\d+\+?\s*(years?|yrs?)\s*(of)?\s*experience\b/i,
    /\b(bachelor'?s?|master'?s?|phd|degree)\b/i,
    /\b(required|must.have|should.have)\s+(skills?|qualifications?|experience)\b/i,
    /\bresume\b.*\b(submit|send|apply|attach)\b/i,
    /\bresponsibilities\s*:/i,
    /\brequirements\s*:/i,
    /\bqualifications\s*:/i
  ];

  const lowerContent = content.toLowerCase();
  const coreMatchCount = coreIndicators.filter(pattern => pattern.test(lowerContent)).length;

  if (hasJobTitle && coreMatchCount >= 2) {
    return { isJD: true, reason: `Job title + ${coreMatchCount} core indicators` };
  }

  if (coreMatchCount >= 5) {
    return { isJD: true, reason: `Strong content (${coreMatchCount} indicators)` };
  }

  return { isJD: false, reason: `Weak signals (title=${hasJobTitle}, core=${coreMatchCount})` };
}

async function processLatestJD() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    imap.once('ready', async () => {
      console.log('✅ Connected to Gmail\n');

      imap.openBox('INBOX', true, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const total = box.messages.total;
        console.log(`📬 Total emails in inbox: ${total}\n`);
        console.log('🔍 Searching for latest JD email...\n');
        console.log('━'.repeat(100));
        console.log('\n');

        // Check last 30 emails
        const start = Math.max(1, total - 29);
        
        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: '',
          struct: true
        });

        const emails = [];

        fetch.on('message', (msg) => {
          let emailBuffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              emailBuffer += chunk.toString('utf8');
            });
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(emailBuffer);
              const textContent = parsed.text || parsed.html || '';
              const classification = isJobDescription(parsed, textContent);

              emails.push({
                email: parsed,
                content: textContent,
                isJD: classification.isJD,
                reason: classification.reason,
                date: parsed.date
              });

            } catch (error) {
              console.error('Error parsing email:', error.message);
            }
          });
        });

        fetch.once('end', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Sort by date (newest first)
          emails.sort((a, b) => (b.date || 0) - (a.date || 0));

          // Display all emails checked
          console.log('📧 EMAILS CHECKED (Newest to Oldest):\n');
          
          emails.forEach((item, idx) => {
            const statusIcon = item.isJD ? '✅ JD' : '❌ NOT JD';
            console.log(`${idx + 1}. ${statusIcon}`);
            console.log(`   From: ${item.email.from?.text || 'Unknown'}`);
            console.log(`   Subject: ${item.email.subject || 'No subject'}`);
            console.log(`   Date: ${item.date ? item.date.toLocaleString() : 'Unknown'}`);
            console.log(`   Reason: ${item.reason}`);
            console.log('');
          });

          // Find latest JD
          const latestJD = emails.find(item => item.isJD);

          if (!latestJD) {
            console.log('━'.repeat(100));
            console.log('\n❌ No JD emails found in last 30 emails\n');
            console.log('All emails were either:');
            console.log('  • LinkedIn newsletters/alerts');
            console.log('  • Marketing/promotional emails');
            console.log('  • Reply/forwarded emails');
            console.log('  • Missing job indicators\n');
            imap.end();
            resolve();
            return;
          }

          console.log('━'.repeat(100));
          console.log('\n🎯 LATEST JD EMAIL FOUND!\n');
          console.log('━'.repeat(100));
          console.log('\n');
          console.log(`From: ${latestJD.email.from?.text}`);
          console.log(`Email: ${latestJD.email.from?.value[0]?.address}`);
          console.log(`Subject: ${latestJD.email.subject}`);
          console.log(`Date: ${latestJD.date.toLocaleString()}`);
          console.log(`Content Length: ${latestJD.content.length} chars`);
          console.log('\n');

          console.log('━'.repeat(100));
          console.log('\n🚀 PROCESSING TO DASHBOARD...\n');
          console.log('━'.repeat(100));
          console.log('\n');

          try {
            const fromEmail = latestJD.email.from?.value[0]?.address || '';
            const fromName = latestJD.email.from?.value[0]?.name || fromEmail.split('@')[0];

            // Create session file
            const timestamp = new Date().toISOString();
            const sessionFile = path.join(
              process.cwd(),
              'data',
              'session',
              `email_manual_${timestamp.replace(/[:.]/g, '-')}.json`
            );

            await fs.mkdir(path.dirname(sessionFile), { recursive: true });

            const sessionData = {
              source: 'email',
              timestamp,
              recruiterEmail: fromEmail,
              recruiterName: fromName,
              subject: latestJD.email.subject,
              jdText: latestJD.content,
              messageId: latestJD.email.messageId
            };

            await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
            
            console.log(`📝 Session file created: ${sessionFile}\n`);

            // Call orchestrator
            console.log('🤖 Calling Python orchestrator...\n');
            
            const cmd = `cd ${process.cwd()}/orchestrator && python main.py "${sessionFile}"`;
            const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

            if (stderr) {
              console.log('📋 Orchestrator Process Log:\n');
              stderr.split('\n').forEach(line => {
                if (line.trim()) console.log(`   ${line}`);
              });
              console.log('\n');
            }

            if (stdout) {
              console.log('✅ Orchestrator Result:\n');
              const result = JSON.parse(stdout);
              console.log(`   Role: ${result.role}`);
              console.log(`   Cloud: ${result.cloud}`);
              console.log(`   Location: ${result.location}`);
              console.log(`   Valid: ${result.validation?.ok}`);
              console.log(`   Submission ID: ${result.email_result?.submissionId}`);
              console.log('\n');
            }

            console.log('━'.repeat(100));
            console.log('\n✅ SUCCESS!\n');
            console.log('━'.repeat(100));
            console.log('\n');

            // Check approval queue
            const queuePath = path.join(process.cwd(), 'data', 'approval-queue.json');
            try {
              const queueData = await fs.readFile(queuePath, 'utf8');
              const queue = JSON.parse(queueData);
              
              if (queue.submissions && queue.submissions.length > 0) {
                const latest = queue.submissions[queue.submissions.length - 1];
                console.log('📊 DASHBOARD ENTRY:\n');
                console.log(`   Submission ID: ${latest.id}`);
                console.log(`   Status: ${latest.status}`);
                console.log(`   Role: ${latest.parsedData?.role || 'N/A'}`);
                console.log(`   Cloud: ${latest.parsedData?.cloud || 'N/A'}`);
                console.log(`   Location: ${latest.parsedData?.location || 'N/A'}`);
                console.log(`   Recruiter: ${latest.parsedData?.recruiterEmail || 'N/A'}`);
                console.log(`   Created: ${new Date(latest.timestamp).toLocaleString()}`);
                console.log('\n');
              }

            } catch (e) {
              console.log('   Note: Could not read approval queue file\n');
            }

            console.log('━'.repeat(100));
            console.log('\n');
            console.log('🌐 VIEW IN DASHBOARD: http://localhost:3000\n');
            console.log('📧 NO EMAIL SENT - Waiting for your approval!\n');
            console.log('━'.repeat(100));
            console.log('\n');

          } catch (error) {
            console.error('❌ Error processing JD:', error.message);
            if (error.stack) {
              console.error(error.stack);
            }
          }

          imap.end();
          resolve();
        });

        fetch.once('error', (err) => {
          reject(err);
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

// Run
console.log('\n');
console.log('━'.repeat(100));
console.log('  🎯 MANUAL JD TRIGGER - Latest Email from Inbox');
console.log('━'.repeat(100));
console.log('\n');

processLatestJD()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
