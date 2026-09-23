import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mascotArtwork } from "./mascotArtwork";
import { inked, toon } from "./toon";

/** Little Giant in mascot units: 2 tall, feet at y=0, facing +Z, ±1.12 wide. */
let shared: { body: THREE.BufferGeometry; eyes: THREE.BufferGeometry[]; eyeZ: number } | null = null;

function extrude(shapes: THREE.Shape[], depth: number, bevel: number) {
  const source = new THREE.ExtrudeGeometry(shapes, {
    depth, steps: 1, curveSegments: 18, bevelEnabled: true,
    bevelSize: bevel, bevelThickness: bevel, bevelSegments: 6,
  });
  source.deleteAttribute("normal");
  source.deleteAttribute("uv");
  const geometry = mergeVertices(source, 0.0001);
  source.dispose();
  geometry.computeVertexNormals();
  return geometry;
}

function artwork() {
  if (shared) return shared;
  const svg = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${mascotArtwork.body}"/>${mascotArtwork.eyes
      .map(({ path }) => `<path d="${path}"/>`).join("")}</svg>`,
  );
  const body = extrude(svg.paths[0].toShapes(), 66, 20);
  body.computeBoundingBox();
  const box = body.boundingBox!;
  const scale = 2 / (box.max.y - box.min.y);
  const cx = (box.min.x + box.max.x) / 2, floor = box.max.y;
  const orient = (g: THREE.BufferGeometry, depth: number) => {
    g.translate(-cx, -floor, -depth / 2);
    g.rotateX(Math.PI);
    g.scale(scale, scale, scale);
  };
  orient(body, 66);
  const eyes = svg.paths.slice(1).map((p) => {
    const g = extrude(p.toShapes(), 4, 1.5);
    orient(g, 4);
    return g;
  });
  shared = { body, eyes, eyeZ: (33 + 20 + 0.6) * scale };
  return shared;
}

/** The nón lá lathe profile from the landing page, apex first. */
const NON_LA: [number, number][] = [
  [0, 0.674], [0.024, 0.672], [0.055, 0.662], [0.11, 0.63], [0.25, 0.538], [0.48, 0.393], [0.73, 0.238],
  [0.96, 0.094], [1.058, 0.04], [1.079, 0.024], [1.078, 0.007], [1.058, -0.002], [0.948, 0.07], [0.72, 0.214],
  [0.47, 0.371], [0.24, 0.516], [0.096, 0.61], [0.038, 0.645], [0, 0.65],
];
let hatGeometry: THREE.LatheGeometry | null = null;

export type MascotOptions = { hat?: boolean; flag?: string[]; eyes?: number; scale?: number };

export class Mascot {
  readonly root = new THREE.Group();
  /** Everything that squashes and hops. */
  readonly rig = new THREE.Group();
  readonly hat?: THREE.Object3D;
  private leftHand = new THREE.Group();
  private rightHand = new THREE.Group();
  private hopStart = -10;
  private hopHeight = 0;
  private hopLength = 0.5;
  private spinStart = -10;
  waving = 0;
  cheering = 0;
  bounce = 0.6;
  phase = Math.random() * 10;

  constructor(readonly color: number, options: MascotOptions = {}) {
    const art = artwork();
    const body = inked(art.body, toon(color), 0.05);
    const eyeMaterial = toon(options.eyes ?? 0x1c2e24);
    art.eyes.forEach((g) => {
      const eye = new THREE.Mesh(g, eyeMaterial);
      eye.position.z = art.eyeZ;
      this.rig.add(eye);
    });
    // Eye sparkle, the one detail that makes it read as cute at a distance.
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    [[-0.25, 1.1], [0.53, 1.07]].forEach(([x, y]) => {
      const s = sparkle.clone();
      s.position.set(x, y, art.eyeZ + 0.04);
      this.rig.add(s);
    });
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.55 }));
    [[-0.55, 0.74], [0.86, 0.74]].forEach(([x, y]) => {
      const c = cheek.clone();
      c.position.set(x, y, art.eyeZ + 0.02);
      this.rig.add(c);
    });
    this.rig.add(body);

    const handGeo = new THREE.SphereGeometry(0.17, 16, 12);
    const handMat = toon(color);
    [this.leftHand, this.rightHand].forEach((hand, i) => {
      const ball = inked(handGeo, handMat, 0.045);
      hand.add(ball);
      hand.position.set(i ? 1.16 : -1.2, 0.86, 0.2);
      this.rig.add(hand);
    });

    if (options.hat !== false) {
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
    this.leftHand.position.set(-1.2 - w * 0.1, 0.86 + w * (0.5 + Math.cos(t * 9) * 0.1), 0.2);
    this.leftHand.rotation.z = w * Math.sin(t * 9) * 0.3;
    const up = Math.max(cheer, 0);
    this.rightHand.position.set(1.16 + up * 0.1, 0.86 + up * (0.55 + Math.sin(t * 9 + 1) * 0.1), 0.2);
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

