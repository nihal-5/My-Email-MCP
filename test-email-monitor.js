#!/usr/bin/env node
/**
 * Manual Email Monitor Test
 * Checks for latest email and processes if it's a JD
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🔧 Email Monitor Test Configuration:');
console.log(`   User: ${config.user}`);
console.log(`   Host: ${config.host}:${config.port}`);
console.log(`   Password: ${config.password ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!config.user || !config.password) {
  console.error('❌ ERROR: Gmail credentials not configured!');
  console.error('   Set GMAIL_USER and GMAIL_APP_PASSWORD in .env file');
  process.exit(1);
}

/**
 * Check if text contains job description indicators
 */
function isJobDescription(subject, content) {
  const subjectLower = subject.toLowerCase();
  const contentLower = content.toLowerCase();

  // Job-related subject keywords
  const jobSubjectKeywords = [
    'job', 'position', 'opportunity', 'opening', 'hiring', 'career',
    'role', 'vacancy', 'engineer', 'developer', 'scientist', 'analyst',
    'manager', 'consultant', 'architect', 'specialist'
  ];

  const hasJobSubject = jobSubjectKeywords.some(keyword => subjectLower.includes(keyword));

  // Strong JD content indicators
  const jdIndicators = [
    /\b(years?|yrs?) of experience\b/i,
    /\b(bachelor'?s?|master'?s?|phd|degree)\b/i,
    /\b(required skills?|qualifications?|requirements?)\b/i,
    /\b(responsibilities|duties|role)\b/i,
    /\b(competitive salary|compensation|benefits)\b/i,
    /\b(apply|submit (your )?resume|send cv)\b/i,
    /\b(remote|hybrid|on-?site|location)\b/i,
    /\b(full-?time|part-?time|contract|freelance)\b/i,
    /\b(python|java|javascript|react|node|aws|azure|gcp)\b/i,
    /\b(team|company|organization) is (looking for|seeking|hiring)\b/i
  ];

  const matchCount = jdIndicators.filter(pattern => pattern.test(content)).length;

  return {
    isJD: (hasJobSubject && matchCount >= 3) || matchCount >= 5,
    hasJobSubject,
    matchCount
  };
}

/**
 * Fetch and process latest email
 */
async function checkLatestEmail() {
  return new Promise((resolve, reject) => {
    console.log('📧 Connecting to Gmail IMAP...\n');

    const imap = new Imap(config);

    imap.once('ready', () => {
      console.log('✅ Connected to Gmail successfully!\n');

      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`📬 Inbox Status:`);
        console.log(`   Total messages: ${box.messages.total}`);
        console.log(`   Unread: ${box.messages.new}`);
        console.log('');

        if (box.messages.total === 0) {
          console.log('❌ No emails found in inbox');
          imap.end();
          resolve();
          return;
        }

        // Fetch the latest email (highest sequence number)
        const fetch = imap.seq.fetch(`${box.messages.total}:*`, {
          bodies: '',
          struct: true
        });

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
              
              console.log('📧 Latest Email Details:');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(`From: ${parsed.from?.text || 'Unknown'}`);
              console.log(`Subject: ${parsed.subject || 'No Subject'}`);
              console.log(`Date: ${parsed.date || 'Unknown'}`);
              console.log(`Message ID: ${parsed.messageId || 'Unknown'}`);
              console.log('');

              const textContent = parsed.text || parsed.html?.substring(0, 1000) || '';
              console.log('📝 Content Preview (first 500 chars):');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(textContent.substring(0, 500));
              console.log(textContent.length > 500 ? '...\n' : '\n');

              // Check if it's a JD
              const jdCheck = isJobDescription(parsed.subject || '', textContent);
              
              console.log('🔍 JD Detection Analysis:');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(`   Job-related subject: ${jdCheck.hasJobSubject ? '✅' : '❌'}`);
              console.log(`   JD indicators found: ${jdCheck.matchCount}/10`);
              console.log(`   Is JD: ${jdCheck.isJD ? '✅ YES' : '❌ NO'}`);
              console.log('');

              if (jdCheck.isJD) {
                console.log('🚀 Processing as Job Description...\n');
                
                // Create session file
                const timestamp = new Date().toISOString();
                const sessionFile = path.join(
                  process.cwd(),
                  'data',
                  'session',
                  `email_${timestamp.replace(/[:.]/g, '-')}.json`
                );

                await fs.mkdir(path.dirname(sessionFile), { recursive: true });

                const sessionData = {
                  source: 'email',
                  timestamp,
                  recruiterEmail: parsed.from?.value[0]?.address || '',
                  recruiterName: parsed.from?.value[0]?.name || parsed.from?.value[0]?.address?.split('@')[0] || '',
                  subject: parsed.subject || 'Job Opportunity',
                  jdText: textContent,
                  messageId: parsed.messageId
                };

                await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
                console.log(`✅ Session file saved: ${sessionFile}\n`);

                // Display session data
                console.log('📄 Session Data:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(JSON.stringify(sessionData, null, 2));
                console.log('');

                // Call orchestrator
                console.log('🤖 Calling Python orchestrator...\n');
                const cmd = `cd ${process.cwd()}/orchestrator && python main.py "${sessionFile}"`;
                
                try {
                  const { stdout, stderr } = await execAsync(cmd);
                  
                  if (stderr) {
                    console.log('⚠️  Orchestrator stderr:');
                    console.log(stderr);
                    console.log('');
                  }

                  if (stdout) {
                    console.log('✅ Orchestrator output:');
                    console.log(stdout);
                    console.log('');
                  }

                  console.log('✅ Email JD processed successfully!');
                } catch (error) {
                  console.error('❌ Orchestrator error:', error.message);
                }
              } else {
                console.log('ℹ️  Not a job description - skipping processing');
              }

              imap.end();
            } catch (error) {
              console.error('❌ Error parsing email:', error.message);
              imap.end();
            }
          });
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
          reject(err);
        });

        fetch.once('end', () => {
          console.log('\n✅ Fetch completed');
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err.message);
      reject(err);
    });

    imap.once('end', () => {
      console.log('\n🔌 IMAP connection closed');
      resolve();
    });

    imap.connect();
  });
}

// Run the test
console.log('🚀 Starting Email Monitor Test...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

checkLatestEmail()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
