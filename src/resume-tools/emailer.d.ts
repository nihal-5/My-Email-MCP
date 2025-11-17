/**
 * Email Sender - Sends resume PDF via SMTP
 */
export interface EmailParams {
    to: string;
    cc?: string;
    subject: string;
    body: string;
    pdfPath: string;
    filenameBase: string;
}
export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare function sendEmail(params: EmailParams): Promise<EmailResult>;
//# sourceMappingURL=emailer.d.ts.map