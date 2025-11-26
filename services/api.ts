
import { Item } from '../types';

const REPO_OWNER = 'Android65';
const REPO_NAME = 'arcraiders-data';
const ITEMS_PATH = 'items';

// Fallback data in case of API rate limits or failures
const MOCK_ITEMS: Item[] = [
  {
    id: "anvil_i",
    name: { en: "Anvil I" },
    description: { en: "Single-action hand cannon with high damage." },
    type: "Hand Cannon",
    rarity: "Uncommon",
    weightKg: 5,
    value: 5000,
    imageFilename: "https://cdn.arctracker.io/items/anvil.png",
    updatedAt: "11/06/2025",
    isWeapon: true,
    effects: {
      "Magazine Size": { value: 6 }
    },
    recipe: {
        "mechanical_components": 5,
        "simple_gun_parts": 6
    },
    recyclesInto: {
        "mechanical_components": 2,
        "simple_gun_parts": 3
    }
  },
  {
    id: "anvil_ii",
    name: { en: "Anvil II" },
    description: { en: "Upgraded single-action hand cannon." },
    type: "Hand Cannon",
    rarity: "Rare",
    weightKg: 5,
    value: 7000,
    imageFilename: "https://cdn.arctracker.io/items/anvil.png",
    updatedAt: "11/06/2025",
    isWeapon: true,
    effects: {
      "Magazine Size": { value: 6 }
    },
    upgradeCost: {
        "mechanical_components": 3,
        "simple_gun_parts": 1
    },
    recyclesInto: {
        "mechanical_components": 4,
        "simple_gun_parts": 4
    }
  },
  {
    id: "medkit_standard",
    name: { en: "Standard Medkit" },
    description: { en: "Restores health over time." },
    type: "Consumable",
    rarity: "Common",
    weightKg: 1.5,
    value: 1200,
    imageFilename: "https://picsum.photos/200/200", 
    updatedAt: "11/06/2025",
    isWeapon: false
  },
  {
    id: "heavy_armor_plate",
    name: { en: "Heavy Armor Plate" },
    description: { en: "Increases defense significantly." },
    type: "Armor",
    rarity: "Rare",
    weightKg: 8,
    value: 8500,
    imageFilename: "https://picsum.photos/201/201",
    updatedAt: "11/06/2025",
    isWeapon: false
  },
  {
    id: "scanner_tool",
    name: { en: "Scanner Tool" },
    description: { en: "Reveals nearby enemies." },
    type: "Gadget",
    rarity: "Epic",
    weightKg: 2,
    value: 15000,
    imageFilename: "https://picsum.photos/202/202",
    updatedAt: "11/06/2025",
    isWeapon: false
  },
  // Added Item to demonstrate Sourcing View
  {
    id: "desktop_fan",
    name: { en: "Desktop Fan" },
    description: { en: "A common household item. Useful for parts." },
    type: "Recyclable",
    rarity: "Common",
    weightKg: 1,
    value: 50,
    imageFilename: "https://picsum.photos/203/203",
    updatedAt: "11/06/2025",
    isWeapon: false,
    recyclesInto: {
        "mechanical_components": 2
    }
  }
];

export const fetchItems = async (): Promise<Item[]> => {
  try {
    // 1. Get list of files in the items directory
    const dirResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${ITEMS_PATH}`);
    
    if (!dirResponse.ok) {
      console.warn('GitHub API limit reached or error. Using fallback data.');
      return MOCK_ITEMS;
    }

    const files = await dirResponse.json();
    
    // 2. Filter for JSON files
    const jsonFiles = files.filter((file: any) => file.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
        return MOCK_ITEMS;
    }

    // 3. Fetch content for all files
    // We process in batches to avoid overwhelming the browser's network connection limit or causing timeouts
    const BATCH_SIZE = 15; 
    const items: Item[] = [];

    for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
        const batch = jsonFiles.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (file: any) => {
            // Use raw.githubusercontent to avoid API rate limits for content
            const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${ITEMS_PATH}/${file.name}`;
            try {
                const res = await fetch(rawUrl);
                if (!res.ok) return null;
                return res.json();
            } catch (err) {
                console.error(`Failed to fetch item ${file.name}`, err);
                return null;
            }
        });

        const results = await Promise.all(batchPromises);
        
        // Filter out failures and add to list
        results.forEach((item) => {
            if (item) items.push(item as Item);
        });
    }
    
    return items;

  } catch (error) {
    console.error("Failed to fetch items:", error);
    return MOCK_ITEMS;
  }
};