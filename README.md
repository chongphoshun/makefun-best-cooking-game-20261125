[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/chongphoshun/makefun-best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/chongphoshun/makefun-best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Nusantara — Make the best cooking game

Built for [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) on [make.fun](https://make.fun).

**Bounty:** `best-cooking-game-20261125-0137` — "Make the best cooking game" ($250 pot, free entry)
**Title:** Dapur Nusantara v1: 12 recipes, 3 stations, 5-day campaign

A one-screen Indonesian warung cooking game. Static files only, no libraries, no
network — open `game/index.html` in desktop Chrome and play.

## How to play

1. Read the **order board** (left): each ticket names a dish, its 4 ingredients,
   its price, and a patience bar draining in real time.
2. Click an **ingredient bin** (bottom, or keys `1-9`, `0`, `Q`, `W`) to pick it up.
3. Prep it: **chop** chilli/garlic/greens on the chopping board (2 clicks),
   **cook** rice/noodle/tea on the POT, chicken/beef on the GRILL, egg/tofu/shrimp
   on the WOK (timed — take it off when READY, or it burns after 8s and must be
   trashed with `T`), or put **sauce** straight on the plate.
4. Click the **plate** to add the ingredient — in recipe order, shown in the slots
   list. A finished plate moves to the **serve hatch**.
5. Click **SERVE** (or `Space`) while the order is still on the board. Serve fast
   for a +$5 tip; serve in a row to build a combo (up to +50% dish price).
6. A wrong ingredient, an expired order, or burnt food breaks the combo.

## Systems

- **12 recipes in 3 groups** (Warung / Noodle Bar / Grill & Steam), each 4
  ingredients with its own station/chop/raw prep chain. Day 1 unlocks 4 recipes;
  a new batch unlocks every day until all 12 are open on Day 5.
- **3 cooking stations + chopping board**, each with a live progress ring, READY
  and BURNING states.
- **5-day campaign**, 150-second shifts, 10 orders per day. Day-complete screen
  shows stars (3 at 90% served), orders served, accuracy, coins earned, best
  combo — and an **upgrade shop**: Faster Wok ($60), Extra Patience ($50),
  +1 Order Slot ($80). Upgrades carry over to the next day.
- **Patience, combo, tips, burn/trash economy** — every number on screen is live
  game state, not decoration.

## Controls

Mouse: click everything. Keyboard: `1-9, 0, Q, W` pick ingredient, `Space` serve,
`T` trash hand/burnt food, `P` pause, `Enter` start / next day.

## Screenshots (deterministic, `?shot=…&seed=1`)

| File | Scene |
| --- | --- |
| `1-start.jpg` | Title over a live kitchen, wok already cooking |
| `2-play.jpg` | Mid-shift: 3 orders, dish 2/4 built, wok at ~50%, timer ~1:45 |
| `3-rush.jpg` | Late shift: combo x5, dish 3/4 built, a wok about to burn |
| `4-end.jpg` | Day complete: 3 stars, 9/10 served, upgrade shop with 1 owned |

Each shot plays the real rules forward from a fresh world with a scripted cook
(`game/src/shots.js`) — same seed, same frame — and sets `window.__shotReady`.

## Play-test results (v1, seed 1, real rules, scripted cook)

- Full Day 1: **9/10 orders served, 3 stars, 100% accuracy**, coins earned ~+$300
  before the $60 Faster Wok upgrade; no console errors.
- Mid-shift shot: 1 order served, 3 orders on the board, 2nd dish 2/4 built, a pot
  cooking at ~67%, timer ~1:43.
- Rush shot: 5 orders served in a row (combo x5), late-shift timer ~0:25,
  dish 3/4 built, wok 6s into its 8s burn window.

## Run it

```
node serve.ts            # http://localhost:8080
MAKEFUN_OUTPUT_DIR=out node main.ts   # build the entry into out/
```

## Layout

- `main.ts` — copies `game/` + `screenshots/` to the output dir, writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun library, copied unchanged from the kit
- `game/index.html`, `game/src/config.js` (tuning/palette/layout), `recipes.js`
  (12 recipes), `world.js` (pure rules), `render.js` (all drawing), `input.js`,
  `shots.js` (staged scenes + scripted cook), `main.js` (loop/screens/sound),
  `random.js` (seeded RNG)
- `screenshots/` — 4 JPEGs, 1280x720, each under 256 KiB
