import { tailorResume, renderPDF } from './dist/resume-tools/index.js';
import { validateResume } from './dist/resume-tools/validators/resume-validator.js';
import * as fs from 'fs/promises';

const JD_TEXT = `Title: Chatbot Developer
Location: Remote
Hiring Mode: Contract (TP)

Requirements:
- 5 years software delivery experience
- 3 years of Chatbot development experience with IBM Watson Assistant, or any other similar chatbot conversational AI tool (i.e Google Dialogflow CX, LivePerson, Amazon Lex, Kore.ai)
- 3 years training and improving intent recognition by curating the appropriate training data sets
- 3 years applying Conversational AI best practices (e.g. NLP and training data best practices)

Recruiter: Kishun Kumar
Company: Sierra Business Solution LLC
WhatsApp: +91-8987141416`;

async function main() {
  const role = 'Chatbot Developer';
  const cloud = 'azure';  // Force Azure instead of AWS
  const location = 'Remote';
  const recruiterName = 'Kishun Kumar';
  const recruiterEmail = 'kishun@sierrabusiness.com';

  console.log(`\n=== Processing Chatbot Developer JD ===`);
  console.log(`Role: ${role}`);
  console.log(`Cloud: ${cloud} (manually overridden from AWS)`);
  console.log(`Location: ${location}\n`);

  // Step 1: Tailor resume
  console.log('Step 1: Tailoring resume...');
  const latex = tailorResume({ cloud, role, location });
  console.log(`  ✅ Generated ${latex.length} chars of LaTeX`);

  // Step 2: Validate
  console.log('Step 2: Validating resume...');
  const validation = validateResume(latex, cloud);
  console.log(`  Valid: ${validation.ok}`);
  if (!validation.ok) {
    console.error('  ❌ Errors:', validation.errors);
    process.exit(1);
  }
  console.log('  ✅ Validation passed');

  // Step 3: Render PDF
  console.log('Step 3: Rendering PDF...');
  const pdfResult = await renderPDF(latex, 'Nihal_Veeramalla_Resume_Chatbot');
  if (!pdfResult.success) {
    console.error('  ❌ Error:', pdfResult.error);
    process.exit(1);
  }
  console.log(`  ✅ PDF: ${pdfResult.pdfPath}`);

  // Step 4: Create approval queue entry manually
  console.log('Step 4: Creating approval queue entry...');
  const emailSubject = `Application – ${role} – Nihal Veeramalla`;
  const emailBody = `Hi ${recruiterName},\n\n` +
    `I'm interested in the ${role} role${location ? ' (' + location + ')' : ''}. ` +
    `I've built production agentic systems and RAG-backed assistants, integrated them with enterprise microservices, ` +
    `and shipped low-latency model serving with strong observability and governance. ` +
    `At Fiserv, I delivered an internal copilot that combined multi-agent orchestration, retrieval, and private LLMs, ` +
    `integrated via REST/gRPC with existing services.\n\n` +
    `I've attached my resume for your review.\n\n` +
    `--\n` +
    `Thanks & Regards,\n` +
    `Nihal Veeramalla\n` +
    `Data Scientist\n` +
    `Linkedin: https://www.linkedin.com/in/nihal-veeramalla/\n` +
    `Ph: 313-288-2859\n` +
    `Email: nihal.veeramalla@gmail.com`;

  const submission = {
    id: `submission_${Date.now()}_chatbot`,
    timestamp: Date.now(),
    jd: JD_TEXT,
    parsedData: {
      role,
      cloud,
      location,
      recruiterEmail,
      recruiterName,
      company: 'Sierra Business Solution LLC'
    },
    latex,
    pdfPath: pdfResult.pdfPath,
    texPath: pdfResult.texPath || '',
    emailSubject,
    emailBody,
    validation,
    status: 'pending',
    srinuChatId: ''
  };

  // Write to approval queue
  const queuePath = './data/approval-queue.json';
  let queue = [];
  try {
    const data = await fs.readFile(queuePath, 'utf-8');
    queue = JSON.parse(data);
  } catch (err) {
    // Queue doesn't exist yet, start fresh
  }

  queue.push(submission);
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));

  console.log(`  ✅ Added to approval queue`);
  console.log(`\n✨ Success! The Chatbot Developer role with Azure cloud has been processed.`);
  console.log(`📋 Review at: http://localhost:3001/approval (once server is running)\n`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
