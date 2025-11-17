/**
 * 🤖 HYBRID AI - Best of Both Worlds!
 * 
 * Phase 1 (NOW):
 * - Email classification → Llama 3.2 3B (Local, FREE!)
 * - Resume generation → GPT-5 (Quality matters!)
 * 
 * Phase 2 (LATER):
 * - Try Llama 3.2 8B for resumes
 * - If good enough → switch to local
 */

import axios from 'axios';
import OpenAI from 'openai';

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
  model: 'gpt-5' | 'llama-8b';
}

export class HybridAI {
  private openai: OpenAI;
  private ollamaBaseUrl = 'http://localhost:11434';
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * 📧 CLASSIFY EMAIL - Using LOCAL Llama 3.2 3B (FREE!)
   * 
   * This is FAST (1-2 sec) and good enough for classification.
   * Saves ~$0.10 per email vs GPT-5!
   */
  async classifyEmail(emailContent: string): Promise<JobClassification> {
    console.log('🤖 Using LOCAL Llama 3.2 3B for email classification...');
    
    const prompt = `You are an email classifier. Analyze this email and determine if it's a job opportunity.

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
}`;

    try {
      // Call LOCAL Llama 3.2 3B
      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: 'llama3.2:3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low = consistent
          num_predict: 500   // Enough for JSON
        }
      });

      const result = this.parseJSON(response.data.response);
      console.log(`✅ Local LLM classified (confidence: ${result.confidence})`);
      console.log(`💰 Cost: $0 (vs $0.10 with GPT-5)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Local LLM failed, falling back to GPT-5...');
      return await this.classifyEmailWithGPT5(emailContent);
    }
  }

  /**
   * 📧 FALLBACK: Classify with GPT-5 if local fails
   */
  private async classifyEmailWithGPT5(emailContent: string): Promise<JobClassification> {
    console.log('🔄 Using GPT-5 as fallback...');
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-5',
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
      max_completion_tokens: 500
      // Note: GPT-5 only supports temperature=1 (default)
    });

    const result = this.parseJSON(completion.choices[0].message.content || '{}');
    console.log(`✅ GPT-5 classified (cost: ~$0.10)`);
    
    return result;
  }

  /**
   * 📄 GENERATE RESUME - Using GPT-5 (Quality matters!)
   * 
   * Phase 1: Always use GPT-5 for high quality
   * Phase 2: Try Llama 8B and compare
   */
  async generateResume(
    baseResume: string,
    jobDescription: string,
    useLocal: boolean = false // Set to true in Phase 2
  ): Promise<ResumeGenerationResult> {
    
    if (!useLocal) {
      // PHASE 1: Use GPT-5 (current approach)
      console.log('📄 Using GPT-5 for resume generation (quality matters!)');
      return await this.generateResumeWithGPT5(baseResume, jobDescription);
    } else {
      // PHASE 2: Try Llama 8B (future optimization)
      console.log('📄 Trying LOCAL Llama 8B for resume generation...');
      return await this.generateResumeWithLlama8B(baseResume, jobDescription);
    }
  }

  /**
   * 📄 RESUME with GPT-5 - High Quality
   */
  private async generateResumeWithGPT5(
    baseResume: string,
    jobDescription: string
  ): Promise<ResumeGenerationResult> {
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-5',
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
    console.log(`✅ GPT-5 generated resume (cost: ~$0.30)`);
    
    return {
      latex,
      confidence: 0.95,
      model: 'gpt-5'
    };
  }

  /**
   * 📄 RESUME with Llama 8B - For testing in Phase 2
   */
  private async generateResumeWithLlama8B(
    baseResume: string,
    jobDescription: string
  ): Promise<ResumeGenerationResult> {
    
    const prompt = `Generate a tailored LaTeX resume based on this job description.

Base Resume:
${baseResume}

Job Description:
${jobDescription}

Return ONLY the complete LaTeX code (no markdown, no explanation).`;

    try {
      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: 'llama3.2:8b',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 4000 // Resumes are long!
        }
      });

      const latex = response.data.response;
      console.log(`✅ Local Llama 8B generated resume`);
      console.log(`💰 Cost: $0 (vs $0.30 with GPT-5)`);
      
      return {
        latex,
        confidence: 0.80, // Lower confidence for local
        model: 'llama-8b'
      };
      
    } catch (error) {
      console.error('❌ Llama 8B failed, falling back to GPT-5...');
      return await this.generateResumeWithGPT5(baseResume, jobDescription);
    }
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

  /**
   * 📊 CHECK OLLAMA STATUS
   */
  async checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`);
      const models = response.data.models.map((m: any) => m.name);
      
      console.log('✅ Ollama is running!');
      console.log('📦 Available models:', models);
      
      return { running: true, models };
    } catch (error) {
      console.error('❌ Ollama not running. Start it with: ollama serve');
      return { running: false, models: [] };
    }
  }
}

/**
 * 💰 COST COMPARISON
 * 
 * 100 applications/day = 3,000/month
 * 
 * WITH GPT-5 ONLY:
 * - Email classification: 3,000 × $0.10 = $300
 * - Resume generation: 3,000 × $0.30 = $900
 * Total: $1,200/month
 * 
 * WITH HYBRID (Phase 1):
 * - Email classification: 3,000 × $0 = $0 (Local!)
 * - Resume generation: 3,000 × $0.30 = $900 (GPT-5)
 * Total: $900/month
 * SAVED: $300/month! 💰
 * 
 * WITH HYBRID (Phase 2 - if Llama 8B works):
 * - Email classification: $0
 * - Resume generation: $0 (Local!)
 * Total: $0/month
 * SAVED: $1,200/month! 🎉🎉🎉
 */
