/**
 * Runtime-synthesized sound effects via the Web Audio API.
 *
 * Why synthesize instead of shipping audio files:
 *   - zero external dependencies, zero bundle growth
 *   - perfect for the jam's instant-start requirement (no loading)
 *   - no license paperwork for sourced samples
 *
 * Browsers require audio contexts to be created after a user gesture, so the
 * context is lazily initialized on the first `playSfx` call.
 */

export type SfxName =
  | 'click'
  | 'buy'
  | 'sell'
  | 'reroll'
  | 'attack_melee'
  | 'attack_ranged'
  | 'hit'
  | 'repair'
  | 'win'
  | 'lose'
  | 'victory'
  | 'ultimate'
  | 'skill_acquire'
  | 'shield_block'
  | 'dodge'
  | 'combo';

const MASTER_GAIN = 0.25;

type AudioCtxCtor = typeof AudioContext;
interface WindowWithWebkit extends Window {
  readonly webkitAudioContext?: AudioCtxCtor;
}

class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  setMuted(flag: boolean): void {
    this.muted = flag;
  }

  private ensure(): boolean {
    if (this.muted) return false;
    if (typeof window === 'undefined') return false;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    }
    try {
      const win = window as unknown as WindowWithWebkit;
      const Ctor: AudioCtxCtor | undefined = window.AudioContext ?? win.webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      const master = this.ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(this.ctx.destination);
      this.master = master;
      return true;
    } catch {
      return false;
    }
  }

  play(name: SfxName, pitch = 1): void {
    if (!this.ensure() || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'click':
        this.pluck(now, 520, 0.05, 'square', 0.18);
        break;
      case 'buy':
        this.chime(now, [440, 660], 0.1, 0.2);
        break;
      case 'sell':
        this.pluck(now, 260, 0.09, 'triangle', 0.22);
        break;
      case 'reroll':
        this.sweep(now, 200, 520, 0.14, 0.18);
        break;
      case 'attack_melee':
        this.noise(now, 0.08, 0.22, 1800);
        break;
      case 'attack_ranged':
        this.sweep(now, 800, 180, 0.12, 0.2);
        break;
      case 'hit':
        this.noise(now, 0.1, 0.28, 600);
        break;
      case 'repair':
        this.chime(now, [520, 780], 0.12, 0.18);
        break;
      case 'win':
        this.chime(now, [523, 659, 784], 0.18, 0.22);
        break;
      case 'lose':
        this.sweep(now, 260, 80, 0.35, 0.22);
        break;
      case 'victory':
        this.chime(now, [523, 659, 784, 1046], 0.22, 0.25);
        break;
      case 'ultimate':
        this.pluck(now, 60, 0.3, 'sine', 0.3);
        this.sweep(now + 0.05, 80, 600, 0.4, 0.2);
        break;
      case 'skill_acquire':
        this.chime(now, [440, 554, 659, 880], 0.14, 0.2);
        break;
      case 'shield_block':
        this.noise(now, 0.06, 0.3, 2400);
        this.pluck(now, 1200, 0.08, 'square', 0.15);
        break;
      case 'dodge':
        this.sweep(now, 400, 1200, 0.08, 0.15);
        break;
      case 'combo':
        this.pluck(now, 600 * pitch, 0.04, 'square', 0.18);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // Synthesis primitives
  // --------------------------------------------------------------------------

  private pluck(
    when: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number
  ): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private chime(when: number, freqs: readonly number[], dur: number, gain: number): void {
    freqs.forEach((f, i) => this.pluck(when + i * 0.05, f, dur, 'sine', gain));
  }

  private sweep(
    when: number,
    from: number,
    to: number,
    dur: number,
    gain: number
  ): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + dur);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private noise(when: number, dur: number, gain: number, filterFreq: number): void {
    if (!this.ctx || !this.master) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }
}

const bus = new AudioBus();

export const playSfx = (name: SfxName, pitch = 1): void => bus.play(name, pitch);
export const setSfxMuted = (flag: boolean): void => bus.setMuted(flag);
