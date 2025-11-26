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
import { deriveFilenameBase, loadCandidateProfile } from '../utils/candidate.js';
import * as fs from 'fs';
import * as path from 'path';

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
  cloud?: string;
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
  let filenameBase = params.filenameBase;

  if (!filenameBase) {
    try {
      const profile = await loadCandidateProfile();
      filenameBase = deriveFilenameBase(profile);
    } catch (error: any) {
      // Fall back to generic if profile is missing; avoid blocking send
      filenameBase = 'candidate_resume';
    }
  }

  // Try cloud-specific PDF
  let attachmentPath: string | undefined;
  if (params.cloud) {
    const resolved = resolveCloudPdf(params.cloud);
    if (resolved) {
      attachmentPath = resolved;
      console.log(`📎 Using cloud-specific resume: ${attachmentPath}`);
    }
  }

  // If no cloud PDF, render from latex
  if (!attachmentPath) {
    console.log(`📧 renderAndEmail: Starting with latex length: ${params.latex.length}`);
    console.log(`📧 renderAndEmail: filenameBase: ${filenameBase}`);

    const renderResult = await renderPDF(params.latex, filenameBase);

    if (!renderResult.success) {
      return {
        success: false,
        texPath: renderResult.texPath,
        error: renderResult.error || 'PDF rendering failed'
      };
    }
    attachmentPath = renderResult.pdfPath;
    console.log(`📧 renderAndEmail: renderResult.pdfPath: ${renderResult.pdfPath}`);
  }

  // Step 2: Send Email (always send, with or without attachment)
  console.log('📧 renderAndEmail: Sending email...');
  const emailResult = await sendEmail({
    to: params.to,
    cc: params.cc,
    subject: params.subject,
    body: params.body,
    pdfPath: attachmentPath || undefined,
    filenameBase: attachmentPath ? filenameBase : undefined
  });

  return {
    success: emailResult.success,
    pdfPath: attachmentPath,
    texPath: undefined,
    messageId: emailResult.messageId,
    error: emailResult.error
  };
}

function resolveCloudPdf(cloud: string): string | undefined {
  const clean = cloud.toLowerCase();
  const baseDir = path.join(process.cwd(), 'profile');
  const map: Record<string, string> = {
    azure: 'azure/Nihal_VeeramallaGenAI.pdf',
    aws: 'aws/Nihal_Veeramalla_GenAI.pdf',
    gcp: 'gcp/Nihal_Veeramalla_GenAI.pdf',
    ibm: 'ibm/Nihal_Veeramalla_GenAI.pdf',
    oracle: 'oracle/Nihal_Veeramalla_GenAI.pdf',
    oci: 'oracle/Nihal_Veeramalla_GenAI.pdf'
  };
  const rel = map[clean];
  if (!rel) return undefined;
  const full = path.join(baseDir, rel);
  return fs.existsSync(full) ? full : undefined;
}

export { resolveCloudPdf };
