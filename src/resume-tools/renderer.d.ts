/**
 * PDF Renderer - Compiles LaTeX to PDF using tectonic
 */
export interface RenderResult {
    success: boolean;
    pdfPath?: string;
    texPath?: string;
    error?: string;
}
export declare function renderPDF(latex: string, filenameBase?: string): Promise<RenderResult>;
//# sourceMappingURL=renderer.d.ts.map