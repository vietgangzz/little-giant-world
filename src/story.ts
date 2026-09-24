import * as THREE from "three";
import { dressed, poodle } from "./accessories";
import { CREW, LITTLE_GIANT, type CrewMember } from "./crew";
import { Mascot } from "./mascot";
import { clamp, easeInOut, easeOutBack, lerp, smoothstep } from "./noise";
import { motorbike, tourPlane, roadFrame, Fireworks } from "./props";
import { drumPlaza, Local, worldFrame } from "./scenery";
import { PLAZA, R, WORLD, roadA, STOPS, groundPoint } from "./world";

/* ================================================================ the cast */

export { CREW, LITTLE_GIANT, type CrewMember } from "./crew";
/** How many friends wait at each stop, in the order the bike reaches them. */
const PER_STOP = [2, 2, 2, 3];

/* ============================================================ the timeline */

type Leg = { t0: number; t1: number; th0: number; th1: number; stop: boolean };
const RIDE_START = 11.0;
const legs: Leg[] = [];
export const PICKUPS: { time: number; crew: number; theta: number; side: number; stop: number }[] = [];
const STOP_PLACES = [STOPS.haGiang, STOPS.haLong, STOPS.hoiAn, STOPS.saiGon];
/** Where the friends wait: on the left of the road, looking out for the bike. */
const PICKUP_SIDE = 0.28;
{
  // the bike pops up a few steps behind the hero, so it never covers them
  let t = RIDE_START, th: number = STOPS.home - 0.035;
  const move = (dur: number, to: number, stop = false) => { legs.push({ t0: t, t1: t + dur, th0: th, th1: to, stop }); t += dur; th = to; };
  const moves = [2.4, 3.2, 3.2, 3.2];
  let crew = 0;
  STOP_PLACES.forEach((place, i) => {
    move(moves[i], place);
    for (let k = 0; k < PER_STOP[i]; k++) {
      PICKUPS.push({ time: t + 0.35 + k * 0.72, crew: crew++, theta: place + 0.012 - k * 0.024, side: PICKUP_SIDE, stop: i });
    }
    move(2.4, place, true);
  });
  move(2.6, STOPS.airport);
}
export const T = {
  dive: 5.0,
  hello: 8.6,
  bikePop: 10.2,
  mainHop: 10.5,
  ride: RIDE_START,
  arrive: legs[legs.length - 1].t1, // 35.2
  board: 35.3,
  takeoff: 36.1,
  cruise: 38.4,
  passes: [40.2, 43.4, 46.6, 49.8, 53.0],
  plaza: 55.6,
  pullOut: 58.0,
  signOff: 59.8,
  end: 65.5,
};

function bikeTheta(t: number) {
  if (t <= legs[0].t0) return legs[0].th0;
  for (const leg of legs) {
    if (t <= leg.t1) return lerp(leg.th0, leg.th1, easeInOut(clamp((t - leg.t0) / (leg.t1 - leg.t0))));
  }
  return STOPS.airport;
}
/** 0 while riding, 1 while parked at a pickup, with soft shoulders either side. */
function stopWeight(t: number) {
  let w = 0;
  for (const leg of legs) {
    if (!leg.stop) continue;
    w = Math.max(w, smoothstep(leg.t0 - 0.9, leg.t0 + 0.1, t) * (1 - smoothstep(leg.t1 - 0.2, leg.t1 + 0.7, t)));
  }
  return w;
}

const PLANE_THETA = STOPS.airport + 0.07;
/** Everyone who gathers round the drum at the end: the crew plus one friend per city. */
const RING = CREW.length + WORLD.length;
const PLANE_SCALE = 0.7;
const BIKE_SCALE = 1.35;
/** Mascots ride the plane a little smaller than life, or ten of them would not fit. */
const PLANE_SEAT = 0.11;

