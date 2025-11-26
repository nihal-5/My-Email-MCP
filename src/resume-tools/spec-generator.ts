/**
 * Spec-Based Resume Generator
 * Generates ATS-optimized LaTeX resume from candidate profile + JD analysis (no hard-coded identity)
 */

import { logger } from '../utils/logger.js';
import type { JDAnalysis } from './ai-customizer.js';
import { CLOUD_STACKS, fillCloudPlaceholders } from './resume-spec.js';
import {
  CandidateProfile,
  ExperienceEntry,
  ExperienceHighlight,
  HighlightTags,
  RoleTrack,
  loadCandidateProfile
} from '../utils/candidate.js';

export interface ResumeGenerationResult {
  latex: string;
  metadata: {
    candidateName: string;
    cloudFocus: string;
    experienceCount: number;
    highlightsUsed: number;
    summaryVariant: string;
  };
}

interface FormattedExperience {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  highlights: string[];
}

/**
 * Generate a spec-compliant resume using candidate profile data and JD analysis.
 */
export async function generateSpecCompliantResume(
  jdAnalysis: JDAnalysis,
  profileOverride?: CandidateProfile
): Promise<ResumeGenerationResult> {
  const profile = profileOverride || (await loadCandidateProfile());

  logger.info('🎯 Generating spec-based resume from candidate profile (no hard-coded identity)...');
  logger.info(`📋 JD Analysis: ${jdAnalysis.title} @ ${jdAnalysis.company || 'Unknown'}`);
  logger.info(`☁️  Cloud Focus: ${jdAnalysis.cloudFocus}`);
  logger.info(`🎭 Role Track: ${jdAnalysis.roleTrack}`);

const cloud = normalizeCloud(jdAnalysis.cloudFocus);
  const summary = clampDistinct(splitSummary(buildSummary(profile, jdAnalysis)), 7);
  const experiences = buildExperiences(profile.experiences, jdAnalysis, cloud);
  const skills = buildSkills(profile, jdAnalysis);
  const education = profile.education || [];
  const certifications: string[] = [];

  const latex = generateLatex({
    profile,
    summary,
    experiences,
    education,
    skills,
    certifications
  });

  const highlightCount = experiences.reduce((sum, exp) => sum + exp.highlights.length, 0);

  logger.info('✅ Spec-compliant resume generated successfully');
  logger.info(`📊 Experiences: ${experiences.length}, Highlights used: ${highlightCount}`);

  return {
    latex,
    metadata: {
      candidateName: profile.name,
      cloudFocus: cloud.toUpperCase(),
      experienceCount: experiences.length,
      highlightsUsed: highlightCount,
      summaryVariant: jdAnalysis.roleTrack || 'base'
    }
  };
}

function normalizeCloud(cloud: JDAnalysis['cloudFocus']): 'azure' | 'aws' | 'gcp' | 'oci' {
  if (cloud === 'none') return 'azure';
  return (cloud || 'azure') as 'azure' | 'aws' | 'gcp' | 'oci';
}

function buildSummary(profile: CandidateProfile, jdAnalysis: JDAnalysis): string {
  const summaryConfig = profile.summary || {};
  const variantKey = (jdAnalysis.roleTrack || 'base') as RoleTrack;
  const variant = summaryConfig.variants?.[variantKey];
  const base = summaryConfig.base || '';
  const summary = variant || base;
  return escapeLatex(summary.replace(/{PRIMARY_CLOUD}/g, jdAnalysis.cloudFocus?.toUpperCase() || 'CLOUD'));
}
function splitSummary(summary: string): string[] {
  const parts = summary
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const cleaned = parts.map((p) => (p.endsWith('.') ? p.slice(0, -1) : p));
  return cleaned.slice(0, 7);
}

function buildExperiences(
  experiences: ExperienceEntry[],
  jdAnalysis: JDAnalysis,
  cloud: 'azure' | 'aws' | 'gcp' | 'oci'
): FormattedExperience[] {
  const cloudStack = CLOUD_STACKS[cloud];
  const targetCounts = [14, 7, 7]; // Fixed counts based on reference PDF (Fiserv/Hyperleap/Infolab)

  return experiences
    .map((exp, idx) => {
      const target = targetCounts[idx] || 5;
      const selected = selectHighlights(exp.highlights, jdAnalysis, target)
        .map((h) => fillCloudPlaceholders(escapeLatex(h.text), cloudStack));
      const filled = clampDistinct(selected, target);
      return {
        ...exp,
        highlights: filled
      };
    })
    .filter((exp) => exp.highlights.length > 0);
}

