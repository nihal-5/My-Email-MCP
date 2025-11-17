/**
 * Spec-Based Resume Generator
 * Generates ATS-optimized LaTeX resume following the comprehensive spec
 * NO AI - Direct rule-based generation for consistency and speed
 */

import { logger } from '../utils/logger.js';
import type { JDAnalysis } from './ai-customizer.js';
import {
  CLOUD_STACKS,
  FISERV_CORE_12,
  HYPERLEAP_AWS_8,
  INFOLAB_5,
  OPTIONAL_BULLETS,
  SUMMARY_TEMPLATES,
  SKILLS_VENDOR_FILL,
  fillCloudPlaceholders
} from './resume-spec.js';

export interface ResumeGenerationResult {
  latex: string;
  metadata: {
    fiservCloud: string;
    hyperleapCloud: string;
    fiservBulletCount: number;
    hyperleapBulletCount: number;
    infolabBulletCount: number;
    summaryTemplate: string;
    triggersApplied: string[];
  };
}

/**
 * Generate spec-compliant resume directly from JD analysis
 * NO AI - Pure rule-based generation for 100% consistency
 */
export async function generateSpecCompliantResume(jdAnalysis: JDAnalysis): Promise<ResumeGenerationResult> {
  logger.info('🎯 Generating spec-compliant resume (rule-based, no AI)...');
  logger.info(`📋 JD Analysis: ${jdAnalysis.title} @ ${jdAnalysis.company || 'Unknown'}`);
  logger.info(`☁️  Cloud Focus: ${jdAnalysis.cloudFocus}`);
  logger.info(`🎭 Role Track: ${jdAnalysis.roleTrack}`);
  logger.info(`🏢 Domain Focus: ${jdAnalysis.domainFocus}`);
  
  const triggersApplied: string[] = [];
  
  // Step 1: Determine Fiserv cloud vendor
  const fiservCloud = jdAnalysis.cloudFocus === 'none' ? 'azure' : jdAnalysis.cloudFocus;
  logger.info(`🔧 Fiserv cloud vendor: ${fiservCloud.toUpperCase()}`);
  
  // Step 2: Select summary template
  let summaryText = SUMMARY_TEMPLATES.base;
  if (jdAnalysis.roleTrack && SUMMARY_TEMPLATES[jdAnalysis.roleTrack]) {
    const trackTemplate = SUMMARY_TEMPLATES[jdAnalysis.roleTrack];
    // Replace first sentence with track-specific override
    const baseSentences = SUMMARY_TEMPLATES.base.split('. ');
    baseSentences[0] = trackTemplate;
    summaryText = baseSentences.join('. ');
    logger.info(`📝 Summary template: ${jdAnalysis.roleTrack}`);
  }
  
  // Replace {PRIMARY_CLOUD} placeholder
  summaryText = summaryText.replace(/{PRIMARY_CLOUD}/g, fiservCloud.toUpperCase());
  
  // Ensure "prompt engineering" appears if triggered
  if (jdAnalysis.triggers.promptEngineering && !summaryText.includes('prompt engineering')) {
    summaryText = summaryText.replace('I work in Python', 'I work in Python with prompt engineering');
  }
  
  // Step 3: Build Fiserv 12 bullets
  const cloudStack = CLOUD_STACKS[fiservCloud];
  let fiservBullets = FISERV_CORE_12.map(bullet => fillCloudPlaceholders(bullet, cloudStack));
  
  // Apply conditional injections
  if (jdAnalysis.triggers.promptEngineering || jdAnalysis.triggers.nlp) {
    // Replace FastAPI bullet (index 7) with prompt engineering bullet
    fiservBullets[7] = OPTIONAL_BULLETS.fiserv_prompt_engineering;
    triggersApplied.push('fiserv_prompt_engineering');
    logger.info('✅ Injected prompt engineering bullet into Fiserv');
  }
  
  if (jdAnalysis.triggers.dispute) {
    // Replace deployment bullet (index 9) with disputes bullet
    fiservBullets[9] = OPTIONAL_BULLETS.fiserv_disputes;
    triggersApplied.push('fiserv_disputes');
    logger.info('✅ Injected disputes bullet into Fiserv');
  }
  
  // Validate: Exactly 12 bullets, MCP (index 2) and graph (index 4) must remain
  if (fiservBullets.length !== 12) {
    logger.error(`❌ Fiserv bullet count violation: ${fiservBullets.length} (expected 12)`);
  }
  if (!fiservBullets[2].includes('MCP')) {
    logger.warn('⚠️  MCP bullet may have been removed!');
  }
  if (!fiservBullets[4].includes('knowledge graph')) {
    logger.warn('⚠️  Knowledge graph bullet may have been removed!');
  }
  
  // Step 4: Build Hyperleap 8 bullets (AWS constant)
  let hyperleapBullets = [...HYPERLEAP_AWS_8];
  
  // Validate segmentation is first
  if (!hyperleapBullets[0].includes('RFM')) {
    logger.error('❌ Hyperleap segmentation bullet is not first!');
  }
  
  // Optional injections (replace least relevant bullets)
  if (jdAnalysis.triggers.timeSeries) {
    hyperleapBullets[7] = OPTIONAL_BULLETS.hyperleap_time_series; // Replace Power BI
    triggersApplied.push('hyperleap_time_series');
    logger.info('✅ Injected time-series bullet into Hyperleap');
  }
  
  if (jdAnalysis.triggers.healthcare) {
    hyperleapBullets[6] = OPTIONAL_BULLETS.hyperleap_healthcare; // Replace security
    triggersApplied.push('hyperleap_healthcare');
    logger.info('✅ Injected healthcare bullet into Hyperleap');
  }
  
  if (jdAnalysis.triggers.chatbot) {
    hyperleapBullets[5] = OPTIONAL_BULLETS.hyperleap_chatbot; // Replace observability
    triggersApplied.push('hyperleap_chatbot');
    logger.info('✅ Injected chatbot bullet into Hyperleap');
  }
  
  if (jdAnalysis.triggers.nlp && !jdAnalysis.triggers.chatbot) {
    hyperleapBullets[1] = OPTIONAL_BULLETS.hyperleap_nlp; // Replace OCR if NLP heavy
    triggersApplied.push('hyperleap_nlp');
    logger.info('✅ Injected NLP bullet into Hyperleap');
  }
  
  // Validate: Exactly 8 bullets
  if (hyperleapBullets.length !== 8) {
    logger.error(`❌ Hyperleap bullet count violation: ${hyperleapBullets.length} (expected 8)`);
  }
  
  // Step 5: Infinite Infolab 5 bullets (unchanged)
  const infolabBullets = [...INFOLAB_5];
  
  // Step 6: Build Skills section (reordered by JD priority)
  const skillsVendor = SKILLS_VENDOR_FILL[fiservCloud];
  
  const skillsBlocks = [
    { header: 'Languages', items: 'Python, SQL, Bash, JavaScript/Node.js' },
    { header: 'LLMs \\& Agents', items: 'LangGraph, LangChain, MCP tools, Function/tool calling, Behavior-tree dialog control, Critic/validator loops' },
    { header: 'Retrieval \\& Search', items: 'RAG, BM25+vector, Graph-aware RAG, FAISS, pgvector, Pinecone, OpenSearch' },
    { header: 'NLP \\& OCR', items: `Hugging Face, spaCy, NLTK, ${skillsVendor.OCR_VENDOR} + Tesseract fallback, Prompt engineering` },
    { header: 'Serving \\& APIs', items: 'FastAPI, Async I/O, Schema-validated JSON, Idempotency, Retries' },
    { header: 'Data \\& Stores', items: `${skillsVendor.DATA_STACK}, MLflow, Redis/Feast, PostgreSQL, Redshift, MongoDB` },
    { header: 'MLOps \\& Infra', items: `Docker, ${skillsVendor.K8S}, Terraform, CI/CD (GitHub Actions), Blue/Green, Canary` },
    { header: 'Observability \\& Eval', items: `OpenTelemetry, ${skillsVendor.MONITOR}, LangSmith, Ragas/TruLens, p95/p99 latency, Error rates, Groundedness` },
    { header: 'Security \\& Compliance', items: `RBAC, ${skillsVendor.SECRETS}, ${skillsVendor.IAM}, Tokenization/Redaction, Field-level encryption, Private networking, Audit logs` }
  ];
  
  // Reorder skills based on role track
  if (jdAnalysis.roleTrack === 'chatbot_dev') {
    // Move LLMs & Agents, NLP & OCR, Serving & APIs to top
    const prioritized = [skillsBlocks[1], skillsBlocks[3], skillsBlocks[4]];
    const rest = skillsBlocks.filter((_, i) => ![1, 3, 4].includes(i));
    skillsBlocks.splice(0, skillsBlocks.length, ...prioritized, ...rest);
  } else if (jdAnalysis.roleTrack === 'ai_devops') {
    // Move MLOps, Observability, Security to top
    const prioritized = [skillsBlocks[6], skillsBlocks[7], skillsBlocks[8]];
    const rest = skillsBlocks.filter((_, i) => ![6, 7, 8].includes(i));
    skillsBlocks.splice(0, skillsBlocks.length, ...prioritized, ...rest);
  } else if (jdAnalysis.roleTrack === 'nlp_prompt_engineer') {
    // Move NLP & OCR, LLMs & Agents to top
    const prioritized = [skillsBlocks[3], skillsBlocks[1]];
    const rest = skillsBlocks.filter((_, i) => ![3, 1].includes(i));
    skillsBlocks.splice(0, skillsBlocks.length, ...prioritized, ...rest);
  }
  
  // Add evaluation items if NLP role
  if (jdAnalysis.triggers.nlp) {
    skillsBlocks.find(b => b.header === 'Observability \\& Eval')!.items += ', Exact Match, F1, ROUGE, Prompt tests, Red-teaming';
  }
  
  // Step 7: Generate LaTeX
  const latex = generateLatex({
    summary: summaryText,
    fiservBullets,
    hyperleapBullets,
    infolabBullets,
    skillsBlocks
  });
  
  logger.info('✅ Spec-compliant resume generated successfully');
  logger.info(`📊 Fiserv: ${fiservBullets.length} bullets, Hyperleap: ${hyperleapBullets.length} bullets, Infolab: ${infolabBullets.length} bullets`);
  logger.info(`🎯 Triggers applied: ${triggersApplied.join(', ') || 'None'}`);
  
  return {
    latex,
    metadata: {
      fiservCloud: fiservCloud.toUpperCase(),
      hyperleapCloud: 'AWS',
      fiservBulletCount: fiservBullets.length,
      hyperleapBulletCount: hyperleapBullets.length,
      infolabBulletCount: infolabBullets.length,
      summaryTemplate: jdAnalysis.roleTrack || 'base',
      triggersApplied
    }
  };
}

