/**
 * Resume Validator - Enforces strict formatting and content rules
 */
export function validateResume(latex, cloud) {
    const errors = [];
    // Rule 1: ASCII only (no fancy Unicode characters outside standard LaTeX)
    const nonAsciiMatch = latex.match(/[^\x00-\x7F]/g);
    if (nonAsciiMatch && nonAsciiMatch.length > 10) { // Allow some LaTeX special chars
        errors.push(`Contains ${nonAsciiMatch.length} non-ASCII characters`);
    }
    // Rule 2: Bullet counts must be exact
    const bulletCounts = extractBulletCounts(latex);
    if (bulletCounts.fiserv !== 12) {
        errors.push(`Fiserv has ${bulletCounts.fiserv} bullets, expected exactly 12`);
    }
    if (bulletCounts.hyperleap !== 8) {
        errors.push(`Hyperleap AI has ${bulletCounts.hyperleap} bullets, expected exactly 8`);
    }
    if (bulletCounts.infinite !== 5) {
        errors.push(`Infinite Infolab has ${bulletCounts.infinite} bullets, expected exactly 5`);
    }
    // Rule 3: No \textbf inside bullet blocks
    if (hasBoldInBullets(latex)) {
        errors.push('Found \\textbf{} inside bullet text (only allowed in headers/skills headings)');
    }
    // Rule 4: Cloud alignment
    const cloudValidation = validateCloudAlignment(latex, cloud);
    if (!cloudValidation.valid) {
        errors.push(...cloudValidation.errors);
    }
    // Rule 5: Check for required cloud nouns in Hyperleap (must have AWS)
    if (!latex.includes('AWS') || !latex.includes('Textract')) {
        errors.push('Hyperleap AI must mention AWS and Textract');
    }
    return {
        ok: errors.length === 0,
        errors
    };
}
function extractBulletCounts(latex) {
    const fiservSection = latex.match(/Fiserv[^\\]*\\begin{highlights}([\s\S]*?)\\end{highlights}/);
    const hyperleapSection = latex.match(/Hyperleap AI[^\\]*\\begin{highlights}([\s\S]*?)\\end{highlights}/);
    const infiniteSection = latex.match(/Infinite Infolab[^\\]*\\begin{highlights}([\s\S]*?)\\end{highlights}/);
    const countBullets = (section) => {
        if (!section)
            return 0;
        const bullets = section[1].match(/\\item/g);
        return bullets ? bullets.length : 0;
    };
    return {
        fiserv: countBullets(fiservSection),
        hyperleap: countBullets(hyperleapSection),
        infinite: countBullets(infiniteSection)
    };
}
function hasBoldInBullets(latex) {
    // Extract all bullet sections
    const bulletSections = latex.match(/\\begin{highlights}([\s\S]*?)\\end{highlights}/g);
    if (!bulletSections)
        return false;
    for (const section of bulletSections) {
        // Check if there's \textbf{} inside \item text
        const items = section.match(/\\item[^\\]*/g) || [];
        for (const item of items) {
            if (item.includes('\\textbf{')) {
                return true;
            }
        }
    }
    return false;
}
function validateCloudAlignment(latex, cloud) {
    const errors = [];
    const fiservSection = latex.match(/Fiserv[^\\]*\\begin{highlights}([\s\S]*?)\\end{highlights}/);
    if (!fiservSection) {
        errors.push('Could not find Fiserv section');
        return { valid: false, errors };
    }
    const fiservText = fiservSection[0];
    switch (cloud) {
        case 'azure':
            if (!fiservText.includes('Azure') || !fiservText.includes('AKS')) {
                errors.push('For Azure cloud, Fiserv must mention Azure and AKS');
            }
            break;
        case 'gcp':
            if (!fiservText.includes('GCP') && !fiservText.includes('GKE') && !fiservText.includes('Vertex')) {
                errors.push('For GCP cloud, Fiserv must mention GCP, GKE, or Vertex');
            }
            break;
        case 'aws':
            // Fiserv should never be AWS per spec
            errors.push('Fiserv should never use AWS cloud (only Azure or GCP allowed)');
            break;
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=resume-validator.js.map