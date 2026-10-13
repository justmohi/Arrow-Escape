class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Lazily init AudioContext upon first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setConfig(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Soft tactile button click
  public playClick() {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.04);

      const targetVol = 0.15 * this.volume;
      gain.gain.setValueAtTime(targetVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context error ignore
    }
  }

  // Satisfying escape whoosh with gentle pitch elevation based on combo count
  public playEscape(combo: number = 0) {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const baseFreq = 440 + Math.min(combo * 45, 600);
      const now = ctx.currentTime;

      // Primary tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

      const targetVol = 0.28 * this.volume;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);

      // Subtle high harmonic sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.15);

      gain2.gain.setValueAtTime(targetVol * 0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now);
      osc2.stop(now + 0.2);
    } catch {
      // Audio context error ignore
    }
  }

  // Blocked thud / recoil buzz
  public playBlocked() {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      const targetVol = 0.22 * this.volume;
      gain.gain.setValueAtTime(targetVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      // Low pass filter to make it dull/thudding rather than harsh
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio context error ignore
    }
  }

  // Undo rewind sound
  public playUndo() {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

      const targetVol = 0.18 * this.volume;
      gain.gain.setValueAtTime(targetVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio context error ignore
    }
  }

  // Hint bell chime
  public playHint() {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const frequencies = [659.25, 880, 1046.5]; // E5, A5, C6 bell
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const targetVol = (0.16 / frequencies.length) * this.volume;
        gain.gain.setValueAtTime(targetVol, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    } catch {
      // Audio context error ignore
    }
  }

  // Celebratory victory fanfare arpeggio
  public playVictory() {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const startTime = now + index * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = index === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        const targetVol = 0.22 * this.volume;
        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(targetVol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (index === notes.length - 1 ? 0.7 : 0.4));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
    } catch {
      // Audio context error ignore
    }
  }

  // Star ding
  public playStar(starIndex: number) {
    if (!this.enabled || this.volume === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitches = [783.99, 1046.5, 1318.51]; // G5, C6, E6
      const freq = pitches[starIndex] || 1046.5;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const targetVol = 0.25 * this.volume;
      gain.gain.setValueAtTime(targetVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio context error ignore
    }
  }
}

export const soundManager = new SoundManager();
