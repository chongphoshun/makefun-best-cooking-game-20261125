// Dapur Nusantara — every tuning number, colour and layout rect in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const DAY_SECONDS = 150;
export const ORDERS_PER_DAY = 10;
export const SPAWN_INTERVAL = 15;
export const PATIENCE_BASE = 75;
export const BURN_AFTER = 8; // seconds a finished dish sits on its station before it burns
export const TIP_BONUS = 5; // extra coins when the order still has > half its patience
export const COMBO_STEP = 0.1; // +10% dish price per combo step, capped at +50%

export const PALETTE = {
  backdrop: '#241610',
  wall: '#ffe9b8',
  wallStripe: '#ffd98f',
  floor: '#c98f5a',
  floorDark: '#b57a45',
  hud: '#3b2314',
  hudText: '#ffe9b8',
  panel: '#fff6e0',
  panelEdge: '#8a5a2b',
  text: '#2b1a0e',
  muted: '#7a5a3a',
  board: '#5b3a1e',
  ticket: '#fffdf5',
  ticketEdge: '#d8c49a',
  wok: '#e8641c',
  grill: '#b3372e',
  pot: '#2e6fb3',
  boardWood: '#d9a05b',
  plate: '#ffffff',
  serve: '#2e9e4f',
  serveGlow: '#37c25f',
  trash: '#8a2f2f',
  gold: '#f2c94c',
  danger: '#d92b1f',
  ok: '#2e9e4f',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Ingredients. prep: 'chop' (2 clicks on the board), 'wok' | 'grill' | 'pot'
// (timed on that station), 'raw' (straight onto the plate). key: keyboard select.
export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', short: 'Rice', color: '#f5f0e0', prep: 'pot', cook: 5.0, key: '1' },
  { id: 'noodle', name: 'Noodle', short: 'Noodle', color: '#f2c94c', prep: 'pot', cook: 4.0, key: '2' },
  { id: 'chicken', name: 'Chicken', short: 'Chicken', color: '#f2a594', prep: 'grill', cook: 5.0, key: '3' },
  { id: 'egg', name: 'Egg', short: 'Egg', color: '#fff3c4', prep: 'wok', cook: 3.5, key: '4' },
  { id: 'chilli', name: 'Chilli', short: 'Chilli', color: '#d92b1f', prep: 'chop', cook: 0, key: '5' },
  { id: 'garlic', name: 'Garlic', short: 'Garlic', color: '#ffffff', prep: 'chop', cook: 0, key: '6' },
  { id: 'tofu', name: 'Tofu', short: 'Tofu', color: '#fdf6e3', prep: 'wok', cook: 3.5, key: '7' },
  { id: 'beef', name: 'Beef', short: 'Beef', color: '#8a4a2b', prep: 'grill', cook: 5.0, key: '8' },
  { id: 'shrimp', name: 'Shrimp', short: 'Shrimp', color: '#ff8a5c', prep: 'wok', cook: 4.0, key: '9' },
  { id: 'greens', name: 'Greens', short: 'Greens', color: '#3fae5a', prep: 'chop', cook: 0, key: '0' },
  { id: 'sauce', name: 'Sauce', short: 'Sauce', color: '#a83226', prep: 'raw', cook: 0, key: 'Q' },
  { id: 'tea', name: 'Tea', short: 'Tea', color: '#c47f2e', prep: 'pot', cook: 3.0, key: 'W' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
export const STATION_TYPES = ['wok', 'grill', 'pot'];

export const UPGRADES = [
  { id: 'wok', name: 'Faster Wok', desc: 'Wok cooks 30% faster', cost: 60 },
  { id: 'patience', name: 'Extra Patience', desc: 'Customers wait +15s', cost: 50 },
  { id: 'slot', name: '+1 Order Slot', desc: 'Order board holds 5 tickets', cost: 80 },
];

// One-screen layout. Every panel the screenshots must show has a rect here, shared
// by the renderer and by click hit-testing, so what you see is what you click.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 54 },
  board: { x: 8, y: 62, w: 244, h: 300 },
  stations: {
    wok: { x: 260, y: 62, w: 236, h: 170 },
    grill: { x: 504, y: 62, w: 236, h: 170 },
    pot: { x: 748, y: 62, w: 236, h: 170 },
    board: { x: 992, y: 62, w: 280, h: 170 },
  },
  binsLabel: { x: 260, y: 238, w: 1012, h: 18 },
  // 12 ingredient bins: 2 rows of 6, x 260..1272.
  bins: INGREDIENTS.map((ing, i) => ({
    id: ing.id,
    x: 260 + (i % 6) * 170,
    y: 260 + Math.floor(i / 6) * 52,
    w: 166,
    h: 48,
  })),
  plate: { x: 8, y: 366, w: 560, h: 346 },
  plateCircle: { x: 170, y: 542, r: 94 },
  serveBtn: { x: 430, y: 648, w: 122, h: 56 },
  trashBtn: { x: 300, y: 648, w: 122, h: 56 },
  hatch: { x: 576, y: 366, w: 300, h: 346 },
  hatchCircle: { x: 726, y: 540, r: 90 },
  book: { x: 884, y: 366, w: 388, h: 346 },
};

export function starsFor(served, spawned) {
  if (spawned === 0) return 0;
  const ratio = served / spawned;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}
