
export interface LocalizedString {
  en: string;
  [key: string]: string;
}

export interface ItemEffect {
  value: string | number;
  [key: string]: any;
}

export interface ItemEffects {
  [key: string]: ItemEffect;
}

export interface ItemRecipe {
  [componentId: string]: number;
}

export interface Item {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  type: string;
  rarity: string;
  weightKg: number;
  value: number;
  imageFilename: string;
  updatedAt: string;
  recipe?: ItemRecipe;
  upgradeCost?: ItemRecipe; // Cost to upgrade from previous tier
  recyclesInto?: ItemRecipe; // What you get when you recycle this item
  salvagesInto?: ItemRecipe;
  isWeapon?: boolean;
  effects?: ItemEffects;
  craftBench?: string;
  slot?: string; // Inferred property
}

export enum LoadoutSlotType {
  WEAPON_1 = 'Weapon 1',
  WEAPON_2 = 'Weapon 2',
  SHIELD = 'Shield',
  AUGMENT = 'Augment',
  BACKPACK = 'Backpack',
  WEAPON_MOD = 'Modification'
}

export interface LoadoutItem {
  instanceId: string;
  item: Item;
  quantity: number;
}

export interface LoadoutState {
  weapon1: LoadoutItem | null;
  weapon1Mods: (LoadoutItem | null)[]; // Fixed array of 4 slots
  weapon2: LoadoutItem | null;
  weapon2Mods: (LoadoutItem | null)[]; // Fixed array of 4 slots
  shield: LoadoutItem | null;
  augment: LoadoutItem | null;
  backpack: LoadoutItem[];
}
