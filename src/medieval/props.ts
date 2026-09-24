import * as THREE from "three";
import { additive, ball, box, canvasTexture, cyl, seeded, V } from "../film/kit";
import { inked, toon } from "../toon";

/** Set pieces for the Little Kingdom: stone, timber, thatch and banners. */

export const stoneTex = (tint = "#9c948a", seed = 1, repeat: [number, number] = [2, 2]) => canvasTexture(256, 256, (ctx, W, H) => {
  ctx.fillStyle = "#6f675e"; ctx.fillRect(0, 0, W, H);
  const r = seeded(seed);
  for (let y = 0; y < H; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < W; x += 64) {
    const v = 0.85 + r() * 0.25;
    const c = new THREE.Color(tint).multiplyScalar(v);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(x + 2, y + 2, 60, 28);
  }
}, repeat);
export const plankTex = (tint = "#8a6a4a", repeat: [number, number] = [2, 2]) => canvasTexture(256, 256, (ctx, _W, H) => {
  const r = seeded(7);
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Color(tint).multiplyScalar(0.85 + r() * 0.25);
    ctx.fillStyle = `#${c.getHexString()}`; ctx.fillRect(i * 32, 0, 32, H);
    ctx.fillStyle = "rgba(40,24,12,0.5)"; ctx.fillRect(i * 32 + 30, 0, 2, H);
  }
}, repeat);
export const thatchTex = () => canvasTexture(128, 128, (ctx, W, H) => {
  ctx.fillStyle = "#c9a35a"; ctx.fillRect(0, 0, W, H);
  const r = seeded(3);
  for (let i = 0; i < 260; i++) { ctx.strokeStyle = r() < 0.5 ? "#a8823e" : "#e0c27a"; ctx.lineWidth = 2; const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y + 14); ctx.stroke(); }
}, [3, 2]);
export const cobbleTex = (repeat: [number, number] = [10, 10]) => canvasTexture(256, 256, (ctx, W, H) => {
  ctx.fillStyle = "#6e6356"; ctx.fillRect(0, 0, W, H);
  const r = seeded(5);
  for (let y = 0; y < H; y += 21) for (let x = (y / 21) % 2 ? 10 : 0; x < W; x += 21) {
    const c = new THREE.Color("#a3988a").multiplyScalar(0.85 + r() * 0.25);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.beginPath(); ctx.ellipse(x + 10, y + 10, 9, 8, 0, 0, 7); ctx.fill();
  }
}, repeat);
export const grassTex = (repeat: [number, number] = [20, 20]) => canvasTexture(128, 128, (ctx, W, H) => {
  ctx.fillStyle = "#7fae4e"; ctx.fillRect(0, 0, W, H);
  const r = seeded(9);
  for (let i = 0; i < 300; i++) { ctx.fillStyle = r() < 0.5 ? "#6f9e42" : "#94c060"; ctx.fillRect(r() * W, r() * H, 2, 4); }
}, repeat);

export function ground(tex: THREE.Texture, size = 200, color = 0xffffff) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshToonMaterial({ map: tex, color }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  return g;
}

/** A crenellated wall segment. */
export function wall(len: number, h: number, depth = 1.2, tex = stoneTex()) {
  const g = new THREE.Group();
  const t = tex.clone(); t.repeat.set(len / 3, h / 3); t.needsUpdate = true;
  const body = box(len, h, depth, new THREE.MeshToonMaterial({ map: t }), 0.04);
  g.add(body);
  for (let x = -len / 2 + 0.4; x < len / 2; x += 1.2) {
    const m = box(0.7, 0.7, depth, 0x9c948a, 0.03);
    m.position.set(x, h, 0);
    g.add(m);
  }
  return g;
}

