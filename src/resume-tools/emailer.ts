/**
 * Email Sender - Sends resume PDF via SMTP
 */

import nodemailer from 'nodemailer';
import * as fs from 'fs/promises';

export interface EmailParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  pdfPath?: string;
  filenameBase?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const {
    SMTP_HOST = 'smtp.gmail.com',
    SMTP_PORT = '587',
    SMTP_USER = '',
    SMTP_PASS = '',
    FROM_EMAIL = ''
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    return {
      success: false,
      error: 'Missing SMTP configuration. Set SMTP_USER, SMTP_PASS, FROM_EMAIL in .env'
    };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify connection
    await transporter.verify();

    // Resolve CC with safe fallback so CC is never silently dropped
    const ccResolved =
      params.cc ||
      process.env.CC_EMAIL ||
      'Srinu@blueridgeinfotech.com';

    // Prepare email options
    const mailOptions: any = {
      from: FROM_EMAIL,
      to: params.to,
      cc: ccResolved || undefined,
      subject: params.subject,
      text: params.body
    };

    // Add attachment if PDF path provided
    if (params.pdfPath && params.pdfPath.trim() !== '') {
      // Read PDF file
      const pdfBuffer = await fs.readFile(params.pdfPath);
      mailOptions.attachments = [
        {
          filename: `${params.filenameBase}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ];
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Email sending failed'
    };
  }
}
