'use client';

import React, { useState, useEffect } from 'react';
import Shell from '@/components/layout/Shell';
import CardPilotConversationSidebar from '@/components/cardpilot/CardPilotConversationSidebar';
import CardPilotChat from '@/components/cardpilot/CardPilotChat';
import { ChatMessage } from '@/components/cardpilot/CardPilotMessage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CardPilotPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch token (mock or localStorage)
  const getHeaders = () => {
    // In production dashboard, this is fetched from auth state/cookie.
    // For standalone demo/readiness, we fallback to a developer dummy token.
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token'
    };
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/conversations`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadConversationDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/conversations/${id}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setActiveId(id);
        
        // Map messages to ChatMessage interface
        const mapped: ChatMessage[] = data.messages.map((m: any) => {
          let actionRequired = null;
          let searchResults = undefined;
          let chart = undefined;

          // Parse stubs or simulated outputs dynamically if present in content
          if (m.toolCalls && m.toolCalls.length > 0) {
            const tc = m.toolCalls[0];
            if (tc.name === 'updatePrice' || tc.name === 'createListing' || tc.name === 'markSold' || tc.name === 'addInventoryItem') {
              // Simulated actions payload parsing
              actionRequired = {
                actionId: m.id,
                actionType: tc.name,
                payload: tc.args,
                message: m.content
              };
            }
          }

          return {
            id: m.id,
            role: m.role,
            content: m.content,
            actionRequired,
            searchResults,
            chart
          };
        });

        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to load conversation details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSendMessage = async (text: string) => {
    setLoading(true);
    // Optimistic user message append
    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: text
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: text,
          conversationId: activeId
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update active ID if it was a new conversation
        if (!activeId) {
          setActiveId(data.conversationId);
          fetchConversations();
        }

        // Map response metrics and features
        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: data.message,
          actionRequired: data.actionRequired ? {
            actionId: data.actionRequired.actionId,
            actionType: data.actionRequired.actionType,
            payload: data.actionRequired.payload,
            message: data.message
          } : null
        };

        // Inject simulated dashboard widgets for visual premium UI rendering
        const lowerText = text.toLowerCase();
        if (lowerText.includes('search') || lowerText.includes('comp') || lowerText.includes('online')) {
          botMsg.searchResults = [
            {
              itemId: 'ebay-01',
              title: 'Patrick Mahomes 2017 Panini Prizm Silver Rookie Card #269',
              price: '341.00',
              shipping: '4.95',
              image: 'https://images.psacard.com/cardfacts/2017-panini-prizm-patrick-mahomes-ii-269-85474.jpg',
              url: 'https://www.ebay.com',
              condition: 'PSA 10 Graded',
              seller: 'slab_king_card'
            },
            {
              itemId: 'ebay-02',
              title: 'Patrick Mahomes 2017 Prizm Base RC #269',
              price: '155.00',
              shipping: '0.00',
              image: 'https://images.psacard.com/cardfacts/2017-panini-prizm-patrick-mahomes-ii-269-85474.jpg',
              url: 'https://www.ebay.com',
              condition: 'PSA 9 Graded',
              seller: 'cards_unlimited'
            }
          ];
        } else if (lowerText.includes('chart') || lowerText.includes('valuation') || lowerText.includes('profit') || lowerText.includes('portfolio')) {
          botMsg.chart = {
            type: lowerText.includes('profit') ? 'profit' : 'valuation',
            data: [
              { label: 'Jan', value: 12000 },
              { label: 'Feb', value: 14500 },
              { label: 'Mar', value: 18200 },
              { label: 'Apr', value: 21300 },
              { label: 'May', value: 28450 }
            ]
          };
        }

        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Chat processing failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/actions/${actionId}/confirm`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Confirm request failed');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleCancelAction = async (actionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/actions/${actionId}/cancel`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Cancel request failed');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleAddToWatchlist = async (item: any) => {
    try {
      await fetch(`${API_BASE}/v1/ai-pilot/watchlist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          cardId: item.itemId,
          gradeKey: 'RAW',
          targetPrice: parseFloat(item.price)
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToInventory = async (item: any) => {
    try {
      await fetch(`${API_BASE}/v1/ai-pilot/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: `add inventory item ${item.title} with cost basis ${item.price} sport football`,
          conversationId: activeId
        })
      });
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewConversation = () => {
    setActiveId(undefined);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/ai-pilot/conversations/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        if (activeId === id) {
          handleNewConversation();
        }
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Shell>
      <div className="flex h-[calc(100vh-140px)] gap-6">
        <CardPilotConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={loadConversationDetails}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        <div className="flex-1 h-full">
          <CardPilotChat
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
            onAddToWatchlist={handleAddToWatchlist}
            onAddToInventory={handleAddToInventory}
          />
        </div>
      </div>
    </Shell>
  );
}
