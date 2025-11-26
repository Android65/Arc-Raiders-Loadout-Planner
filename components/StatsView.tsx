
import React, { useMemo, useState } from 'react';
import { LoadoutState, Item } from '../types';
import { DollarSign, Weight, Hammer, ChevronRight, ChevronDown, Box, Layers, ArrowUpCircle, Search } from 'lucide-react';

interface StatsViewProps {
  loadout: LoadoutState;
  allItems: Item[];
}

interface CraftingNode {
  item: Item | null;
  itemId: string;
  quantity: number; 
  children: CraftingNode[];
  isUpgrade?: boolean; 
}

// Helper to determine the predecessor ID (e.g. anvil_ii -> anvil_i)
const getPredecessorId = (currentId: string): string | null => {
  const parts = currentId.split('_');
  const suffix = parts[parts.length - 1].toLowerCase();
  
  const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const index = romans.indexOf(suffix);
  
  if (index > 0) {
      const prevSuffix = romans[index - 1];
      const prefix = parts.slice(0, parts.length - 1).join('_');
      return `${prefix}_${prevSuffix}`;
  }
  
  return null;
};

// Recursive component for Tree View
const CraftingTreeNode: React.FC<{ node: CraftingNode; parentQuantity: number; depth?: number }> = ({ node, parentQuantity, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  
  // Total needed is this node's quantity * how many of the parent we are making
  const totalRequired = node.quantity * parentQuantity;
  const hasChildren = node.children.length > 0;
  
  // Indentation
  const paddingLeft = `${depth * 20}px`;

  return (
    <div className="select-none">
      <div 
        className={`
            flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded transition-colors
            ${depth === 0 ? 'bg-white/5 mb-1' : ''}
            ${node.isUpgrade ? 'bg-arc-accent/5' : ''}
        `}
        style={{ paddingLeft: depth === 0 ? '8px' : paddingLeft }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className={`text-arc-muted cursor-pointer w-4 flex justify-center ${!hasChildren && 'opacity-0'}`}>
             {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        <div className="w-8 h-8 bg-black/40 rounded border border-arc-border flex items-center justify-center overflow-hidden flex-shrink-0 relative">
             {node.item ? (
                 <img src={node.item.imageFilename} className="w-full h-full object-contain" alt="" />
             ) : (
                 <Box size={14} className="text-gray-600" />
             )}
             {node.isUpgrade && (
                 <div className="absolute top-0 right-0 bg-arc-accent p-0.5 rounded-bl">
                     <ArrowUpCircle size={8} className="text-white" />
                 </div>
             )}
        </div>

        <div className="flex-1 min-w-0">
             <div className="text-sm font-medium truncate text-gray-200">
                {node.item?.name?.en || node.itemId}
             </div>
             {depth === 0 && (
                 <div className="text-[10px] text-arc-accent uppercase tracking-wider font-bold">Base Item</div>
             )}
             {node.isUpgrade && depth > 0 && (
                 <div className="text-[10px] text-arc-accent uppercase tracking-wider">Required Base</div>
             )}
        </div>

        <div className="font-mono text-xs text-gray-400 bg-black/40 px-2 py-1 rounded border border-arc-border">
            x{totalRequired}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-l border-white/5 ml-[22px]">
             {node.children.map((child, idx) => (
                 <CraftingTreeNode 
                    key={`${child.itemId}-${idx}`} 
                    node={child} 
                    parentQuantity={totalRequired} // Pass down the multiplier
                    depth={depth + 1} 
                 />
             ))}
        </div>
      )}
    </div>
  );
};

export const StatsView: React.FC<StatsViewProps> = ({ loadout, allItems }) => {
  // --- OVERVIEW DATA CALCS ---
  const getValue = (item: any) => (item?.item.value || 0) * (item?.quantity || 1);
  const getWeight = (item: any) => (item?.item.weightKg || 0) * (item?.quantity || 1);

  const weapon1TotalValue = getValue(loadout.weapon1) + loadout.weapon1Mods.reduce((acc, m) => acc + getValue(m), 0);
  const weapon2TotalValue = getValue(loadout.weapon2) + loadout.weapon2Mods.reduce((acc, m) => acc + getValue(m), 0);
  const weapon1TotalWeight = getWeight(loadout.weapon1) + loadout.weapon1Mods.reduce((acc, m) => acc + getWeight(m), 0);
  const weapon2TotalWeight = getWeight(loadout.weapon2) + loadout.weapon2Mods.reduce((acc, m) => acc + getWeight(m), 0);

  const shieldValue = getValue(loadout.shield);
  const shieldWeight = getWeight(loadout.shield);
  
  const augmentValue = getValue(loadout.augment);
  const augmentWeight = getWeight(loadout.augment);

  const backpackValue = loadout.backpack.reduce((acc, curr) => acc + getValue(curr), 0);
  const backpackWeight = loadout.backpack.reduce((acc, curr) => acc + getWeight(curr), 0);

  const totalValue = weapon1TotalValue + weapon2TotalValue + shieldValue + augmentValue + backpackValue;
  const totalWeight = weapon1TotalWeight + weapon2TotalWeight + shieldWeight + augmentWeight + backpackWeight;

  // --- CRAFTING TREE LOGIC ---
  const itemMap = useMemo(() => {
    return new Map(allItems.map(i => [i.id, i]));
  }, [allItems]);

  // Recursive builder
  const buildCraftingTree = (item: Item, qty: number): CraftingNode => {
     const children: CraftingNode[] = [];
     
     // Case 1: Upgrade Cost (Chain)
     if (item.upgradeCost) {
         // 1. Add Upgrade Materials
         Object.entries(item.upgradeCost).forEach(([compId, compQty]) => {
            const componentItem = itemMap.get(compId) || null;
            if (componentItem) {
                children.push(buildCraftingTree(componentItem, compQty));
            } else {
                children.push({
                    item: null,
                    itemId: compId,
                    quantity: compQty,
                    children: []
                });
            }
         });

         // 2. Determine and Add Predecessor Item
         const predecessorId = getPredecessorId(item.id);
         if (predecessorId) {
             const predecessorItem = itemMap.get(predecessorId);
             if (predecessorItem) {
                 const prevNode = buildCraftingTree(predecessorItem, 1);
                 prevNode.isUpgrade = true; 
                 children.push(prevNode);
             } else {
                 children.push({
                     item: null,
                     itemId: predecessorId,
                     quantity: 1,
                     children: [],
                     isUpgrade: true
                 });
             }
         }
     } 
     // Case 2: Standard Recipe
     else if (item.recipe) {
         Object.entries(item.recipe).forEach(([componentId, componentQty]) => {
             const componentItem = itemMap.get(componentId) || null;
             if (componentItem) {
                 children.push(buildCraftingTree(componentItem, componentQty));
             } else {
                 children.push({
                     item: null,
                     itemId: componentId,
                     quantity: componentQty,
                     children: []
                 });
             }
         });
     }

     return {
         item,
         itemId: item.id,
         quantity: qty,
         children
     };
  };

  // Generate roots from loadout
  const craftingRoots = useMemo(() => {
    const roots: CraftingNode[] = [];
    
    // Helper to add to roots
    const add = (loadoutItem: any) => {
        if (!loadoutItem) return;
        roots.push(buildCraftingTree(loadoutItem.item, loadoutItem.quantity || 1));
    };

    add(loadout.weapon1);
    loadout.weapon1Mods.forEach(add);
    add(loadout.weapon2);
    loadout.weapon2Mods.forEach(add);
    add(loadout.shield);
    add(loadout.augment);
    loadout.backpack.forEach(add);

    return roots;
  }, [loadout, itemMap]);

  // Flatten for Primitive Shopping List
  const primitiveRequirements = useMemo(() => {
     const totals = new Map<string, { item: Item | null, count: number }>();

     const traverse = (node: CraftingNode, multiplier: number) => {
         const currentTotal = node.quantity * multiplier;
         
         if (node.children.length === 0) {
             // It's a primitive (leaf)
             const existing = totals.get(node.itemId);
             if (existing) {
                 existing.count += currentTotal;
             } else {
                 totals.set(node.itemId, { item: node.item, count: currentTotal });
             }
         } else {
             // It has recipe or upgrade cost, dive deeper
             node.children.forEach(child => traverse(child, currentTotal));
         }
     };

     craftingRoots.forEach(root => {
         traverse(root, 1);
     });

     return Array.from(totals.values()).sort((a, b) => b.count - a.count);
  }, [craftingRoots]);

  // --- SOURCING LOGIC ---
  const sourcingOptions = useMemo(() => {
      // Map of MaterialID -> List of Items that recycle into it
      const sources = new Map<string, Item[]>();

      // Initialize map with needed primitives
      primitiveRequirements.forEach(req => {
          sources.set(req.item?.id || req.itemId, []);
      });

      // Scan all items to see if they recycle into what we need
      allItems.forEach(item => {
          // Filter: Must be of type 'Recyclable' AND have recycle data
          if (item.type === 'Recyclable' && item.recyclesInto) {
              Object.keys(item.recyclesInto).forEach(yieldId => {
                  if (sources.has(yieldId)) {
                      sources.get(yieldId)?.push(item);
                  }
              });
          }
      });

      return sources;
  }, [primitiveRequirements, allItems]);


  return (
    <div className="h-full flex flex-col p-6 bg-arc-bg overflow-hidden">
        <div className="w-full h-full grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: KPIs + Crafting Tree (Span 1) */}
            <div className="xl:col-span-1 flex flex-col gap-4 h-full min-h-0">
                
                {/* Compact KPIs */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                    <div className="bg-arc-panel border border-arc-border p-3 rounded-lg flex flex-col justify-between group hover:border-arc-accent transition-colors">
                        <div className="flex items-center gap-2 text-arc-muted mb-1">
                             <div className="p-1 bg-arc-accent/10 rounded-full">
                                <DollarSign size={14} className="text-arc-accent" />
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-wider">Total Cost</span>
                        </div>
                        <div className="text-xl font-display font-bold text-white text-right">${totalValue.toLocaleString()}</div>
                    </div>

                    <div className="bg-arc-panel border border-arc-border p-3 rounded-lg flex flex-col justify-between group hover:border-blue-500 transition-colors">
                        <div className="flex items-center gap-2 text-arc-muted mb-1">
                             <div className="p-1 bg-blue-500/10 rounded-full">
                                <Weight size={14} className="text-blue-500" />
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-wider">Weight</span>
                        </div>
                        <div className="text-xl font-display font-bold text-white text-right">{totalWeight.toFixed(1)}<span className="text-xs text-gray-500 ml-1">kg</span></div>
                    </div>
                </div>

                {/* Blueprint Breakdown (Tree) */}
                <div className="bg-arc-panel border border-arc-border rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="p-3 border-b border-arc-border bg-white/5 flex items-center gap-2 flex-shrink-0">
                            <Layers size={16} className="text-arc-accent" />
                            <h3 className="font-display font-bold text-white tracking-wide text-sm">BLUEPRINT TREE</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {craftingRoots.length > 0 ? (
                            craftingRoots.map((node, idx) => (
                                <CraftingTreeNode key={`${node.itemId}-${idx}`} node={node} parentQuantity={1} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-arc-muted text-center p-4">
                                <Layers size={32} className="opacity-20 mb-2" />
                                <span className="text-xs">Loadout is empty.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Materials + Sources (Span 2) */}
            <div className="xl:col-span-2 flex flex-col gap-4 h-full min-h-0">
                
                {/* Material Requirements - Restricted Height */}
                <div className="bg-arc-panel border border-arc-border rounded-lg flex flex-col max-h-[35%] flex-shrink-0 overflow-hidden">
                    <div className="p-3 border-b border-arc-border bg-white/5 flex items-center gap-2 flex-shrink-0">
                        <Hammer size={16} className="text-arc-accent" />
                        <h3 className="font-display font-bold text-white tracking-wide text-sm">RAW MATERIALS REQUIRED</h3>
                        <span className="ml-auto text-xs text-arc-muted font-mono bg-black/40 px-2 py-0.5 rounded">
                            {primitiveRequirements.length} Unique Types
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                        {primitiveRequirements.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {primitiveRequirements.map((req) => (
                                    <div key={req.item?.id || Math.random()} className="bg-black/40 border border-arc-border rounded p-2 flex items-center gap-3 group hover:bg-white/5 transition-colors">
                                        <div className="w-8 h-8 bg-arc-bg rounded border border-arc-border flex items-center justify-center flex-shrink-0">
                                            {req.item ? (
                                                <img src={req.item.imageFilename} className="w-full h-full object-contain p-0.5" alt="" />
                                            ) : (
                                                <Box size={14} className="text-gray-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-gray-200 truncate group-hover:text-white">
                                                {req.item?.name?.en || req.itemId}
                                            </div>
                                            <div className="text-[10px] text-arc-muted truncate">
                                                ID: {req.itemId}
                                            </div>
                                        </div>
                                        <div className="text-lg font-display font-bold text-arc-accent pl-2">
                                            {req.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-arc-muted">
                                <span className="text-xs">No raw materials required.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sourcing Guide - Fills remaining space */}
                <div className="bg-arc-panel border border-arc-border rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="p-3 border-b border-arc-border bg-white/5 flex items-center gap-2 flex-shrink-0">
                        <Search size={16} className="text-arc-accent" />
                        <h3 className="font-display font-bold text-white tracking-wide text-sm">LOOT SOURCES (SHOPPING LIST)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                            {primitiveRequirements.length > 0 ? (
                                <div className="space-y-4">
                                    {primitiveRequirements.map(req => {
                                        const sources = sourcingOptions.get(req.item?.id || req.itemId) || [];
                                        
                                        // If no recyclable items found, show message or skip? 
                                        // Showing message helps user know nothing matches the 'Recyclable' filter.
                                        if (sources.length === 0) {
                                             // Only render if needed, or skip to avoid clutter
                                             return null;
                                        }

                                        return (
                                        <div key={req.itemId} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="text-xs text-arc-muted uppercase tracking-wider flex items-center gap-1">
                                                    To get <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded ml-1">{req.item?.name?.en || req.itemId}</span>
                                                </div>
                                                <div className="h-px bg-white/5 flex-1"></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                                {sources.map(source => (
                                                    <div key={source.id} className="flex items-center gap-2 bg-black/40 hover:bg-white/5 border border-arc-border hover:border-arc-muted rounded p-2 transition-all">
                                                            <div className="w-8 h-8 rounded bg-gray-900 border border-white/5 flex-shrink-0 overflow-hidden">
                                                                <img src={source.imageFilename} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-xs text-gray-200 truncate font-medium">{source.name.en}</div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {source.recyclesInto && (
                                                                        <span className="text-[10px] font-mono text-arc-accent bg-arc-accent/10 px-1 rounded flex items-center">
                                                                            +{source.recyclesInto[req.itemId]} <Hammer size={8} className="ml-1" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            ) : (
                            <div className="flex flex-col items-center justify-center h-full text-arc-muted">
                                <span className="text-xs">Add items to view potential loot sources.</span>
                            </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
