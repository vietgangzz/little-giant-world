import * as THREE from "three";
import { rng } from "./noise";
import { inked, toon } from "./toon";
import { makeFlag } from "./mascot";
import { box, cone, cyl, glow } from "./props";
import { heightAt, PLAZA, R, roadA, SEA, standOn, STOPS, WORLD } from "./world";

const random = rng(2026);
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
const range = (a: number, b: number) => a + random() * (b - a);

/* ================================================================ frames */

/**
 * A flat local frame laid on the globe: x to the right, z forward, y up. Every
 * set dresser below works in these small, metre-like numbers and lets the frame
 * wrap them around the sphere, so props always stand upright on the curve.
 */
export class Local {
  readonly up: THREE.Vector3;
  readonly fwd: THREE.Vector3;
  readonly right: THREE.Vector3;
  constructor(origin: THREE.Vector3, heading: THREE.Vector3) {
    this.up = origin.clone().normalize();
    this.fwd = heading.clone().sub(this.up.clone().multiplyScalar(heading.dot(this.up))).normalize();
    this.right = new THREE.Vector3().crossVectors(this.up, this.fwd);
  }
  /** Road A at θ, looking down the road. Local x = 0 is the centre line. */
  static road(theta: number) {
    return new Local(roadA.dir(theta), roadA.tangent(theta));
  }
  dir(x: number, z: number) {
    return this.up.clone().multiplyScalar(R).addScaledVector(this.right, x).addScaledVector(this.fwd, z).normalize();
  }
  ground(x: number, z: number) {
    return heightAt(this.dir(x, z));
  }
  isWater(x: number, z: number) {
    return this.ground(x, z) < SEA + 0.01;
  }
  /** Stands `obj` at (x, z), turned by `yaw` from facing down +z. */
  place<T extends THREE.Object3D>(obj: T, x: number, z: number, yaw = 0, lift = 0): T {
    standOn(obj, this.dir(x, z), lift, yaw, this.fwd);
    return obj;
  }
  point(x: number, z: number, lift = 0) {
    const d = this.dir(x, z);
    return d.multiplyScalar(R + Math.max(heightAt(d), SEA) + lift);
  }
}

/* ============================================================ vocabulary */

/** Gable roof as a triangular prism, ridge along x. */
function gable(w: number, d: number, h: number, color: number, overhang = 0.02) {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - overhang, 0);
  shape.lineTo(d / 2 + overhang, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: w + overhang * 2, bevelEnabled: false });
  g.translate(0, 0, -(w + overhang * 2) / 2);
  g.rotateY(Math.PI / 2);
  return inked(g, color, 0.006);
}
function windows(parent: THREE.Object3D, w: number, h: number, d: number, rows: number, cols: number, color = 0x3b4a78, y0 = 0.03) {
  const pane = new THREE.PlaneGeometry(w / (cols * 2.2), h / (rows * 2.4));
  const mat = toon(color);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const m = new THREE.Mesh(pane, mat);
    m.position.set(-w / 2 + (c + 0.5) * (w / cols), y0 + (r + 0.5) * ((h - y0) / rows), d / 2 + 0.002);
    parent.add(m);
  }
}
/** A small house: walls, gable roof, door and a window or two. */
function cottage(wall: number, roof: number, s = 1) {
  const g = new THREE.Group();
  g.add(box(0.2 * s, 0.13 * s, 0.15 * s, wall, 0.006));
  const r = gable(0.2 * s, 0.15 * s, 0.08 * s, roof);
  r.position.y = 0.13 * s;
  g.add(r);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.04 * s, 0.07 * s), toon(0x5a3a2e));
  door.position.set(-0.04 * s, 0.035 * s, 0.076 * s);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.04 * s, 0.035 * s), toon(0xffe9a8));
  win.position.set(0.05 * s, 0.075 * s, 0.076 * s);
  g.add(door, win);
  return g;
}
function roundTree(color = pick([0x5cc84a, 0x3faa4a, 0x8fdc52]), s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.012 * s, 0.016 * s, 0.07 * s, 5, 0x7a4b3a, 0.004));
  const crown = inked(new THREE.IcosahedronGeometry(0.06 * s, 1), toon(color), 0.006);
  crown.position.y = 0.1 * s;
  g.add(crown);
  return g;
}
function palm(s = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.012 * s, 0.017 * s, 0.24 * s, 5, 0x9c6b3f, 0.004);
  trunk.rotation.z = 0.12;
  g.add(trunk);
  for (let k = 0; k < 6; k++) {
    const leaf = box(0.14 * s, 0.008 * s, 0.035 * s, 0x3fae4c, 0.004);
    leaf.geometry.translate(0.07 * s, 0, 0);
    leaf.position.set(0.03 * s, 0.235 * s, 0);
    leaf.rotation.set(0, (k / 6) * Math.PI * 2, -0.45);
    g.add(leaf);
  }
  return g;
}
function lantern(color: number, r = 0.03) {
  const l = inked(new THREE.SphereGeometry(r, 10, 8), glow(color), 0.005);
  l.scale.set(1, 1.3, 1);
  return l;
}
const LANTERNS = [0xff4d4d, 0xffc53d, 0xff8a3d, 0xe23d8a, 0x7cd35d, 0x4dc3ff];

/* =========================================================== Hà Giang */

