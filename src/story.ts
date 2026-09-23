import * as THREE from "three";
import { Mascot } from "./mascot";
import { clamp, easeInOut, easeOutBack, lerp, smoothstep } from "./noise";
import { motorbike, tourPlane, drumPlaza, roadFrame, Fireworks } from "./props";
import { PLAZA, R, WORLD, roadA, STOPS, groundPoint } from "./world";

/* ================================================================ the cast */

export type CrewMember = { handle: string; name: string; color: number; eyes?: number; portrait: string };
export const LITTLE_GIANT: CrewMember = { handle: "vietgang", name: "Little Giant", color: 0xc6df70, portrait: "/vgang-mascot.svg" };
/** Picked up two at a time, in the order the bike reaches them. */
export const CREW: CrewMember[] = [
  { handle: "giaBaoJS", name: "Paul", color: 0xe6c667, portrait: "/team/paul.webp" },
  { handle: "huytdps13400", name: "David", color: 0xbadb96, portrait: "/team/david.webp" },
  { handle: "anhquan291", name: "Quan", color: 0x9ecddd, portrait: "/vgang-mascot.svg" },
  { handle: "dennytosp", name: "Mad Dinh", color: 0xb1a0cc, portrait: "/team/mad-dinh.webp" },
  { handle: "baronha", name: "Bao Ha", color: 0xf3b48e, portrait: "/team/baronha.webp" },
  { handle: "khoatranthanh", name: "Khoa", color: 0xd7b0bd, portrait: "/team/khoa.webp" },
  { handle: "tuanngocptn", name: "Nick", color: 0xd98573, portrait: "/team/nick.webp" },
  { handle: "nnphong1904", name: "Phong", color: 0x315b40, eyes: 0xedf1d2, portrait: "/team/phong.webp" },
];

/* ============================================================ the timeline */

type Leg = { t0: number; t1: number; th0: number; th1: number };
const RIDE_START = 8.8;
const legs: Leg[] = [];
export const PICKUPS: { time: number; crew: number; theta: number; side: number }[] = [];
const STOP_PLACES = [STOPS.haGiang, STOPS.haLong, STOPS.hoiAn, STOPS.saiGon];
{
  let t = RIDE_START, th: number = STOPS.home;
  const move = (dur: number, to: number) => { legs.push({ t0: t, t1: t + dur, th0: th, th1: to }); t += dur; th = to; };
  const moves = [1.8, 2.4, 2.4, 2.4];
  STOP_PLACES.forEach((place, i) => {
    move(moves[i], place);
    PICKUPS.push({ time: t + 0.15, crew: i * 2, theta: place + 0.01, side: 0.26 });
    PICKUPS.push({ time: t + 0.6, crew: i * 2 + 1, theta: place - 0.01, side: 0.26 });
    move(1.3, place);
  });
  move(1.9, STOPS.airport);
}
export const T = {
  dive: 4.2,
  bikePop: 8.0,
  mainHop: 8.25,
  ride: RIDE_START,
  arrive: legs[legs.length - 1].t1, // 24.9
  board: 25.0,
  takeoff: 25.7,
  passes: [28.6, 31.2, 33.8, 36.4, 39.0],
  plaza: 41.4,
  pullOut: 44.0,
  signOff: 46.2,
  end: 52,
};

function bikeTheta(t: number) {
  if (t <= legs[0].t0) return legs[0].th0;
  for (const leg of legs) {
    if (t <= leg.t1) return lerp(leg.th0, leg.th1, easeInOut(clamp((t - leg.t0) / (leg.t1 - leg.t0))));
  }
  return STOPS.airport;
}

