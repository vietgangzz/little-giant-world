import * as THREE from "three";
import { rng } from "./noise";
import { halftone, inked, toon } from "./toon";
import { makeFlag } from "./mascot";
import { R, roadA, standOn, STOPS, WORLD, PLAZA } from "./world";

const random = rng(99);
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

export function box(w: number, h: number, d: number, color: number | THREE.Material, ink = 0.012) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
function cone(r: number, h: number, seg: number, color: number, ink = 0.012) {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
function cyl(r0: number, r1: number, h: number, seg: number, color: number, ink = 0.012) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
function glow(color: number) {
  return new THREE.MeshToonMaterial({ color, emissive: color, emissiveIntensity: 0.8, gradientMap: toon(color).gradientMap });
}

/** A site is a group standing on the planet, with local +Y = up. */
function site(direction: THREE.Vector3, heading?: THREE.Vector3, lift = 0) {
  const g = new THREE.Group();
  standOn(g, direction, lift, 0, heading);
  return g;
}
/** Local frame helpers for a direction beside road A. */
export function roadFrame(theta: number) {
  const up = roadA.dir(theta);
  const fwd = roadA.tangent(theta);
  // `side` follows Ring.point's lane convention; `right` completes a right-handed basis.
  const side = new THREE.Vector3().crossVectors(fwd, up).normalize();
  const right = side.clone().negate();
  return { up, fwd, side, right };
}
function besideRoad(theta: number, offset: number) {
  const { up, side } = roadFrame(theta);
  return up.clone().multiplyScalar(R).addScaledVector(side, offset).normalize();
}

/* ---------------------------------------------------------------- houses */

function house(wall: number, roof: number, s = 1) {
  const g = new THREE.Group();
  g.add(box(0.2 * s, 0.14 * s, 0.16 * s, wall));
  const r = cone(0.17 * s, 0.1 * s, 4, roof);
  r.position.y = 0.14 * s;
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, 0.8);
  g.add(r);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.05 * s, 0.08 * s), toon(0x3b2340));
  door.position.set(0, 0.04 * s, 0.081 * s);
  g.add(door);
  return g;
}
function scatterOn(parent: THREE.Group, center: THREE.Vector3, count: number, spread: number, make: (i: number) => THREE.Object3D, avoidRoad = 0.05) {
  let placed = 0, tries = 0;
  const { up } = { up: center.clone().normalize() };
  const t1 = new THREE.Vector3(up.y, -up.x, 0.3).cross(up).normalize();
  const t2 = new THREE.Vector3().crossVectors(up, t1);
  while (placed < count && tries++ < count * 20) {
    const a = random() * Math.PI * 2, r = Math.sqrt(random()) * spread;
    const d = up.clone().multiplyScalar(R).addScaledVector(t1, Math.cos(a) * r).addScaledVector(t2, Math.sin(a) * r).normalize();
    if (Math.abs(d.dot(roadA.normal)) < avoidRoad / R) continue;
    const o = make(placed);
    standOn(o, d, 0, random() * 6.28);
    parent.add(o);
    placed++;
  }
}

/* ------------------------------------------------------- Vietnam, chapter by chapter */

