
import React, { useState, useMemo } from 'react';
import { Item } from '../types';
import { ItemCard } from './ItemCard';
import { Search, Filter } from 'lucide-react';

interface ItemBrowserProps {
  items: Item[];
  onDragStart: (e: React.DragEvent, item: Item) => void;
  loading: boolean;
}

// Fixed categories as requested (excluding Weapons which are dynamic)
const FIXED_CATEGORIES = ['Ammunition', 'Shield', 'Quick use', 'Modification', 'Augment'];

// Helper to normalize item types into the requested categories
const getItemCategory = (item: Item): string | null => {
  const type = (item.type || '').toLowerCase();
  const name = (item.name?.en || '').toLowerCase();
  
  // 1. Ammunition - Check name AND type to catch items labeled as Consumables
  if (type.includes('ammo') || name.includes('ammo') || type.includes('ammunition')) {
    return 'Ammunition';
  }

  // 2. Shield (Armor/Helmets)
  if (type.includes('armor') || type.includes('shield') || type.includes('helmet') || type.includes('chest')) return 'Shield';

  // 3. Quick use (Consumables, Gadgets, Meds, Tools)
  // Moved ABOVE Weapon check to ensure Gadgets/Grenades (which might be marked isWeapon) land here first
  if (type.includes('quick') || 
      type.includes('consumable') || 
      type.includes('med') || 
      type.includes('health') ||
      type.includes('grenade') || 
      type.includes('gadget') || 
      type.includes('stim') || 
      type.includes('tool') ||
      type.includes('utility') ||
      type.includes('throwable') ||
      type.includes('deployable') ||
      type.includes('mine') ||
      type.includes('trap') ||
      type.includes('sensor') ||
      type.includes('scanner') ||
      type.includes('kit')) {
      return 'Quick use';
  }

  // 4. Weapons (Retain specific type)
  // Check isWeapon flag or common weapon keywords
  if (item.isWeapon || 
      type.includes('weapon') || 
      type.includes('rifle') || 
      type.includes('gun') || 
      type.includes('launcher') || 
      type.includes('melee') ||
      type.includes('pistol') ||
      type.includes('cannon') ||
      type.includes('shotgun') ||
      type.includes('smg') ||
      type.includes('sniper')) {
     return item.type || 'Weapon'; // Return the actual weapon type (e.g. "Hand Cannon")
  }

  // 5. Modification
  if (type.includes('mod') || type.includes('attachment') || type.includes('scope') || type.includes('barrel') || type.includes('magazine')) return 'Modification';

  // 6. Augment
  if (type.includes('augment')) return 'Augment';

  // Return null for items that don't fit the requested categories (Materials, Junk, etc.)
  return null;
};

export const ItemBrowser: React.FC<ItemBrowserProps> = ({ items, onDragStart, loading }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Process items to attach their display category and filter out unwanted ones
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      displayCategory: getItemCategory(item)
    })).filter(item => item.displayCategory !== null);
  }, [items]);

  // Generate Tabs
  const tabs = useMemo(() => {
    const weaponTypes = new Set<string>();

    processedItems.forEach(item => {
      const cat = item.displayCategory;
      if (!cat) return;

      if (!FIXED_CATEGORIES.includes(cat)) {
        // It's a weapon type
        weaponTypes.add(cat);
      }
    });

    const sortedWeaponTypes = Array.from(weaponTypes).sort();
    
    // Always show the requested fixed categories, even if empty, for consistent UI
    return ['All', ...sortedWeaponTypes, ...FIXED_CATEGORIES];
  }, [processedItems]);

  const filteredItems = useMemo(() => {
    return processedItems.filter(item => {
      const matchesType = filter === 'All' || item.displayCategory === filter;
      const matchesSearch = (item.name?.en || '').toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [processedItems, filter, search]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full text-arc-accent animate-pulse font-mono tracking-widest text-sm">
            ACCESSING ARCHIVE...
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-arc-bg w-full">
      
      {/* Search & Header */}
      <div className="p-4 border-b border-arc-border bg-arc-panel/50 backdrop-blur">
        <h2 className="text-xl font-display font-bold mb-3 tracking-widest text-white">ARCHIVE</h2>
        <div className="relative">
            <Search className="absolute left-3 top-2.5 text-arc-muted" size={16} />
            <input 
                type="text" 
                placeholder="Search database..." 
                className="w-full bg-black/40 border border-arc-border rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-arc-accent text-white placeholder-gray-600 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {/* Category Tabs - Wrapped Layout */}
      <div className="flex flex-wrap p-3 gap-2 border-b border-arc-border bg-arc-panel/20 content-start max-h-[30vh] overflow-y-auto">
        {tabs.map(t => (
            <button
                key={t}
                onClick={() => setFilter(t)}
                className={`
                    px-3 py-1.5 text-xs font-medium rounded-full border transition-all
                    ${filter === t 
                        ? 'bg-arc-accent border-arc-accent text-white shadow-sm' 
                        : 'bg-arc-panel border-white/10 text-gray-400 hover:text-white hover:border-white/30'}
                `}
            >
                {t}
            </button>
        ))}
      </div>

      {/* Item Grid - 2 Columns */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-arc-bg">
        {filteredItems.length === 0 ? (
            <div className="text-center text-arc-muted mt-10">
                <Filter size={32} className="mx-auto mb-2 opacity-20" />
                <p>No matches found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {filteredItems.map(item => (
                    <ItemCard 
                        key={item.id} 
                        item={item} 
                        onDragStart={onDragStart} 
                    />
                ))}
            </div>
        )}
      </div>
      
      <div className="p-2 border-t border-arc-border text-[10px] text-center text-gray-600 font-mono uppercase">
        {filteredItems.length} Records Available
      </div>
    </div>
  );
};
