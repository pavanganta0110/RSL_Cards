import React, { useState } from 'react';
import { ExternalLink, Eye, PackagePlus, Check } from 'lucide-react';

export interface CardSearchResultItem {
  itemId: string;
  title: string;
  price: string;
  shipping: string;
  image?: string;
  url: string;
  condition?: string;
  seller?: string;
  grade?: string;
  source?: string;
}

interface CardPilotResultCardProps {
  item: CardSearchResultItem;
  onAddToWatchlist: (item: CardSearchResultItem) => Promise<void>;
  onAddToInventory: (item: CardSearchResultItem) => Promise<void>;
}

export default function CardPilotResultCard({
  item,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotResultCardProps) {
  const [watchlistSuccess, setWatchlistSuccess] = useState(false);
  const [inventorySuccess, setInventorySuccess] = useState(false);

  const handleWatchlist = async () => {
    await onAddToWatchlist(item);
    setWatchlistSuccess(true);
    setTimeout(() => setWatchlistSuccess(false), 2000);
  };

  const handleInventory = async () => {
    await onAddToInventory(item);
    setInventorySuccess(true);
    setTimeout(() => setInventorySuccess(false), 2000);
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-muted transition-all duration-200">
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-20 h-24 object-cover rounded-lg bg-black/20 flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-white font-medium text-sm line-clamp-2">{item.title}</h4>
        
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="font-mono text-white font-bold">${item.price}</span>
          <span>+${item.shipping} shipping</span>
          {item.condition && <span className="chip bg-white/5">{item.condition}</span>}
          {item.grade && <span className="chip chip-blue">{item.grade}</span>}
        </div>

        {item.seller && (
          <div className="text-[11px] text-text-muted">
            Seller: {item.seller} (eBay)
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:text-blue-400"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Source Link
          </a>
          <button
            onClick={handleWatchlist}
            className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-white"
          >
            {watchlistSuccess ? <Check className="w-3.5 h-3.5 text-success" /> : <Eye className="w-3.5 h-3.5" />}
            {watchlistSuccess ? 'Added' : 'Watchlist'}
          </button>
          <button
            onClick={handleInventory}
            className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-white"
          >
            {inventorySuccess ? <Check className="w-3.5 h-3.5 text-success" /> : <PackagePlus className="w-3.5 h-3.5" />}
            {inventorySuccess ? 'Importing' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
