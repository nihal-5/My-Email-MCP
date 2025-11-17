#!/usr/bin/env node
/**
 * Send test email to verify email delivery
 */

import 'dotenv/config';
import { renderAndEmail } from './dist/resume-tools/index.js';
import * as fs from 'fs/promises';

async function sendTestEmail() {
  console.log('\n📧 Sending test email...\n');

  // Load the queue to get one submission
  const queueData = await fs.readFile('./data/approval-queue.json', 'utf-8');
  const queue = JSON.parse(queueData);
  const submission = queue[0]; // Use first submission

  if (!submission) {
    console.error('❌ No submissions in queue');
    process.exit(1);
  }

  console.log(`Using submission: ${submission.parsedData.role}`);
  console.log(`Cloud: ${submission.parsedData.cloud}`);
  console.log(`Sending to: nihal.veeramalla@gmail.com\n`);

  const testEmailBody = `Hi Nihal,

This is a test email from your resume automation system!

Role: ${submission.parsedData.role}
Cloud: ${submission.parsedData.cloud.toUpperCase()}
Location: ${submission.parsedData.location}

Original recruiter: ${submission.parsedData.recruiterName} (${submission.parsedData.recruiterEmail})

--
This is an automated test email to verify the system works correctly.

Thanks & Regards,
Nihal Veeramalla
Data Scientist
Linkedin: https://www.linkedin.com/in/nihal-veeramalla/
Ph: 313-288-2859
Email: nihal.veeramalla@gmail.com`;

  try {
    const result = await renderAndEmail({
      latex: submission.latex,
      to: 'nihal.veeramalla@gmail.com',
      cc: 'Srinu@blueridgeinfotech.com',
      subject: `TEST - ${submission.parsedData.role} Resume - Nihal Veeramalla`,
      body: testEmailBody,
      filenameBase: 'Nihal_Veeramalla_Resume'
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`\n📧 Check your inbox at nihal.veeramalla@gmail.com`);
      console.log(`PDF attached: ${result.pdfPath}\n`);
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendTestEmail();
