/**
 * Resume Tailor - Generates a resume for a requested cloud/role using the candidate profile (no hard-coded template)
 */

import type { JDAnalysis } from '../ai-customizer.js';
import { generateSpecCompliantResume } from '../spec-generator.js';
import { loadCandidateProfile } from '../../utils/candidate.js';

export interface TailorParams {
  cloud: 'azure' | 'aws' | 'gcp';
  role: string;
  location: string;
}

export async function tailorResume(params: TailorParams): Promise<string> {
  const profile = await loadCandidateProfile();

  const defaultTriggers = {
    promptEngineering: false,
    chatbot: false,
    dispute: false,
    knowledgeGraph: false,
    timeSeries: false,
    aiDevOps: false,
    healthcare: false,
    nlp: false
  };

  const mockAnalysis: JDAnalysis = {
    title: params.role,
    company: '',
    requiredSkills: [],
    cloudFocus: params.cloud,
    roleTrack: 'genai_platform',
    domainFocus: 'generic',
    seniority: 'mid',
    mustHaveKeywords: [],
    triggers: defaultTriggers,
    preferredSkills: [],
    keyResponsibilities: [],
    cloudPlatform: params.cloud.toUpperCase() as any,
    experience: params.location || '',
    technologies: [],
    keywords: [],
    tone: 'technical',
    source: 'email'
  };

  const specResult = await generateSpecCompliantResume(mockAnalysis, profile);
  return specResult.latex;
}
