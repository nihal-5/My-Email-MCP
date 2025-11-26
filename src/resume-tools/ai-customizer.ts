/**
 * AI-Powered Resume and Email Customization
 * Uses OpenAI GPT-5 for all AI operations
 */

import { logger } from '../utils/logger.js';
import OpenAI from 'openai';
import { getAIConfig } from '../utils/config.js';
import { addApplicationAnswersToEmail } from './application-questions.js';

/**
 * Generate content using configured AI model (default: GPT-5 for advanced tasks)
 */
export async function generateWithAI(prompt: string, maxTokens: number = 2000, modelOverride?: string): Promise<string> {
  const aiConfig = getAIConfig();
  const model = modelOverride || aiConfig.jdAnalysisModel;

  try {
    logger.info(`🤖 Using ${model} for AI generation...`);
    const openaiClient = new OpenAI({ apiKey: aiConfig.apiKey });
    
    const response = await openaiClient.chat.completions.create({
      model: model,
      messages: [{ 
        role: 'user', 
        content: prompt 
      }],
      max_completion_tokens: maxTokens
    });
      
    const text = response.choices[0]?.message?.content || '';
    logger.info(`✅ Success with ${model}`);
    return text;
  } catch (error: any) {
    logger.error(`${model} failed: ${error.message}`);
    throw error;
  }
}

/**
 * Analysis result from job description parsing
 */
export interface JDAnalysis {
  title: string;
  company?: string;
  hiringManager?: string;  // Hiring manager's name if mentioned
  recruiterName?: string;  // Recruiter/contact name if parsed
  source?: 'whatsapp' | 'email';  // Where the JD came from
  requiredSkills: string[];
  cloudFocus: 'azure' | 'aws' | 'gcp' | 'oci' | 'none';
  roleTrack: 'agentic_ai' | 'chatbot_dev' | 'data_science_core' | 'genai_platform' | 'ai_devops' | 'nlp_prompt_engineer';
  domainFocus: 'finance' | 'healthcare' | 'government' | 'generic';
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  mustHaveKeywords: string[];
  triggers: {
    promptEngineering: boolean;
    chatbot: boolean;
    dispute: boolean;
    knowledgeGraph: boolean;
    timeSeries: boolean;
    aiDevOps: boolean;
    healthcare: boolean;
    nlp: boolean;
  };
  preferredSkills: string[];
  keyResponsibilities: string[];
  cloudPlatform?: 'AWS' | 'Azure' | 'GCP' | 'Multi-cloud';
  experience: string;
  technologies: string[];
  keywords: string[];
  tone: 'formal' | 'casual' | 'technical';
}

/**
 * Analyze a job description using AI to extract key requirements
 * Implements comprehensive JD parsing from spec with cloud/role/domain detection
 */
