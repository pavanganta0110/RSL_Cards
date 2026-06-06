import { aiPilotRepository } from './ai-pilot.repository.js';
import { llmProvider } from './providers/llm.provider.ts';
import { speechProvider } from './providers/speech.provider.ts';
import { toolsRegistry } from './tools/registry.js';
import { handleToolCall, executeAction } from './tools/handlers.js';
import { checkMessageGuardrails, enforceGuardrailResponse, GUARDRAIL_REJECTION_MESSAGE } from './ai-pilot.guardrails.js';
import { calculateExecutionCost, estimateTokenCount } from './ai-pilot.cost.js';
import { logger } from '../../lib/logger.js';


export class AIPilotService {
  async processChat(userId: string, message: string, conversationId?: string) {
    // 1. Guardrail topic check
    if (!checkMessageGuardrails(message)) {
      logger.info({ message }, 'Message blocked by off-topic guardrails');
      // If conversationId isn't provided, create a conversation to store the rejection context
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const newConv = await aiPilotRepository.createConversation(userId, 'Off-topic Query');
        activeConversationId = newConv.id;
      }
      
      await aiPilotRepository.createMessage(activeConversationId, 'user', message);
      const resMsg = await aiPilotRepository.createMessage(activeConversationId, 'assistant', GUARDRAIL_REJECTION_MESSAGE);
      
      return {
        message: GUARDRAIL_REJECTION_MESSAGE,
        conversationId: activeConversationId,
        actionRequired: null,
        metrics: {
          inputTokens: estimateTokenCount(message),
          outputTokens: estimateTokenCount(GUARDRAIL_REJECTION_MESSAGE),
          estimatedCost: 0.00,
          model: 'local-guardrail'
        }
      };
    }

    // 2. Resolve or create active conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const title = message.length > 30 ? message.slice(0, 30) + '...' : message;
      const newConv = await aiPilotRepository.createConversation(userId, title);
      activeConversationId = newConv.id;
    }

    // Save user message
    await aiPilotRepository.createMessage(activeConversationId, 'user', message);

    // 3. Construct chat context window
    const maxMessages = Number(process.env.AI_MAX_CONTEXT_MESSAGES || '8');
    const dbMessages = await aiPilotRepository.listMessages(activeConversationId, maxMessages);
    
    // Check conversation summary fallback if it exists
    const conversationRecord = await aiPilotRepository.getConversation(activeConversationId, userId);
    const contextMessages = [];
    
    if (conversationRecord?.summary) {
      contextMessages.push({
        role: 'system',
        content: `Previous conversation context summary: ${conversationRecord.summary}`
      });
    }

    // Messages returned desc, reverse for chronological order
    const chronologicalMsgs = [...dbMessages].reverse().map(m => ({
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls
    }));
    contextMessages.push(...chronologicalMsgs);

    // 4. Invoke LLM Provider
    const { text, toolCalls, modelUsed } = await llmProvider.generateChatResponse(
      contextMessages,
      toolsRegistry
    );

    let finalResponseText = text;
    let pendingAction = null;

    // 5. Handle LLM Tool Calling
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0]; // Process single primary intent tool call
      logger.info({ tool: toolCall.name }, 'Processing LLM requested tool call');
      
      try {
        const toolOutput = await handleToolCall(toolCall.name, toolCall.args, userId, activeConversationId);
        
        // Check if write action is pending confirmation
        if (toolOutput && toolOutput.pending) {
          pendingAction = {
            actionId: toolOutput.actionId,
            actionType: toolCall.name,
            payload: toolCall.args
          };
          finalResponseText = toolOutput.message;
        } else {
          // Send tool output back to LLM to generate final natural response
          const toolMessageContext = [
            ...contextMessages,
            { role: 'assistant', content: '', toolCalls },
            { role: 'tool', content: JSON.stringify(toolOutput) }
          ];

          const llmFollowup = await llmProvider.generateChatResponse(toolMessageContext);
          finalResponseText = llmFollowup.text;
        }
      } catch (err: any) {
        logger.error({ error: err.message }, 'Tool execution failed');
        finalResponseText = `I encountered an error executing that action: ${err.message}`;
      }
    }

    // Enforce guardrails on output
    finalResponseText = enforceGuardrailResponse(finalResponseText);

    // Save assistant response
    await aiPilotRepository.createMessage(activeConversationId, 'assistant', finalResponseText, toolCalls);

    // Compute token count / cost metrics
    const inputCharSize = contextMessages.reduce((sum, m) => sum + m.content.length, 0) + message.length;
    const outputCharSize = finalResponseText.length;
    const metrics = calculateExecutionCost(modelUsed, inputCharSize, outputCharSize);

    return {
      message: finalResponseText,
      conversationId: activeConversationId,
      actionRequired: pendingAction,
      metrics
    };
  }

  async listConversations(userId: string) {
    return await aiPilotRepository.listConversations(userId);
  }

  async getConversation(id: string, userId: string) {
    const conv = await aiPilotRepository.getConversation(id, userId);
    if (!conv) return null;
    const dbMessages = await aiPilotRepository.listMessages(id, 50); // Fetch last 50 messages
    return {
      conversation: conv,
      messages: [...dbMessages].reverse()
    };
  }

  async deleteConversation(id: string, userId: string) {
    return await aiPilotRepository.deleteConversation(id, userId);
  }

  async getPendingActions(userId: string) {
    return await aiPilotRepository.getPendingActions(userId);
  }

  async confirmAction(actionId: string, userId: string) {
    await executeAction(actionId, userId);
    return { success: true };
  }

  async cancelAction(actionId: string, userId: string) {
    return await aiPilotRepository.cancelAction(actionId, userId);
  }

  async getWatchlist(userId: string) {
    return await aiPilotRepository.getWatchlist(userId);
  }

  async addToWatchlist(userId: string, args: any) {
    const { cardId, variantId, gradeKey, targetPrice } = args;
    return await aiPilotRepository.addToWatchlist(userId, cardId || null, variantId || null, gradeKey || null, targetPrice || null);
  }

  async saveCardSearchResults(userId: string, query: string, results: any) {
    return await aiPilotRepository.saveCardSearchResults(userId, query, results);
  }

  async transcribeAudio(base64Audio: string, mimeType?: string) {
    return await speechProvider.transcribe(base64Audio, mimeType);
  }
}

export const aiPilotService = new AIPilotService();
