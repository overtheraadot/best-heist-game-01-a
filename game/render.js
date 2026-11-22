// render.js — every pixel of The Gilded Vault, drawn on one canvas.
// Palette: deep purple night museum, gold trim, danger in red/amber, loot in
// gold and sapphire blue — safe cover, danger and loot obvious at a glance.
// The canvas is 1280x720 logical units; CSS scales it to the window.

import { GUARD_RANGE, GUARD_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE } from './guards.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

// HUD tool buttons (canvas coordinates) — main.js uses these for clicks.
export function toolButtonRects() {
  return {
    smoke: { x: 1080, y: 8, w: 88, h: 30 },
    emp: { x: 1172, y: 8, w: 88, h: 30 },
  };
}

function conePath(ctx, x, y, dir, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - halfAngle, dir + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, dir, range, halfAngle, fill, edge) {
  conePath(ctx, x, y, dir, range, halfAngle);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level) {
  for (const room of level.rooms) {
    ctx.fillStyle = room.floor;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    // Marble tile grid.
    ctx.strokeStyle = room.trim;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (let x = room.x + 40; x < room.x + room.w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, room.y);
      ctx.lineTo(x, room.y + room.h);
      ctx.stroke();
    }
    for (let y = room.y + 40; y < room.y + room.h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(room.x, y);
      ctx.lineTo(room.x + room.w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Room name, small and gold.
    ctx.fillStyle = 'rgba(201, 162, 79, 0.55)';
    ctx.font = '600 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(room.name.toUpperCase(), room.x + 10, room.y + room.h - 10);
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#17102a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#c9a24f';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 2);
    else ctx.fillRect(w.x, w.y, 2, w.h);
  }
}

function drawPaintings(ctx, level) {
  for (const p of level.paintings) {
    ctx.fillStyle = '#5a3d1e';
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.fillStyle = p.hue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y + p.h - 8);
    ctx.lineTo(p.x + p.w / 2, p.y + 10);
    ctx.lineTo(p.x + p.w - 8, p.y + p.h - 8);
    ctx.stroke();
  }
}

function drawSkylight(ctx, level, t) {
  const s = level.skylight;
  const pulse = 0.75 + 0.25 * Math.sin(t * 1.5);
  const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r + 26);
  grad.addColorStop(0, `rgba(255, 226, 138, ${0.85 * pulse})`);
  grad.addColorStop(1, 'rgba(255, 226, 138, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r + 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe28a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x - s.r, s.y);
  ctx.lineTo(s.x + s.r, s.y);
  ctx.moveTo(s.x, s.y - s.r);
  ctx.lineTo(s.x, s.y + s.r);
  ctx.stroke();
  ctx.fillStyle = '#ffe28a';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKYLIGHT', s.x, s.y + s.r + 44);
}

