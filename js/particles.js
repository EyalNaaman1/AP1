/**
 * Cyber Survivor - Advanced Particle & FX Engine
 * Realistic sparks, smoke trails, bullet casings, ground scorch decals, shockwaves, and floating combat text.
 */
class ParticleEngine {
  constructor() {
    this.particles = [];
    this.decals = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.casings = [];
    this.ambientMotes = [];

    this.initAmbientMotes(35);
  }

  initAmbientMotes(count) {
    for (let i = 0; i < count; i++) {
      this.ambientMotes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#00f0ff' : '#00ff88'
      });
    }
  }

  // Directional or omni sparks
  burstSparks(x, y, color = '#00f0ff', count = 16, speedMin = 80, speedMax = 320, angle = null, spread = Math.PI * 2) {
    for (let i = 0; i < count; i++) {
      const a = angle !== null ? angle + (Math.random() - 0.5) * spread : Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const life = 0.25 + Math.random() * 0.4;

      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        color,
        size: Math.random() * 2.5 + 1.5,
        life,
        maxLife: life
      });
    }
  }

  // Soft expanding smoke / explosion puff
  puffSmoke(x, y, count = 8, size = 12, color = 'rgba(100, 120, 140, 0.4)') {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 45;
      const life = 0.6 + Math.random() * 0.5;

      this.particles.push({
        type: 'smoke',
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        color,
        size: size * (0.6 + Math.random() * 0.6),
        growth: 24,
        life,
        maxLife: life
      });
    }
  }

  // Eject brass bullet shell casing
  ejectCasing(x, y, gunAngle) {
    const a = gunAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const speed = 70 + Math.random() * 60;

    this.casings.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 20,
      life: 6.0,
      maxLife: 6.0
    });
  }

  // Ground scorch decal from heavy impact or explosion
  addScorchDecal(x, y, radius = 24) {
    if (this.decals.length > 80) this.decals.shift();
    this.decals.push({
      x,
      y,
      radius: radius * (0.8 + Math.random() * 0.4),
      alpha: 0.65,
      life: 25.0,
      maxLife: 25.0,
      color: '#020306'
    });
  }

  // Shockwave ring
  addShockwave(x, y, maxRadius = 90, color = '#00f0ff', duration = 0.4) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      life: duration,
      maxLife: duration
    });
  }

  // Floating text / Damage popup
  addFloatingText(x, y, text, color = '#ffffff', fontSize = 16) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      life: 0.85,
      maxLife: 0.85,
      vy: -45
    });
  }

  update(dt, width, height) {
    // 1. Ambient motes
    for (const m of this.ambientMotes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 0) m.x = width;
      if (m.x > width) m.x = 0;
      if (m.y < 0) m.y = height;
      if (m.y > height) m.y = 0;
    }

    // 2. Decals decay
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.decals.splice(i, 1);
      }
    }

    // 3. Casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= Math.pow(0.1, dt);
      c.vy *= Math.pow(0.1, dt);
      c.angle += c.vRot * dt;
      c.vRot *= Math.pow(0.2, dt);
      c.life -= dt;
      if (c.life <= 0) {
        this.casings.splice(i, 1);
      }
    }

    // 4. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      const progress = 1 - (s.life / s.maxLife);
      s.radius = 5 + progress * (s.maxRadius - 5);
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 5. Particles (sparks & smoke)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.4, dt);
      p.vy *= Math.pow(0.4, dt);
      if (p.growth) p.size += p.growth * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 6. Floating combat text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Render ground layer (decals, shell casings)
  drawGroundLayer(ctx) {
    // Decals
    for (const d of this.decals) {
      const alpha = (d.life / d.maxLife) * d.alpha;
      ctx.save();
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(2, 4, 8, ${alpha})`;
      ctx.fill();

      // Inner burn core
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10, 15, 25, ${alpha * 0.8})`;
      ctx.fill();
      ctx.restore();
    }

    // Bullet Casings on ground
    for (const c of this.casings) {
      const alpha = Math.min(1, c.life);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#ffd000';
      ctx.fillRect(-3, -1.2, 6, 2.4);
      ctx.restore();
    }
  }

  // Render air layer (shockwaves, smoke, sparks, damage numbers)
  drawAirLayer(ctx) {
    // Ambient dust motes
    for (const m of this.ambientMotes) {
      ctx.save();
      ctx.globalAlpha = m.alpha;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shockwaves
    for (const s of this.shockwaves) {
      const alpha = (s.life / s.maxLife);
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.lineWidth = 3 * alpha;
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, progress));

      if (p.type === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        // Draw spark line along velocity
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 10) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Floating text
    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${ft.fontSize}px 'Orbitron', monospace`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
    this.decals = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.casings = [];
  }
}

window.particleEngine = new ParticleEngine();
