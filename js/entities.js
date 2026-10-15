/**
 * Cyber Survivor - Entity Models & Realistic Rendering
 * High-fidelity vector rendering for Player Mech, Enemy Drones, Bullets, and Power-ups.
 */

// Player Combat Mech
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.angle = 0;

    this.maxHp = 5;
    this.hp = 3;

    this.weaponLevel = 0; // 0: Blaster, 1: Dual Plasma, 2: Tri-Spread, 3: Rail-Barrage
    this.shootCooldown = 0;
    this.rapidTimer = 0;
    this.shieldTimer = 0;

    // Tactical Dash mechanics
    this.dashCooldownMax = 1.8;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashDuration = 0.22;
    this.dashTimer = 0;
    this.dashSpeed = 750;
    this.dashVx = 0;
    this.dashVy = 0;

    // Visual feedback
    this.hitTimer = 0;
    this.recoil = 0;
    this.thrusterAnim = 0;
    this.dashGhosts = [];
  }

  triggerDash(dirX, dirY) {
    if (this.dashCooldown > 0 || this.isDashing) return false;

    // Dash towards movement direction or aim direction
    let dx = dirX;
    let dy = dirY;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.angle);
      dy = Math.sin(this.angle);
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = this.dashCooldownMax;
    this.dashVx = dx * this.dashSpeed;
    this.dashVy = dy * this.dashSpeed;

    window.soundEngine.playDash();
    window.particleEngine.addShockwave(this.x, this.y, 45, '#00f0ff', 0.25);
    window.particleEngine.burstSparks(this.x, this.y, '#00f0ff', 20, 100, 300);

    return true;
  }

  takeDamage(amount = 1) {
    if (this.isDashing || this.shieldTimer > 0) {
      // Deflected by shield or dodge
      window.soundEngine.playPowerup();
      window.particleEngine.burstSparks(this.x, this.y, '#00f0ff', 12);
      return false;
    }

    this.hp -= amount;
    this.hitTimer = 0.35;
    window.soundEngine.playPlayerHurt();
    window.particleEngine.burstSparks(this.x, this.y, '#ff0055', 25, 120, 350);
    window.particleEngine.puffSmoke(this.x, this.y, 10, 14, 'rgba(255, 0, 85, 0.4)');

    return true;
  }

  update(dt, input, bounds) {
    // Timers
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.rapidTimer > 0) this.rapidTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 25);
    this.thrusterAnim += dt * 15;

    // Dash update
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;

      // Leave ghost afterimage
      this.dashGhosts.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        alpha: 0.6
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = this.dashVx * 0.3;
        this.vy = this.dashVy * 0.3;
      }
    } else {
      // Normal physics
      const { dx, dy } = input.getMovementVector();
      const speed = 280;
      const smoothFactor = Math.min(1, 14 * dt);

      this.vx += (dx * speed - this.vx) * smoothFactor;
      this.vy += (dy * speed - this.vy) * smoothFactor;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Thruster exhaust particles when moving
      if (Math.hypot(this.vx, this.vy) > 30 && Math.random() < 0.6) {
        const backAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        const dist = this.radius * 0.9;
        window.particleEngine.particles.push({
          type: 'spark',
          x: this.x + Math.cos(backAngle) * dist,
          y: this.y + Math.sin(backAngle) * dist,
          vx: Math.cos(backAngle) * (60 + Math.random() * 40),
          vy: Math.sin(backAngle) * (60 + Math.random() * 40),
          color: '#00f0ff',
          size: 2,
          life: 0.2,
          maxLife: 0.2
        });
      }
    }

    // Keep inside arena boundaries
    this.x = Math.max(this.radius + 10, Math.min(bounds.width - this.radius - 10, this.x));
    this.y = Math.max(this.radius + 10, Math.min(bounds.height - this.radius - 10, this.y));

    // Update aim angle
    this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

    // Update ghost trail
    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      const g = this.dashGhosts[i];
      g.alpha -= dt * 3.5;
      if (g.alpha <= 0) this.dashGhosts.splice(i, 1);
    }
  }

  draw(ctx) {
    // 1. Draw dash afterimage ghosts
    for (const g of this.dashGhosts) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      ctx.globalAlpha = g.alpha * 0.5;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.restore();
    }

    // 2. Drop shadow
    ctx.save();
    ctx.translate(this.x + 4, this.y + 6);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 1.1, this.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // 3. Aiming Laser Sight
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.radius + 12, 0);
    ctx.lineTo(800, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 4. Main Mech Chassis
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const isHurt = this.hitTimer > 0;
    const bodyColor = isHurt ? '#ffffff' : '#0c1626';
    const accentColor = isHurt ? '#ff0055' : '#00f0ff';

    // Dual Rotary Gun Barrels (with recoil)
    const barrelOffset = this.recoil;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.radius - 2 - barrelOffset, -6, 14, 3);
    ctx.fillRect(this.radius - 2 - barrelOffset, 3, 14, 3);

    ctx.fillStyle = accentColor;
    ctx.fillRect(this.radius + 8 - barrelOffset, -7, 3, 5);
    ctx.fillRect(this.radius + 8 - barrelOffset, 2, 3, 5);

    // Armored chassis base
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(this.radius * 0.5, this.radius * 0.85);
    ctx.lineTo(-this.radius * 0.8, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.6, 0);
    ctx.lineTo(-this.radius * 0.8, -this.radius * 0.7);
    ctx.lineTo(this.radius * 0.5, -this.radius * 0.85);
    ctx.closePath();

    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Cockpit / Power Core
    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = isHurt ? '#ff0055' : (this.rapidTimer > 0 ? '#00ff88' : '#00f0ff');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fill();

    // Thruster engine glow at back
    const flameSize = 4 + Math.sin(this.thrusterAnim) * 2;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.7, -4);
    ctx.lineTo(-this.radius * 0.7 - flameSize, 0);
    ctx.lineTo(-this.radius * 0.7, 4);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    ctx.restore();

    // 5. Active Energy Shield Barrier
    if (this.shieldTimer > 0) {
      const shieldPulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
      const shieldBlink = this.shieldTimer < 2 && Math.floor(this.shieldTimer * 8) % 2;

      if (!shieldBlink) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16 * shieldPulse;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.fill();
        ctx.stroke();

        // Hex ring decoration
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + Date.now() * 0.001;
          const hx = Math.cos(a) * (this.radius + 14);
          const hy = Math.sin(a) * (this.radius + 14);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// Enemy Archetypes
class Enemy {
  constructor(x, y, type = 'chaser', wave = 1) {
    this.x = x;
    this.y = y;
    this.type = type; // 'chaser', 'swarmer', 'spitter', 'tank'
    this.dead = false;
    this.flashTimer = 0;

    // Stats configuration per type
    if (type === 'swarmer') {
      this.radius = 11;
      this.maxHp = 1;
      this.hp = 1;
      this.speed = 190 + Math.min(100, wave * 6);
      this.scoreValue = 15;
      this.color = '#ffcc00';
    } else if (type === 'tank') {
      this.radius = 28;
      this.maxHp = 5 + Math.floor(wave / 3);
      this.hp = this.maxHp;
      this.speed = 70 + Math.min(30, wave * 2);
      this.scoreValue = 50;
      this.color = '#ff0055';
      this.fireTimer = 2.5;
    } else if (type === 'spitter') {
      this.radius = 15;
      this.maxHp = 2 + Math.floor(wave / 5);
      this.hp = this.maxHp;
      this.speed = 110 + Math.min(40, wave * 3);
      this.scoreValue = 30;
      this.color = '#b537f2';
      this.fireTimer = 1.8 + Math.random() * 1.0;
    } else {
      // standard chaser drone
      this.radius = 14;
      this.maxHp = 1 + Math.floor(wave / 8);
      this.hp = this.maxHp;
      this.speed = 135 + Math.min(75, wave * 5);
      this.scoreValue = 10;
      this.color = '#ff2a5f';
    }

    this.angle = 0;
    this.legAnim = Math.random() * 10;
  }

  takeDamage(dmg = 1) {
    this.hp -= dmg;
    this.flashTimer = 0.12;
    window.soundEngine.playEnemyHit();

    if (this.hp <= 0) {
      this.dead = true;
      return true; // died
    }
    return false;
  }

  update(dt, player, onSpawnProjectile) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    this.legAnim += dt * 10;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    // Movement & Combat AI
    if (this.type === 'spitter') {
      // Keep medium distance (280px) and shoot plasma bolts
      const desiredDist = 260;
      if (dist < desiredDist - 40) {
        // Back off
        this.x -= Math.cos(this.angle) * this.speed * dt;
        this.y -= Math.sin(this.angle) * this.speed * dt;
      } else if (dist > desiredDist + 40) {
        // Approach
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
      }

      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = 2.2 + Math.random() * 0.8;
        if (onSpawnProjectile) {
          onSpawnProjectile(this.x, this.y, this.angle, 260, '#b537f2', 1);
        }
      }
    } else if (this.type === 'tank') {
      // Heavy slow approach + mortar shot
      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;

      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = 3.2;
        if (onSpawnProjectile) {
          onSpawnProjectile(this.x, this.y, this.angle, 220, '#ff0055', 1);
        }
      }
    } else {
      // Direct pursuit
      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(3, 4, this.radius * 0.9, this.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.rotate(this.angle);

    const isFlash = this.flashTimer > 0;
    const drawColor = isFlash ? '#ffffff' : this.color;

    ctx.strokeStyle = drawColor;
    ctx.shadowColor = drawColor;
    ctx.shadowBlur = isFlash ? 20 : 12;

    if (this.type === 'swarmer') {
      // Bio-crawler with animated twitching legs
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 2) {
        const legWiggle = Math.sin(this.legAnim + i) * 5;
        ctx.beginPath();
        ctx.moveTo(0, i * 6);
        ctx.lineTo(-4 + legWiggle, i * 14);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 204, 0, 0.2)';
      ctx.fill();
      ctx.stroke();

      // Glowing venom eye
      ctx.beginPath();
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
    } else if (this.type === 'tank') {
      // Heavy Tank Mech
      ctx.lineWidth = 3.5;
      ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
      ctx.fillRect(-this.radius, -this.radius * 0.7, this.radius * 2, this.radius * 1.4);
      ctx.strokeRect(-this.radius, -this.radius * 0.7, this.radius * 2, this.radius * 1.4);

      // Heavy Cannon Barrel
      ctx.fillStyle = drawColor;
      ctx.fillRect(0, -4, this.radius + 10, 8);

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fillStyle = isFlash ? '#fff' : '#111827';
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'spitter') {
      // Artillery Drone
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(181, 55, 242, 0.25)';
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.lineTo(-this.radius * 0.5, 0);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plasma emitter
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
    } else {
      // Standard Chaser Drone
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(255, 42, 95, 0.25)';
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius * 0.8, -this.radius * 0.8);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius * 0.8, this.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Visor
      ctx.fillStyle = drawColor;
      ctx.fillRect(this.radius * 0.2, -2, 4, 4);
    }

    ctx.restore();

    // Overhead Health Bar (only shown if damaged)
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = this.y - this.radius - 10;
      const pct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.color;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.restore();
    }
  }
}