/** Plane waypoints: [time, direction, altitude above R]. */
function planeKeys(): [number, THREE.Vector3, number][] {
  const deck = roadA.surface(PLANE_THETA) - R + 0.16;
  return [
    [T.takeoff, roadA.dir(PLANE_THETA), deck],
    [T.takeoff + 1.1, roadA.dir(PLANE_THETA + 0.11), deck + 0.05],
    [T.cruise, roadA.dir(PLANE_THETA + 0.45), 1.6],
    [T.passes[0], WORLD[0].dir, 1.55],
    [T.passes[1], WORLD[1].dir, 1.75],
    [T.passes[2], WORLD[2].dir, 1.5],
    [T.passes[3], WORLD[3].dir, 1.8],
    [T.passes[4], WORLD[4].dir, 1.6],
    [T.plaza, PLAZA, 1.6],
    [T.plaza + 3, PLAZA.clone().add(new THREE.Vector3(0.9, -0.2, 0.6)).normalize(), 5],
  ];
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
function catmull(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, u: number, out: THREE.Vector3) {
  const u2 = u * u, u3 = u2 * u;
  return out.set(0, 0, 0)
    .addScaledVector(p0, -0.5 * u3 + u2 - 0.5 * u)
    .addScaledVector(p1, 1.5 * u3 - 2.5 * u2 + 1)
    .addScaledVector(p2, -1.5 * u3 + 2 * u2 + 0.5 * u)
    .addScaledVector(p3, 0.5 * u3 - 0.5 * u2);
}

/** A smooth path over the globe: directions are splined, then pushed out to altitude. */
export class SkyPath {
  constructor(private keys: [number, THREE.Vector3, number][], private loop = false) {}
  at(t: number, out = new THREE.Vector3()) {
    const k = this.keys, n = k.length;
    let i = 0;
    if (this.loop) {
      const span = k[n - 1][0] - k[0][0];
      t = k[0][0] + ((((t - k[0][0]) % span) + span) % span);
    }
    t = clamp(t, k[0][0], k[n - 1][0]);
    while (i < n - 2 && t > k[i + 1][0]) i++;
    const u = (t - k[i][0]) / (k[i + 1][0] - k[i][0] || 1);
    const get = (j: number) => this.loop ? k[(j + n - 1) % (n - 1)][1] : k[clamp(j, 0, n - 1)][1];
    catmull(get(i - 1), get(i), get(i + 1), get(i + 2), u, out).normalize();
    // cruise a little higher mid-leg, as if climbing over the curve
    const alt = lerp(k[i][2], k[i + 1][2], smoothstep(0, 1, u)) + Math.sin(u * Math.PI) * (i > 1 ? 0.8 : 0);
    return out.multiplyScalar(R + alt);
  }
  frame(t: number, obj: THREE.Object3D, bank = 1) {
    const p = this.at(t, _a);
    const q = this.at(t + 0.05, _b);
    const r = this.at(t + 0.1, _c);
    obj.position.copy(p);
    const fwd = _d.copy(q).sub(p);
    if (fwd.lengthSq() < 1e-8) return;
    fwd.normalize();
    const up = p.clone().normalize();
    const f = fwd.clone().sub(up.clone().multiplyScalar(fwd.dot(up))).normalize();
    const turn = r.clone().sub(q).normalize().sub(fwd).dot(new THREE.Vector3().crossVectors(up, f));
    const x = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const y = new THREE.Vector3().crossVectors(fwd, x);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, fwd));
    obj.rotateZ(clamp(turn * 25 * bank, -0.5, 0.5));
  }
}

/* ============================================================= captions */

export type Caption = { t0: number; t1: number; en: string; vi: string };
export const CAPTIONS: Caption[] = [
  { t0: 0.7, t1: 4.9, en: "Somewhere out there spins a very small planet…", vi: "Ở đâu đó, có một hành tinh bé xíu…" },
  { t0: 5.2, t1: 8.4, en: "…and up in Hà Giang lives one Little Giant…", vi: "…và trên Hà Giang có một Little Giant…" },
  { t0: 8.6, t1: 10.9, en: "…with one BIG plan.", vi: "…ôm một kế hoạch to đùng." },
  { t0: 11.0, t1: 13.3, en: "Step 1: round up the crew.", vi: "Bước 1: gom đủ hội anh em." },
  { t0: 13.5, t1: 15.9, en: "Hà Giang — two hop on!", vi: "Hà Giang — thêm hai đứa!" },
  { t0: 16.2, t1: 18.9, en: "Down the coast to Hạ Long Bay…", vi: "Xuôi về vịnh Hạ Long…" },
  { t0: 19.1, t1: 21.5, en: "…scenic pickup, two more!", vi: "…đón khách view đẹp, thêm hai!" },
  { t0: 21.8, t1: 24.5, en: "Hội An lights up for the road trip.", vi: "Hội An lên đèn tiễn chuyến đi." },
  { t0: 24.7, t1: 27.1, en: "Lanterns, and two latecomers.", vi: "Đèn lồng, và hai đứa đi trễ." },
  { t0: 27.4, t1: 30.1, en: "Sài Gòn — three more squeeze on!", vi: "Sài Gòn — chen thêm ba đứa!" },
  { t0: 30.3, t1: 35.2, en: "Ten on one xe máy. Totally normal.", vi: "Mười đứa một xe. Chuyện thường ở huyện." },
  { t0: 35.4, t1: 38.3, en: "Step 2: take the crew EVERYWHERE.", vi: "Bước 2: đưa cả hội đi khắp thế giới." },
  { t0: 38.8, t1: 41.6, en: "Singapore — hello, Merlion!", vi: "Singapore — chào Merlion!" },
  { t0: 42.0, t1: 44.8, en: "Tokyo — konnichiwa, Fuji-san!", vi: "Tokyo — konnichiwa, núi Phú Sĩ!" },
  { t0: 45.2, t1: 48.0, en: "Cairo — pyramids: checked.", vi: "Cairo — kim tự tháp: đã ghé." },
  { t0: 48.4, t1: 51.2, en: "Paris — bonjour, Eiffel!", vi: "Paris — bonjour, tháp Eiffel!" },
  { t0: 51.6, t1: 54.4, en: "New York — the torch says hi.", vi: "New York — bà Tự Do vẫy tay chào." },
  { t0: 55.6, t1: 59.6, en: "Tiny planet. Big crew. Whole world.", vi: "Hành tinh nhỏ. Hội lớn. Cả thế giới." },
];
export const CHAPTERS = [
  { t: 11.0, label: "CH.1 · THE CREW", vi: "Gom hội" },
  { t: 35.4, label: "CH.2 · THE WORLD", vi: "Vươn ra thế giới" },
  { t: 55.6, label: "CH.3 · HOME", vi: "Về nhà" },
];

