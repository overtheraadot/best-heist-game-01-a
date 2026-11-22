// player.js — Rook the thief: movement, sneaking and wall collision.
// Movement is axis-separated circle-vs-rectangle, so the thief slides along
// walls instead of sticking to them.

export const WALK_SPEED = 185;
export const SNEAK_SPEED = 105;
export const PLAYER_R = 13;

// Resolve a circle against one wall rectangle, pushing it out along the
// shortest axis. Mutates pos in place.
function pushOutOfWall(pos, r, wall) {
  const cx = Math.max(wall.x, Math.min(pos.x, wall.x + wall.w));
  const cy = Math.max(wall.y, Math.min(pos.y, wall.y + wall.h));
  const dx = pos.x - cx;
  const dy = pos.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return;
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    pos.x = cx + (dx / d) * r;
    pos.y = cy + (dy / d) * r;
    return;
  }
  // Centre inside the wall: push out along the smallest penetration.
  const left = pos.x - wall.x + r;
  const right = wall.x + wall.w - pos.x + r;
  const top = pos.y - wall.y + r;
  const bottom = wall.y + wall.h - pos.y + r;
  const m = Math.min(left, right, top, bottom);
  if (m === left) pos.x = wall.x - r;
  else if (m === right) pos.x = wall.x + wall.w + r;
  else if (m === top) pos.y = wall.y - r;
  else pos.y = wall.y + wall.h + r;
}

// Push a circle out of every wall it overlaps. Mutates pos in place.
export function collideWalls(pos, r, walls) {
  for (const w of walls) pushOutOfWall(pos, r, w);
}

export function movePlayer(player, input, walls, dt, worldW, worldH) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  // Click-to-move: walk toward the clicked point when no key is held.
  if (mx === 0 && my === 0 && input.moveTarget) {
    const dx = input.moveTarget.x - player.x;
    const dy = input.moveTarget.y - player.y;
    if (Math.hypot(dx, dy) < 8) {
      input.moveTarget = null;
    } else {
      mx = dx / Math.hypot(dx, dy);
      my = dy / Math.hypot(dx, dy);
    }
  }

  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
    player.sneaking = !!input.sneak;
    const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
    player.x += mx * speed * dt;
    player.y += my * speed * dt;
    player.dir = Math.atan2(my, mx);
    player.moving = true;
  } else {
    player.moving = false;
    player.sneaking = !!input.sneak;
  }

  // Keep inside the museum and out of the walls.
  player.x = Math.max(24 + PLAYER_R, Math.min(worldW - 24 - PLAYER_R, player.x));
  player.y = Math.max(24 + PLAYER_R, Math.min(worldH - 24 - PLAYER_R, player.y));
  collideWalls(player, PLAYER_R, walls);
}