export function haGiang() {
  const g = new THREE.Group();
  const L = Local.road(0.02);
  // home: a stilt house behind the spot where Little Giant waits
  const hut = new THREE.Group();
  [[-0.11, -0.08], [0.11, -0.08], [-0.11, 0.08], [0.11, 0.08]].forEach(([x, z]) => {
    const post = cyl(0.014, 0.014, 0.1, 5, 0x6b4a3a, 0.005);
    post.position.set(x, 0, z);
    hut.add(post);
  });
  const floor = box(0.28, 0.02, 0.22, 0x8a5a3c, 0.006);
  floor.position.y = 0.1;
  const walls = box(0.24, 0.13, 0.18, 0xe8c79a, 0.007);
  walls.position.y = 0.12;
  const roof = gable(0.32, 0.26, 0.13, 0x6e4b3a, 0.03);
  roof.position.y = 0.25;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), toon(0x5a3a2e));
  door.position.set(0, 0.16, 0.091);
  const lamp = lantern(0xff4d4d, 0.018);
  lamp.position.set(0.07, 0.22, 0.12);
  hut.add(floor, walls, roof, door, lamp);
  L.place(hut, -0.62, -1.18, Math.PI / 2 + 0.2);
  g.add(hut);

  // rice terraces: curved contour steps, alternating young and ripe rice
  [[1.0, -1.4, 1], [1.35, 0.2, 1.2], [-1.25, 0.5, 1.1], [-1.1, -2.0, 1], [1.2, 1.5, 0.9], [-1.5, -0.8, 0.8]].forEach(([x, z, s]) => {
    const hill = new THREE.Group();
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const r = (0.44 - i * 0.065) * s;
      const disc = cyl(r, r * 0.96, 0.055 * s, 26, i % 2 ? 0xd4e46a : 0x86d24e, 0.008);
      disc.scale.set(1, 1, 0.78);
      disc.position.set(Math.sin(i) * 0.02, i * 0.055 * s - 0.03, Math.cos(i * 1.3) * 0.02);
      hill.add(disc);
    }
    L.place(hill, x, z, random() * 6, -0.02);
    g.add(hill);
  });
  // a hamlet of stilt houses across the road
  for (let i = 0; i < 6; i++) {
    const h = cottage(pick([0xf3e3c3, 0xe8c79a, 0xd9b48a]), pick([0x6e4b3a, 0x5d6a8a]), 1.1);
    L.place(h, range(0.55, 0.95), range(-1.6, 0.6), range(-0.6, 0.6) - Math.PI / 2);
    g.add(h);
  }
  // Lũng Cú: the flag tower on the northern tip
  const tower = new THREE.Group();
  tower.add(cyl(0.11, 0.09, 0.26, 6, 0xf1ece2, 0.01));
  const cap = cyl(0.1, 0.1, 0.03, 6, 0xd9cfbf, 0.008);
  cap.position.y = 0.26;
  tower.add(cap);
  const flag = makeFlag(["#da251d"], 1.4);
  flag.scale.setScalar(0.3);
  flag.position.y = 0.28;
  tower.add(flag);
  L.place(tower, 0.75, -2.3, -0.4);
  g.add(tower);
  return g;
}

/* ============================================================ Hạ Long */

function karstGeometry(h: number, seed: number) {
  const r = rng(seed);
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, -0.2)];
  const base = 0.12 + r() * 0.08;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const bulge = Math.sin(t * Math.PI) * 0.03 + (r() - 0.5) * 0.025;
    pts.push(new THREE.Vector2(Math.max(0.02, base * (1 - Math.pow(t, 2.2) * 0.75) + bulge), t * h));
  }
  pts.push(new THREE.Vector2(0.0, h + 0.03));
  const g = new THREE.LatheGeometry(pts, 10);
  // pinch it out of round so no two islands look turned on a lathe
  const p = g.getAttribute("position");
  const sx = 0.8 + r() * 0.5, sz = 0.8 + r() * 0.5;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * sx, p.getY(i), p.getZ(i) * sz);
  g.computeVertexNormals();
  return g;
}
function karst(h: number, seed: number) {
  const k = new THREE.Group();
  k.add(inked(karstGeometry(h, seed), toon(pick([0xb3a6c2, 0xa497b8, 0xc2b6cc])), 0.01));
  // jungle clinging to the ledges
  const r = rng(seed + 7);
  const n = 3 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const t = 0.35 + r() * 0.65;
    const a = r() * Math.PI * 2;
    const rad = 0.11 * (1 - Math.pow(t, 2.2) * 0.7);
    const clump = inked(new THREE.IcosahedronGeometry(0.035 + r() * 0.03, 1), toon(pick([0x3fae4c, 0x2f9444, 0x5cc84a])), 0.006);
    clump.position.set(Math.cos(a) * rad, t * h, Math.sin(a) * rad);
    clump.scale.y = 0.7;
    k.add(clump);
  }
  const cap = inked(new THREE.IcosahedronGeometry(0.06, 1), toon(0x3fae4c), 0.007);
  cap.position.y = h;
  cap.scale.set(1.2, 0.55, 1.2);
  k.add(cap);
  return k;
}
function junk() {
  const b = new THREE.Group();
  const hull = new THREE.Shape();
  hull.moveTo(-0.16, 0.04); hull.quadraticCurveTo(-0.12, -0.02, 0, -0.02); hull.quadraticCurveTo(0.14, -0.02, 0.18, 0.05);
  hull.lineTo(-0.16, 0.05);
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 0.08, bevelEnabled: false });
  hg.translate(0, 0, -0.04);
  hg.rotateY(Math.PI / 2);
  b.add(inked(hg, toon(0x7a4b3a), 0.006));
  const cabin = box(0.06, 0.035, 0.1, 0xd9b48a, 0.005);
  cabin.position.set(0, 0.05, -0.05);
  b.add(cabin);
  // battened sails, the Hạ Long silhouette
  [[0.06, 0.2], [-0.05, 0.16]].forEach(([z, h]) => {
    const sail = new THREE.Shape();
    sail.moveTo(0, 0); sail.lineTo(0.1, 0.02); sail.quadraticCurveTo(0.12, h * 0.6, 0.08, h); sail.lineTo(0, h * 0.95); sail.closePath();
    const sg = new THREE.ShapeGeometry(sail);
    const m = inked(sg, new THREE.MeshToonMaterial({ color: 0xd9533a, side: THREE.DoubleSide, gradientMap: toon(0xffffff).gradientMap }), 0);
    m.rotation.y = -Math.PI / 2;
    m.position.set(0, 0.05, z);
    b.add(m);
    for (let k = 1; k < 4; k++) {
      const batten = box(0.004, 0.004, 0.1, 0x5a3a2e, 0);
      batten.position.set(0.001, 0.05 + (k / 4) * h, z - 0.05);
      b.add(batten);
    }
  });
  b.userData.bob = random() * 6;
  return b;
}
function raftHouse() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.015, 0.16, 0x9c6b3f, 0.005));
  const h = box(0.12, 0.07, 0.1, pick([0x7fc6e8, 0xf3e3c3, 0xffd6a5]), 0.005);
  h.position.y = 0.015;
  const r = gable(0.14, 0.12, 0.05, 0x3b6fb0);
  r.position.y = 0.085;
  g.add(h, r);
  g.userData.bob = random() * 6;
  return g;
}

