// loot.js — loot pickups, the locked sapphire case and the thief's tools.
// Tools cost something: smoke bombs and the EMP are limited, and the
// lockpick trades one use for opening the case instantly instead of a slow,
// exposed 2-second pick.

export const PICK_RADIUS = 30;
export const CASE_PICK_SECONDS = 2.0;

export function startingTools() {
  return { smoke: 2, emp: 1, lockpick: 1 };
}

// Pick up any loot within reach. Returns the list of items just taken.
export function collectLoot(loot, player) {
  const taken = [];
  for (const item of loot) {
    if (item.taken) continue;
    if (item.kind === 'sapphire') continue; // the sapphire needs its case opened
    if (Math.hypot(item.x - player.x, item.y - player.y) < PICK_RADIUS) {
      item.taken = true;
      taken.push(item);
    }
  }
  return taken;
}

// Is the thief close enough to work on the sapphire case?
export function nearCase(player, level) {
  return Math.hypot(player.x - level.sapphireCase.x, player.y - level.sapphireCase.y) < 58;
}

// Advance the case pick. Holding the interact key fills progress; a lockpick
// opens it at once. Returns 'open' when the case opens, 'picking' while the
// pick is in progress, 'idle' otherwise.
export function workCase(state, dt, holding) {
  if (state.caseOpen) return 'open';
  const level = state.level;
  if (!nearCase(state.player, level)) {
    state.caseProgress = 0;
    return 'idle';
  }
  if (holding && state.tools.lockpick > 0) {
    state.tools.lockpick -= 1;
    state.caseOpen = true;
    state.caseProgress = 1;
    return 'open';
  }
  if (holding) {
    state.caseProgress += dt / CASE_PICK_SECONDS;
    if (state.caseProgress >= 1) {
      state.caseOpen = true;
      return 'open';
    }
    return 'picking';
  }
  state.caseProgress = Math.max(0, state.caseProgress - dt);
  return 'idle';
}

// Take the sapphire once its case is open.
export function takeSapphire(state) {
  if (!state.caseOpen || state.sapphireTaken) return null;
  const gem = state.level.loot.find((l) => l.kind === 'sapphire');
  if (!gem) return null;
  const near = Math.hypot(state.player.x - gem.x, state.player.y - gem.y) < PICK_RADIUS;
  if (!near) return null;
  gem.taken = true;
  state.sapphireTaken = true;
  return gem;
}

// Drop a smoke cloud at the thief's feet. Returns the cloud or null.
export function throwSmoke(state) {
  if (state.tools.smoke <= 0) return null;
  state.tools.smoke -= 1;
  const cloud = { x: state.player.x, y: state.player.y, r: 92, ttl: 6 };
  state.smokes.push(cloud);
  return cloud;
}

// Age smoke clouds; returns nothing, mutates state.smokes in place.
export function ageSmokes(state, dt) {
  for (const s of state.smokes) s.ttl -= dt;
  state.smokes = state.smokes.filter((s) => s.ttl > 0);
}