export function haGiang() {
  const g = new THREE.Group();
  const home = besideRoad(STOPS.home, 0.55);
  // the Little Giant's own house, a stilt house with a warm window
  const hut = new THREE.Group();
  [[-0.1, -0.08], [0.1, -0.08], [-0.1, 0.08], [0.1, 0.08]].forEach(([x, z]) => {
    const post = cyl(0.015, 0.015, 0.1, 5, 0x6b4a3a, 0.006);
    post.position.set(x, 0, z);
    hut.add(post);
  });
  const hh = house(0xe8c79a, 0x8a4a3b, 1.5);
  hh.position.y = 0.1;
  hut.add(hh);
  standOn(hut, home, 0, 0, roadFrame(STOPS.home).side.negate());
  g.add(hut);
  // rice terraces: stacked discs, alternating the two greens of young and ripe rice
  [[0.1, 0.95], [0.3, -0.85], [-0.2, 1.05], [0.55, -0.95]].forEach(([dt, off], k) => {
    const hill = new THREE.Group();
    const steps = 5 + k % 2;
    for (let i = 0; i < steps; i++) {
      const r = 0.42 - i * 0.07;
      const disc = cyl(r, r * 0.97, 0.07, 22, i % 2 ? 0xc6e05a : 0x7ccf4a, 0.01);
      disc.position.y = i * 0.07 - 0.05;
      hill.add(disc);
    }
    standOn(hill, besideRoad(STOPS.home + dt, off), -0.02);
    g.add(hill);
  });
  scatterOn(g, besideRoad(STOPS.haGiang, -0.62), 5, 0.3, () => house(pick([0xf3e3c3, 0xe8c79a]), pick([0x8a4a3b, 0x5d6a8a])));
  // Lũng Cú: the flag on the northern tip
  const flag = makeFlag(["#da251d"], 1.3);
  flag.scale.setScalar(0.35);
  standOn(flag, besideRoad(-0.34, -0.1), 0);
  g.add(flag);
  return g;
}

export function haLong() {
  const g = new THREE.Group();
  const shape = (h: number) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector2(0.16 * (1 - Math.pow(t, 2.5)) + 0.02 * Math.sin(t * 9), t * h));
    }
    pts.push(new THREE.Vector2(0, h));
    return new THREE.LatheGeometry(pts, 9);
  };
  for (let i = 0; i < 26; i++) {
    const t = STOPS.haLong + (random() - 0.5) * 0.42;
    const off = (random() < 0.5 ? -1 : 1) * (0.8 + random() * 1.3);
    const k = new THREE.Group();
    const h = 0.35 + random() * 0.55;
    const rock = inked(shape(h), 0xa89cb6, 0.012);
    const cap = inked(new THREE.IcosahedronGeometry(0.1, 1), 0x3fae4c, 0.01);
    cap.position.y = h * 0.92;
    cap.scale.set(1, 0.6, 1);
    k.add(rock, cap);
    k.scale.setScalar(0.8 + random() * 0.6);
    standOn(k, besideRoad(t, off), -0.15, random() * 6);
    g.add(k);
  }
  // a junk boat with red sails
  const boat = new THREE.Group();
  const hull = box(0.32, 0.06, 0.1, 0x7a4b3a);
  boat.add(hull);
  [-0.08, 0.06].forEach((x) => {
    const sail = inked(new THREE.PlaneGeometry(0.1, 0.16), new THREE.MeshToonMaterial({ color: 0xe0503a, side: THREE.DoubleSide }), 0);
    sail.position.set(x, 0.14, 0);
    boat.add(sail);
  });
  boat.rotation.y = 1.2;
  standOn(boat, besideRoad(STOPS.haLong + 0.05, 0.55), 0);
  boat.userData.bob = true;
  g.add(boat);
  return g;
}

export function hoiAn() {
  const g = new THREE.Group();
  const center = besideRoad(STOPS.hoiAn, -0.42);
  scatterOn(g, center, 9, 0.38, () => house(0xf7c948, pick([0x9c4a2f, 0x7a3b2a]), 1.1), 0.36);
  // lantern strings across the road
  const colors = [0xff4d4d, 0xffc53d, 0xff8a3d, 0xe23d8a, 0x7cd35d];
  for (let s = -2; s <= 2; s++) {
    const t = STOPS.hoiAn + s * 0.022;
    const { up, fwd, right } = roadFrame(t);
    const holder = new THREE.Group();
    const base = roadA.point(t, 0);
    holder.position.copy(base);
    holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
    [-0.3, 0.3].forEach((x) => {
      const pole = cyl(0.012, 0.012, 0.42, 5, 0x6b4a3a, 0.005);
      pole.position.x = x;
      holder.add(pole);
    });
    for (let i = 0; i < 6; i++) {
      const x = -0.25 + i * 0.1;
      const sag = 0.4 - Math.sin(((i + 0.5) / 6) * Math.PI) * 0.06;
      const lantern = inked(new THREE.SphereGeometry(0.035, 10, 8), glow(colors[(i + s + 5) % colors.length]), 0.008);
      lantern.scale.set(1, 1.25, 1);
      lantern.position.set(x, sag, 0);
      holder.add(lantern);
    }
    g.add(holder);
  }
  return g;
}

