
import React, { useState, useEffect, useCallback } from 'react';
import { fetchItems } from './services/api';
import { Item, LoadoutState, LoadoutSlotType, LoadoutItem } from './types';
import { ItemBrowser } from './components/ItemBrowser';
import { LoadoutView } from './components/LoadoutView';
import { StatsView } from './components/StatsView';
import { LayoutGrid, BarChart3, Settings } from 'lucide-react';

// Generate a unique ID for loadout instances
const generateInstanceId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loadout' | 'stats'>('loadout');
  
  const [loadout, setLoadout] = useState<LoadoutState>({
    weapon1: null,
    weapon1Mods: [null, null, null, null],
    weapon2: null,
    weapon2Mods: [null, null, null, null],
    shield: null,
    augment: null,
    backpack: []
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
      setLoading(false);
    };
    init();
  }, []);

  const handleDragStart = (e: React.DragEvent, item: Item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropItem = useCallback((item: Item, slotType: LoadoutSlotType, index?: number) => {
    const newItem: LoadoutItem = {
        instanceId: generateInstanceId(),
        item,
        quantity: 1
    };

    setLoadout(prev => {
        const newState = { ...prev };

        switch (slotType) {
            case LoadoutSlotType.WEAPON_1:
                newState.weapon1 = newItem;
                break;
            case LoadoutSlotType.WEAPON_2:
                newState.weapon2 = newItem;
                break;
            case LoadoutSlotType.SHIELD:
                newState.shield = newItem;
                break;
            case LoadoutSlotType.AUGMENT:
                newState.augment = newItem;
                break;
            case LoadoutSlotType.WEAPON_MOD:
                break;
            
            case LoadoutSlotType.BACKPACK:
                // Check if stackable (same ID)
                const existingIndex = newState.backpack.findIndex(i => i.item.id === item.id);
                if (existingIndex >= 0) {
                    const updatedBackpack = [...newState.backpack];
                    updatedBackpack[existingIndex] = {
                        ...updatedBackpack[existingIndex],
                        quantity: updatedBackpack[existingIndex].quantity + 1
                    };
                    newState.backpack = updatedBackpack;
                } else {
                    newState.backpack = [...newState.backpack, newItem];
                }
                break;
        }
        return newState;
    });
  }, []);

  // Specialized handlers for nested/complex state to avoid enum complexity
  const handleDropWeaponMod = (weaponIndex: 1 | 2, modIndex: number, item: Item) => {
    const newItem: LoadoutItem = { instanceId: generateInstanceId(), item, quantity: 1 };
    setLoadout(prev => {
        const newState = { ...prev };
        if (weaponIndex === 1) {
            const newMods = [...prev.weapon1Mods];
            newMods[modIndex] = newItem;
            newState.weapon1Mods = newMods;
        } else {
            const newMods = [...prev.weapon2Mods];
            newMods[modIndex] = newItem;
            newState.weapon2Mods = newMods;
        }
        return newState;
    });
  };

  const handleRemoveItem = useCallback((instanceId: string, slotType: LoadoutSlotType, index?: number) => {
    setLoadout(prev => {
        const newState = { ...prev };
        
        if (slotType === LoadoutSlotType.WEAPON_1 && prev.weapon1?.instanceId === instanceId) newState.weapon1 = null;
        else if (slotType === LoadoutSlotType.WEAPON_2 && prev.weapon2?.instanceId === instanceId) newState.weapon2 = null;
        else if (slotType === LoadoutSlotType.SHIELD && prev.shield?.instanceId === instanceId) newState.shield = null;
        else if (slotType === LoadoutSlotType.AUGMENT && prev.augment?.instanceId === instanceId) newState.augment = null;
        else if (slotType === LoadoutSlotType.BACKPACK) {
            newState.backpack = prev.backpack.filter(i => i.instanceId !== instanceId);
        }
        return newState;
    });
  }, []);

  const handleRemoveMod = (weaponIndex: 1 | 2, modIndex: number) => {
      setLoadout(prev => {
          const newState = { ...prev };
          if (weaponIndex === 1) {
              const newMods = [...prev.weapon1Mods];
              newMods[modIndex] = null;
              newState.weapon1Mods = newMods;
          } else {
              const newMods = [...prev.weapon2Mods];
              newMods[modIndex] = null;
              newState.weapon2Mods = newMods;
          }
          return newState;
      });
  };

  const handleUpdateQuantity = (instanceId: string, delta: number) => {
      setLoadout(prev => {
          const newState = { ...prev };
          const backpackIndex = newState.backpack.findIndex(i => i.instanceId === instanceId);
          if (backpackIndex >= 0) {
              const newBackpack = [...newState.backpack];
              const item = newBackpack[backpackIndex];
              const newQuantity = Math.max(1, item.quantity + delta);
              newBackpack[backpackIndex] = { ...item, quantity: newQuantity };
              newState.backpack = newBackpack;
          }
          return newState;
      });
  };

  return (
    <div className="flex h-screen bg-arc-bg text-white overflow-hidden">
        {/* Left Sidebar: Item Browser */}
        {/* Increased width to 600px for desktop optimization */}
        <div className="flex flex-col h-full border-r border-arc-border z-10 shadow-2xl w-[600px] flex-shrink-0 transition-all">
            <ItemBrowser 
                items={items} 
                onDragStart={handleDragStart} 
                loading={loading}
            />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-arc-border bg-arc-panel/90 flex items-center justify-between px-6 backdrop-blur flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-arc-accent rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(255,94,0,0.5)]">
                        <div className="w-4 h-4 bg-black -rotate-45" />
                    </div>
                    <h1 className="text-2xl font-display font-bold tracking-widest uppercase">
                        ARC <span className="text-arc-accent">Planner</span>
                    </h1>
                </div>

                <div className="flex bg-black/30 p-1 rounded-lg border border-arc-border">
                    <button 
                        onClick={() => setActiveTab('loadout')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'loadout' ? 'bg-arc-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutGrid size={16} />
                        LOADOUT
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-arc-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BarChart3 size={16} />
                        STATS
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-arc-muted hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-arc-accent to-purple-600 border border-white/20" />
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-hidden relative">
                {activeTab === 'loadout' ? (
                    <LoadoutView 
                        loadout={loadout} 
                        onDropItem={handleDropItem} 
                        onRemoveItem={handleRemoveItem}
                        onDropMod={handleDropWeaponMod}
                        onRemoveMod={handleRemoveMod}
                        onUpdateQuantity={handleUpdateQuantity}
                    />
                ) : (
                    <StatsView loadout={loadout} allItems={items} />
                )}
            </main>
        </div>
    </div>
  );
}

export default App;