/* ============================================================== the story */

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; up: THREE.Vector3; stiffness: number; fov: number };
export type Cue =
  | { kind: "sfx"; name: string; volume?: number }
  | { kind: "pop"; at: THREE.Vector3; text?: string }
  | { kind: "toast"; member: CrewMember | null; text: string; color: number }
  | { kind: "stamp"; text: string }
  | { kind: "count"; crew: number; friends: number }
  | { kind: "signoff" };

type Timed = { t: number; fire: () => void };
/**
 * Moves between two camera positions along an arc around a subject, so the
 * distance changes monotonically. A straight line between two far-apart
 * framings can dive right over the subject's head on the way.
 */
function arcAround(center: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, k: number) {
  const ra = a.clone().sub(center), rb = b.clone().sub(center);
  const dir = ra.clone().normalize().applyQuaternion(
    new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(ra.clone().normalize(), rb.clone().normalize()), k));
  return center.clone().addScaledVector(dir, lerp(ra.length(), rb.length(), k));
}
/** Right-handed orientation for something with +Y up and +Z forward. */
function basis(up: THREE.Vector3, fwd: THREE.Vector3) {
  const f = fwd.clone().sub(up.clone().multiplyScalar(fwd.dot(up))).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, f), up, f));
}

export class Story {
  readonly group = new THREE.Group();
  readonly hero: Mascot;
  readonly crew: Mascot[];
  readonly locals: Mascot[];
  readonly bike = motorbike();
  readonly plane = tourPlane();
  readonly plazaSet = drumPlaza();
  readonly path = new SkyPath(planeKeys());
  /** A closed loop of the tour, for free-flight mode after the story. */
  readonly loopPath: SkyPath;
  readonly fireworks = new Fireworks();
  /** Paul's poodle rides in the xe máy's front basket. */
  readonly basketDog = poodle();
  /** Emitted by the bike's exhaust and the plane's wingtips; drained by main. */
  readonly puffs: THREE.Vector3[] = [];
  private events: Timed[] = [];
  private cursor = 0;
  private lastT = -1;
  private cues: Cue[] = [];
  private homeSpot: THREE.Vector3;
  private homeLocal = Local.road(STOPS.home);

  constructor() {
    this.hero = dressed(LITTLE_GIANT, { hat: true, kit: false });
    this.crew = CREW.map((c) => dressed(c));
    this.locals = WORLD.map((w) => new Mascot(w.color, { hat: false, flag: w.flag }));
    [this.hero, ...this.crew, ...this.locals].forEach((m) => this.group.add(m.root));
    this.group.add(this.bike.group, this.plane.group, this.plazaSet.group, this.fireworks.points);
    this.basketDog.group.scale.setScalar(0.1);
    this.basketDog.group.position.set(0, 0.3, 0.31);
    this.bike.group.add(this.basketDog.group);
    this.homeSpot = groundPoint(roadA.point(STOPS.home, 0, PICKUP_SIDE));
    const loopKeys: [number, THREE.Vector3, number][] = [...WORLD.map((w) => w.dir), PLAZA, roadA.dir(STOPS.hoiAn)].map((d, i) => [i * 3, d, 1.7]);
    loopKeys.push([loopKeys.length * 3, loopKeys[0][1], 1.7]);
    this.loopPath = new SkyPath(loopKeys, true);
    this.schedule();
  }

  private at(t: number, fire: () => void) { this.events.push({ t, fire }); }
  private cue(c: Cue) { this.cues.push(c); }
  drainCues() { const c = this.cues; this.cues = []; return c; }

