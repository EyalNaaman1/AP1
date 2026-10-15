/**
 * Cyber Survivor - UI Controller
 * Manages HUD, menus, modal screens, wave notifications, and settings.
 */
class UIController {
  constructor() {
    // DOM elements
    this.hudEl = document.getElementById('hud');
    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');

    // HUD values
    this.hpBar = document.getElementById('hp-bar');
    this.hpVal = document.getElementById('hp-val');
    this.dashBar = document.getElementById('dash-bar');
    this.scoreVal = document.getElementById('score-val');
    this.multiplierVal = document.getElementById('multiplier-val');
    this.waveTitle = document.getElementById('wave-title');
    this.waveCounter = document.getElementById('wave-counter');
    this.weaponName = document.getElementById('weapon-name');
    this.weaponLevel = document.getElementById('weapon-level');
    this.weaponIcon = document.getElementById('weapon-icon');
    this.buffsContainer = document.getElementById('buffs-container');

    // Stats on Game Over
    this.finalScore = document.getElementById('final-score');
    this.finalWave = document.getElementById('final-wave');
    this.finalKills = document.getElementById('final-kills');
    this.finalAccuracy = document.getElementById('final-accuracy');

    // High scores
    this.menuHighscore = document.getElementById('menu-highscore');

    // Volume controls
    this.volumeSliders = document.querySelectorAll('.volume-slider');

    this.bindEvents();
    this.loadHighscore();
  }

  bindEvents() {
    // Volume sliders sync
    this.volumeSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.soundEngine.setVolume(val);
        this.volumeSliders.forEach(s => s.value = val);
      });
    });
  }

  loadHighscore() {
    const saved = localStorage.getItem('cyber_survivor_highscore') || '0';
    if (this.menuHighscore) {
      this.menuHighscore.textContent = parseInt(saved, 10).toLocaleString();
    }
    return parseInt(saved, 10);
  }

  saveHighscore(score) {
    const current = this.loadHighscore();
    if (score > current) {
      localStorage.setItem('cyber_survivor_highscore', score.toString());
      if (this.menuHighscore) {
        this.menuHighscore.textContent = score.toLocaleString();
      }
      return true;
    }
    return false;
  }

  showStartScreen() {
    this.startScreen.classList.remove('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hudEl.classList.add('hidden');
    this.loadHighscore();
  }

  showHUD() {
    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hudEl.classList.remove('hidden');
  }

  showPauseScreen(isPaused) {
    if (isPaused) {
      this.pauseScreen.classList.remove('hidden');
    } else {
      this.pauseScreen.classList.add('hidden');
    }
  }

  showGameOver(stats) {
    this.hudEl.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');

    const isNewRecord = this.saveHighscore(stats.score);

    this.finalScore.textContent = stats.score.toLocaleString() + (isNewRecord ? ' (NEW RECORD!)' : '');
    this.finalWave.textContent = stats.wave;
    this.finalKills.textContent = stats.kills;
    const acc = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
    this.finalAccuracy.textContent = `${acc}%`;
  }

  updateHUD(player, wave, enemiesLeft, score, multiplier) {
    // Health bar
    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    this.hpBar.style.width = `${hpPct}%`;
    this.hpVal.textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;

    if (player.shieldTimer > 0) {
      this.hpBar.classList.add('shielded');
    } else {
      this.hpBar.classList.remove('shielded');
    }

    // Dash meter
    const dashReady = player.dashCooldown <= 0;
    const dashPct = dashReady ? 100 : ((player.dashCooldownMax - player.dashCooldown) / player.dashCooldownMax) * 100;
    this.dashBar.style.width = `${dashPct}%`;
    this.dashBar.style.background = dashReady ? 'var(--primary-neon)' : 'rgba(0, 240, 255, 0.4)';

    // Score & multiplier
    this.scoreVal.textContent = score.toLocaleString();
    if (multiplier > 1) {
      this.multiplierVal.textContent = `${multiplier}x MULTIPLIER`;
      this.multiplierVal.style.display = 'inline-block';
    } else {
      this.multiplierVal.style.display = 'none';
    }

    // Wave status
    this.waveTitle.textContent = `WAVE ${Math.max(1, wave)}`;
    this.waveCounter.textContent = `${enemiesLeft} HOSTILES ACTIVE`;

    // Weapon display
    const WEAPON_NAMES = [
      { name: 'PULSE BLASTER', code: 'W1', desc: 'LVL 1' },
      { name: 'DUAL PLASMA', code: 'W2', desc: 'LVL 2' },
      { name: 'TRI-SPREAD CANNON', code: 'W3', desc: 'LVL 3' },
      { name: 'HEAVY RAIL-BARRAGE', code: 'MAX', desc: 'MAX LEVEL' }
    ];
    const wData = WEAPON_NAMES[Math.min(player.weaponLevel, WEAPON_NAMES.length - 1)];
    this.weaponName.textContent = wData.name;
    this.weaponLevel.textContent = wData.desc;
    this.weaponIcon.textContent = wData.code;

    // Buff badges
    let buffsHtml = '';
    if (player.rapidTimer > 0) {
      buffsHtml += `<div class="buff-badge rapid">⚡ OVERDRIVE ${player.rapidTimer.toFixed(1)}s</div>`;
    }
    if (player.shieldTimer > 0) {
      buffsHtml += `<div class="buff-badge shield">🛡️ SHIELD ${player.shieldTimer.toFixed(1)}s</div>`;
    }
    this.buffsContainer.innerHTML = buffsHtml;
  }
}

window.uiController = new UIController();
