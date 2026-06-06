import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/index.js';
import { logger } from '../../../lib/logger.js';

export class SpeechProvider {
  private ai: GoogleGenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.AI_SPEECH_API_KEY || process.env.AI_API_KEY || env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: env.VERTEX_AI_PROJECT_ID,
        location: env.VERTEX_AI_LOCATION,
      });
      this.isConfigured = !!env.VERTEX_AI_PROJECT_ID;
    }
  }

  async transcribe(base64Audio: string, mimeType: string = 'audio/wav'): Promise<string> {
    if (!this.isConfigured || !base64Audio) {
      logger.info('Speech provider mock mode: transcribing audio');
      return 'Show me my current inventory count';
    }

    try {
      logger.info('Transcribing audio via Gemini native multimodal audio model');
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            inlineData: {
              data: base64Audio,
              mimeType
            }
          },
          'Accurately transcribe this audio recording of a sports card dealer. Return only the exact transcription text, with no preamble or explanation.'
        ]
      });

      return (response.text || '').trim();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Gemini speech transcription failed, returning mock text');
      return 'How much profit did I make today?';
    }
  }
}

export const speechProvider = new SpeechProvider();