/** A round tower with a pointed slate roof and a pennant. */
export function tower(r: number, h: number, roof = 0x3d4f7a, pennant = 0xe63946) {
  const g = new THREE.Group();
  const t = stoneTex("#a39a8f", 4); t.repeat.set(r * 2, h / 2); t.needsUpdate = true;
  g.add(cyl(r, r, h, new THREE.MeshToonMaterial({ map: t }), 20, 0.04));
  const lip = cyl(r + 0.25, r + 0.25, 0.5, 0x8c847a, 20, 0.03);
  lip.position.y = h;
  const cone = inked(new THREE.ConeGeometry(r + 0.4, r * 2.4, 20), toon(roof), 0.04);
  cone.position.y = h + 0.5 + r * 1.2;
  const pole = cyl(0.04, 0.04, 1.4, 0x3a3a3a, 6, 0.01);
  pole.position.y = h + 0.5 + r * 2.4;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5, 6, 1), new THREE.MeshToonMaterial({ color: pennant, side: THREE.DoubleSide }));
  flag.position.set(0.55, h + 1.6 + r * 2.4, 0);
  flag.userData.flag = true;
  // arrow-slit windows
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    const win = box(0.18, 0.7, 0.1, 0x1b1712, 0);
    win.position.set(Math.sin(a) * r, h * (0.35 + i * 0.18), Math.cos(a) * r);
    win.rotation.y = a;
    g.add(win);
  }
  g.add(lip, cone, pole, flag);
  return g;
}

/** The VGang castle: a keep, four towers and curtain walls. */
export function castle() {
  const g = new THREE.Group();
  const keep = box(7, 9, 7, new THREE.MeshToonMaterial({ map: stoneTex("#b0a79b", 2, [2, 3]) }), 0.05);
  g.add(keep);
  const keepTop = wall(7, 0.01, 7);
  keepTop.position.y = 9;
  g.add(keepTop);
  const bigTower = tower(1.8, 12, 0x3d4f7a, 0xc6df70);
  bigTower.position.set(0, 0, 0);
  g.add(bigTower);
  [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([x, z], i) => {
    const t = tower(1.4, 8, i % 2 ? 0x8c2f39 : 0x3d4f7a, i % 2 ? 0xffc93c : 0xe63946);
    t.position.set(x, 0, z);
    g.add(t);
  });
  [[0, -6, 0], [0, 6, 0], [-6, 0, Math.PI / 2], [6, 0, Math.PI / 2]].forEach(([x, z, r]) => {
    const w = wall(11, 5);
    w.position.set(x, 0, z);
    w.rotation.y = r;
    g.add(w);
  });
  const gate = box(2.4, 3.2, 0.3, 0x5a3f2e, 0.03);
  gate.position.set(0, 0, 6.5);
  const arch = inked(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16, 1, false, -Math.PI / 2, Math.PI), toon(0x5a3f2e), 0.03);
  arch.rotation.x = Math.PI / 2;
  arch.position.set(0, 3.2, 6.5);
  g.add(gate, arch);
  [-2.4, 2.4].forEach((x) => { const b = banner(0x2b3f8f, 1.2, 3); b.position.set(x, 4.8, 6.65); g.add(b); });
  return g;
}

/** A hanging banner with the VG crest. */
export function banner(color = 0x2b3f8f, w = 1.2, h = 2.6, crest = "VG") {
  const tex = canvasTexture(128, Math.round(128 * (h / w)), (ctx, W, H) => {
    ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e8b64a"; ctx.fillRect(0, 0, W, 10); ctx.fillRect(8, 0, 6, H); ctx.fillRect(W - 14, 0, 6, H);
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W / 2, H - 36); ctx.lineTo(W, H); ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fill();
    ctx.fillStyle = "#c6df70"; ctx.font = "900 48px Cinzel, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(crest, W / 2, H * 0.42);
  });
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, -h); shape.lineTo(0, -h + w * 0.35); shape.lineTo(-w / 2, -h); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute, pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, 1 + pos.getY(i) / h);
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: tex, side: THREE.DoubleSide }));
  const rod = cyl(0.04, 0.04, w + 0.3, 0x5a3a22, 6, 0.01);
  rod.rotation.z = Math.PI / 2;
  rod.position.x = (w + 0.3) / 2;
  rod.position.x = 0;
  const g = new THREE.Group();
  g.add(m, rod);
  return g;
}

