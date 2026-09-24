import * as THREE from "three";
import { topAt } from "../film/costumes";
import { ball, cyl } from "../film/kit";
import { artwork, Mascot } from "../mascot";
import { inked, toon } from "../toon";

/**
 * The medieval wardrobe, worn over each member's board look: a crown for the
 * king, a plumed helm for the knight, bells for the jester, a hood for the
 * monk, a starry hat for the alchemist, a feathered cap for the bard.
 */

const GOLD = 0xe8b64a;

/** Puts a hat on the head top at x (mascot units), tilted a little. */
function wear(m: Mascot, hat: THREE.Object3D, x = 0.1, sink = 0.15, tilt = -0.1, key = "hat") {
  hat.position.set(x, topAt(x) - sink, 0);
  hat.rotation.z = tilt;
  m.rig.add(hat);
  m.parts[key] = hat;
  return hat;
}

export function crown(m: Mascot, size = 1) {
  const g = new THREE.Group();
  const band = inked(new THREE.CylinderGeometry(0.62, 0.66, 0.3, 28, 1, true), toon(GOLD, { side: THREE.DoubleSide }), 0.025);
  band.position.y = 0.15;
  g.add(band);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const spike = inked(new THREE.ConeGeometry(0.11, 0.34, 4), toon(GOLD), 0.02);
    spike.position.set(Math.sin(a) * 0.62, 0.45, Math.cos(a) * 0.62);
    const gem = ball(0.055, [0xe63946, 0x3a86ff, 0x2ec27e][i % 3], 0.01, 8);
    gem.position.set(Math.sin(a) * 0.66, 0.16, Math.cos(a) * 0.66);
    const pearl = ball(0.05, 0xfff6e0, 0.008, 8);
    pearl.position.set(Math.sin(a) * 0.62, 0.64, Math.cos(a) * 0.62);
    g.add(spike, gem, pearl);
  }
  const velvet = ball(0.58, 0xa4161a, 0.02);
  velvet.scale.y = 0.45;
  velvet.position.y = 0.2;
  g.add(velvet);
  g.scale.setScalar(size);
  return wear(m, g, 0.1, 0.22, -0.12, "crown");
}

/** Royal cape: a red mantle with an ermine collar. */
export function mantle(m: Mascot, color = 0xa4161a) {
  const cape = inked(new THREE.CylinderGeometry(0.9, 1.35, 1.7, 24, 1, true, Math.PI * 0.55, Math.PI * 0.9), toon(color, { side: THREE.DoubleSide }), 0.02);
  cape.position.set(0, 0.85, -0.1);
  const collar = inked(new THREE.TorusGeometry(0.95, 0.13, 8, 24, Math.PI * 0.95), toon(0xfbf6ea), 0.015);
  collar.rotation.set(Math.PI / 2, 0, Math.PI * 1.02);
  collar.position.set(0, 1.62, -0.1);
  m.rig.add(cape, collar);
  m.parts.mantle = cape;
  return cape;
}

/** A kettle helm with a red plume and a visor that can drop over the (sunglassed) eyes. */
export function helm(m: Mascot) {
  const g = new THREE.Group();
  const steel = toon(0xb9c2cc);
  const dome = inked(new THREE.SphereGeometry(0.85, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), steel, 0.03);
  dome.scale.set(1.05, 0.75, 0.9);
  const rim = inked(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 28), steel, 0.02);
  const ridge = inked(new THREE.BoxGeometry(0.08, 0.5, 1.4), toon(0x98a2ad), 0.015);
  ridge.position.y = 0.4;
  const plume = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const f = ball(0.16 - i * 0.012, 0xe63946, 0.015, 10);
    f.scale.set(0.8, 1.4, 0.8);
    f.position.set(-i * 0.14, 0.75 + Math.sin(i * 0.6) * 0.15, -i * 0.05);
    plume.add(f);
  }
  const visor = new THREE.Group();
  const plate = inked(new THREE.SphereGeometry(0.9, 22, 10, -Math.PI * 0.45, Math.PI * 0.9, Math.PI * 0.45, Math.PI * 0.3), toon(0xa9b3bd, { side: THREE.DoubleSide }), 0.02);
  plate.scale.set(1.05, 1.1, 0.95);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.1), toon(0x121518));
  slit.position.set(0.1, -0.52, 0.72);
  visor.add(plate, slit);
  visor.position.y = 0.05;
  g.add(dome, rim, ridge, plume, visor);
  wear(m, g, 0.12, 0.35, -0.08, "helm");
  m.parts.visor = visor;
  m.parts.plume = plume;
  return { group: g, visor, setVisor: (down: number) => (visor.rotation.x = (1 - down) * -1.3) };
}

