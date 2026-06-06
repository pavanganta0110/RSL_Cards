import { Elysia } from 'elysia';
import { aiPilotController } from './ai-pilot.controller.js';
import { requireDealer } from '../../middleware/auth.js';

export const aiPilotModule = new Elysia({ prefix: '/v1/ai-pilot' })
  .use(requireDealer)
  .post('/chat', aiPilotController.chat)
  .get('/conversations', aiPilotController.listConversations)
  .get('/conversations/:id', aiPilotController.getConversation)
  .delete('/conversations/:id', aiPilotController.deleteConversation)
  .post('/actions/:id/confirm', aiPilotController.confirmAction)
  .post('/actions/:id/cancel', aiPilotController.cancelAction)
  .get('/actions/pending', aiPilotController.getPendingActions)
  .post('/search-cards', aiPilotController.saveSearchResults)
  .post('/search-results/:id/watchlist', aiPilotController.addToWatchlist)
  .get('/watchlist', aiPilotController.getWatchlist)
  .post('/voice/transcribe', aiPilotController.transcribeVoice)
  .post('/voice/chat', aiPilotController.voiceChat)
  .get('/analytics/inventory', aiPilotController.getInventoryAnalytics)
  .get('/analytics/profit', aiPilotController.getProfitSummary);
