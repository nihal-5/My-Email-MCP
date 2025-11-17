/**
 * Resume Tools - Main exports for MCP integration
 */
export { parseJD, type ParsedJD } from './parsers/jd-parser.js';
export { tailorResume, type TailorParams } from './parsers/resume-tailor.js';
export { validateResume, type ValidationResult } from './validators/resume-validator.js';
export { renderPDF, type RenderResult } from './renderer.js';
export { sendEmail, type EmailParams, type EmailResult } from './emailer.js';
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
export declare function renderAndEmail(params: RenderAndEmailParams): Promise<RenderAndEmailResult>;
//# sourceMappingURL=index.d.ts.map