export function haLong() {
  const g = new THREE.Group();
  const L = Local.road(STOPS.haLong);
  // clusters of karst, kept a clear lane either side of the bridge
  const clusters = [[-1.5, -1.2], [-2.2, 0.8], [1.6, -0.6], [2.4, 1.2], [-1.1, 2.0], [1.2, 2.2], [-2.8, -0.2], [2.9, -1.8], [-0.9, -2.4]];
  let seed = 11;
  clusters.forEach(([cx, cz]) => {
    const n = 4 + Math.floor(random() * 5);
    for (let i = 0; i < n; i++) {
      const x = cx + range(-0.55, 0.55), z = cz + range(-0.55, 0.55);
      if (Math.abs(x) < 1.0 || Math.abs(z) > 1.9 || !L.isWater(x, z)) continue;
      const k = karst(range(0.35, 1.0), seed++);
      k.scale.setScalar(range(0.8, 1.35));
      L.place(k, x, z, random() * 6, -0.05);
      g.add(k);
    }
  });
  // junks with red sails and a floating village
  [[1.1, 0.4], [-1.3, 0.3], [0.95, -1.5], [-1.8, -1.9], [2.0, 0.2]].forEach(([x, z]) => {
    if (!L.isWater(x, z)) return;
    g.add(L.place(junk(), x, z, random() * 6, 0.005));
  });
  for (let i = 0; i < 6; i++) {
    const x = 1.35 + (i % 3) * 0.24, z = 0.9 + Math.floor(i / 3) * 0.22;
    if (!L.isWater(x, z)) continue;
    g.add(L.place(raftHouse(), x, z, (i % 2) * 0.3, 0.004));
  }
  return g;
}

/* ============================================================= Hội An */

function shophouse(storeys: number) {
  const g = new THREE.Group();
  const h = 0.1 * storeys;
  g.add(box(0.15, h, 0.14, pick([0xf7c948, 0xf4b942, 0xf9d565]), 0.006));
  const band = box(0.152, 0.045, 0.142, 0x6b3f2a, 0.004);
  g.add(band);
  const roof = gable(0.17, 0.16, 0.06, pick([0x9c4a2f, 0x87402a]));
  roof.position.y = h;
  g.add(roof);
  if (storeys > 1) {
    const balcony = box(0.15, 0.012, 0.03, 0x6b3f2a, 0.003);
    balcony.position.set(0, 0.1, 0.085);
    g.add(balcony);
    const shutter = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), toon(0x3f8f7a));
    shutter.position.set(0, 0.145, 0.071);
    g.add(shutter);
  }
  const l = lantern(pick(LANTERNS), 0.016);
  l.position.set(0.05, 0.075, 0.09);
  g.add(l);
  return g;
}
/** A strip of water laid on the ground, following a curve in the local frame. */
function river(L: Local, xOf: (z: number) => number, z0: number, z1: number, width: number) {
  const pos: number[] = [];
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const za = z0 + ((z1 - z0) * i) / steps, zb = z0 + ((z1 - z0) * (i + 1)) / steps;
    const a0 = L.point(xOf(za) - width / 2, za, 0.012), a1 = L.point(xOf(za) + width / 2, za, 0.012);
    const b0 = L.point(xOf(zb) - width / 2, zb, 0.012), b1 = L.point(xOf(zb) + width / 2, zb, 0.012);
    pos.push(...a0.toArray(), ...a1.toArray(), ...b0.toArray(), ...b0.toArray(), ...a1.toArray(), ...b1.toArray());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, toon(0x3fb8d6, { side: THREE.DoubleSide }));
  m.receiveShadow = true;
  return m;
}
function coveredBridge() {
  // Chùa Cầu: a short arched deck with a temple roof over it
  const g = new THREE.Group();
  const deck = box(0.34, 0.03, 0.1, 0x9c6b3f, 0.006);
  deck.position.y = 0.035;
  g.add(deck);
  [-0.15, -0.05, 0.05, 0.15].forEach((x) => [-0.045, 0.045].forEach((z) => {
    const p = cyl(0.008, 0.008, 0.09, 5, 0x7a3b2a, 0.003);
    p.position.set(x, 0.06, z);
    g.add(p);
  }));
  const roof = gable(0.4, 0.16, 0.07, 0x87402a, 0.02);
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 0.15;
  roof.rotation.y = 0;
  g.add(roof);
  const walls = box(0.34, 0.05, 0.1, 0xf4b942, 0.004);
  walls.position.y = 0.065;
  walls.scale.set(1, 1, 0.98);
  g.add(walls);
  return g;
}
export function hoiAn() {
  const g = new THREE.Group();
  const L = Local.road(STOPS.hoiAn);
  const riverX = (z: number) => -0.95 + Math.sin(z * 1.6) * 0.1;
  g.add(river(L, riverX, -1.6, 1.6, 0.26));
  const bridge = coveredBridge();
  L.place(bridge, riverX(0.45), 0.45, Math.PI / 2);
  g.add(bridge);
  // yellow shophouses: a row facing the road, a row facing the river, a few across
  for (let z = -1.3; z <= 1.3; z += 0.19) {
    if (Math.abs(z - 0.45) < 0.12) continue;
    g.add(L.place(shophouse(1 + Math.floor(random() * 2)), -0.5, z + range(-0.02, 0.02), Math.PI / 2));
    g.add(L.place(shophouse(1 + Math.floor(random() * 2)), riverX(z) - 0.26, z, Math.PI / 2 + Math.PI));
    if (random() < 0.5) g.add(L.place(shophouse(1), 0.5, z, -Math.PI / 2));
  }
  // lantern strings over the road
  for (let s = -2; s <= 2; s++) {
    const holder = new THREE.Group();
    L.place(holder, 0, s * 0.24);
    [-0.3, 0.3].forEach((x) => {
      const pole = cyl(0.01, 0.01, 0.4, 5, 0x6b4a3a, 0.004);
      pole.position.x = x;
      holder.add(pole);
    });
    for (let i = 0; i < 7; i++) {
      const x = -0.27 + i * 0.09;
      const l = lantern(LANTERNS[(i + s + 7) % LANTERNS.length], 0.024);
      l.position.set(x, 0.39 - Math.sin(((i + 0.5) / 7) * Math.PI) * 0.05, 0);
      holder.add(l);
    }
    g.add(holder);
  }
  // lantern boats and wishing lanterns on the river
  [-0.9, -0.1, 0.9].forEach((z) => {
    const boat = new THREE.Group();
    boat.add(box(0.05, 0.02, 0.15, 0x6b3f2a, 0.004));
    const l = lantern(pick(LANTERNS), 0.018);
    l.position.set(0, 0.05, 0.04);
    boat.add(l);
    boat.userData.bob = random() * 6;
    g.add(L.place(boat, riverX(z) + 0.03, z, 0.2, 0.01));
  });
  for (let i = 0; i < 14; i++) {
    const z = range(-1.5, 1.5);
    const l = lantern(pick(LANTERNS), 0.009);
    l.userData.bob = random() * 6;
    g.add(L.place(l, riverX(z) + range(-0.09, 0.09), z, 0, 0.02));
  }
  return g;
}

