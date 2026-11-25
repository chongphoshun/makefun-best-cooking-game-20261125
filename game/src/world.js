// The game's rules and state, with no drawing and no browser in it: orders and
// patience, the three cooking stations and the chopping board, the hand, the plate
// being assembled, the serve hatch, coins, combo, days and upgrades. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react
// (sounds, announcements) without the world knowing about screens or sound.
import {
  BURN_AFTER,
  COMBO_STEP,
  DAY_SECONDS,
  ING_BY_ID,
  ORDERS_PER_DAY,
  PATIENCE_BASE,
  SPAWN_INTERVAL,
  UPGRADES,
  starsFor,
} from './config.js';
import { RECIPE_BY_ID, unlockedRecipes } from './recipes.js';

export const EVENT_PICKUP = 1;
export const EVENT_CHOP = 2;
export const EVENT_COOK_START = 4;
export const EVENT_PLATE = 8;
export const EVENT_SERVE = 16;
export const EVENT_ERROR = 32;
export const EVENT_BURN = 64;
export const EVENT_EXPIRE = 128;
export const EVENT_DAYOVER = 256;
export const EVENT_READY = 512;

let nextOrderId = 1;

export function createWorld(random) {
  const state = {
    day: 1,
    elapsed: 0,
    timeLeft: DAY_SECONDS,
    coins: 0,
    dayCoins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    spawned: 0,
    missed: 0,
    correctAdds: 0,
    wrongAdds: 0,
    orders: [],
    stations: [
      { type: 'wok', item: null },
      { type: 'grill', item: null },
      { type: 'pot', item: null },
    ],
    board: { item: null },
    hand: null,
    plate: { orderId: null, recipeId: null, filled: [] },
    readyPlate: null,
    upgrades: { wok: false, patience: false, slot: false },
    dayOver: false,
    campaignOver: false,
    summary: null,
    spawnTimer: 0,
    totalStars: 0,
  };

  function patienceMax() {
    return PATIENCE_BASE + (state.upgrades.patience ? 15 : 0);
  }
  function maxOrders() {
    return state.upgrades.slot ? 5 : 4;
  }
  function cookTimeFor(ing) {
    let t = ing.cook;
    if (ing.prep === 'wok' && state.upgrades.wok) t *= 0.7;
    return t;
  }
  function targetPlate(order) {
    state.plate = { orderId: order.id, recipeId: order.recipeId, filled: [] };
  }

  function spawnOrder() {
    if (state.spawned >= ORDERS_PER_DAY) return;
    if (state.orders.length >= maxOrders()) return;
    const pool = unlockedRecipes(state.day);
    const recipe = pool[Math.floor(random() * pool.length)];
    const order = {
      id: nextOrderId,
      recipeId: recipe.id,
      patience: patienceMax(),
      patienceMax: patienceMax(),
      price: recipe.price,
    };
    nextOrderId += 1;
    state.orders.push(order);
    state.spawned += 1;
    if (!state.plate.orderId) targetPlate(order);
  }

  function reset() {
    state.day = 1;
    state.coins = 0;
    state.dayCoins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.spawned = 0;
    state.missed = 0;
    state.correctAdds = 0;
    state.wrongAdds = 0;
    state.totalStars = 0;
    state.upgrades = { wok: false, patience: false, slot: false };
    state.campaignOver = false;
    startDay(1);
  }

  function startDay(day) {
    state.day = day;
    state.elapsed = 0;
    state.timeLeft = DAY_SECONDS;
    state.dayCoins = 0;
    state.combo = 0;
    state.served = 0;
    state.spawned = 0;
    state.missed = 0;
    state.orders = [];
    state.stations.forEach((s) => { s.item = null; });
    state.board.item = null;
    state.hand = null;
    state.plate = { orderId: null, recipeId: null, filled: [] };
    state.readyPlate = null;
    state.dayOver = false;
    state.summary = null;
    state.spawnTimer = SPAWN_INTERVAL;
    spawnOrder();
  }

  function finishDay() {
    state.dayOver = true;
    const accuracy = state.correctAdds + state.wrongAdds === 0
      ? 100
      : Math.round((100 * state.correctAdds) / (state.correctAdds + state.wrongAdds));
    const stars = starsFor(state.served, state.spawned);
    state.totalStars += stars;
    state.summary = {
      day: state.day,
      served: state.served,
      spawned: state.spawned,
      missed: state.missed,
      accuracy,
      coinsEarned: state.dayCoins,
      bestCombo: state.bestCombo,
      stars,
      totalStars: state.totalStars,
    };
    if (state.day >= 5) state.campaignOver = true;
  }

  function step(dt) {
    let events = 0;
    if (state.dayOver) return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, DAY_SECONDS - state.elapsed);

    // New orders arrive on a timer until the day's quota is spawned.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer += SPAWN_INTERVAL;
    }

    // Patience drains; an expired order walks out and breaks the combo.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.missed += 1;
        state.combo = 0;
        events |= EVENT_EXPIRE;
        if (state.plate.orderId === order.id) state.plate = { orderId: null, recipeId: null, filled: [] };
        if (state.readyPlate && state.readyPlate.orderId === order.id) state.readyPlate = null;
        if (!state.plate.orderId && state.orders.length > 0) targetPlate(state.orders[0]);
      }
    }

    // Stations cook; a finished dish left sitting burns after BURN_AFTER seconds.
    for (const station of state.stations) {
      const item = station.item;
      if (!item) continue;
      if (item.progress < 1) {
        item.progress = Math.min(1, item.progress + dt / item.cookTime);
      } else if (!item.burnt) {
        item.over += dt;
        if (item.over >= BURN_AFTER) {
          item.burnt = true;
          events |= EVENT_BURN;
        }
      }
    }

    if (state.timeLeft <= 0) {
      finishDay();
      events |= EVENT_DAYOVER;
    }
    return events;
  }

  // --- player actions (each returns event flags) ---

  function selectIngredient(id) {
    if (state.hand) return EVENT_ERROR;
    if (!ING_BY_ID[id]) return EVENT_ERROR;
    state.hand = { ing: id, prep: 'raw' };
    return EVENT_PICKUP;
  }

  function clickBoard() {
    const board = state.board;
    if (state.hand && state.hand.prep === 'raw' && !board.item && ING_BY_ID[state.hand.ing].prep === 'chop') {
      board.item = { ing: state.hand.ing, chops: 0 };
      state.hand = null;
      return EVENT_PICKUP;
    }
    if (!state.hand && board.item) {
      if (board.item.chops < 2) {
        board.item.chops += 1;
        return EVENT_CHOP;
      }
      state.hand = { ing: board.item.ing, prep: 'chopped' };
      board.item = null;
      return EVENT_PICKUP;
    }
    return EVENT_ERROR;
  }

  function clickStation(index) {
    const station = state.stations[index];
    if (!station) return EVENT_ERROR;
    if (!station.item && state.hand && state.hand.prep === 'raw') {
      const ing = ING_BY_ID[state.hand.ing];
      if (ing.prep !== station.type) return EVENT_ERROR;
      station.item = { ing: ing.id, progress: 0, cookTime: cookTimeFor(ing), over: 0, burnt: false };
      state.hand = null;
      return EVENT_COOK_START;
    }
    if (station.item && station.item.progress >= 1 && !station.item.burnt && !state.hand) {
      state.hand = { ing: station.item.ing, prep: 'cooked' };
      station.item = null;
      return EVENT_PICKUP;
    }
    return EVENT_ERROR;
  }

  function clickPlate() {
    if (!state.hand || !state.plate.recipeId) return EVENT_ERROR;
    const recipe = RECIPE_BY_ID[state.plate.recipeId];
    const next = recipe.ingredients[state.plate.filled.length];
    if (!next) return EVENT_ERROR;
    const wantPrep = ING_BY_ID[next].prep === 'chop' ? 'chopped' : ING_BY_ID[next].prep === 'raw' ? 'raw' : 'cooked';
    if (state.hand.ing !== next || state.hand.prep !== wantPrep) {
      state.wrongAdds += 1;
      return EVENT_ERROR;
    }
    state.plate.filled.push(next);
    state.correctAdds += 1;
    state.hand = null;
    if (state.plate.filled.length === recipe.ingredients.length) {
      const doneOrderId = state.plate.orderId;
      state.readyPlate = { orderId: doneOrderId, recipeId: state.plate.recipeId };
      state.plate = { orderId: null, recipeId: null, filled: [] };
      // Target a *different* order next: the one on the hatch is already spoken for.
      const nextOrder = state.orders.find((o) => o.id !== doneOrderId);
      if (nextOrder) targetPlate(nextOrder);
      return EVENT_PLATE | EVENT_READY;
    }
    return EVENT_PLATE;
  }

  function serve() {
    if (!state.readyPlate) return EVENT_ERROR;
    const plate = state.readyPlate;
    state.readyPlate = null;
    const idx = state.orders.findIndex((o) => o.id === plate.orderId);
    if (idx === -1) {
      state.combo = 0;
      return EVENT_ERROR;
    }
    const order = state.orders[idx];
    state.orders.splice(idx, 1);
    const mult = 1 + Math.min(0.5, state.combo * COMBO_STEP);
    let earned = Math.round(order.price * mult);
    if (order.patience > order.patienceMax / 2) earned += 5;
    state.coins += earned;
    state.dayCoins += earned;
    state.combo += 1;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    state.served += 1;
    // The served order is gone: if the plate was still aimed at it, aim at the
    // next live order (or clear it when the board is empty).
    if (!state.orders.some((o) => o.id === state.plate.orderId)) {
      if (state.orders.length > 0) targetPlate(state.orders[0]);
      else state.plate = { orderId: null, recipeId: null, filled: [] };
    }
    return EVENT_SERVE;
  }

  function trash() {
    if (state.hand) {
      state.hand = null;
      return EVENT_PICKUP;
    }
    for (const station of state.stations) {
      if (station.item && station.item.burnt) {
        station.item = null;
        return EVENT_PICKUP;
      }
    }
    return EVENT_ERROR;
  }

  function selectOrder(index) {
    if (state.plate.filled.length > 0) return EVENT_ERROR;
    const order = state.orders[index];
    if (!order) return EVENT_ERROR;
    targetPlate(order);
    return EVENT_PICKUP;
  }

  function buyUpgrade(id) {
    const up = UPGRADES.find((u) => u.id === id);
    if (!up || state.upgrades[id] || state.coins < up.cost) return EVENT_ERROR;
    state.coins -= up.cost;
    state.upgrades[id] = true;
    return EVENT_PICKUP;
  }

  reset();
  return {
    state, reset, startDay, step,
    selectIngredient, clickBoard, clickStation, clickPlate, serve, trash, selectOrder, buyUpgrade,
    patienceMax, maxOrders,
  };
}