export async function analyzeJobDescription(jobDescription: string): Promise<JDAnalysis> {
  logger.info('Analyzing job description with comprehensive spec-based parsing...');

  try {
    const prompt = `You are an expert job description analyzer following a strict specification.

TASK: Extract structured information from this JD and return ONLY valid JSON (no markdown, no extra text).

DETECTION RULES:

1. CLOUD FOCUS (pick ONE):
   - "azure" if: azure, aks, cognitive services, ai search, entra id, key vault, databricks (azure)
   - "aws" if: aws, eks, sagemaker, textract, opensearch, iam, kms, bedrock
   - "gcp" if: gcp, gke, vertex ai, document ai, cloud run, artifact registry, secret manager
   - "oci" if: oracle cloud, oci, oke, oci generative ai, object storage, vault
   - "none" if no cloud mentioned

2. ROLE TRACK (pick ONE based on strongest signal):
   - "agentic_ai" if: agent, agentic, langgraph, crew, multi-agent, tool calling, planning
   - "chatbot_dev" if: chatbot, watson, lex, dialogflow, kore.ai, moveworks, voice gateway
   - "data_science_core" if: predictive, experiments, a/b, bi, tableau, hadoop, sql-heavy
   - "genai_platform" if: rag, vector db, embedding, evaluation, guardrails, groundedness
   - "ai_devops" if: ci/cd, gitlab, jenkins, artifactory, sonarqube, blue/green, sast, dast, mlops, devsecops, observability
   - "nlp_prompt_engineer" if: prompt, specification, pl/sql, extraction, validation, red-teaming, nlp, ner, named entity recognition, hugging face, transformers, spacy, nltk, document understanding

3. DOMAIN FOCUS (pick ONE):
   - "finance" if: banking, fintech, payments, trading, financial services
   - "healthcare" if: clinical, medical, hipaa, healthcare, patient
   - "government" if: federal, gov, public sector, dod, fedramp
   - "generic" otherwise

4. SENIORITY (pick ONE):
   - "junior" if: 0-2 years, entry, junior, associate
   - "mid" if: 2-5 years, mid-level
   - "senior" if: 5-10 years, senior, staff
   - "lead" if: 10+ years, principal, lead, architect, manager

5. TRIGGERS (all boolean):
   - promptEngineering: prompt engineering OR specification prompts OR LLM prompt design
   - chatbot: chatbot, watson, dialogflow, lex, moveworks, voice gateway
   - dispute: dispute, chargeback, case filing, operations
   - knowledgeGraph: knowledge graph, graph search, ontology
   - timeSeries: time series
   - aiDevOps: ai devops, ci/cd, devsecops, scanning
   - healthcare: healthcare, clinical
   - nlp: nlp, natural language processing, ner, named entity recognition, hugging face, transformers, spacy, nltk, prompt engineering, extraction, document understanding

6. MUST-HAVE KEYWORDS (extract exactly as found):
   - Look for: langgraph, langchain, mcp, rag, vector, faiss, pgvector, pinecone, opensearch,
     evaluation, groundedness, prompt engineering, function calling, fastapi, kubernetes,
     docker, terraform, databricks, redis, azure ai search, textract, document ai,
     vllm, observability, opentelemetry, datadog, guardrails, watson, lex, moveworks,
     dialogflow, knowledge graph, graph, cosmos gremlin, time series, mlflow

Return JSON with this EXACT structure:
{
  "title": "string",
  "company": "string or null",
  "hiringManager": "string or null (extract from 'Contact X', 'Report to Y', etc.)",
  "requiredSkills": ["array of strings"],
  "cloudFocus": "azure|aws|gcp|oci|none",
  "roleTrack": "agentic_ai|chatbot_dev|data_science_core|genai_platform|ai_devops|nlp_prompt_engineer",
  "domainFocus": "finance|healthcare|government|generic",
  "seniority": "junior|mid|senior|lead",
  "mustHaveKeywords": ["exact keywords from JD"],
  "triggers": {
    "promptEngineering": boolean,
    "chatbot": boolean,
    "dispute": boolean,
    "knowledgeGraph": boolean,
    "timeSeries": boolean,
    "aiDevOps": boolean,
    "healthcare": boolean,
    "nlp": boolean
  },
  "preferredSkills": ["array of strings"],
  "keyResponsibilities": ["array of strings"],
  "cloudPlatform": "AWS|Azure|GCP|Multi-cloud|null",
  "experience": "string (e.g., '3-5 years')",
  "technologies": ["array of strings"],
  "keywords": ["array of strings"],
  "tone": "formal|casual|technical"
}

Job Description:
${jobDescription}

Return ONLY the JSON object, no other text.`;

    const aiConfig = getAIConfig();
    const content = await generateWithAI(prompt, 1000, aiConfig.jdAnalysisModel);
    
    const analysis = parseJsonFromText(content, jobDescription);
    logger.info(`JD Analysis complete: ${analysis.title} @ ${analysis.company || 'Unknown Company'}`);
    logger.info(`🎯 Cloud Platform Detected: ${analysis.cloudPlatform || 'Not specified'}`);

    return analysis;
  } catch (error: any) {
    logger.error(`Error analyzing job description: ${error.message}`);
    throw error;
  }
}

function parseJsonFromText(text: string, fallbackJD: string): JDAnalysis {
  const trimmed = text.trim();

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // fall through
    }
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Build a safe fallback to avoid hard failure
    const firstLine = fallbackJD.split(/\n/).find((l) => l.trim().length > 0)?.trim() || 'Role';
    return {
      title: firstLine,
      company: undefined,
      hiringManager: undefined,
      requiredSkills: [],
      cloudFocus: detectCloud(fallbackJD),
      roleTrack: 'genai_platform',
      domainFocus: 'generic',
      seniority: 'mid',
      mustHaveKeywords: [],
      triggers: {
        promptEngineering: false,
        chatbot: false,
        dispute: false,
        knowledgeGraph: false,
        timeSeries: false,
        aiDevOps: false,
        healthcare: false,
        nlp: false
      },
      preferredSkills: [],
      keyResponsibilities: [],
      cloudPlatform: undefined,
      experience: '',
      technologies: [],
      keywords: [],
      tone: 'technical'
    };
  }
}

