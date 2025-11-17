#!/usr/bin/env node
/**
 * Test script: Process 2 emails + 2 WhatsApp JDs and verify fixes
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const config = {
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true
};

console.log('\n🎯 COMPREHENSIVE SOURCE TEST\n');
console.log('Testing 2 email sources + 2 WhatsApp sources');
console.log('Checking for both fixes:');
console.log('  1. Correct opening ("Thank you" for email, "I came across" for WhatsApp)');
console.log('  2. NO "APPLICATION DETAILS" section\n');
console.log('='.repeat(80));

// Test emails from Gmail
async function getLatestEmailJDs(count = 2) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const jds = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) return reject(err);

        const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 100)}:*`, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;
              
              const subject = parsed.subject || '';
              const from = parsed.from?.text || '';
              
              // Simple JD detection
              if (subject.match(/engineer|developer|scientist|specialist|analyst/i) &&
                  !from.match(/linkedin|indeed|dice|noreply/i)) {
                jds.push({
                  from,
                  subject,
                  body: parsed.text || '',
                  source: 'email'
                });
              }
            });
          });
        });

        fetch.once('end', () => {
          imap.end();
          resolve(jds.slice(0, count));
        });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
}

// Mock WhatsApp JDs (since we can't easily access WhatsApp session)
const mockWhatsAppJDs = [
  {
    from: 'Recruiter A',
    subject: 'Senior AI Engineer - Remote',
    body: `Hi Nihal,\n\nWe have an opening for Senior AI Engineer.\n\nRequired:\n- Python\n- LLMs\n- 5+ years\n\nInterested?`,
    source: 'whatsapp'
  },
  {
    from: 'Recruiter B', 
    subject: 'ML Engineer Position',
    body: `Hello,\n\nML Engineer role available:\n- TensorFlow\n- Model deployment\n- Cloud (AWS/GCP)\n\nLet me know!`,
    source: 'whatsapp'
  }
];

// Process a JD through the system
async function processJD(jd, index) {
  console.log(`\n📧 Processing JD #${index + 1} (${jd.source.toUpperCase()}):`);
  console.log(`   From: ${jd.from}`);
  console.log(`   Subject: ${jd.subject}`);

  // Create session file
  const sessionFile = `./data/session/test_${jd.source}_${Date.now()}.json`;
  await fs.writeFile(sessionFile, JSON.stringify({
    jd: jd.body,
    source: jd.source,
    meta: {
      to_email: 'test@example.com',
      recruiter_name: jd.from.split('<')[0].trim()
    }
  }));

  return new Promise((resolve) => {
    const proc = spawn('python', ['orchestrator/main.py', sessionFile], {
      env: { ...process.env }
    });

    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });

    proc.on('close', () => {
      console.log(`   ✅ Processed`);
      resolve(output);
    });
  });
}

// Check results
async function checkResults() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 CHECKING RESULTS\n');

  const queue = JSON.parse(await fs.readFile('./data/approval-queue.json', 'utf-8'));
  const recent = queue.slice(-4); // Last 4 submissions

  recent.forEach((item, i) => {
    console.log(`\n${i + 1}. Source: ${item.source?.toUpperCase() || 'UNKNOWN'}`);
    console.log(`   Subject: ${item.emailSubject || 'N/A'}`);
    
    const body = item.emailBody || '';
    
    // Check fix #1: Correct opening
    const hasThankYou = body.includes('Thank you for reaching out');
    const hasCameAcross = body.includes('I came across');
    const isEmail = item.source === 'email';
    
    if (isEmail) {
      console.log(`   Opening: ${hasThankYou ? '✅ CORRECT ("Thank you")' : '❌ WRONG (should be "Thank you")'}`);
    } else {
      console.log(`   Opening: ${hasCameAcross ? '✅ CORRECT ("I came across")' : '❌ WRONG (should be "I came across")'}`);
    }
    
    // Check fix #2: No APPLICATION DETAILS
    const hasAppDetails = body.includes('APPLICATION DETAILS');
    console.log(`   App Details: ${hasAppDetails ? '❌ PRESENT (should be removed)' : '✅ REMOVED'}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete! Check results above.\n');
}

// Main
async function main() {
  try {
    // Get 2 email JDs
    console.log('\n📬 Fetching latest 2 email JDs from Gmail...');
    const emailJDs = await getLatestEmailJDs(2);
    console.log(`   Found ${emailJDs.length} email JDs`);

    // Use mock WhatsApp JDs
    console.log('\n💬 Using 2 mock WhatsApp JDs');
    const whatsappJDs = mockWhatsAppJDs;

    // Process all
    const allJDs = [...emailJDs, ...whatsappJDs];
    console.log(`\n🚀 Processing ${allJDs.length} total JDs...\n`);
    console.log('='.repeat(80));

    for (let i = 0; i < allJDs.length; i++) {
      await processJD(allJDs[i], i);
      await new Promise(r => setTimeout(r, 2000)); // Wait between requests
    }

    // Check results
    await checkResults();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