// Player Projectile
class Bullet {
  constructor(x, y, angle, speed = 820, damage = 1, color = '#00f0ff') {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle;
    this.damage = damage;
    this.color = color;
    this.dead = false;
    this.radius = 4;
    this.life = 1.4;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;

    // Glowing laser bolt tracer
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
    ctx.stroke();

    // Energy bullet head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Enemy Hostile Plasma Projectile
class EnemyProjectile {
  constructor(x, y, angle, speed = 250, color = '#ff0055', damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 6;
    this.color = color;
    this.damage = damage;
    this.dead = false;
    this.pulse = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.pulse += dt * 10;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    const r = this.radius + Math.sin(this.pulse) * 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Power-up Orbs
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'heart', 'weapon', 'rapid', 'shield', 'nuke'
    this.life = 14.0;
    this.dead = false;
    this.radius = 16;
    this.bob = Math.random() * Math.PI * 2;

    const CFG = {
      heart:  { color: '#ff0055', label: '+', title: 'NANITE REPAIR' },
      weapon: { color: '#ffd000', label: 'W', title: 'WEAPON UPGRADE' },
      rapid:  { color: '#00ff88', label: 'R', title: 'OVERDRIVE' },
      shield: { color: '#00f0ff', label: 'S', title: 'FORCE SHIELD' },
      nuke:   { color: '#ff6600', label: 'N', title: 'EMP NUKE' }
    };

    this.config = CFG[type] || CFG.weapon;
  }

  update(dt, player) {
    this.life -= dt;
    this.bob += dt * 4;

    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    // Magnetism towards player when nearby
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 140) {
      const magSpeed = (1 - dist / 140) * 220;
      this.x += (dx / dist) * magSpeed * dt;
      this.y += (dy / dist) * magSpeed * dt;
    }
  }

  draw(ctx) {
    const blink = this.life < 3.5 && Math.floor(this.life * 6) % 2;
    if (blink) return;

    const offsetY = Math.sin(this.bob) * 4;

    ctx.save();
    ctx.translate(this.x, this.y + offsetY);

    // Glowing aura
    ctx.shadowColor = this.config.color;
    ctx.shadowBlur = 20;

    // Rotating orbital ring
    ctx.save();
    ctx.rotate(this.bob * 0.8);
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.radius * 0.8, -this.radius * 0.8, this.radius * 1.6, this.radius * 1.6);
    ctx.restore();

    // Central orb
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fill();
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.config.label, 0, 1);

    ctx.restore();
  }
}
