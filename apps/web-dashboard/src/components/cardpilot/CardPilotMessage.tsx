import React from 'react';
import { Bot, User, Cpu } from 'lucide-react';
import CardPilotActionConfirmation from './CardPilotActionConfirmation';
import CardPilotSearchResults from './CardPilotSearchResults';
import CardPilotCharts from './CardPilotCharts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: any;
  actionRequired?: {
    actionId: string;
    actionType: string;
    payload: any;
    message: string;
  } | null;
  searchResults?: any[];
  chart?: {
    type: 'valuation' | 'profit' | 'sports' | 'grades';
    data: any[];
  };
}

interface CardPilotMessageProps {
  message: ChatMessage;
  onConfirmAction: (actionId: string) => Promise<void>;
  onCancelAction: (actionId: string) => Promise<void>;
  onAddToWatchlist: (item: any) => Promise<void>;
  onAddToInventory: (item: any) => Promise<void>;
}

export default function CardPilotMessage({
  message,
  onConfirmAction,
  onCancelAction,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotMessageProps) {
  const isBot = message.role === 'assistant';

  return (
    <div className={`flex gap-4 p-4 rounded-xl ${isBot ? 'bg-surface/50 border border-border' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isBot ? 'bg-accent-blue/20 text-accent-blue' : 'bg-success/20 text-success'
      }`}>
        {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-sm">
            {isBot ? 'CardPilot' : 'You (Dealer)'}
          </span>
          <span className="text-[10px] text-text-muted">
            {isBot ? 'Gemini 1.5 Flash' : 'Validated Session'}
          </span>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Pending write action confirmation cards */}
        {message.actionRequired && (
          <CardPilotActionConfirmation
            actionId={message.actionRequired.actionId}
            actionType={message.actionRequired.actionType}
            payload={message.actionRequired.payload}
            message={message.content}
            onConfirm={onConfirmAction}
            onCancel={onCancelAction}
          />
        )}

        {/* Online Search results */}
        {message.searchResults && message.searchResults.length > 0 && (
          <CardPilotSearchResults
            items={message.searchResults}
            onAddToWatchlist={onAddToWatchlist}
            onAddToInventory={onAddToInventory}
          />
        )}

        {/* Aggregate chart widgets */}
        {message.chart && (
          <CardPilotCharts
            type={message.chart.type}
            data={message.chart.data}
          />
        )}
      </div>
    </div>
  );
}