/** Plane waypoints: [time, direction, altitude above R]. */
const PLANE_THETA = STOPS.airport + 0.07;
const PLANE_SCALE = 0.7;
const BIKE_SCALE = 1.35;
/** Mascots ride the plane a little smaller than life, or ten of them would not fit. */
const PLANE_SEAT = 0.11;
function planeKeys(): [number, THREE.Vector3, number][] {
  const roadDir = (th: number) => roadA.dir(th);
  const deck = roadA.surface(PLANE_THETA) - R + 0.16;
  return [
    [T.takeoff, roadDir(PLANE_THETA), deck],
    [T.takeoff + 1.0, roadDir(PLANE_THETA + 0.1), deck + 0.05],
    [T.takeoff + 2.0, roadDir(PLANE_THETA + 0.32), 1.2],
    [T.passes[0], WORLD[0].dir, 1.45],
    [T.passes[1], WORLD[1].dir, 1.75],
    [T.passes[2], WORLD[2].dir, 1.45],
    [T.passes[3], WORLD[3].dir, 1.8],
    [T.passes[4], WORLD[4].dir, 1.55],
    [T.plaza, PLAZA, 1.3],
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
    const alt = lerp(k[i][2], k[i + 1][2], smoothstep(0, 1, u)) + Math.sin(u * Math.PI) * (i > 1 ? 0.9 : 0);
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
    // bank into turns
    const turn = r.clone().sub(q).normalize().sub(fwd).dot(new THREE.Vector3().crossVectors(up, f));
    const x = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const y = new THREE.Vector3().crossVectors(fwd, x);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, fwd));
    obj.rotateZ(clamp(turn * 25 * bank, -0.6, 0.6));
  }
}

/* ============================================================= captions */

