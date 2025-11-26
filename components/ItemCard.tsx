import React from 'react';
import { Item, LoadoutSlotType } from '../types';
import { GripVertical, Info } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onDragStart: (e: React.DragEvent, item: Item) => void;
  compact?: boolean;
}

const getRarityColor = (rarity: string) => {
  const safeRarity = (rarity || 'common').toLowerCase();
  switch (safeRarity) {
    case 'common': return 'border-l-4 border-rarity-common';
    case 'uncommon': return 'border-l-4 border-rarity-uncommon';
    case 'rare': return 'border-l-4 border-rarity-rare';
    case 'epic': return 'border-l-4 border-rarity-epic';
    case 'legendary': return 'border-l-4 border-rarity-legendary';
    default: return 'border-l-4 border-gray-600';
  }
};

const getRarityTextColor = (rarity: string) => {
    const safeRarity = (rarity || 'common').toLowerCase();
    switch (safeRarity) {
      case 'common': return 'text-rarity-common';
      case 'uncommon': return 'text-rarity-uncommon';
      case 'rare': return 'text-rarity-rare';
      case 'epic': return 'text-rarity-epic';
      case 'legendary': return 'text-rarity-legendary';
      default: return 'text-gray-400';
    }
  };

export const ItemCard: React.FC<ItemCardProps> = ({ item, onDragStart, compact = false }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={`
        bg-arc-panel border border-arc-border rounded-r-md p-3 
        hover:border-arc-accent hover:shadow-[0_0_10px_rgba(255,94,0,0.2)] 
        transition-all cursor-grab active:cursor-grabbing group relative
        flex flex-col gap-2
        ${getRarityColor(item.rarity)}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center">
             <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center overflow-hidden border border-arc-border">
                <img 
                    src={item.imageFilename} 
                    alt={item.name?.en || 'Unknown Item'} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/100/100?grayscale';
                    }}
                />
            </div>
            <div>
                <h3 className="font-display font-bold text-sm tracking-wide text-white leading-none">
                {item.name?.en || 'Unknown Item'}
                </h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${getRarityTextColor(item.rarity)}`}>
                {item.rarity || 'Common'}
                </span>
            </div>
        </div>
        {!compact && (
           <GripVertical size={16} className="text-arc-border group-hover:text-arc-accent" />
        )}
      </div>

      {/* Details */}
      {!compact && (
        <>
            <div className="text-xs text-arc-muted line-clamp-2 h-8">
                {item.description?.en || ''}
            </div>

            <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                <div className="flex gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase">Weight</span>
                        <span className="text-xs font-mono text-gray-300">{item.weightKg || 0}kg</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase">Value</span>
                        <span className="text-xs font-mono text-arc-accent">${(item.value || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400">
                    {item.type || 'Misc'}
                </div>
            </div>
        </>
      )}
    </div>
  );
};