import React, { useEffect, useRef } from 'react';
import CardPilotMessage, { ChatMessage } from './CardPilotMessage';
import CardPilotInput from './CardPilotInput';
import CardPilotGuardrailNotice from './CardPilotGuardrailNotice';
import { Loader2 } from 'lucide-react';

interface CardPilotChatProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onConfirmAction: (actionId: string) => Promise<void>;
  onCancelAction: (actionId: string) => Promise<void>;
  onAddToWatchlist: (item: any) => Promise<void>;
  onAddToInventory: (item: any) => Promise<void>;
}

export default function CardPilotChat({
  messages,
  loading,
  onSendMessage,
  onConfirmAction,
  onCancelAction,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-surface/20 rounded-2xl border border-border overflow-hidden">
      {/* Scope notice header */}
      <div className="p-4 border-b border-border bg-surface/40">
        <CardPilotGuardrailNotice />
      </div>

      {/* Message window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-8">
            <span className="text-white font-bold text-lg">Welcome to CardPilot AI Console</span>
            <p className="text-text-secondary text-sm max-w-md">
              Ask me sports card questions, comps analysis, price updates, or trigger listings. E.g., &quot;What is my total portfolio valuation?&quot; or &quot;Search Mahomes Prizm comps&quot;.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <CardPilotMessage
              key={msg.id}
              message={msg}
              onConfirmAction={onConfirmAction}
              onCancelAction={onCancelAction}
              onAddToWatchlist={onAddToWatchlist}
              onAddToInventory={onAddToInventory}
            />
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-text-secondary text-sm p-4">
            <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
            CardPilot is thinking and checking market comps...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input container */}
      <div className="p-4 border-t border-border bg-surface/40">
        <CardPilotInput onSendMessage={onSendMessage} loading={loading} />
      </div>
    </div>
  );
}
