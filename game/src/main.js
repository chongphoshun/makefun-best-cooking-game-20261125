// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between five screens:
// title, play, paused, day-complete (with the upgrade shop) and campaign-complete.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { LAYOUT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURN, EVENT_DAYOVER, EVENT_ERROR, EVENT_EXPIRE, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH, createInput, inRect } from './input.js';
import { SCREEN_CAMPAIGN, SCREEN_DAYOVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

// --- tiny WebAudio beeps, generated in code, no audio files ---
let audioCtx = null;
function beep(freq, dur, type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch {
    // Audio is decoration; a blocked context must never break the game.
  }
}
function soundFor(events) {
  if (events & EVENT_SERVE) { beep(660, 0.12, 'sine'); setTimeout(() => beep(880, 0.15, 'sine'), 90); }
  else if (events & EVENT_ERROR) beep(160, 0.15, 'square');
  else if (events & EVENT_BURN) beep(220, 0.3, 'sawtooth');
  else if (events & EVENT_EXPIRE) beep(300, 0.25, 'triangle');
  else if (events & EVENT_DAYOVER) { beep(523, 0.15, 'sine'); setTimeout(() => beep(784, 0.25, 'sine'), 140); }
  else if (events) beep(440, 0.06, 'sine');
}

function runShot(name) {
  const scene = stageShot(name, world);
  const ui = { best: scene.best || 0, summary: scene.summary || world.state.summary, upgradeRects: [] };
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toLogical);
  let screen = SCREEN_TITLE;
  let best = 0;
  try {
    best = Number.parseInt(window.localStorage.getItem('dapur-nusantara.best') ?? '0', 10) || 0;
  } catch { best = 0; }
  const ui = { best, summary: null, upgradeRects: [] };
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startDay() {
    world.startDay(world.state.dayOver ? world.state.day + 1 : 1);
    screen = SCREEN_PLAY;
    announce(`Day ${world.state.day}. Cook the orders before patience runs out.`);
  }

  function endDay() {
    screen = world.state.campaignOver ? SCREEN_CAMPAIGN : SCREEN_DAYOVER;
    ui.summary = world.state.summary;
    if (world.state.coins > best) {
      best = world.state.coins;
      ui.best = best;
      try { window.localStorage.setItem('dapur-nusantara.best', String(best)); } catch { /* storage off */ }
    }
    announce(`Day over. Served ${world.state.summary.served} of ${world.state.summary.spawned}.`);
  }

  function handleClick(p) {
    if (screen === SCREEN_TITLE) { startDay(); return; }
    if (screen === SCREEN_DAYOVER || screen === SCREEN_CAMPAIGN) {
      for (const r of ui.upgradeRects) {
        if (inRect(p, r)) {
          const ev = world.buyUpgrade(r.id);
          soundFor(ev);
          return;
        }
      }
      if (world.state.campaignOver) { world.reset(); screen = SCREEN_TITLE; }
      else startDay();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    // order tickets
    const b = LAYOUT.board;
    if (inRect(p, { x: b.x, y: b.y + 36, w: b.w, h: 4 * 60 })) {
      const idx = Math.floor((p.y - (b.y + 36)) / 60);
      if (idx >= 0 && idx < 4) soundFor(world.selectOrder(idx));
      return;
    }
    // stations + chopping board
    const st = LAYOUT.stations;
    if (inRect(p, st.wok)) { soundFor(world.clickStation(0)); return; }
    if (inRect(p, st.grill)) { soundFor(world.clickStation(1)); return; }
    if (inRect(p, st.pot)) { soundFor(world.clickStation(2)); return; }
    if (inRect(p, st.board)) { soundFor(world.clickBoard()); return; }
    // ingredient bins
    for (const bin of LAYOUT.bins) {
      if (inRect(p, bin)) { soundFor(world.selectIngredient(bin.id)); return; }
    }
    // plate / serve / trash
    if (inRect(p, LAYOUT.serveBtn)) { soundFor(world.serve()); return; }
    if (inRect(p, LAYOUT.trashBtn)) { soundFor(world.trash()); return; }
    if (inRect(p, LAYOUT.plate)) { soundFor(world.clickPlate()); return; }
    if (inRect(p, LAYOUT.hatch)) { soundFor(world.serve()); return; }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) startDay();
    else if (actions & ACTION_CONFIRM && (screen === SCREEN_DAYOVER || screen === SCREEN_CAMPAIGN)) {
      if (world.state.campaignOver) { world.reset(); screen = SCREEN_TITLE; }
      else startDay();
    } else if (actions & ACTION_SERVE && screen === SCREEN_PLAY) soundFor(world.serve());
    else if (actions & ACTION_TRASH && screen === SCREEN_PLAY) soundFor(world.trash());
    for (const click of input.takeClicks()) handleClick(click);
    if (screen === SCREEN_PLAY) {
      for (const ingId of input.takeKeys()) soundFor(world.selectIngredient(ingId));
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const events = world.step(STEP);
    soundFor(events);
    if (events & EVENT_DAYOVER) endDay();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, ui);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Dapur Nusantara. Press Enter or click to start Day 1.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