export function saiGon() {
  const g = new THREE.Group();
  const center = besideRoad(STOPS.saiGon, -0.5);
  const palette = [0xff6b6b, 0xffc93c, 0x6bcBff, 0xa78bfa, 0x5ee6a8, 0xff8fd0, 0xff9f43];
  scatterOn(g, center, 22, 0.42, () => {
    const h = 0.12 + random() * 0.35;
    const b = box(0.1 + random() * 0.06, h, 0.1 + random() * 0.06, pick(palette), 0.01);
    return b;
  }, 0.4);
  // Landmark 81, the tall one on the skyline
  const tower = new THREE.Group();
  [[0.16, 0.5], [0.13, 0.38], [0.1, 0.3], [0.07, 0.22], [0.04, 0.16]].reduce((y, [w, h]) => {
    const b = box(w, h, w, 0xbfd7ea, 0.012);
    b.position.y = y;
    tower.add(b);
    return y + h;
  }, 0);
  const spire = cone(0.02, 0.2, 6, 0xdfe9f5, 0.006);
  spire.position.y = 1.56;
  tower.add(spire);
  standOn(tower, besideRoad(STOPS.saiGon + 0.03, -0.62), 0);
  g.add(tower);
  return g;
}

export function airport() {
  const g = new THREE.Group();
  const t = STOPS.airport;
  const tower = new THREE.Group();
  tower.add(cyl(0.04, 0.035, 0.45, 8, 0xf4f1ff));
  const cab = cyl(0.08, 0.1, 0.08, 8, 0x7fd6ff);
  cab.position.y = 0.45;
  tower.add(cab);
  standOn(tower, besideRoad(t + 0.03, -0.45), 0);
  g.add(tower);
  return g;
}

/* ----------------------------------------------------------- world stops */