export function cottage(color = 0xe8dcc0, seed = 1) {
  const g = new THREE.Group();
  const r = seeded(seed);
  const w = 3 + r() * 1.2, d = 3 + r() * 0.8, h = 2.2 + r() * 0.6;
  const walls = box(w, h, d, color, 0.035);
  g.add(walls);
  // timber framing
  [-w / 2 + 0.05, w / 2 - 0.05].forEach((x) => { const beam = box(0.16, h, 0.06, 0x5a3f2e, 0.01); beam.position.set(x, 0, d / 2 + 0.02); g.add(beam); });
  const cross = box(w, 0.16, 0.06, 0x5a3f2e, 0.01);
  cross.position.set(0, h * 0.55, d / 2 + 0.02);
  g.add(cross);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-w / 2 - 0.35, 0); roofShape.lineTo(0, 1.7); roofShape.lineTo(w / 2 + 0.35, 0); roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.6, bevelEnabled: false });
  roofGeo.translate(0, 0, -(d + 0.6) / 2);
  const roof = inked(roofGeo, new THREE.MeshToonMaterial({ map: thatchTex() }), 0.04);
  roof.position.y = h;
  const door = box(0.8, 1.4, 0.08, 0x6b4226, 0.015);
  door.position.set(-w * 0.2, 0, d / 2 + 0.04);
  const win = box(0.6, 0.55, 0.08, 0xffd98a, 0.012);
  win.position.set(w * 0.22, h * 0.45, d / 2 + 0.04);
  const chimney = box(0.45, 1.3, 0.45, 0x8c847a, 0.02);
  chimney.position.set(w * 0.25, h + 0.5, -d * 0.15);
  g.add(roof, door, win, chimney);
  return g;
}

export function tree(seed = 1, scale = 1) {
  const r = seeded(seed);
  const g = new THREE.Group();
  const trunk = cyl(0.22, 0.16, 1.6, 0x6b4a33, 8, 0.02);
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const b = ball(0.9 + r() * 0.4, [0x5e8f3a, 0x6fa244, 0x4f7f33][i], 0.03, 12);
    b.position.set((r() - 0.5) * 0.9, 2.1 + i * 0.35, (r() - 0.5) * 0.9);
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

export function torch() {
  const g = new THREE.Group();
  const stick = cyl(0.05, 0.07, 0.6, 0x5a3a22, 6, 0.012);
  const cup = cyl(0.12, 0.08, 0.14, 0x3a3a3a, 8, 0.012);
  cup.position.y = 0.6;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
  flame.position.y = 0.92;
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  core.position.y = 0.86;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), additive(0xffa040, 0.12));
  halo.position.y = 0.9;
  const light = new THREE.PointLight(0xffa050, 5, 7, 1.5);
  light.position.y = 1.0;
  g.add(stick, cup, flame, core, halo, light);
  g.userData.flame = flame;
  g.userData.light = light;
  return g;
}
/** Flickers every torch / candle in a scene. */
export function flicker(scene: THREE.Object3D, t: number) {
  let i = 0;
  scene.traverse((o) => {
    if (o.userData.flame) {
      const f = 1 + Math.sin(t * 17 + i * 3) * 0.08 + Math.sin(t * 29 + i) * 0.06;
      (o.userData.flame as THREE.Object3D).scale.set(1, f, 1);
      if (o.userData.light) (o.userData.light as THREE.PointLight).intensity = (o.userData.base ??= (o.userData.light as THREE.PointLight).intensity) * f;
      i++;
    }
    if (o.userData.flag) {
      const m = o as THREE.Mesh;
      m.rotation.y = Math.sin(t * 3 + i) * 0.25;
    }
  });
}

