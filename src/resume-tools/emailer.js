/**
 * Email Sender - Sends resume PDF via SMTP
 */
import nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
export async function sendEmail(params) {
    const { SMTP_HOST = 'smtp.gmail.com', SMTP_PORT = '587', SMTP_USER = '', SMTP_PASS = '', FROM_EMAIL = '' } = process.env;
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
        // Read PDF file
        const pdfBuffer = await fs.readFile(params.pdfPath);
        // Send email
        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to: params.to,
            cc: params.cc || undefined,
            subject: params.subject,
            text: params.body,
            attachments: [
                {
                    filename: `${params.filenameBase}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        return {
            success: true,
            messageId: info.messageId
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message || 'Email sending failed'
        };
    }
}
//# sourceMappingURL=emailer.js.map