/**
 * Resume Tools - Main exports for MCP integration
 */
export { parseJD } from './parsers/jd-parser.js';
export { tailorResume } from './parsers/resume-tailor.js';
export { validateResume } from './validators/resume-validator.js';
export { renderPDF } from './renderer.js';
export { sendEmail } from './emailer.js';
import { renderPDF } from './renderer.js';
import { sendEmail } from './emailer.js';
export async function renderAndEmail(params) {
    const filenameBase = params.filenameBase || 'Nihal_Veeramalla_Resume';
    // Step 1: Render PDF
    const renderResult = await renderPDF(params.latex, filenameBase);
    if (!renderResult.success || !renderResult.pdfPath) {
        return {
            success: false,
            texPath: renderResult.texPath,
            error: renderResult.error || 'PDF rendering failed'
        };
    }
    // Step 2: Send Email
    const emailResult = await sendEmail({
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        body: params.body,
        pdfPath: renderResult.pdfPath,
        filenameBase
    });
    return {
        success: emailResult.success,
        pdfPath: renderResult.pdfPath,
        texPath: renderResult.texPath,
        messageId: emailResult.messageId,
        error: emailResult.error
    };
}
//# sourceMappingURL=index.js.map