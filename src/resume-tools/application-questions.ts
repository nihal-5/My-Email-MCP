/**
 * Application Questions Auto-Responder
 * Detects and answers common application questions from JDs
 */

import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import type { CandidateProfile as FullCandidateProfile } from '../utils/candidate.js';

export interface CandidateProfile {
  fullLegalName: string;
  currentLocation: string;
  phone: string;
  email: string;
  visaStatus: string;
  interviewAvailability: string;
  willingToRelocate: string;
  preferredStartDate: string;
  overallExperience: string;
  linkedinUrl: string;
}

// Load from candidate profile file (preferred) or environment variables (no hard-coded defaults)
export function getCandidateProfile(): CandidateProfile {
  const fileProfile = loadProfileFromFile();

  return {
    fullLegalName: process.env.CANDIDATE_FULL_NAME || fileProfile?.fullLegalName || '',
    currentLocation: process.env.CANDIDATE_LOCATION || fileProfile?.currentLocation || '',
    phone: process.env.CANDIDATE_PHONE || fileProfile?.phone || process.env.FROM_PHONE || '',
    email: process.env.CANDIDATE_EMAIL || fileProfile?.email || process.env.FROM_EMAIL || '',
    visaStatus: process.env.CANDIDATE_VISA || fileProfile?.visaStatus || '',
    interviewAvailability: process.env.CANDIDATE_INTERVIEW_AVAILABILITY || fileProfile?.interviewAvailability || '',
    willingToRelocate: process.env.CANDIDATE_WILLING_RELOCATE || fileProfile?.willingToRelocate || '',
    preferredStartDate: process.env.CANDIDATE_START_DATE || fileProfile?.preferredStartDate || '',
    overallExperience: process.env.CANDIDATE_EXPERIENCE || fileProfile?.overallExperience || '',
    linkedinUrl: process.env.CANDIDATE_LINKEDIN || process.env.LINKEDIN_URL || fileProfile?.linkedinUrl || ''
  };
}

/**
 * Detect application questions in JD text
 */
export function detectApplicationQuestions(jdText: string): string[] {
  const lowerJD = jdText.toLowerCase();
  const detectedQuestions: string[] = [];

  // Question patterns to detect
  const questionPatterns = [
    { pattern: /full\s*(legal)?\s*name/i, key: 'fullLegalName' },
    { pattern: /current\s*location/i, key: 'currentLocation' },
    { pattern: /(phone|contact\s*number)/i, key: 'phone' },
    { pattern: /(email|e-mail)/i, key: 'email' },
    { pattern: /(visa|work\s*permit|work\s*authorization)/i, key: 'visaStatus' },
    { pattern: /interview\s*availability/i, key: 'interviewAvailability' },
    { pattern: /(willing\s*to\s*relocate|relocation)/i, key: 'willingToRelocate' },
    { pattern: /(start\s*date|availability\s*to\s*start|join\s*date)/i, key: 'preferredStartDate' },
    { pattern: /(total\s*experience|overall\s*experience|years\s*of\s*experience|it\s*experience)/i, key: 'overallExperience' },
    { pattern: /linkedin/i, key: 'linkedinUrl' }
  ];

  for (const { pattern, key } of questionPatterns) {
    if (pattern.test(lowerJD)) {
      detectedQuestions.push(key);
    }
  }

  return detectedQuestions;
}

/**
 * Generate answers for detected questions
 */
export function generateApplicationAnswers(jdText: string): string | null {
  const detectedQuestions = detectApplicationQuestions(jdText);
  
  if (detectedQuestions.length === 0) {
    logger.info('No application questions detected in JD');
    return null;
  }

  logger.info(`Detected ${detectedQuestions.length} application questions:`, detectedQuestions);

  const profile = getCandidateProfile();
  const answers: string[] = [];

  // Question-to-label mapping
  const questionLabels: Record<string, string> = {
    fullLegalName: 'Full Legal Name',
    currentLocation: 'Current Location',
    phone: 'Phone',
    email: 'Email',
    visaStatus: 'Visa/Work Permit',
    interviewAvailability: 'Interview Availability',
    willingToRelocate: 'Willing to Relocate',
    preferredStartDate: 'Preferred Start Date',
    overallExperience: 'Overall IT Experience',
    linkedinUrl: 'LinkedIn URL'
  };

  answers.push('**APPLICATION DETAILS:**\n');

  for (const question of detectedQuestions) {
    const label = questionLabels[question];
    const value = profile[question as keyof CandidateProfile];
    answers.push(`${label}: ${value}`);
  }

  return answers.join('\n');
}

/**
 * Add application answers to email body if questions detected
 */
export function addApplicationAnswersToEmail(
  emailBody: string,
  jdText: string
): string {
  const applicationAnswers = generateApplicationAnswers(jdText);
  
  if (!applicationAnswers) {
    return emailBody;
  }

  // Add answers after main email body, before signature
  const signatureIndex = emailBody.indexOf('Best regards,');
  
  if (signatureIndex > -1) {
    // Insert before signature
    return emailBody.substring(0, signatureIndex) +
           '\n' + applicationAnswers + '\n\n' +
           emailBody.substring(signatureIndex);
  } else {
    // Append at end
    return emailBody + '\n\n' + applicationAnswers;
  }
}

function loadProfileFromFile(): FullCandidateProfile['application'] | null {
  const profilePath = process.env.CANDIDATE_PROFILE_PATH || path.join(process.cwd(), 'data', 'candidate.json');
  try {
    if (!fs.existsSync(profilePath)) return null;
    const raw = fs.readFileSync(profilePath, 'utf-8');
    const parsed = JSON.parse(raw) as FullCandidateProfile;
    return parsed.application || null;
  } catch (error) {
    logger.warn(`Could not load candidate profile from ${profilePath}: ${(error as any).message}`);
    return null;
  }
}
