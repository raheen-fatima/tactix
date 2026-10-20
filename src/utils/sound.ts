class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
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

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.07) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public move() {
    this.playTone(440, 0.08, 'triangle', 0.06);
  }

  public eat() {
    this.playTone(620, 0.09, 'sine', 0.06);
    setTimeout(() => this.playTone(840, 0.1, 'sine', 0.05), 55);
  }

  public matchFound() {
    this.playTone(523.25, 0.12, 'triangle', 0.07);
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.07), 90);
    setTimeout(() => this.playTone(783.99, 0.18, 'triangle', 0.07), 180);
  }

  public win() {
    this.playTone(523.25, 0.12, 'sine', 0.07);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.07), 100);
    setTimeout(() => this.playTone(783.99, 0.14, 'sine', 0.07), 200);
    setTimeout(() => this.playTone(1046.5, 0.25, 'sine', 0.08), 310);
  }

  public lose() {
    this.playTone(340, 0.14, 'sawtooth', 0.04);
    setTimeout(() => this.playTone(260, 0.22, 'sawtooth', 0.04), 130);
  }

  public draw() {
    this.playTone(440, 0.12, 'sine', 0.05);
    setTimeout(() => this.playTone(440, 0.15, 'sine', 0.05), 140);
  }
}

export const sfx = new SoundEffects();
