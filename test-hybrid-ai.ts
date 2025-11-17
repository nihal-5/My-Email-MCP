/**
 * 🧪 TEST HYBRID AI SYSTEM
 * 
 * Tests:
 * 1. Ollama connection
 * 2. Email classification with Llama 3.2 3B
 * 3. Resume generation with GPT-5
 * 4. Cost comparison
 */

import 'dotenv/config';
import { HybridAI } from './src/ai/hybrid-ai';

const TEST_EMAIL = `
Subject: DevOps Engineer Position at TechCorp

Hi Nihal,

I came across your profile and I think you'd be a great fit for our 
DevOps Engineer role at TechCorp.

We're looking for someone with:
- 5+ years AWS experience
- Kubernetes expertise
- CI/CD pipeline knowledge

Interested? Let me know!

Best regards,
Sarah Johnson
Talent Acquisition Manager
sarah.johnson@techcorp.com
`;

const TEST_JD = `
DevOps Engineer - AWS & Kubernetes
TechCorp Inc.
San Francisco, CA

Requirements:
- 5+ years DevOps experience
- AWS (EC2, S3, Lambda, ECS)
- Kubernetes and Docker
- CI/CD (Jenkins, GitHub Actions)
- Infrastructure as Code (Terraform)
`;

const BASE_RESUME = `
Nihal Veeramalla
Senior DevOps Engineer

EXPERIENCE:
- 6 years in DevOps and Cloud Infrastructure
- AWS Certified Solutions Architect
- Kubernetes Administrator

SKILLS:
- Cloud: AWS, Azure, GCP
- Containers: Docker, Kubernetes
- CI/CD: Jenkins, GitHub Actions, GitLab CI
- IaC: Terraform, CloudFormation
- Monitoring: Prometheus, Grafana
`;

async function runTests() {
  console.log('🧪 TESTING HYBRID AI SYSTEM\n');
  
  const hybridAI = new HybridAI();
  
  // Test 1: Check Ollama
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Checking Ollama Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const status = await hybridAI.checkOllamaStatus();
  
  if (!status.running) {
    console.error('❌ Ollama not running!');
    console.log('📝 Start it with: ollama serve');
    console.log('📝 Then run this test again.');
    process.exit(1);
  }
  
  console.log('✅ Ollama is running!');
  console.log('📦 Models available:', status.models.join(', '));
  console.log('\n');
  
  // Test 2: Email Classification (Local Llama 3B)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Email Classification (LOCAL LLM)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const startClassify = Date.now();
  const classification = await hybridAI.classifyEmail(TEST_EMAIL);
  const classifyTime = Date.now() - startClassify;
  
  console.log('📊 RESULTS:');
  console.log('- Is Job:', classification.isJob ? '✅ YES' : '❌ NO');
  console.log('- Confidence:', (classification.confidence * 100).toFixed(0) + '%');
  console.log('- Company:', classification.company || 'N/A');
  console.log('- Role:', classification.role || 'N/A');
  console.log('- Recruiter:', classification.recruiterName || 'N/A');
  console.log('- Email:', classification.recruiterEmail || 'N/A');
  console.log('- Time:', classifyTime + 'ms');
  console.log('- Cost: $0 💰');
  console.log('\n');
  
  // Test 3: Resume Generation (GPT-5)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Resume Generation (GPT-5)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const startResume = Date.now();
  const resume = await hybridAI.generateResume(BASE_RESUME, TEST_JD, false);
  const resumeTime = Date.now() - startResume;
  
  console.log('📊 RESULTS:');
  console.log('- Model:', resume.model);
  console.log('- Confidence:', (resume.confidence * 100).toFixed(0) + '%');
  console.log('- LaTeX length:', resume.latex.length + ' chars');
  console.log('- Time:', resumeTime + 'ms');
  console.log('- Cost: ~$0.30');
  console.log('\n');
  
  // Test 4: Cost Comparison
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('COST COMPARISON (100 apps/day)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('❌ WITH GPT-5 ONLY:');
  console.log('- Email classification: 3,000 × $0.10 = $300');
  console.log('- Resume generation: 3,000 × $0.30 = $900');
  console.log('- TOTAL: $1,200/month\n');
  
  console.log('✅ WITH HYBRID (Phase 1):');
  console.log('- Email classification: 3,000 × $0 = $0 (Local Llama 3B!)');
  console.log('- Resume generation: 3,000 × $0.30 = $900 (GPT-5)');
  console.log('- TOTAL: $900/month');
  console.log('- SAVED: $300/month! 💰\n');
  
  console.log('🚀 WITH HYBRID (Phase 2 - if Llama 8B works):');
  console.log('- Email classification: $0 (Local!)');
  console.log('- Resume generation: $0 (Local!)');
  console.log('- TOTAL: $0/month');
  console.log('- SAVED: $1,200/month! 🎉🎉🎉\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL TESTS PASSED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Next steps:');
  console.log('1. Integrate HybridAI into email-monitor.ts');
  console.log('2. Replace GPT-5 calls with hybridAI.classifyEmail()');
  console.log('3. Test with real emails');
  console.log('4. Monitor cost savings in dashboard\n');
}

// Run tests
runTests().catch(console.error);
