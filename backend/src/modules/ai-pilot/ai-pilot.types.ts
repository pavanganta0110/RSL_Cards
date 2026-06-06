export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: any;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAction {
  id: string;
  userId: string;
  conversationId?: string | null;
  actionType: 'price_update' | 'create_listing' | 'mark_sold' | 'add_inventory' | 'add_watchlist';
  targetId?: string | null;
  status: 'pending_confirmation' | 'completed' | 'cancelled' | 'failed';
  payload: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AICardSearchResult {
  id: string;
  userId: string;
  query: string;
  results: any;
  createdAt: Date;
}

export interface AIWatchlistItem {
  id: string;
  userId: string;
  cardId?: string | null;
  variantId?: string | null;
  gradeKey?: string | null;
  targetPrice?: number | null;
  createdAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  actionRequired?: {
    actionId: string;
    actionType: string;
    payload: any;
  } | null;
}
