import React from 'react';
import CardPilotResultCard, { CardSearchResultItem } from './CardPilotResultCard';

interface CardPilotSearchResultsProps {
  items: CardSearchResultItem[];
  onAddToWatchlist: (item: CardSearchResultItem) => Promise<void>;
  onAddToInventory: (item: CardSearchResultItem) => Promise<void>;
}

export default function CardPilotSearchResults({
  items,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotSearchResultsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
        Online Search Matches ({items.length})
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <CardPilotResultCard
            key={item.itemId || idx}
            item={item}
            onAddToWatchlist={onAddToWatchlist}
            onAddToInventory={onAddToInventory}
          />
        ))}
      </div>
    </div>
  );
}
