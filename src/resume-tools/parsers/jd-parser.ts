/**
 * JD Parser - Extracts key information from job descriptions
 * Uses AI for better extraction with regex fallback
 */

import { generateWithAI } from '../ai-customizer.js';
import { logger } from '../../utils/logger.js';

export interface ParsedJD {
  role: string;
  cloud: 'azure' | 'aws' | 'gcp';
  location: string;
  recruiterEmail?: string;
  recruiterName?: string;
  company?: string;
  technologies?: string[];
  requirements?: string[];
  hasApplicationQuestions?: boolean;  // TRUE if JD asks for personal details
}

/**
 * AI-powered JD parsing with regex fallback
 */
export async function parseJDWithAI(jdText: string): Promise<ParsedJD> {
  logger.info('Parsing JD with AI...');
  
  try {
    const prompt = `Extract structured information from this job description. Return ONLY valid JSON with these fields:
{
  "role": "job title (max 60 chars, e.g. 'Senior Data Scientist')",
  "company": "company name or empty string",
  "location": "location or empty string",
  "cloud": "azure or aws or gcp (infer from technologies)",
  "technologies": ["tech1", "tech2", ...] (max 5 key technologies),
  "requirements": ["req1", "req2", ...] (max 3 key requirements),
  "recruiterEmail": "email or empty string",
  "recruiterName": "name or empty string"
}

Job Description:
\${jdText.substring(0, 2000)}

Return ONLY the JSON, no other text.`;

    const response = await generateWithAI(prompt, 500);
    
    // Clean and parse JSON
    let cleanedText = response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\r\n/g, ' ')
      .replace(/[\r\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const jsonMatch = cleanedText.match(/\{[^}]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    logger.info(`✅ AI parsed JD: \${parsed.role} at \${parsed.company || 'Unknown'}`);
    
    return {
      role: parsed.role || 'Position',
      cloud: parsed.cloud || 'azure',
      location: parsed.location || '',
      company: parsed.company || undefined,
      technologies: parsed.technologies || [],
      requirements: parsed.requirements || [],
      recruiterEmail: parsed.recruiterEmail || undefined,
      recruiterName: parsed.recruiterName || undefined,
      hasApplicationQuestions: hasApplicationQuestions(jdText)
    };
    
  } catch (error: any) {
    logger.warn(`⚠️ AI JD parsing failed: \${error.message}, using regex fallback`);
    return parseJDRegex(jdText);
  }
}

/**
 * Original regex-based parsing as fallback
 */
export function parseJDRegex(jdText: string): ParsedJD {
  const lowerJD = jdText.toLowerCase();

  // Extract cloud focus
  let cloud: 'azure' | 'aws' | 'gcp' = 'azure';

  if (lowerJD.includes('gcp') || lowerJD.includes('google cloud platform') ||
      lowerJD.includes('vertex ai') || lowerJD.includes('bigquery') ||
      lowerJD.includes('gke') || lowerJD.includes('cloud run')) {
    cloud = 'gcp';
  }
  else if (lowerJD.includes('aws ') || lowerJD.includes(' aws') ||
           lowerJD.includes('bedrock') || lowerJD.includes('sagemaker') ||
           lowerJD.includes('ec2') || lowerJD.includes('eks') ||
           lowerJD.includes('lambda')) {
    cloud = 'aws';
  }
  else if (lowerJD.includes('azure') || lowerJD.includes('microsoft cloud')) {
    cloud = 'azure';
  }
  else if (lowerJD.includes('dialogflow') || lowerJD.includes('google cloud')) {
    cloud = 'gcp';
  }

  // Extract role
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

  // Extract recruiter name
  let recruiterName: string | undefined;
  const namePatterns = [
    /recruiter:\s*([^\n]+)/i,
    /(?:thank you|thanks|regards|best)[,\s]*[\r\n]+\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /--[\r\n]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
  ];

  for (const pattern of namePatterns) {
    const match = jdText.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Remove job titles
      name = name.replace(/\s+(Sr\.|Jr\.|III|II|Ph\.D\.|MBA)$/i, '').trim();
      const nameParts = name.split(/\s+/).filter(p => /^[A-Z][a-z]+$/.test(p));
      if (nameParts.length >= 2) {
        recruiterName = nameParts.slice(0, 2).join(' ');
        break;
      }
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
    company,
    technologies: [],
    requirements: [],
    hasApplicationQuestions: hasApplicationQuestions(jdText)
  };
}

/**
 * Default export - synchronous regex parsing for MCP/orchestrator
 */
export function parseJD(jdText: string): ParsedJD {
  return parseJDRegex(jdText);
}

/**
 * Detect if JD asks for application questions
 * Returns true if JD explicitly requests candidate details like:
 * - Full Legal Name, Current Location, Phone, Visa Status, etc.
 */
export function hasApplicationQuestions(jdText: string): boolean {
  const lowerJD = jdText.toLowerCase();
  
  // Look for common application question patterns
  const patterns = [
    /please fill.*below details/i,
    /full legal name:/i,
    /current location:/i,
    /visa.*work permit:/i,
    /interview availability:/i,
    /salary expectations:/i,
    /willing to relocate:/i,
    /preferred start date:/i,
    /overall.*experience:/i,
    /linkedin url:/i,
    /provide.*following.*details/i,
    /kindly.*share.*details/i,
    /please.*provide.*information/i
  ];
  
  // If 3 or more patterns match, likely has application questions
  const matchCount = patterns.filter(pattern => pattern.test(jdText)).length;
  return matchCount >= 3;
}
