// levels.js — the museum layout for The Gilded Vault.
// One floor, 1280x720 logical units, four rooms plus a vent crawl:
// Entrance Hall (south), Main Gallery (centre), Side Gallery (north-west),
// the Vault (north-east, holds the Star Sapphire) and the Vent (north-centre).
// Walls are axis-aligned rectangles; every door is a gap between two wall
// segments, so there are always several routes to the Vault.

export const WORLD_W = 1280;
export const WORLD_H = 720;

// Wall thickness for the interior partitions.
const T = 16;

export function buildLevel() {
  const walls = [
    // Outer shell.
    { x: 0, y: 0, w: WORLD_W, h: 24 },
    { x: 0, y: WORLD_H - 24, w: WORLD_W, h: 24 },
    { x: 0, y: 0, w: 24, h: WORLD_H },
    { x: WORLD_W - 24, y: 0, w: 24, h: WORLD_H },
    // Horizontal wall y=250: separates the north rooms from the Main Gallery.
    // Doors: Side Gallery (x 150-210), Vent (x 610-670), Vault (x 1000-1060).
    { x: 24, y: 250, w: 126, h: T },
    { x: 210, y: 250, w: 310, h: T },
    { x: 670, y: 250, w: 330, h: T },
    { x: 1060, y: 250, w: 196, h: T },
    // Horizontal wall y=480: separates the Entrance Hall from the Main Gallery.
    // Doors: west (x 300-360), east (x 920-980).
    { x: 24, y: 480, w: 276, h: T },
    { x: 360, y: 480, w: 560, h: T },
    { x: 980, y: 480, w: 276, h: T },
    // Vertical wall x=520: Side Gallery | Vent. Door gap y 130-180.
    { x: 520, y: 24, w: T, h: 106 },
    { x: 520, y: 180, w: T, h: 70 },
    // Vertical wall x=760: Vent | Vault. Vent opening gap y 60-110.
    { x: 760, y: 24, w: T, h: 36 },
    { x: 760, y: 110, w: T, h: 140 },
    // Display plinths in the Main Gallery (low blocks, block movement).
    { x: 430, y: 330, w: 90, h: 26 },
    { x: 760, y: 330, w: 90, h: 26 },
    // Marble benches in the Entrance Hall.
    { x: 180, y: 560, w: 110, h: 24 },
    { x: 990, y: 560, w: 110, h: 24 },
  ];

  // Floor tint per room, drawn under everything.
  const rooms = [
    { name: 'Entrance Hall', x: 24, y: 496, w: 1232, h: 200, floor: '#241a33', trim: '#3a2b52' },
    { name: 'Main Gallery', x: 24, y: 266, w: 1232, h: 214, floor: '#2b1f3d', trim: '#43305e' },
    { name: 'Side Gallery', x: 24, y: 24, w: 496, h: 226, floor: '#1f1830', trim: '#38294f' },
    { name: 'Vent', x: 536, y: 24, w: 224, h: 226, floor: '#171223', trim: '#2c2140' },
    { name: 'Vault', x: 776, y: 24, w: 480, h: 226, floor: '#33243f', trim: '#5a3d1e' },
  ];

  // Wall paintings (decor, drawn on the walls; some are loot).
  const paintings = [
    { x: 90, y: 30, w: 54, h: 40, hue: '#c94f6d' },
    { x: 250, y: 30, w: 54, h: 40, hue: '#4f8ac9' },
    { x: 410, y: 30, w: 54, h: 40, hue: '#c9a24f' },
    { x: 1150, y: 30, w: 54, h: 40, hue: '#7dc94f' },
    { x: 30, y: 330, w: 40, h: 54, hue: '#9d4fc9' },
  ];

  // Loot: coins, paintings and the Star Sapphire in its locked case.
  const loot = [
    { id: 'coin1', kind: 'coin', x: 300, y: 400, value: 100, taken: false },
    { id: 'coin2', kind: 'coin', x: 950, y: 400, value: 100, taken: false },
    { id: 'coin3', kind: 'coin', x: 700, y: 620, value: 100, taken: false },
    { id: 'coin4', kind: 'coin', x: 500, y: 560, value: 100, taken: false },
    { id: 'coin5', kind: 'coin', x: 620, y: 130, value: 100, taken: false },
    { id: 'paint1', kind: 'painting', x: 117, y: 50, value: 250, taken: false },
    { id: 'paint2', kind: 'painting', x: 277, y: 50, value: 250, taken: false },
    { id: 'paint3', kind: 'painting', x: 437, y: 50, value: 250, taken: false },
    { id: 'paint4', kind: 'painting', x: 1177, y: 50, value: 250, taken: false },
    // The prize. It sits in a locked glass case in the Vault.
    { id: 'sapphire', kind: 'sapphire', x: 1010, y: 120, value: 1000, taken: false },
  ];

  // Guards: waypoint patrols. dir is the facing angle in radians.
  const guards = [
    {
      id: 'g1', name: 'Marco', x: 350, y: 350, r: 14,
      waypoints: [{ x: 350, y: 350 }, { x: 950, y: 350 }],
      wp: 1, speed: 72, dir: 0, chase: 0, seenFor: 0,
    },
    {
      id: 'g2', name: 'Petra', x: 200, y: 300, r: 14,
      waypoints: [{ x: 200, y: 300 }, { x: 200, y: 450 }],
      wp: 1, speed: 62, dir: Math.PI / 2, chase: 0, seenFor: 0,
    },
    {
      id: 'g3', name: 'Silas', x: 150, y: 120, r: 14,
      waypoints: [{ x: 150, y: 120 }, { x: 420, y: 120 }],
      wp: 1, speed: 58, dir: 0, chase: 0, seenFor: 0,
    },
    {
      id: 'g4', name: 'Vera', x: 850, y: 200, r: 14,
      waypoints: [{ x: 850, y: 200 }, { x: 1150, y: 200 }],
      wp: 1, speed: 66, dir: 0, chase: 0, seenFor: 0,
    },
  ];

  // Security cameras: wall-mounted, sweeping a cone.
  const cameras = [
    { id: 'c1', x: 640, y: 266, base: Math.PI / 2, sweep: 0.9, speed: 0.55, phase: 0, angle: Math.PI / 2, disabled: 0 },
    { id: 'c2', x: 880, y: 266, base: Math.PI / 2, sweep: 0.8, speed: 0.7, phase: 1.6, angle: Math.PI / 2, disabled: 0 },
    { id: 'c3', x: 300, y: 266, base: Math.PI / 2, sweep: 0.7, speed: 0.45, phase: 3.1, angle: Math.PI / 2, disabled: 0 },
  ];

  return {
    walls,
    rooms,
    paintings,
    loot,
    guards,
    cameras,
    playerStart: { x: 640, y: 630 },
    skylight: { x: 90, y: 70, r: 34 },
    sapphireCase: { x: 1010, y: 120, r: 30 },
    ventGrate: { x: 640, y: 250 },
  };
}
