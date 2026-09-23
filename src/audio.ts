/**
 * Sampled audio only: the music bed is Kevin MacLeod's "Carefree" (CC BY 4.0),
 * every effect is a recorded Kenney sample (CC0). Nothing here is synthesised.
 */
const NAMES = [
  "carefree", "pop-1", "pop-2", "hop", "land", "whoosh", "ding", "gong", "takeoff-sax", "finale-sax",
  ...Array.from({ length: 9 }, (_, i) => `pickup-${i}`),
];

export class Sound {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private loading: Promise<void> | null = null;
  muted = false;

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
    this.loading ??= Promise.all(NAMES.map(async (name) => {
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

  play(name: string, volume = 0.8) {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx || !this.master) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.master);
    src.start();
  }

  /** Starts the bed at a given offset so a scrubbed story stays in sync. */
  startMusic(offset = 0, volume = 0.55) {
    this.stopMusic();
    const buffer = this.buffers.get("carefree");
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
  duck(volume: number) {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.2);
  }
  stopMusic() {
    try { this.music?.stop(); } catch { /* already stopped */ }
    this.music = null;
  }
}
