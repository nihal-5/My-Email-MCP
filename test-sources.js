/**
 * Test script to manually trigger processing of:
 * - Latest 3 emails from Gmail
 * - Latest 3 WhatsApp messages from Srinu
 */

import fetch from 'node-fetch';

const MCP_SERVER = 'http://localhost:3000';

async function triggerEmailProcessing() {
  console.log('\n📧 Fetching latest 3 emails from Gmail...\n');
  
  try {
    const response = await fetch(`${MCP_SERVER}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_latest_emails',
        params: {
          limit: 3
        }
      })
    });

    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ Found ${result.data.length} emails\n`);
      
      for (let i = 0; i < result.data.length; i++) {
        const email = result.data[i];
        console.log(`📧 Email ${i + 1}:`);
        console.log(`   From: ${email.from}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Date: ${email.date}`);
        console.log(`   Has JD: ${email.body.length > 100 ? 'Yes' : 'Unknown'}`);
        console.log('');
        
        // Trigger processing for this email
        console.log(`   🔄 Processing email ${i + 1}...`);
        
        const processResponse = await fetch(`${MCP_SERVER}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'process_jd_from_email',
            params: {
              emailData: email,
              source: 'email'
            }
          })
        });
        
        const processResult = await processResponse.json();
        
        if (processResult.success) {
          console.log(`   ✅ Email ${i + 1} processed successfully!`);
        } else {
          console.log(`   ❌ Email ${i + 1} processing failed: ${processResult.error}`);
        }
        console.log('');
      }
    } else {
      console.log('❌ No emails found or error occurred');
      console.log('Result:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching emails:', error.message);
  }
}

async function triggerWhatsAppProcessing() {
  console.log('\n📱 Fetching latest 3 WhatsApp messages from Srinu...\n');
  
  try {
    const response = await fetch(`${MCP_SERVER}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_messages',
        params: {
          chatId: '917702055194@c.us',
          limit: 3
        }
      })
    });

    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ Found ${result.data.length} WhatsApp messages\n`);
      
      for (let i = 0; i < result.data.length; i++) {
        const message = result.data[i];
        console.log(`📱 WhatsApp Message ${i + 1}:`);
        console.log(`   From: ${message.from}`);
        console.log(`   Date: ${new Date(message.timestamp * 1000).toLocaleString()}`);
        console.log(`   Text: ${message.body.substring(0, 100)}...`);
        console.log(`   Has JD: ${message.body.length > 100 ? 'Yes' : 'Unknown'}`);
        console.log('');
        
        // Trigger processing for this message
        console.log(`   🔄 Processing WhatsApp message ${i + 1}...`);
        
        const processResponse = await fetch(`${MCP_SERVER}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'process_jd_from_whatsapp',
            params: {
              messageData: message,
              source: 'whatsapp'
            }
          })
        });
        
        const processResult = await processResponse.json();
        
        if (processResult.success) {
          console.log(`   ✅ WhatsApp message ${i + 1} processed successfully!`);
        } else {
          console.log(`   ❌ WhatsApp message ${i + 1} processing failed: ${processResult.error}`);
        }
        console.log('');
      }
    } else {
      console.log('❌ No WhatsApp messages found or error occurred');
      console.log('Result:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching WhatsApp messages:', error.message);
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING SOURCE TRACKING: EMAIL + WHATSAPP');
  console.log('='.repeat(80));
  
  // Wait for server to be ready
  console.log('\n⏳ Checking if MCP server is ready...');
  
  try {
    const healthCheck = await fetch(`${MCP_SERVER}/health`);
    if (healthCheck.ok) {
      console.log('✅ MCP server is ready!\n');
    } else {
      console.log('❌ MCP server is not responding');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cannot connect to MCP server:', error.message);
    console.log('Make sure the server is running with: npm start');
    process.exit(1);
  }
  
  // Process emails
  await triggerEmailProcessing();
  
  // Wait a bit between email and WhatsApp
  console.log('\n⏳ Waiting 3 seconds before processing WhatsApp...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Process WhatsApp messages
  await triggerWhatsAppProcessing();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ TESTING COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📋 Check the dashboard at: http://localhost:3001/approval');
  console.log('   - Email items should show: 📧 EMAIL badge');
  console.log('   - WhatsApp items should show: 📱 WHATSAPP badge\n');
}

main().catch(console.error);