/* ============================================================ Sài Gòn */

function tubeHouse() {
  // nhà ống: narrow, tall and every one a different colour
  const g = new THREE.Group();
  const h = range(0.2, 0.36);
  const color = pick([0xff8fa3, 0x7fd6b0, 0xffc93c, 0x9fb6ff, 0xf7a072, 0xc3a6ff, 0xf4f1ff]);
  g.add(box(0.075, h, 0.13, color, 0.005));
  for (let y = 0.1; y < h - 0.03; y += 0.07) {
    const balcony = box(0.075, 0.008, 0.02, 0x3d3355, 0.002);
    balcony.position.set(0, y, 0.07);
    g.add(balcony);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.035), toon(0x3b4a78));
    win.position.set(0, y + 0.028, 0.0655);
    g.add(win);
  }
  if (random() < 0.5) {
    const plant = inked(new THREE.IcosahedronGeometry(0.02, 0), toon(0x3fae4c), 0.003);
    plant.position.set(0.02, h + 0.015, 0.03);
    g.add(plant);
  }
  return g;
}
function landmark81() {
  const g = new THREE.Group();
  let y = 0;
  [[0.2, 0.55], [0.16, 0.42], [0.12, 0.34], [0.085, 0.26], [0.055, 0.2]].forEach(([w, h], i) => {
    const b = box(w, h, w, i % 2 ? 0xc9dff0 : 0xb6d0e6, 0.01);
    b.position.set(i % 2 ? 0.012 : -0.012, y, 0);
    windows(b, w, h, w, 5, 3, 0x6e8fb8, 0);
    g.add(b);
    y += h;
  });
  const spire = cone(0.022, 0.26, 6, 0xeaf2fa, 0.005);
  spire.position.y = y;
  g.add(spire);
  return g;
}
function bitexco() {
  const g = new THREE.Group();
  const pts = [[0.0, 0], [0.1, 0], [0.11, 0.35], [0.085, 0.75], [0.05, 0.95], [0.0, 0.97]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = inked(new THREE.LatheGeometry(pts, 14), toon(0x8fb3d6), 0.01);
  body.scale.set(1, 1, 0.7);
  g.add(body);
  const pad = cyl(0.07, 0.07, 0.012, 16, 0xf4f1ff, 0.004);
  pad.position.set(0.06, 0.7, 0);
  pad.rotation.z = -0.15;
  g.add(pad);
  return g;
}
function benThanh() {
  const g = new THREE.Group();
  g.add(box(0.42, 0.1, 0.24, 0xf1e1c6, 0.008));
  const roof = gable(0.44, 0.26, 0.06, 0xb34a3a);
  roof.position.y = 0.1;
  g.add(roof);
  const clock = box(0.08, 0.26, 0.08, 0xf6ead3, 0.006);
  clock.position.z = 0.1;
  const face = inked(new THREE.CircleGeometry(0.025, 16), toon(0x3b6fb0), 0);
  face.position.set(0, 0.2, 0.141);
  const cap = cone(0.06, 0.06, 4, 0xb34a3a, 0.005);
  cap.position.set(0, 0.26, 0.1);
  cap.rotation.y = Math.PI / 4;
  g.add(clock, face, cap);
  return g;
}
function cathedral() {
  const g = new THREE.Group();
  const brick = 0xc0573f;
  g.add(box(0.2, 0.14, 0.3, brick, 0.007));
  const roof = gable(0.3, 0.2, 0.08, 0x7a3b2a);
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 0.14;
  g.add(roof);
  [-0.07, 0.07].forEach((x) => {
    const t = box(0.06, 0.28, 0.06, brick, 0.006);
    t.position.set(x, 0, 0.15);
    const spire = cone(0.045, 0.14, 4, 0x6d7a88, 0.005);
    spire.position.set(x, 0.28, 0.15);
    spire.rotation.y = Math.PI / 4;
    g.add(t, spire);
  });
  return g;
}
export function saiGon() {
  const g = new THREE.Group();
  const L = Local.road(STOPS.saiGon);
  // tube houses shoulder to shoulder along the pickup side
  for (let z = -1.1; z <= 1.1; z += 0.085) g.add(L.place(tubeHouse(), -0.45, z, Math.PI / 2));
  g.add(L.place(benThanh(), -0.95, 0.55, Math.PI / 2));
  g.add(L.place(cathedral(), -1.0, -0.6, Math.PI / 2));
  // the skyline across the road
  g.add(L.place(landmark81(), 1.05, 0.5, 0));
  g.add(L.place(bitexco(), 0.8, -0.45, 0.4));
  const glass = [0x9fc2e0, 0x7fa6cf, 0xbcd6ea, 0x8fb8d8, 0xa9cbe5];
  for (let i = 0; i < 26; i++) {
    const x = range(0.45, 1.9), z = range(-1.4, 1.5);
    if (Math.hypot(x - 1.05, z - 0.5) < 0.2 || Math.hypot(x - 0.8, z + 0.45) < 0.16) continue;
    const h = range(0.15, 0.6), w = range(0.09, 0.15);
    const b = box(w, h, w, pick(glass), 0.007);
    windows(b, w, h, w, Math.max(2, Math.floor(h / 0.08)), 2, 0x5d7fa8, 0);
    g.add(L.place(b, x, z, random() * 0.5));
  }
  for (let i = 0; i < 10; i++) g.add(L.place(roundTree(), range(-0.35, -0.3) * (i % 2 ? 1 : -1.1), range(-1.2, 1.2)));
  return g;
}

/* ============================================================ airport */

export function airport() {
  const g = new THREE.Group();
  const L = Local.road(STOPS.airport + 0.08);
  const terminal = new THREE.Group();
  const body = box(0.9, 0.12, 0.26, 0xf4f1ff, 0.008);
  windows(body, 0.9, 0.12, 0.26, 1, 10, 0x6fb6f2, 0.02);
  const roof = inked(new THREE.CylinderGeometry(0.2, 0.2, 0.95, 16, 1, false, -Math.PI / 2, Math.PI), toon(0xdfe6f3), 0.008);
  roof.rotation.z = Math.PI / 2;
  roof.scale.set(1, 1, 0.8);
  roof.position.y = 0.1;
  terminal.add(body, roof);
  g.add(L.place(terminal, 0.75, -0.2, -Math.PI / 2 + Math.PI / 2));
  const tower = new THREE.Group();
  tower.add(cyl(0.04, 0.035, 0.5, 8, 0xf4f1ff, 0.006));
  const cab = cyl(0.085, 0.1, 0.08, 8, 0x7fd6ff, 0.006);
  cab.position.y = 0.5;
  const top = cone(0.1, 0.05, 8, 0xe63946, 0.005);
  top.position.y = 0.58;
  tower.add(cab, top);
  g.add(L.place(tower, 0.6, -0.9));
  // runway stripes down the middle of the road the plane takes off from
  for (let z = -0.4; z < 1.6; z += 0.16) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.08), toon(0xffffff));
    stripe.rotation.x = -Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(stripe);
    const deck = roadA.point(STOPS.airport + 0.08 + z / R, 0.006);
    holder.position.copy(deck);
    const up = deck.clone().normalize();
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    g.add(holder);
  }
  const sock = new THREE.Group();
  sock.add(cyl(0.006, 0.006, 0.16, 4, 0x3d3355, 0.002));
  const cloth = cone(0.018, 0.08, 8, 0xff8a3d, 0.003);
  cloth.rotation.z = Math.PI / 2;
  cloth.position.set(0.04, 0.15, 0);
  sock.add(cloth);
  g.add(L.place(sock, -0.35, 0.2));
  return g;
}

