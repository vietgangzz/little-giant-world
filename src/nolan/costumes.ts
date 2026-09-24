import * as THREE from "three";
import { onBody } from "../accessories";
import { dome, inflate } from "../inflate";
import { artwork, Mascot } from "../mascot";
import { mascotArtwork } from "../mascotArtwork";
import { inked, toon } from "../toon";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/** Wardrobe for the film shoot, worn over each member's own board look. */

/** Height of the top of the head at a given x (mascot units). */
export function topAt(x: number) {
  const art = artwork();
  for (let y = 2.1; y > 0; y -= 0.01) if (art.surface(x, y) > 0.02) return y;
  return 1.8;
}

export function topHat(m: Mascot) {
  const g = new THREE.Group();
  const crown = inked(new THREE.CylinderGeometry(0.42, 0.46, 0.9, 24), toon(0x1c1a24), 0.03);
  crown.position.y = 0.45;
  const band = inked(new THREE.CylinderGeometry(0.465, 0.47, 0.16, 24), toon(0xb3263a), 0);
  band.position.y = 0.12;
  const brim = inked(new THREE.CylinderGeometry(0.78, 0.78, 0.05, 28), toon(0x1c1a24), 0.025);
  brim.scale.z = 0.85;
  g.add(crown, band, brim);
  g.position.set(0.05, topAt(0.05) - 0.18, 0);
  g.rotation.z = -0.12;
  m.rig.add(g);
  m.parts.topHat = g;
  return g;
}

/** Batman: cowl ears on the head and a cape that billows behind. */
export function batSuit(m: Mascot) {
  const ears = new THREE.Group();
  [-0.42, 0.52].forEach((x) => {
    const ear = inked(new THREE.ConeGeometry(0.16, 0.5, 4), toon(0x1a1c26), 0.025);
    ear.position.set(x, topAt(x) + 0.12, 0.05);
    ear.rotation.z = x < 0 ? 0.15 : -0.15;
    ears.add(ear);
  });
  m.rig.add(ears);
  m.parts.ears = ears;
  const geo = new THREE.PlaneGeometry(2.5, 2.1, 14, 12);
  geo.translate(0, -1.05, 0);
  const base = Float32Array.from(geo.getAttribute("position").array as Float32Array);
  const cape = new THREE.Mesh(geo, toon(0x1f2230, { side: THREE.DoubleSide }));
  cape.castShadow = true;
  cape.position.set(0, 1.62, -0.55);
  m.rig.add(cape);
  m.parts.cape = cape;
  const clasp = inked(new THREE.SphereGeometry(0.1, 12, 8), toon(0xe6c667), 0.015);
  clasp.position.copy(onBody(470, 430, 0.05));
  m.rig.add(clasp);
  let wind = 1;
  m.ticks.push((t) => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const down = -y / 2.1; // 0 at the shoulders, 1 at the hem
      const flutter = Math.sin(t * 7 + x * 2.2 + down * 3) * 0.18 + Math.sin(t * 11 + x * 5) * 0.05;
      pos.setX(i, x * (1 + down * 0.35));
      pos.setZ(i, -down * (0.35 + wind * 0.55) + flutter * down * wind);
      pos.setY(i, y + down * down * wind * 0.25);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return { setWind: (w: number) => (wind = w) };
}

/** A clear bubble helmet over the whole body, with a collar ring. */
export function spaceHelmet(m: Mascot) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20),
    new THREE.MeshToonMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.16, depthWrite: false, gradientMap: toon(0xffffff).gradientMap }),
  );
  glass.scale.set(1.45, 1.22, 1.0);
  glass.position.y = 1.05;
  const shine = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 6, 30, 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  shine.position.set(0, 1.15, 0.72);
  shine.rotation.z = 1.9;
  const collar = inked(new THREE.TorusGeometry(1.2, 0.06, 8, 36), toon(0xe9ecf2), 0.015);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1.12, 0.78, 1);
  collar.position.y = 0.22;
  const patch = inked(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), toon(0xdc7b50), 0.01);
  patch.rotation.x = Math.PI / 2;
  patch.position.copy(onBody(470, 560, 0.03));
  g.add(glass, shine, collar);
  m.rig.add(g, patch);
  m.parts.helmet = g;
  return g;
}

