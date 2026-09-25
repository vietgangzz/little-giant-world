import * as THREE from "three";
import { decal, onBody } from "../accessories";
import { artwork, Mascot } from "../mascot";
import { inked, toon } from "../toon";
import { topAt } from "./costumes";

/**
 * Face paint and hard-luck costumes, painted straight onto the curved body as
 * decals (the same trick as the eyes), so they follow the face exactly.
 * Layers stack by lift: skin paint, then shadows, then the eyes on top.
 */

/* ------------------------------------------------------------------ the Joker */

export function jokerMakeup(m: Mascot) {
  const g = new THREE.Group();
  // chalk-white greasepaint over the face, left rough at the edges
  g.add(decal("M495 405C515 352 598 338 680 356C760 366 834 382 846 452C856 522 834 604 762 634C690 664 578 660 516 622C468 592 470 452 495 405ZM470 470L452 488L470 500ZM850 470L866 482L852 494Z", 0xf4f1ea, 0.006, 0.004));
  // smeared black eye sockets
  g.add(decal("M536 432C548 392 642 398 684 450C704 502 672 548 620 552C566 556 526 502 536 432Z", 0x3b3046, 0.01, 0.004));
  g.add(decal("M730 442C746 412 804 412 810 452C816 504 798 540 764 540C732 540 720 482 730 442Z", 0x3b3046, 0.01, 0.004));
  // the red smile, carved long past the corners of the mouth
  g.add(decal("M530 572C600 626 706 632 800 564L814 592C726 672 594 672 520 598ZM530 592L500 556L516 550L542 578ZM790 572L818 536L830 546L802 586Z", 0xc3122a, 0.012, 0.006));
  m.rig.add(g);
  m.parts.makeup = g;
  return g;
}

/** Messy green hair: tufts all along the top of the head, a few falling at the sides. */
export function greenHair(m: Mascot, color = 0x3f8f3a) {
  const g = new THREE.Group();
  const mat = toon(color);
  const dark = toon(0x2b6a2a);
  for (let i = 0; i < 17; i++) {
    const x = -0.95 + i * 0.12;
    const top = topAt(x);
    if (top < 1.2) continue;
    const tuft = inked(new THREE.ConeGeometry(0.13 + (i % 3) * 0.03, 0.5 + (i % 4) * 0.12, 6), i % 2 ? mat : dark, 0.02);
    tuft.position.set(x, top - 0.02, (i % 3 - 1) * 0.18);
    tuft.rotation.set((i % 3 - 1) * 0.5, 0, (x < 0 ? 0.5 : -0.5) + Math.sin(i * 2.3) * 0.4);
    g.add(tuft);
  }
  // a slick back layer so the scalp doesn't show between tufts
  const cap = inked(new THREE.SphereGeometry(0.72, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0.02);
  cap.scale.set(1.2, 0.35, 0.85);
  cap.position.set(0.05, topAt(0.05) - 0.18, -0.05);
  g.add(cap);
  [[-1.05, 1.3], [1.0, 1.3]].forEach(([x, y]) => {
    const lock = inked(new THREE.ConeGeometry(0.1, 0.55, 5), mat, 0.015);
    lock.position.set(x, y, 0.05);
    lock.rotation.z = Math.PI + (x < 0 ? -0.3 : 0.3);
    g.add(lock);
  });
  m.rig.add(g);
  m.parts.hair = g;
  return g;
}

/** The purple suit: a coat band round the lower body, green waistcoat, lapels. */
export function purpleSuit(m: Mascot) {
  const g = new THREE.Group();
  const coat = inked(new THREE.CylinderGeometry(1.18, 1.24, 0.34, 28, 1, true), toon(0x5b2a86, { side: THREE.DoubleSide }), 0.02);
  coat.scale.z = 0.7;
  coat.position.y = 0.17;
  g.add(coat);
  g.add(decal("M590 650L630 690L700 690L740 650L700 662L665 690L630 662Z", 0x3f8f3a, 0.03, 0.01));
  const tie = inked(new THREE.ConeGeometry(0.06, 0.16, 4), toon(0xe0a020), 0.008);
  tie.position.copy(onBody(665, 652, 0.06));
  tie.rotation.x = Math.PI;
  g.add(tie);
  m.rig.add(g);
  m.parts.suit = g;
  return g;
}

/** The detonator: a little grey box, an antenna, one big red button. */
export function detonator() {
  const g = new THREE.Group();
  g.add(inked(new THREE.BoxGeometry(0.22, 0.34, 0.12), toon(0x4a4f57), 0.012));
  const button = inked(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14), toon(0xe63946), 0.008);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 0.06, 0.07);
  const antenna = inked(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), toon(0x2b2b2b), 0.004);
  antenna.position.set(0.07, 0.34, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
  tip.position.set(0.07, 0.53, 0);
  g.add(button, antenna, tip);
  g.userData.button = button;
  return g;
}

/* ------------------------------------------------------------------ hard luck */

/** Mud and soot: irregular smears (not dots) across the face and body. */
export function dirt(m: Mascot, amount = 1, color = 0x6a5238) {
  const smears: [number, number, number, number][] = [[480, 560, 46, 0.4], [700, 610, 54, -0.3], [540, 420, 30, 0.9], [812, 520, 30, 1.4], [630, 660, 40, 0.1], [760, 400, 26, -0.8], [455, 470, 24, 0.5]];
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const path = smears.slice(0, Math.max(1, Math.round(smears.length * amount))).map(([x, y, r, rot]) => {
    const pts = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const rr = r * (0.55 + rand() * 0.6) * (i % 2 ? 1 : 0.7);
      const px = Math.cos(a) * rr * 1.6, py = Math.sin(a) * rr * 0.6;
      return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)];
    });
    return `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z`;
  }).join("");
  const d = decal(path, color, 0.008, 0.002);
  d.children.forEach((c) => { const mesh = c as THREE.Mesh; mesh.material = new THREE.MeshToonMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, gradientMap: toon(color).gradientMap }); });
  m.rig.add(d);
  m.parts.dirt = d;
  return d;
}