function detectCloud(text: string): 'azure' | 'aws' | 'gcp' | 'oci' | 'none' {
  const lower = text.toLowerCase();
  if (lower.includes('azure')) return 'azure';
  if (lower.includes('aws') || lower.includes('amazon')) return 'aws';
  if (lower.includes('gcp') || lower.includes('google cloud')) return 'gcp';
  if (lower.includes('oci') || lower.includes('oracle')) return 'oci';
  if (lower.includes('ibm')) return 'oci'; // fallback to oci for oracle/ibm mapping
  return 'none';
}

async function loadProfileForEmail() {
  try {
    const { loadCandidateProfile } = await import('../utils/candidate.js');
    return await loadCandidateProfile();
  } catch (error: any) {
    logger.warn(`⚠️ Unable to load candidate profile for email context: ${error.message}`);
    return null;
  }
}

function extractLocationFromJD(originalJD: string): string | undefined {
  // Prefer explicit "Location:" line
  const lineMatch = originalJD.match(/location\s*[:\-]\s*(.+)/i);
  if (lineMatch?.[1]) {
    return lineMatch[1].split(/\r?\n/)[0].trim().replace(/^[\-•\s]+/, '');
  }

  // Fallback: simple city/state pattern or multi-location slash-separated text
  const cityStateMatch = originalJD.match(/\b([A-Z][a-zA-Z]+[, ]+(?:[A-Z]{2}|[A-Za-z]+)(?:\s*\/\s*[A-Z][a-zA-Z]+[, ]*(?:[A-Z]{2}|[A-Za-z]+))*)/);
  if (cityStateMatch?.[1]) {
    return cityStateMatch[1].trim();
  }

  return undefined;
}

function collectCandidateHighlights(profile: any): string[] {
  const highlights = (profile?.experiences || [])
    .flatMap((exp: any) => (exp.highlights || []).map((h: any) => h.text))
    .filter(Boolean)
    .slice(0, 4);
  return highlights;
}

function collectClouds(profile: any): string {
  const cloudSet = new Set<string>();
  (profile?.experiences || []).forEach((exp: any) => {
    (exp.highlights || []).forEach((h: any) => {
      (h.tags?.clouds || []).forEach((c: string) => cloudSet.add(c.toUpperCase()));
    });
  });
  if (cloudSet.size === 0) {
    return 'AWS, Azure, GCP';
  }
  return Array.from(cloudSet).join(', ');
}

function buildSignature(candidateInfo: { name: string; email: string; phone: string; title: string; linkedin?: string }, profile: any): string {
  const lines = [
    'Thanks,',
    candidateInfo.name || profile?.name,
    profile?.title || candidateInfo.title,
    candidateInfo.email,
    candidateInfo.phone
  ].filter(Boolean);

  const linkedin = profile?.links?.linkedin || candidateInfo.linkedin;
  if (linkedin) lines.push(`LinkedIn: ${linkedin}`);

  return lines.join('\n');
}

