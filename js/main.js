/**
 * Cyber Survivor - Application Entry Point
 * High-DPI canvas rendering, button wire-ups, and game loop execution.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);

  // Resize canvas for crisp rendering
  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // Button hooks
  const btnStart = document.getElementById('btn-start');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnRestartPause = document.getElementById('btn-restart-pause');
  const btnMute = document.getElementById('btn-mute');

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      window.soundEngine.playClick();
      game.startNewGame();
    });
  }

  if (btnResume) {
    btnResume.addEventListener('click', () => {
      window.soundEngine.playClick();
      game.resume();
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      window.soundEngine.playClick();
      game.startNewGame();
    });
  }

  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => {
      window.soundEngine.playClick();
      game.startNewGame();
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      btnMute.textContent = isMuted ? '🔇 UNMUTE SFX' : '🔊 MUTE SFX';
    });
  }

  // Show Start Screen on load
  window.uiController.showStartScreen();

  // Animation Loop with delta-time
  let lastTime = performance.now();

  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    game.update(dt);
    game.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
