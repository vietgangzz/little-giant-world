import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { dome, inflate, signedDistance } from "./inflate";
import { mascotArtwork } from "./mascotArtwork";
import { inked, toon } from "./toon";

/** Little Giant in mascot units: 2 tall, feet at y=0, facing +Z, ±1.12 wide, ±0.7 deep. */
type Art = {
  body: THREE.BufferGeometry;
  eyes: THREE.BufferGeometry[];
  surface: (x: number, y: number) => number;
  /** Maps a point in the brand SVG's coordinates onto the mascot's local x/y. */
  place: (x: number, y: number) => THREE.Vector2;
};
let shared: Art | null = null;
/** Half-depth at the fattest point: the body is an oval pebble, not a slab. */
const BODY_DEPTH = 0.7;

export function artwork(): Art {
  if (shared) return shared;
  const svg = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${mascotArtwork.body}"/>${mascotArtwork.eyes
      .map(({ path }) => `<path d="${path}"/>`).join("")}</svg>`,
  );
  const outline = (path: (typeof svg.paths)[number]) => {
    const pts = path.toShapes()[0].getPoints(10);
    if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
    return pts;
  };
  const rawBody = outline(svg.paths[0]);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  rawBody.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
  const scale = 2 / (maxY - minY), cx = (minX + maxX) / 2;
  // SVG y runs down; flip it so the feet sit on y=0
  const place = (p: THREE.Vector2) => new THREE.Vector2((p.x - cx) * scale, (maxY - p.y) * scale);
  const body = rawBody.map(place);

  // the deepest point inside the silhouette sets how round the dome is
  let reach = 0;
  for (let y = 0; y <= 2; y += 0.05) for (let x = -1.2; x <= 1.2; x += 0.05) reach = Math.max(reach, signedDistance(x, y, body).d);
  const surface = (x: number, y: number) => {
    const d = signedDistance(x, y, body).d;
    return d > 0 ? BODY_DEPTH * dome(d, reach) : 0;
  };
  const bodyGeo = inflate(body, 84, (_x, _y, d) => BODY_DEPTH * dome(d, reach));
  // eyes are glossy decals lifted off the curved face, each with its own small bulge
  const eyes = svg.paths.slice(1).map((p) =>
    inflate(outline(p).map(place), 26, (x, y, d) => surface(x, y) + 0.018 + 0.05 * dome(d, 0.07), false));
  shared = { body: bodyGeo, eyes, surface, place: (x, y) => place(new THREE.Vector2(x, y)) };
  return shared;
}

/** Orients a flat decal so it lies on the body surface at (x, y). */
export function onSurface(object: THREE.Object3D, surface: Art["surface"], x: number, y: number, lift: number) {
  const e = 0.02;
  const n = new THREE.Vector3(
    -(surface(x + e, y) - surface(x - e, y)) / (2 * e),
    -(surface(x, y + e) - surface(x, y - e)) / (2 * e),
    1,
  ).normalize();
  object.position.set(x, y, surface(x, y)).addScaledVector(n, lift);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
}

/** The nón lá lathe profile from the landing page, apex first. */
const NON_LA: [number, number][] = [
  [0, 0.674], [0.024, 0.672], [0.055, 0.662], [0.11, 0.63], [0.25, 0.538], [0.48, 0.393], [0.73, 0.238],
  [0.96, 0.094], [1.058, 0.04], [1.079, 0.024], [1.078, 0.007], [1.058, -0.002], [0.948, 0.07], [0.72, 0.214],
  [0.47, 0.371], [0.24, 0.516], [0.096, 0.61], [0.038, 0.645], [0, 0.65],
];
let hatGeometry: THREE.LatheGeometry | null = null;

/** The ink every brand mascot's eyes are drawn in. */
export const FOREST = 0x234d37;

export type MascotOptions = { hat?: boolean; flag?: string[]; eyes?: number; scale?: number };

export class Mascot {
  readonly root = new THREE.Group();
  /** Everything that squashes and hops. */
  readonly rig = new THREE.Group();
  readonly hat?: THREE.Object3D;
  /** Hand nubs, as in the brand drawings: small balls of body colour that hold the props. */
  readonly leftHand = new THREE.Group();
  readonly rightHand = new THREE.Group();
  /** Where each hand sits when it is not waving or cheering; costumes move them onto their props. */
  readonly rest = { left: new THREE.Vector3(-1.14, 0.8, 0.2), right: new THREE.Vector3(1.1, 0.8, 0.2) };
  private hopStart = -10;
  private hopHeight = 0;
  private hopLength = 0.5;
  private spinStart = -10;
  waving = 0;
  cheering = 0;
  /** Per-frame hooks for costume parts that move on their own (tails, smoke, babies). */
  readonly ticks: ((now: number) => void)[] = [];
  /** Named costume parts, so a scene can reach in and animate a prop. */
  readonly parts: Record<string, THREE.Object3D> = {};
  bounce = 0.6;
  phase = Math.random() * 10;

  constructor(readonly color: number, options: MascotOptions = {}) {
    const art = artwork();
    const body = inked(art.body, toon(color), 0.045);
    // the brand face: two flat forest-green eyes, nothing else
    const eyeMaterial = toon(options.eyes ?? FOREST);
    art.eyes.forEach((g) => this.rig.add(new THREE.Mesh(g, eyeMaterial)));
    this.rig.add(body);

    const handGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const handMat = toon(color);
    [this.leftHand, this.rightHand].forEach((hand, i) => {
      const ball = inked(handGeo, handMat, 0.035);
      hand.add(ball);
      hand.position.copy(i ? this.rest.right : this.rest.left);
      this.rig.add(hand);
    });

    if (options.hat) {
      hatGeometry ??= new THREE.LatheGeometry(NON_LA.map(([x, y]) => new THREE.Vector2(x, y)), 36);
      const hat = inked(hatGeometry, toon(0xf1d58a), 0.035);
      hat.position.set(0.03, 1.86, 0);
      hat.rotation.set(0.1, 0, -0.08);
      hat.scale.setScalar(0.92);
      this.rig.add(hat);
      this.hat = hat;
    }
    if (options.flag) {
      const flag = makeFlag(options.flag);
      flag.position.set(0, 0.1, 0);
      this.rightHand.add(flag);
    }
    this.root.add(this.rig);
    this.root.scale.setScalar(options.scale ?? 0.15);
  }

  /**
   * Props that stand on the floor beside the body (a suitcase, a dog, the
   * babies) make no sense on a seat, so they are put away while riding.
   */
  stow(stowed: boolean) {
    for (const key of ["poodle", "suitcase", "babyA", "babyB"]) if (this.parts[key]) this.parts[key].visible = !stowed;
  }

  hop(now: number, height = 0.9, length = 0.5) {
    this.hopStart = now;
    this.hopHeight = height;
    this.hopLength = length;
  }
  spin(now: number) {
    this.spinStart = now;
  }

  update(now: number) {
    const t = now + this.phase;
    const hopT = (now - this.hopStart) / this.hopLength;
    let y = 0, sy = 1;
    if (hopT >= 0 && hopT < 1) {
      y = 4 * hopT * (1 - hopT) * this.hopHeight;
      sy = 1 + Math.sin(hopT * Math.PI) * 0.18;
    } else if (hopT >= 1 && hopT < 1.5) {
      sy = 1 - Math.sin((hopT - 1) * 2 * Math.PI) * 0.16 * (1.5 - hopT) * 2;
    } else {
      // idle breathing and a small happy bounce
      const b = Math.max(0, Math.sin(t * 6.5)) * this.bounce * 0.08;
      y = b;
      sy = 1 + Math.sin(t * 3.2) * 0.025;
    }
    const cheer = this.cheering;
    if (cheer > 0) {
      y += Math.abs(Math.sin(t * 7)) * 0.45 * cheer;
    }
    this.rig.position.y = y;
    this.rig.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    const spinT = (now - this.spinStart) / 0.6;
    this.rig.rotation.y = spinT >= 0 && spinT < 1 ? spinT * Math.PI * 2 : 0;

    const w = this.waving;
    this.leftHand.position.copy(this.rest.left).add(new THREE.Vector3(-w * 0.1, w * (0.5 + Math.cos(t * 9) * 0.1), 0));
    this.leftHand.rotation.z = w * Math.sin(t * 9) * 0.3;
    const up = Math.max(cheer, 0);
    this.rightHand.position.copy(this.rest.right).add(new THREE.Vector3(up * 0.1, up * (0.55 + Math.sin(t * 9 + 1) * 0.1), 0));
    this.ticks.forEach((tick) => tick(now));
    if (this.hat) this.hat.rotation.z = -0.08 + Math.sin(t * 4) * 0.03 + (hopT > 0 && hopT < 1 ? Math.sin(hopT * 12) * 0.08 : 0);
  }
}

/** A little flag on a stick, drawn from colour bands (vertical tricolour or two-band). */
export function makeFlag(bands: string[], width = 0.9) {
  const group = new THREE.Group();
  const pole = inked(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6), 0x6b4a3a, 0.02);
  pole.position.y = 0.8;
  const canvas = document.createElement("canvas");
  canvas.width = 96; canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  if (bands.length === 2) {
    // two colours: Japan disc, or Singapore top/bottom
    if (bands[1] === "#bc002d") {
      ctx.fillStyle = bands[0]; ctx.fillRect(0, 0, 96, 64);
      ctx.fillStyle = bands[1]; ctx.beginPath(); ctx.arc(48, 32, 17, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = bands[0]; ctx.fillRect(0, 0, 96, 32);
      ctx.fillStyle = bands[1]; ctx.fillRect(0, 32, 96, 32);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(20, 16, 10, 0, 7); ctx.fill();
      ctx.fillStyle = bands[0]; ctx.beginPath(); ctx.arc(24, 16, 9, 0, 7); ctx.fill();
    }
  } else if (bands[0] === "#3c3b6e") {
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? "#fff" : bands[2]; ctx.fillRect(0, i * 9.2, 96, 9.2); }
    ctx.fillStyle = bands[0]; ctx.fillRect(0, 0, 42, 32);
  } else if (bands[0] === "#ce1126") {
    bands.forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect(0, (i * 64) / 3, 96, 64 / 3 + 1); });
    ctx.fillStyle = "#c09300"; ctx.beginPath(); ctx.arc(48, 32, 6, 0, 7); ctx.fill();
  } else if (bands[0] === "#da251d") {
    ctx.fillStyle = bands[0]; ctx.fillRect(0, 0, 96, 64);
    star(ctx, 48, 33, 18, "#ffff00");
  } else {
    bands.forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect((i * 96) / bands.length, 0, 96 / bands.length + 1, 64); });
  }
  ctx.strokeStyle = "#24163f"; ctx.lineWidth = 5; ctx.strokeRect(0, 0, 96, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.66, 8, 1), new THREE.MeshToonMaterial({ map: texture, side: THREE.DoubleSide }));
  cloth.position.set(width / 2, 1.3, 0);
  cloth.name = "cloth";
  group.add(pole, cloth);
  return group;
}

export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

