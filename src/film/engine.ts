import * as THREE from "three";
import type { CrewMember } from "../crew";
import { grade } from "./post";
import type { Cue, FilmSet, Frame, Grade } from "./kit";

/**
 * A short film is a list of scenes on a fixed timeline. Each scene builds its
 * own set; the Film poses whichever one is on screen and fires the cues that
 * fall between two frames.
 */
export type Caption = { u0: number; u1: number; en: string; vi: string };
export type Credit = { title: string; vi: string; role: string; roleVi: string };
export type SceneDef = {
  id: string;
  t0: number;
  t1: number;
  build: () => FilmSet;
  member?: CrewMember;
  credit?: Credit;
  captions: Caption[];
};

export class Film {
  private sets: FilmSet[];
  private events: { t: number; cue: Cue; scene: number }[] = [];
  private cursor = 0;
  private last = -1;
  private cues: Cue[] = [];

  constructor(private SCENES: SceneDef[], globalCues: [number, Cue][] = []) {
    this.sets = this.SCENES.map((s) => s.build());
    this.SCENES.forEach((s, i) => this.sets[i].cues.forEach(([u, cue]) => this.events.push({ t: s.t0 + u, cue, scene: i })));
    globalCues.forEach(([t, cue]) => this.events.push({ t, cue, scene: -1 }));
    this.events.sort((a, b) => a.t - b.t);
  }

  get scenes() { return this.sets.map((s) => s.scene); }

  index(t: number) {
    const i = this.SCENES.findIndex((s) => t < s.t1);
    return i < 0 ? this.SCENES.length - 1 : i;
  }

  seek(t: number) {
    this.cursor = this.events.findIndex((e) => e.t > t);
    if (this.cursor < 0) this.cursor = this.events.length;
    this.last = t;
  }

  drainCues() { const c = this.cues; this.cues = []; return c; }

  update(t: number, fire = true): { scene: THREE.Scene; frame: Frame; grade: Grade; index: number; local: number } {
    if (fire) {
      if (t < this.last) this.seek(t);
      while (this.cursor < this.events.length && this.events[this.cursor].t <= t) this.cues.push(this.events[this.cursor++].cue);
    }
    this.last = t;
    const index = this.index(t);
    const local = Math.min(t, this.SCENES[index].t1 - 1e-3) - this.SCENES[index].t0;
    const frame = this.sets[index].update(local);
    return { scene: this.sets[index].scene, frame, grade: grade(frame.grade), index, local };
  }

  /** Poses each set at its first frame so the renderer can compile every shader up front. */
  prime(each: (scene: THREE.Scene, frame: Frame) => void) {
    this.SCENES.forEach((s, i) => each(this.sets[i].scene, this.sets[i].update(s.t1 - s.t0 - 0.5)));
  }
}
