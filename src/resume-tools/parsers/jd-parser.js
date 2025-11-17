/**
 * JD Parser - Extracts key information from job descriptions
 */
export function parseJD(jdText) {
    const lowerJD = jdText.toLowerCase();
    // Extract cloud focus
    let cloud = 'azure';
    if (lowerJD.includes('gcp') || lowerJD.includes('google cloud') || lowerJD.includes('vertex') || lowerJD.includes('bigquery') || lowerJD.includes('gke')) {
        cloud = 'gcp';
    }
    else if (lowerJD.includes('aws') || lowerJD.includes('amazon') || lowerJD.includes('bedrock') || lowerJD.includes('sagemaker')) {
        cloud = 'aws';
    }
    // Extract role (look for common patterns)
    let role = 'AI/ML Engineer';
    const rolePatterns = [
        /(?:position|role|title):\s*([^\n]+)/i,
        /(?:job title):\s*([^\n]+)/i,
        /(?:^|\n)([^\n]*(?:engineer|developer|scientist|architect|lead)[^\n]*)/i
    ];
    for (const pattern of rolePatterns) {
        const match = jdText.match(pattern);
        if (match && match[1]) {
            role = match[1].trim();
            break;
        }
    }
    // Extract location
    let location = '';
    const locationPatterns = [
        /location:\s*([^\n]+)/i,
        /(?:^|\n)([^,\n]*(?:TX|NY|CA|VA|NJ|MA|WA|IL|GA|FL)[^,\n]*)/i
    ];
    for (const pattern of locationPatterns) {
        const match = jdText.match(pattern);
        if (match && match[1]) {
            location = match[1].trim();
            break;
        }
    }
    // Extract recruiter email
    const emailMatch = jdText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const recruiterEmail = emailMatch ? emailMatch[0] : undefined;
    // Extract recruiter name (look for common patterns)
    let recruiterName;
    const namePatterns = [
        /recruiter:\s*([^\n]+)/i,
        /(?:thanks|regards|best)[,\s]*\n\s*([A-Z][a-z]+ [A-Z][a-z]+)/i
    ];
    for (const pattern of namePatterns) {
        const match = jdText.match(pattern);
        if (match && match[1]) {
            recruiterName = match[1].trim();
            break;
        }
    }
    // Extract company
    const companyMatch = jdText.match(/(?:company|organization):\s*([^\n]+)/i);
    const company = companyMatch ? companyMatch[1].trim() : undefined;
    return {
        role,
        cloud,
        location,
        recruiterEmail,
        recruiterName,
        company
    };
}
//# sourceMappingURL=jd-parser.js.map