export type Caption = { t0: number; t1: number; en: string; vi: string };
export const CAPTIONS: Caption[] = [
  { t0: 0.6, t1: 4.1, en: "Somewhere out there spins a very small planet…", vi: "Ở đâu đó, có một hành tinh bé xíu…" },
  { t0: 4.3, t1: 7.9, en: "…home to one Little Giant with one BIG plan.", vi: "…nơi Little Giant ấp ủ một kế hoạch to đùng." },
  { t0: 8.0, t1: 10.5, en: "Step 1: round up the crew.", vi: "Bước 1: gom đủ hội anh em." },
  { t0: 10.6, t1: 13.4, en: "Hà Giang — two hop on!", vi: "Hà Giang — thêm hai đứa!" },
  { t0: 13.5, t1: 17.1, en: "Hạ Long Bay — scenic pickup.", vi: "Vịnh Hạ Long — đón khách view đẹp." },
  { t0: 17.2, t1: 20.8, en: "Hội An — lanterns and latecomers.", vi: "Hội An — đèn lồng và mấy đứa đi trễ." },
  { t0: 20.9, t1: 25.0, en: "Sài Gòn. Nine on one xe máy. Totally normal.", vi: "Sài Gòn. Chín đứa một xe. Chuyện thường." },
  { t0: 25.1, t1: 27.6, en: "Step 2: take the crew EVERYWHERE.", vi: "Bước 2: đưa cả hội đi khắp thế giới." },
  { t0: 27.7, t1: 30.0, en: "Singapore — hello, Merlion!", vi: "Singapore — chào Merlion!" },
  { t0: 30.1, t1: 32.6, en: "Tokyo — konnichiwa, Fuji-san!", vi: "Tokyo — konnichiwa, núi Phú Sĩ!" },
  { t0: 32.7, t1: 35.2, en: "Cairo — pyramids: checked.", vi: "Cairo — kim tự tháp: đã ghé." },
  { t0: 35.3, t1: 37.8, en: "Paris — bonjour, Eiffel!", vi: "Paris — bonjour, tháp Eiffel!" },
  { t0: 37.9, t1: 40.6, en: "New York — the torch says hi.", vi: "New York — bà Tự Do vẫy tay chào." },
  { t0: 41.3, t1: 45.9, en: "Tiny planet. Big crew. Whole world.", vi: "Hành tinh nhỏ. Hội lớn. Cả thế giới." },
];
export const CHAPTERS = [
  { t: 8.0, label: "CH.1 · THE CREW", vi: "Gom hội" },
  { t: 25.1, label: "CH.2 · THE WORLD", vi: "Vươn ra thế giới" },
  { t: 41.3, label: "CH.3 · HOME", vi: "Về nhà" },
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
  private events: Timed[] = [];
  private cursor = 0;
  private lastT = -1;
  private cues: Cue[] = [];
  private homeSpot: THREE.Vector3;

  constructor() {
    this.hero = new Mascot(LITTLE_GIANT.color);
    this.crew = CREW.map((c) => new Mascot(c.color, { eyes: c.eyes }));
    this.locals = WORLD.map((w) => new Mascot(w.color, { hat: false, flag: w.flag }));
    [this.hero, ...this.crew, ...this.locals].forEach((m) => this.group.add(m.root));
    this.group.add(this.bike.group, this.plane.group, this.plazaSet.group, this.fireworks.points);
    this.homeSpot = roadA.point(STOPS.home, 0, 0.26);
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
      this.cue({ kind: "pop", at: roadA.point(bikeTheta(T.bikePop), 0.3), text: "BRRM!" });
    });
    this.at(T.mainHop, () => { this.hero.hop(T.mainHop, 1.6, 0.5); this.cue({ kind: "sfx", name: "hop" }); });
    PICKUPS.forEach((p, i) => {
      this.at(p.time, () => {
        const member = CREW[p.crew];
        this.crew[p.crew].hop(p.time, 1.4, 0.45);
        this.cue({ kind: "sfx", name: `pickup-${i}` });
        this.cue({ kind: "sfx", name: "pop-2", volume: 0.5 });
        this.cue({ kind: "pop", at: roadA.point(p.theta, 0.5, p.side), text: i % 2 ? "HOP!" : "YEET!" });
        this.cue({ kind: "toast", member, text: `@${member.handle} hopped on!`, color: member.color });
        this.cue({ kind: "count", crew: i + 2, friends: 0 });
      });
    });
    this.at(T.board, () => {
      this.cue({ kind: "sfx", name: "whoosh" });
      this.cue({ kind: "pop", at: this.plane.group.position.clone(), text: "ALL ABOARD!" });
    });
    this.at(T.takeoff, () => this.cue({ kind: "sfx", name: "takeoff-sax" }));
    T.passes.forEach((time, i) => {
      const stop = WORLD[i];
      this.at(time - 0.15, () => {
        this.cue({ kind: "sfx", name: "gong", volume: 0.55 });
        this.cue({ kind: "sfx", name: "ding", volume: 0.6 });
        const colors = stop.flag.map((f) => new THREE.Color(f).getHex()).filter((c) => c !== 0x000000);
        this.fireworks.burst(groundPoint(stop.dir, 2.3), colors, time, 120, 1.0);
        this.cue({ kind: "stamp", text: stop.name });
        this.cue({ kind: "toast", member: null, text: `+1 friend in ${stop.name}!`, color: stop.color });
        this.cue({ kind: "count", crew: 9, friends: i + 1 });
      });
    });
    this.at(T.plaza, () => {
      this.cue({ kind: "sfx", name: "pop-1" });
      this.cue({ kind: "pop", at: groundPoint(PLAZA, 0.9), text: "WE'RE HOME!" });
    });
    [0, 0.7, 1.3, 2.0, 2.6, 3.3, 4.0].forEach((d, k) =>
      this.at(T.plaza + 0.3 + d, () => {
        const palette = [[0xffc93c, 0xe63946], [0xc6df70, 0xffffff], [0x9fb6ff, 0xff8fd0], [0xffd23f, 0x5ee6a8]][k % 4];
        const spot = PLAZA.clone().add(new THREE.Vector3(Math.sin(k * 2.1), Math.cos(k * 1.7), Math.sin(k * 3.3)).multiplyScalar(0.07)).normalize();
        this.fireworks.burst(groundPoint(spot, 2.2 + (k % 3) * 0.4), palette, T.plaza + 0.3 + d, 110, 1.2);
        this.cue({ kind: "sfx", name: "pop-2", volume: 0.35 });
      }));
    this.at(T.signOff - 0.1, () => { this.cue({ kind: "signoff" }); this.cue({ kind: "sfx", name: "finale-sax" }); });
    this.events.sort((a, b) => a.t - b.t);
  }

  /** Jump anywhere. Events between the old and new time fire only when playing forward by small steps. */
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
    let shot: Shot | null = null;
    if (mode === "bike") {
      const th = STOPS.home + time * 0.12;
      const { up, fwd } = roadFrame(th);
      const bike = this.bike.group;
      bike.position.copy(roadA.point(th, 0, 0.07));
      bike.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd));
      bike.scale.setScalar(BIKE_SCALE);
      bike.updateMatrixWorld();
      this.bike.wheels.forEach((w) => (w.rotation.x = -th * 180));
      riders.forEach((m, i) => {
        const tier = i < 3 ? 0 : i < 6 ? 1 : i < 8 ? 2 : 3;
        this.seat(m, bike, this.bike.slots[i], Math.sin(time * 5 + tier) * 0.035 * tier, 0.15 / BIKE_SCALE);
        m.cheering = 0; m.waving = 0;
      });
      shot = {
        pos: new THREE.Vector3(0.6, 1.25, -2.1).applyMatrix4(bike.matrixWorld),
        look: new THREE.Vector3(0, 0.55, 0.9).applyMatrix4(bike.matrixWorld),
        up: up.clone(), stiffness: 5, fov: 50,
      };
    } else if (mode === "plane") {
      const g = this.plane.group;
      this.loopPath.frame(time * 0.7, g);
      g.scale.setScalar(PLANE_SCALE);
      g.updateMatrixWorld();
      this.plane.prop.rotation.z = time * 40;
      riders.forEach((m, i) => { this.seat(m, g, this.plane.slots[i], 0, PLANE_SEAT / PLANE_SCALE); m.cheering = 0.3; });
      shot = {
        pos: new THREE.Vector3(0, 1.3, -3.4).applyMatrix4(g.matrixWorld),
        look: new THREE.Vector3(0, 0.1, 1.5).applyMatrix4(g.matrixWorld),
        up: g.position.clone().normalize(), stiffness: 4, fov: 52,
      };
    }
    [this.hero, ...this.crew, ...this.locals].forEach((m) => m.update(party));
    return shot;
  }

  /* ---------------------------------------------------------------- poses */

  private poseBike(t: number) {
    const bike = this.bike.group;
    const visible = t >= T.bikePop && t < T.board + 0.6;
    bike.visible = visible;
    if (!visible) return;
    const th = bikeTheta(t);
    const { up, fwd } = roadFrame(th);
    bike.position.copy(roadA.point(th, 0, 0.07));
    bike.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd));
    const speed = (bikeTheta(t + 0.05) - th) / 0.05;
    bike.rotateX(-clamp(speed * 0.4, -0.08, 0.08)); // a wheelie of joy when it pulls away
    const popIn = clamp((t - T.bikePop) / 0.35);
    const popOut = 1 - clamp((t - T.board) / 0.4);
    bike.scale.setScalar(BIKE_SCALE * easeOutBack(popIn) * popOut + 1e-3);
    this.bike.wheels.forEach((w) => (w.rotation.x = -th * 180));
    bike.updateMatrixWorld();
  }

  private posePlane(t: number) {
    const g = this.plane.group;
    const visible = t >= T.board - 0.6 && t < T.plaza + 3;
    g.visible = visible;
    if (!visible) return;
    if (t < T.takeoff) {
      const { up, fwd } = roadFrame(PLANE_THETA);
      g.position.copy(roadA.point(PLANE_THETA, 0.16));
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd));
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
    const up = where.clone().normalize();
    const f = face.clone().sub(up.clone().multiplyScalar(face.dot(up))).normalize();
    m.root.position.copy(where);
    m.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, f), up, f));
    m.root.scale.setScalar(scale);
  }
  /** Hop from a spot on the ground into a seat, as a parabola in world space. */
  private arc(m: Mascot, from: THREE.Vector3, to: THREE.Vector3, u: number, height: number) {
    const e = easeInOut(u);
    m.root.position.lerpVectors(from, to, e).addScaledVector(from.clone().normalize(), Math.sin(u * Math.PI) * height);
  }

  private plazaRing(i: number, count: number) {
    const g = this.plazaSet.group;
    g.updateMatrixWorld();
    const a = (i / count) * Math.PI * 2;
    const local = new THREE.Vector3(Math.cos(a) * 1.08, 0, Math.sin(a) * 1.08);
    const world = local.clone().applyMatrix4(g.matrixWorld);
    const center = new THREE.Vector3().applyMatrix4(g.matrixWorld);
    return { world, face: center.sub(world) };
  }

  private poseCast(t: number) {
    const riders = [this.hero, ...this.crew];
    const boarded = t >= T.board;
    const home = t >= T.plaza;
    riders.forEach((m, i) => {
      m.waving = 0;
      m.cheering = 0;
      m.root.visible = true;
      if (home) {
        if (i === 0) {
          // the hero stands on the drum
          const top = new THREE.Vector3(0, 0.56, 0).applyMatrix4(this.plazaSet.group.matrixWorld);
          this.stand(m, top, new THREE.Vector3(0, 0, 1).applyQuaternion(this.plazaSet.group.quaternion), 0.2);
        } else {
          const { world, face } = this.plazaRing(i - 1, 13);
          this.stand(m, world, face);
        }
        m.cheering = 1;
        m.root.scale.multiplyScalar(easeOutBack(clamp((t - T.plaza - i * 0.05) / 0.4)) + 1e-3);
        return;
      }
      if (boarded) {
        const slot = this.plane.slots[i];
        if (t < T.board + 0.6) {
          const from = this.bike.group.localToWorld(this.bike.slots[i].clone());
          const to = this.plane.group.localToWorld(slot.clone());
          this.arc(m, from, to, clamp((t - T.board - i * 0.04) / 0.45), 0.6);
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
          const face = roadFrame(STOPS.home).side.negate();
          this.stand(m, groundPoint(this.homeSpot), face);
          m.waving = t > T.dive + 1.2 ? 1 : 0;
        } else if (t < T.mainHop + 0.5) {
          this.arc(m, groundPoint(this.homeSpot), this.bike.group.localToWorld(this.bike.slots[0].clone()), (t - T.mainHop) / 0.5, 0.25);
          m.root.quaternion.copy(this.bike.group.quaternion);
        } else this.seat(m, this.bike.group, this.bike.slots[0], 0, 0.15 / BIKE_SCALE);
        return;
      }
      const pick = PICKUPS.find((p) => p.crew === i - 1)!;
      const spot = groundPoint(roadA.point(pick.theta, 0, pick.side));
      if (t < pick.time) {
        this.stand(m, spot, roadFrame(pick.theta).side.negate());
        m.waving = t > pick.time - 2.2 ? 1 : 0;
        m.root.visible = t > T.bikePop - 1;
      } else if (t < pick.time + 0.45) {
        this.arc(m, spot, this.bike.group.localToWorld(this.bike.slots[i].clone()), (t - pick.time) / 0.45, 0.35 + tier * 0.1);
        m.root.quaternion.copy(this.bike.group.quaternion);
      } else {
        this.seat(m, this.bike.group, this.bike.slots[i], sway, 0.15 / BIKE_SCALE);
        m.cheering = t < pick.time + 1.2 ? 0.4 : 0;
      }
    });

    this.locals.forEach((m, i) => {
      m.cheering = 0;
      m.waving = 0;
      if (home) {
        const { world, face } = this.plazaRing(8 + i, 13);
        this.stand(m, world, face);
        m.cheering = 1;
        m.root.scale.multiplyScalar(easeOutBack(clamp((t - T.plaza - 0.4 - i * 0.05) / 0.4)) + 1e-3);
        return;
      }
      const pass = T.passes[i];
      const { L, cam, up } = this.landmarkCam(i);
      const toCam = cam.clone().sub(L);
      toCam.sub(up.clone().multiplyScalar(toCam.dot(up))).normalize();
      // off to one side of the frame, so the landmark stays the hero of the shot
      const aside = new THREE.Vector3().crossVectors(up, toCam).multiplyScalar(i % 2 ? 0.55 : -0.55);
      const where = groundPoint(L.clone().addScaledVector(toCam, 0.9).add(aside));
      this.stand(m, where, toCam, 0.15);
      m.waving = Math.abs(t - pass) < 2 ? 1 : 0;
      m.cheering = t > pass - 0.1 && t < pass + 1.4 ? 1 : 0;
      m.root.visible = t > T.board;
    });
  }

  private poseDrum(t: number) {
    const glowAmount = t >= T.plaza ? 0.35 + Math.max(0, Math.sin((t - T.plaza) * 7)) * 0.5 : 0;
    this.plazaSet.faceMat.emissiveIntensity = glowAmount;
    this.plazaSet.drum.scale.setScalar(1 + (t >= T.plaza ? Math.max(0, Math.sin((t - T.plaza) * 7)) * 0.03 : 0));
  }

  /* ---------------------------------------------------------------- camera */

  /** Where the camera stands for a landmark flyover; locals stand between it and the landmark. */
  private landmarkCam(i: number) {
    const up = WORLD[i].dir.clone();
    const L = groundPoint(up);
    const pass = T.passes[i];
    const approach = this.path.at(pass + 0.1).sub(this.path.at(pass - 0.1)).normalize();
    approach.sub(up.clone().multiplyScalar(approach.dot(up))).normalize();
    const side = new THREE.Vector3().crossVectors(up, approach);
    const flip = i % 2 ? -1 : 1;
    const cam = groundPoint(L.clone().addScaledVector(side, 2.1 * flip).addScaledVector(approach, -1.1), 0.4);
    return { L, cam, up };
  }

  private shot(t: number): Shot {
    const s: Shot = { pos: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), stiffness: 6, fov: 42 };
    const home = roadA.dir(STOPS.home);
    const orbitShot = (dir: THREE.Vector3, dist: number) => {
      s.pos.copy(dir).multiplyScalar(dist);
      s.look.set(0, 0, 0);
      s.up.set(0, 1, 0);
    };
    if (t < T.dive) {
      // cold open: the planet swings round to show Vietnam
      const u = easeInOut(clamp(t / T.dive));
      const lon = lerp(80, -6, u), lat = lerp(8, 30, u);
      const d = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - lat), THREE.MathUtils.degToRad(lon));
      orbitShot(d, lerp(44, 30, u));
      s.stiffness = 30;
      s.fov = 40;
      return s;
    }
    if (t < T.ride) {
      // dive down to the hero outside the stilt house
      const u = easeInOut(clamp((t - T.dive) / (T.bikePop - T.dive)));
      const from = home.clone().add(new THREE.Vector3(0, 0.25, 0)).normalize().multiplyScalar(30);
      const hero = groundPoint(this.homeSpot);
      const up = hero.clone().normalize();
      const face = roadFrame(STOPS.home).side.negate();
      const close = hero.clone().addScaledVector(face, 0.95).addScaledVector(up, 0.32).addScaledVector(roadFrame(STOPS.home).fwd, -0.35);
      if (t < T.bikePop) {
        s.pos.lerpVectors(from, close, u);
        s.look.lerpVectors(new THREE.Vector3(), hero.clone().addScaledVector(up, 0.15), smoothstep(0.2, 1, u));
        s.up.lerpVectors(new THREE.Vector3(0, 1, 0), up, smoothstep(0.3, 1, u)).normalize();
        s.stiffness = 30;
        s.fov = lerp(40, 46, u);
      } else {
        // the bike pops, the hero hops, the camera slides behind them
        s.pos.copy(close).addScaledVector(roadFrame(STOPS.home).fwd, -0.4 * smoothstep(T.bikePop, T.ride, t));
        s.look.copy(this.bike.group.position).addScaledVector(up, 0.2);
        s.up.copy(up);
        s.stiffness = 5;
        s.fov = 46;
      }
      return s;
    }
    if (t < T.board) {
      // the ride: a lead shot from just ahead, so we see every face; it swings wide at each pickup
      const bike = this.bike.group;
      const stopping = PICKUPS.reduce((acc, p) => Math.max(acc, 1 - smoothstep(0.6, 1.5, Math.abs(t - p.time - 0.3))), 0);
      const riders = PICKUPS.filter((p) => p.time < t).length + 1;
      const tall = 0.25 + Math.ceil(riders / 3) * 0.22;
      const lead = new THREE.Vector3(-0.55, 0.25 + tall * 0.8, 1.35 + tall * 0.9);
      const wide = new THREE.Vector3(-1.2 - tall * 0.6, 0.3 + tall * 0.7, 0.9 + tall * 0.4);
      const local = lead.lerp(wide, stopping);
      // local offsets are in world units: strip the bike's scale out of its matrix
      const m = new THREE.Matrix4().compose(bike.position, bike.quaternion, new THREE.Vector3(1, 1, 1));
      s.pos.copy(local).applyMatrix4(m);
      s.look.set(0, tall * 0.55, 0.05).applyMatrix4(m);
      s.up.copy(bike.position).normalize();
      s.stiffness = 4;
      s.fov = 50;
      return s;
    }
    if (t < T.takeoff + 1.6) {
      // boarding and takeoff, seen from beside the runway
      const { up, fwd, side } = roadFrame(PLANE_THETA);
      const base = roadA.point(PLANE_THETA, 0);
      s.pos.copy(base).addScaledVector(side, 1.9).addScaledVector(up, 0.55).addScaledVector(fwd, -0.9);
      s.look.copy(this.plane.group.position).addScaledVector(up, 0.1);
      s.up.copy(up);
      s.stiffness = t < T.takeoff ? 4 : 8;
      s.fov = 46;
      return s;
    }
    const pass = T.passes.findIndex((p) => t < p + 1.2);
    if (t < T.plaza - 0.8 && pass >= 0 && t > T.passes[pass] - 1.4) {
      // a ground-level shot at each landmark, the plane roaring overhead
      const { L, cam, up } = this.landmarkCam(pass);
      s.pos.copy(cam);
      s.look.lerpVectors(L.clone().addScaledVector(up, 0.6), this.plane.group.position, 0.38);
      s.up.copy(up);
      s.stiffness = t < T.passes[pass] - 1.3 ? 60 : 7;
      s.fov = 50;
      return s;
    }
    if (t < T.plaza) {
      // chase the plane between landmarks
      const g = this.plane.group;
      s.pos.set(1.6, 1.1, -2.6).applyMatrix4(g.matrixWorld);
      s.look.set(0, 0, 1.2).applyMatrix4(g.matrixWorld);
      s.up.copy(g.position).normalize();
      s.stiffness = 5;
      s.fov = 50;
      return s;
    }
    // finale: circle the drum, then rise all the way back to space
    const up = PLAZA.clone();
    const P = groundPoint(up);
    const g = this.plazaSet.group;
    const x = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
    const z = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    const a = 0.9 + (t - T.plaza) * 0.35;
    const rise = easeInOut(clamp((t - T.pullOut) / 4.5));
    const near = P.clone().addScaledVector(x, Math.sin(a) * 3).addScaledVector(z, Math.cos(a) * 3).addScaledVector(up, 1.2);
    const far = up.clone().add(z.clone().multiplyScalar(0.35)).normalize().multiplyScalar(34);
    s.pos.lerpVectors(near, far, rise);
    s.look.lerpVectors(P.clone().addScaledVector(up, 0.35), new THREE.Vector3(), smoothstep(0, 0.6, rise));
    s.up.lerpVectors(up, new THREE.Vector3(0, 1, 0).sub(up.clone().multiplyScalar(0.2)), rise).normalize();
    s.stiffness = t < T.plaza + 0.2 ? 60 : 6;
    s.fov = lerp(46, 40, rise);
    return s;
  }
}