// Lightweight contact-name extractor from JD text (email local part or sign-off)
function deriveContactNameFromJD(jd: string): string | undefined {
  if (!jd) return undefined;
  // Try to grab sign-off names (e.g., "Thanks, John Doe")
  const signoffMatch = jd.match(/(?:thanks|regards|sincerely)[^\\w\\n]{0,10}([A-Za-z][A-Za-z .'-]{1,40})/i);
  if (signoffMatch && signoffMatch[1]) {
    const name = signoffMatch[1].trim();
    if (name.split(' ').length <= 4) return name.replace(/\s+/g, ' ');
  }
  // Fall back to email local-part (e.g., ayushy1@ -> Ayushy)
  const emailMatch = jd.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/i);
  if (emailMatch) {
    const local = emailMatch[0].split('@')[0]
      .replace(/\d+/g, '')
      .replace(/[._]+/g, ' ')
      .trim();
    if (local) {
      // Capitalize words
      return local
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
  return undefined;
}

/**
 * Generate customized resume content based on JD analysis
 * Keeps core essence but emphasizes relevant experience with DEEP customization
 */
export async function customizeResumeContent(
  baseResumeTemplate: string,
  jdAnalysis: JDAnalysis,
  originalJD: string
): Promise<string> {
  logger.info(`Customizing resume for ${jdAnalysis.title} position...`);
  logger.info(`Base template length: ${baseResumeTemplate.length} characters`);
  logger.info(`🎯 Target Cloud Platform: ${jdAnalysis.cloudPlatform || 'Not specified'}`);

  try {
    // Build skill-specific examples
    const skillExamples = jdAnalysis.requiredSkills.slice(0, 5).map(skill => 
      `- ${skill}: Add 1-2 concrete bullet points showing this skill in action`
    ).join('\n');

    // Build cloud platform specific instruction with EXAMPLES
    const cloudInstruction = jdAnalysis.cloudPlatform 
      ? `
🚨 CRITICAL: This is a ${jdAnalysis.cloudPlatform} role! 🚨

YOU MUST DEEPLY CUSTOMIZE FOR ${jdAnalysis.cloudPlatform}:

1. REORDER EXPERIENCE - Put ${jdAnalysis.cloudPlatform} work at the TOP
2. EMPHASIZE ${jdAnalysis.cloudPlatform} - Expand relevant bullets from 1 line to 2-3 lines with specific ${jdAnalysis.cloudPlatform} services
3. ADD DEPTH - Turn generic "deployed on cloud" into "${jdAnalysis.cloudPlatform}-specific: OCI Compute, OCI Container Engine, OCI Object Storage"
4. MINIMIZE OTHER CLOUDS - Shorten or remove AWS/Azure/GCP mentions (unless the JD asks for multi-cloud)
5. USE ${jdAnalysis.cloudPlatform} TERMINOLOGY - Replace generic cloud terms with ${jdAnalysis.cloudPlatform} service names

EXAMPLE TRANSFORMATION:
Before: "Deployed containerized applications on cloud with CI/CD"
After: "Deployed containerized applications on ${jdAnalysis.cloudPlatform} Container Engine for Kubernetes (OKE) with ${jdAnalysis.cloudPlatform} DevOps for CI/CD pipelines; configured ${jdAnalysis.cloudPlatform} Container Registry for image storage and ${jdAnalysis.cloudPlatform} Logging for centralized log aggregation"
`
      : '';

    const prompt = `You are an EXPERT resume writer who creates ATS-optimized, deeply customized resumes.

${cloudInstruction}

JOB POSTING ANALYSIS:
- Title: ${jdAnalysis.title}
- Company: ${jdAnalysis.company}
- Required Skills: ${jdAnalysis.requiredSkills.join(', ')}
- Preferred Skills: ${jdAnalysis.preferredSkills.join(', ')}
- Cloud Platform: ${jdAnalysis.cloudPlatform || 'Any'}

YOUR MISSION - DEEP CUSTOMIZATION:

1. KEEP THE CORE TRUTH
   - Don't invent experience that doesn't exist
   - Don't add skills the candidate doesn't have
   - Work with what's already in the resume

2. EMPHASIZE & EXPAND RELEVANT EXPERIENCE
   - If resume mentions "${jdAnalysis.requiredSkills[0]}" → Expand that bullet point with 2-3 specific examples
   - If JD wants "Prompt Engineering" → Find AI/LLM experience and ADD detailed prompt engineering examples
   - If JD wants "${jdAnalysis.cloudPlatform}" → Expand cloud bullets with specific ${jdAnalysis.cloudPlatform} service names

3. REORDER FOR RELEVANCE
   - Move most relevant experience to TOP of each section
   - Put matching skills FIRST in skills section
   - Rearrange bullet points: most relevant → least relevant

4. ADD DEPTH WITH SPECIFICS
   Turn generic statements into detailed achievements:
   
   GENERIC: "Built ML pipeline"
   SPECIFIC: "Built end-to-end ML pipeline using PyTorch and MLflow for model versioning, deployed on ${jdAnalysis.cloudPlatform || 'cloud'} with automated retraining triggers based on drift detection"
   
   GENERIC: "Used Kubernetes"
   SPECIFIC: "Orchestrated ${jdAnalysis.cloudPlatform || 'Kubernetes'} deployments with Helm charts, implemented HPA for autoscaling, configured ingress controllers and service mesh for inter-service communication"

5. MATCH JD LANGUAGE
   - JD says "K8s" → Use "K8s"
   - JD says "Kubernetes" → Use "Kubernetes"  
   - JD says "CI/CD" → Use "CI/CD"
   - JD says "Continuous Integration" → Use "Continuous Integration"

6. ADD SKILL-SPECIFIC BULLET POINTS
   For each TOP skill in the JD, ensure resume has 2-3 bullets demonstrating it:
   ${skillExamples}

7. QUANTIFY EVERYTHING
   - Add metrics: "improved by X%", "reduced from X to Y", "processed X records/sec"
   - Add scale: "X users", "Y TB data", "Z services"
   - Add impact: "saved $X", "accelerated by Y days"

8. PRESERVE LATEX FORMATTING
   - Keep all LaTeX commands intact: \section, \begin{highlights}, \item, etc.
   - Maintain line breaks and spacing
   - Don't wrap in markdown code blocks

CRITICAL RULES:
✅ DO: Expand relevant experience with specific tools, services, metrics
✅ DO: Reorder to put matching experience first
✅ DO: Add depth to generic statements with ${jdAnalysis.cloudPlatform || 'cloud'}-specific details
✅ DO: Use exact JD terminology and keywords
✅ DO: Quantify achievements with numbers

❌ DON'T: Invent fake experience
❌ DON'T: Add skills not in original resume
❌ DON'T: Remove core qualifications
❌ DON'T: Break LaTeX formatting
❌ DON'T: Wrap output in markdown

BASE RESUME (LaTeX):
---
${baseResumeTemplate}
---

ORIGINAL JOB DESCRIPTION:
---
${originalJD}
---

Now transform this resume to DEEPLY match the job posting while keeping the core truth intact.
Return ONLY the modified LaTeX code, no explanations, no markdown blocks.`;

    const aiConfig = getAIConfig();
    let customizedResume = await generateWithAI(prompt, 4000, aiConfig.resumeGenerationModel);

    logger.info(`Raw AI response length: ${customizedResume.length} characters`);
    logger.info(`Raw response starts with: ${customizedResume.substring(0, 100)}`);

    // Extract LaTeX from markdown code blocks if present
    const codeBlockMatch = customizedResume.match(/```(?:latex|tex)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      logger.info('Detected markdown code block, extracting LaTeX...');
      customizedResume = codeBlockMatch[1];
      logger.info(`Extracted LaTeX length: ${customizedResume.length} characters`);
    }

    // Check if customization actually happened
    const isSame = customizedResume.trim() === baseResumeTemplate.trim();
    if (isSame) {
      logger.warn('⚠️  WARNING: Customized resume is IDENTICAL to base template! AI may not have modified it.');
    } else {
      logger.info('✅ Resume was successfully modified by AI');
      logger.info(`Modified resume length: ${customizedResume.length} characters`);
    }

    logger.info('Resume customization complete');

    return customizedResume;
  } catch (error: any) {
    logger.error(`Error customizing resume: ${error.message}`);
    // Fallback to original template if AI fails
    logger.warn('Falling back to base resume template');
    return baseResumeTemplate;
  }
}

/**
 * Generate personalized email based on JD analysis
 */
export async function generatePersonalizedEmail(
  candidateInfo: {
    name: string;
    email: string;
    phone: string;
    title: string;
    linkedin?: string;  // Optional LinkedIn URL
  },
  jdAnalysis: JDAnalysis,
  originalJD: string
): Promise<{
  subject: string;
  body: string;
}> {
  logger.info(`Generating personalized email for ${jdAnalysis.title} position...`);

  const profile = await loadProfileForEmail();
  const locationHint = extractLocationFromJD(originalJD);
  const overallExperience = profile?.application?.overallExperience || '6+ years';
  const cloudContext = collectClouds(profile);
  const candidateHighlights = collectCandidateHighlights(profile);
  const candidateSummary = profile?.summary?.base || '';
  const signature = buildSignature(
    {
      name: candidateInfo.name,
      email: candidateInfo.email,
      phone: candidateInfo.phone,
      title: candidateInfo.title,
      linkedin: candidateInfo.linkedin
    },
    profile || {}
  );

  try {
    // Prefer explicit names; fall back to recruiter/contact parsed from JD text
    const contactName =
      jdAnalysis.hiringManager ||
      jdAnalysis.recruiterName ||
      deriveContactNameFromJD(originalJD);
    const greeting = contactName
      ? `Hi ${contactName},`
      : 'Dear Hiring Manager,';
    const company = jdAnalysis.company || 'your company';
    
    // Different opening based on source
    const isEmailSource = jdAnalysis.source === 'email';
    const opening = isEmailSource
      ? `Thank you for reaching out regarding the ${jdAnalysis.title} position at ${company}. I am very interested in this opportunity`
      : `I came across the ${jdAnalysis.title} position at ${company} and am very interested in applying`;
    
    const prompt = `You are an expert at writing concise, professional job application emails.

Write a SHORT email (EXACTLY 2 paragraphs, 90-130 words total) that:
1. Starts with "${greeting}"
2. Opens with EXACTLY this sentence (DO NOT REPHRASE): "${opening}"
3. Uses THIS CANDIDATE BACKGROUND (facts only, no invention):
   - Experience: ${overallExperience} as ${profile?.title || candidateInfo.title}
   - Summary: ${candidateSummary || 'AI/ML engineer with production LLM + RAG delivery'}
   - Highlights: ${candidateHighlights.join(' | ') || 'LLM/RAG builds, LangChain/LangGraph, evaluations, observability'}
   - Clouds: ${cloudContext}
4. Mentions 2-3 high-impact matches from THIS JD (skills/tools/cloud), prioritizing generative AI, LLM fine-tuning/prompt engineering, RAG, LangChain/LangGraph/LlamaIndex, and synthetic data if present. Include location ${locationHint ? `(${locationHint})` : '(if mentioned in JD)' } naturally.
5. Ends with a simple closing asking to discuss further (no fluff)

Structure (STRICT - EXACTLY 2 PARAGRAPHS):
- Paragraph 1: MUST start with EXACTLY: "${opening}" (COPY VERBATIM, DO NOT CHANGE) + 2 sentences highlighting experience (years, current title) and 2-3 concrete matches to the JD using the candidate background above
- Paragraph 2: Brief closing that mentions the attached resume, invites a quick call, and keeps a confident, upbeat tone

CRITICAL RULES:
- EXACTLY 2 PARAGRAPHS (use \\n\\n between them)
- 90-130 words total
- First paragraph MUST start with EXACTLY (word-for-word): "${opening}"
- Use ${greeting} as greeting
- Do NOT list contact fields; a short sign-off is okay, full signature will be added separately
- DO NOT say "Please feel free to contact me at..." (redundant)
- DO NOT add "APPLICATION DETAILS" section or list contact info (added separately)
- SIMPLE 2-PARAGRAPH EMAIL ONLY
- Use only information from the JD text and candidate background provided. Avoid generic claims.

Return ONLY this JSON:
{
  "subject": "Application for ${jdAnalysis.title}",
  "body": "Email body with \\n\\n between paragraphs (2 paragraphs, ~100-120 words, NO contact details, NO application details)"
}

Candidate Information:
- Name: ${candidateInfo.name}
- Current Title: ${candidateInfo.title}

${jdAnalysis.hiringManager ? `Hiring Manager: ${jdAnalysis.hiringManager}` : 'Hiring Manager: Not specified (use "Dear Hiring Manager")'}

Job Description:
${originalJD}

Key Requirements:
${JSON.stringify(jdAnalysis, null, 2)}

Write a concise, personalized job application email (max 150 words).`;

    const aiConfig = getAIConfig();
    const text = await generateWithAI(prompt, 800, aiConfig.emailGenerationModel);  // Reduced for shorter emails

    // ⚠️ CLEAN JSON: Remove markdown but KEEP structure
    let cleanedText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract JSON from the response (don't destroy newlines yet!)
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);  // Keep all whitespace
    if (!jsonMatch) {
      logger.warn('⚠️ Failed to extract JSON from AI response, using fallback');
      logger.warn(`AI response (first 300 chars): ${text.substring(0, 300)}`);
      throw new Error('Failed to extract JSON from AI response');
    }

    // Parse and validate
    let emailData;
    try {
      emailData = JSON.parse(jsonMatch[0]);
    } catch (parseError: any) {
      logger.error(`❌ JSON parse error: ${parseError.message}`);
      logger.error(`Attempted to parse: ${jsonMatch[0].substring(0, 300)}`);
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
    
    logger.info('Email generation complete');

    // ✅ CLEAN EMAIL BODY - Remove any "APPLICATION DETAILS" sections added by AI
    let emailBody = emailData.body || '';
    const linkedin = (candidateInfo as any).linkedin || '';
    
    logger.info('📧 Original email body length:', emailBody.length);
    logger.info('📧 Contains APPLICATION DETAILS?', emailBody.includes('APPLICATION DETAILS'));
    
    // Remove APPLICATION DETAILS section AND everything after it until Best regards
    if (emailBody.includes('**APPLICATION DETAILS:**') || emailBody.includes('APPLICATION DETAILS:')) {
      // Split at APPLICATION DETAILS and take first part + signature part
      const beforeApp = emailBody.split(/\*\*APPLICATION DETAILS:\*\*/i)[0] || emailBody.split(/APPLICATION DETAILS:/i)[0];
      
      // Find signature section (starts with "Best regards")
      const signatureMatch = emailBody.match(/(Best regards,[\s\S]*)/i);
      const signature = signatureMatch ? signatureMatch[1] : '';
      
      // Combine: content before APPLICATION DETAILS + signature
      emailBody = beforeApp.trim() + '\n\n' + signature;
      logger.info('✅ Removed APPLICATION DETAILS section from email');
      logger.info('📧 New email body length:', emailBody.length);
    }
    
    // ✅ FIX SOURCE-AWARE OPENING
    if (isEmailSource && emailBody.includes('I came across')) {
      // Wrong opening for email source - replace it
      emailBody = emailBody.replace(
        /I came across the ([^\n]+) position/i,
        'Thank you for reaching out regarding the $1 position'
      );
      logger.info('✅ Fixed email opening for email source');
    } else if (!isEmailSource && emailBody.includes('Thank you for reaching out')) {
      // Wrong opening for whatsapp source - replace it  
      emailBody = emailBody.replace(
        /Thank you for reaching out regarding the ([^\n]+) position/i,
        'I came across the $1 position'
      );
      logger.info('✅ Fixed email opening for whatsapp source');
    }
    
    // Enforce 2 paragraphs and trim length
    let paragraphs = emailBody.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
    if (paragraphs.length > 2) paragraphs = paragraphs.slice(0, 2);
    if (paragraphs.length < 2 && paragraphs.length > 0) {
      paragraphs.push('I would welcome the opportunity to discuss how my experience aligns with this role.');
    }
    emailBody = paragraphs.join('\n\n').replace(/\n\n\n+/g, '\n\n');
    const words = emailBody.split(/\s+/);
    if (words.length > 130) {
      emailBody = words.slice(0, 130).join(' ');
    }
    
    // ⚠️ SAFEGUARD: Clean and limit subject line length
    let cleanTitle = (jdAnalysis.title || 'Position').trim();
    
    // If title is too long (probably entire JD), extract first line or truncate
    if (cleanTitle.length > 100) {
      // Try to extract first line
      const firstLine = cleanTitle.split(/[\n\r]/)[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        cleanTitle = firstLine;
      } else {
        // Fallback: find first sentence or truncate
        const firstSentence = cleanTitle.match(/^[^.!?]+[.!?]/)?.[0];
        if (firstSentence && firstSentence.length < 100) {
          cleanTitle = firstSentence.trim();
        } else {
          // Last resort: extract role keywords
          const roleMatch = cleanTitle.match(/(Senior |Junior |Lead |Staff )?(Data Scientist|ML Engineer|AI Engineer|Software Engineer|Developer|Architect)/i);
          cleanTitle = roleMatch ? roleMatch[0] : 'Position';
        }
      }
    }

    // ⚠️ DISABLED: Don't auto-add APPLICATION DETAILS unless recruiter explicitly asks in email body
    // emailBody = addApplicationAnswersToEmail(emailBody, originalJD);

    // Build clean subject line
    let subject = emailData.subject || `Application for ${cleanTitle} at ${company}`;
    if (locationHint && !subject.toLowerCase().includes(locationHint.toLowerCase())) {
      subject = `${subject} – ${locationHint}`;
    }
    
    // Final check: if subject is STILL too long, truncate
    const finalSubject = subject.length > 150 
      ? `Application for ${cleanTitle} - ${candidateInfo.name}`.substring(0, 147) + '...'
      : subject;

    const signatureBlock = signature ? `\n\n${signature}` : '';

    return {
      subject: finalSubject,
      body: `${emailBody}${signatureBlock}`
    };
  } catch (error: any) {
    logger.error(`Error generating email with AI: ${error.message}`);
    logger.warn('⚠️ AI email generation failed - using intelligent fallback template');
    
    // ⚠️ INTELLIGENT FALLBACK (not hardcoded nonsense!)
    // Extract meaningful data from JD analysis
    let cleanTitle = (jdAnalysis.title || 'Position').trim();
    if (cleanTitle.length > 100) {
      const roleMatch = cleanTitle.match(/(Senior |Junior |Lead |Staff )?(Data Scientist|ML Engineer|AI Engineer|Software Engineer|Developer|Architect)/i);
      cleanTitle = roleMatch ? roleMatch[0] : 'the position';
    }
    
    const companyName = jdAnalysis.company || 'your organization';
    const greeting = jdAnalysis.hiringManager 
      ? `Hello ${jdAnalysis.hiringManager},` 
      : 'Dear Hiring Manager,';
    
// Use ACTUAL skills from JD analysis, not hardcoded
const topSkills = jdAnalysis.requiredSkills?.slice(0, 3) || jdAnalysis.technologies?.slice(0, 3) || ['AI/ML', 'cloud technologies'];
const skillText = topSkills.length > 0 ? topSkills.slice(0, 2).join(' and ') : 'AI/ML technologies';

// Use ACTUAL keywords from JD
const keyTech = jdAnalysis.keywords?.slice(0, 2).join(', ') || jdAnalysis.technologies?.slice(0, 2).join(', ') || 'production AI systems';

    // Source-aware opening for fallback template
    const isEmailSource = jdAnalysis.source === 'email';
    const fallbackOpening = isEmailSource 
      ? `Thank you for reaching out regarding the ${cleanTitle} position at ${companyName}. With extensive experience in ${skillText}, I am confident I can make immediate contributions to your team.`
      : `I am writing to express my strong interest in the ${cleanTitle} position at ${companyName}. With extensive experience in ${skillText}, I am confident I can make immediate contributions to your team.`;

const locationText = locationHint ? ` for ${locationHint}` : '';

return {
  subject: `Application – ${cleanTitle}${locationHint ? ` – ${locationHint}` : ''} – ${candidateInfo.name}`,
  body: `${greeting}

I came across your ${cleanTitle} opening${companyName ? ` at ${companyName}` : ''}${locationText} and am very interested. I have ${overallExperience} working on generative AI and ML products and currently build production-grade LLM + RAG solutions with LangChain/LangGraph, LlamaIndex, and models such as OpenAI, Claude, LLaMA, and Mistral, including fine-tuning, prompt engineering, and synthetic data generation.

Recently I’ve deployed GenAI workloads on AWS, Azure, and GCP using Bedrock/SageMaker, Azure OpenAI/AI Search, and Vertex AI for low-latency services. I’d welcome a quick call to discuss how this maps to your needs; I’ve attached my resume for your review.${signature ? `\n\n${signature}` : ''}`
    };
  }
}

/**
 * Complete AI-powered customization workflow
 * NOW USING SPEC-BASED GENERATION (rule-based, no AI for resume content)
 */
export async function aiCustomizeApplication(
  _baseResumeTemplate: string,  // legacy param (ignored, kept for compatibility)
  jobDescription: string,
  candidateInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    linkedin?: string;
  }
): Promise<{
  customizedResume: string;
  email: { subject: string; body: string };
  analysis: JDAnalysis;
}> {
  logger.info('Starting spec-based application customization...');
  logger.info('⚡ NEW: Using rule-based spec generator (no AI for resume, faster & more consistent)');

  // Step 1: Analyze the job description with AI
  const analysis = await analyzeJobDescription(jobDescription);

  // Resolve candidate profile (env/file) with optional overrides from candidateInfo
  const { loadCandidateProfile } = await import('../utils/candidate.js');
  const profile = await loadCandidateProfile();
  const mergedProfile = {
    ...profile,
    name: candidateInfo?.name || profile.name,
    title: candidateInfo?.title || profile.title,
    email: candidateInfo?.email || profile.email,
    phone: candidateInfo?.phone || profile.phone,
    links: {
      ...profile.links,
      linkedin: candidateInfo?.linkedin || profile.links?.linkedin
    }
  };

  // Step 2: Generate spec-compliant resume (rule-based, no AI) using candidate profile
  const { generateSpecCompliantResume } = await import('./spec-generator.js');
  const specResult = await generateSpecCompliantResume(analysis, mergedProfile);
  
  logger.info('📊 Resume Generation Metadata:');
  logger.info(`   - Candidate: ${specResult.metadata.candidateName}`);
  logger.info(`   - Cloud Focus: ${specResult.metadata.cloudFocus}`);
  logger.info(`   - Experiences: ${specResult.metadata.experienceCount}`);
  logger.info(`   - Highlights Used: ${specResult.metadata.highlightsUsed}`);
  logger.info(`   - Summary Variant: ${specResult.metadata.summaryVariant}`);

  // Step 3: Generate personalized email (still uses AI)
  const email = await generatePersonalizedEmail(
    {
      name: mergedProfile.name,
      email: mergedProfile.email,
      phone: mergedProfile.phone,
      title: mergedProfile.title,
      linkedin: mergedProfile.links?.linkedin
    },
    analysis,
    jobDescription
  );

  logger.info('✅ Spec-based customization workflow complete');

  return {
    customizedResume: specResult.latex,
    email,
    analysis
  };
}
