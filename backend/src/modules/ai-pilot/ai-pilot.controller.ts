import { aiPilotService } from './ai-pilot.service.js';
import { handleToolCall } from './tools/handlers.js';

export class AIPilotController {
  private getUserId(request: Request): string {
    const userId = request.headers.get('x-user-id');
    if (!userId || userId === 'guest') {
      throw new Error('Unauthorized: Authentication required');
    }
    return userId;
  }

  chat = async ({ request, body }: { request: Request; body: any }) => {
    const userId = this.getUserId(request);
    const { message, conversationId } = body ?? {};
    if (!message) {
      throw new Error('Message is required');
    }
    return await aiPilotService.processChat(userId, message, conversationId);
  };

  listConversations = async ({ request }: { request: Request }) => {
    const userId = this.getUserId(request);
    return await aiPilotService.listConversations(userId);
  };

  getConversation = async ({ request, params }: { request: Request; params: any }) => {
    const userId = this.getUserId(request);
    const result = await aiPilotService.getConversation(params.id, userId);
    if (!result) {
      throw new Error('Conversation not found');
    }
    return result;
  };

  deleteConversation = async ({ request, params }: { request: Request; params: any }) => {
    const userId = this.getUserId(request);
    const success = await aiPilotService.deleteConversation(params.id, userId);
    return { success };
  };

  confirmAction = async ({ request, params }: { request: Request; params: any }) => {
    const userId = this.getUserId(request);
    return await aiPilotService.confirmAction(params.id, userId);
  };

  cancelAction = async ({ request, params }: { request: Request; params: any }) => {
    const userId = this.getUserId(request);
    const success = await aiPilotService.cancelAction(params.id, userId);
    return { success };
  };

  getPendingActions = async ({ request }: { request: Request }) => {
    const userId = this.getUserId(request);
    return await aiPilotService.getPendingActions(userId);
  };

  getWatchlist = async ({ request }: { request: Request }) => {
    const userId = this.getUserId(request);
    return await aiPilotService.getWatchlist(userId);
  };

  addToWatchlist = async ({ request, body }: { request: Request; body: any }) => {
    const userId = this.getUserId(request);
    return await aiPilotService.addToWatchlist(userId, body);
  };

  saveSearchResults = async ({ request, body }: { request: Request; body: any }) => {
    const userId = this.getUserId(request);
    const { query, results } = body ?? {};
    return await aiPilotService.saveCardSearchResults(userId, query, results);
  };

  transcribeVoice = async ({ request, body }: { request: Request; body: any }) => {
    this.getUserId(request);
    const { audio, mimeType } = body ?? {};
    if (!audio) {
      throw new Error('Audio base64 data required');
    }
    const transcription = await aiPilotService.transcribeAudio(audio, mimeType);
    return { transcription };
  };

  voiceChat = async ({ request, body }: { request: Request; body: any }) => {
    const userId = this.getUserId(request);
    const { audio, mimeType, conversationId } = body ?? {};
    if (!audio) {
      throw new Error('Audio base64 data required');
    }
    
    // 1. Transcribe
    const transcription = await aiPilotService.transcribeAudio(audio, mimeType);
    
    // 2. Chat
    const chatResult = await aiPilotService.processChat(userId, transcription, conversationId);
    
    return {
      transcription,
      ...chatResult
    };
  };

  getInventoryAnalytics = async ({ request }: { request: Request }) => {
    const userId = this.getUserId(request);
    return await handleToolCall('getInventoryAnalytics', {}, userId);
  };

  getProfitSummary = async ({ request }: { request: Request }) => {
    const userId = this.getUserId(request);
    return await handleToolCall('getProfitSummary', {}, userId);
  };
}

export const aiPilotController = new AIPilotController();
