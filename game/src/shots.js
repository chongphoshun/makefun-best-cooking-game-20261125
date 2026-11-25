// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a scripted
// cook that uses only the world's own player actions (pick ingredient, chop, cook,
// build the plate, serve), so the frame is what a real game really looks like and the
// same seed always gives the same frame.
import { STEP } from './config.js';
import { ING_BY_ID } from './config.js';
import { RECIPE_BY_ID } from './recipes.js';
import { SCREEN_DAYOVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stepN(world, seconds) {
  const n = Math.round(seconds / STEP);
  let events = 0;
  for (let i = 0; i < n; i += 1) events |= world.step(STEP);
  return events;
}

// Prepare one ingredient exactly as a player would, then put it on the plate.
function prepareAndPlate(world, ingId) {
  const ing = ING_BY_ID[ingId];
  world.selectIngredient(ingId);
  if (ing.prep === 'chop') {
    world.clickBoard(); // place on the board
    world.clickBoard(); // chop 1/2
    world.clickBoard(); // chop 2/2
    world.clickBoard(); // take the chopped ingredient
  } else if (ing.prep === 'raw') {
    // hand already holds it raw
  } else {
    const stationIndex = ing.prep === 'wok' ? 0 : ing.prep === 'grill' ? 1 : 2;
    world.clickStation(stationIndex);
    // wait on the station until the dish is cooked (poll every 0.1s of game time)
    for (let i = 0; i < 400; i += 1) {
      const item = world.state.stations[stationIndex].item;
      if (item && item.progress >= 1) break;
      world.step(0.1);
    }
    world.clickStation(stationIndex); // take the cooked ingredient
  }
  world.clickPlate();
}

// Serve the plate's target order completely, using only real actions.
function fulfillOrder(world) {
  world.selectOrder(0);
  const recipe = RECIPE_BY_ID[world.state.plate.recipeId];
  if (!recipe) return false;
  for (const ingId of recipe.ingredients) prepareAndPlate(world, ingId);
  if (!world.state.readyPlate) return false;
  world.serve();
  return true;
}

// Serve orders until `count` are served, stepping time forward when no order is up.
function serveCount(world, count) {
  let guard = 0;
  while (world.state.served < count && !world.state.dayOver && guard < 4000) {
    guard += 1;
    if (world.state.orders.length > 0) {
      if (!fulfillOrder(world)) stepN(world, 1);
    } else {
      stepN(world, 1);
    }
  }
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'start') {
    world.startDay(1);
    stepN(world, 6);
    // a wok already cooking behind the title panel, for a live-kitchen backdrop
    world.selectIngredient('egg');
    world.clickStation(0);
    stepN(world, 1.5);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    world.startDay(1);
    stepN(world, 30); // orders at 0s, 15s, 30s; timer ~2:00, patience draining
    serveCount(world, 1); // one full order served for real: coins + combo up
    // second order, mid-assembly: 2 of 4 slots filled
    world.selectOrder(0);
    const recipe = RECIPE_BY_ID[world.state.plate.recipeId];
    prepareAndPlate(world, recipe.ingredients[0]);
    prepareAndPlate(world, recipe.ingredients[1]);
    // a wok cooking at ~half progress
    const third = recipe.ingredients[2];
    if (ING_BY_ID[third].prep === 'wok' || ING_BY_ID[third].prep === 'grill' || ING_BY_ID[third].prep === 'pot') {
      const stationIndex = ING_BY_ID[third].prep === 'wok' ? 0 : ING_BY_ID[third].prep === 'grill' ? 1 : 2;
      world.selectIngredient(third);
      world.clickStation(stationIndex);
      stepN(world, 2);
    } else {
      world.selectIngredient('egg');
      world.clickStation(0);
      stepN(world, 2);
    }
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }

  if (name === 'rush') {
    world.startDay(1);
    serveCount(world, 5); // combo x5, coins high, five real serves
    stepN(world, 108 - world.state.elapsed); // late shift, timer ~0:40
    // next order nearly complete: 3 of 4 slots filled
    if (world.state.orders.length > 0) {
      world.selectOrder(0);
      const recipe = RECIPE_BY_ID[world.state.plate.recipeId];
      if (recipe) {
        prepareAndPlate(world, recipe.ingredients[0]);
        prepareAndPlate(world, recipe.ingredients[1]);
        prepareAndPlate(world, recipe.ingredients[2]);
      }
    }
    // one station left cooking past done, about to burn
    world.selectIngredient('egg');
    world.clickStation(0);
    stepN(world, 3.5 + 6); // cooked at 3.5s, then 6s of the 8s burn window
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }

  // end: play a whole day for real, serve 9 of 10 orders, buy one upgrade.
  world.startDay(1);
  let guard = 0;
  while (!world.state.dayOver && guard < 6000) {
    guard += 1;
    if (world.state.served >= 9) {
      stepN(world, 1);
    } else if (world.state.orders.length > 0) {
      if (!fulfillOrder(world)) stepN(world, 1);
    } else {
      stepN(world, 1);
    }
  }
  world.buyUpgrade('wok');
  return { screen: SCREEN_DAYOVER, best: world.state.coins, summary: world.state.summary };
}
