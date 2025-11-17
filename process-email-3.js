#!/usr/bin/env node
/**
 * Process specific email by index (Email #3 - Gen AI Specialist)
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

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

async function processEmailByIndex(emailIndex) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Fetching email #${emailIndex} from inbox...\n`);

    const imap = new Imap(config);

    imap.once('ready', () => {
      console.log('✅ Connected to Gmail\n');

      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const total = box.messages.total;
        console.log(`📬 Total emails: ${total}\n`);

        // Calculate sequence number 
        // Email #1 = total - 4, #2 = total - 3, #3 = total - 2, #4 = total - 1, #5 = total
        const seqNum = total - (5 - emailIndex);
        
        console.log(`📧 Target: Email #${emailIndex} from the last 5`);
        console.log(`📧 Fetching sequence #${seqNum}...\n`);

        const fetch = imap.seq.fetch(`${seqNum}:${seqNum}`, {
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
              
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('📧 EMAIL DETAILS');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              console.log(`From: ${parsed.from?.text || 'Unknown'}`);
              console.log(`Subject: ${parsed.subject || 'No Subject'}`);
              console.log(`Date: ${parsed.date || 'Unknown'}`);
              console.log(`Message ID: ${parsed.messageId || 'Unknown'}\n`);

              const textContent = parsed.text || parsed.html || '';
              
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('📄 EMAIL CONTENT');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              console.log(textContent.substring(0, 1500));
              if (textContent.length > 1500) console.log('\n...(truncated)');
              console.log('\n');

              // Create session file
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('💾 CREATING SESSION FILE');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
              console.log(`📄 Session data:`);
              console.log(`   Source: ${sessionData.source}`);
              console.log(`   Recruiter: ${sessionData.recruiterName} <${sessionData.recruiterEmail}>`);
              console.log(`   Subject: ${sessionData.subject}\n`);

              // Call orchestrator
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('🤖 CALLING PYTHON ORCHESTRATOR');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

              const cmd = `cd ${process.cwd()}/orchestrator && python main.py "${sessionFile}"`;
              
              console.log(`Command: ${cmd}\n`);

              try {
                const { stdout, stderr } = await execAsync(cmd);
                
                if (stderr) {
                  console.log('📋 Orchestrator Process Log:');
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.log(stderr);
                  console.log('');
                }

                if (stdout) {
                  console.log('✅ Orchestrator Result:');
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.log(stdout);
                  console.log('');
                }

                // Parse the result to show email preview
                try {
                  const result = JSON.parse(stdout);
                  if (result.email_result?.body) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📧 GENERATED EMAIL PREVIEW');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    console.log(`Subject: ${result.email_result.subject}\n`);
                    console.log('Body:');
                    console.log(result.email_result.body);
                    console.log('\n');
                    
                    // Check if it starts with "Thank you for reaching out"
                    if (result.email_result.body.includes('Thank you for reaching out')) {
                      console.log('✅ ✅ ✅ SOURCE-AWARE EMAIL WORKING! ✅ ✅ ✅');
                      console.log('Email correctly uses "Thank you for reaching out" opening!');
                    } else if (result.email_result.body.includes('I came across')) {
                      console.log('⚠️  WARNING: Email uses "I came across" instead of "Thank you for reaching out"');
                    }
                  }
                } catch (parseError) {
                  // Couldn't parse JSON, that's okay
                }

                console.log('\n✅ Email JD processed successfully!');
              } catch (error) {
                console.error('❌ Orchestrator error:', error.message);
                if (error.stdout) console.log('Stdout:', error.stdout);
                if (error.stderr) console.log('Stderr:', error.stderr);
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

console.log('🚀 Processing Email #3 (Gen AI Specialist from Shubham Dwivedi)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

processEmailByIndex(3)
  .then(() => {
    console.log('\n✅ Processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Processing failed:', error.message);
    process.exit(1);
  });
