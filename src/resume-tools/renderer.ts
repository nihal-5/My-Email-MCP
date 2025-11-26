/**
 * PDF Renderer - Compiles LaTeX to PDF using tectonic
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface RenderResult {
  success: boolean;
  pdfPath?: string;
  texPath?: string;
  error?: string;
}

export async function renderPDF(
  latex: string,
  filenameBase: string = 'candidate_resume'
): Promise<RenderResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outboxDir = path.join(process.cwd(), 'outbox');
  const texFilename = `${filenameBase}_${timestamp}.tex`;
  const texPath = path.join(outboxDir, texFilename);
  const pdfFilename = `${filenameBase}_${timestamp}.pdf`;
  const pdfPath = path.join(outboxDir, pdfFilename);

  try {
    // Diagnostic logs
    console.log(`🔧 renderPDF: latex length: ${latex.length}`);
    console.log(`🔧 renderPDF: latex empty: ${latex.trim() === ''}`);
    console.log(`🔧 renderPDF: texPath: ${texPath}`);

    // Ensure outbox directory exists
    await fs.mkdir(outboxDir, { recursive: true });

    // Write LaTeX to file
    await fs.writeFile(texPath, latex, 'utf-8');

    // Check if tectonic is installed
    try {
      await execAsync('which tectonic');
    } catch {
      return {
        success: false,
        texPath,
        error: 'tectonic not installed. Run: brew install tectonic'
      };
    }

    // Skip compilation if latex is empty
    if (latex.trim() === '') {
      console.log('🔧 renderPDF: Skipping PDF compilation for empty latex');
      return {
        success: true,
        pdfPath: '',
        texPath
      };
    }

    // Compile with tectonic
    const { stdout, stderr } = await execAsync(
      `tectonic -o "${outboxDir}" "${texPath}"`,
      { timeout: 60000 }
    );

    // Check if PDF was created
    try {
      await fs.access(pdfPath);
      return {
        success: true,
        pdfPath,
        texPath
      };
    } catch {
      return {
        success: false,
        texPath,
        error: `PDF not created. tectonic output: ${stdout} ${stderr}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      texPath,
      error: error.message || 'Unknown rendering error'
    };
  }
}
