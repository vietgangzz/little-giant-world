/**
 * Sampled audio only: music beds are Kevin MacLeod tracks (CC BY 4.0), every
 * effect is a recorded Kenney sample (CC0). Nothing here is synthesised; the
 * Tenet effects are the same recordings, played backwards.
 */
export const PLANET_SOUNDS = [
  "carefree", "pop-1", "pop-2", "hop", "land", "whoosh", "ding", "gong", "takeoff-sax", "finale-sax",
  ...Array.from({ length: 10 }, (_, i) => `pickup-${i % 9}`),
];

export class Sound {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private loading: Promise<void> | null = null;
  private reversed = new Map<string, AudioBuffer>();
  muted = false;

  constructor(private names: string[] = PLANET_SOUNDS, private musicName = "carefree") {}

  /** Must be called from a user gesture: browsers only start audio after one. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
    }
    void this.ctx.resume();
    this.loading ??= Promise.all([...new Set(this.names)].map(async (name) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}audio/${name}.mp3`);
        this.buffers.set(name, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
      } catch {
        // a missing clip should never stop the show
      }
    })).then(() => undefined);
    return this.loading;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  /** The same recording, sample order flipped: Tenet's inverted sound. */
  private backwards(name: string, buffer: AudioBuffer) {
    const hit = this.reversed.get(name);
    if (hit || !this.ctx) return hit ?? buffer;
    const copy = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) copy.getChannelData(c).set(Float32Array.from(buffer.getChannelData(c)).reverse());
    this.reversed.set(name, copy);
    return copy;
  }

  play(name: string, volume = 0.8, options: { rate?: number; reverse?: boolean } = {}) {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx || !this.master) return;
    const src = this.ctx.createBufferSource();
    src.buffer = options.reverse ? this.backwards(name, buffer) : buffer;
    src.playbackRate.value = options.rate ?? 1;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.master);
    src.start();
  }

  /** Starts the bed at a given offset so a scrubbed story stays in sync. */
  startMusic(offset = 0, volume = 0.55) {
    this.stopMusic();
    const buffer = this.buffers.get(this.musicName);
    if (!buffer || !this.ctx || !this.musicGain) return;
    this.music = this.ctx.createBufferSource();
    this.music.buffer = buffer;
    this.music.connect(this.musicGain);
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.music.start(0, Math.max(0, Math.min(offset, buffer.duration - 0.1)));
  }
  fadeMusic(seconds: number) {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 4);
  }
  duck(volume: number, seconds = 0.8) {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(volume, this.ctx.currentTime, seconds / 4);
  }
  stopMusic() {
    try { this.music?.stop(); } catch { /* already stopped */ }
    this.music = null;
  }
}