/* ============================================================ the world */

function merlion() {
  const g = new THREE.Group();
  const stone = 0xf6f4ef;
  const base = cyl(0.13, 0.15, 0.08, 14, 0xd8cdb8, 0.008);
  const tail = inked(new THREE.TorusGeometry(0.07, 0.035, 8, 14, Math.PI * 1.2), toon(stone), 0.008);
  tail.position.set(0, 0.12, -0.05);
  tail.rotation.y = Math.PI / 2;
  const body = cyl(0.07, 0.06, 0.28, 12, stone, 0.008);
  body.position.y = 0.08;
  const head = inked(new THREE.IcosahedronGeometry(0.085, 2), toon(stone), 0.009);
  head.position.set(0, 0.42, 0.02);
  const mane = inked(new THREE.TorusGeometry(0.075, 0.03, 8, 16), toon(0xe9e2d6), 0.007);
  mane.position.set(0, 0.42, 0.0);
  const jet = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.4, 0.1), new THREE.Vector3(0, 0.62, 0.42), new THREE.Vector3(0, 0.02, 0.72)), 24, 0.018, 6),
    new THREE.MeshToonMaterial({ color: 0x9fe7ff, emissive: 0x3aa0d0, emissiveIntensity: 0.45 }),
  );
  g.add(base, tail, body, head, mane, jet);
  return g;
}
function marinaBaySands() {
  const g = new THREE.Group();
  [-0.2, 0, 0.2].forEach((x) => {
    const t = box(0.1, 0.62, 0.08, 0xdfe7ef, 0.008);
    t.position.x = x;
    t.rotation.z = x * 0.18;
    windows(t, 0.1, 0.62, 0.08, 6, 2, 0x8fb3d6, 0);
    g.add(t);
  });
  const deck = inked(new THREE.CapsuleGeometry(0.05, 0.62, 4, 8), toon(0xb9c8d8), 0.008);
  deck.rotation.z = Math.PI / 2;
  deck.scale.set(1, 1, 0.5);
  deck.position.set(0.04, 0.66, 0);
  g.add(deck);
  return g;
}
function supertree() {
  const g = new THREE.Group();
  g.add(cyl(0.02, 0.05, 0.36, 8, 0x7a4b8a, 0.006));
  const canopy = inked(new THREE.CylinderGeometry(0.11, 0.05, 0.05, 12, 1, true), toon(0xc94f9c, { side: THREE.DoubleSide }), 0.006);
  canopy.position.y = 0.38;
  g.add(canopy);
  return g;
}
function flyer() {
  const g = new THREE.Group();
  const wheel = inked(new THREE.TorusGeometry(0.2, 0.01, 6, 36), toon(0xf4f1ff), 0.004);
  wheel.position.y = 0.26;
  for (let i = 0; i < 12; i++) {
    const pod = inked(new THREE.SphereGeometry(0.014, 8, 6), toon(0x7fd6ff), 0.003);
    const a = (i / 12) * Math.PI * 2;
    pod.position.set(Math.cos(a) * 0.2, 0.26 + Math.sin(a) * 0.2, 0);
    g.add(pod);
  }
  const legs = box(0.02, 0.26, 0.02, 0xdfe6f3, 0.004);
  g.add(wheel, legs);
  return g;
}
function singapore() {
  const g = new THREE.Group();
  g.add(merlion());
  const mbs = marinaBaySands();
  mbs.position.set(-0.7, 0, -0.55);
  g.add(mbs);
  [[0.55, -0.3], [0.72, -0.05], [0.62, 0.25], [0.85, -0.4]].forEach(([x, z], i) => {
    const t = supertree();
    t.scale.setScalar(0.8 + i * 0.12);
    t.position.set(x, 0, z);
    g.add(t);
  });
  const f = flyer();
  f.position.set(0.1, 0, -0.9);
  g.add(f);
  return g;
}
function tokyoTower() {
  const g = new THREE.Group();
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const r0 = 0.14 * (1 - i / bands) + 0.012, r1 = 0.14 * (1 - (i + 1) / bands) + 0.012;
    const seg = cyl(r0, r1, 0.13, 4, i % 2 ? 0xffffff : 0xe8382f, 0.006);
    seg.position.y = i * 0.13;
    seg.rotation.y = Math.PI / 4;
    g.add(seg);
  }
  const deck = box(0.12, 0.04, 0.12, 0xffffff, 0.005);
  deck.position.y = 0.42;
  g.add(deck);
  return g;
}
function torii() {
  const t = new THREE.Group();
  [-0.14, 0.14].forEach((x) => { const p = cyl(0.018, 0.018, 0.3, 8, 0xe03a3a, 0.006); p.position.x = x; t.add(p); });
  const beam = box(0.44, 0.035, 0.05, 0xe03a3a, 0.006);
  beam.position.y = 0.3;
  const top = box(0.48, 0.02, 0.06, 0x2a1f3d, 0.004);
  top.position.y = 0.335;
  const beam2 = box(0.34, 0.022, 0.035, 0xe03a3a, 0.005);
  beam2.position.y = 0.23;
  t.add(beam, top, beam2);
  return t;
}
function pagoda() {
  const p = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const w = 0.15 - i * 0.022;
    const b = box(w, 0.07, w, 0xf4e6d0, 0.006);
    b.position.y = i * 0.1;
    const roof = cone(w * 1.05, 0.045, 4, 0x3b3f63, 0.006);
    roof.position.y = i * 0.1 + 0.065;
    roof.rotation.y = Math.PI / 4;
    p.add(b, roof);
  }
  const spire = cyl(0.006, 0.006, 0.12, 4, 0xc9a227, 0.003);
  spire.position.y = 0.5;
  p.add(spire);
  return p;
}
function sakura(s = 1) {
  const t = roundTree(pick([0xffb3d1, 0xff9ec7, 0xffc6dc]), s);
  return t;
}
function tokyo() {
  const g = new THREE.Group();
  const fuji = new THREE.Group();
  const m = cone(1.0, 0.95, 24, 0x6f7fc8, 0.02);
  const snowPts = [[0, 0.95], [0.4, 0.55], [0.34, 0.53], [0.3, 0.58], [0.24, 0.52], [0.18, 0.57], [0.12, 0.5], [0.06, 0.56], [0, 0.95]];
  const snow = inked(new THREE.LatheGeometry(snowPts.map(([x, y]) => new THREE.Vector2(x * 1.02, y + 0.003)), 24), toon(0xffffff), 0.01);
  fuji.add(m, snow);
  fuji.position.set(-1.2, 0, -1.3);
  g.add(fuji);
  const tt = tokyoTower();
  tt.position.set(0.45, 0, -0.35);
  g.add(tt);
  const t = torii();
  t.position.set(0.05, 0, 0.4);
  g.add(t);
  const p = pagoda();
  p.position.set(-0.45, 0, 0.1);
  g.add(p);
  for (let i = 0; i < 9; i++) {
    const s = sakura(1.2);
    const a = (i / 9) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.75, 0, Math.sin(a) * 0.75 + 0.1);
    g.add(s);
  }
  return g;
}
function sphinx() {
  const g = new THREE.Group();
  const sand = 0xd9b36c;
  const body = box(0.1, 0.07, 0.3, sand, 0.007);
  const paws = box(0.1, 0.03, 0.12, sand, 0.005);
  paws.position.z = 0.19;
  const head = box(0.08, 0.1, 0.08, sand, 0.006);
  head.position.set(0, 0.06, 0.12);
  const nemes = cone(0.08, 0.06, 4, 0xc9a45c, 0.005);
  nemes.position.set(0, 0.16, 0.12);
  nemes.rotation.y = Math.PI / 4;
  g.add(body, paws, head, nemes);
  return g;
}
function camel() {
  const g = new THREE.Group();
  const c = 0xc28a4e;
  const body = inked(new THREE.CapsuleGeometry(0.03, 0.08, 4, 8), toon(c), 0.005);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.09;
  const hump = inked(new THREE.SphereGeometry(0.03, 8, 6), toon(c), 0.004);
  hump.position.y = 0.12;
  const neck = cyl(0.012, 0.012, 0.09, 5, c, 0.004);
  neck.position.set(0, 0.08, 0.06);
  neck.rotation.x = 0.5;
  const head = box(0.025, 0.02, 0.05, c, 0.004);
  head.position.set(0, 0.16, 0.1);
  g.add(body, hump, neck, head);
  [[-0.02, -0.04], [0.02, -0.04], [-0.02, 0.04], [0.02, 0.04]].forEach(([x, z]) => {
    const l = cyl(0.007, 0.007, 0.07, 4, c, 0.003);
    l.position.set(x, 0, z);
    g.add(l);
  });
  return g;
}
function cairo() {
  const g = new THREE.Group();
  [[-0.35, -0.5, 0.5], [0.3, -0.8, 0.38], [-0.9, -0.1, 0.3]].forEach(([x, z, s]) => {
    const p = cone(s, s * 1.1, 4, 0xe9c46a, 0.012);
    p.position.set(x, 0, z);
    p.rotation.y = Math.PI / 4;
    g.add(p);
  });
  const s = sphinx();
  s.position.set(0.45, 0, 0.05);
  s.rotation.y = -0.4;
  g.add(s);
  [[0.1, 0.55], [0.3, 0.7]].forEach(([x, z]) => { const c = camel(); c.position.set(x, 0, z); c.rotation.y = 1.2; g.add(c); });
  for (let i = 0; i < 6; i++) { const p = palm(1.1); p.position.set(0.8 - i * 0.14, 0, 0.45 + (i % 2) * 0.1); g.add(p); }
  return g;
}
function eiffel() {
  const g = new THREE.Group();
  const iron = 0x8c5a3c;
  // four legs leaning in, then the shaft in three tapering stages
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = box(0.05, 0.36, 0.05, iron, 0.006);
    leg.position.set(x * 0.17, 0, z * 0.17);
    leg.rotation.set(-z * 0.4, 0, x * 0.4);
    g.add(leg);
  });
  const arch = inked(new THREE.TorusGeometry(0.12, 0.012, 6, 16, Math.PI), toon(iron), 0.004);
  arch.position.set(0, 0.13, 0.17);
  const arch2 = arch.clone();
  arch2.rotation.y = Math.PI / 2;
  arch2.position.set(0.17, 0.13, 0);
  const d1 = box(0.3, 0.035, 0.3, iron, 0.006);
  d1.position.y = 0.33;
  const s1 = cyl(0.12, 0.07, 0.34, 4, iron, 0.006);
  s1.position.y = 0.36;
  s1.rotation.y = Math.PI / 4;
  const d2 = box(0.13, 0.025, 0.13, iron, 0.005);
  d2.position.y = 0.7;
  const s2 = cyl(0.06, 0.012, 0.5, 4, iron, 0.005);
  s2.position.y = 0.72;
  s2.rotation.y = Math.PI / 4;
  const tip = cyl(0.006, 0.004, 0.1, 4, iron, 0.002);
  tip.position.y = 1.22;
  g.add(arch, arch2, d1, s1, d2, s2, tip);
  g.scale.setScalar(1.1);
  return g;
}
function arc() {
  const g = new THREE.Group();
  const c = 0xeee2c8;
  [-0.08, 0.08].forEach((x) => { const p = box(0.07, 0.2, 0.08, c, 0.006); p.position.x = x; g.add(p); });
  const top = box(0.23, 0.07, 0.08, c, 0.006);
  top.position.y = 0.2;
  g.add(top);
  return g;
}
function haussmann() {
  const g = new THREE.Group();
  const h = range(0.14, 0.2);
  const b = box(0.16, h, 0.12, 0xf1e6cf, 0.006);
  windows(b, 0.16, h, 0.12, 3, 3, 0x6d7a9a, 0.02);
  const roof = box(0.16, 0.05, 0.1, 0x7d8aa6, 0.005);
  roof.position.y = h;
  g.add(b, roof);
  return g;
}
function paris() {
  const g = new THREE.Group();
  g.add(eiffel());
  const a = arc();
  a.position.set(0.8, 0, 0.55);
  a.rotation.y = -0.5;
  g.add(a);
  for (let i = 0; i < 10; i++) {
    const h = haussmann();
    const ang = Math.PI * 1.05 + (i / 10) * Math.PI * 0.9;
    h.position.set(Math.cos(ang) * 0.95, 0, Math.sin(ang) * 0.75 - 0.25);
    h.rotation.y = -ang - Math.PI / 2;
    g.add(h);
  }
  return g;
}
function liberty() {
  const g = new THREE.Group();
  const star = cyl(0.2, 0.2, 0.05, 8, 0xd8cdb8, 0.006);
  const ped = box(0.16, 0.2, 0.16, 0xd8cdb8, 0.007);
  ped.position.y = 0.05;
  const green = 0x6fc2a5;
  const robe = cone(0.09, 0.4, 12, green, 0.007);
  robe.position.y = 0.25;
  const head = inked(new THREE.SphereGeometry(0.045, 12, 10), toon(green), 0.006);
  head.position.y = 0.66;
  const arm = cyl(0.016, 0.016, 0.2, 6, green, 0.004);
  arm.position.set(0.05, 0.56, 0);
  arm.rotation.z = -0.2;
  const flame = lantern(0xffc53d, 0.03);
  flame.position.set(0.1, 0.8, 0);
  const tablet = box(0.05, 0.07, 0.015, green, 0.003);
  tablet.position.set(-0.07, 0.48, 0.03);
  g.add(star, ped, robe, head, arm, flame, tablet);
  for (let i = 0; i < 7; i++) {
    const spike = cone(0.008, 0.045, 4, green, 0.002);
    const a = i * 0.45 - 1.35;
    spike.position.set(Math.sin(a) * 0.04, 0.69, Math.cos(a) * 0.04);
    spike.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7);
    g.add(spike);
  }
  return g;
}
function empireState() {
  const g = new THREE.Group();
  let y = 0;
  [[0.2, 0.3], [0.15, 0.3], [0.1, 0.2], [0.06, 0.1]].forEach(([w, h]) => {
    const b = box(w, h, w, 0xd6cbb8, 0.007);
    b.position.y = y;
    windows(b, w, h, w, Math.floor(h / 0.06), 3, 0x6d7a9a, 0);
    g.add(b);
    y += h;
  });
  const spire = cyl(0.01, 0.004, 0.2, 5, 0xbfc6d6, 0.003);
  spire.position.y = y;
  g.add(spire);
  return g;
}
function newYork() {
  const g = new THREE.Group();
  const l = liberty();
  l.position.set(0.55, 0, 0.45);
  l.rotation.y = -0.6;
  g.add(l);
  const e = empireState();
  e.position.set(-0.35, 0, -0.3);
  g.add(e);
  const colors = [0x9fb3d9, 0xc8d3e8, 0x7f8fb8, 0xe1b8d8, 0xb8e1dc, 0xa8b8d8];
  for (let i = 0; i < 22; i++) {
    const x = range(-1.1, 0.25), z = range(-1.0, 0.1);
    if (Math.hypot(x + 0.35, z + 0.3) < 0.18) continue;
    const h = range(0.2, 0.62), w = range(0.08, 0.13);
    const b = box(w, h, w, pick(colors), 0.006);
    windows(b, w, h, w, Math.floor(h / 0.07), 2, 0x5d6d98, 0);
    b.position.set(x, 0, z);
    g.add(b);
  }
  return g;
}
const CITY: Record<string, () => THREE.Group> = { singapore, tokyo, cairo, paris, newyork: newYork };

