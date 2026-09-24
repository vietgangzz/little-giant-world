import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { CrewMember, Kit } from "./crew";
import { dome, inflate } from "./inflate";
import { artwork, FOREST, Mascot } from "./mascot";
import { mascotArtwork } from "./mascotArtwork";
import { inked, toon } from "./toon";

/**
 * Each crew member's signature prop, rebuilt in 3D from the studio board's SVG
 * drawings. Positions are written in the board's own SVG coordinates and mapped
 * onto the inflated body, so a strap drawn across the chest lies on the curve.
 */

/** A point on the mascot's front surface, from board SVG coordinates. */
export function onBody(x: number, y: number, lift = 0) {
  const art = artwork();
  const p = art.place(x, y);
  return new THREE.Vector3(p.x, p.y, art.surface(p.x, p.y) + lift);
}
/** The same point, but at a fixed depth instead of on the surface (for props that stand beside the body). */
function beside(x: number, y: number, z: number) {
  const p = artwork().place(x, y);
  return new THREE.Vector3(p.x, p.y, z);
}
/** A strap or chain that follows the chest: a tube through surface points. */
function strap(points: [number, number][], radius: number, color: number, lift = 0.03, ink = 0.012) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => onBody(x, y, lift + radius * 0.6)));
  return inked(new THREE.TubeGeometry(curve, 48, radius, 8, false), toon(color), ink);
}

/** A flat SVG shape laid on the curved face, with a slight bulge (lenses, badges). */
function decal(path: string, color: number, lift = 0.03, bulge = 0.03, ink = 0) {
  const art = artwork();
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}"/></svg>`);
  const group = new THREE.Group();
  svg.paths[0].toShapes().forEach((shape) => {
    const pts = shape.getPoints(10);
    if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
    const geo = inflate(pts.map((p) => art.place(p.x, p.y)), 24, (x, y, d) => art.surface(x, y) + lift + bulge * dome(d, 0.06), false);
    group.add(inked(geo, toon(color), ink));
  });
  return group;
}

const rounded = (w: number, h: number, d: number, r: number, color: number, ink = 0.018) =>
  inked(new RoundedBoxGeometry(w, h, d, 3, r), toon(color), ink);
const cyl = (rt: number, rb: number, h: number, color: number, seg = 20, ink = 0.014) =>
  inked(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color), ink);
const ball = (r: number, color: number, ink = 0.012) => inked(new THREE.SphereGeometry(r, 16, 12), toon(color), ink);

/** Screen art drawn on a canvas (phones, polaroids). */
function screen(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void) {
  const c = document.createElement("canvas");
  c.width = Math.round(256 * (w / Math.max(w, h)));
  c.height = Math.round(256 * (h / Math.max(w, h)));
  draw(c.getContext("2d")!, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

/** Places a hand nub on the body at a board SVG point. */
function rest(m: Mascot, side: "left" | "right", x: number, y: number) {
  m.rest[side].copy(onBody(x, y, 0.06));
  (side === "left" ? m.leftHand : m.rightHand).position.copy(m.rest[side]);
}
/** Puts a prop in a hand, keeping its placement in body space at rest. */
function hold(m: Mascot, side: "left" | "right", prop: THREE.Object3D, at: THREE.Vector3) {
  const hand = side === "left" ? m.leftHand : m.rightHand;
  prop.position.copy(at).sub(m.rest[side]);
  hand.add(prop);
}

/* ------------------------------------------------------------------ caps */

/** The board's six-panel cap: a dome over the head, visor to the face side or, backwards, to the tail. */
export function cap(color: number, backward: boolean) {
  const g = new THREE.Group();
  const crown = inked(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), toon(color), 0.03);
  crown.scale.set(0.84, 0.6, 0.72);
  const band = cyl(0.84, 0.84, 0.05, backward ? 0x1b3428 : 0x1b3025, 28, 0);
  band.scale.z = 0.72 / 0.84;
  const button = ball(0.07, backward ? 0x1d3629 : 0x1b3428);
  button.position.y = 0.6;
  const visor = inked(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28, 1, false, -Math.PI / 2, Math.PI), toon(backward ? 0x192e23 : 0x1b3025), 0.02);
  visor.scale.set(1, 1, 0.9);
  const under = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.01, 28, 1, false, -Math.PI / 2, Math.PI), toon(0xd8cfad));
  under.position.y = -0.03;
  visor.add(under);
  visor.position.set(backward ? -0.5 : 0.52, -0.02, 0.05);
  visor.rotation.set(0, backward ? Math.PI : 0, backward ? 0.08 : -0.08);
  if (backward) {
    // the snapback strap shows at the front when it is worn backwards
    const snap = inked(new THREE.TorusGeometry(0.2, 0.035, 8, 16, Math.PI), toon(0xc8b37f), 0.01);
    snap.position.set(0.55, 0.02, 0.3);
    snap.rotation.set(0, Math.PI / 2 - 0.3, 0);
    g.add(snap);
  } else {
    // the lime tick on the front panel
    const tick = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 6, 10, Math.PI * 0.6), toon(0xbed576));
    tick.position.set(0.28, 0.38, 0.55);
    tick.rotation.set(-0.6, 0.4, 2.4);
    g.add(tick);
  }
  g.add(crown, band, button, visor);
  return g;
}

