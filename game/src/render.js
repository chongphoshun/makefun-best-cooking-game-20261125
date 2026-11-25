// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred. Flat colours, drawn shapes and
// canvas text — no images, no emoji, no network. Every mandatory element (kitchen,
// order board, ingredients, mid-assembly dish, timer, ready plate) is on screen in
// every play frame, so any screenshot of it shows the whole game at a glance.
import { BURN_AFTER, FIELD, FONT, INGREDIENTS, ING_BY_ID, LAYOUT, PALETTE, UPGRADES } from './config.js';
import { RECIPE_BY_ID, RECIPES } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAYOVER = 'dayover';
export const SCREEN_CAMPAIGN = 'campaign';

const STAR = '\u2605';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, bold) {
    const key = `${size}${bold ? 'b' : ''}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function rr(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function panel(x, y, w, h, fill, edge) {
    context.fillStyle = fill;
    rr(x, y, w, h, 10);
    context.fill();
    if (edge) {
      context.strokeStyle = edge;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  // --- drawn ingredient icons (flat shapes, no emoji) ---
  function icon(id, cx, cy, s) {
    const c = context;
    c.save();
    c.translate(cx, cy);
    const u = s / 2;
    c.lineWidth = Math.max(1.5, s * 0.07);
    if (id === 'rice') {
      c.fillStyle = '#f5f0e0'; c.beginPath(); c.arc(0, -u * 0.1, u * 0.75, Math.PI, 0); c.fill();
      c.strokeStyle = '#8a5a2b'; c.beginPath(); c.arc(0, -u * 0.1, u * 0.75, 0, Math.PI); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -u * 0.35, u * 0.55, Math.PI, 0); c.fill();
    } else if (id === 'noodle') {
      c.strokeStyle = '#e8a91c'; c.lineWidth = s * 0.12; c.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        c.beginPath();
        c.moveTo(-u * 0.8, i * u * 0.45);
        c.bezierCurveTo(-u * 0.3, i * u * 0.45 - u * 0.4, u * 0.3, i * u * 0.45 + u * 0.4, u * 0.8, i * u * 0.45);
        c.stroke();
      }
    } else if (id === 'chicken') {
      c.fillStyle = '#f2a594'; c.beginPath(); c.arc(-u * 0.15, -u * 0.1, u * 0.62, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = s * 0.14; c.beginPath(); c.moveTo(u * 0.3, u * 0.35); c.lineTo(u * 0.8, u * 0.8); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(u * 0.85, u * 0.85, u * 0.18, 0, Math.PI * 2); c.fill();
    } else if (id === 'egg') {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, u * 0.8, u * 0.65, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f2a91c'; c.beginPath(); c.arc(0, 0, u * 0.38, 0, Math.PI * 2); c.fill();
    } else if (id === 'chilli') {
      c.strokeStyle = '#d92b1f'; c.lineWidth = s * 0.22; c.lineCap = 'round';
      c.beginPath(); c.arc(0, -u * 0.1, u * 0.6, Math.PI * 0.15, Math.PI * 1.1); c.stroke();
      c.strokeStyle = '#3fae5a'; c.lineWidth = s * 0.1;
      c.beginPath(); c.moveTo(-u * 0.55, -u * 0.55); c.lineTo(-u * 0.85, -u * 0.9); c.stroke();
    } else if (id === 'garlic') {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, u * 0.15, u * 0.62, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#b09a6a'; c.lineWidth = s * 0.07; c.stroke();
      c.beginPath(); c.moveTo(-u * 0.45, -u * 0.1); c.quadraticCurveTo(0, -u * 1.05, u * 0.45, -u * 0.1); c.fill();
      c.strokeStyle = '#c9b896'; c.lineWidth = s * 0.06;
      c.beginPath(); c.moveTo(0, -u * 0.7); c.lineTo(0, u * 0.6); c.stroke();
    } else if (id === 'tofu') {
      c.fillStyle = '#fdf6e3'; rr(-u * 0.7, -u * 0.7, u * 1.4, u * 1.4, u * 0.2); c.fill();
      c.strokeStyle = '#c9b896'; c.lineWidth = s * 0.06; c.stroke();
      c.beginPath(); c.moveTo(-u * 0.35, 0); c.lineTo(u * 0.35, 0); c.stroke();
    } else if (id === 'beef') {
      c.fillStyle = '#8a4a2b'; rr(-u * 0.85, -u * 0.55, u * 1.7, u * 1.1, u * 0.5); c.fill();
      c.strokeStyle = '#d9a05b'; c.lineWidth = s * 0.08;
      c.beginPath(); c.moveTo(-u * 0.5, -u * 0.1); c.lineTo(u * 0.4, u * 0.15); c.stroke();
    } else if (id === 'shrimp') {
      c.strokeStyle = '#ff8a5c'; c.lineWidth = s * 0.26; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, u * 0.55, Math.PI * 0.1, Math.PI * 1.5); c.stroke();
      c.fillStyle = '#ff8a5c';
      c.beginPath(); c.moveTo(u * 0.55, -u * 0.35); c.lineTo(u * 0.95, -u * 0.55); c.lineTo(u * 0.8, -u * 0.1); c.closePath(); c.fill();
    } else if (id === 'greens') {
      c.fillStyle = '#3fae5a';
      for (let i = -1; i <= 1; i += 1) {
        c.beginPath(); c.ellipse(i * u * 0.45, -i * u * 0.15, u * 0.32, u * 0.55, i * 0.5, 0, Math.PI * 2); c.fill();
      }
    } else if (id === 'sauce') {
      c.fillStyle = '#a83226'; rr(-u * 0.4, -u * 0.3, u * 0.8, u * 1.1, u * 0.15); c.fill();
      c.fillRect(-u * 0.18, -u * 0.85, u * 0.36, u * 0.6);
      c.fillStyle = '#f2c94c'; c.fillRect(-u * 0.4, u * 0.05, u * 0.8, u * 0.35);
    } else if (id === 'tea') {
      c.fillStyle = '#c47f2e';
      c.beginPath(); c.moveTo(-u * 0.7, -u * 0.5); c.lineTo(u * 0.7, -u * 0.5); c.lineTo(u * 0.45, u * 0.8); c.lineTo(-u * 0.45, u * 0.8); c.closePath(); c.fill();
      c.strokeStyle = '#c47f2e'; c.lineWidth = s * 0.1;
      c.beginPath(); c.arc(u * 0.75, u * 0.1, u * 0.35, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.strokeStyle = '#8a5a2b'; c.lineWidth = s * 0.06;
      c.beginPath(); c.moveTo(-u * 0.55, -u * 0.15); c.lineTo(u * 0.55, -u * 0.15); c.stroke();
    }
    c.restore();
  }

  function progressRing(cx, cy, r, frac, color) {
    const c = context;
    c.strokeStyle = 'rgba(43,26,14,0.25)';
    c.lineWidth = 7;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = color;
    c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); c.stroke();
  }

  function drawHud(state) {
    const h = LAYOUT.hud;
    context.fillStyle = PALETTE.hud;
    context.fillRect(h.x, h.y, h.w, h.h);
    text(`DAY ${state.day}/5`, 16, 36, 24, PALETTE.hudText, 'left', true);
    text(fmtTime(state.timeLeft), 640, 40, 34, state.timeLeft <= 30 ? '#ff9a8a' : PALETTE.hudText, 'center', true);
    text('TIME', 640, 16, 11, '#c9a06a', 'center', true);
    // coins
    context.fillStyle = PALETTE.gold;
    context.beginPath(); context.arc(820, 27, 11, 0, Math.PI * 2); context.fill();
    text('$', 820, 31, 14, PALETTE.text, 'center', true);
    text(`${state.coins}`, 838, 35, 22, PALETTE.hudText, 'left', true);
    text(`SERVED ${state.served}/${state.spawned}`, 960, 35, 20, PALETTE.hudText, 'left', true);
    const comboColor = state.combo >= 3 ? '#ff9a5c' : PALETTE.hudText;
    text(`COMBO x${state.combo}`, 1120, 35, 20, comboColor, 'left', true);
  }

  function drawBoard(state) {
    const b = LAYOUT.board;
    panel(b.x, b.y, b.w, b.h, PALETTE.board, PALETTE.panelEdge);
    text('ORDER BOARD', b.x + 12, b.y + 24, 16, '#ffe9b8', 'left', true);
    text(`${state.orders.length} waiting`, b.x + b.w - 12, b.y + 24, 13, '#d8c49a', 'right');
    let y = b.y + 36;
    for (let i = 0; i < 4; i += 1) {
      const order = state.orders[i];
      const ty = y + i * 60;
      if (!order) {
        context.fillStyle = 'rgba(255,246,224,0.12)';
        rr(b.x + 10, ty, b.w - 20, 52, 8); context.fill();
        text('— no order —', b.x + b.w / 2, ty + 33, 14, '#c9a06a', 'center');
        continue;
      }
      const recipe = RECIPE_BY_ID[order.recipeId];
      const targeted = state.plate.orderId === order.id;
      context.fillStyle = PALETTE.ticket;
      rr(b.x + 10, ty, b.w - 20, 52, 8); context.fill();
      if (targeted) {
        context.strokeStyle = PALETTE.gold; context.lineWidth = 3; context.stroke();
      }
      text(recipe.name, b.x + 20, ty + 19, 15, PALETTE.text, 'left', true);
      text(`$${order.price}`, b.x + b.w - 20, ty + 19, 15, PALETTE.text, 'right', true);
      recipe.ingredients.forEach((ingId, k) => {
        context.fillStyle = ING_BY_ID[ingId].color;
        context.beginPath(); context.arc(b.x + 28 + k * 20, ty + 37, 7, 0, Math.PI * 2); context.fill();
        context.strokeStyle = 'rgba(43,26,14,0.4)'; context.lineWidth = 1; context.stroke();
      });
      const frac = Math.max(0, order.patience / order.patienceMax);
      context.fillStyle = '#e5d9bd';
      rr(b.x + 108, ty + 30, 108, 12, 6); context.fill();
      context.fillStyle = frac > 0.5 ? PALETTE.ok : frac > 0.25 ? '#e8a91c' : PALETTE.danger;
      rr(b.x + 108, ty + 30, 108 * frac, 12, 6); context.fill();
      if (targeted) text('COOKING', b.x + b.w - 20, ty + 44, 10, '#b37a00', 'right', true);
    }
    if (state.orders.length > 4) text(`+${state.orders.length - 4} more order`, b.x + b.w / 2, b.y + b.h - 8, 12, '#d8c49a', 'center');
  }

  function drawStation(state, index, rect, label, color) {
    const station = state.stations[index];
    panel(rect.x, rect.y, rect.w, rect.h, PALETTE.panel, PALETTE.panelEdge);
    context.fillStyle = color;
    rr(rect.x, rect.y, rect.w, 30, 10); context.fill();
    context.fillRect(rect.x, rect.y + 20, rect.w, 10);
    text(label, rect.x + rect.w / 2, rect.y + 21, 15, '#fff', 'center', true);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + 105;
    const item = station.item;
    // vessel
    context.fillStyle = '#3a3a3a';
    if (label === 'WOK') {
      context.beginPath(); context.arc(cx, cy - 10, 52, 0, Math.PI); context.fill();
      context.fillStyle = '#ff8a3c';
      context.beginPath(); context.moveTo(cx - 34, cy + 42); context.lineTo(cx - 14, cy + 18); context.lineTo(cx + 6, cy + 42); context.closePath(); context.fill();
      context.beginPath(); context.moveTo(cx + 2, cy + 42); context.lineTo(cx + 22, cy + 18); context.lineTo(cx + 40, cy + 42); context.closePath(); context.fill();
    } else if (label === 'GRILL') {
      context.fillRect(cx - 56, cy - 22, 112, 46);
      context.strokeStyle = '#8a8a8a'; context.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        context.beginPath(); context.moveTo(cx - 56, cy - 10 + i * 10); context.lineTo(cx + 56, cy - 10 + i * 10); context.stroke();
      }
    } else {
      context.fillStyle = '#5a6a7a';
      rr(cx - 52, cy - 30, 104, 56, 8); context.fill();
      context.fillStyle = '#7a8a9a'; context.fillRect(cx - 58, cy - 38, 116, 10);
      context.fillStyle = 'rgba(255,255,255,0.5)';
      context.beginPath(); context.arc(cx - 18, cy - 52, 5, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.arc(cx + 8, cy - 60, 7, 0, Math.PI * 2); context.fill();
    }
    if (item) {
      icon(item.ing, cx, cy - 8, 44);
      if (item.progress < 1) {
        progressRing(cx, cy - 8, 40, item.progress, color);
        text(`${Math.round(item.progress * 100)}%`, cx, cy + 58, 15, PALETTE.text, 'center', true);
      } else if (item.burnt) {
        text('BURNT! Trash it (T)', cx, cy + 58, 15, PALETTE.danger, 'center', true);
      } else if (item.over > 4) {
        progressRing(cx, cy - 8, 40, 1, PALETTE.danger);
        text(`BURNING! ${Math.ceil(BURN_AFTER - item.over)}s — take it!`, cx, cy + 58, 14, PALETTE.danger, 'center', true);
      } else {
        progressRing(cx, cy - 8, 40, 1, PALETTE.ok);
        text('READY — click to take', cx, cy + 58, 14, PALETTE.ok, 'center', true);
      }
    } else {
      text('empty — click an ingredient', cx, cy + 58, 13, PALETTE.muted, 'center');
    }
  }

  function drawChoppingBoard(state, rect) {
    panel(rect.x, rect.y, rect.w, rect.h, PALETTE.panel, PALETTE.panelEdge);
    context.fillStyle = PALETTE.boardWood;
    rr(rect.x, rect.y, rect.w, 30, 10); context.fill();
    context.fillRect(rect.x, rect.y + 20, rect.w, 10);
    text('CHOPPING BOARD', rect.x + rect.w / 2, rect.y + 21, 15, '#fff', 'center', true);
    const cx = rect.x + 99;
    const cy = rect.y + 84;
    context.fillStyle = '#c98f5a';
    rr(rect.x + 24, rect.y + 48, 150, 72, 10); context.fill();
    context.strokeStyle = '#8a5a2b'; context.lineWidth = 2; context.stroke();
    const item = state.board.item;
    if (item) {
      icon(item.ing, cx, cy, 52);
      context.strokeStyle = '#2b1a0e'; context.lineWidth = 3;
      for (let k = 0; k < item.chops; k += 1) {
        context.beginPath(); context.moveTo(cx - 14 + k * 20, cy - 22); context.lineTo(cx - 2 + k * 20, cy + 22); context.stroke();
      }
      text(item.chops < 2 ? `chop ${item.chops}/2 — click the board` : 'chopped — click to take', rect.x + rect.w / 2, rect.y + 142, 13, PALETTE.text, 'center', true);
    } else {
      text('click a chilli / garlic / greens bin,', rect.x + rect.w / 2, rect.y + 140, 13, PALETTE.muted, 'center');
      text('then click here to chop it', rect.x + rect.w / 2, rect.y + 158, 13, PALETTE.muted, 'center');
    }
    // knife, top right
    context.fillStyle = '#c9c9c9';
    context.beginPath(); context.moveTo(rect.x + 212, rect.y + 56); context.lineTo(rect.x + 252, rect.y + 88); context.lineTo(rect.x + 242, rect.y + 98); context.lineTo(rect.x + 202, rect.y + 66); context.closePath(); context.fill();
    context.fillStyle = '#5b3a1e'; context.fillRect(rect.x + 238, rect.y + 92, 24, 9);
  }

  function drawBins(state) {
    const lab = LAYOUT.binsLabel;
    text('INGREDIENT COUNTER — click a bin, then a station, the board, or the plate  (keys 1-9, 0, Q, W)', lab.x, lab.y + 13, 13, PALETTE.text, 'left', true);
    LAYOUT.bins.forEach((bin, i) => {
      const ing = INGREDIENTS[i];
      const inHand = state.hand && state.hand.ing === ing.id;
      context.fillStyle = inHand ? '#ffe9a8' : PALETTE.panel;
      rr(bin.x, bin.y, bin.w, bin.h, 8); context.fill();
      context.strokeStyle = inHand ? PALETTE.gold : PALETTE.panelEdge;
      context.lineWidth = inHand ? 3 : 1.5; context.stroke();
      icon(ing.id, bin.x + 26, bin.y + 24, 30);
      text(ing.name, bin.x + 48, bin.y + 21, 14, PALETTE.text, 'left', true);
      const prepLabel = ing.prep === 'chop' ? 'chop' : ing.prep === 'raw' ? 'raw' : `${ing.prep} ${ing.cook}s`;
      text(prepLabel, bin.x + 48, bin.y + 39, 12, PALETTE.muted, 'left');
      text(ing.key, bin.x + bin.w - 10, bin.y + 21, 13, PALETTE.muted, 'right', true);
    });
  }

  function drawPlatePanel(state) {
    const p = LAYOUT.plate;
    panel(p.x, p.y, p.w, p.h, PALETTE.panel, PALETTE.panelEdge);
    const recipe = state.plate.recipeId ? RECIPE_BY_ID[state.plate.recipeId] : null;
    text('PLATE — ASSEMBLY', p.x + 14, p.y + 26, 16, PALETTE.text, 'left', true);
    text(recipe ? `building: ${recipe.name}` : 'pick an order ticket', p.x + 14, p.y + 48, 14, PALETTE.muted, 'left');
    const hand = state.hand
      ? `HAND: ${ING_BY_ID[state.hand.ing].name} (${state.hand.prep})`
      : 'HAND: empty';
    text(hand, p.x + 14, p.y + 70, 14, state.hand ? '#b37a00' : PALETTE.muted, 'left', true);
    // the plate itself
    const pc = LAYOUT.plateCircle;
    context.fillStyle = '#e8e0cc';
    context.beginPath(); context.arc(pc.x, pc.y, pc.r + 8, 0, Math.PI * 2); context.fill();
    context.fillStyle = PALETTE.plate;
    context.beginPath(); context.arc(pc.x, pc.y, pc.r, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#c9b896'; context.lineWidth = 2; context.stroke();
    if (recipe) {
      state.plate.filled.forEach((ingId, k) => {
        const angle = -Math.PI / 2 + (k * Math.PI * 2) / Math.max(4, recipe.ingredients.length);
        const ix = pc.x + Math.cos(angle) * 48;
        const iy = pc.y + Math.sin(angle) * 48;
        context.fillStyle = '#f3ead2';
        context.beginPath(); context.arc(ix, iy, 24, 0, Math.PI * 2); context.fill();
        icon(ingId, ix, iy, 40);
      });
      if (state.plate.filled.length === 0) text('empty plate', pc.x, pc.y + 6, 15, PALETTE.muted, 'center');
    } else {
      text('empty plate', pc.x, pc.y + 6, 15, PALETTE.muted, 'center');
    }
    // slots: what the recipe needs, in order
    if (recipe) {
      recipe.ingredients.forEach((ingId, k) => {
        const sy = p.y + 88 + k * 48;
        const done = k < state.plate.filled.length;
        const next = k === state.plate.filled.length;
        context.fillStyle = done ? '#dff2dd' : next ? '#fff3c4' : '#f3ead2';
        rr(300, sy, 246, 42, 8); context.fill();
        context.strokeStyle = done ? PALETTE.ok : next ? '#b37a00' : '#d8c49a';
        context.lineWidth = next ? 2.5 : 1.5; context.stroke();
        icon(ingId, 326, sy + 21, 30);
        text(`${k + 1}. ${ING_BY_ID[ingId].name}`, 348, sy + 19, 15, PALETTE.text, 'left', true);
        const prep = ING_BY_ID[ingId].prep === 'chop' ? 'chop it' : ING_BY_ID[ingId].prep === 'raw' ? 'raw' : `cook: ${ING_BY_ID[ingId].prep}`;
        text(prep, 348, sy + 36, 12, PALETTE.muted, 'left');
        text(done ? 'DONE' : next ? 'NEXT' : '', 536, sy + 27, 13, done ? PALETTE.ok : '#b37a00', 'right', true);
      });
    }
    // serve / trash buttons
    const sb = LAYOUT.serveBtn;
    const tb = LAYOUT.trashBtn;
    const ready = !!state.readyPlate;
    context.fillStyle = ready ? PALETTE.serveGlow : '#9aa58f';
    rr(sb.x, sb.y, sb.w, sb.h, 10); context.fill();
    if (ready) { context.strokeStyle = PALETTE.gold; context.lineWidth = 3; context.stroke(); }
    text('SERVE', sb.x + sb.w / 2, sb.y + 26, 20, '#fff', 'center', true);
    text('Space', sb.x + sb.w / 2, sb.y + 46, 12, '#e8ffe8', 'center');
    context.fillStyle = PALETTE.trash;
    rr(tb.x, tb.y, tb.w, tb.h, 10); context.fill();
    text('TRASH', tb.x + tb.w / 2, tb.y + 26, 18, '#fff', 'center', true);
    text('T', tb.x + tb.w / 2, tb.y + 46, 12, '#ffd9d9', 'center');
  }

  function drawHatch(state) {
    const h = LAYOUT.hatch;
    panel(h.x, h.y, h.w, h.h, PALETTE.panel, PALETTE.panelEdge);
    text('SERVE HATCH', h.x + 14, h.y + 26, 16, PALETTE.text, 'left', true);
    text('finished dish waits here', h.x + 14, h.y + 48, 13, PALETTE.muted, 'left');
    const hc = LAYOUT.hatchCircle;
    context.fillStyle = '#e8e0cc';
    context.beginPath(); context.arc(hc.x, hc.y, hc.r + 8, 0, Math.PI * 2); context.fill();
    context.fillStyle = PALETTE.plate;
    context.beginPath(); context.arc(hc.x, hc.y, hc.r, 0, Math.PI * 2); context.fill();
    context.strokeStyle = state.readyPlate ? PALETTE.serve : '#c9b896';
    context.lineWidth = state.readyPlate ? 4 : 2; context.stroke();
    if (state.readyPlate) {
      const recipe = RECIPE_BY_ID[state.readyPlate.recipeId];
      recipe.ingredients.forEach((ingId, k) => {
        const angle = -Math.PI / 2 + (k * Math.PI * 2) / recipe.ingredients.length;
        const ix = hc.x + Math.cos(angle) * 44;
        const iy = hc.y + Math.sin(angle) * 44;
        context.fillStyle = '#f3ead2';
        context.beginPath(); context.arc(ix, iy, 22, 0, Math.PI * 2); context.fill();
        icon(ingId, ix, iy, 36);
      });
      text(recipe.name, hc.x, hc.y + hc.r + 34, 17, PALETTE.text, 'center', true);
      text('READY! Click SERVE', hc.x, hc.y + hc.r + 56, 15, PALETTE.ok, 'center', true);
    } else {
      text('no dish ready', hc.x, hc.y + 6, 15, PALETTE.muted, 'center');
      text('finish a plate to', hc.x, hc.y + hc.r + 34, 14, PALETTE.muted, 'center');
      text('fill the hatch', hc.x, hc.y + hc.r + 54, 14, PALETTE.muted, 'center');
    }
  }

  function drawBook(state) {
    const b = LAYOUT.book;
    panel(b.x, b.y, b.w, b.h, PALETTE.panel, PALETTE.panelEdge);
    text('RECIPE BOOK — 12 RECIPES', b.x + 14, b.y + 26, 15, PALETTE.text, 'left', true);
    text('Day 1: 4 unlocked — more each day', b.x + 14, b.y + 46, 12, PALETTE.muted, 'left');
    let y = b.y + 52;
    for (const group of ['Warung', 'Noodle Bar', 'Grill & Steam']) {
      text(group.toUpperCase(), b.x + 14, y + 11, 12, '#b37a00', 'left', true);
      y += 15;
      for (const recipe of RECIPES.filter((r) => r.group === group)) {
        const unlocked = recipe.unlockDay <= state.day;
        text(unlocked ? recipe.name : `${recipe.name}  (Day ${recipe.unlockDay})`, b.x + 14, y + 12, 13, unlocked ? PALETTE.text : '#a89880', 'left', unlocked);
        recipe.ingredients.forEach((ingId, k) => {
          context.fillStyle = ING_BY_ID[ingId].color;
          context.beginPath(); context.arc(b.x + 238 + k * 16, y + 8, 5, 0, Math.PI * 2); context.fill();
          context.strokeStyle = 'rgba(43,26,14,0.4)'; context.lineWidth = 1; context.stroke();
        });
        text(`$${recipe.price}`, b.x + b.w - 14, y + 12, 13, unlocked ? PALETTE.text : '#a89880', 'right', true);
        y += 18;
      }
      y += 3;
    }
    text('Upgrades: Faster Wok $60 · Extra Patience $50 · +1 Order Slot $80', b.x + 14, b.y + b.h - 12, 12, PALETTE.muted, 'left');
  }

  function drawKitchen(state) {
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.wallStripe;
    context.fillRect(0, 54, FIELD.width, 8);
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 362, FIELD.width, 4);
    drawHud(state);
    drawBoard(state);
    const st = LAYOUT.stations;
    drawStation(state, 0, st.wok, 'WOK', PALETTE.wok);
    drawStation(state, 1, st.grill, 'GRILL', PALETTE.grill);
    drawStation(state, 2, st.pot, 'POT', PALETTE.pot);
    drawChoppingBoard(state, st.board);
    drawBins(state);
    drawPlatePanel(state);
    drawHatch(state);
    drawBook(state);
  }

  function overlayPanel(w, h, fill) {
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = 'rgba(20,10,5,0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(x, y, w, h, fill || 'rgba(255,246,224,0.97)', PALETTE.panelEdge);
    return { x, y, w, h };
  }

  function drawTitle(state, ui) {
    const p = overlayPanel(660, 480);
    text('DAPUR NUSANTARA', 640, p.y + 66, 44, PALETTE.text, 'center', true);
    text('12 recipes  ·  3 stations  ·  5-day campaign', 640, p.y + 100, 19, '#b37a00', 'center', true);
    const lines = [
      'Cook what the order board asks for, before patience runs out.',
      'Click an ingredient bin, chop it or cook it, build the plate in order,',
      'then SERVE from the hatch. Burnt food goes in the trash.',
      'Earn coins, buy upgrades between days, chase 3 stars on all 5 days.',
      '',
      'Mouse: click everything   ·   1-9, 0, Q, W: pick ingredient',
      'Space: serve   ·   T: trash   ·   P: pause   ·   Enter: start',
    ];
    lines.forEach((line, i) => text(line, 640, p.y + 140 + i * 26, 16, i < 4 ? PALETTE.text : PALETTE.muted, 'center'));
    text('Press Enter or click to start Day 1', 640, p.y + 140 + 7 * 26 + 18, 20, PALETTE.serve, 'center', true);
    if (ui.best > 0) text(`Best coins: ${ui.best}`, 640, p.y + 140 + 8 * 26 + 18, 15, PALETTE.muted, 'center');
  }

  function drawDayOver(state, ui) {
    const s = state.summary || ui.summary;
    const p = overlayPanel(720, 540);
    const campaign = state.campaignOver;
    text(campaign ? 'CAMPAIGN COMPLETE!' : `DAY ${s.day} COMPLETE!`, 640, p.y + 56, 38, PALETTE.text, 'center', true);
    const stars = STAR.repeat(s.stars) + '\u2606'.repeat(3 - s.stars);
    text(stars, 640, p.y + 108, 44, '#e8a91c', 'center');
    const rows = [
      `Orders served: ${s.served}/${s.spawned}`,
      `Accuracy: ${s.accuracy}%   ·   Best combo: x${s.bestCombo}`,
      `Coins earned today: +${s.coinsEarned}   ·   Total coins: $${state.coins}`,
      `Total stars: ${s.totalStars}/15`,
    ];
    rows.forEach((row, i) => text(row, 640, p.y + 148 + i * 28, 18, PALETTE.text, 'center'));
    text('UPGRADE SHOP — click a card to buy', 640, p.y + 278, 17, '#b37a00', 'center', true);
    UPGRADES.forEach((up, i) => {
      const x = p.x + 30 + i * 228;
      const y = p.y + 296;
      const owned = state.upgrades[up.id];
      const afford = state.coins >= up.cost;
      context.fillStyle = owned ? '#dff2dd' : afford ? '#fff3c4' : '#f3ead2';
      rr(x, y, 212, 96, 10); context.fill();
      context.strokeStyle = owned ? PALETTE.ok : PALETTE.panelEdge;
      context.lineWidth = owned ? 3 : 1.5; context.stroke();
      text(up.name, x + 106, y + 26, 16, PALETTE.text, 'center', true);
      text(up.desc, x + 106, y + 48, 13, PALETTE.muted, 'center');
      text(owned ? 'OWNED' : `$${up.cost}`, x + 106, y + 76, 16, owned ? PALETTE.ok : afford ? '#b37a00' : PALETTE.muted, 'center', true);
    });
    // store upgrade card rects for click handling (same geometry as drawn)
    ui.upgradeRects = UPGRADES.map((up, i) => ({ id: up.id, x: p.x + 30 + i * 228, y: p.y + 296, w: 212, h: 96 }));
    text(
      campaign ? 'Press Enter to play again' : `Press Enter for Day ${s.day + 1}  (upgrades carry over)`,
      640, p.y + 428, 19, PALETTE.serve, 'center', true,
    );
    text('Upgrades apply next day — Faster Wok, Extra Patience, +1 Order Slot', 640, p.y + 458, 14, PALETTE.muted, 'center');
  }

  function drawPaused() {
    const p = overlayPanel(520, 200);
    text('PAUSED', 640, p.y + 90, 40, PALETTE.text, 'center', true);
    text('Press P to resume', 640, p.y + 140, 18, PALETTE.muted, 'center');
  }

  function draw(state, screen, ui) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawKitchen(state);
    if (screen === SCREEN_TITLE) drawTitle(state, ui);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_DAYOVER || screen === SCREEN_CAMPAIGN) drawDayOver(state, ui);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.x / (window.devicePixelRatio || 1)) / (view.scale / (window.devicePixelRatio || 1)),
      y: (clientY - rect.top - view.y / (window.devicePixelRatio || 1)) / (view.scale / (window.devicePixelRatio || 1)),
    };
  } };
}
