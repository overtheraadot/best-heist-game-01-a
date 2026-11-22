// main.js — The Gilded Vault: game state, loop, alarm and win/lose rules.
// Boots the canvas, wires input, runs the frame loop and owns the alarm:
// being seen raises it, hiding lowers it, 100 with no escape ends the night.

import { buildLevel, WORLD_W, WORLD_H } from './levels.js';
import { updateGuard, GUARD_RANGE } from './guards.js';
import { updateCamera, cameraVision, fireEmp, EMP_DURATION } from './cameras.js';
import { startingTools, collectLoot, workCase, takeSapphire, throwSmoke, ageSmokes, nearCase } from './loot.js';
import { movePlayer, PLAYER_R } from './player.js';
import { createInput } from './input.js';
import { ensureAudio, toggleMute, playPickup, playSmoke, playEmp, playLockpick, playWin, playCaught, alarmPulse } from './audio.js';
import { draw, toolButtonRects, VIEW_W, VIEW_H } from './render.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

// Alarm tuning: how fast being seen fills the meter, and how fast hiding
// drains it. Sneaking halves the rate at which a guard fills it.
const GUARD_ALARM_RATE = 55;
const CAMERA_ALARM_RATE = 45;
const ALARM_DECAY = 14;
const CAUGHT_GRACE = 0.9; // seconds at 100 before the guards actually grab Rook

function createState() {
  const level = buildLevel();
  return {
    mode: 'start',
    level,
    player: {
      x: level.playerStart.x, y: level.playerStart.y, r: PLAYER_R,
      dir: -Math.PI / 2, moving: false, sneaking: false,
    },
    tools: startingTools(),
    smokes: [],
    floaters: [],
    time: 0,
    alarm: 0,
    lootValue: 0,
    caseOpen: false,
    caseProgress: 0,
    sapphireTaken: false,
    grace: 0,
    message: '',
    messageT: 0,
    seenNow: false,
  };
}

let state = createState();
let animT = 0;

function say(text) {
  state.message = text;
  state.messageT = 3;
}

function addFloater(x, y, text, color) {
  state.floaters.push({ x, y, text, color, ttl: 1.2 });
  if (state.floaters.length > 12) state.floaters.shift();
}

function startGame() {
  state = createState();
  state.mode = 'playing';
  ensureAudio();
  say('Steal the Star Sapphire — stay out of the cones!');
}

// Deterministic demo states for screenshots (?shot=cover|alarm|loot|win).
// Still the real game running — only positions and the alarm are staged.
function applyShot(shot) {
  state.mode = 'playing';
  const L = state.level;
  const g1 = L.guards[0];
  const g4 = L.guards[3];
  if (shot === 'cover') {
    // Thief mid-room in the Main Gallery, a guard cone sweeping at him, a
    // camera overhead, the sapphire glowing in the Vault, alarm part-way up.
    state.player.x = 640;
    state.player.y = 400;
    state.player.dir = -Math.PI / 2;
    g1.x = 780; g1.y = 350; g1.dir = Math.PI; g1.wp = 0;
    state.alarm = 32;
    state.lootValue = 200;
    L.loot.find((l) => l.id === 'coin1').taken = true;
    L.loot.find((l) => l.id === 'coin2').taken = true;
    state.time = 47;
  } else if (shot === 'alarm') {
    // Near-miss: Rook caught dead-centre in a guard cone, alarm critical.
    state.player.x = 880;
    state.player.y = 372;
    state.player.dir = Math.PI;
    g1.x = 950; g1.y = 350; g1.dir = Math.PI; g1.wp = 0; g1.seenFor = 1;
    state.alarm = 78;
    state.lootValue = 350;
    state.time = 96;
    say('SPOTTED! Break line of sight!');
  } else if (shot === 'loot') {
    // The case is open, the sapphire is in hand, alarm climbing.
    state.player.x = 1010;
    state.player.y = 168;
    state.player.dir = -Math.PI / 2;
    state.caseOpen = true;
    state.caseProgress = 1;
    const gem = L.loot.find((l) => l.kind === 'sapphire');
    gem.taken = true;
    state.sapphireTaken = true;
    state.lootValue = 1350;
    state.alarm = 55;
    state.time = 128;
    g4.x = 900; g4.y = 200; g4.dir = 0; g4.wp = 1;
    addFloater(1010, 130, '+$1000 STAR SAPPHIRE', '#9fd4ff');
  } else if (shot === 'win') {
    // The getaway: Rook at the skylight with the sapphire, night complete.
    state.mode = 'win';
    state.player.x = L.skylight.x;
    state.player.y = L.skylight.y;
    state.sapphireTaken = true;
    state.caseOpen = true;
    L.loot.find((l) => l.kind === 'sapphire').taken = true;
    state.lootValue = 1750;
    state.time = 142;
    state.alarm = 18;
  }
}

function handleClick() {
  if (!input.click) return;
  const c = input.click;
  input.click = null;
  ensureAudio();
  if (state.mode === 'start') {
    startGame();
    return;
  }
  if (state.mode === 'win' || state.mode === 'caught') return;
  if (state.mode === 'paused') return;
  // HUD tool buttons first.
  const rects = toolButtonRects();
  if (c.x >= rects.smoke.x && c.x <= rects.smoke.x + rects.smoke.w &&
      c.y >= rects.smoke.y && c.y <= rects.smoke.y + rects.smoke.h) {
    useSmoke();
    return;
  }
  if (c.x >= rects.emp.x && c.x <= rects.emp.x + rects.emp.w &&
      c.y >= rects.emp.y && c.y <= rects.emp.y + rects.emp.h) {
    useEmp();
    return;
  }
  // Clicking near the case works on it; anywhere else walks Rook there.
  if (nearCase(state.player, state.level)) {
    input.interact = true;
    setTimeout(() => { input.interact = false; }, 120);
    return;
  }
  input.moveTarget = { x: Math.max(24, Math.min(WORLD_W - 24, c.x)), y: Math.max(24, Math.min(WORLD_H - 24, c.y)) };
}