function selectHighlights(
  highlights: ExperienceHighlight[],
  jdAnalysis: JDAnalysis,
  maxHighlights: number = 5
): ExperienceHighlight[] {
  if (!highlights || highlights.length === 0) return [];

  const requiredKeywords = new Set(
    [...(jdAnalysis.requiredSkills || []), ...(jdAnalysis.keywords || []), ...(jdAnalysis.preferredSkills || [])].map(
      (k) => k.toLowerCase()
    )
  );

  const scored = highlights
    .map((h) => ({
      highlight: h,
      score: scoreHighlight(h.tags || {}, jdAnalysis, requiredKeywords)
    }))
    .sort((a, b) => b.score - a.score);

  const chosen = scored.slice(0, maxHighlights).map((s) => s.highlight);
  const trimmed = chosen.length > 0 ? chosen : highlights.slice(0, Math.min(maxHighlights, highlights.length));
  return trimmed.slice(0, maxHighlights);
}

function scoreHighlight(tags: HighlightTags, jdAnalysis: JDAnalysis, requiredKeywords: Set<string>): number {
  let score = tags.priority ?? 1;

  if (tags.clouds?.includes(jdAnalysis.cloudFocus)) score += 4;
  if (tags.roleTracks?.includes(jdAnalysis.roleTrack as any)) score += 3;
  if (tags.domains?.includes(jdAnalysis.domainFocus as any)) score += 2;

  if (tags.triggers) {
    for (const trigger of tags.triggers) {
      if ((jdAnalysis.triggers as any)?.[trigger]) score += 2;
    }
  }

  if (tags.keywords) {
    for (const kw of tags.keywords) {
      if (requiredKeywords.has(kw.toLowerCase())) {
        score += 1;
      }
    }
  }

  return score;
}

function buildSkills(profile: CandidateProfile, jdAnalysis: JDAnalysis) {
  if (!profile.skills || profile.skills.length === 0) return [];

  const ordered = [...profile.skills].sort((a, b) => scoreSkillBlock(b, jdAnalysis) - scoreSkillBlock(a, jdAnalysis));

  return ordered
    .map((block) => ({
      header: escapeLatex(block.label),
      items: escapeLatex(block.items.join(', '))
    }))
    .slice(0, 7);
}
function clampDistinct<T>(list: T[], max?: number): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of list) {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
    if (max && unique.length >= max) break;
  }
  return max ? unique.slice(0, max) : unique;
}

function scoreSkillBlock(block: { label: string; items: string[] }, jdAnalysis: JDAnalysis): number {
  let score = 0;
  const lowerItems = block.items.map((i) => i.toLowerCase());

  if (jdAnalysis.cloudFocus !== 'none' && lowerItems.some((i) => i.includes(jdAnalysis.cloudFocus))) score += 2;
  if (jdAnalysis.roleTrack && block.label.toLowerCase().includes('llm')) score += 1;
  if (jdAnalysis.roleTrack === 'ai_devops' && block.label.toLowerCase().includes('ops')) score += 1;

  return score;
}

interface LatexComponents {
  profile: CandidateProfile;
  summary: string[];
  experiences: FormattedExperience[];
  education: CandidateProfile['education'];
  skills: Array<{ header: string; items: string }>;
  certifications?: string[];
}

