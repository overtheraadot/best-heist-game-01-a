// cameras.js — wall-mounted security cameras.
// A camera sweeps its cone back and forth. It sees farther than a guard but
// its cone is narrower, and an EMP shuts it down for a while.

import { visionStrength, CAMERA_RANGE, CAMERA_HALF_ANGLE } from './guards.js';

export const EMP_DURATION = 8; // seconds a camera stays dark after an EMP

// Advance the sweep. angle = base + sweep * sin(speed * t + phase).
export function updateCamera(cam, t) {
  if (cam.disabled > 0) {
    cam.disabled -= 1 / 60;
    return;
  }
  cam.angle = cam.base + cam.sweep * Math.sin(cam.speed * t + cam.phase);
}

// How strongly (0..1) this camera sees the player right now.
export function cameraVision(cam, player, walls, smokes) {
  if (cam.disabled > 0) return 0;
  return visionStrength(cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
    player.x, player.y, walls, smokes);
}

// Shut every camera down for EMP_DURATION seconds. Returns how many were hit.
export function fireEmp(cameras) {
  let hit = 0;
  for (const cam of cameras) {
    if (cam.disabled <= 0) hit++;
    cam.disabled = EMP_DURATION;
  }
  return hit;
}
