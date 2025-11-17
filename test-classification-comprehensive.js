#!/usr/bin/env node
/**
 * Comprehensive Email Classification Test
 * Tests hybrid rule-based + LLM system on real inbox emails
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const config = {
  user: process.env.GMAIL_USER || process.env.FROM_EMAIL || '',
  password: process.env.GMAIL_APP_PASSWORD || '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Hybrid classification logic (matches email-monitor.ts)
async function classifyEmail(email, content) {
  const subject = (email.subject || '').toLowerCase();
  const lowerContent = content.toLowerCase();
  const fromEmail = email.from?.value[0]?.address?.toLowerCase() || '';

  // STEP 1: EXCLUDE obvious non-JDs
  const excludedDomains = [
    'linkedin.com', 'noreply@', 'newsletters@', 'updates@', 'alerts@', 'notifications@'
  ];
  const isExcludedSender = excludedDomains.some(domain => fromEmail.includes(domain));

  const excludedSubjectPatterns = [
    /newsletter/i, /digest/i, /alert/i, /notification/i, /update/i, /highlights/i,
    /weekly|monthly|daily/i, /new.*jobs.*match/i, /recommended.*for.*you/i
  ];
  const hasExcludedSubject = excludedSubjectPatterns.some(pattern => pattern.test(subject));

  if (isExcludedSender) {
    return { isJD: false, method: 'EXCLUDED', reason: `Excluded sender: ${fromEmail}`, usedLLM: false };
  }

  if (hasExcludedSubject) {
    return { isJD: false, method: 'EXCLUDED', reason: 'Excluded subject pattern', usedLLM: false };
  }

  // STEP 2: AUTO-ACCEPT obvious JDs
  const jobTitleKeywords = [
    'engineer', 'developer', 'scientist', 'analyst', 'manager',
    'architect', 'consultant', 'specialist', 'lead', 'senior'
  ];
  const hasJobTitle = jobTitleKeywords.some(title => subject.includes(title));

  const locationIndicators = [
    /\bin\s+[A-Z][a-z]+/, /[A-Z]{2}$/, /remote/i, /hybrid/i, /onsite/i, /on-site/i
  ];
  const hasLocation = locationIndicators.some(pattern => pattern.test(subject));
  const hasStrongSubject = hasJobTitle && hasLocation;

  if (hasStrongSubject) {
    return { isJD: true, method: 'RULES', reason: 'Strong subject (job title + location)', usedLLM: false };
  }

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

  const hasJobOpportunityKeywords = /\b(opportunity|opening|hiring|position|role|vacancy)\b/i.test(subject);

  if (hasJobTitle && (coreMatchCount >= 2 || hasTechnicalContent || hasJobOpportunityKeywords)) {
    return { isJD: true, method: 'RULES', reason: `Job title + signals (core=${coreMatchCount}, tech=${hasTechnicalContent})`, usedLLM: false };
  }

  if (coreMatchCount >= 6) {
    return { isJD: true, method: 'RULES', reason: `Strong content (${coreMatchCount} core indicators)`, usedLLM: false };
  }

  // STEP 3: LLM for uncertain cases
  const isUncertain = (hasJobTitle && coreMatchCount >= 1) || coreMatchCount >= 3;

  if (isUncertain) {
    return await askLLM(email, content, coreMatchCount, hasTechnicalContent);
  }

  return { isJD: false, method: 'RULES', reason: `Weak signals (job title=${hasJobTitle}, core=${coreMatchCount}/12, tech=${hasTechnicalContent})`, usedLLM: false };
}

async function askLLM(email, content, coreMatchCount, hasTechnicalContent) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return { isJD: false, method: 'LLM_FALLBACK', reason: `No GROQ API key - uncertain case (core=${coreMatchCount})`, usedLLM: false };
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const subject = email.subject || '';
    const from = email.from?.text || '';
    const snippet = content.substring(0, 800);

    const prompt = `You are an expert email classifier. Determine if this email is a JOB POSTING or JOB DESCRIPTION from a recruiter.

EMAIL DETAILS:
From: ${from}
Subject: ${subject}

CONTENT (first 800 characters):
${snippet}

INSTRUCTIONS:
- Answer ONLY "YES" or "NO"
- YES = This is a job posting/description from a recruiter about a job opportunity
- NO = This is NOT a job posting (newsletters, alerts, marketing, etc.)

Be generous - if it's from a real recruiter about a specific job, answer YES even if details are brief.

ANSWER (YES or NO):`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 10
    });

    const answer = response.choices[0]?.message?.content?.trim().toUpperCase();
    const isJD = answer === 'YES';

    return { isJD, method: 'LLM', reason: `LLM: ${answer} (core=${coreMatchCount}, tech=${hasTechnicalContent})`, usedLLM: true };

  } catch (error) {
    return { isJD: false, method: 'LLM_ERROR', reason: `LLM error: ${error.message}`, usedLLM: false };
  }
}

async function testLast20Emails() {
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
        const start = Math.max(1, total - 19);

        console.log(`📬 Testing classification on last 20 emails (${start} to ${total})\n`);
        console.log('━'.repeat(120));
        console.log('\n');

        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: '',
          struct: true
        });

        const emails = [];
        let processed = 0;

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
              const result = await classifyEmail(parsed, textContent);

              emails.push({
                num: ++processed,
                from: parsed.from?.text || 'Unknown',
                fromEmail: parsed.from?.value[0]?.address || '',
                subject: parsed.subject || 'No Subject',
                date: parsed.date,
                contentLength: textContent.length,
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

        fetch.once('end', async () => {
          // Wait a bit for all async processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Sort by number
          emails.sort((a, b) => a.num - b.num);

          // Display results
          console.log('📊 CLASSIFICATION RESULTS\n');
          console.log('━'.repeat(120));
          console.log('\n');

          const jdEmails = [];
          const nonJdEmails = [];
          let llmCallCount = 0;

          emails.forEach((email, idx) => {
            const status = email.isJD ? '✅ JD' : '❌ NOT JD';
            const methodBadge = email.method === 'LLM' ? '🤖' : email.method === 'RULES' ? '📏' : '🚫';

            console.log(`${idx + 1}. ${status} ${methodBadge} [${email.method}]`);
            console.log(`   From: ${email.from}`);
            console.log(`   Email: ${email.fromEmail}`);
            console.log(`   Subject: ${email.subject}`);
            console.log(`   Reason: ${email.reason}`);
            console.log(`   Content: ${email.contentLength} chars`);
            console.log('');

            if (email.isJD) {
              jdEmails.push(email);
            } else {
              nonJdEmails.push(email);
            }

            if (email.usedLLM) {
              llmCallCount++;
            }
          });

          console.log('━'.repeat(120));
          console.log('\n📈 SUMMARY\n');
          console.log(`Total Emails: ${emails.length}`);
          console.log(`✅ Job Postings (JD): ${jdEmails.length}`);
          console.log(`❌ Non-JDs: ${nonJdEmails.length}`);
          console.log(`🤖 LLM Calls Used: ${llmCallCount} (${((llmCallCount/emails.length)*100).toFixed(1)}%)`);
          console.log(`📏 Rules-Based: ${emails.length - llmCallCount} (${(((emails.length - llmCallCount)/emails.length)*100).toFixed(1)}%)`);
          console.log('\n');

          if (jdEmails.length > 0) {
            console.log('━'.repeat(120));
            console.log('\n✅ DETECTED JOB POSTINGS:\n');
            jdEmails.forEach((email, idx) => {
              console.log(`${idx + 1}. ${email.subject}`);
              console.log(`   From: ${email.fromEmail}`);
              console.log(`   Method: ${email.method} ${email.usedLLM ? '(LLM)' : '(Rules)'}`);
              console.log('');
            });
          }

          if (nonJdEmails.length > 0) {
            console.log('━'.repeat(120));
            console.log('\n❌ FILTERED OUT (Non-JDs):\n');
            nonJdEmails.forEach((email, idx) => {
              console.log(`${idx + 1}. ${email.subject}`);
              console.log(`   From: ${email.fromEmail}`);
              console.log(`   Method: ${email.method}`);
              console.log('');
            });
          }

          console.log('━'.repeat(120));
          console.log('\n✅ Test complete!\n');

          imap.end();
          resolve();
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
testLast20Emails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
