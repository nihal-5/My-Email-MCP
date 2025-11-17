#!/usr/bin/env ts-node
/**
 * Manual JD processor - bypasses MCP server for direct testing
 */

import { tailorResume } from '../src/resume-tools/index.js';
import { validateResume } from '../src/resume-tools/validators/resume-validator.js';
import { renderPDF } from '../src/resume-tools/renderer/pdf-renderer.js';
import { submitForApproval } from '../src/approval-integration.js';

async function processJD(
  role: string,
  cloud: 'azure' | 'aws' | 'gcp',
  location: string,
  recruiterName: string,
  recruiterEmail: string,
  jdText: string
) {
  console.log(`\n=== Processing JD ===`);
  console.log(`Role: ${role}`);
  console.log(`Cloud: ${cloud}`);
  console.log(`Location: ${location}\n`);

  // Step 1: Tailor resume
  console.log('Step 1: Tailoring resume...');
  const latex = tailorResume(cloud, role, location);
  console.log(`  Generated ${latex.length} chars of LaTeX`);

  // Step 2: Validate
  console.log('Step 2: Validating resume...');
  const validation = validateResume(latex, cloud);
  console.log(`  Valid: ${validation.ok}`);
  if (!validation.ok) {
    console.error('  Errors:', validation.errors);
    throw new Error('Validation failed');
  }

  // Step 3: Render PDF
  console.log('Step 3: Rendering PDF...');
  const pdfResult = await renderPDF(latex, 'Nihal_Veeramalla_Resume');
  if (!pdfResult.success) {
    throw new Error(pdfResult.error);
  }
  console.log(`  PDF: ${pdfResult.pdfPath}`);

  // Step 4: Submit for approval
  console.log('Step 4: Submitting for approval...');
  const emailSubject = `Application – ${role} – Nihal Veeramalla`;
  const emailBody = `Hi ${recruiterName},\n\n` +
    `I'm interested in the ${role} role${location ? ' in ' + location : ''}. ` +
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

  const result = await submitForApproval({
    jd: jdText,
    parsedData: {
      role,
      cloud,
      location,
      recruiterEmail,
      recruiterName
    },
    latex,
    validation,
    emailSubject,
    emailBody,
    srinuChatId: ''
  });

  console.log(`\n✅ Success!`);
  console.log(`Submission ID: ${result.submissionId}`);
  console.log(`Dashboard: http://localhost:3001/approval\n`);
}

// Main
const args = process.argv.slice(2);
if (args.length < 6) {
  console.error('Usage: ts-node manual-jd-processor.ts <role> <cloud> <location> <recruiterName> <recruiterEmail> <jdText>');
  process.exit(1);
}

const [role, cloud, location, recruiterName, recruiterEmail, jdText] = args;

processJD(role, cloud as any, location, recruiterName, recruiterEmail, jdText)
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
