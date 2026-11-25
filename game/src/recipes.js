// The 12 recipes of Dapur Nusantara, in 3 groups of 4. Every recipe is 4 ingredients
// in a fixed assembly order; each ingredient's prep comes from config.js
// (chop on the board, cook on its station, or raw straight onto the plate).
// unlockDay gates the recipe into the campaign: Day 1 starts with 4, Day 5 has all 12.
export const RECIPES = [
  // Warung
  { id: 'nasi-goreng', group: 'Warung', name: 'Nasi Goreng', ingredients: ['rice', 'egg', 'chilli', 'garlic'], price: 28, unlockDay: 1 },
  { id: 'ayam-geprek', group: 'Warung', name: 'Ayam Geprek', ingredients: ['rice', 'chicken', 'chilli', 'greens'], price: 30, unlockDay: 2 },
  { id: 'gado-gado', group: 'Warung', name: 'Gado-Gado', ingredients: ['tofu', 'egg', 'greens', 'sauce'], price: 26, unlockDay: 3 },
  { id: 'soto-ayam', group: 'Warung', name: 'Soto Ayam', ingredients: ['chicken', 'noodle', 'egg', 'garlic'], price: 32, unlockDay: 4 },
  // Noodle Bar
  { id: 'mie-goreng', group: 'Noodle Bar', name: 'Mie Goreng', ingredients: ['noodle', 'egg', 'chilli', 'garlic'], price: 26, unlockDay: 1 },
  { id: 'mie-ayam', group: 'Noodle Bar', name: 'Mie Ayam', ingredients: ['noodle', 'chicken', 'greens', 'sauce'], price: 30, unlockDay: 2 },
  { id: 'laksa', group: 'Noodle Bar', name: 'Laksa', ingredients: ['noodle', 'shrimp', 'tofu', 'chilli'], price: 34, unlockDay: 3 },
  { id: 'bakso', group: 'Noodle Bar', name: 'Bakso', ingredients: ['beef', 'noodle', 'garlic', 'greens'], price: 32, unlockDay: 4 },
  // Grill & Steam
  { id: 'sate-ayam', group: 'Grill & Steam', name: 'Sate Ayam', ingredients: ['chicken', 'sauce', 'garlic', 'chilli'], price: 30, unlockDay: 1 },
  { id: 'rendang', group: 'Grill & Steam', name: 'Beef Rendang', ingredients: ['beef', 'rice', 'garlic', 'chilli'], price: 36, unlockDay: 2 },
  { id: 'udang-bakar', group: 'Grill & Steam', name: 'Udang Bakar', ingredients: ['shrimp', 'rice', 'sauce', 'garlic'], price: 34, unlockDay: 5 },
  { id: 'paket-warung', group: 'Grill & Steam', name: 'Paket Warung', ingredients: ['rice', 'chicken', 'tea', 'sauce'], price: 28, unlockDay: 1 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function unlockedRecipes(day) {
  return RECIPES.filter((r) => r.unlockDay <= day);
}
