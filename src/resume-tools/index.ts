/**
 * Resume Tools - Main exports for MCP integration
 */

export { parseJD, type ParsedJD } from './parsers/jd-parser.js';
export { tailorResume, type TailorParams } from './parsers/resume-tailor.js';
export { validateResume, type ValidationResult } from './validators/resume-validator.js';
export { renderPDF, type RenderResult } from './renderer.js';
export { sendEmail, type EmailParams, type EmailResult } from './emailer.js';
export {
  analyzeJobDescription,
  customizeResumeContent,
  generatePersonalizedEmail,
  aiCustomizeApplication,
  type JDAnalysis
} from './ai-customizer.js';
export {
  generateSpecCompliantResume,
  type ResumeGenerationResult
} from './spec-generator.js';

import { parseJD } from './parsers/jd-parser.js';
import { tailorResume } from './parsers/resume-tailor.js';
import { validateResume } from './validators/resume-validator.js';
import { renderPDF } from './renderer.js';
import { sendEmail } from './emailer.js';

/**
 * Combined render and email function
 */
export interface RenderAndEmailParams {
  latex: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  filenameBase?: string;
}

export interface RenderAndEmailResult {
  success: boolean;
  pdfPath?: string;
  texPath?: string;
  messageId?: string;
  error?: string;
}

export async function renderAndEmail(
  params: RenderAndEmailParams
): Promise<RenderAndEmailResult> {
  const filenameBase = params.filenameBase || 'Nihal_Veeramalla_Resume';

  console.log(`📧 renderAndEmail: Starting with latex length: ${params.latex.length}`);
  console.log(`📧 renderAndEmail: filenameBase: ${filenameBase}`);

  // Step 1: Render PDF
  const renderResult = await renderPDF(params.latex, filenameBase);

  if (!renderResult.success) {
    return {
      success: false,
      texPath: renderResult.texPath,
      error: renderResult.error || 'PDF rendering failed'
    };
  }

  console.log(`📧 renderAndEmail: renderResult.pdfPath: ${renderResult.pdfPath}`);

  // Step 2: Send Email (always send, with or without attachment)
  console.log('📧 renderAndEmail: Sending email...');
  const emailResult = await sendEmail({
    to: params.to,
    cc: params.cc,
    subject: params.subject,
    body: params.body,
    pdfPath: renderResult.pdfPath || undefined,
    filenameBase: renderResult.pdfPath ? filenameBase : undefined
  });

  return {
    success: emailResult.success,
    pdfPath: renderResult.pdfPath,
    texPath: renderResult.texPath,
    messageId: emailResult.messageId,
    error: emailResult.error
  };

  return {
    success: emailResult.success,
    pdfPath: renderResult.pdfPath,
    texPath: renderResult.texPath,
    messageId: emailResult.messageId,
    error: emailResult.error
  };
}
