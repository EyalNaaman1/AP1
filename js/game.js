/**
 * Cyber Survivor - Core Game Manager
 * Orchestrates loop, waves, combat physics, collisions, state machine, and arena rendering.
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'

    this.player = null;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];

    // Wave management
    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.breakTimer = 0;
    this.waveAnnounceText = '';
    this.waveAnnounceTimer = 0;

    // Stats
    this.score = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;

    // Camera / Screen shake
    this.shake = 0;
    this.shakeVx = 0;
    this.shakeVy = 0;

    // Grid pulse
    this.gridPulse = 0;

    // Bind input hooks
    window.inputManager.onPauseRequest = () => this.togglePause();
    window.inputManager.onDashRequest = () => {
      if (this.state === 'PLAYING' && this.player) {
        const { dx, dy } = window.inputManager.getMovementVector();
        this.player.triggerDash(dx, dy);
      }
    };
  }

  startNewGame() {
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    window.particleEngine.clear();

    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.breakTimer = 1.5;
    this.score = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.shake = 0;

    this.state = 'PLAYING';
    window.uiController.showHUD();
    window.soundEngine.init();
    window.soundEngine.playWaveStart();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      window.uiController.showPauseScreen(true);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      window.uiController.showPauseScreen(false);
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      window.uiController.showPauseScreen(false);
    }
  }

  triggerScreenShake(intensity = 8) {
    this.shake = Math.max(this.shake, intensity);
  }

  spawnEnemy() {
    const margin = 40;
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { // Top
      x = Math.random() * this.canvas.width;
      y = -margin;
    } else if (side === 1) { // Right
      x = this.canvas.width + margin;
      y = Math.random() * this.canvas.height;
    } else if (side === 2) { // Bottom
      x = Math.random() * this.canvas.width;
      y = this.canvas.height + margin;
    } else { // Left
      x = -margin;
      y = Math.random() * this.canvas.height;
    }

    // Determine type by wave
    let type = 'chaser';
    const roll = Math.random();

    if (this.wave >= 5 && roll < 0.18) {
      type = 'tank';
    } else if (this.wave >= 3 && roll < 0.38) {
      type = 'spitter';
    } else if (this.wave >= 2 && roll < 0.65) {
      type = 'swarmer';
    }

    this.enemies.push(new Enemy(x, y, type, this.wave));
  }

  shootWeapon() {
    if (!this.player || this.player.shootCooldown > 0) return;

    const isRapid = this.player.rapidTimer > 0;
    this.player.shootCooldown = isRapid ? 0.07 : 0.14;
    this.player.recoil = 6;
    this.shotsFired++;

    const baseAngle = this.player.angle;
    const barrelDist = this.player.radius + 12;
    const startX = this.player.x + Math.cos(baseAngle) * barrelDist;
    const startY = this.player.y + Math.sin(baseAngle) * barrelDist;

    // Bullet spread angles
    const SPREADS = [
      [0],
      [-0.07, 0.07],
      [-0.18, 0, 0.18],
      [-0.32, -0.16, 0, 0.16, 0.32]
    ];
    const angles = SPREADS[Math.min(this.player.weaponLevel, SPREADS.length - 1)];

    angles.forEach(offset => {
      const a = baseAngle + offset;
      const bulletColor = this.player.rapidTimer > 0 ? '#00ff88' : '#00f0ff';
      this.bullets.push(new Bullet(startX, startY, a, 850, 1, bulletColor));
    });

    // Sound, casing, and recoil
    window.soundEngine.playShoot(this.player.weaponLevel, isRapid);
    window.particleEngine.ejectCasing(this.player.x, this.player.y, baseAngle);
    this.triggerScreenShake(1.5 + this.player.weaponLevel * 0.5);
  }

  collectPowerUp(p) {
    p.dead = true;
    window.soundEngine.playPowerup(p.type);
    window.particleEngine.addShockwave(p.x, p.y, 60, p.config.color, 0.35);
    window.particleEngine.burstSparks(p.x, p.y, p.config.color, 24);
    window.particleEngine.addFloatingText(p.x, p.y - 20, p.config.title, p.config.color, 16);

    if (p.type === 'heart') {
      if (this.player.hp < this.player.maxHp) {
        this.player.hp++;
      } else {
        this.addScore(100);
      }
    } else if (p.type === 'weapon') {
      if (this.player.weaponLevel < 3) {
        this.player.weaponLevel++;
      } else {
        this.addScore(250);
      }
    } else if (p.type === 'rapid') {
      this.player.rapidTimer = 8.0;
    } else if (p.type === 'shield') {
      this.player.shieldTimer = 7.0;
    } else if (p.type === 'nuke') {
      // EMP wipe
      window.soundEngine.playNuke();
      this.triggerScreenShake(20);
      window.particleEngine.addShockwave(this.player.x, this.player.y, 800, '#ff6600', 0.8);

      for (const e of this.enemies) {
        e.dead = true;
        this.kills++;
        this.addScore(e.scoreValue);
        window.particleEngine.burstSparks(e.x, e.y, e.color, 20);
        window.particleEngine.addScorchDecal(e.x, e.y, 30);
      }
      this.enemies = [];
    }
  }

  addScore(points) {
    this.score += points * this.multiplier;
    this.comboTimer = 2.5;
    this.multiplier = Math.min(4, this.multiplier + 0.1);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.gridPulse += dt * 2;

    // Decay combo multiplier
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.multiplier = 1;
      }
    }

    // Decay shake
    this.shake *= Math.pow(0.05, dt);

    // Player update
    this.player.update(dt, window.inputManager, this.canvas);

    // Fire weapon if mouse held
    if (window.inputManager.mouse.isDown) {
      this.shootWeapon();
    }

    // Waves logic
    if (this.breakTimer > 0) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.wave++;
        this.enemiesToSpawn = 6 + this.wave * 4;
        this.spawnTimer = 0;
        this.waveAnnounceText = `WAVE ${this.wave}`;
        this.waveAnnounceTimer = 2.0;
        window.soundEngine.playWaveStart();
      }
    } else if (this.enemiesToSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.enemiesToSpawn--;
        this.spawnTimer = Math.max(0.18, 1.0 - this.wave * 0.05);
      }
    } else if (this.enemies.length === 0) {
      // Wave cleared!
      this.breakTimer = 3.5;
      this.waveAnnounceText = `WAVE ${this.wave} CLEARED!`;
      this.waveAnnounceTimer = 2.5;
      window.soundEngine.playPowerup();

      // Spawn guaranteed powerup in arena center area
      const types = ['heart', 'weapon', 'rapid', 'shield', 'nuke'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const px = this.canvas.width / 2 + (Math.random() - 0.5) * 200;
      const py = this.canvas.height / 2 + (Math.random() - 0.5) * 200;
      this.powerups.push(new PowerUp(px, py, chosenType));
    }

    if (this.waveAnnounceTimer > 0) {
      this.waveAnnounceTimer -= dt;
    }

    // Update bullets
    for (const b of this.bullets) {
      b.update(dt);
      if (b.x < -30 || b.x > this.canvas.width + 30 || b.y < -30 || b.y > this.canvas.height + 30) {
        b.dead = true;
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);

    // Update enemy projectiles
    for (const eb of this.enemyBullets) {
      eb.update(dt);
      if (eb.x < -30 || eb.x > this.canvas.width + 30 || eb.y < -30 || eb.y > this.canvas.height + 30) {
        eb.dead = true;
      }

      // Check collision with player
      const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
      if (dist < eb.radius + this.player.radius) {
        eb.dead = true;
        this.player.takeDamage(eb.damage);
        this.triggerScreenShake(7);
        if (this.player.hp <= 0) this.onGameOver();
      }
    }
    this.enemyBullets = this.enemyBullets.filter(eb => !eb.dead);

    // Update enemies
    for (const e of this.enemies) {
      e.update(dt, this.player, (x, y, angle, speed, color, dmg) => {
        this.enemyBullets.push(new EnemyProjectile(x, y, angle, speed, color, dmg));
        window.soundEngine.playShoot(0);
      });

      // Bullets vs Enemy
      for (const b of this.bullets) {
        if (b.dead) continue;
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius + 2) {
          b.dead = true;
          this.shotsHit++;
          const died = e.takeDamage(b.damage);

          window.particleEngine.burstSparks(b.x, b.y, '#ffffff', 5, 80, 200);

          if (died) {
            this.kills++;
            this.addScore(e.scoreValue);
            this.triggerScreenShake(e.type === 'tank' ? 12 : 5);

            window.soundEngine.playExplosion(e.type === 'tank' ? 1.6 : 0.8);
            window.particleEngine.burstSparks(e.x, e.y, e.color, 26, 120, 380);
            window.particleEngine.puffSmoke(e.x, e.y, 8, 16);
            window.particleEngine.addScorchDecal(e.x, e.y, e.radius * 1.2);
            window.particleEngine.addFloatingText(e.x, e.y - 10, `+${e.scoreValue * this.multiplier}`, '#ffd000', 14);

            // Chance to drop powerup
            const dropChance = e.type === 'tank' ? 0.85 : 0.08;
            if (Math.random() < dropChance) {
              const types = ['heart', 'weapon', 'rapid', 'shield', 'nuke'];
              const chosen = types[Math.floor(Math.random() * types.length)];
              this.powerups.push(new PowerUp(e.x, e.y, chosen));
            }
          }
          break;
        }
      }

      // Enemy vs Player collision
      if (!e.dead) {
        const pDist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (pDist < e.radius + this.player.radius) {
          e.dead = true;
          this.player.takeDamage(1);
          this.triggerScreenShake(12);

          window.particleEngine.burstSparks(e.x, e.y, e.color, 22);
          window.particleEngine.addScorchDecal(e.x, e.y, 20);

          if (this.player.hp <= 0) {
            this.onGameOver();
            break;
          }
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // Update powerups
    for (const p of this.powerups) {
      p.update(dt, this.player);
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < p.radius + this.player.radius + 6) {
        this.collectPowerUp(p);
      }
    }
    this.powerups = this.powerups.filter(p => !p.dead);

    // Update FX
    window.particleEngine.update(dt, this.canvas.width, this.canvas.height);

    // Update UI
    window.uiController.updateHUD(
      this.player,
      this.wave,
      this.enemies.length + this.enemiesToSpawn,
      this.score,
      Math.floor(this.multiplier)
    );
  }

  onGameOver() {
    this.state = 'GAMEOVER';
    window.soundEngine.playGameOver();
    this.triggerScreenShake(16);

    window.uiController.showGameOver({
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit
    });
  }

  drawArenaGrid() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gridSize = 60;

    // Dark high-tech sci-fi grid
    ctx.save();
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.beginPath();

    for (let x = 0; x <= w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Pulse intersection dots
    const pulseAlpha = (Math.sin(this.gridPulse) * 0.5 + 0.5) * 0.15 + 0.05;
    ctx.fillStyle = `rgba(0, 240, 255, ${pulseAlpha})`;
    for (let x = gridSize; x < w; x += gridSize * 2) {
      for (let y = gridSize; y < h; y += gridSize * 2) {
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }

    // Boundary energy perimeter
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.restore();
  }

  // Draw offscreen enemy danger indicators
  drawOffscreenIndicators() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const margin = 26;

    for (const e of this.enemies) {
      if (e.x >= 0 && e.x <= w && e.y >= 0 && e.y <= h) continue;

      const angle = Math.atan2(e.y - (this.player ? this.player.y : h / 2), e.x - (this.player ? this.player.x : w / 2));
      const ix = Math.max(margin, Math.min(w - margin, (this.player ? this.player.x : w / 2) + Math.cos(angle) * (w / 2)));
      const iy = Math.max(margin, Math.min(h - margin, (this.player ? this.player.y : h / 2) + Math.sin(angle) * (h / 2)));

      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(angle);
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  draw() {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.shake > 0.5) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(sx, sy);
    }

    // 1. Arena Grid Floor
    this.drawArenaGrid();

    // 2. Ground decals and shell casings
    window.particleEngine.drawGroundLayer(ctx);

    // 3. Powerups
    for (const p of this.powerups) p.draw(ctx);

    // 4. Bullets & Projectiles
    for (const b of this.bullets) b.draw(ctx);
    for (const eb of this.enemyBullets) eb.draw(ctx);

    // 5. Enemies
    for (const e of this.enemies) e.draw(ctx);

    // 6. Player
    if (this.player && this.state !== 'GAMEOVER') {
      this.player.draw(ctx);
    }

    // 7. Air particles, shockwaves, smoke, floating text
    window.particleEngine.drawAirLayer(ctx);

    // 8. Offscreen danger chevrons
    this.drawOffscreenIndicators();

    // 9. Wave Announcement banner overlay
    if (this.waveAnnounceTimer > 0) {
      const alpha = Math.min(1, this.waveAnnounceTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.font = '900 48px "Orbitron", monospace';
      ctx.fillStyle = '#ffd000';
      ctx.shadowColor = '#ffd000';
      ctx.shadowBlur = 25;
      ctx.fillText(this.waveAnnounceText, this.canvas.width / 2, this.canvas.height / 3);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.Game = Game;