function eiffel() {
  const g = new THREE.Group();
  const bronze = 0x8c5a3c;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = box(0.06, 0.5, 0.06, bronze, 0.008);
    leg.position.set(x * 0.2, 0, z * 0.2);
    leg.rotation.set(-z * 0.32, 0, x * 0.32);
    g.add(leg);
  });
  const deck1 = box(0.36, 0.04, 0.36, bronze);
  deck1.position.y = 0.44;
  const mid = cone(0.17, 0.8, 4, bronze, 0.01);
  mid.position.y = 0.48;
  mid.rotation.y = Math.PI / 4;
  const deck2 = box(0.15, 0.03, 0.15, bronze);
  deck2.position.y = 0.9;
  const top = cone(0.07, 0.62, 4, bronze, 0.008);
  top.position.y = 0.92;
  top.rotation.y = Math.PI / 4;
  g.add(deck1, mid, deck2, top);
  g.scale.setScalar(1.4);
  return g;
}
function liberty() {
  const g = new THREE.Group();
  g.add(box(0.26, 0.24, 0.26, 0xd8cdb8));
  const robe = cone(0.12, 0.55, 10, 0x6fc2a5);
  robe.position.y = 0.24;
  const head = inked(new THREE.SphereGeometry(0.06, 12, 10), toon(0x6fc2a5), 0.01);
  head.position.y = 0.82;
  const arm = cyl(0.02, 0.02, 0.26, 6, 0x6fc2a5, 0.008);
  arm.position.set(0.07, 0.68, 0);
  arm.rotation.z = -0.25;
  const flame = inked(new THREE.SphereGeometry(0.04, 10, 8), glow(0xffc53d), 0.008);
  flame.position.set(0.14, 0.97, 0);
  flame.scale.set(1, 1.5, 1);
  g.add(robe, head, arm, flame);
  for (let i = 0; i < 5; i++) {
    const spike = cone(0.012, 0.06, 4, 0x6fc2a5, 0.004);
    spike.position.set(Math.cos(i * 0.6 - 1.2) * 0.05, 0.86, Math.sin(i * 0.6 - 1.2) * 0.05);
    spike.rotation.z = -Math.cos(i * 0.6 - 1.2) * 0.6;
    g.add(spike);
  }
  g.scale.setScalar(1.3);
  return g;
}
function manhattan() {
  const g = new THREE.Group();
  const colors = [0x9fb3d9, 0xc8d3e8, 0x7f8fb8, 0xe1b8d8, 0xb8e1dc];
  for (let i = 0; i < 12; i++) {
    const h = 0.25 + random() * 0.7;
    const b = box(0.1, h, 0.1, pick(colors), 0.01);
    b.position.set(0.45 + (i % 4) * 0.13, 0, -0.2 + Math.floor(i / 4) * 0.14);
    g.add(b);
  }
  return g;
}
function fuji() {
  const g = new THREE.Group();
  const m = cone(1.1, 1.0, 20, 0x6f7fc8, 0.02);
  m.position.set(-0.8, 0, -0.6);
  const snow = cone(0.45, 0.42, 20, 0xffffff, 0.015);
  snow.position.set(-0.8, 0.6, -0.6);
  g.add(m, snow);
  const torii = new THREE.Group();
  [-0.14, 0.14].forEach((x) => { const p = cyl(0.02, 0.02, 0.3, 8, 0xe03a3a, 0.008); p.position.x = x; torii.add(p); });
  const beam = box(0.42, 0.035, 0.05, 0xe03a3a, 0.008);
  beam.position.y = 0.3;
  const beam2 = box(0.34, 0.025, 0.04, 0xe03a3a, 0.008);
  beam2.position.y = 0.23;
  torii.add(beam, beam2);
  torii.position.set(0.3, 0, 0.3);
  g.add(torii);
  const pagoda = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const w = 0.16 - i * 0.025;
    const b = box(w, 0.08, w, 0xf4e6d0, 0.008);
    b.position.y = i * 0.11;
    const roof = cone(w * 0.95, 0.05, 4, 0x3b3f63, 0.008);
    roof.position.y = i * 0.11 + 0.07;
    roof.rotation.y = Math.PI / 4;
    pagoda.add(b, roof);
  }
  pagoda.position.set(0.55, 0, -0.25);
  g.add(pagoda);
  return g;
}
function pyramids() {
  const g = new THREE.Group();
  [[0, 0, 0.5], [0.55, -0.35, 0.38], [-0.45, 0.3, 0.3]].forEach(([x, z, s]) => {
    const p = cone(s, s * 1.15, 4, 0xe9c46a, 0.015);
    p.position.set(x, 0, z);
    p.rotation.y = Math.PI / 4;
    g.add(p);
  });
  for (let i = 0; i < 4; i++) {
    const palm = new THREE.Group();
    const trunk = cyl(0.015, 0.02, 0.22, 5, 0x9c6b3f, 0.006);
    palm.add(trunk);
    for (let k = 0; k < 5; k++) {
      const leaf = box(0.14, 0.01, 0.035, 0x3fae4c, 0.005);
      leaf.position.y = 0.21;
      leaf.rotation.set(0, (k / 5) * Math.PI * 2, -0.35);
      leaf.geometry.translate(0.07, 0, 0);
      palm.add(leaf);
    }
    palm.position.set(0.7 - i * 0.18, 0, 0.5);
    g.add(palm);
  }
  return g;
}
function merlion() {
  const g = new THREE.Group();
  const base = cyl(0.14, 0.16, 0.1, 12, 0xd8cdb8);
  const body = cyl(0.09, 0.07, 0.34, 10, 0xf6f4ef);
  body.position.y = 0.1;
  const head = inked(new THREE.IcosahedronGeometry(0.1, 1), toon(0xf6f4ef), 0.012);
  head.position.set(0, 0.5, 0.02);
  const jet = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.5, 0.1), new THREE.Vector3(0, 0.7, 0.45), new THREE.Vector3(0, 0.05, 0.75)), 20, 0.02, 6),
    new THREE.MeshToonMaterial({ color: 0x9fe7ff, emissive: 0x3aa0d0, emissiveIntensity: 0.4 }),
  );
  g.add(base, body, head, jet);
  // Marina Bay Sands: three towers and the ship on top
  const mbs = new THREE.Group();
  [-0.18, 0, 0.18].forEach((x) => {
    const t = box(0.1, 0.6, 0.08, 0xdfe7ef, 0.01);
    t.position.x = x;
    t.rotation.z = x * 0.2;
    mbs.add(t);
  });
  const deck = box(0.62, 0.04, 0.1, 0xb9c8d8, 0.01);
  deck.position.y = 0.6;
  mbs.add(deck);
  mbs.position.set(-0.55, 0, -0.35);
  g.add(mbs);
  g.scale.setScalar(1.3);
  return g;
}
const LANDMARKS: Record<string, () => THREE.Object3D> = {
  singapore: merlion,
  tokyo: fuji,
  cairo: pyramids,
  paris: eiffel,
  newyork: () => { const g = new THREE.Group(); g.add(liberty(), manhattan()); return g; },
};