  private schedule() {
    this.at(0.05, () => this.cue({ kind: "count", crew: 1, friends: 0 }));
    this.at(T.bikePop, () => {
      this.cue({ kind: "sfx", name: "pop-1" });
      this.cue({ kind: "pop", at: roadA.point(bikeTheta(T.bikePop), 0.45), text: "BRRM!" });
    });
    this.at(T.mainHop, () => { this.hero.hop(T.mainHop, 1.6, 0.5); this.cue({ kind: "sfx", name: "hop" }); });
    PICKUPS.forEach((p, i) => {
      this.at(p.time, () => {
        const member = CREW[p.crew];
        this.crew[p.crew].hop(p.time, 1.4, 0.45);
        this.cue({ kind: "sfx", name: `pickup-${i}` });
        this.cue({ kind: "sfx", name: "pop-2", volume: 0.5 });
        this.cue({ kind: "pop", at: roadA.point(p.theta, 0.55, p.side), text: ["HOP!", "YEET!", "WHEE!", "OI!"][i % 4] });
        this.cue({ kind: "toast", member, text: `${member.name} hopped on!`, color: member.color });
        this.cue({ kind: "count", crew: i + 2, friends: 0 });
      });
    });
    this.at(T.board, () => {
      this.cue({ kind: "sfx", name: "whoosh" });
      this.cue({ kind: "pop", at: roadA.point(PLANE_THETA, 0.6), text: "ALL ABOARD!" });
    });
    this.at(T.takeoff, () => this.cue({ kind: "sfx", name: "takeoff-sax" }));
    T.passes.forEach((time, i) => {
      const stop = WORLD[i];
      this.at(time - 0.15, () => {
        this.cue({ kind: "sfx", name: "gong", volume: 0.55 });
        this.cue({ kind: "sfx", name: "ding", volume: 0.6 });
        const colors = stop.flag.map((f) => new THREE.Color(f).getHex()).filter((c) => c !== 0x000000);
        this.fireworks.burst(groundPoint(stop.dir, 2.4), colors, time, 130, 1.0);
        this.cue({ kind: "stamp", text: stop.name });
        this.cue({ kind: "toast", member: null, text: `+1 friend in ${stop.name}!`, color: stop.color });
        this.cue({ kind: "count", crew: CREW.length + 1, friends: i + 1 });
      });
    });
    this.at(T.plaza, () => {
      this.cue({ kind: "sfx", name: "pop-1" });
      this.cue({ kind: "pop", at: groundPoint(PLAZA, 1.3), text: "WE'RE HOME!" });
    });
    [0, 0.6, 1.1, 1.7, 2.2, 2.8, 3.4, 4.0].forEach((d, k) =>
      this.at(T.plaza + 0.3 + d, () => {
        const palette = [[0xffc93c, 0xe63946], [0xc6df70, 0xffffff], [0x9fb6ff, 0xff8fd0], [0xffd23f, 0x5ee6a8]][k % 4];
        const spot = PLAZA.clone().add(new THREE.Vector3(Math.sin(k * 2.1), Math.cos(k * 1.7), Math.sin(k * 3.3)).multiplyScalar(0.09)).normalize();
        this.fireworks.burst(groundPoint(spot, 2.4 + (k % 3) * 0.5), palette, T.plaza + 0.3 + d, 120, 1.3);
        this.cue({ kind: "sfx", name: "pop-2", volume: 0.35 });
      }));
    this.at(T.signOff - 0.1, () => { this.cue({ kind: "signoff" }); this.cue({ kind: "sfx", name: "finale-sax" }); });
    this.events.sort((a, b) => a.t - b.t);
  }

  /** Jump anywhere without replaying the events in between. */
  seek(t: number) {
    this.cursor = this.events.findIndex((e) => e.t > t);
    if (this.cursor < 0) this.cursor = this.events.length;
    this.lastT = t;
  }

  /** Poses the whole cast for story time t and returns the camera shot. */
  update(t: number, fireEvents = true): Shot {
    if (fireEvents) {
      if (t < this.lastT) this.seek(t);
      while (this.cursor < this.events.length && this.events[this.cursor].t <= t) this.events[this.cursor++].fire();
    }
    this.lastT = t;
    this.poseBike(t);
    this.posePlane(t);
    this.poseCast(t);
    this.poseDrum(t);
    this.fireworks.update(t);
    [this.hero, ...this.crew, ...this.locals].forEach((m) => m.update(t));
    return this.shot(t);
  }

  /* ------------------------------------------------------------ free roam */

  /**
   * After the story: the crew keeps partying at the drum (orbit), or everyone
   * piles back on the xe máy / the plane for the viewer to ride along.
   */
  free(mode: "orbit" | "bike" | "plane", time: number): Shot | null {
    const party = T.plaza + 8 + time;
    this.poseCast(party);
    this.poseDrum(party);
    this.fireworks.update(time);
    const riders = [this.hero, ...this.crew];
    this.bike.group.visible = mode === "bike";
    this.plane.group.visible = mode === "plane";
    this.basketDog.group.visible = mode === "bike";
    this.basketDog.update(time, 0);
    riders.forEach((m) => m.stow(mode !== "orbit"));
    let shot: Shot | null = null;
    if (mode === "bike") {
      const th = STOPS.home + time * 0.1;
      this.placeBike(th, BIKE_SCALE, 0);
      const bike = this.bike.group;
      riders.forEach((m, i) => {
        const tier = i < 3 ? 0 : i < 6 ? 1 : i < 8 ? 2 : 3;
        this.seat(m, bike, this.bike.slots[i], Math.sin(time * 5 + tier) * 0.035 * tier, 0.15 / BIKE_SCALE);
        m.cheering = 0; m.waving = 0;
      });
      const { up, fwd, right } = this.frameOf(bike);
      shot = {
        pos: bike.position.clone().addScaledVector(fwd, -2.3).addScaledVector(up, 1.7).addScaledVector(right, 0.7),
        look: bike.position.clone().addScaledVector(fwd, 1.8).addScaledVector(up, 0.3),
        up, stiffness: 4, fov: 52,
      };
    } else if (mode === "plane") {
      const g = this.plane.group;
      this.loopPath.frame(time * 0.7, g);
      g.scale.setScalar(PLANE_SCALE);
      g.updateMatrixWorld();
      this.plane.prop.rotation.z = time * 40;
      riders.forEach((m, i) => { this.seat(m, g, this.plane.slots[i], 0, PLANE_SEAT / PLANE_SCALE); m.cheering = 0.3; });
      this.puffs.push(new THREE.Vector3(-0.75, -0.05, 0.05).applyMatrix4(g.matrixWorld), new THREE.Vector3(0.75, -0.05, 0.05).applyMatrix4(g.matrixWorld));
      const { up, fwd, right } = this.frameOf(g);
      shot = {
        pos: g.position.clone().addScaledVector(fwd, -2.6).addScaledVector(up, 1.1).addScaledVector(right, 1.0),
        look: g.position.clone().addScaledVector(fwd, 1.2),
        up, stiffness: 4, fov: 52,
      };
    }
    [this.hero, ...this.crew, ...this.locals].forEach((m) => m.update(party));
    return shot;
  }