/** The local frame for a world stop: +z points north, so the sets are laid out consistently. */
export function worldFrame(i: number) {
  return new Local(WORLD[i].dir, new THREE.Vector3(0, 1, 0).sub(WORLD[i].dir.clone().multiplyScalar(WORLD[i].dir.y)));
}
export function worldLandmarks() {
  const g = new THREE.Group();
  WORLD.forEach((stop, i) => {
    const L = worldFrame(i);
    // Sets are authored flat around (0, 0). Each piece is lifted off at its own
    // (x, z) and re-stood on the curve there, so wide sets hug the planet.
    [...CITY[stop.id]().children].forEach((child) => {
      const { x, z } = child.position, yaw = child.rotation.y;
      child.position.set(0, 0, 0);
      child.rotation.y = 0;
      const holder = new THREE.Group();
      holder.add(child);
      g.add(L.place(holder, x, z, yaw));
    });
  });
  return g;
}

/* ========================================================= the drum */

function drumFace() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  const bg = x.createRadialGradient(512, 512, 40, 512, 512, 512);
  bg.addColorStop(0, "#e2b05f"); bg.addColorStop(0.55, "#c58a44"); bg.addColorStop(0.92, "#9a6a36"); bg.addColorStop(1, "#5f8f7a");
  x.fillStyle = bg;
  x.fillRect(0, 0, 1024, 1024);
  x.translate(512, 512);
  x.strokeStyle = "#6e3f1f";
  x.lineCap = "round";
  const ring = (r: number, w = 5) => { x.lineWidth = w; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); };
  // the fourteen-point sun
  x.fillStyle = "#ffe29a";
  x.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 44 : 140;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath(); x.fill(); x.lineWidth = 5; x.stroke();
  x.fillStyle = "#6e3f1f";
  x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill();
  ring(170); ring(182, 3);
  // band of little circles
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; x.beginPath(); x.arc(Math.cos(a) * 200, Math.sin(a) * 200, 8, 0, 7); x.lineWidth = 3; x.stroke(); }
  ring(220); ring(230, 3);
  // flying Lạc birds circling the sun
  for (let i = 0; i < 12; i++) {
    x.save();
    x.rotate((i / 12) * Math.PI * 2);
    x.translate(0, -290);
    x.fillStyle = "#6e3f1f";
    x.beginPath();
    x.moveTo(-34, 6); x.quadraticCurveTo(-8, -14, 20, -4); x.lineTo(40, -18); x.lineTo(30, 2); x.quadraticCurveTo(0, 16, -34, 6);
    x.fill();
    x.restore();
  }
  ring(345); ring(355, 3);
  // ticks and a final band of zigzags
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    x.lineWidth = 3;
    x.beginPath(); x.moveTo(Math.cos(a) * 365, Math.sin(a) * 365); x.lineTo(Math.cos(a) * 395, Math.sin(a) * 395); x.stroke();
  }
  ring(405); ring(450, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function drumSides() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = "#b37a3e";
  x.fillRect(0, 0, 1024, 256);
  x.strokeStyle = "#6e3f1f";
  x.lineWidth = 4;
  [30, 44, 110, 124, 190, 204].forEach((y) => { x.beginPath(); x.moveTo(0, y); x.lineTo(1024, y); x.stroke(); });
  // boats and feathered warriors, suggested as rhythmic marks
  for (let i = 0; i < 16; i++) {
    const cx = i * 64 + 32;
    x.beginPath(); x.moveTo(cx - 26, 90); x.quadraticCurveTo(cx, 104, cx + 26, 90); x.stroke();
    x.beginPath(); x.moveTo(cx - 6, 88); x.lineTo(cx - 2, 62); x.moveTo(cx + 6, 88); x.lineTo(cx + 10, 64); x.stroke();
    x.beginPath(); x.arc(cx, 166, 10, 0, 7); x.stroke();
  }
  // verdigris creeping up from the foot
  const patina = x.createLinearGradient(0, 256, 0, 150);
  patina.addColorStop(0, "rgba(95,143,122,0.75)"); patina.addColorStop(1, "rgba(95,143,122,0)");
  x.fillStyle = patina; x.fillRect(0, 150, 1024, 106);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}
