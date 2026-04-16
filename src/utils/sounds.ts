class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playFlip() {
    this.playTone(600, 'sine', 0.1, 0.1);
  }

  playVoltorb() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const duration = 0.5;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const noise = this.ctx.createBufferSource();
    
    // Simple noise-like explosion
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playWin() {
    const now = this.ctx?.currentTime || 0;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.1), i * 150);
    });
  }

  playMemo() {
    this.playTone(300, 'sine', 0.05, 0.05);
  }
}

export const sounds = new SoundService();
