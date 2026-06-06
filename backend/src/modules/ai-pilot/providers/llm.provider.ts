import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/index.js';
import { logger } from '../../../lib/logger.js';
import { CARDPILOT_SYSTEM_PROMPT } from '../ai-pilot.prompts.js';

export class LLMProvider {
  private ai: GoogleGenAI;
  private defaultModel: string;
  private fallbackModel: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY || env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: env.VERTEX_AI_PROJECT_ID,
        location: env.VERTEX_AI_LOCATION,
      });
    }

    this.defaultModel = process.env.AI_MODEL || 'gemini-1.5-flash';
    this.fallbackModel = process.env.AI_FALLBACK_MODEL || 'gemini-2.5-pro';
  }

  async generateChatResponse(
    messages: Array<{ role: string; content: string; toolCalls?: any }>,
    tools?: any[]
  ): Promise<{ text: string; toolCalls: any[] | null; modelUsed: string }> {
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const config: any = {
      systemInstruction: CARDPILOT_SYSTEM_PROMPT,
      temperature: 0.2,
    };

    if (tools && tools.length > 0) {
      config.tools = [{ functionDeclarations: tools }];
    }

    let modelUsed = this.defaultModel;
    try {
      logger.info({ model: modelUsed }, 'Calling Gemini LLM for CardPilot');
      const response = await this.ai.models.generateContent({
        model: modelUsed,
        contents,
        config
      });

      const text = response.text || '';
      // Parse function calls (tool calls) from the response candidate
      const toolCalls = response.candidates?.[0]?.content?.parts
        ?.filter((part: any) => part.functionCall)
        ?.map((part: any) => ({
          name: part.functionCall.name,
          args: part.functionCall.args,
        })) || null;

      return {
        text,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : null,
        modelUsed
      };
    } catch (err: any) {
      logger.warn({ error: err.message, model: modelUsed }, 'Primary Gemini model failed, trying fallback...');
      modelUsed = this.fallbackModel;
      
      const response = await this.ai.models.generateContent({
        model: modelUsed,
        contents,
        config
      });

      const text = response.text || '';
      const toolCalls = response.candidates?.[0]?.content?.parts
        ?.filter((part: any) => part.functionCall)
        ?.map((part: any) => ({
          name: part.functionCall.name,
          args: part.functionCall.args,
        })) || null;

      return {
        text,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : null,
        modelUsed
      };
    }
  }
}

export const llmProvider = new LLMProvider();
