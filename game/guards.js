// guards.js — patrol movement, vision cones and spotting.
// A guard sees the thief only inside its cone, with a clear line of sight
// (no wall in between, no smoke cloud in between). Being seen raises the
// alarm; breaking line of sight lets it fall again.

export const GUARD_RANGE = 235;
export const GUARD_HALF_ANGLE = 0.62; // ~35 degrees each side
export const CAMERA_RANGE = 265;
export const CAMERA_HALF_ANGLE = 0.46;

// True when segment (ax,ay)-(bx,by) crosses rectangle r.
export function segmentHitsRect(ax, ay, bx, by, r) {
  const minX = Math.min(ax, bx);
  const maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  // Endpoint inside the rectangle.
  if (ax >= r.x && ax <= r.x + r.w && ay >= r.y && ay <= r.y + r.h) return true;
  if (bx >= r.x && bx <= r.x + r.w && by >= r.y && by <= r.y + r.h) return true;
  const dx = bx - ax;
  const dy = by - ay;
  // Test the four edges with a parametric crossing.
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    const den = dx * (y2 - y1) - dy * (x2 - x1);
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - ax) * (y2 - y1) - (y1 - ay) * (x2 - x1)) / den;
    const u = ((x1 - ax) * dy - (y1 - ay) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

// True when nothing (wall or smoke) blocks the view from (ax,ay) to (bx,by).
export function hasLineOfSight(ax, ay, bx, by, walls, smokes) {
  for (const w of walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return false;
  }
  for (const s of smokes) {
    if (segmentHitsCircle(ax, ay, bx, by, s.x, s.y, s.r)) return false;
  }
  return true;
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + t * dx;
  const py = ay + t * dy;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy < r * r;
}

// Normalise an angle difference into [-PI, PI].
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How strongly (0..1) an observer at (ox,oy) facing `dir` sees the player.
// 0 means not seen at all; 1 means dead centre, point blank.
export function visionStrength(ox, oy, dir, range, halfAngle, px, py, walls, smokes) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (!hasLineOfSight(ox, oy, px, py, walls, smokes)) return 0;
  // Point blank: a guard standing on the thief sees them, whatever the
  // facing angle (atan2 is meaningless at zero distance).
  if (dist < 24) return 1;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, dir)) > halfAngle) return 0;
  const centre = 1 - Math.abs(angleDiff(ang, dir)) / halfAngle;
  const near = 1 - dist / range;
  return Math.max(0, 0.35 + 0.65 * centre * (0.4 + 0.6 * near));
}

import { collideWalls } from './player.js';

// Move one guard along its patrol, or chase the thief when the alarm is hot
// and the thief is in sight. Returns the strongest vision value (0..1).
export function updateGuard(g, dt, player, walls, smokes, alarm) {
  const seen = visionStrength(g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF_ANGLE,
    player.x, player.y, walls, smokes);
  g.seenFor = seen > 0 ? g.seenFor + dt : 0;

  // Chase: alarm over 60 and the thief just seen — close in fast, but give
  // up 2 seconds after losing sight so the chase stays fair.
  const chasing = alarm > 60 && g.seenFor > 0.4;
  if (chasing) {
    g.chase = 2;
  } else if (g.chase > 0) {
    g.chase -= dt;
  }

  let tx;
  let ty;
  let speed = g.speed;
  if (g.chase > 0) {
    tx = player.x;
    ty = player.y;
    speed = 118;
  } else {
    const target = g.waypoints[g.wp];
    tx = target.x;
    ty = target.y;
    const dx = tx - g.x;
    const dy = ty - g.y;
    if (Math.hypot(dx, dy) < 6) {
      g.wp = (g.wp + 1) % g.waypoints.length;
      return seen;
    }
  }
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0.01) {
    const step = Math.min(dist, speed * dt);
    g.x += (dx / dist) * step;
    g.y += (dy / dist) * step;
    g.dir = Math.atan2(dy, dx);
  }
  // Guards obey the walls too — a chasing guard stops at the wall instead
  // of walking through it to reach the thief.
  collideWalls(g, g.r, walls);
  return seen;
}
