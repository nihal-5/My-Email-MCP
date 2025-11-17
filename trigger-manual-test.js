/**
 * Manual trigger script - Process latest 3 emails + 3 WhatsApp messages
 * This directly calls the orchestrator to process specific messages with source tracking
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function triggerLatest3FromEmail() {
  console.log('\n📧 Fetching latest 3 emails from Gmail...\n');
  
  // Use the email-extractor to get latest 3 unread emails
  try {
    const { stdout } = await execAsync('node dist/email-extractor.js 3');
    const emails = JSON.parse(stdout);
    
    console.log(`Found ${emails.length} emails\n`);
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n[${i+1}/3] Processing email: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      
      // Save email to temp file
      const tempFile = `/tmp/test-email-${i}.txt`;
      await fs.writeFile(tempFile, `Subject: ${email.subject}\n\nFrom: ${email.from}\n\n${email.body}`);
      
      // Call orchestrator with source=email
      try {
        const { stdout: result } = await execAsync(
          `cd orchestrator && python3 main.py --event '${JSON.stringify({
            type: 'email',
            source: 'email',
            subject: email.subject,
            from: email.from,
            body: email.body
          })}'`
        );
        console.log(`   ✅ Processed successfully`);
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to fetch emails: ${error.message}`);
  }
}

async function triggerLatest3FromWhatsApp() {
  console.log('\n\n📱 Fetching latest 3 WhatsApp messages from Srinu...\n');
  
  // Call MCP API to get messages
  try {
    const response = await fetch('http://localhost:3000/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_messages',
        arguments: {
          chatId: '917702055194@c.us',
          limit: 10 // Get 10 and filter for last 3 with content
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      throw new Error('Failed to fetch WhatsApp messages');
    }
    
    const messages = data.result
      .filter(m => m.body && m.body.length > 50) // Filter for substantial messages
      .slice(0, 3); // Take latest 3
    
    console.log(`Found ${messages.length} messages\n`);
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(`\n[${i+1}/3] Processing WhatsApp message`);
      console.log(`   Timestamp: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
      console.log(`   Preview: ${msg.body.substring(0, 80)}...`);
      
      // Call orchestrator with source=whatsapp
      try {
        const { stdout: result } = await execAsync(
          `cd orchestrator && python3 main.py --event '${JSON.stringify({
            type: 'whatsapp',
            source: 'whatsapp',
            from: 'Srinu',
            chatId: '917702055194@c.us',
            body: msg.body,
            timestamp: msg.timestamp
          })}'`
        );
        console.log(`   ✅ Processed successfully`);
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to fetch WhatsApp messages: ${error.message}`);
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 MANUAL TRIGGER TEST - Latest 3 from Email + Latest 3 from WhatsApp');
  console.log('='.repeat(80));
  
  // Check if MCP server is running
  try {
    const response = await fetch('http://localhost:3000/health');
    if (!response.ok) {
      throw new Error('MCP server not responding');
    }
    console.log('✅ MCP server is running\n');
  } catch (error) {
    console.error('❌ MCP server is not running. Please start it first with: npm start');
    process.exit(1);
  }
  
  // Process emails first
  await triggerLatest3FromEmail();
  
  // Then WhatsApp messages
  await triggerLatest3FromWhatsApp();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ MANUAL TRIGGER COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📋 Check dashboard at: http://localhost:3001/approval');
  console.log('\nExpected results:');
  console.log('  - Up to 6 cards in dashboard');
  console.log('  - Email cards should show 📧 EMAIL badge');
  console.log('  - WhatsApp cards should show 📱 WHATSAPP badge');
  console.log('  - Click any card to see JD in right panel\n');
}

main().catch(console.error);