export function worldLandmarks() {
  const g = new THREE.Group();
  WORLD.forEach((stop) => {
    const s = site(stop.dir, new THREE.Vector3(0, 1, 0));
    s.add(LANDMARKS[stop.id]());
    s.userData.stop = stop.id;
    // a few local houses
    scatterOn(g, stop.dir, 6, 0.9, () => house(pick([0xf3e3c3, 0xffd6a5, 0xcfe8ff]), pick([0xe03a5c, 0x5d6a8a, 0x8a4a3b])), 0);
    g.add(s);
  });
  return g;
}

/* ------------------------------------------------------------ the drum */

function drumTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d")!;
  const bg = x.createRadialGradient(256, 256, 30, 256, 256, 256);
  bg.addColorStop(0, "#d9a05a"); bg.addColorStop(0.7, "#b0763a"); bg.addColorStop(1, "#5f8f7a");
  x.fillStyle = bg;
  x.fillRect(0, 0, 512, 512);
  x.translate(256, 256);
  x.strokeStyle = "#6e3f1f";
  // concentric bands with ticks and birds-in-flight dashes
  for (let r = 78; r < 250; r += 42) {
    x.lineWidth = 4;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
    const n = Math.floor(r / 5);
    x.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (Math.round((r - 78) / 42) % 2 === 0) {
        x.beginPath(); x.moveTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4)); x.lineTo(Math.cos(a) * (r + 20), Math.sin(a) * (r + 20)); x.stroke();
      } else {
        x.beginPath(); x.arc(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12), 3, 0, 7); x.stroke();
      }
    }
  }
  // the fourteen-point sun
  x.fillStyle = "#ffe29a";
  x.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2, r = i % 2 ? 26 : 72;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath(); x.fill();
  x.lineWidth = 3; x.stroke();
  x.fillStyle = "#6e3f1f";
  x.beginPath(); x.arc(0, 0, 12, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function drumPlaza() {
  const g = site(PLAZA, new THREE.Vector3(0, 0, 1));
  const profile = [[0, 0], [0.66, 0], [0.7, 0.06], [0.6, 0.22], [0.56, 0.36], [0.7, 0.5], [0.74, 0.55], [0, 0.55]].map(
    ([a, b]) => new THREE.Vector2(a, b));
  const body = inked(new THREE.LatheGeometry(profile, 40), toon(0x9c6a3a), 0.02);
  const faceMat = new THREE.MeshToonMaterial({ map: drumTexture(), emissive: 0xffb347, emissiveIntensity: 0 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.74, 48), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.552;
  face.receiveShadow = true;
  const drum = new THREE.Group();
  drum.add(body, face);
  g.add(drum);
  // a ring of little flags from everywhere the crew has been
  const flags = [["#da251d"], ...WORLD.map((w) => w.flag)];
  for (let i = 0; i < 12; i++) {
    const f = makeFlag(flags[i % flags.length], 0.9);
    f.scale.setScalar(0.28);
    const a = (i / 12) * Math.PI * 2;
    f.position.set(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45);
    f.rotation.y = -a;
    g.add(f);
  }
  return { group: g, faceMat, drum };
}

/* --------------------------------------------------------------- vehicles */

/** Xe máy: the Little Giant's scooter. Slots are where passengers stack. */
export function motorbike() {
  const g = new THREE.Group();
  const red = 0xe63946;
  const body = box(0.13, 0.08, 0.44, red, 0.012);
  body.position.y = 0.07;
  const seat = box(0.12, 0.03, 0.26, 0x2a1f3d, 0.008);
  seat.position.set(0, 0.15, -0.06);
  const front = box(0.13, 0.2, 0.06, red, 0.012);
  front.position.set(0, 0.07, 0.2);
  front.rotation.x = -0.25;
  const bar = cyl(0.01, 0.01, 0.22, 6, 0x2a1f3d, 0.005);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0.11, 0.3, 0.22);
  const lamp = inked(new THREE.SphereGeometry(0.03, 10, 8), glow(0xfff3b0), 0.006);
  lamp.position.set(0, 0.26, 0.26);
  const wheelGeo = new THREE.TorusGeometry(0.06, 0.025, 8, 16);
  const wheels = [0.2, -0.18].map((z) => {
    const w = inked(wheelGeo, 0x1b1530, 0.006);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.06, z);
    g.add(w);
    return w;
  });
  g.add(body, seat, front, bar, lamp);
  // 9 on one bike: 3 in a line, 3 on their heads, then 2, then 1 on top
  const H = 0.3 / 1.35; // one mascot tall, in the bike's own (scaled) units
  const slots = [
    [0, 0.16, 0.08], [0, 0.16, -0.05], [0, 0.16, -0.18],
    [0, 0.16 + H, 0.08], [0, 0.16 + H, -0.05], [0, 0.16 + H, -0.18],
    [0, 0.16 + H * 2, 0.02], [0, 0.16 + H * 2, -0.12],
    [0, 0.16 + H * 3, -0.05],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return { group: g, slots, wheels };
}

function bannerTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 160;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff8e7"; x.fillRect(0, 0, 1024, 160);
  x.strokeStyle = "#24163f"; x.lineWidth = 14; x.strokeRect(0, 0, 1024, 160);
  x.font = "900 92px Bangers, Impact, sans-serif";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#e63946";
  x.fillText(text, 512, 88);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The crew's tour plane: long, open-topped, room for everyone. Faces +Z. */
export function tourPlane() {
  const g = new THREE.Group();
  const yellow = 0xffc93c;
  const fus = inked(new THREE.CapsuleGeometry(0.2, 1.1, 6, 14), toon(yellow), 0.018);
  fus.rotation.x = Math.PI / 2;
  fus.scale.set(1, 1, 0.8);
  const wing = box(1.7, 0.035, 0.3, 0xe63946, 0.014);
  wing.position.set(0, -0.08, 0.2);
  const wing2 = box(1.4, 0.03, 0.26, 0xe63946, 0.012);
  wing2.position.set(0, 0.24, 0.24);
  [-0.55, 0.55].forEach((x) => { const s = cyl(0.012, 0.012, 0.3, 5, 0x24163f, 0.004); s.position.set(x, -0.06, 0.24); g.add(s); });
  const tail = box(0.03, 0.26, 0.2, 0xe63946, 0.01);
  tail.position.set(0, 0.08, -0.72);
  const tailWing = box(0.55, 0.03, 0.16, 0xe63946, 0.01);
  tailWing.position.set(0, 0.1, -0.7);
  const nose = inked(new THREE.SphereGeometry(0.1, 12, 10), toon(0xf4f1ff), 0.01);
  nose.position.z = 0.78;
  const prop = new THREE.Group();
  [0, Math.PI / 2].forEach((a) => { const b = box(0.04, 0.44, 0.015, 0x24163f, 0); b.position.y = -0.22; b.rotation.z = a; b.geometry.translate(0, 0, 0); prop.add(b); });
  prop.children.forEach((b) => { (b as THREE.Mesh).geometry.center(); });
  prop.position.z = 0.88;
  g.add(fus, wing, wing2, tail, tailWing, nose, prop);
  // banner on a rope, trailing behind
  // two single-sided faces back to back, so the text reads correctly from either side
  const banner = new THREE.Group();
  const bannerGeo = new THREE.PlaneGeometry(1.8, 0.28, 16, 1);
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTexture("VIETGANG ♥ THE WORLD") });
  [Math.PI / 2, -Math.PI / 2].forEach((ry) => {
    const face = new THREE.Mesh(bannerGeo, bannerMat);
    face.rotation.y = ry;
    banner.add(face);
  });
  banner.position.set(0, 0.05, -2.2);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 4), toon(0x24163f));
  rope.rotation.x = Math.PI / 2;
  rope.position.set(0, 0.05, -1.05);
  g.add(banner, rope);
  // seats: two by five along the open top
  const slots: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) for (const [x, dz] of [[-0.13, 0.04], [0.13, -0.04]]) slots.push(new THREE.Vector3(x, 0.06, 0.42 - i * 0.2 + dz));
  return { group: g, prop, banner, slots };
}