export function candle(h = 0.4) {
  const g = new THREE.Group();
  const wax = cyl(0.07, 0.07, h, 0xfff3d6, 10, 0.01);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
  flame.position.y = h + 0.08;
  const light = new THREE.PointLight(0xffb060, 1.6, 4, 1.6);
  light.position.y = h + 0.2;
  g.add(wax, flame, light);
  g.userData.flame = flame;
  g.userData.light = light;
  return g;
}

export function table(w: number, d: number, h = 1.0, color = 0x7a5230) {
  const g = new THREE.Group();
  const top = box(w, 0.14, d, new THREE.MeshToonMaterial({ map: plankTex(`#${new THREE.Color(color).getHexString()}`, [w / 2, 1]) }), 0.02);
  top.position.y = h - 0.14;
  g.add(top);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => { const l = box(0.14, h - 0.14, 0.14, 0x5a3a22, 0.012); l.position.set(x * (w / 2 - 0.2), 0, z * (d / 2 - 0.15)); g.add(l); });
  return g;
}
export function barrel() {
  const g = new THREE.Group();
  const pts = [[0.38, 0], [0.46, 0.35], [0.48, 0.55], [0.46, 0.75], [0.38, 1.1]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(inked(new THREE.LatheGeometry(pts, 16), toon(0x8a5a36), 0.02));
  [0.15, 0.95].forEach((y) => { const hoop = inked(new THREE.TorusGeometry(0.43, 0.025, 6, 18), toon(0x3a3a3a), 0); hoop.rotation.x = Math.PI / 2; hoop.position.y = y; g.add(hoop); });
  const lid = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), toon(0x7a4a2a));
  lid.rotation.x = -Math.PI / 2; lid.position.y = 1.1;
  g.add(lid);
  return g;
}
export function tankard() {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.14, 0.34, 0x9aa2aa, 14, 0.012));
  const ale = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), toon(0xf6e6b0));
  ale.rotation.x = -Math.PI / 2; ale.position.y = 0.345;
  const handle = inked(new THREE.TorusGeometry(0.09, 0.025, 6, 10, Math.PI), toon(0x9aa2aa), 0.008);
  handle.rotation.z = -Math.PI / 2; handle.position.set(0.16, 0.17, 0);
  g.add(ale, handle);
  return g;
}

/** Arched window letting a beam of daylight in. */
export function archWindow(w = 1.2, h = 2.2, light = 0xfff1c8, beam = true) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h - w / 2); shape.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); shape.closePath();
  const pane = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), new THREE.MeshBasicMaterial({ color: light }));
  const bars = new THREE.Group();
  [0].forEach((x) => { const b = box(0.06, h, 0.04, 0x3a2a1c, 0); b.position.set(x, 0, 0.01); bars.add(b); });
  const cross = box(w, 0.06, 0.04, 0x3a2a1c, 0); cross.position.set(0, h * 0.5, 0.01); bars.add(cross);
  g.add(pane, bars);
  if (beam) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, h * 0.8, 9), additive(0xfff0c0, 0.05));
    b.position.set(0, -h * 0.4, 4.5);
    b.rotation.x = 0.5;
    g.add(b);
  }
  return g;
}

