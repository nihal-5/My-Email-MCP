#!/usr/bin/env node
/**
 * Check last 5 emails for JDs
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.GMAIL_USER || process.env.FROM_EMAIL || '',
  password: process.env.GMAIL_APP_PASSWORD || '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

function isJobDescription(subject, content) {
  const subjectLower = subject.toLowerCase();
  const contentLower = content.toLowerCase();

  const jobSubjectKeywords = [
    'job', 'position', 'opportunity', 'opening', 'hiring', 'career',
    'role', 'vacancy', 'engineer', 'developer', 'scientist', 'analyst'
  ];

  const hasJobSubject = jobSubjectKeywords.some(keyword => subjectLower.includes(keyword));

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

async function checkLast5Emails() {
  return new Promise((resolve, reject) => {
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

        if (total < 5) {
          console.log('Less than 5 emails in inbox');
          imap.end();
          resolve();
          return;
        }

        // Fetch last 5 emails
        const start = Math.max(1, total - 4);
        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: '',
          struct: true
        });

        let emailCount = 0;
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
              emailCount++;
              
              const textContent = parsed.text || parsed.html?.substring(0, 1000) || '';
              const jdCheck = isJobDescription(parsed.subject || '', textContent);
              
              emails.push({
                num: emailCount,
                from: parsed.from?.text || 'Unknown',
                subject: parsed.subject || 'No Subject',
                date: parsed.date,
                isJD: jdCheck.isJD,
                matchCount: jdCheck.matchCount
              });

            } catch (error) {
              console.error('Error parsing email:', error.message);
            }
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', () => {
          // Sort by number (newest last)
          emails.sort((a, b) => a.num - b.num);
          
          console.log('📧 Last 5 Emails:\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          emails.forEach((email, idx) => {
            console.log(`Email ${idx + 1} (${email.isJD ? '✅ IS JD' : '❌ NOT JD'} - ${email.matchCount}/10 indicators):`);
            console.log(`  From: ${email.from}`);
            console.log(`  Subject: ${email.subject}`);
            console.log(`  Date: ${email.date}`);
            console.log('');
          });
          
          const jdEmails = emails.filter(e => e.isJD);
          if (jdEmails.length > 0) {
            console.log(`\n✅ Found ${jdEmails.length} JD email(s)!`);
          } else {
            console.log('\n❌ No JD emails found in last 5 emails');
          }
          
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('end', () => {
      resolve();
    });

    imap.connect();
  });
}

checkLast5Emails()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