export function smallPlane(color: number) {
  const g = new THREE.Group();
  const fus = inked(new THREE.CapsuleGeometry(0.06, 0.28, 4, 10), toon(color), 0.012);
  fus.rotation.x = Math.PI / 2;
  const wing = box(0.5, 0.02, 0.09, 0xf4f1ff, 0.008);
  const tail = box(0.16, 0.015, 0.06, 0xf4f1ff, 0.006);
  tail.position.z = -0.18;
  g.add(fus, wing, tail);
  return g;
}

export function car(color: number) {
  const g = new THREE.Group();
  g.add(box(0.1, 0.05, 0.18, color, 0.008));
  const cab = box(0.08, 0.045, 0.09, 0xf4f1ff, 0.008);
  cab.position.set(0, 0.05, -0.01);
  g.add(cab);
  return g;
}

/* ---------------------------------------------------------------- clouds */

export function clouds(count = 34) {
  const g = new THREE.Group();
  const material = halftone(new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toon(0xffffff).gradientMap }));
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const list: { obj: THREE.Object3D; axis: THREE.Vector3; speed: number }[] = [];
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const n = 3 + Math.floor(random() * 4);
    for (let k = 0; k < n; k++) {
      const puff = inked(geo, material, 0.06);
      const s = 0.18 + random() * 0.18;
      puff.scale.setScalar(s);
      puff.position.set((k - n / 2) * 0.22 + random() * 0.08, random() * 0.12 + (k % 2) * 0.1, random() * 0.15);
      puff.castShadow = true;
      cloud.add(puff);
    }
    const dir = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize();
    standOn(cloud, dir, 0, random() * 6);
    cloud.position.copy(dir.clone().multiplyScalar(R + 2.2 + random() * 1.3));
    cloud.scale.setScalar(0.7 + random() * 0.8);
    const holder = new THREE.Group();
    holder.add(cloud);
    g.add(holder);
    list.push({ obj: holder, axis: new THREE.Vector3(random() - 0.5, 1, random() - 0.5).normalize(), speed: 0.004 + random() * 0.01 });
  }
  return {
    group: g,
    update(dt: number) {
      list.forEach((c) => c.obj.rotateOnAxis(c.axis, c.speed * dt));
    },
  };
}