function drawLoot(ctx, level, t) {
  for (const item of level.loot) {
    if (item.taken) continue;
    if (item.kind === 'coin') {
      const bob = Math.sin(t * 3 + item.x) * 2;
      ctx.fillStyle = '#8a6d1f';
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob + 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6d1f';
      ctx.font = '700 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', item.x, item.y + bob + 4);
    } else if (item.kind === 'painting') {
      const glow = 0.5 + 0.5 * Math.sin(t * 2 + item.y);
      ctx.strokeStyle = `rgba(255, 217, 77, ${0.4 + 0.4 * glow})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 5, item.y - 5, 64, 50);
      ctx.fillStyle = '#ffd94d';
      ctx.font = '700 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOT', item.x + 27, item.y + 62);
    } else if (item.kind === 'sapphire') {
      const c = level.sapphireCase;
      // Locked glass case.
      ctx.fillStyle = 'rgba(180, 220, 255, 0.18)';
      ctx.strokeStyle = '#bfe3ff';
      ctx.lineWidth = 2;
      roundRect(ctx, c.x - 30, c.y - 30, 60, 60, 8);
      ctx.fill();
      ctx.stroke();
      // The Star Sapphire, glowing blue.
      const glow = 0.55 + 0.45 * Math.sin(t * 2.5);
      const grad = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 30);
      grad.addColorStop(0, `rgba(120, 190, 255, ${0.9 * glow})`);
      grad.addColorStop(1, 'rgba(120, 190, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4db2ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 13);
      ctx.lineTo(item.x + 11, item.y);
      ctx.lineTo(item.x, item.y + 13);
      ctx.lineTo(item.x - 11, item.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dff2ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 13);
      ctx.lineTo(item.x + 5, item.y - 2);
      ctx.lineTo(item.x, item.y + 2);
      ctx.lineTo(item.x - 5, item.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9fd4ff';
      ctx.font = '700 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ STAR SAPPHIRE ★', item.x, item.y - 42);
    }
  }
}

function drawGuards(ctx, state) {
  for (const g of state.level.guards) {
    const seeing = g.seenFor > 0;
    const col = seeing ? 'rgba(255, 64, 64, 0.28)' : 'rgba(255, 214, 90, 0.20)';
    const edge = seeing ? 'rgba(255, 64, 64, 0.55)' : 'rgba(255, 214, 90, 0.35)';
    drawCone(ctx, g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF_ANGLE, col, edge);
  }
  for (const g of state.level.guards) {
    const seeing = g.seenFor > 0;
    // Body: dark uniform, brass buttons, cap.
    ctx.fillStyle = '#1d2f57';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = seeing ? '#ff4040' : '#c9a24f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#16223f';
    ctx.beginPath();
    ctx.arc(g.x, g.y - 4, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c9a24f';
    ctx.fillRect(g.x - 8, g.y - 5, 16, 2);
    // Facing tick.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 18, g.y + Math.sin(g.dir) * 18);
    ctx.stroke();
    if (seeing) {
      ctx.fillStyle = '#ff4040';
      ctx.font = '700 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    }
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.level.cameras) {
    if (cam.disabled > 0) continue;
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      'rgba(90, 200, 255, 0.16)', 'rgba(90, 200, 255, 0.30)');
  }
  for (const cam of state.level.cameras) {
    const off = cam.disabled > 0;
    ctx.fillStyle = off ? '#3a3a3a' : '#222';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = off ? '#666' : '#5ac8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    const a = cam.angle;
    ctx.fillStyle = off ? '#666' : '#5ac8ff';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(a) * 12, cam.y + Math.sin(a) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
    if (off) {
      ctx.fillStyle = '#ffb347';
      ctx.font = '700 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP ' + Math.ceil(cam.disabled) + 's', cam.x, cam.y + 26);
    }
  }
}

function drawSmokes(ctx, smokes) {
  for (const s of smokes) {
    const alpha = Math.min(0.75, s.ttl / 2);
    ctx.fillStyle = `rgba(200, 200, 215, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(160, 160, 180, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(s.x - 30, s.y + 12, s.r * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 28, s.y - 14, s.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, player, t) {
  const bob = player.moving ? Math.sin(t * 12) * 1.5 : 0;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak: hooded purple figure.
  ctx.fillStyle = player.sneaking ? '#5b3a8a' : '#7b4fc9';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 15 + bob);
  ctx.quadraticCurveTo(player.x + 13, player.y + 2, player.x + 10, player.y + 13);
  ctx.quadraticCurveTo(player.x, player.y + 16, player.x - 10, player.y + 13);
  ctx.quadraticCurveTo(player.x - 13, player.y + 2, player.x, player.y - 15 + bob);
  ctx.fill();
  ctx.strokeStyle = '#c9a24f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Face: pale mask under the hood.
  ctx.fillStyle = '#f2e6c9';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 4 + bob, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1026';
  ctx.fillRect(player.x - 4, player.y - 6 + bob, 3, 2);
  ctx.fillRect(player.x + 1, player.y - 6 + bob, 3, 2);
  // Facing tick.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.dir) * 16, player.y + Math.sin(player.dir) * 16);
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = '#c9a24f';
    ctx.font = '700 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y - 24);
  }
}

function drawFloaters(ctx, floaters) {
  ctx.textAlign = 'center';
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.ttl);
    ctx.fillStyle = f.color;
    ctx.font = '700 16px Georgia, serif';
    ctx.fillText(f.text, f.x, f.y - (1.2 - f.ttl) * 30);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(10, 6, 20, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#c9a24f';
  ctx.fillRect(0, 46, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd94d';
  ctx.font = '700 20px Georgia, serif';
  ctx.fillText('◆ LOOT $' + state.lootValue, 14, 30);

  // Objective.
  ctx.fillStyle = '#e8dcff';
  ctx.font = '15px Georgia, serif';
  const objective = state.sapphireTaken
    ? 'Reach the SKYLIGHT with the sapphire!'
    : state.caseOpen
      ? 'Grab the STAR SAPPHIRE, then reach the skylight!'
      : 'Steal the STAR SAPPHIRE from the Vault case (E to pick).';
  ctx.fillText(objective, 200, 29);

  // Alarm meter (centre-right).
  const ax = 640;
  const ay = 14;
  const aw = 220;
  const ah = 18;
  ctx.fillStyle = '#000';
  ctx.fillRect(ax, ay, aw, ah);
  const frac = Math.max(0, Math.min(1, state.alarm / 100));
  const alarmCol = state.alarm < 40 ? '#4caf50' : state.alarm < 75 ? '#ffb347' : '#ff4040';
  ctx.fillStyle = alarmCol;
  ctx.fillRect(ax + 1, ay + 1, (aw - 2) * frac, ah - 2);
  ctx.strokeStyle = '#c9a24f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#fff';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax - 62, ay + 14);
  if (state.alarm >= 75) {
    ctx.fillStyle = '#ff4040';
    ctx.fillText('!!', ax + aw + 8, ay + 14);
  }

  // Timer.
  ctx.fillStyle = '#e8dcff';
  ctx.font = '700 16px Georgia, serif';
  ctx.textAlign = 'right';
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  ctx.fillText(String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'), 1072, 30);

  // Tool buttons.
  const rects = toolButtonRects();
  for (const [key, r] of Object.entries(rects)) {
    const count = key === 'smoke' ? state.tools.smoke : state.tools.emp;
    const label = key === 'smoke' ? '[1] SMOKE ×' : '[2] EMP ×';
    ctx.fillStyle = count > 0 ? '#3a2b52' : '#241a33';
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.strokeStyle = count > 0 ? '#c9a24f' : '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = count > 0 ? '#ffd94d' : '#888';
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label + count, r.x + r.w / 2, r.y + 20);
  }

  // Bottom hint bar.
  ctx.fillStyle = 'rgba(10, 6, 20, 0.72)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#b9a8d8';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  const lockpick = state.tools.lockpick > 0 ? 'Lockpick ×1 (instant case open)' : 'Lockpick used';
  ctx.fillText('WASD / arrows move · Shift sneak · E interact · 1 smoke · 2 EMP · P pause · ' + lockpick, VIEW_W / 2, VIEW_H - 8);

  // Case progress ring.
  if (state.caseProgress > 0 && state.caseProgress < 1) {
    const c = state.level.sapphireCase;
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 42, -Math.PI / 2, -Math.PI / 2 + state.caseProgress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', c.x, c.y + 58);
  }

  // Message toast.
  if (state.messageT > 0 && state.message) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
    const w = ctx.measureText(state.message).width + 28;
    roundRect(ctx, (VIEW_W - w) / 2, 60, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe28a';
    ctx.font = '700 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, 80);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(ctx, state) {
  const cx = VIEW_W / 2;
  if (state.mode === 'start') {
    ctx.fillStyle = 'rgba(8, 4, 18, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a24f';
    ctx.font = '700 54px Georgia, serif';
    ctx.fillText('THE GILDED VAULT', cx, 180);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '20px Georgia, serif';
    ctx.fillText('A night-museum heist — steal the Star Sapphire and vanish through the skylight.', cx, 224);
    ctx.fillStyle = '#e8dcff';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Cross the gallery under sweeping cameras and patrolling guards.', cx, 300);
    ctx.fillText('Read the vision cones. Smoke bombs hide you, an EMP blinds the cameras,', cx, 328);
    ctx.fillText('a lockpick opens the sapphire case at once. Get spotted and the alarm climbs —', cx, 356);
    ctx.fillText('break line of sight before it hits 100, or the night is over.', cx, 384);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 18px Georgia, serif';
    ctx.fillText('WASD / arrows move · Shift sneak · E interact · 1 smoke · 2 EMP · click to walk', cx, 448);
    ctx.fillStyle = '#fff';
    ctx.font = '700 24px Georgia, serif';
    ctx.fillText('Press ENTER or click to begin the heist', cx, 520);
    ctx.fillStyle = '#b9a8d8';
    ctx.font = '14px Georgia, serif';
    ctx.fillText('Several routes to the Vault: the guarded main door, the side gallery, or the air vent crawl.', cx, 560);
  } else if (state.mode === 'paused') {
    ctx.fillStyle = 'rgba(8, 4, 18, 0.7)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '700 44px Georgia, serif';
    ctx.fillText('PAUSED', cx, 330);
    ctx.fillStyle = '#b9a8d8';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Press P to keep stealing. R restarts the night.', cx, 372);
  } else if (state.mode === 'win') {
    ctx.fillStyle = 'rgba(8, 4, 18, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 52px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY!', cx, 260);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Rook slips through the skylight with the Star Sapphire.', cx, 312);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 26px Georgia, serif';
    ctx.fillText('Loot: $' + state.lootValue + '   ·   Time: ' + formatTime(state.time), cx, 372);
    ctx.fillStyle = '#b9a8d8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Press R to run it again.', cx, 420);
  } else if (state.mode === 'caught') {
    ctx.fillStyle = 'rgba(30, 2, 8, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4040';
    ctx.font = '700 52px Georgia, serif';
    ctx.fillText('CAUGHT!', cx, 260);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The alarm hit 100 — the guards close in and the night is over.', cx, 312);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 22px Georgia, serif';
    ctx.fillText('Loot kept: $' + state.lootValue, cx, 362);
    ctx.fillStyle = '#b9a8d8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Tip: break line of sight fast — smoke bombs and the vent buy you time.', cx, 410);
    ctx.fillText('Press R to try again.', cx, 440);
  }
}

function formatTime(t) {
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// Draw one frame of the whole game.
export function draw(ctx, state, t) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, state.level);
  drawSkylight(ctx, state.level, t);
  drawPaintings(ctx, state.level);
  drawLoot(ctx, state.level, t);
  drawWalls(ctx, state.level.walls);
  drawSmokes(ctx, state.smokes);
  drawGuards(ctx, state);
  drawCameras(ctx, state);
  drawPlayer(ctx, state.player, t);
  drawFloaters(ctx, state.floaters);
  drawHud(ctx, state);
  if (state.mode !== 'playing') drawOverlay(ctx, state);
  // Alarm vignette when critical.
  if (state.mode === 'playing' && state.alarm >= 75) {
    const pulse = 0.12 + 0.08 * Math.sin(t * 6);
    const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.3, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, `rgba(255,0,0,${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