interface LatexComponents {
  summary: string;
  fiservBullets: string[];
  hyperleapBullets: string[];
  infolabBullets: string[];
  skillsBlocks: Array<{ header: string; items: string }>;
}

function generateLatex(components: LatexComponents): string {
  // Format bullets for LaTeX
  const formatBullets = (bullets: string[]) => 
    bullets.map(b => `        \\item ${b}`).join('\n');
  
  const formatSkills = (blocks: Array<{ header: string; items: string }>) =>
    blocks.map(b => `      \\textbf{${b.header}:} ${b.items} \\\\`).join('\n');
  
  return `\\documentclass[10pt, letterpaper]{article}
\\usepackage[ignoreheadfoot, top=2 cm, bottom=2 cm, left=2 cm, right=2 cm, footskip=1.0 cm]{geometry}
\\usepackage{titlesec,tabularx,array,xcolor,enumitem,fontawesome5,amsmath,hyperref,eso-pic,calc,bookmark,lastpage,changepage,paracol,ifthen,needspace,iftex}
\\definecolor{primaryColor}{RGB}{0, 0, 0}
\\hypersetup{pdftitle={Nihal Veeramalla Resume}, pdfauthor={Nihal Veeramalla}, pdfcreator={LaTeX}, colorlinks=true, urlcolor=primaryColor}
\\ifPDFTeX
  \\input{glyphtounicode}
  \\pdfgentounicode=1
  \\usepackage[T1]{fontenc}
  \\usepackage[utf8]{inputenc}
  \\usepackage{lmodern}
\\fi
\\usepackage{charter}
\\raggedright
\\pagestyle{empty}
\\setcounter{secnumdepth}{0}
\\setlength{\\parindent}{0pt}
\\setlength{\\columnsep}{0.15cm}
\\setlength{\\parskip}{2pt}
\\titleformat{\\section}{\\needspace{4\\baselineskip}\\bfseries\\large}{}{0pt}{}[\\vspace{3pt}\\titlerule]
\\titlespacing{\\section}{-1pt}{0.35 cm}{0.28 cm}
\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\small$\\bullet$}}$}
\\newenvironment{highlights}{\\begin{itemize}[topsep=0.12 cm, parsep=2pt, partopsep=0pt, itemsep=2pt, leftmargin=10pt]}{\\end{itemize}}
\\newenvironment{onecolentry}{\\begin{adjustwidth}{0 cm}{0 cm}}{\\end{adjustwidth}}
\\newenvironment{twocolentry}[2][]{\\onecolentry\\def\\secondColumn{#2}\\setcolumnwidth{\\fill, 4.5 cm}\\begin{paracol}{2}}{\\switchcolumn \\raggedleft \\secondColumn \\end{paracol}\\endonecolentry}
\\newenvironment{header}{\\setlength{\\topsep}{0pt}\\par\\kern\\topsep\\centering\\linespread{1.4}}{\\par\\kern\\topsep}

\\begin{document}
  \\begin{header}
    \\fontsize{25 pt}{25 pt}\\selectfont Nihal Veeramalla
    \\vspace{3 pt}
    \\Large AI ENGINEER
    \\vspace{5 pt}

    \\normalsize
    Fairfax, VA \\, | \\,
    \\href{mailto:nihal.veeramalla@gmail.com}{nihal.veeramalla@gmail.com} \\, | \\,
    \\href{tel:+1-313-288-2859}{+1 313-288-2859} \\, | \\,
    \\href{https://www.linkedin.com/in/nihal-veeramalla/}{linkedin.com/in/nihal-veeramalla}
  \\end{header}

  \\vspace{4 pt}

  \\section{Summary}
  \\begin{onecolentry}
    ${components.summary}
  \\end{onecolentry}

  \\section{Experience}

  \\begin{twocolentry}{Jan 2024 -- Present}
    \\textbf{Data Scientist / AI}, Fiserv -- Berkeley Heights, NJ (Hybrid)
  \\end{twocolentry}
  \\vspace{0.08 cm}
  \\begin{onecolentry}
    \\begin{highlights}
${formatBullets(components.fiservBullets)}
    \\end{highlights}
  \\end{onecolentry}

  \\begin{twocolentry}{Jun 2020 -- Aug 2022}
    \\textbf{Data Scientist}, Hyperleap AI
  \\end{twocolentry}
  \\vspace{0.08 cm}
  \\begin{onecolentry}
    \\begin{highlights}
${formatBullets(components.hyperleapBullets)}
    \\end{highlights}
  \\end{onecolentry}

  \\begin{twocolentry}{Jan 2019 -- Jun 2020}
    \\textbf{Data Science Intern}, Infinite Infolab
  \\end{twocolentry}
  \\vspace{0.08 cm}
  \\begin{onecolentry}
    \\begin{highlights}
${formatBullets(components.infolabBullets)}
    \\end{highlights}
  \\end{onecolentry}

  \\section{Education}
  \\begin{twocolentry}{Aug 2022 -- May 2024}
    \\textbf{George Mason University}, Master of Science, Data Analytics Engineering
  \\end{twocolentry}
  \\vspace{0.06 cm}
  \\begin{twocolentry}{Nov 2020 -- Dec 2021}
    \\textbf{IIIT-Bangalore}, Postgraduate, Data Science with Specialization in Deep Learning
  \\end{twocolentry}
  \\vspace{0.06 cm}
  \\begin{twocolentry}{Jun 2016 -- May 2020}
    \\textbf{SRM University}, Bachelor of Technology, Computer Science and Engineering
  \\end{twocolentry}

  \\section{Publications}
  \\begin{twocolentry}{2020}
    \\textbf{International Journal of Advanced Science and Technology}, Detection and Prevention of DDoS Attack in SDN
  \\end{twocolentry}

  \\section{Skills}
  \\begin{onecolentry}
${formatSkills(components.skillsBlocks)}
  \\end{onecolentry}

\\end{document}`;
}
