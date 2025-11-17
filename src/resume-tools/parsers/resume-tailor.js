/**
 * Resume Tailor - Applies cloud-specific substitutions to LaTeX template
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function tailorResume(params) {
    const templatePath = path.join(__dirname, '../templates/resume.tex.tmpl');
    let template = fs.readFileSync(templatePath, 'utf-8');
    // Cloud-specific substitutions based on spec
    const substitutions = {
        azure: {
            '{{FISERV_CLOUD}}': 'Azure',
            '{{FISERV_CLOUD_SEARCH}}': 'Azure AI Search',
            '{{FISERV_CLOUD_K8S}}': 'AKS',
            '{{FISERV_OCR}}': 'Azure Form Recognizer',
            '{{FISERV_CLOUD_SEARCH_SHORT}}': 'Azure AI Search'
        },
        gcp: {
            '{{FISERV_CLOUD}}': 'GCP',
            '{{FISERV_CLOUD_SEARCH}}': 'Vertex AI Search',
            '{{FISERV_CLOUD_K8S}}': 'GKE',
            '{{FISERV_OCR}}': 'Document AI',
            '{{FISERV_CLOUD_SEARCH_SHORT}}': 'Vertex AI'
        },
        aws: {
            // Fiserv should never be AWS, but including for completeness
            '{{FISERV_CLOUD}}': 'Azure',
            '{{FISERV_CLOUD_SEARCH}}': 'Azure AI Search',
            '{{FISERV_CLOUD_K8S}}': 'AKS',
            '{{FISERV_OCR}}': 'Azure Form Recognizer',
            '{{FISERV_CLOUD_SEARCH_SHORT}}': 'Azure AI Search'
        }
    };
    // Apply substitutions
    const subs = substitutions[params.cloud];
    for (const [placeholder, value] of Object.entries(subs)) {
        template = template.replace(new RegExp(placeholder, 'g'), value);
    }
    return template;
}
//# sourceMappingURL=resume-tailor.js.map