  /* ---------------------------------------------------------------- poses */

  private frameOf(o: THREE.Object3D) {
    const up = o.position.clone().normalize();
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion);
    fwd.sub(up.clone().multiplyScalar(fwd.dot(up))).normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd);
    return { up, fwd, right };
  }

  private placeBike(th: number, scale: number, lean: number) {
    const bike = this.bike.group;
    const { up, fwd } = roadFrame(th);
    bike.position.copy(roadA.point(th, 0, 0.07));
    bike.quaternion.copy(basis(up, fwd));
    bike.rotateX(lean);
    bike.scale.setScalar(scale);
    this.bike.wheels.forEach((w) => (w.rotation.x = th * 160));
    bike.updateMatrixWorld();
  }

  private poseBike(t: number) {
    const bike = this.bike.group;
    const visible = t >= T.bikePop && t < T.board + 0.6;
    bike.visible = visible;
    if (!visible) return;
    const th = bikeTheta(t);
    const speed = (bikeTheta(t + 0.05) - th) / 0.05;
    const popIn = clamp((t - T.bikePop) / 0.35);
    const popOut = 1 - clamp((t - T.board) / 0.4);
    // a little wheelie of joy as it pulls away
    this.placeBike(th, BIKE_SCALE * easeOutBack(popIn) * popOut + 1e-3, -clamp(speed * 0.5, 0, 0.1));
    if (speed > 0.02 && Math.floor(t * 30) !== Math.floor((t - 1 / 60) * 30)) {
      this.puffs.push(this.bike.exhaust.clone().applyMatrix4(bike.matrixWorld));
    }
  }

  private posePlane(t: number) {
    const g = this.plane.group;
    const visible = t >= T.board - 0.6 && t < T.plaza + 3;
    g.visible = visible;
    if (!visible) return;
    if (t < T.takeoff) {
      const { up, fwd } = roadFrame(PLANE_THETA);
      g.position.copy(roadA.point(PLANE_THETA, 0.16));
      g.quaternion.copy(basis(up, fwd));
      g.scale.setScalar(easeOutBack(clamp((t - (T.board - 0.6)) / 0.5)) * PLANE_SCALE + 1e-3);
    } else {
      this.path.frame(t, g);
      g.scale.setScalar(PLANE_SCALE);
    }
    this.plane.prop.rotation.z = t * 40;
    const b = (this.plane.banner.children[0] as THREE.Mesh).geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < b.count; i++) {
      const x = b.getX(i);
      b.setZ(i, Math.sin(x * 3 + t * 12) * 0.06 * (x + 0.9));
    }
    b.needsUpdate = true;
    g.updateMatrixWorld();
    if (t > T.takeoff + 0.8 && Math.floor(t * 28) !== Math.floor((t - 1 / 60) * 28)) {
      this.puffs.push(new THREE.Vector3(-0.75, -0.05, 0.05).applyMatrix4(g.matrixWorld), new THREE.Vector3(0.75, -0.05, 0.05).applyMatrix4(g.matrixWorld));
    }
  }

  /** Puts a mascot on a vehicle slot, facing the vehicle's forward. */
  private seat(m: Mascot, vehicle: THREE.Object3D, slot: THREE.Vector3, sway = 0, size = 0.15) {
    vehicle.updateMatrixWorld();
    m.root.position.copy(slot).applyMatrix4(vehicle.matrixWorld);
    m.root.quaternion.copy(vehicle.quaternion);
    if (sway) m.root.rotateZ(sway);
    m.root.scale.setScalar(size * vehicle.scale.x);
  }
  private stand(m: Mascot, where: THREE.Vector3, face: THREE.Vector3, scale = 0.15) {
    m.root.position.copy(where);
    m.root.quaternion.copy(basis(where.clone().normalize(), face));
    m.root.scale.setScalar(scale);
  }
  /** Hop from a spot on the ground into a seat, as a parabola in world space. */
  private arc(m: Mascot, from: THREE.Vector3, to: THREE.Vector3, u: number, height: number) {
    const e = easeInOut(clamp(u));
    m.root.position.lerpVectors(from, to, e).addScaledVector(from.clone().normalize(), Math.sin(clamp(u) * Math.PI) * height);
  }

  private plazaRing(i: number, count: number) {
    const g = this.plazaSet.group;
    g.updateMatrixWorld();
    const a = (i / count) * Math.PI * 2 + 0.3;
    const world = new THREE.Vector3(Math.cos(a) * 1.22, 0, Math.sin(a) * 1.22).applyMatrix4(g.matrixWorld);
    const center = new THREE.Vector3().applyMatrix4(g.matrixWorld);
    // they face out, towards the viewers, with their backs to the drum
    return { world: groundPoint(world), face: world.clone().sub(center) };
  }

  /** Where a friend waits for the bike, and which way they face (towards the camera's pickup angle). */
  private pickupSpot(p: (typeof PICKUPS)[number]) {
    const spot = groundPoint(roadA.point(p.theta, 0, p.side));
    const { fwd, side } = roadFrame(p.theta);
    return { spot, face: fwd.clone().multiplyScalar(0.8).addScaledVector(side, -0.6) };
  }

  private poseCast(t: number) {
    const riders = [this.hero, ...this.crew];
    const boarded = t >= T.board;
    const home = t >= T.plaza;
    const paulAboard = t >= PICKUPS[0].time + 0.3 && t < T.board;
    this.basketDog.group.visible = paulAboard;
    this.basketDog.update(t, 0);
    riders.forEach((m, i) => {
      m.waving = 0;
      m.cheering = 0;
      m.root.visible = true;
      const pick = i > 0 ? PICKUPS.find((p) => p.crew === i - 1)! : null;
      m.stow(!home && (boarded || (pick ? t >= pick.time : t >= T.mainHop)));
      if (home) {
        if (i === 0) {
          // the hero stands on the drum, facing the way the camera first arrives
          const top = new THREE.Vector3(0, 0.66, 0).applyMatrix4(this.plazaSet.group.matrixWorld);
          this.stand(m, top, this.finaleCamDir(), 0.2);
        } else {
          const { world, face } = this.plazaRing(i - 1, RING);
          this.stand(m, world, face);
        }
        m.cheering = 1;
        m.root.scale.multiplyScalar(easeOutBack(clamp((t - T.plaza - i * 0.05) / 0.4)) + 1e-3);
        return;
      }
      if (boarded) {
        const slot = this.plane.slots[i];
        if (t < T.board + 0.7) {
          const from = this.bike.slots[i].clone().applyMatrix4(this.bikeAt(T.board - 0.01));
          const to = slot.clone().applyMatrix4(this.plane.group.matrixWorld);
          this.arc(m, from, to, (t - T.board - i * 0.03) / 0.45, 0.7);
          m.root.quaternion.copy(this.plane.group.quaternion);
          m.root.scale.setScalar(lerp(0.15, PLANE_SEAT, clamp((t - T.board) / 0.5)));
        } else this.seat(m, this.plane.group, slot, 0, PLANE_SEAT / PLANE_SCALE);
        m.cheering = t > T.takeoff + 1 ? 0.35 : 0;
        return;
      }
      // Vietnam leg
      const tier = i < 3 ? 0 : i < 6 ? 1 : i < 8 ? 2 : 3;
      const sway = Math.sin(t * 5 + tier) * 0.035 * tier;
      if (i === 0) {
        if (t < T.mainHop) {
          const { fwd, side } = roadFrame(STOPS.home);
          this.stand(m, this.homeSpot, fwd.clone().multiplyScalar(0.9).addScaledVector(side, 0.35));
          m.waving = t > T.hello - 0.4 ? 1 : 0;
        } else if (t < T.mainHop + 0.5) {
          this.arc(m, this.homeSpot, this.bike.slots[0].clone().applyMatrix4(this.bike.group.matrixWorld), (t - T.mainHop) / 0.5, 0.3);
          m.root.quaternion.copy(this.bike.group.quaternion);
        } else this.seat(m, this.bike.group, this.bike.slots[0], 0, 0.15 / BIKE_SCALE);
        return;
      }
      const { spot, face } = this.pickupSpot(pick!);
      if (t < pick!.time) {
        this.stand(m, spot, face);
        m.waving = t > pick!.time - 2.6 ? 1 : 0;
        m.root.visible = t > T.bikePop - 1;
      } else if (t < pick!.time + 0.45) {
        this.arc(m, spot, this.bike.slots[i].clone().applyMatrix4(this.bike.group.matrixWorld), (t - pick!.time) / 0.45, 0.35 + tier * 0.12);
        m.root.quaternion.copy(this.bike.group.quaternion);
      } else {
        this.seat(m, this.bike.group, this.bike.slots[i], sway, 0.15 / BIKE_SCALE);
        m.cheering = t < pick!.time + 1.2 ? 0.4 : 0;
      }
    });

    this.locals.forEach((m, i) => {
      m.cheering = 0;
      m.waving = 0;
      if (home) {
        const { world, face } = this.plazaRing(CREW.length + i, RING);
        this.stand(m, world, face);
        m.cheering = 1;
        m.root.scale.multiplyScalar(easeOutBack(clamp((t - T.plaza - 0.4 - i * 0.05) / 0.4)) + 1e-3);
        return;
      }
      const pass = T.passes[i];
      const { L, camX, camZ } = this.landmarkRig(i);
      // between the landmark and the camera, off to one side of the frame
      const len = Math.hypot(camX, camZ);
      const ux = camX / len, uz = camZ / len;
      const x = ux * 0.55 - uz * 0.5, z = uz * 0.55 + ux * 0.5;
      const where = L.point(x, z);
      const toCam = L.point(camX, camZ).sub(where);
      this.stand(m, where, toCam, 0.17);
      m.waving = Math.abs(t - pass) < 2 ? 1 : 0;
      m.cheering = t > pass - 0.1 && t < pass + 1.4 ? 1 : 0;
      m.root.visible = t > T.board;
    });
  }

  /** The bike's world matrix at an earlier moment, for the hop from bike to plane. */
  private bikeAt(t: number) {
    const th = bikeTheta(t);
    const { up, fwd } = roadFrame(th);
    return new THREE.Matrix4().compose(roadA.point(th, 0, 0.07), basis(up, fwd), new THREE.Vector3().setScalar(BIKE_SCALE));
  }

  private poseDrum(t: number) {
    const beat = t >= T.plaza ? Math.max(0, Math.sin((t - T.plaza) * 7)) : 0;
    this.plazaSet.faceMat.emissiveIntensity = t >= T.plaza ? 0.25 + beat * 0.45 : 0;
    this.plazaSet.drum.scale.setScalar(1 + beat * 0.025);
  }

  /* ---------------------------------------------------------------- camera */

  /**
   * Where the camera stands for each landmark, authored per city in its local
   * frame: in front of the monument with the rest of the set behind it.
   */
  private landmarkRig(i: number) {
    const spots: [number, number][] = [[1.5, 1.9], [1.5, 2.0], [1.3, 2.0], [0.9, 2.2], [1.4, 2.0]];
    const [camX, camZ] = spots[i];
    return { L: worldFrame(i), camX, camZ };
  }
  private finaleCamDir() {
    const g = this.plazaSet.group;
    return new THREE.Vector3(Math.sin(0.9), 0, Math.cos(0.9)).applyQuaternion(g.quaternion);
  }

  private shot(t: number): Shot {
    const s: Shot = { pos: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), stiffness: 5, fov: 45 };
    const vietnam = roadA.dir(0.25).add(new THREE.Vector3(0, 0.25, 0)).normalize();

    if (t < T.dive) {
      // cold open: the planet swings round until Vietnam faces us
      const u = easeInOut(clamp(t / T.dive));
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (1 - u) * 1.9);
      s.pos.copy(vietnam).applyQuaternion(q).multiplyScalar(lerp(46, 29, u));
      s.look.set(0, 0, 0);
      s.stiffness = 40;
      s.fov = 40;
      return s;
    }

    const H = this.homeLocal;
    const hero = this.homeSpot;
    const up = hero.clone().normalize();
    // wide aerial over Hà Giang: terraces, the flag tower and the road winding south
    const aerial = H.point(1.4, -2.2, 2.6);
    const aerialLook = H.point(-0.1, 0.4, 0.2);
    // medium on the hero: road side, ahead of the hut, so the bike never lands between us
    // medium on the hero, from the hero's own side of the road: the hut sits behind
    // them and the bike pops up to one side instead of between us
    const medium = hero.clone().addScaledVector(H.fwd, 1.55).addScaledVector(H.right, -0.45).addScaledVector(up, 0.5);
    const mediumLook = hero.clone().addScaledVector(up, 0.2).addScaledVector(H.right, 0.18).addScaledVector(H.fwd, 0.1);

    if (t < T.hello) {
      const u = easeInOut(clamp((t - T.dive) / (T.hello - T.dive - 0.4)));
      const from = vietnam.clone().multiplyScalar(29);
      if (u < 1 && t < T.dive + 2.2) {
        const k = easeInOut(clamp((t - T.dive) / 2.2));
        s.pos.lerpVectors(from, aerial, k);
        s.look.lerpVectors(new THREE.Vector3(), aerialLook, smoothstep(0.1, 0.9, k));
        s.up.lerpVectors(new THREE.Vector3(0, 1, 0), up, smoothstep(0.2, 1, k)).normalize();
      } else {
        const k = easeInOut(clamp((t - T.dive - 2.2) / (T.hello - T.dive - 2.2)));
        s.pos.copy(arcAround(hero, aerial, medium, k));
        s.look.lerpVectors(aerialLook, mediumLook, k);
        s.up.copy(up);
      }
      s.stiffness = 30;
      s.fov = 45;
      return s;
    }
    if (t < T.ride + 0.6) {
      s.pos.copy(medium).addScaledVector(H.fwd, 0.3 * smoothstep(T.bikePop, T.ride + 0.6, t));
      s.look.copy(mediumLook);
      s.up.copy(up);
      s.stiffness = 3;
      s.fov = 46;
      return s;
    }

    if (t < T.board) {
      // the ride: a high chase that looks down the road at what's coming,
      // swinging round to a front-left medium at every pickup so we see faces
      const bike = this.bike.group;
      const { up: bu, fwd, right } = this.frameOf(bike);
      const riders = PICKUPS.filter((p) => p.time < t).length + 1;
      const tall = 0.35 + Math.ceil(riders / 3) * 0.3;
      const w = stopWeight(t);
      const chasePos = bike.position.clone().addScaledVector(fwd, -2.2).addScaledVector(bu, 1.05 + tall * 0.45).addScaledVector(right, 0.5);
      const chaseLook = bike.position.clone().addScaledVector(fwd, 1.3).addScaledVector(bu, 0.25);
      // at a pickup: in front, just left of the lane, looking back along the road
      const stopPos = bike.position.clone().addScaledVector(fwd, 1.55).addScaledVector(right, -1.15).addScaledVector(bu, 0.45 + tall * 0.42);
      const stopLook = bike.position.clone().addScaledVector(bu, tall * 0.42).addScaledVector(right, -0.14).addScaledVector(fwd, -0.1);
      s.pos.copy(arcAround(bike.position.clone().addScaledVector(bu, tall * 0.5), chasePos, stopPos, w));
      s.look.lerpVectors(chaseLook, stopLook, w);
      s.up.copy(bu);
      s.stiffness = 2.6;
      s.fov = lerp(52, 47, w);
      return s;
    }

    const plane = this.plane.group;
    if (t < T.takeoff + 0.2) {
      // boarding: a wide look across the runway at the plane and the terminal
      const L = Local.road(PLANE_THETA);
      s.pos.copy(L.point(-2.3, -0.9, 0.75));
      s.look.copy(L.point(0.1, 0.1, 0.25));
      s.up.copy(L.up);
      s.stiffness = t < T.board + 0.15 ? 40 : 3;
      s.fov = 48;
      return s;
    }
    const { up: pu, fwd: pf, right: pr } = this.frameOf(plane);
    if (t < T.cruise + 0.6) {
      // takeoff: tracking from behind-left as it lifts off the runway
      s.pos.copy(plane.position).addScaledVector(pf, -2.2).addScaledVector(pu, 0.8).addScaledVector(pr, -1.3);
      s.look.copy(plane.position).addScaledVector(pf, 1.2);
      s.up.copy(pu);
      s.stiffness = 3.5;
      s.fov = 50;
      return s;
    }
    const pass = T.passes.findIndex((p) => t < p + 1.45);
    if (pass >= 0 && t > T.passes[pass] - 1.75 && t < T.plaza - 0.6) {
      // cut to the ground at each landmark, the plane roaring over it
      const { L, camX, camZ } = this.landmarkRig(pass);
      s.pos.copy(L.point(camX, camZ, 0.85));
      const landmark = L.point(0, 0, 0.45);
      // only swing towards the plane once it is actually overhead
      const near = smoothstep(4.0, 1.6, plane.position.distanceTo(landmark));
      s.look.lerpVectors(landmark, plane.position, 0.34 * near);
      s.up.copy(L.up);
      s.stiffness = t < T.passes[pass] - 1.65 ? 60 : 3;
      s.fov = 50;
      return s;
    }
    if (t < T.plaza) {
      // cruising: a front-right tracking shot so the whole crew's faces are in frame
      s.pos.copy(plane.position).addScaledVector(pf, 2.0).addScaledVector(pu, 0.75).addScaledVector(pr, 1.7);
      s.look.copy(plane.position).addScaledVector(pf, -0.2);
      s.up.copy(pu);
      s.stiffness = 2.2;
      s.fov = 50;
      return s;
    }

    // finale: a wide circle round the drum, then all the way back out to space
    const g = this.plazaSet.group;
    const P = groundPoint(PLAZA);
    const pup = PLAZA.clone();
    const x = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
    const z = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    const a = 0.9 + (t - T.plaza) * 0.22;
    const rise = easeInOut(clamp((t - T.pullOut) / 4.2));
    const near = P.clone().addScaledVector(x, Math.sin(a) * 4.0).addScaledVector(z, Math.cos(a) * 4.0).addScaledVector(pup, 1.9);
    const far = pup.clone().add(z.clone().multiplyScalar(0.35)).normalize().multiplyScalar(33);
    s.pos.lerpVectors(near, far, rise);
    s.look.lerpVectors(P.clone().addScaledVector(pup, 0.5), new THREE.Vector3(), smoothstep(0, 0.6, rise));
    s.up.lerpVectors(pup, new THREE.Vector3(0, 1, 0).sub(pup.clone().multiplyScalar(0.2)), rise).normalize();
    s.stiffness = t < T.plaza + 0.15 ? 60 : 4;
    s.fov = lerp(46, 40, rise);
    return s;
  }
}