/* ------------------------------------------------------------------ kits */

function beer(m: Mascot, member: CrewMember) {
  rest(m, "right", 745, 617);
  const mug = new THREE.Group();
  const glass = cyl(0.2, 0.19, 0.42, 0xd69a3e, 22, 0.02);
  const shine = cyl(0.202, 0.192, 0.3, 0xf6d68a, 22, 0);
  shine.scale.set(0.35, 1, 1.02);
  shine.position.x = -0.06;
  const rim = inked(new THREE.TorusGeometry(0.2, 0.025, 8, 24), toon(0xe4e6c6), 0.01);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.2;
  const handle = inked(new THREE.TorusGeometry(0.12, 0.035, 8, 16, Math.PI), toon(0xe4e6c6), 0.012);
  handle.position.set(0.19, 0, 0);
  handle.rotation.z = -Math.PI / 2;
  const foam = new THREE.Group();
  [[0, 0.24, 0, 0.13], [0.1, 0.25, 0.05, 0.1], [-0.1, 0.25, 0.04, 0.1], [0.03, 0.31, -0.02, 0.09], [-0.05, 0.24, -0.1, 0.1]]
    .forEach(([x, y, z, r]) => { const b = ball(r, 0xfff9e5, 0.01); b.position.set(x, y, z); foam.add(b); });
  mug.add(glass, shine, rim, handle, foam);
  hold(m, "right", mug, onBody(795, 612, 0.14));
  m.parts.beer = mug;

  // the three orange "cheers" rays beside the head
  const rays = new THREE.Group();
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${mascotArtwork.rays.map((d) => `<path d="${d}"/>`).join("")}</svg>`);
  const art = artwork();
  svg.paths.forEach((p) => p.toShapes().forEach((shape) => {
    const flat = new THREE.Shape(shape.getPoints(8).map((q) => art.place(q.x, q.y)));
    const geo = new THREE.ExtrudeGeometry(flat, { depth: 0.06, bevelEnabled: false });
    rays.add(inked(geo, toon(member.accent), 0.012));
  }));
  rays.position.z = 0.2;
  m.rig.add(rays);
  m.parts.rays = rays;
  m.ticks.push((t) => {
    const k = 1 + Math.max(0, Math.sin(t * 4)) * 0.08 + m.cheering * 0.15;
    rays.scale.set(k, k, 1);
  });
}

function shades(m: Mascot) {
  const glasses = new THREE.Group();
  glasses.add(
    decal("M534 413q68 6 137 37l-12 47q-7 29-35 28l-48-5q-26-3-32-30Z", 0x101715, 0.035, 0.03, 0.01),
    decal("m710 451 103-25-9 61q-4 29-28 34l-35 3q-21 1-25-21Z", 0x101715, 0.035, 0.03, 0.01),
    decal("m550 431 106 27-4 8-100-23Z", 0x55675d, 0.07, 0.01),
    decal("m723 461 73-18-3 9-69 17Z", 0x55675d, 0.07, 0.01),
  );
  glasses.add(strap([[670, 458], [690, 452], [710, 459]], 0.022, 0x121d19, 0.04, 0));
  glasses.add(strap([[534, 440], [490, 430], [454, 427]], 0.022, 0x121d19, 0.03, 0));
  m.rig.add(glasses);
  m.parts.shades = glasses;

  // the board's cigarette, tilted up in the right hand, with a lazy curl of smoke
  rest(m, "right", 884, 605);
  const cig = new THREE.Group();
  const paper = cyl(0.028, 0.028, 0.42, 0xfff7e5, 10, 0.008);
  const filter = cyl(0.03, 0.03, 0.1, 0xbc8155, 10, 0.008);
  filter.position.y = -0.16;
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf0a06a }));
  ember.position.y = 0.21;
  cig.add(paper, filter, ember);
  cig.rotation.z = -Math.PI / 2 + 0.49;
  hold(m, "right", cig, onBody(884, 605, 0.1).add(new THREE.Vector3(0.2, 0.1, 0)));
  const smoke = new THREE.Group();
  const puffMat = new THREE.MeshBasicMaterial({ color: 0xe4eade, transparent: true, opacity: 0.6, depthWrite: false });
  const puffs = Array.from({ length: 5 }, () => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), puffMat); smoke.add(p); return p; });
  m.rightHand.add(smoke);
  m.parts.cigarette = cig;
  m.parts.smoke = smoke;
  m.ticks.push((t) => {
    const tip = new THREE.Vector3(0, 0.21, 0).applyMatrix4(new THREE.Matrix4().compose(cig.position, cig.quaternion, cig.scale));
    puffs.forEach((p, i) => {
      const u = (t * 0.45 + i / puffs.length) % 1;
      p.position.copy(tip).add(new THREE.Vector3(Math.sin(u * 7 + i) * 0.08, u * 0.7, 0));
      p.scale.setScalar(0.5 + u * 1.6);
      (p.material as THREE.MeshBasicMaterial).opacity = 0.55;
      p.visible = u < 0.92;
    });
  });
}

function travel(m: Mascot) {
  m.rig.add(strap([[395, 470], [480, 510], [580, 560], [680, 600], [775, 628], [860, 670]], 0.03, 0xf4e2b9, 0.03, 0.01));
  const cam = new THREE.Group();
  const body = rounded(0.58, 0.38, 0.26, 0.08, FOREST);
  const top = rounded(0.22, 0.1, 0.2, 0.03, FOREST, 0.01);
  top.position.set(-0.02, 0.22, 0);
  const lensRing = cyl(0.14, 0.14, 0.1, 0xe8d7aa, 24);
  lensRing.rotation.x = Math.PI / 2;
  lensRing.position.z = 0.15;
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.095, 20), toon(0x365e48));
  glass.position.z = 0.205;
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), new THREE.MeshBasicMaterial({ color: 0xf5edda }));
  glint.position.set(-0.03, 0.035, 0.21);
  const flashBox = rounded(0.08, 0.035, 0.03, 0.01, 0xe8d7aa, 0);
  flashBox.position.set(-0.2, 0.12, 0.14);
  cam.add(body, top, lensRing, glass, glint, flashBox);
  cam.position.copy(onBody(733, 610, 0.14));
  cam.rotation.set(-0.15, 0, -0.42);
  m.rig.add(cam);
  m.parts.camera = cam;

  const suitcase = new THREE.Group();
  const shell = rounded(0.44, 0.64, 0.26, 0.1, 0xd89064);
  [-0.1, 0, 0.1].forEach((x) => { const rib = rounded(0.025, 0.46, 0.265, 0.01, 0xedb68c, 0); rib.position.x = x; suitcase.add(rib); });
  const handle = inked(new THREE.TorusGeometry(0.07, 0.022, 8, 14, Math.PI), toon(FOREST), 0.01);
  handle.position.y = 0.32;
  const sticker = rounded(0.19, 0.12, 0.02, 0.02, 0xf7eac8, 0);
  sticker.position.set(-0.02, 0.1, 0.135);
  sticker.rotation.z = 0.24;
  [-0.14, 0.14].forEach((x) => { const w = ball(0.045, FOREST, 0.008); w.position.set(x, -0.33, 0); suitcase.add(w); });
  suitcase.add(shell, handle, sticker);
  suitcase.position.copy(beside(902, 612, 0.12));
  suitcase.position.y = 0.37;
  suitcase.rotation.y = -0.35;
  m.root.add(suitcase);
  m.parts.suitcase = suitcase;
  rest(m, "left", 407, 518);
}

/** Paul's teddy-cut poodle: always at his side, tail going. */
export function poodle() {
  const g = new THREE.Group();
  const coat = 0xad7446, light = 0xbd824c, ear = 0x996039, leg = 0xc88e56;
  const body = ball(0.3, coat, 0.02);
  body.scale.set(1, 0.85, 1.15);
  body.position.y = 0.36;
  const chest = ball(0.2, light, 0.015);
  chest.position.set(0, 0.42, 0.22);
  const head = new THREE.Group();
  const skull = ball(0.26, light, 0.02);
  [[0, 0.2, 0, 0.12], [0.12, 0.16, 0.05, 0.1], [-0.12, 0.16, 0.05, 0.1], [0.06, 0.2, -0.1, 0.1], [-0.06, 0.2, -0.1, 0.1]]
    .forEach(([x, y, z, r]) => { const f = ball(r, light, 0.012); f.position.set(x, y, z); head.add(f); });
  const muzzle = ball(0.12, 0xd29861, 0.012);
  muzzle.scale.set(1, 0.8, 1);
  muzzle.position.set(0, -0.06, 0.2);
  const nose = ball(0.045, 0x30271f, 0);
  nose.position.set(0, -0.02, 0.31);
  [-0.1, 0.1].forEach((x) => {
    const eye = ball(0.04, 0x30271f, 0);
    eye.position.set(x, 0.04, 0.22);
    const e = ball(0.14, ear, 0.015);
    e.scale.set(0.6, 1.2, 0.8);
    e.position.set(x * 2.3, -0.08, 0);
    head.add(eye, e);
  });
  head.add(skull, muzzle, nose);
  head.position.set(0, 0.74, 0.14);
  const legs = [[-0.14, 0.16], [0.14, 0.16], [-0.14, -0.18], [0.14, -0.18]].map(([x, z]) => {
    const l = cyl(0.06, 0.07, 0.22, leg, 10, 0.012);
    l.position.set(x, 0.11, z);
    const paw = ball(0.08, leg, 0.012);
    paw.scale.y = 0.6;
    paw.position.y = -0.1;
    l.add(paw);
    g.add(l);
    return l;
  });
  const tail = new THREE.Group();
  const stick = cyl(0.03, 0.035, 0.22, 0x97613b, 8, 0.01);
  stick.position.y = 0.11;
  const pom = ball(0.1, 0xbc8250, 0.012);
  pom.position.y = 0.24;
  tail.add(stick, pom);
  tail.position.set(0, 0.5, -0.32);
  tail.rotation.x = -0.6;
  const collar = inked(new THREE.TorusGeometry(0.17, 0.03, 8, 20), toon(0xe7cf9d), 0.008);
  collar.rotation.x = Math.PI / 2 - 0.3;
  collar.position.set(0, 0.56, 0.12);
  const tag = ball(0.04, 0xc6a55e, 0.006);
  tag.position.set(0, 0.5, 0.29);
  g.add(body, chest, head, tail, collar, tag);
  const update = (t: number, walking = 0) => {
    tail.rotation.z = Math.sin(t * 14) * 0.5;
    head.rotation.z = Math.sin(t * 1.7) * 0.12;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 12 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.5 * walking));
    g.position.y = walking * Math.abs(Math.sin(t * 12)) * 0.05;
  };
  return { group: g, update };
}

function withPoodle(m: Mascot) {
  const dog = poodle();
  dog.group.position.set(-1.35, 0, 0.45);
  dog.group.rotation.y = 0.5;
  dog.group.scale.setScalar(0.9);
  m.root.add(dog.group);
  m.parts.poodle = dog.group;
  m.ticks.push((t) => dog.update(t, m.parts.poodle.userData.walking ?? 0));
  rest(m, "left", 440, 600);
}

function student(m: Mascot) {
  const pack = new THREE.Group();
  const bag = rounded(0.56, 0.88, 0.32, 0.16, 0xd9925c, 0.022);
  const pocket = rounded(0.4, 0.34, 0.12, 0.08, 0xe7ac77, 0.012);
  pocket.position.set(0, -0.2, 0.17);
  const loop = inked(new THREE.TorusGeometry(0.08, 0.025, 8, 12, Math.PI), toon(FOREST), 0.008);
  loop.position.y = 0.46;
  pack.add(bag, pocket, loop);
  pack.position.copy(beside(430, 540, -0.2));
  pack.rotation.set(0, 0.5, 0.1);
  m.rig.add(pack);
  m.parts.backpack = pack;
  m.rig.add(strap([[430, 455], [455, 500], [470, 560], [455, 610], [420, 640]], 0.035, 0xeac497, 0.02, 0.01));

  const book = new THREE.Group();
  const cover = rounded(0.36, 0.5, 0.05, 0.02, 0xfff5da, 0.012);
  const spine = rounded(0.03, 0.5, 0.055, 0.01, 0xd79868, 0);
  spine.position.x = -0.13;
  const lines = screen(0.24, 0.24, (ctx, W, H) => {
    ctx.fillStyle = "#fff5da"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#b0b497"; ctx.lineWidth = W * 0.05; ctx.lineCap = "round";
    [0.2, 0.45, 0.7].forEach((y, i) => { ctx.beginPath(); ctx.moveTo(W * 0.1, H * y); ctx.lineTo(W * (i === 1 ? 0.7 : 0.9), H * y); ctx.stroke(); });
  });
  lines.position.set(0.03, 0.05, 0.03);
  book.add(cover, spine, lines);
  book.rotation.set(-0.1, -0.2, 0.17);
  rest(m, "right", 818, 628);
  hold(m, "right", book, onBody(790, 612, 0.1));
  m.parts.notebook = book;
}

function rebel(m: Mascot) {
  const hat = cap(0x294936, false);
  hat.position.copy(beside(660, 372, 0));
  m.rig.add(hat);
  m.parts.cap = hat;
  m.rig.add(strap([[448, 481], [560, 540], [680, 596], [790, 640]], 0.045, 0xe4cd99, 0.02, 0.01));
  const bag = rounded(0.66, 0.4, 0.2, 0.12, FOREST, 0.02);
  const flap = rounded(0.6, 0.03, 0.21, 0.01, 0xe4cd99, 0);
  flap.position.y = 0.08;
  bag.add(flap);
  bag.position.copy(onBody(760, 622, 0.12));
  bag.rotation.set(-0.2, 0.15, -0.17);
  m.rig.add(bag);
  m.parts.bag = bag;
  const mic = new THREE.Group();
  const grip = cyl(0.06, 0.05, 0.42, 0x2b3c33, 14);
  const head = inked(new THREE.CapsuleGeometry(0.11, 0.08, 6, 14), toon(0xcdc9b2), 0.012);
  head.position.y = 0.3;
  const ring = cyl(0.075, 0.075, 0.03, 0x172e22, 14, 0);
  ring.position.y = 0.2;
  mic.add(grip, head, ring);
  mic.rotation.z = -0.38;
  rest(m, "right", 878, 600);
  hold(m, "right", mic, onBody(878, 600, 0.12).add(new THREE.Vector3(0.05, 0.12, 0)));
  m.parts.mic = mic;
}

function street(m: Mascot) {
  const hat = cap(0x243c2d, true);
  hat.position.copy(beside(660, 372, 0));
  m.rig.add(hat);
  m.parts.cap = hat;
  const path: [number, number][] = [[414, 536], [480, 585], [560, 620], [656, 632], [750, 615], [820, 590], [864, 564]];
  const chain = strap(path, 0.03, 0xd7b465, 0.03, 0.01);
  // links: little gold beads along the tube so it reads as a chain, not a rope
  const curve = new THREE.CatmullRomCurve3(path.map(([x, y]) => onBody(x, y, 0.06)));
  const beadGeo = new THREE.SphereGeometry(0.036, 8, 6);
  const beads = new THREE.InstancedMesh(beadGeo, toon(0xf6df9d), 40);
  for (let i = 0; i < 40; i++) beads.setMatrixAt(i, new THREE.Matrix4().setPosition(curve.getPoint(i / 39)));
  const pendant = cyl(0.08, 0.08, 0.03, 0xd7b465, 18);
  pendant.rotation.x = Math.PI / 2;
  pendant.position.copy(onBody(656, 660, 0.06));
  const mark = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 10, Math.PI * 0.6), toon(0x715531));
  mark.position.z = 0.02;
  mark.rotation.set(Math.PI / 2, 0, 2.4);
  pendant.add(mark);
  m.rig.add(chain, beads, pendant);
  m.parts.chain = chain;
}

function parent(m: Mascot) {
  const bottle = new THREE.Group();
  const top = cyl(0.14, 0.14, 0.22, 0xfff8e8, 20);
  top.position.y = 0.1;
  const milk = cyl(0.142, 0.142, 0.24, 0xf2deb0, 20);
  milk.position.y = -0.12;
  const collar = cyl(0.15, 0.15, 0.07, 0xe3b77d, 20);
  collar.position.y = 0.24;
  const teat = inked(new THREE.CapsuleGeometry(0.06, 0.06, 4, 10), toon(0xedcca1), 0.01);
  teat.position.y = 0.34;
  bottle.add(top, milk, collar, teat);
  bottle.rotation.z = -0.2;
  rest(m, "right", 811, 626);
  hold(m, "right", bottle, onBody(816, 600, 0.14));
  m.parts.bottle = bottle;
  rest(m, "left", 417, 618);

  const babies = [{ x: 860, scale: 0.26, color: 0xecc985 }, { x: 960, scale: 0.2, color: 0xb9d6a0 }].map((b, i) => {
    const baby = new Mascot(b.color);
    const diaper = inked(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4), toon(0xfff8e8), 0.03);
    diaper.scale.set(1.05, 0.9, 0.75);
    diaper.position.y = 0.72;
    baby.rig.add(diaper);
    baby.root.scale.setScalar(b.scale);
    baby.root.position.copy(beside(b.x, 682, 0.45 - i * 0.1));
    baby.root.position.y = 0;
    baby.root.rotation.y = -0.3;
    baby.bounce = 1.4;
    m.root.add(baby.root);
    m.ticks.push((t) => baby.update(t + i * 0.3));
    return baby;
  });
  m.parts.babyA = babies[0].root;
  m.parts.babyB = babies[1].root;
}

function phone(m: Mascot) {
  const g = new THREE.Group();
  const shell = rounded(0.4, 0.66, 0.06, 0.07, 0x2f4a3a, 0.014);
  const face = screen(0.32, 0.56, (ctx, W, H) => {
    ctx.fillStyle = "#fdf3db"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2f4a3a"; ctx.fillRect(W * 0.35, H * 0.04, W * 0.3, H * 0.025);
    ctx.fillStyle = "#d9784d";
    ctx.beginPath(); ctx.roundRect(W * 0.12, H * 0.16, W * 0.76, H * 0.4, W * 0.08); ctx.fill();
    ctx.fillStyle = "#fdf3db";
    ctx.beginPath(); ctx.moveTo(W * 0.42, H * 0.27); ctx.lineTo(W * 0.62, H * 0.36); ctx.lineTo(W * 0.42, H * 0.45); ctx.fill();
    ctx.fillStyle = "#b9d38f";
    ctx.beginPath(); ctx.roundRect(W * 0.12, H * 0.66, W * 0.76, H * 0.14, H * 0.07); ctx.fill();
    ctx.fillStyle = "#2f4a3a"; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.73, H * 0.04, 0, 7); ctx.fill();
  });
  face.position.z = 0.032;
  g.add(shell, face);
  g.rotation.set(-0.12, 0.1, 0.12);
  rest(m, "left", 506, 632);
  hold(m, "left", g, onBody(565, 605, 0.12));
  rest(m, "right", 794, 627);
  m.parts.phone = g;
}

/** Little Giant's director kit for the film route: a beret and a megaphone. */
function director(m: Mascot) {
  const beret = new THREE.Group();
  const cap = ball(0.7, 0x2b2233, 0.03);
  cap.scale.set(1.1, 0.32, 0.95);
  const stalk = cyl(0.03, 0.05, 0.14, 0x2b2233, 8, 0.01);
  stalk.position.y = 0.25;
  beret.add(cap, stalk);
  beret.position.copy(beside(640, 300, 0));
  beret.rotation.z = -0.25;
  m.rig.add(beret);
  m.parts.beret = beret;
  const horn = new THREE.Group();
  const cone = inked(new THREE.CylinderGeometry(0.22, 0.07, 0.5, 20, 1, true), toon(0xf6ecd6, { side: THREE.DoubleSide }), 0.015);
  cone.rotation.z = -Math.PI / 2;
  const bell = inked(new THREE.TorusGeometry(0.22, 0.03, 8, 22), toon(0xe63946), 0.01);
  bell.rotation.y = Math.PI / 2;
  bell.position.x = 0.25;
  const grip = cyl(0.04, 0.04, 0.16, 0x24163f, 8, 0.008);
  grip.position.set(-0.08, -0.12, 0);
  horn.add(cone, bell, grip);
  rest(m, "right", 850, 600);
  hold(m, "right", horn, onBody(850, 600, 0.12).add(new THREE.Vector3(0.22, 0.1, 0.05)));
  m.parts.megaphone = horn;
}

const KITS: Record<Kit, (m: Mascot, member: CrewMember) => void> = {
  director, beer, shades, travel, poodle: withPoodle, student, rebel, street, parent, phone,
};

/** Builds a crew member's mascot, dressed in their board look. */
export function dressed(member: CrewMember, options: { hat?: boolean; kit?: boolean } = {}) {
  const m = new Mascot(member.color, { eyes: member.eyes, hat: options.hat });
  if (options.kit !== false) KITS[member.kit](m, member);
  return m;
}
