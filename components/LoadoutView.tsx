
import React from 'react';
import { Item, LoadoutState, LoadoutSlotType, LoadoutItem } from '../types';
import { Trash2, Shield, Crosshair, Package, Zap, Plus, Minus } from 'lucide-react';

interface LoadoutViewProps {
  loadout: LoadoutState;
  onDropItem: (item: Item, slotType: LoadoutSlotType) => void;
  onRemoveItem: (instanceId: string, slotType: LoadoutSlotType) => void;
  onDropMod: (weaponIndex: 1 | 2, modIndex: number, item: Item) => void;
  onRemoveMod: (weaponIndex: 1 | 2, modIndex: number) => void;
  onUpdateQuantity: (instanceId: string, delta: number) => void;
}

interface SlotProps {
  title?: string;
  icon?: React.ReactNode;
  item: LoadoutItem | null;
  onDrop: (item: Item) => void;
  onRemove: (instanceId: string) => void;
  accepts?: (item: Item) => boolean;
  className?: string;
  compact?: boolean;
  quantityControl?: boolean;
  onUpdateQuantity?: (delta: number) => void;
}

const Slot: React.FC<SlotProps> = ({ 
    title, icon, item, onDrop, onRemove, accepts, className, compact, quantityControl, onUpdateQuantity 
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;
    
    const parsedItem = JSON.parse(itemData) as Item;
    
    // Basic validation
    if (accepts && !accepts(parsedItem)) {
      // Optional: Toast or shake animation
      return;
    }

    onDrop(parsedItem);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative bg-arc-bg/50 border-2 border-dashed 
        ${item ? 'border-arc-accent/50 bg-arc-panel' : 'border-arc-border hover:border-arc-muted'} 
        rounded-lg transition-all flex flex-col items-center justify-center group
        ${compact ? 'p-1 min-h-[60px]' : 'p-4 min-h-[140px]'}
        ${className}
      `}
    >
        {!compact && title && (
            <span className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest text-arc-muted opacity-60">
                {title}
            </span>
        )}
        {!compact && icon && !item && (
            <div className="absolute top-2 left-2 text-arc-muted opacity-50">
                {icon}
            </div>
        )}

        {item ? (
            <div className="w-full h-full flex flex-col items-center justify-center z-10 animate-fade-in">
                <img 
                    src={item.item.imageFilename} 
                    alt={item.item.name?.en} 
                    className={`${compact ? 'w-8 h-8' : 'w-20 h-20'} object-contain drop-shadow-lg mb-1`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/100/100'; }}
                />
                {!compact && (
                    <div className="text-center">
                        <div className="font-bold text-sm text-white line-clamp-1 px-2">{item.item.name?.en || 'Unknown'}</div>
                        <div className="text-xs text-arc-accent font-mono">{item.item.weightKg || 0}kg</div>
                    </div>
                )}
                
                {/* Remove Button */}
                <button 
                    onClick={() => onRemove(item.instanceId)}
                    className={`absolute ${compact ? '-top-1 -right-1' : 'top-2 right-2'} p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20`}
                >
                    <Trash2 size={compact ? 10 : 14} />
                </button>

                {/* Quantity Control */}
                {quantityControl && onUpdateQuantity && (
                    <div className="absolute bottom-1 right-1 flex items-center bg-black/80 rounded border border-arc-border backdrop-blur">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(-1); }}
                            className="p-1 hover:text-arc-accent text-gray-400"
                        >
                            <Minus size={10} />
                        </button>
                        <span className="text-xs font-mono font-bold px-1 min-w-[20px] text-center text-white">
                            {item.quantity}
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(1); }}
                            className="p-1 hover:text-arc-accent text-gray-400"
                        >
                            <Plus size={10} />
                        </button>
                    </div>
                )}
            </div>
        ) : (
             <div className="text-arc-muted/30 font-display font-bold select-none flex items-center justify-center h-full w-full">
                {compact ? '+' : <span className="text-4xl">+</span>}
             </div>
        )}
    </div>
  );
};

export const LoadoutView: React.FC<LoadoutViewProps> = ({ 
    loadout, onDropItem, onRemoveItem, onDropMod, onRemoveMod, onUpdateQuantity 
}) => {
  
  // Helpers
  const isWeapon = (item: Item) => item.isWeapon === true || (item.type || '').toLowerCase().includes('weapon') || (item.type || '').toLowerCase().includes('gun') || (item.type || '').toLowerCase().includes('rifle');
  const isArmor = (item: Item) => (item.type || '').toLowerCase().includes('armor') || (item.type || '').toLowerCase().includes('helmet') || (item.type || '').toLowerCase().includes('shield');
  const isAugment = (item: Item) => (item.type || '').toLowerCase().includes('augment') || (item.type || '').toLowerCase().includes('gadget');
  const isMod = (item: Item) => (item.type || '').toLowerCase().includes('mod') || (item.type || '').toLowerCase().includes('attachment');

  const renderWeaponGroup = (
      weapon: LoadoutItem | null, 
      mods: (LoadoutItem | null)[], 
      weaponSlot: LoadoutSlotType,
      weaponIndex: 1 | 2
    ) => (
    <div className="flex flex-col bg-arc-panel/30 border border-arc-border rounded-xl p-4 gap-4">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-arc-accent tracking-widest uppercase">
                Weapon Config {String(weaponIndex).padStart(2, '0')}
            </h3>
        </div>
        
        <div className="flex gap-4 h-full">
            {/* Main Weapon Slot */}
            <div className="flex-1">
                <Slot 
                    title={`Weapon ${weaponIndex}`}
                    icon={<Crosshair size={24} />}
                    item={weapon}
                    onDrop={(i) => onDropItem(i, weaponSlot)}
                    onRemove={(id) => onRemoveItem(id, weaponSlot)}
                    accepts={isWeapon}
                    className="h-full"
                />
            </div>
            
            {/* Modification Slots */}
            <div className="flex flex-col gap-2 w-16 md:w-20 justify-between">
                {mods.map((mod, idx) => (
                    <Slot
                        key={`w${weaponIndex}-mod-${idx}`}
                        item={mod}
                        compact
                        onDrop={(i) => onDropMod(weaponIndex, idx, i)}
                        onRemove={() => onRemoveMod(weaponIndex, idx)}
                        accepts={isMod}
                        className="aspect-square flex-1"
                    />
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8 space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-arc-panel to-arc-bg scrollbar-thin">
      
      {/* Top Row: Weapons */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderWeaponGroup(loadout.weapon1, loadout.weapon1Mods, LoadoutSlotType.WEAPON_1, 1)}
        {renderWeaponGroup(loadout.weapon2, loadout.weapon2Mods, LoadoutSlotType.WEAPON_2, 2)}
      </div>

      {/* Middle Row: Shield & Augment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-arc-panel/30 border border-arc-border rounded-xl p-4">
             <h3 className="text-sm font-display font-bold text-arc-accent tracking-widest uppercase mb-4">Defense</h3>
             <Slot 
                title="Shield / Armor" 
                icon={<Shield size={24} />} 
                item={loadout.shield}
                onDrop={(i) => onDropItem(i, LoadoutSlotType.SHIELD)}
                onRemove={(id) => onRemoveItem(id, LoadoutSlotType.SHIELD)}
                accepts={isArmor}
                className="aspect-[3/1]"
            />
        </div>
        <div className="bg-arc-panel/30 border border-arc-border rounded-xl p-4">
            <h3 className="text-sm font-display font-bold text-arc-accent tracking-widest uppercase mb-4">Augmentation</h3>
            <Slot 
                title="Augment" 
                icon={<Zap size={24} />} 
                item={loadout.augment}
                onDrop={(i) => onDropItem(i, LoadoutSlotType.AUGMENT)}
                onRemove={(id) => onRemoveItem(id, LoadoutSlotType.AUGMENT)}
                accepts={isAugment}
                className="aspect-[3/1]"
            />
        </div>
      </div>

      {/* Backpack Grid */}
      <div className="bg-arc-panel/30 border border-arc-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
            <Package className="text-arc-accent" size={20} />
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Backpack Storage</h2>
            <div className="h-px bg-arc-border flex-1 ml-4" />
            <span className="text-arc-muted text-sm font-mono">
                {loadout.backpack.reduce((acc, i) => acc + i.quantity, 0)} Items
            </span>
        </div>
        
        <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 min-h-[200px]"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
                e.preventDefault();
                const itemData = e.dataTransfer.getData('application/json');
                if (itemData) {
                    onDropItem(JSON.parse(itemData), LoadoutSlotType.BACKPACK);
                }
            }}
        >
            {loadout.backpack.map((bpItem) => (
                 <div key={bpItem.instanceId} className="aspect-square relative group">
                    <Slot
                        item={bpItem}
                        onDrop={() => {}} // Drop handled by parent container for stacking logic simplification
                        onRemove={() => onRemoveItem(bpItem.instanceId, LoadoutSlotType.BACKPACK)}
                        quantityControl
                        onUpdateQuantity={(delta) => onUpdateQuantity(bpItem.instanceId, delta)}
                        className="h-full w-full"
                    />
                 </div>
            ))}
            
            {/* Empty placeholders */}
            {Array.from({ length: Math.max(0, 16 - loadout.backpack.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white/5 rounded border border-white/5 aspect-square flex items-center justify-center border-dashed border-gray-800">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
