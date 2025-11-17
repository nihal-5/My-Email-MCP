#!/usr/bin/env node
/**
 * Test Email JD → Dashboard Flow
 * Simulates receiving a JD via email and processing it to the dashboard
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

async function testEmailToRecruiterJD() {
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

        // Find the first recruiter JD email (Gen AI Specialist or Agentic AI)
        const start = Math.max(1, total - 20);
        
        console.log(`🔍 Searching last 20 emails for recruiter JDs...\n`);

        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: '',
          struct: true
        });

        let recruiterEmail = null;

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
              const subject = parsed.subject || '';
              const fromEmail = parsed.from?.value[0]?.address || '';

              // Look for recruiter JD emails
              const isRecruiterJD = (
                (subject.toLowerCase().includes('specialist') || 
                 subject.toLowerCase().includes('engineer') || 
                 subject.toLowerCase().includes('developer')) &&
                !fromEmail.includes('linkedin.com') &&
                !fromEmail.includes('noreply')
              );

              if (isRecruiterJD && !recruiterEmail) {
                recruiterEmail = parsed;
                console.log(`✅ Found recruiter JD email!\n`);
                console.log(`From: ${parsed.from?.text}`);
                console.log(`Email: ${fromEmail}`);
                console.log(`Subject: ${subject}`);
                console.log(`Date: ${parsed.date}\n`);
              }

            } catch (error) {
              console.error('Error parsing email:', error.message);
            }
          });
        });

        fetch.once('end', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (!recruiterEmail) {
            console.log('❌ No recruiter JD found in last 20 emails\n');
            imap.end();
            resolve();
            return;
          }

          // Process the recruiter email
          console.log('━'.repeat(100));
          console.log('\n🚀 PROCESSING JD EMAIL TO DASHBOARD\n');
          console.log('━'.repeat(100));
          console.log('\n');

          try {
            const textContent = recruiterEmail.text || recruiterEmail.html || '';
            const fromEmail = recruiterEmail.from?.value[0]?.address || '';
            const fromName = recruiterEmail.from?.value[0]?.name || fromEmail.split('@')[0];

            // Create session file (same as email-monitor does)
            const timestamp = new Date().toISOString();
            const sessionFile = path.join(
              process.cwd(),
              'data',
              'session',
              `email_test_${timestamp.replace(/[:.]/g, '-')}.json`
            );

            await fs.mkdir(path.dirname(sessionFile), { recursive: true });

            const sessionData = {
              source: 'email',
              timestamp,
              recruiterEmail: fromEmail,
              recruiterName: fromName,
              subject: recruiterEmail.subject,
              jdText: textContent,
              messageId: recruiterEmail.messageId
            };

            await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
            
            console.log(`📝 Created session file: ${sessionFile}\n`);

            // Call orchestrator
            console.log('🤖 Calling Python orchestrator...\n');
            
            const cmd = `cd ${process.cwd()}/orchestrator && python main.py "${sessionFile}"`;
            const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

            if (stderr) {
              console.log('📋 Orchestrator Log:\n');
              console.log(stderr);
              console.log('\n');
            }

            if (stdout) {
              console.log('✅ Orchestrator Result:\n');
              const result = JSON.parse(stdout);
              console.log(JSON.stringify(result, null, 2));
              console.log('\n');
            }

            console.log('━'.repeat(100));
            console.log('\n✅ SUCCESS! Check dashboard at http://localhost:3000\n');
            console.log('━'.repeat(100));
            console.log('\n');

            // Check approval queue
            const queuePath = path.join(process.cwd(), 'data', 'approval-queue.json');
            try {
              const queueData = await fs.readFile(queuePath, 'utf8');
              const queue = JSON.parse(queueData);
              
              console.log(`📊 Approval Queue Status:\n`);
              console.log(`Total submissions: ${queue.submissions?.length || 0}`);
              
              if (queue.submissions && queue.submissions.length > 0) {
                const latest = queue.submissions[queue.submissions.length - 1];
                console.log(`\nLatest submission:`);
                console.log(`  ID: ${latest.id}`);
                console.log(`  Status: ${latest.status}`);
                console.log(`  Role: ${latest.parsedData?.role || 'N/A'}`);
                console.log(`  Cloud: ${latest.parsedData?.cloud || 'N/A'}`);
                console.log(`  Recruiter: ${latest.parsedData?.recruiterEmail || 'N/A'}`);
                console.log(`  Created: ${new Date(latest.timestamp).toLocaleString()}`);
              }
              console.log('\n');

            } catch (e) {
              console.log('Note: Could not read approval queue\n');
            }

            console.log('🌐 Dashboard URL: http://localhost:3000');
            console.log('📧 No emails were sent automatically - manual approval required!\n');

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

// Run test
console.log('🧪 TESTING EMAIL JD → DASHBOARD WORKFLOW\n');
console.log('━'.repeat(100));
console.log('\n');

testEmailToRecruiterJD()
  .then(() => {
    console.log('✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
