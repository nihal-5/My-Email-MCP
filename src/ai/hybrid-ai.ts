/**
 * 🤖 OpenAI-Only AI System
 * 
 * - Email classification → GPT-3.5-turbo (Cost-effective for classification)
 * - Resume generation → GPT-5 (Advanced model for quality)
 * - All tasks use OpenAI API only
 */

import OpenAI from 'openai';
import { getAIConfig } from '../utils/config.js';

interface JobClassification {
  isJob: boolean;
  confidence: number;
  company?: string;
  role?: string;
  recruiterEmail?: string;
  recruiterName?: string;
  reasoning?: string;
}

interface ResumeGenerationResult {
  latex: string;
  confidence: number;
  model: string;
}

export class HybridAI {
  private openai: OpenAI;
  private aiConfig: ReturnType<typeof getAIConfig>;
  
  constructor() {
    this.aiConfig = getAIConfig();
    this.openai = new OpenAI({
      apiKey: this.aiConfig.apiKey
    });
  }

  /**
   * 📧 CLASSIFY EMAIL - Using GPT-3.5-turbo (Cost-effective for classification)
   * 
   * Uses smaller model to save costs while maintaining good accuracy.
   */
  async classifyEmail(emailContent: string): Promise<JobClassification> {
    const model = this.aiConfig.emailClassificationModel;
    console.log(`🤖 Using ${model} for email classification (cost-effective)...`);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{
          role: 'user',
          content: `Analyze this email and determine if it's a job opportunity.

Email:
${emailContent}

Return ONLY valid JSON (no markdown, no explanation):
{
  "isJob": true or false,
  "confidence": 0.0 to 1.0,
  "company": "company name" or null,
  "role": "job title" or null,
  "recruiterEmail": "email@company.com" or null,
  "recruiterName": "name" or null,
  "reasoning": "brief explanation"
}`
        }],
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 500
      });

      const result = this.parseJSON(completion.choices[0].message.content || '{}');
      console.log(`✅ ${model} classified (confidence: ${result.confidence})`);
      console.log(`💰 Cost-effective model used for classification`);
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ ${model} classification failed:`, error.message);
      // Fallback to fallback model if primary fails
      return await this.classifyEmailWithFallback(emailContent);
    }
  }

  /**
   * 📧 FALLBACK: Classify with fallback model if primary fails
   */
  private async classifyEmailWithFallback(emailContent: string): Promise<JobClassification> {
    const fallbackModel = this.aiConfig.emailClassificationFallbackModel;
    console.log(`🔄 Using ${fallbackModel} as fallback...`);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: fallbackModel,
        messages: [{
          role: 'user',
          content: `Analyze this email and determine if it's a job opportunity.

Email:
${emailContent}

Return JSON:
{
  "isJob": true/false,
  "confidence": 0.0-1.0,
  "company": "name" or null,
  "role": "title" or null,
  "recruiterEmail": "email" or null,
  "recruiterName": "name" or null,
  "reasoning": "explanation"
}`
        }],
        temperature: 0.1,
        max_tokens: 500
      });

      const result = this.parseJSON(completion.choices[0].message.content || '{}');
      console.log(`✅ ${fallbackModel} classified`);
      
      return result;
    } catch (error: any) {
      console.error('❌ All classification models failed:', error.message);
      // Return safe default
      return {
        isJob: false,
        confidence: 0,
        reasoning: 'Classification failed'
      };
    }
  }

  /**
   * 📄 GENERATE RESUME - Using GPT-5 (Advanced model for quality)
   * 
   * Always uses GPT-5 for high-quality resume generation
   */
  async generateResume(
    baseResume: string,
    jobDescription: string
  ): Promise<ResumeGenerationResult> {
    const model = this.aiConfig.resumeGenerationModel;
    console.log(`📄 Using ${model} for resume generation (advanced model for quality)`);
    return await this.generateResumeWithAdvancedModel(baseResume, jobDescription);
  }

  /**
   * 📄 RESUME with Advanced Model - High Quality
   */
  private async generateResumeWithAdvancedModel(
    baseResume: string,
    jobDescription: string
  ): Promise<ResumeGenerationResult> {
    const model = this.aiConfig.resumeGenerationModel;
    
    const completion = await this.openai.chat.completions.create({
      model: model,
      messages: [{
        role: 'user',
        content: `Generate a tailored LaTeX resume based on this job description.

Base Resume:
${baseResume}

Job Description:
${jobDescription}

Return ONLY the complete LaTeX code (no markdown, no explanation).`
      }],
      max_completion_tokens: 4000
      // Note: GPT-5 only supports temperature=1 (default)
    });

    const latex = completion.choices[0].message.content || '';
    console.log(`✅ ${model} generated resume`);
    
    return {
      latex,
      confidence: 0.95,
      model: model
    };
  }

  /**
   * 🛠️ HELPER: Parse JSON from LLM response
   */
  private parseJSON(text: string): any {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim();
      cleaned = cleaned.replace(/```json\n?/g, '');
      cleaned = cleaned.replace(/```\n?/g, '');
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON:', text);
      return {
        isJob: false,
        confidence: 0,
        reasoning: 'Failed to parse response'
      };
    }
  }
}

/**
 * 💰 COST OPTIMIZATION WITH OPENAI-ONLY
 * 
 * 100 applications/day = 3,000/month
 * 
 * STRATEGY:
 * - Email classification: GPT-3.5-turbo (~$0.001 per email) = $3/month
 * - Resume generation: GPT-5 (~$0.30 per resume) = $900/month
 * Total: ~$903/month
 * 
 * Benefits:
 * - Single API provider (simpler management)
 * - Consistent quality across all tasks
 * - Cost-effective classification with GPT-3.5-turbo
 * - High-quality resume generation with GPT-5
 */
