import { db } from '../../db/index.js';
import { sql, eq, desc } from 'drizzle-orm';
import { aiConversations, aiMessages, aiActions, aiCardSearchResults, aiWatchlist } from '../../db/schema/ai_pilot.js';
import { cards, cardVariants } from '../../db/schema/carddb.js';

export class AIPilotRepository {
  async createConversation(userId: string, title?: string) {
    const result = await db.insert(aiConversations).values({
      userId,
      title: title || 'New Conversation'
    }).returning();
    return result[0];
  }

  async getConversation(id: string, userId: string) {
    const result = await db.select().from(aiConversations)
      .where(sql`${aiConversations.id} = ${id} AND ${aiConversations.userId} = ${userId}`)
      .limit(1);
    return result[0] || null;
  }

  async listConversations(userId: string) {
    return await db.select().from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async deleteConversation(id: string, userId: string) {
    // Delete conversation safely checking ownership
    const result = await db.execute(sql`
      DELETE FROM ai_conversations WHERE id = ${id} AND user_id = ${userId} RETURNING id
    `);
    return result.rows.length > 0;
  }

  async createMessage(conversationId: string, role: 'user' | 'assistant' | 'tool', content: string, toolCalls?: any) {
    const result = await db.insert(aiMessages).values({
      conversationId,
      role,
      content,
      toolCalls: toolCalls || null
    }).returning();
    
    // Update conversation updatedAt
    await db.execute(sql`
      UPDATE ai_conversations SET updated_at = NOW() WHERE id = ${conversationId}
    `);
    
    return result[0];
  }

  async listMessages(conversationId: string, limit: number = 20) {
    return await db.select().from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(desc(aiMessages.createdAt))
      .limit(limit);
  }

  async getPendingActions(userId: string) {
    return await db.select().from(aiActions)
      .where(sql`${aiActions.userId} = ${userId} AND ${aiActions.status} = 'pending_confirmation'`)
      .orderBy(desc(aiActions.createdAt));
  }

  async cancelAction(actionId: string, userId: string) {
    const result = await db.execute(sql`
      UPDATE ai_actions 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE id = ${actionId} AND user_id = ${userId} AND status = 'pending_confirmation'
      RETURNING id
    `);
    return result.rows.length > 0;
  }

  async getWatchlist(userId: string) {
    const result = await db.execute(sql`
      SELECT w.*, c.player_name, c.set_name, c.year, cv.name as variation 
      FROM ai_watchlist w
      LEFT JOIN cards c ON c.id = w.card_id
      LEFT JOIN card_variants cv ON cv.id = w.variant_id
      WHERE w.user_id = ${userId}
      ORDER BY w.created_at DESC
    `);
    return result.rows;
  }

  async addToWatchlist(userId: string, cardId: string | null, variantId: string | null, gradeKey: string | null, targetPrice: number | null) {
    const result = await db.insert(aiWatchlist).values({
      userId,
      cardId,
      variantId,
      gradeKey,
      targetPrice: targetPrice ? targetPrice.toString() : null
    }).returning();
    return result[0];
  }

  async saveCardSearchResults(userId: string, query: string, results: any) {
    const result = await db.insert(aiCardSearchResults).values({
      userId,
      query,
      results
    }).returning();
    return result[0];
  }
}
export const aiPilotRepository = new AIPilotRepository();