/** A friendly toon horse with a caparison. `pose(t, gallop)` animates the legs. */
export function horse(cloth = 0x2b3f8f) {
  const g = new THREE.Group();
  const coat = toon(0xf4efe6);
  const body = inked(new THREE.CapsuleGeometry(0.7, 1.4, 6, 14), coat, 0.035);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.7;
  const neck = inked(new THREE.CapsuleGeometry(0.34, 0.8, 4, 10), coat, 0.03);
  neck.position.set(0, 2.45, 1.1);
  neck.rotation.x = 0.6;
  const head = inked(new THREE.CapsuleGeometry(0.3, 0.6, 4, 10), coat, 0.03);
  head.position.set(0, 2.85, 1.55);
  head.rotation.x = 1.25;
  const muzzle = ball(0.26, 0xe8d8c8, 0.02, 12);
  muzzle.position.set(0, 2.72, 1.95);
  [-0.12, 0.12].forEach((x) => {
    const eye = ball(0.06, 0x1c1a24, 0, 8); eye.position.set(x * 1.8, 3.05, 1.6); g.add(eye);
    const ear = inked(new THREE.ConeGeometry(0.08, 0.28, 6), coat, 0.012); ear.position.set(x * 1.4, 3.3, 1.35); g.add(ear);
  });
  const mane = new THREE.Group();
  for (let i = 0; i < 6; i++) { const m = ball(0.14, 0x6b4a33, 0.012, 8); m.position.set(0, 2.2 + i * 0.18, 0.75 + i * 0.13); mane.add(m); }
  const tail = new THREE.Group();
  for (let i = 0; i < 4; i++) { const m = ball(0.16 - i * 0.02, 0x6b4a33, 0.012, 8); m.position.set(0, -i * 0.22, -i * 0.12); tail.add(m); }
  tail.position.set(0, 2.0, -1.45);
  // the caparison: a draped cloth over the back
  const drape = inked(new THREE.CylinderGeometry(0.82, 0.95, 2.0, 18, 1, true, Math.PI * 0.5, Math.PI), toon(cloth, { side: THREE.DoubleSide }), 0.02);
  drape.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  drape.position.y = 1.65;
  drape.scale.set(1, 1, 1.1);
  const legs = [[-0.4, 0.8], [0.4, 0.8], [-0.4, -0.8], [0.4, -0.8]].map(([x, z]) => {
    const leg = new THREE.Group();
    const shin = cyl(0.13, 0.15, 1.2, coat, 8, 0.02);
    shin.position.y = -1.2;
    const hoof = cyl(0.17, 0.17, 0.16, 0x3a2a1c, 8, 0.012);
    hoof.position.y = -1.3;
    leg.add(shin, hoof);
    leg.position.set(x, 1.3, z);
    g.add(leg);
    return leg;
  });
  g.add(body, neck, head, muzzle, mane, tail, drape);
  const saddle = new THREE.Vector3(0, 2.25, -0.1);
  const pose = (t: number, gallop: number) => {
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 12 + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.6) * 0.6 * gallop));
    g.position.y = Math.abs(Math.sin(t * 12)) * 0.25 * gallop;
    tail.rotation.x = -0.4 - gallop * 0.6 + Math.sin(t * 9) * 0.2;
    mane.rotation.x = -gallop * 0.2;
  };
  return { group: g, saddle, pose };
}

export function stocks() {
  const g = new THREE.Group();
  const wood = 0x7a5230;
  [-1.3, 1.3].forEach((x) => { const p = box(0.22, 2.6, 0.22, wood, 0.02); p.position.x = x; g.add(p); });
  const board = new THREE.Group();
  const lower = box(2.8, 0.34, 0.2, wood, 0.02);
  lower.position.y = 1.35;
  const upper = box(2.8, 0.34, 0.2, 0x8a6240, 0.02);
  upper.position.y = 1.7;
  const holes = [-0.95, 0.95].map((x) => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), toon(0x2a1a10)); h.position.set(x, 1.69, 0.11); return h; });
  board.add(lower, upper, ...holes);
  const platform = box(3.4, 0.3, 2, 0x6b4a33, 0.02);
  platform.position.y = -0.3;
  g.add(board, platform);
  return g;
}

