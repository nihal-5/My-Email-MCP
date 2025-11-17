#!/usr/bin/env node

/**
 * Test Email Configuration
 * This script tests if your Gmail SMTP setup is working
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('========================================');
  console.log('Testing Email Configuration');
  console.log('========================================\n');

  // Check if environment variables are set
  const {
    SMTP_HOST = 'smtp.gmail.com',
    SMTP_PORT = '587',
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL
  } = process.env;

  console.log('Configuration:');
  console.log(`  SMTP Host: ${SMTP_HOST}`);
  console.log(`  SMTP Port: ${SMTP_PORT}`);
  console.log(`  SMTP User: ${SMTP_USER}`);
  console.log(`  From Email: ${FROM_EMAIL}`);
  console.log(`  SMTP Pass: ${SMTP_PASS ? '✅ Set (hidden)' : '❌ Not set'}\n`);

  if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    console.error('❌ ERROR: Missing SMTP configuration!');
    console.error('Please set SMTP_USER, SMTP_PASS, and FROM_EMAIL in .env file\n');
    console.error('See QUICK_START.md for setup instructions');
    process.exit(1);
  }

  console.log('Creating transporter...');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: SMTP_USER, // Send to yourself
      subject: '✅ Resume Automation - Email Test Successful',
      text: 'Congratulations! Your email configuration is working correctly.\n\n' +
            'Your resume automation system can now send emails to recruiters.\n\n' +
            'Test details:\n' +
            `- From: ${FROM_EMAIL}\n` +
            `- To: ${SMTP_USER}\n` +
            `- SMTP Host: ${SMTP_HOST}\n` +
            `- Time: ${new Date().toISOString()}\n\n` +
            'Next steps:\n' +
            '1. Start the server: npm start\n' +
            '2. Send a test JD from Srinu\n' +
            '3. Check your email for the resume!\n\n' +
            'System is ready! 🎉',
      html: `
        <h2>✅ Resume Automation - Email Test Successful</h2>
        <p>Congratulations! Your email configuration is working correctly.</p>
        <p>Your resume automation system can now send emails to recruiters.</p>

        <h3>Test Details:</h3>
        <ul>
          <li><strong>From:</strong> ${FROM_EMAIL}</li>
          <li><strong>To:</strong> ${SMTP_USER}</li>
          <li><strong>SMTP Host:</strong> ${SMTP_HOST}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>

        <h3>Next Steps:</h3>
        <ol>
          <li>Start the server: <code>npm start</code></li>
          <li>Send a test JD from Srinu</li>
          <li>Check your email for the resume!</li>
        </ol>

        <p><strong>System is ready! 🎉</strong></p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}\n`);

    console.log('========================================');
    console.log('✅ EMAIL CONFIGURATION SUCCESSFUL!');
    console.log('========================================\n');
    console.log('Check your inbox for the test email.');
    console.log('Your system is ready to send resumes! 🎉\n');

  } catch (error) {
    console.error('\n❌ ERROR: Email test failed!');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('Invalid login')) {
      console.error('💡 Possible causes:');
      console.error('   1. Gmail App Password is incorrect');
      console.error('   2. 2-Step Verification not enabled on Gmail');
      console.error('   3. Using regular password instead of App Password\n');
      console.error('Solution:');
      console.error('   - Go to: https://myaccount.google.com/apppasswords');
      console.error('   - Generate a new App Password');
      console.error('   - Update SMTP_PASS in .env file\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Possible causes:');
      console.error('   1. Network/firewall blocking SMTP');
      console.error('   2. SMTP host/port incorrect\n');
    }

    process.exit(1);
  }
}

testEmail();
