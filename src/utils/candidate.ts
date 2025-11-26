import fs from 'fs/promises';
import path from 'path';

export type CloudProvider = 'azure' | 'aws' | 'gcp' | 'oci' | 'none';
export type RoleTrack =
  | 'agentic_ai'
  | 'chatbot_dev'
  | 'data_science_core'
  | 'genai_platform'
  | 'ai_devops'
  | 'nlp_prompt_engineer'
  | 'base';
export type DomainFocus = 'finance' | 'healthcare' | 'government' | 'generic';
export type TriggerKey =
  | 'promptEngineering'
  | 'chatbot'
  | 'dispute'
  | 'knowledgeGraph'
  | 'timeSeries'
  | 'aiDevOps'
  | 'healthcare'
  | 'nlp';

export interface HighlightTags {
  clouds?: CloudProvider[];
  roleTracks?: RoleTrack[];
  domains?: DomainFocus[];
  triggers?: TriggerKey[];
  keywords?: string[];
  priority?: number;
}

export interface ExperienceHighlight {
  text: string;
  tags?: HighlightTags;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  highlights: ExperienceHighlight[];
}

export interface SkillBlock {
  label: string;
  items: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface SummaryConfig {
  base?: string;
  variants?: Partial<Record<RoleTrack, string>>;
}

export interface ApplicationProfile {
  fullLegalName?: string;
  currentLocation?: string;
  phone?: string;
  email?: string;
  visaStatus?: string;
  interviewAvailability?: string;
  willingToRelocate?: string;
  preferredStartDate?: string;
  overallExperience?: string;
  linkedinUrl?: string;
}

export interface CandidateProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location?: string;
  links?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: SummaryConfig;
  experiences: ExperienceEntry[];
  skills?: SkillBlock[];
  education?: EducationEntry[];
  application?: ApplicationProfile;
  filenameBase?: string;
}

const DEFAULT_PROFILE_PATH = path.join(process.cwd(), 'data', 'candidate.json');

function ensureRequiredProfileFields(profile: CandidateProfile) {
  const missing: string[] = [];
  if (!profile.name) missing.push('name');
  if (!profile.title) missing.push('title');
  if (!profile.email) missing.push('email');
  if (!profile.phone) missing.push('phone');
  if (!profile.experiences || profile.experiences.length === 0) missing.push('experiences');

  if (missing.length > 0) {
    throw new Error(
      `Candidate profile is missing required fields: ${missing.join(
        ', '
      )}. Update the file specified by CANDIDATE_PROFILE_PATH or data/candidate.json.`
    );
  }
}

function parseProfile(raw: string, profilePath: string): CandidateProfile {
  let profile;
  try {
    profile = JSON.parse(raw);
  } catch (error: any) {
    throw new Error(`Failed to parse candidate profile at ${profilePath}: ${error.message}`);
  }

  ensureRequiredProfileFields(profile);
  return profile;
}

export async function loadCandidateProfile(): Promise<CandidateProfile> {
  const profilePath = process.env.CANDIDATE_PROFILE_PATH || DEFAULT_PROFILE_PATH;

  try {
    const raw = await fs.readFile(profilePath, 'utf-8');
    return parseProfile(raw, profilePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Candidate profile not found at ${profilePath}. Create one (see data/candidate.example.json) or set CANDIDATE_PROFILE_PATH.`
      );
    }
    throw error;
  }
}

export function deriveFilenameBase(profile: CandidateProfile, fallback: string = 'candidate_resume'): string {
  if (profile.filenameBase) return sanitizeFilename(profile.filenameBase);
  if (profile.name) {
    const sanitized = sanitizeFilename(profile.name.replace(/\s+/g, '_'));
    return sanitized || fallback;
  }
  return fallback;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\w\d-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
