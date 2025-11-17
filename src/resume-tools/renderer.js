/**
 * PDF Renderer - Compiles LaTeX to PDF using tectonic
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
const execAsync = promisify(exec);
export async function renderPDF(latex, filenameBase = 'Nihal_Veeramalla_Resume') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outboxDir = path.join(process.cwd(), 'outbox');
    const texFilename = `${filenameBase}_${timestamp}.tex`;
    const texPath = path.join(outboxDir, texFilename);
    const pdfFilename = `${filenameBase}_${timestamp}.pdf`;
    const pdfPath = path.join(outboxDir, pdfFilename);
    try {
        // Ensure outbox directory exists
        await fs.mkdir(outboxDir, { recursive: true });
        // Write LaTeX to file
        await fs.writeFile(texPath, latex, 'utf-8');
        // Check if tectonic is installed
        try {
            await execAsync('which tectonic');
        }
        catch {
            return {
                success: false,
                texPath,
                error: 'tectonic not installed. Run: brew install tectonic'
            };
        }
        // Compile with tectonic
        const { stdout, stderr } = await execAsync(`tectonic -o "${outboxDir}" "${texPath}"`, { timeout: 60000 });
        // Check if PDF was created
        try {
            await fs.access(pdfPath);
            return {
                success: true,
                pdfPath,
                texPath
            };
        }
        catch {
            return {
                success: false,
                texPath,
                error: `PDF not created. tectonic output: ${stdout} ${stderr}`
            };
        }
    }
    catch (error) {
        return {
            success: false,
            texPath,
            error: error.message || 'Unknown rendering error'
        };
    }
}
//# sourceMappingURL=renderer.js.map