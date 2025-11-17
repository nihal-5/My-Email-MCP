/**
 * Trigger exactly 3 latest JDs from email and 3 from WhatsApp for testing
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the existing trigger-latest-jd.js to understand the structure
const triggerScript = fs.readFileSync(path.join(__dirname, 'trigger-latest-jd.js'), 'utf8');

console.log('🧪 MANUAL TEST: Triggering 3 from Email + 3 from WhatsApp\n');
console.log('=' .repeat(60));

// Start the server in background
console.log('📋 Step 1: Starting server...');
const serverProcess = exec('npm start', { cwd: __dirname });

// Wait for server to be ready
setTimeout(async () => {
  console.log('✅ Server should be ready now\n');
  
  // The email monitor will automatically process unread emails (up to 3 with skipInitialScan disabled)
  // The WhatsApp monitor will automatically check for new messages (up to 3)
  
  console.log('📧 Email Monitor: Will process latest unread emails automatically');
  console.log('📱 WhatsApp Monitor: Will check for new messages automatically');
  console.log('\n⏳ Waiting 60 seconds for both monitors to process messages...\n');
  console.log('   Watch the server logs for processing activity.');
  console.log('   Check dashboard: http://localhost:3001/approval\n');
  
  setTimeout(() => {
    console.log('✅ Test period complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check the dashboard for cards with source badges');
    console.log('   2. Verify 📧 EMAIL badges on email-sourced cards');
    console.log('   3. Verify 📱 WHATSAPP badges on WhatsApp-sourced cards');
    console.log('   4. Test all 4 dashboard features');
    console.log('\n   When done, press Ctrl+C to stop the server');
  }, 60000);
  
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  serverProcess.kill();
  process.exit(0);
});