/** A sackcloth tunic with a ragged hem and a couple of patches, tied with rope. */
export function rags(m: Mascot, color = 0x9a7b55) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(1.12, 1.26, 0.6, 30, 3, true);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -0.25) pos.setY(i, pos.getY(i) + (Math.sin(i * 7.7) * 0.5 + 0.5) * 0.14);
  geo.computeVertexNormals();
  const sack = inked(geo, toon(color, { side: THREE.DoubleSide }), 0.02);
  sack.scale.z = 0.7;
  sack.position.y = 0.3;
  const rope = inked(new THREE.TorusGeometry(1.08, 0.04, 6, 30), toon(0xc9b184), 0.008);
  rope.rotation.x = Math.PI / 2;
  rope.scale.set(1, 0.7, 1);
  rope.position.y = 0.58;
  rope.scale.set(0.98, 0.66, 1);
  g.add(sack, rope);
  g.add(decal("M470 620L520 612L526 662L474 668Z", 0x6b5236, 0.04, 0.005));
  g.add(decal("M760 600L808 604L802 650L756 644Z", 0xb89a6a, 0.04, 0.005));
  m.rig.add(g);
  m.parts.rags = g;
  return g;
}

/** Iron cuffs on both hands, a sagging chain between them, and a ball on a chain. */
export function shackles(m: Mascot) {
  const iron = toon(0x55585e);
  [m.leftHand, m.rightHand].forEach((h) => {
    const cuff = inked(new THREE.TorusGeometry(0.13, 0.045, 8, 16), iron, 0.01);
    cuff.rotation.y = Math.PI / 2;
    h.add(cuff);
  });
  const links = new THREE.InstancedMesh(new THREE.TorusGeometry(0.045, 0.014, 6, 10), iron, 40);
  links.frustumCulled = false;
  m.root.add(links);
  const ball = inked(new THREE.SphereGeometry(0.28, 16, 12), toon(0x3a3c42), 0.02);
  m.root.add(ball);
  m.parts.ball = ball;
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  const place = (from: THREE.Vector3, to: THREE.Vector3, sag: number, start: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const k = i / (count - 1);
      const p = from.clone().lerp(to, k);
      p.y -= Math.sin(k * Math.PI) * sag;
      q.setFromEuler(new THREE.Euler(0, i % 2 ? Math.PI / 2 : 0, 0));
      links.setMatrixAt(start + i, tmp.compose(p, q, s));
    }
  };
  m.ticks.push(() => {
    // hands are in rig space; the root carries the rig at the origin
    const l = m.leftHand.position.clone().add(m.rig.position), r = m.rightHand.position.clone().add(m.rig.position);
    place(l, r, 0.45, 0, 20);
    const ankle = new THREE.Vector3(0.35, 0.12, 0.45).add(m.rig.position.clone().multiplyScalar(0.3));
    place(ankle, ball.position.clone().add(new THREE.Vector3(0, 0.1, 0)), 0.05, 20, 20);
    links.instanceMatrix.needsUpdate = true;
  });
  ball.position.set(1.3, 0.28, 0.9);
  return { ball };
}

/** A floppy, torn felt hat with a patch, for the wandering minstrel. */
export function raggedHat(m: Mascot) {
  const g = new THREE.Group();
  const felt = toon(0x5a4a3a);
  const brim = inked(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 20), felt, 0.02);
  const pos = brim.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, pos.getY(i) - Math.max(0, Math.hypot(x, z) - 0.6) * (0.45 + Math.sin(Math.atan2(z, x) * 3) * 0.25)); }
  brim.geometry.computeVertexNormals();
  const crown = inked(new THREE.CylinderGeometry(0.45, 0.6, 0.6, 14), felt, 0.02);
  crown.position.y = 0.3;
  crown.rotation.z = 0.15;
  const patch = inked(new THREE.BoxGeometry(0.22, 0.2, 0.02), toon(0x8c6a3a), 0.006);
  patch.position.set(0.1, 0.3, 0.55);
  const feather = inked(new THREE.ConeGeometry(0.05, 0.8, 6), toon(0x9a9a8a), 0.01);
  feather.position.set(-0.45, 0.55, -0.1);
  feather.rotation.z = 1.1;
  g.add(brim, crown, patch, feather);
  g.position.set(0.05, topAt(0.05) - 0.1, 0);
  g.rotation.z = -0.2;
  m.rig.add(g);
  m.parts.raggedHat = g;
  return g;
}

/** A threadbare cloak draped over the back. */
export function cloak(m: Mascot, color = 0x4a5a3a) {
  const geo = new THREE.CylinderGeometry(0.9, 1.35, 1.7, 24, 2, true, Math.PI * 0.55, Math.PI * 0.9);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -0.8) pos.setY(i, pos.getY(i) + (Math.sin(i * 5.3) * 0.5 + 0.5) * 0.25);
  geo.computeVertexNormals();
  const c = inked(geo, toon(color, { side: THREE.DoubleSide }), 0.02);
  c.position.set(0, 0.85, -0.1);
  m.rig.add(c);
  m.parts.cloak = c;
  return c;
}

void artwork;