function frog() {
  const f = new THREE.Group();
  const bronze = 0x9c6a3a;
  const b = inked(new THREE.SphereGeometry(0.05, 10, 8), toon(bronze), 0.005);
  b.scale.set(1, 0.7, 1.3);
  const h = inked(new THREE.SphereGeometry(0.03, 8, 6), toon(bronze), 0.004);
  h.position.set(0, 0.03, 0.055);
  f.add(b, h);
  return f;
}
export function drumPlaza() {
  const L = new Local(PLAZA, new THREE.Vector3(0, 0, 1));
  const g = new THREE.Group();
  L.place(g, 0, 0);
  // Đông Sơn profile, foot to face: flared foot, straight waist, bulging shoulder, overhanging face
  const profile = [[0, 0], [0.72, 0], [0.74, 0.04], [0.62, 0.2], [0.6, 0.3], [0.66, 0.4], [0.78, 0.5], [0.8, 0.56], [0.78, 0.6], [0.84, 0.62], [0.84, 0.65], [0, 0.65]]
    .map(([a, b]) => new THREE.Vector2(a, b));
  const body = inked(new THREE.LatheGeometry(profile, 56), new THREE.MeshToonMaterial({ map: drumSides(), gradientMap: toon(0xffffff).gradientMap }), 0.02);
  body.castShadow = true;
  const faceMat = new THREE.MeshToonMaterial({ map: drumFace(), emissive: 0xffb347, emissiveIntensity: 0, gradientMap: toon(0xffffff).gradientMap });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.84, 64), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.651;
  face.receiveShadow = true;
  const drum = new THREE.Group();
  drum.add(body, face);
  // handles and the four frogs on the rim
  [0, Math.PI].forEach((a) => {
    const handle = inked(new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), toon(0x9c6a3a), 0.004);
    handle.position.set(Math.cos(a) * 0.72, 0.42, Math.sin(a) * 0.72);
    handle.rotation.set(0, -a, Math.PI / 2);
    drum.add(handle);
  });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const f = frog();
    f.position.set(Math.cos(a) * 0.74, 0.66, Math.sin(a) * 0.74);
    f.rotation.y = -a - Math.PI / 2;
    drum.add(f);
  }
  g.add(drum);
  // a ring of little flags from everywhere the crew has been
  const flags = [["#da251d"], ...WORLD.map((w) => w.flag)];
  for (let i = 0; i < 12; i++) {
    const f = makeFlag(flags[i % flags.length], 0.9);
    f.scale.setScalar(0.3);
    const a = (i / 12) * Math.PI * 2;
    f.position.set(Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75);
    f.rotation.y = -a;
    g.add(f);
  }
  return { group: g, faceMat, drum };
}
