/**
 * Cyber Survivor - Input Manager
 * Handles keyboard layout-independent key codes, mouse tracking, and touch/dash triggers.
 */
class InputManager {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      dash: false
    };

    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      isDown: false,
      rightDown: false
    };

    this.onPauseRequest = null;
    this.onDashRequest = null;

    this.bindEvents();
  }

  bindEvents() {
    // Keyboard mapping
    const KEY_MAP = {
      KeyW: 'up',
      ArrowUp: 'up',
      KeyS: 'down',
      ArrowDown: 'down',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      Space: 'dash',
      ShiftLeft: 'dash',
      ShiftRight: 'dash'
    };

    window.addEventListener('keydown', (e) => {
      // Toggle pause
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.onPauseRequest) this.onPauseRequest();
        e.preventDefault();
        return;
      }

      if (KEY_MAP[e.code]) {
        if (KEY_MAP[e.code] === 'dash') {
          if (!this.keys.dash && this.onDashRequest) {
            this.onDashRequest();
          }
        }
        this.keys[KEY_MAP[e.code]] = true;
        // Don't scroll on space or arrows
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (KEY_MAP[e.code]) {
        this.keys[KEY_MAP[e.code]] = false;
      }
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Mouse down
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
      } else if (e.button === 2) {
        // Right click dash
        if (this.onDashRequest) this.onDashRequest();
      }
    });

    // Mouse up
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    // Prevent context menu
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window blur reset
    window.addEventListener('blur', () => {
      for (const k in this.keys) {
        this.keys[k] = false;
      }
      this.mouse.isDown = false;
    });

    // Touch support for mobile / touchpads
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.isDown = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.keys.right) dx += 1;
    if (this.keys.left) dx -= 1;
    if (this.keys.down) dy += 1;
    if (this.keys.up) dy -= 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    return { dx, dy };
  }
}

window.inputManager = new InputManager();