/** Dunkirk's Brodie helmet: a wide, shallow tin dish. */
export function brodie(color = 0x5f6b3f) {
  const g = new THREE.Group();
  const bowl = inked(new THREE.SphereGeometry(0.62, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(color), 0.025);
  bowl.scale.y = 0.55;
  const rim = inked(new THREE.CylinderGeometry(0.98, 0.98, 0.05, 28), toon(color), 0.02);
  g.add(bowl, rim);
  return g;
}
export function wearBrodie(m: Mascot, color?: number) {
  const h = brodie(color);
  h.position.set(0.12, topAt(0.12) - 0.08, 0);
  h.rotation.z = -0.1;
  m.rig.add(h);
  m.parts.helmet = h;
  return h;
}

/** Welding goggles over the eyes, for looking at the sun you made. */
export function goggles(m: Mascot) {
  const art = artwork();
  const g = new THREE.Group();
  const lens = (cx: number, cy: number) => {
    const d = `M${cx - 62} ${cy}a62 62 0 1 0 124 0a62 62 0 1 0 -124 0Z`;
    const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
    const pts = svg.paths[0].toShapes()[0].getPoints(12);
    pts.pop();
    const geo = inflate(pts.map((p) => art.place(p.x, p.y)), 20, (x, y, dd) => art.surface(x, y) + 0.06 + 0.06 * dome(dd, 0.08), false);
    return inked(geo, toon(0x152019), 0.02);
  };
  g.add(lens(600, 478), lens(760, 482));
  const band = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([onBody(430, 470, 0.04), onBody(538, 474, 0.07), onBody(662, 480, 0.07), onBody(698, 482, 0.07), onBody(822, 478, 0.07), onBody(860, 470, 0.03)]), 30, 0.035, 6),
    toon(0x3b2f2a),
  );
  g.add(band);
  m.rig.add(g);
  m.parts.goggles = g;
  return g;
}

/** A polaroid with a picture that can fade in (or, Memento-style, back out). */
export function polaroid(draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void) {
  const g = new THREE.Group();
  const frame = inked(new THREE.BoxGeometry(0.62, 0.74, 0.02), toon(0xfbf7ee), 0.012);
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  draw(c.getContext("2d")!, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  photo.position.set(0, 0.06, 0.012);
  const blank = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), new THREE.MeshBasicMaterial({ color: 0x2a2d33 }));
  blank.position.set(0, 0.06, 0.011);
  g.add(frame, blank, photo);
  return { group: g, develop: (k: number) => ((photo.material as THREE.MeshBasicMaterial).opacity = k) };
}

/** Draws the brand silhouette (for the bat-signal, posters and the premiere screen). */
export function drawMascot(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, fill: string, eyes?: string) {
  ctx.save();
  const s = h / 414;
  ctx.translate(x - 637 * s, y - 268 * s);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(mascotArtwork.body));
  if (eyes) {
    ctx.fillStyle = eyes;
    mascotArtwork.eyes.forEach((e) => ctx.fill(new Path2D(e.path)));
  }
  ctx.restore();
}

/** A plain extra: a mascot in a muted colour, no kit. */
export function extra(color: number, eyes?: number) {
  const m = new Mascot(color, { eyes });
  m.root.scale.setScalar(1);
  return m;
}

/** Cobb's totem: a little brass spinning top. `wobble` 0 spins true, 1 is about to fall. */
export function spinningTop() {
  const profile = [[0, 0], [0.05, 0.04], [0.22, 0.2], [0.34, 0.34], [0.36, 0.4], [0.3, 0.46], [0.1, 0.5], [0.06, 0.52], [0.06, 0.78], [0.08, 0.8], [0, 0.82]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const body = inked(new THREE.LatheGeometry(profile, 28), toon(0xb8a07a), 0.02);
  const band = inked(new THREE.TorusGeometry(0.33, 0.02, 6, 28), toon(0x6b5a44), 0);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.37;
  const spin = new THREE.Group();
  spin.add(body, band);
  const tilt = new THREE.Group();
  tilt.add(spin);
  const update = (t: number, wobble: number) => {
    spin.rotation.y = t * 38;
    tilt.rotation.z = Math.sin(t * 9) * 0.22 * wobble;
    tilt.rotation.x = Math.cos(t * 9) * 0.22 * wobble;
  };
  return { group: tilt, update };
}