function generateLatex(components: LatexComponents): string {
  const formatBullets = (bullets: string[]) => bullets.map((b) => `            \\item ${b}`).join('\n');
  const formatSummary = (items: string[]) => items.map((s) => `            \\item ${s}`).join('\n');

  const formatSkills = (blocks: Array<{ header: string; items: string }>) =>
    blocks.map((b) => `            \\textbf{${b.header}:} ${b.items} \\\\`).join('\n');

  const formatExperiences = components.experiences
    .map((exp) => {
      const dates = escapeLatex([exp.startDate, exp.endDate].filter(Boolean).join(' -- ') || '');
      const location = exp.location ? ` -- ${escapeLatex(exp.location)}` : '';
      return `
    % ====== EXPERIENCE ENTRY ======
    \\begin{twocolentry}{${dates}}
        \\textbf{${escapeLatex(exp.role)}}, ${escapeLatex(exp.company)}${location}
    \\end{twocolentry}
    \\vspace{0.03 cm}
    \\begin{highlights}
${formatBullets(exp.highlights)}
    \\end{highlights}`;
    })
    .join('\n');

  const formatEducation = (components.education || [])
    .map((edu) => {
      const dates = escapeLatex([edu.startDate, edu.endDate].filter(Boolean).join(' -- '));
      const location = edu.location ? `, ${escapeLatex(edu.location)}` : '';
      return `
        \\begin{twocolentry}{${dates}}
            \\textbf{${escapeLatex(edu.institution)}}, ${escapeLatex(edu.degree)}${location}
        \\end{twocolentry}
`;
    })
    .join('\n');

  const links = buildLinks(components.profile);
  const telHref = escapeLatex((components.profile.phone || '').replace(/\\s+/g, ''));

  return `\\documentclass[10pt, letterpaper]{article}

% Packages:
\\usepackage[
    ignoreheadfoot,
    top=0.5 cm,
    bottom=1.5 cm,
    left=1.3 cm,
    right=1.3 cm,
    footskip=0.8 cm
]{geometry}
\\usepackage{titlesec}
\\usepackage{tabularx}
\\usepackage{array}
\\usepackage[dvipsnames]{xcolor}
\\definecolor{primaryColor}{RGB}{0, 0, 0}
\\usepackage{enumitem}
\\usepackage{amsmath}
\\usepackage[
    pdftitle={${escapeLatex(components.profile.name)} Resume},
    pdfauthor={${escapeLatex(components.profile.name)}},
    pdfcreator={LaTeX},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref}
\\usepackage{calc}
\\usepackage{bookmark}
\\usepackage{lastpage}
\\usepackage{changepage}
\\usepackage{paracol}
\\usepackage{ifthen}
\\usepackage{needspace}
\\usepackage{iftex}

% Ensure machine-readable/ATS parsable:
\\ifPDFTeX
    \\input{glyphtounicode}
    \\pdfgentounicode=1
    \\usepackage[T1]{fontenc}
    \\usepackage[utf8]{inputenc}
    \\usepackage{lmodern}
\\fi

\\usepackage{charter}

% Global spacing tweaks:
\\raggedright
\\AtBeginEnvironment{adjustwidth}{\\partopsep0pt}
\\pagestyle{empty}
\\setcounter{secnumdepth}{0}
\\setlength{\\parindent}{0pt}
\\setlength{\\topskip}{0pt}
\\setlength{\\columnsep}{0.15cm}
\\setlength{\\parskip}{2pt}
\\pagenumbering{gobble}

\\titleformat{\\section}{\\needspace{4\\baselineskip}\\bfseries\\large}{}{0pt}{}[\\vspace{1pt}\\titlerule]
\\titlespacing{\\section}{-1pt}{0.22 cm}{0.14 cm}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\small$\\bullet$}}$}
\\newenvironment{highlights}{
    \\begin{itemize}[
        topsep=0.06 cm,
        parsep=2pt,
        partopsep=0pt,
        itemsep=2pt,
        leftmargin=0 cm + 10pt
    ]
}{
    \\end{itemize}
}
\\newenvironment{onecolentry}{}{}
\\newenvironment{twocolentry}[2][]{
    \\noindent\\begin{tabularx}{\\linewidth}{@{}X r@{}}
        #2 & #1 \\\\
    \\end{tabularx}
}{}
\\newenvironment{header}{
    \\setlength{\\topsep}{0pt}\\par\\kern0pt\\centering\\linespread{1.08}
}{
    \\par\\kern0pt
}

\\begin{document}
    \\begin{header}
        \\fontsize{19 pt}{19 pt}\\selectfont ${escapeLatex(components.profile.name)}

        \\vspace{1 pt}
        \\large ${escapeLatex(components.profile.title.toUpperCase())}

        \\vspace{1 pt}

        \\normalsize
        ${escapeLatex(components.profile.location || '')} \\;|\\;
        ${links ? links + ' \\;|\\; ' : ''}\\href{mailto:${escapeLatex(components.profile.email)}}{${escapeLatex(
    components.profile.email
  )}} \\;|\\; \\href{tel:${telHref}}{${escapeLatex(components.profile.phone)}}
    \\end{header}

    % =======================
    % ==== SUMMARY ====
    \\section{Summary}
    \\begin{onecolentry}
        \\begin{highlights}
${formatSummary(components.summary)}
        \\end{highlights}
    \\end{onecolentry}

    % =======================
    % ==== EXPERIENCE ====
    \\section{Experience}
${formatExperiences}

    % =======================
    % ==== EDUCATION ====
    \\section{Education}
${formatEducation}

    % =======================
    % ==== SKILLS ====
    \\section{Skills}
        \\begin{onecolentry}
${formatSkills(components.skills)}
        \\end{onecolentry}

\\end{document}`;
}

function buildLinks(profile: CandidateProfile): string {
  const links: string[] = [];
  if (profile.links?.website) {
    links.push(`\\href{${escapeLatex(profile.links.website)}}{Portfolio}`);
  }
  if (profile.links?.linkedin) {
    links.push(`\\href{${escapeLatex(profile.links.linkedin)}}{LinkedIn}`);
  }
  if (profile.links?.github) {
    links.push(`\\href{${escapeLatex(profile.links.github)}}{GitHub}`);
  }
  return links.join(' \\;|\\; ');
}

function escapeLatex(text: string): string {
  return (text || '').replace(/([&#%_$~^{}])/g, '\\$1');
}
