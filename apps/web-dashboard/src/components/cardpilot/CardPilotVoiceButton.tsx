import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface CardPilotVoiceButtonProps {
  onTranscript: (text: string) => void;
  isTranscribing?: boolean;
}

export default function CardPilotVoiceButton({ onTranscript, isTranscribing }: CardPilotVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate sending mock voice audio base64 transcription
      onTranscript('Show me my current inventory count');
    } else {
      setIsRecording(true);
    }
  };

  return (
    <button
      onClick={toggleRecording}
      disabled={isTranscribing}
      className={`p-3 rounded-full border transition-all duration-300 relative flex items-center justify-center ${
        isRecording
          ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
          : 'bg-surface border-border text-text-secondary hover:text-white hover:border-text-secondary'
      }`}
      title={isRecording ? 'Stop Recording' : 'Start Voice Control'}
    >
      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
}
