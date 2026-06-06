import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

export interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface CardPilotConversationSidebarProps {
  conversations: ConversationItem[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function CardPilotConversationSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: CardPilotConversationSidebarProps) {
  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-accent-blue hover:bg-blue-600 text-white text-sm font-semibold transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              className={`flex items-center justify-between group rounded-lg p-2.5 transition-all duration-200 cursor-pointer ${
                isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-blue' : 'text-text-secondary'}`} />
                <span className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-text-secondary'}`}>
                  {conv.title}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-red transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
