import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import CardPilotVoiceButton from './CardPilotVoiceButton';

interface CardPilotInputProps {
  onSendMessage: (text: string) => void;
  loading: boolean;
}

export default function CardPilotInput({ onSendMessage, loading }: CardPilotInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleVoiceTranscript = (transcript: string) => {
    onSendMessage(transcript);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <CardPilotVoiceButton onTranscript={handleVoiceTranscript} isTranscribing={loading} />
      
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          placeholder="Ask CardPilot to find comps, list cards, update pricing..."
          className="w-full bg-surface border border-border focus:border-text-secondary focus:ring-0 text-white rounded-xl py-3 px-4 text-sm outline-none transition-all duration-200 pr-12"
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="absolute right-2 top-1.5 p-1.5 rounded-lg text-text-secondary hover:text-white disabled:opacity-50 disabled:hover:text-text-secondary transition-all duration-200"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
}