/* ------------------------------------------------------------- puff trails */

export class Trails {
  readonly mesh: THREE.InstancedMesh;
  private born: Float32Array;
  private pos: THREE.Vector3[];
  private next = 0;
  private dummy = new THREE.Object3D();
  constructor(readonly size = 900, readonly life = 1.8) {
    const material = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toon(0xffffff).gradientMap });
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), material, size);
    this.mesh.frustumCulled = false;
    this.born = new Float32Array(size).fill(-99);
    this.pos = Array.from({ length: size }, () => new THREE.Vector3());
  }
  emit(p: THREE.Vector3, now: number) {
    this.pos[this.next].copy(p);
    this.born[this.next] = now;
    this.next = (this.next + 1) % this.size;
  }
  update(now: number, scale = 1) {
    for (let i = 0; i < this.size; i++) {
      const age = (now - this.born[i]) / this.life;
      const s = age < 0 || age > 1 ? 0 : Math.sin(Math.min(1, age * 6) * Math.PI / 2) * (1 - age) * 0.05 * scale;
      this.dummy.position.copy(this.pos[i]);
      this.dummy.scale.setScalar(s);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* --------------------------------------------------------------- fireworks */

export class Fireworks {
  readonly points: THREE.Points;
  private velocities: Float32Array;
  private born: Float32Array;
  private base: Float32Array;
  private cursor = 0;
  constructor(readonly count = 2400) {
    const geo = new THREE.BufferGeometry();
    this.base = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(count), 1));
    this.velocities = new Float32Array(count * 3);
    this.born = new Float32Array(count).fill(-99);
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float alpha; varying float vA; varying vec3 vC;
        void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = 130.0/(-mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; varying vec3 vC;
        void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); if(d>0.5) discard;
          float core = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vC*(0.6+core), vA*core); }`,
    }));
    this.points.frustumCulled = false;
  }
  burst(at: THREE.Vector3, colors: number[], now: number, n = 90, speed = 1.1) {
    const col = this.points.geometry.getAttribute("color") as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.count;
      const v = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize().multiplyScalar(speed * (0.7 + random() * 0.5));
      this.base.set([at.x, at.y, at.z], i * 3);
      this.velocities.set([v.x, v.y, v.z], i * 3);
      this.born[i] = now;
      c.set(colors[k % colors.length]);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }
  update(now: number) {
    const pos = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const alpha = this.points.geometry.getAttribute("alpha") as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      const t = now - this.born[i];
      if (t < 0 || t > 1.6) { alpha.setX(i, 0); continue; }
      const drag = (1 - Math.exp(-t * 2.4)) / 2.4;
      const bx = this.base[i * 3], by = this.base[i * 3 + 1], bz = this.base[i * 3 + 2];
      // gravity pulls toward the planet's centre
      const len = Math.hypot(bx, by, bz) || 1;
      const g = 0.25 * t * t;
      pos.setXYZ(i,
        bx + this.velocities[i * 3] * drag - (bx / len) * g,
        by + this.velocities[i * 3 + 1] * drag - (by / len) * g,
        bz + this.velocities[i * 3 + 2] * drag - (bz / len) * g);
      alpha.setX(i, Math.max(0, 1 - t / 1.6));
    }
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
  }
}

/* ------------------------------------------------------------------ misc */

export function starfield(count = 2200) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize().multiplyScalar(260 + random() * 60);
    p.set([v.x, v.y, v.z], i * 3);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: true, transparent: true, depthWrite: false });
  return new THREE.Points(geo, mat);
}