export function jesterHat(m: Mascot) {
  const g = new THREE.Group();
  const cap = inked(new THREE.SphereGeometry(0.62, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x7b2cbf), 0.025);
  cap.scale.set(1.05, 0.6, 0.9);
  g.add(cap);
  const bells: THREE.Object3D[] = [];
  [[-1, 0x7b2cbf], [0, 0xffc93c], [1, 0xe63946]].forEach(([dir, color]) => {
    const arm = new THREE.Group();
    const horn = inked(new THREE.ConeGeometry(0.22, 1.0, 12), toon(color as number), 0.02);
    horn.position.y = 0.45;
    horn.rotation.z = 0.25;
    const bell = ball(0.1, GOLD, 0.012, 10);
    bell.position.set(-0.12, 0.95, 0);
    arm.add(horn, bell);
    arm.position.y = 0.2;
    arm.rotation.z = -(dir as number) * 0.9;
    arm.rotation.x = dir === 0 ? -0.4 : 0;
    g.add(arm);
    bells.push(arm);
  });
  g.scale.setScalar(0.85);
  wear(m, g, 0.1, -0.05, -0.05, "jester");
  m.ticks.push((t) => bells.forEach((b, i) => (b.rotation.x = (i === 1 ? -0.4 : 0) + Math.sin(t * 8 + i) * 0.12)));
  // a ruff collar with bells
  const ruff = inked(new THREE.TorusGeometry(1.0, 0.1, 6, 18), toon(0xffc93c), 0.015);
  ruff.rotation.x = Math.PI / 2;
  ruff.scale.set(1.05, 0.72, 1);
  ruff.position.y = 0.12;
  m.rig.add(ruff);
  return g;
}

export function monkHood(m: Mascot) {
  const hood = inked(new THREE.SphereGeometry(1, 24, 14, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.55), toon(0x6b4a33, { side: THREE.DoubleSide }), 0.025);
  hood.scale.set(1.25, 1.1, 0.9);
  hood.position.y = 0.95;
  const rope = inked(new THREE.TorusGeometry(1.08, 0.05, 6, 30), toon(0xd8c38e), 0.01);
  rope.rotation.x = Math.PI / 2;
  rope.scale.set(1.02, 0.66, 1);
  rope.position.y = 0.32;
  m.rig.add(hood, rope);
  m.parts.hood = hood;
  return hood;
}

export function wizardHat(m: Mascot) {
  const g = new THREE.Group();
  const brim = inked(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 28), toon(0x2b2d6e), 0.02);
  const cone = inked(new THREE.ConeGeometry(0.6, 1.5, 22, 4), toon(0x2b2d6e), 0.025);
  cone.position.y = 0.75;
  // a floppy tip
  cone.geometry.translate(0, 0, 0);
  const pos = cone.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) + 0.75; pos.setX(i, pos.getX(i) - Math.pow(Math.max(0, y - 0.6) / 0.9, 2) * 0.45); }
  cone.geometry.computeVertexNormals();
  g.add(brim, cone);
  for (let i = 0; i < 6; i++) {
    const star = ball(0.05, GOLD, 0.006, 6);
    const a = i * 1.1, h = 0.2 + i * 0.18;
    star.position.set(Math.sin(a) * (0.55 - h * 0.3), h, Math.cos(a) * (0.55 - h * 0.3));
    g.add(star);
  }
  const band = inked(new THREE.CylinderGeometry(0.6, 0.62, 0.1, 22), toon(GOLD), 0.01);
  band.position.y = 0.08;
  g.add(band);
  wear(m, g, 0.1, 0.18, -0.1, "wizard");
  return g;
}

export function bardCap(m: Mascot) {
  const g = new THREE.Group();
  const cap = ball(0.72, 0x2e7d4f, 0.025);
  cap.scale.set(1.15, 0.35, 1.0);
  const feather = inked(new THREE.ConeGeometry(0.08, 1.1, 8), toon(0xf4e04d), 0.012);
  feather.position.set(-0.45, 0.45, -0.1);
  feather.rotation.z = 0.9;
  g.add(cap, feather);
  wear(m, g, 0.05, 0.12, -0.18, "bardCap");
  return g;
}

export function painterBeret(m: Mascot) {
  const g = new THREE.Group();
  const cap = ball(0.7, 0x8c2f39, 0.025);
  cap.scale.set(1.15, 0.3, 1);
  const stalk = cyl(0.03, 0.03, 0.12, 0x8c2f39, 8, 0.01);
  stalk.position.y = 0.2;
  g.add(cap, stalk);
  return wear(m, g, 0.15, 0.1, -0.3, "beret");
}

/** A leather apron laid on the front of the body, following its curve. */
export function apron(m: Mascot) {
  const art = artwork();
  const shape = new THREE.Shape();
  ([[520, 470], [760, 480], [800, 680], [470, 680]] as [number, number][]).forEach(([x, y], i) => {
    const p = art.place(x, y);
    if (i) shape.lineTo(p.x, p.y); else shape.moveTo(p.x, p.y);
  });
  const geo = new THREE.ShapeGeometry(shape, 8);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, art.surface(pos.getX(i), pos.getY(i)) + 0.04);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, toon(0x6b4226, { side: THREE.DoubleSide }));
  m.rig.add(mesh);
  m.parts.apron = mesh;
  return mesh;
}

