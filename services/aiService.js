const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');
const path = require('path');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.defaultProvider = process.env.AI_PROVIDER || 'gemini';
    if (this.defaultProvider === 'gemini' && this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    }
  }

  async analyzeImage(imageUrl, operationType, customPrompt = null, wbsId = null) {
    try {
      const prompt = customPrompt || this.generatePrompt(operationType, wbsId);
      logger.info('Analyzing image', { imageUrl, operationType, wbsId, prompt });

      let result;
      if (this.defaultProvider === 'openai' && this.openaiApiKey) {
        result = await this.analyzeWithOpenAI(imageUrl, prompt);
      } else if (this.defaultProvider === 'gemini' && this.geminiApiKey) {
        result = await this.analyzeWithGemini(imageUrl, prompt);
      } else {
        throw new Error('No AI provider configured. Check OPENAI_API_KEY or GEMINI_API_KEY in .env');
      }

      return {
        ...result,
        apiProvider: this.defaultProvider,
        processingTime: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('AI analysis failed:', { error: error.message, imageUrl, operationType });
      throw error;
    }
  }

  async analyzeWithOpenAI(imageUrl, prompt) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o', // Updated to latest vision-capable model
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseAIResponse(content);
    } catch (error) {
      logger.error('OpenAI analysis failed:', { error: error.message, status: error.response?.status });
      throw error;
    }
  }

  async analyzeWithGemini(imageUrl, prompt) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Fetch image and determine MIME type
      const { buffer, mimeType } = await this.getImageData(imageUrl);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType || 'image/jpeg',
          },
        },
      ]);

      const content = result.response.text();
      return this.parseAIResponse(content);
    } catch (error) {
      logger.error('Gemini SDK analysis failed:', { error: error.message });
      // Fallback to REST API
      return this.analyzeWithGeminiRest(imageUrl, prompt);
    }
  }

  async analyzeWithGeminiRest(imageUrl, prompt) {
    try {
      const { buffer, mimeType } = await this.getImageData(imageUrl);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: buffer.toString('base64'),
                  },
                },
              ],
            },
          ],
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      return this.parseAIResponse(content);
    } catch (error) {
      logger.error('Gemini REST analysis failed:', { error: error.message, status: error.response?.status });
      throw error;
    }
  }

  async getImageData(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const mimeType = response.headers['content-type'];
      const buffer = Buffer.from(response.data, 'binary');
      return { buffer, mimeType };
    } catch (error) {
      logger.error('Failed to fetch image:', { error: error.message, url });
      throw error;
    }
  }

  generatePrompt(operationType, wbsId = null) {
    const basePrompts = {
      'progress-monitoring': `Analyze this construction site image for progress monitoring. Provide a structured JSON response with:
        - summary: Brief overview of progress
        - progressStatus: Estimated completion percentage (0-100)
        - currentPhase: Current construction phase
        - qualityObservations: List of quality notes
        - safetyConcerns: List of safety issues
        - recommendations: List of next steps
        ${wbsId ? `Focus on WBS ID: ${wbsId}` : ''}`,
      'auditing': `Audit this construction site image for compliance and quality. Provide a structured JSON response with:
        - summary: Compliance overview
        - complianceIssues: List of non-compliance issues
        - qualityAssessment: Quality notes
        - defects: List of defects
        - correctiveActions: List of required actions`,
      'inspection': `Inspect this image for defects and structural issues. Provide a structured JSON response with:
        - summary: Inspection overview
        - defects: List of visible defects
        - structuralIssues: List of structural concerns
        - safetyHazards: List of safety hazards
        - maintenanceRequirements: List of maintenance needs
        - priority: Priority level (low, medium, high)`
    };

    return basePrompts[operationType] || basePrompts['inspection'];
  }

  parseAIResponse(content) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content.replace(/```json\n|```/g, '')); // Remove markdown if present
      return {
        summary: parsed.summary || content,
        defects: parsed.defects || [],
        progressStatus: parsed.progressStatus || null,
        confidence: parsed.confidence || 0.8,
        ...parsed,
      };
    } catch {
      // Fallback to text parsing
      const defects = this.extractDefects(content);
      const progressMatch = content.match(/(\d+)%/);
      const progressStatus = progressMatch ? parseInt(progressMatch[1]) : null;

      return {
        summary: content.substring(0, 500),
        defects,
        progressStatus,
        confidence: 0.7,
      };
    }
  }

  extractDefects(content) {
    const defectKeywords = ['crack', 'damage', 'defect', 'issue', 'problem', 'concern', 'hazard'];
    const sentences = content.split(/[.!?]+/);
    const defects = [];

    sentences.forEach(sentence => {
      defectKeywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          defects.push({
            type: keyword,
            description: sentence.trim(),
            severity: this.assessSeverity(sentence),
          });
        }
      });
    });

    return defects;
  }

  assessSeverity(description) {
    const highKeywords = ['critical', 'severe', 'urgent', 'dangerous', 'major'];
    const mediumKeywords = ['moderate', 'significant', 'noticeable'];

    const text = description.toLowerCase();
    if (highKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (mediumKeywords.some(keyword => text.includes(keyword))) return 'medium';
    return 'low';
  }
}

module.exports = new AIService();