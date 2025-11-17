#!/usr/bin/env node
/**
 * Send a test email using Gmail SMTP directly
 */

import nodemailer from 'nodemailer';
import 'dotenv/config';

async function sendTestEmail() {
  console.log('\n📧 Sending test email to nihal.veeramalla@gmail.com...\n');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.FROM_EMAIL || process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.GMAIL_USER,
    to: 'nihal.veeramalla@gmail.com',
    subject: 'TEST EMAIL - Job Opportunity: Senior DevOps Engineer at TechCorp',
    text: `Hi Nihal,

This is a test email to verify that email classification is working.

Test categories to see:
- Job opportunity
- Newsletter
- Shopping order
- Sales/marketing

Sent at: ${new Date().toISOString()}

--
Test Email from Resume Automation System`,
    html: `<h2>Hi Nihal,</h2>

<p>This is a test email to verify that email classification is working.</p>

<p>Test categories to see:</p>
<ul>
<li>Job opportunity</li>
<li>Newsletter</li>
<li>Shopping order</li>
<li>Sales/marketing</li>
</ul>

<p>Sent at: ${new Date().toISOString()}</p>

<hr>
<p>Test Email from Resume Automation System</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`\n📧 Check your inbox at nihal.veeramalla@gmail.com`);
    console.log(`\n⏳ Wait 10-20 seconds, then check:`);
    console.log(`1. Terminal logs (should show classification)`);
    console.log(`2. Dashboard Email Inbox tab (should show new email)`);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

sendTestEmail();