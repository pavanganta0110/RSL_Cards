import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { cards, cardVariants } from './carddb';

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).default('New Conversation').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'tool'
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiActions = pgTable('ai_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'price_update' | 'create_listing' | 'mark_sold' | 'add_inventory' | 'add_watchlist'
  targetId: uuid('target_id'), // target table record UUID
  status: varchar('status', { length: 30 }).default('pending_confirmation').notNull(), // 'pending_confirmation' | 'completed' | 'cancelled' | 'failed'
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiCardSearchResults = pgTable('ai_card_search_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  query: text('query').notNull(),
  results: jsonb('results').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiWatchlist = pgTable('ai_watchlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cardId: varchar('card_id', { length: 255 }).references(() => cards.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => cardVariants.id, { onDelete: 'cascade' }),
  gradeKey: varchar('grade_key', { length: 30 }),
  targetPrice: decimal('target_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
