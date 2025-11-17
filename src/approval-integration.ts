/**
 * Integration between MCP tools and Approval Server
 */

import { ApprovalServer, PendingApproval } from './approval-server.js';
import { renderPDF } from './resume-tools/index.js';
import { logger } from './utils/logger.js';

let approvalServerInstance: ApprovalServer | null = null;

export function setApprovalServer(server: ApprovalServer): void {
  approvalServerInstance = server;
}

export interface SubmitForApprovalParams {
  jd: string;
  source?: 'email' | 'whatsapp' | 'manual';  // Track where JD came from
  parsedData: {
    role: string;
    cloud: string;
    location: string;
    recruiterEmail: string;
    recruiterName?: string;
  };
  latex: string;
  validation: {
    ok: boolean;
    errors: string[];
  };
  emailSubject: string;
  emailBody: string;
  myNotificationChatId?: string;  // YOUR WhatsApp number for receiving notifications (NEVER Srinu's!)
}

export async function submitForApproval(params: SubmitForApprovalParams): Promise<{ success: boolean; submissionId: string; message: string }> {
  if (!approvalServerInstance) {
    throw new Error('Approval server not initialized');
  }

  try {
    // Render PDF first
    logger.info('Rendering PDF for approval...');
    const renderResult = await renderPDF(params.latex, 'Nihal_Veeramalla_Resume');

    if (!renderResult.success || !renderResult.pdfPath) {
      throw new Error(renderResult.error || 'PDF rendering failed');
    }

    // Create submission ID
    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending approval
    // ⚠️ CRITICAL: myNotificationChatId is YOUR WhatsApp number, NOT Srinu's!
    // This is for sending notifications to YOU when a resume is ready to review.
    // Srinu only SENDS JDs to the system - he NEVER receives any messages.
    const submission: PendingApproval = {
      id: submissionId,
      timestamp: Date.now(),
      jd: params.jd,
      source: params.source || 'manual',  // Track source (email/whatsapp/manual)
      parsedData: params.parsedData,
      latex: params.latex,
      pdfPath: renderResult.pdfPath,
      texPath: renderResult.texPath || '',
      emailSubject: params.emailSubject,
      emailBody: params.emailBody,
      validation: params.validation,
      status: 'pending',
      myNotificationChatId: params.myNotificationChatId  // YOUR number, NOT Srinu's!
    };

    // Add to approval queue
    await approvalServerInstance.addToQueue(submission);

    logger.info(`Submission ${submissionId} added to approval queue`);

    return {
      success: true,
      submissionId,
      message: `Resume submitted for approval. Review at http://localhost:${process.env.APPROVAL_PORT || 3001}/approval`
    };
  } catch (error: any) {
    logger.error('Error submitting for approval:', error);
    throw error;
  }
}
