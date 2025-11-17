#!/usr/bin/env node
/**
 * Send a simple test email to your Gmail inbox
 */

import 'dotenv/config';
import { renderAndEmail } from './dist/resume-tools/index.js';

async function sendSimpleTestEmail() {
  console.log('\n📧 Sending simple test email to nihal.veeramalla@gmail.com...\n');

  const testEmailBody = `Hi Nihal,

This is a simple test email to verify that email classification is working.

Test categories to see:
- Job opportunity
- Newsletter
- Shopping order
- Sales/marketing

Sent at: ${new Date().toISOString()}

--
Test Email from Resume Automation System`;

  try {
    const result = await renderAndEmail({
      latex: '', // No attachment for simple test
      to: 'nihal.veeramalla@gmail.com',
      subject: `TEST EMAIL - Job Opportunity: Senior DevOps Engineer at TechCorp`,
      body: testEmailBody,
      filenameBase: '' // No attachment
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`\n📧 Check your inbox at nihal.veeramalla@gmail.com`);
      console.log(`\n⏳ Wait 10-20 seconds, then check:`);
      console.log(`1. Terminal logs (should show classification)`);
      console.log(`2. Dashboard Email Inbox tab (should show new email)`);
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendSimpleTestEmail();