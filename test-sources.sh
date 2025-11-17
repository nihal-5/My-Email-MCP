#!/bin/bash
# Simple test: 2 emails (via trigger script) + 2 manual WhatsApp entries

echo ""
echo "🎯 COMPREHENSIVE SOURCE TEST"
echo "================================"
echo ""

# Test 1 & 2: Latest email JDs
echo "📧 TEST 1 & 2: Processing latest 2 email JDs..."
node trigger-latest-jd.js > /dev/null 2>&1
sleep 3
node trigger-latest-jd.js > /dev/null 2>&1
echo "   ✅ Email JDs processed"

# Test 3 & 4: Create WhatsApp test entries directly
echo ""
echo "💬 TEST 3 & 4: Creating 2 WhatsApp test entries..."

# WhatsApp Test 1
cat > ./data/session/test_whatsapp_1.json << 'EOF'
{
  "jd": "Senior AI Engineer - Remote\n\nWe are looking for a Senior AI Engineer.\n\nRequirements:\n- Python, LLMs\n- 5+ years experience\n- RAG systems\n\nInterested?",
  "source": "whatsapp",
  "meta": {
    "to_email": "recruiter1@example.com",
    "recruiter_name": "Tech Recruiter A"
  }
}
EOF

python orchestrator/main.py ./data/session/test_whatsapp_1.json > /dev/null 2>&1
echo "   ✅ WhatsApp test 1 processed"

sleep 2

# WhatsApp Test 2  
cat > ./data/session/test_whatsapp_2.json << 'EOF'
{
  "jd": "ML Engineer Position - San Francisco\n\nLooking for ML Engineer:\n- TensorFlow/PyTorch\n- Model deployment\n- Cloud (AWS/GCP)\n\nPlease apply if interested!",
  "source": "whatsapp",
  "meta": {
    "to_email": "recruiter2@example.com",
    "recruiter_name": "Startup Recruiter B"
  }
}
EOF

python orchestrator/main.py ./data/session/test_whatsapp_2.json > /dev/null 2>&1
echo "   ✅ WhatsApp test 2 processed"

echo ""
echo "================================"
echo "📊 CHECKING RESULTS..."
echo "================================"
echo ""

# Check last 4 entries in queue
node -e "
const fs = require('fs');
const queue = JSON.parse(fs.readFileSync('./data/approval-queue.json', 'utf-8'));
const recent = queue.slice(-4);

recent.forEach((item, i) => {
  const source = (item.source || 'email').toUpperCase();
  const body = item.emailBody || '';
  
  console.log(\`\n\${i + 1}. SOURCE: \${source}\`);
  console.log(\`   Subject: \${item.emailSubject || 'N/A'}\`);
  
  // Check opening
  const hasThankYou = body.includes('Thank you for reaching out');
  const hasCameAcross = body.includes('I came across');
  const isEmail = (item.source || 'email') === 'email';
  
  if (isEmail) {
    console.log(\`   Opening: \${hasThankYou ? '✅ CORRECT (Thank you)' : '❌ WRONG'}\`);
  } else {
    console.log(\`   Opening: \${hasCameAcross ? '✅ CORRECT (I came across)' : '❌ WRONG'}\`);
  }
  
  // Check APPLICATION DETAILS
  const hasAppDetails = body.includes('APPLICATION DETAILS');
  console.log(\`   App Details: \${hasAppDetails ? '❌ PRESENT' : '✅ REMOVED'}\`);
  
  // Show first 80 chars of body
  console.log(\`   Preview: \${body.substring(0, 80)}...\`);
});

console.log('\\n' + '='.repeat(60));
console.log('✅ Test complete!');
console.log('='.repeat(60));
"
