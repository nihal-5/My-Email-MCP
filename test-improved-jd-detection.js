#!/usr/bin/env node
/**
 * Test improved JD detection on last 10 emails
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

function improvedJDDetection(email, content) {
  const subject = email.subject?.toLowerCase() || '';
  const lowerContent = content.toLowerCase();
  const fromEmail = email.from?.value[0]?.address?.toLowerCase() || '';

  // EXCLUDE: Known non-JD senders
  const excludedDomains = [
    'linkedin.com', 'noreply@', 'newsletters@', 'updates@', 'alerts@', 'notifications@'
  ];
  const isExcludedSender = excludedDomains.some(domain => fromEmail.includes(domain));

  // EXCLUDE: Newsletter/marketing patterns
  const excludedSubjectPatterns = [
    /newsletter/i, /digest/i, /alert/i, /notification/i, /update/i, /highlights/i,
    /weekly|monthly|daily/i, /new.*jobs.*match/i, /recommended.*for.*you/i
  ];
  const hasExcludedSubject = excludedSubjectPatterns.some(pattern => pattern.test(subject));

  // Job title keywords
  const jobTitleKeywords = [
    'engineer', 'developer', 'scientist', 'analyst', 'manager',
    'architect', 'consultant', 'specialist', 'lead', 'senior'
  ];
  const hasJobTitle = jobTitleKeywords.some(title => subject.includes(title));

  // Location indicators
  const locationIndicators = [
    /\bin\s+[A-Z][a-z]+/, /[A-Z]{2}$/, /remote/i, /hybrid/i, /onsite/i, /on-site/i
  ];
  const hasLocation = locationIndicators.some(pattern => pattern.test(subject));
  const hasStrongSubject = hasJobTitle && hasLocation;

  // Core JD indicators
  const coreJDIndicators = [
    /\b\d+\+?\s*(years?|yrs?)\s*(of)?\s*experience\b/i,
    /\b(bachelor'?s?|master'?s?|phd|degree)\b/i,
    /\b(required|must.have|should.have)\s+(skills?|qualifications?|experience)\b/i,
    /\bresume\b.*\b(submit|send|apply|attach)\b/i,
    /\bresponsibilities\s*:/i,
    /\brequirements\s*:/i,
    /\bqualifications\s*:/i,
    /\b(full.?time|part.?time|contract|w2|c2c|1099)\b/i,
    /\b(competitive\s+)?(salary|compensation|pay|rate)\b/i,
    /\bbenefits\b/i,
    /\blocation\s*:/i,
    /\bapply\b.*\b(now|today|here|link)\b/i
  ];
  const coreMatchCount = coreJDIndicators.filter(pattern => pattern.test(content)).length;

  // Technical keywords
  const technicalKeywords = [
    /\b(python|java|javascript|typescript|react|node|angular|vue)\b/i,
    /\b(aws|azure|gcp|cloud)\b/i,
    /\b(sql|nosql|mongodb|postgres|mysql)\b/i,
    /\b(docker|kubernetes|terraform|jenkins)\b/i,
    /\b(machine.learning|deep.learning|ai|ml|data.science)\b/i,
    /\b(tensorflow|pytorch|scikit.learn|keras)\b/i,
    /\b(api|rest|graphql|microservices)\b/i,
    /\b(git|github|gitlab|version.control)\b/i
  ];
  const hasTechnicalContent = technicalKeywords.some(pattern => pattern.test(content));

  // Decision logic - UPDATED to not miss any recruiter JDs
  let isJD = false;
  let reason = '';

  if (isExcludedSender) {
    reason = `Excluded sender: ${fromEmail}`;
  } else if (hasExcludedSubject) {
    reason = `Excluded subject pattern`;
  } else if (hasStrongSubject) {
    // Job title + location = definitely a JD!
    isJD = true;
    reason = `Strong subject (job title + location)`;
  } else if (hasJobTitle) {
    // Job title + any signal
    const hasJobOpportunityKeywords = /\b(opportunity|opening|hiring|position|role|vacancy)\b/i.test(subject);
    if (coreMatchCount >= 2 || hasTechnicalContent || hasJobOpportunityKeywords) {
      isJD = true;
      reason = `Job title + signals (core=${coreMatchCount}, tech=${hasTechnicalContent})`;
    } else {
      reason = `Job title but weak signals (core=${coreMatchCount}/12, tech=${hasTechnicalContent})`;
    }
  } else if (coreMatchCount >= 6) {
    isJD = true;
    reason = `Strong content (${coreMatchCount} core indicators)`;
  } else {
    reason = `Subject=${hasStrongSubject ? 'YES' : 'NO'}, Core=${coreMatchCount}/12, Tech=${hasTechnicalContent ? 'YES' : 'NO'}`;
  }

  return { isJD, reason, coreMatchCount, hasTechnicalContent, hasStrongSubject };
}

async function testLast10Emails() {
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
        const start = Math.max(1, total - 9);
        
        console.log(`📬 Testing last 10 emails (${start} to ${total})\n`);

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
              const result = improvedJDDetection(parsed, textContent);
              
              emails.push({
                from: parsed.from?.text || 'Unknown',
                subject: parsed.subject || 'No Subject',
                date: parsed.date,
                ...result
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
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('📧 JD DETECTION RESULTS (Last 10 Emails)\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          emails.forEach((email, idx) => {
            const status = email.isJD ? '✅ IS JD' : '❌ NOT JD';
            console.log(`${idx + 1}. ${status}`);
            console.log(`   From: ${email.from}`);
            console.log(`   Subject: ${email.subject}`);
            console.log(`   Reason: ${email.reason}`);
            console.log('');
          });
          
          const jdCount = emails.filter(e => e.isJD).length;
          const nonJdCount = emails.filter(e => !e.isJD).length;
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📊 SUMMARY: ${jdCount} JDs detected, ${nonJdCount} filtered out`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (jdCount > 0) {
            console.log('✅ JD EMAILS TO PROCESS:\n');
            emails.filter(e => e.isJD).forEach((email, idx) => {
              console.log(`${idx + 1}. "${email.subject}"`);
              console.log(`   From: ${email.from}`);
              console.log(`   Match: ${email.reason}\n`);
            });
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

console.log('🚀 Testing Improved JD Detection Algorithm\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

testLast10Emails()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
