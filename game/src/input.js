// Keyboard and pointer input. Held keys are not needed here (everything is a click
// or a one-shot key), so presses are queued as bit flags and taken once by the loop,
// so a press between two frames is never lost and never counted twice. Pointer
// clicks are queued with their logical playfield coordinates.
import { INGREDIENTS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_TRASH = 8;

const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target, toLogical) {
  let actions = 0;
  const clicks = [];
  const keys = [];

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (event.code === 'Space') {
      if (!event.repeat) actions |= ACTION_SERVE;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_TRASH;
    } else {
      const ing = INGREDIENTS.find((i) => i.key === event.key.toUpperCase());
      if (ing && !event.repeat) keys.push(ing.id);
      else return;
    }
    event.preventDefault();
  });
  window.addEventListener('blur', () => { actions = 0; });
  target.addEventListener('pointerdown', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    clicks.push(p);
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeKeys() {
      return keys.splice(0, keys.length);
    },
  };
}

export function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}