/** Something held in a hand: goblet, hammer, quill, lute, sword, palette. */
export function holdIn(m: Mascot, side: "left" | "right", prop: THREE.Object3D, offset = new THREE.Vector3(0, 0.1, 0.1)) {
  (side === "left" ? m.leftHand : m.rightHand).add(prop);
  prop.position.copy(offset);
  return prop;
}

export function goblet() {
  const pts = [[0, 0], [0.18, 0], [0.18, 0.03], [0.05, 0.08], [0.04, 0.3], [0.2, 0.42], [0.22, 0.62], [0.2, 0.62], [0.02, 0.45], [0, 0.45]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group();
  g.add(inked(new THREE.LatheGeometry(pts, 20), toon(GOLD, { side: THREE.DoubleSide }), 0.015));
  const wine = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16), toon(0x7a1020));
  wine.rotation.x = -Math.PI / 2;
  wine.position.y = 0.58;
  g.add(wine);
  return g;
}
export function hammer() {
  const g = new THREE.Group();
  const handle = cyl(0.04, 0.04, 0.7, 0x7a5230, 8, 0.012);
  handle.position.y = -0.35;
  const head = inked(new THREE.BoxGeometry(0.34, 0.16, 0.16), toon(0x4a4f57), 0.015);
  head.position.y = 0.36;
  g.add(handle, head);
  return g;
}
export function quill() {
  const g = new THREE.Group();
  const vane = inked(new THREE.ConeGeometry(0.07, 0.7, 6), toon(0xfbf6ea), 0.01);
  vane.position.y = 0.35;
  vane.scale.z = 0.3;
  const nib = inked(new THREE.ConeGeometry(0.02, 0.12, 6), toon(0x2b2233), 0);
  nib.rotation.x = Math.PI;
  nib.position.y = -0.05;
  g.add(vane, nib);
  return g;
}
export function lute() {
  const g = new THREE.Group();
  const body = ball(0.4, 0xb5793c, 0.02);
  body.scale.set(1, 1.2, 0.45);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), toon(0x3a2414));
  hole.position.set(0, 0.05, 0.19);
  const neck = inked(new THREE.BoxGeometry(0.1, 0.8, 0.06), toon(0x6b4226), 0.012);
  neck.position.y = 0.8;
  const head = inked(new THREE.BoxGeometry(0.14, 0.24, 0.06), toon(0x6b4226), 0.01);
  head.position.set(-0.06, 1.25, 0);
  head.rotation.z = 0.7;
  g.add(body, hole, neck, head);
  return g;
}
export function sword(length = 1.3) {
  const g = new THREE.Group();
  const blade = inked(new THREE.BoxGeometry(0.1, length, 0.03), toon(0xdfe6ee), 0.012);
  blade.position.y = length / 2 + 0.12;
  const guard = inked(new THREE.BoxGeometry(0.42, 0.07, 0.07), toon(GOLD), 0.01);
  guard.position.y = 0.1;
  const grip = cyl(0.035, 0.035, 0.2, 0x5a3a22, 8, 0.008);
  grip.position.y = -0.1;
  const pommel = ball(0.06, GOLD, 0.008, 8);
  pommel.position.y = -0.12;
  g.add(blade, guard, grip, pommel);
  return g;
}
export function shieldVG() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.45, 0.5); shape.lineTo(0.45, 0.5); shape.lineTo(0.45, 0.05); shape.quadraticCurveTo(0.4, -0.45, 0, -0.65); shape.quadraticCurveTo(-0.4, -0.45, -0.45, 0.05); shape.closePath();
  const g = new THREE.Group();
  g.add(inked(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }), toon(0x2b3f8f), 0.02));
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#c6df70"; x.font = "900 64px Cinzel, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("VG", 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  crest.position.set(0, 0, 0.065);
  g.add(crest);
  return g;
}

/** Villagers: plain mascots in homespun colours, with a hat or a kerchief. */
export function villager(color: number, i: number) {
  const m = new Mascot(color);
  m.root.scale.setScalar(1);
  if (i % 3 === 0) {
    const straw = inked(new THREE.CylinderGeometry(0.35, 0.95, 0.35, 20), toon(0xd9b870), 0.02);
    wear(m, straw, 0.1, 0.05, -0.1, "straw");
  } else if (i % 3 === 1) {
    const kerchief = ball(0.72, [0xc0392b, 0x2e86ab, 0xe0a458][i % 3], 0.02);
    kerchief.scale.set(1.1, 0.4, 0.95);
    wear(m, kerchief, 0.05, 0.12, -0.1, "kerchief");
  }
  return m;
}
export const PEASANT = [0xc9a27e, 0xb08968, 0xd4b896, 0xa3b18a, 0xcfb997, 0xb7a284, 0xd8c3a5, 0x9c8a74];
