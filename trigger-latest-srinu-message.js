/**
 * Manual trigger for latest Srinu message
 * Run this to process the most recent JD message from Srinu
 */

import { WhatsAppClient } from './dist/whatsapp-client.js';
import { logger } from './dist/utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';

const execAsync = promisify(exec);

const SRINU_CHAT_ID = '917702055194@c.us';

async function triggerLatestMessage() {
  console.log('🚀 Manual trigger: Processing latest message from Srinu...\n');

  // Initialize WhatsApp client
  const client = new WhatsAppClient({
    sessionStoragePath: './data',
    autoLogin: true,
    logLevel: 'info'
  });

  try {
    await client.initialize();
    console.log('✅ WhatsApp client initialized\n');

    // Get the latest messages from Srinu
    console.log('📥 Fetching latest messages from Srinu...');
    const messages = await client.getMessages({
      chatId: SRINU_CHAT_ID,
      limit: 5
    });

    console.log(`\n📨 Found ${messages.length} recent messages:\n`);
    
    // Show all messages with index
    messages.forEach((msg, index) => {
      const date = new Date(msg.timestamp * 1000).toLocaleString();
      const preview = msg.body.substring(0, 100).replace(/\n/g, ' ');
      const fromWho = msg.fromMe ? '(You)' : '(Srinu)';
      console.log(`[${index}] ${date} ${fromWho} - ${preview}... (${msg.body.length} chars)`);
    });

    // Find the most recent message from Srinu (not from me) that's long enough
    const latestJD = messages.find(msg => !msg.fromMe && msg.body.length > 200);

    if (!latestJD) {
      console.log('\n❌ No JD-like message found (need 200+ chars from Srinu)');
      process.exit(1);
    }

    const messageDate = new Date(latestJD.timestamp * 1000).toLocaleString();
    console.log(`\n🎯 Selected message from ${messageDate}:`);
    console.log(`📝 Length: ${latestJD.body.length} characters`);
    console.log(`📄 Preview: ${latestJD.body.substring(0, 200)}...\n`);

    // Confirm before processing
    console.log('⚠️  About to process this message. It will:');
    console.log('   1. Generate customized resume with NEW spec-based system');
    console.log('   2. Add to approval queue');
    console.log('   3. Send WhatsApp notification with dashboard link');
    console.log('   4. Mark this message ID as processed');
    console.log('\nProcessing in 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Trigger the orchestrator
    console.log('🚀 Triggering resume generation workflow...\n');
    
    const pythonScript = './orchestrator/main.py';
    const env = {
      ...process.env,
      JD_TEXT: latestJD.body,
      WA_FROM: SRINU_CHAT_ID,
      CC_EMAIL: process.env.CC_EMAIL || 'nihal.veeramalla@gmail.com'
    };

    const { stdout, stderr } = await execAsync(`python3 "${pythonScript}"`, {
      env,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    });

    console.log('✅ Orchestrator completed!\n');
    console.log('Output:', stdout);
    
    if (stderr) {
      console.log('Errors:', stderr);
    }

    // Save this message ID as processed
    console.log('\n💾 Marking message as processed...');
    const processedFile = './data/processed-srinu-messages.json';
    const processedData = [{
      id: latestJD.id,
      timestamp: latestJD.timestamp,
      processedAt: new Date().toISOString() + ' (manual trigger)'
    }];
    writeFileSync(processedFile, JSON.stringify(processedData, null, 2));
    console.log('✅ Message marked as processed\n');

    console.log('🎉 Done! Check:');
    console.log('   📱 WhatsApp for notification');
    console.log('   🌐 http://localhost:3001/approval for review');
    console.log('   📊 PM2 logs for spec-based generation details\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

triggerLatestMessage();