export function hayCart() {
  const g = new THREE.Group();
  const bed = box(3.2, 0.5, 2, new THREE.MeshToonMaterial({ map: plankTex() }), 0.03);
  bed.position.y = 0.7;
  g.add(bed);
  [[-1.1, 1.05], [1.1, 1.05], [-1.1, -1.05], [1.1, -1.05]].forEach(([x, z]) => {
    const w = inked(new THREE.TorusGeometry(0.55, 0.08, 8, 20), toon(0x5a3a22), 0.015);
    w.position.set(x, 0.6, z); g.add(w);
    const hub = cyl(0.1, 0.1, 0.12, 0x3a2a1c, 8, 0.01); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.6, z); g.add(hub);
  });
  const hay = new THREE.Group();
  const r = seeded(4);
  for (let i = 0; i < 14; i++) { const b = ball(0.5 + r() * 0.3, 0xe0c060, 0.02, 10); b.position.set((r() - 0.5) * 2.6, 1.3 + r() * 0.5, (r() - 0.5) * 1.4); b.scale.y = 0.7; hay.add(b); }
  g.add(hay);
  return g;
}

export function well() {
  const g = new THREE.Group();
  const t = stoneTex("#a09789", 6); t.repeat.set(3, 1); t.needsUpdate = true;
  g.add(cyl(1.0, 1.0, 1.0, new THREE.MeshToonMaterial({ map: t }), 20, 0.03));
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20), toon(0x3a6b8f));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.8;
  [-0.9, 0.9].forEach((x) => { const p = box(0.14, 2.2, 0.14, 0x5a3a22, 0.012); p.position.x = x; g.add(p); });
  const roofShape = new THREE.Shape(); roofShape.moveTo(-1.3, 0); roofShape.lineTo(0, 0.8); roofShape.lineTo(1.3, 0); roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.4, bevelEnabled: false }); roofGeo.translate(0, 0, -0.7);
  const roof = inked(roofGeo, toon(0x8c2f39), 0.02); roof.position.y = 2.2;
  const bucket = cyl(0.18, 0.2, 0.3, 0x7a5230, 10, 0.01); bucket.position.set(0, 1.5, 0);
  g.add(water, roof, bucket);
  return g;
}

export function stall(awning = 0xc0262d) {
  const g = new THREE.Group();
  const counter = box(2.6, 1.0, 1.1, 0x7a5230, 0.02);
  g.add(counter);
  [-1.2, 1.2].forEach((x) => { const p = box(0.1, 2.4, 0.1, 0x5a3a22, 0.01); p.position.set(x, 0, 0.5); g.add(p); });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 1.6), new THREE.MeshToonMaterial({
    map: canvasTexture(128, 32, (ctx, _W, H) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#f6ecd6" : `#${new THREE.Color(awning).getHexString()}`; ctx.fillRect(i * 16, 0, 16, H); } }),
  }));
  cover.position.set(0, 2.4, 0.2); cover.rotation.x = 0.2;
  g.add(cover);
  const r = seeded(awning);
  for (let i = 0; i < 9; i++) { const f = ball(0.15, [0xe63946, 0xffc93c, 0x7fae4e, 0xf28c28][i % 4], 0.01, 8); f.position.set(-1 + (i % 5) * 0.5, 1.1, -0.2 + Math.floor(i / 5) * 0.35 + r() * 0.1); g.add(f); }
  return g;
}

export { V };

/** A stone room: floor, back wall and two side walls, open to the camera at +z. */
export function room(w: number, d: number, h: number, opts: { wall?: THREE.Texture; floor?: THREE.Texture; floorColor?: number } = {}) {
  const g = new THREE.Group();
  const wallTex = opts.wall ?? stoneTex("#a39a8f", 3);
  const mk = (tex: THREE.Texture, rx: number, ry: number) => { const t = tex.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return new THREE.MeshToonMaterial({ map: t }); };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mk(opts.floor ?? plankTex("#7a5a3c"), w / 3, d / 3));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mk(wallTex, w / 4, h / 4));
  back.position.set(0, h / 2, -d / 2);
  back.receiveShadow = true;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(d, h), mk(wallTex, d / 4, h / 4));
  left.rotation.y = Math.PI / 2;
  left.position.set(-w / 2, h / 2, 0);
  left.receiveShadow = true;
  const right = left.clone();
  right.rotation.y = -Math.PI / 2;
  right.position.x = w / 2;
  g.add(floor, back, left, right);
  return g;
}