function useSmoke() {
  const cloud = throwSmoke(state);
  if (cloud) {
    playSmoke();
    say('Smoke bomb! The cones cannot see through it.');
  } else {
    say('No smoke bombs left!');
  }
}

function useEmp() {
  if (state.tools.emp <= 0) {
    say('EMP already used!');
    return;
  }
  state.tools.emp -= 1;
  const hit = fireEmp(state.level.cameras);
  playEmp();
  say(hit > 0 ? `EMP! Cameras dark for ${EMP_DURATION}s.` : 'EMP fired — cameras already dark.');
}

function update(dt) {
  if (state.mode !== 'playing') return;
  state.time += dt;
  if (state.messageT > 0) state.messageT -= dt;
  for (const f of state.floaters) f.ttl -= dt;
  state.floaters = state.floaters.filter((f) => f.ttl > 0);
  ageSmokes(state, dt);

  movePlayer(state.player, input, state.level.walls, dt, WORLD_W, WORLD_H);

  // Tools (each pressed flag is consumed here so it fires exactly once).
  if (input.pressed.smoke) useSmoke();
  delete input.pressed.smoke;
  if (input.pressed.emp) useEmp();
  delete input.pressed.emp;
  if (input.pressed.mute) toggleMute();
  delete input.pressed.mute;
  if (input.pressed.pause) {
    delete input.pressed.pause;
    state.mode = 'paused';
    return;
  }
  if (input.pressed.restart) {
    delete input.pressed.restart;
    startGame();
    return;
  }

  // Guards and cameras: who sees Rook right now?
  let strongest = 0;
  for (const g of state.level.guards) {
    const seen = updateGuard(g, dt, state.player, state.level.walls, state.smokes, state.alarm);
    const rate = state.player.sneaking ? 0.55 : 1;
    strongest = Math.max(strongest, seen * GUARD_ALARM_RATE * rate);
  }
  for (const cam of state.level.cameras) {
    updateCamera(cam, state.time);
    const seen = cameraVision(cam, state.player, state.level.walls, state.smokes);
    strongest = Math.max(strongest, seen * CAMERA_ALARM_RATE);
  }
  state.seenNow = strongest > 0;

  if (strongest > 0) {
    state.alarm = Math.min(100, state.alarm + strongest * dt);
    if (state.alarm > 40 && state.messageT <= 0) say('Spotted! Break line of sight!');
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
  alarmPulse(state.alarm, dt);

  // The fair caught moment: 0.9s at full alarm to vanish before the grab.
  if (state.alarm >= 100) {
    state.grace += dt;
    if (state.grace >= CAUGHT_GRACE) {
      state.mode = 'caught';
      playCaught();
      return;
    }
  } else {
    state.grace = 0;
  }

  // Loot.
  for (const item of collectLoot(state.level.loot, state.player)) {
    state.lootValue += item.value;
    playPickup(item.value);
    addFloater(item.x, item.y, '+$' + item.value, '#ffd94d');
  }

  // The sapphire case.
  const before = state.caseOpen;
  const res = workCase(state, dt, input.interact);
  if (res === 'open' && !before) {
    playLockpick();
    say('Case open! Grab the sapphire!');
  }
  const gem = takeSapphire(state);
  if (gem) {
    state.lootValue += gem.value;
    playPickup(gem.value);
    addFloater(gem.x, gem.y, '+$' + gem.value + ' STAR SAPPHIRE', '#9fd4ff');
    say('Sapphire secured! Get to the SKYLIGHT!');
  }

  // Getaway: skylight with the sapphire wins the night.
  const s = state.level.skylight;
  if (state.sapphireTaken && Math.hypot(state.player.x - s.x, state.player.y - s.y) < s.r + 6) {
    state.mode = 'win';
    playWin();
  }
}

// Pause / start-screen keys, handled outside the playing update.
// Each flag is consumed here; flags the playing update owns (smoke, emp)
// are left alone for it.
function handleKeys() {
  if (input.pressed.mute) {
    toggleMute();
    delete input.pressed.mute;
  }
  if (input.pressed.restart && state.mode !== 'start') {
    startGame();
    delete input.pressed.restart;
  }
  if (input.pressed.confirm && state.mode === 'start') startGame();
  if (input.pressed.pause && state.mode === 'paused') state.mode = 'playing';
  if (input.pressed.confirm && (state.mode === 'win' || state.mode === 'caught')) startGame();
  delete input.pressed.confirm;
  delete input.pressed.pause;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  animT += dt;
  handleClick();
  handleKeys();
  update(dt);
  draw(ctx, state, animT);
  requestAnimationFrame(frame);
}

// Boot: apply a ?shot= demo state, or show the title screen.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot === 'cover' || shot === 'alarm' || shot === 'loot' || shot === 'win') {
  state.mode = 'playing';
  applyShot(shot);
}
window.__gilded = { get state() { return state; }, startGame };
requestAnimationFrame(frame);
