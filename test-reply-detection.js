#!/usr/bin/env node
/**
 * Test Reply Email Detection
 * Verifies that reply emails are NOT processed as new JDs
 */

// Test cases for reply detection
const testCases = [
  {
    description: "Original JD email (should be processed)",
    subject: "Gen AI Specialist in Dearborn MI-Onsite",
    inReplyTo: null,
    references: null,
    expected: true
  },
  {
    description: "Reply with Re: prefix (should be excluded)",
    subject: "Re: Gen AI Specialist in Dearborn MI-Onsite",
    inReplyTo: null,
    references: null,
    expected: false
  },
  {
    description: "Reply with inReplyTo header (should be excluded)",
    subject: "Gen AI Specialist in Dearborn MI-Onsite",
    inReplyTo: "<message-id-123@gmail.com>",
    references: null,
    expected: false
  },
  {
    description: "Reply with references header (should be excluded)",
    subject: "Gen AI Specialist in Dearborn MI-Onsite",
    inReplyTo: null,
    references: "<message-id-123@gmail.com>",
    expected: false
  },
  {
    description: "Forward with Fwd: prefix (should be excluded)",
    subject: "Fwd: Gen AI Specialist in Dearborn MI-Onsite",
    inReplyTo: null,
    references: null,
    expected: false
  },
  {
    description: "Reply in middle of subject (should be excluded)",
    subject: "Gen AI Specialist in Dearborn MI-Onsite [re: previous]",
    inReplyTo: null,
    references: null,
    expected: false
  }
];

// Simulate the reply detection logic
function isReply(email) {
  const subject = (email.subject || '').toLowerCase();
  
  return email.inReplyTo || 
         email.references || 
         subject.startsWith('re:') || 
         subject.startsWith('fwd:') ||
         subject.includes('re:') ||
         subject.includes('fwd:');
}

// Run tests
console.log('🧪 TESTING REPLY EMAIL DETECTION\n');
console.log('━'.repeat(100));
console.log('\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
  const result = isReply({
    subject: test.subject,
    inReplyTo: test.inReplyTo,
    references: test.references
  });

  const shouldProcess = !result; // If NOT a reply, should process
  const isCorrect = shouldProcess === test.expected;

  if (isCorrect) {
    console.log(`✅ Test ${idx + 1}: PASS`);
    passed++;
  } else {
    console.log(`❌ Test ${idx + 1}: FAIL`);
    failed++;
  }

  console.log(`   Description: ${test.description}`);
  console.log(`   Subject: "${test.subject}"`);
  console.log(`   InReplyTo: ${test.inReplyTo || 'null'}`);
  console.log(`   References: ${test.references || 'null'}`);
  console.log(`   Is Reply: ${result}`);
  console.log(`   Should Process: ${shouldProcess} (expected: ${test.expected})`);
  console.log('');
});

console.log('━'.repeat(100));
console.log('\n📊 SUMMARY\n');
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed/testCases.length)*100).toFixed(1)}%`);
console.log('');

if (failed === 0) {
  console.log('🎉 All tests passed! Reply detection is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
