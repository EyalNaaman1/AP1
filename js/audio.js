/**
 * Cyber Survivor - Audio Synthesis Engine
 * Generates dynamic, punchy sci-fi sound effects and ambient drone using the Web Audio API.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.volume = 0.5;
    this.isMuted = false;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbientDrone();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  startAmbientDrone() {
    if (!this.ctx || this.ambientOsc1) return;
    const now = this.ctx.currentTime;

    // Sub-bass drone
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.setValueAtTime(55, now); // A1 note

    // Modulated detuned warmth
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'sawtooth';
    this.ambientOsc2.frequency.setValueAtTime(54.5, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);

    this.ambientOsc1.connect(filter);
    this.ambientOsc2.connect(filter);
    filter.connect(this.ambientGain);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
  }

  // --- Sound Effects ---

  // Weapon fire sounds with distinct signatures
  playShoot(weaponLevel = 0, isRapid = false) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (weaponLevel === 0) {
      // Crisp laser bolt
      osc.type = 'square';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (weaponLevel === 1) {
      // Twin plasma shot
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (weaponLevel === 2) {
      // Heavy spread discharge
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      // Max Rail-burst
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  // Dash phase whoosh
  playDash() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Enemy hit tick feedback
  playEnemyHit() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Explosion sound with rumble and noise synthesis
  playExplosion(intensity = 1) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.25 * intensity;

    // Bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160 * intensity, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + duration);

    gain.gain.setValueAtTime(0.25 * Math.min(intensity, 1.8), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Player damaged impact
  playPlayerHurt() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Powerup acquisition chime
  playPowerup(type = 'default') {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  // Screen-clearing EMP Nuke
  playNuke() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // Wave horn
  playWaveStart() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Game over sound
  playGameOver() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [330, 311, 293, 277];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.2;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  playClick() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

window.soundEngine = new SoundEngine();
