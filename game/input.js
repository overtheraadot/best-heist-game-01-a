// input.js — keyboard and mouse for The Gilded Vault.
// WASD or arrows to move, Shift to sneak, E to interact (pick the case),
// 1 smoke bomb, 2 EMP, P or Esc pause, R restart, M mute. Clicking the
// floor walks Rook there; clicking a HUD tool button uses that tool.

export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    interact: false,
    moveTarget: null,
    click: null, // {x, y} in canvas pixels, consumed by the game loop
    pressed: {}, // edge-triggered keys, consumed by the game loop
  };

  const keyMap = {
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
  };

  window.addEventListener('keydown', (e) => {
    if (keyMap[e.code] !== undefined) {
      input[keyMap[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'Digit1') input.pressed.smoke = true;
    if (e.code === 'Digit2') input.pressed.emp = true;
    if (e.code === 'KeyP' || e.code === 'Escape') input.pressed.pause = true;
    if (e.code === 'KeyR') input.pressed.restart = true;
    if (e.code === 'KeyM') input.pressed.mute = true;
    if (e.code === 'Enter' || e.code === 'Space') input.pressed.confirm = true;
  });

  window.addEventListener('keyup', (e) => {
    if (keyMap[e.code] !== undefined) input[keyMap[e.code]] = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.click = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  });

  window.addEventListener('blur', () => {
    input.left = input.right = input.up = input.down = false;
    input.sneak = false;
    input.interact = false;
  });

  return input;
}
