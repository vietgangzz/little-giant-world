import * as THREE from "three";
import { rng } from "./noise";
import { halftone, inked, toon } from "./toon";
import { R, roadA, standOn } from "./world";

const random = rng(99);

export function box(w: number, h: number, d: number, color: number | THREE.Material, ink = 0.012) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
export function cone(r: number, h: number, seg: number, color: number, ink = 0.012) {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
export function cyl(r0: number, r1: number, h: number, seg: number, color: number, ink = 0.012) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg);
  g.translate(0, h / 2, 0);
  return inked(g, color, ink);
}
export function glow(color: number) {
  return new THREE.MeshToonMaterial({ color, emissive: color, emissiveIntensity: 0.8, gradientMap: toon(color).gradientMap });
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
/* --------------------------------------------------------------- vehicles */

function plateTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 64;
  const x = c.getContext("2d")!;
  x.fillStyle = "#f7f7f2"; x.fillRect(0, 0, 128, 64);
  x.strokeStyle = "#24163f"; x.lineWidth = 6; x.strokeRect(3, 3, 122, 58);
  x.fillStyle = "#24163f"; x.font = "900 30px Nunito, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(text, 64, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Xe máy: a Cub-meets-Vespa scooter, about 0.62 long in its own units (the story
 * scales it up). Faces +Z. `slots` are where the crew sit and stack; `wheels`
 * spin about their local X.
 */
export function motorbike() {
  const g = new THREE.Group();
  const red = 0xe63946, cream = 0xf6ecd6, chrome = 0xdfe4ef, dark = 0x2a1f3d, seatBrown = 0x4a2f28;
  // wheels: tyre, rim, hub
  const tyreGeo = new THREE.TorusGeometry(0.068, 0.024, 10, 24);
  const rimGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.03, 20);
  const hubGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.05, 10);
  const wheels = [0.23, -0.2].map((z) => {
    const w = new THREE.Group();
    const tyre = inked(tyreGeo, toon(0x1b1530), 0.006);
    tyre.rotation.y = Math.PI / 2;
    const rim = inked(rimGeo, toon(chrome), 0.004);
    rim.rotation.z = Math.PI / 2;
    const hub = inked(hubGeo, toon(red), 0.003);
    hub.rotation.z = Math.PI / 2;
    w.add(tyre, rim, hub);
    // a painted stripe on the rim so the spin reads
    const mark = box(0.034, 0.012, 0.014, red, 0);
    mark.position.set(0, 0.025, 0);
    w.add(mark);
    w.position.set(0, 0.092, z);
    g.add(w);
    return w;
  });
  // front fender hugging the wheel
  const fender = inked(new THREE.TorusGeometry(0.085, 0.022, 8, 16, Math.PI * 0.8), toon(red), 0.006);
  fender.rotation.set(0, Math.PI / 2, 0);
  fender.rotateZ(Math.PI * 0.12);
  fender.position.set(0, 0.092, 0.23);
  fender.scale.set(1, 1, 1.3);
  // fork: two stanchions to the steering head
  [-0.035, 0.035].forEach((x) => {
    const f = cyl(0.008, 0.008, 0.22, 6, chrome, 0.003);
    f.position.set(x, 0.09, 0.235);
    f.rotation.x = -0.28;
    g.add(f);
  });
  // leg shield: a curved cream panel, the Vespa silhouette
  const shield = inked(new THREE.CylinderGeometry(0.1, 0.085, 0.26, 18, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    toon(cream, { side: THREE.DoubleSide }), 0.006);
  shield.position.set(0, 0.2, 0.1);
  shield.rotation.x = -0.18;
  shield.scale.set(1.1, 1, 0.9);
  // steering column and headset with the round chrome headlight
  const column = cyl(0.03, 0.026, 0.2, 10, red, 0.006);
  column.position.set(0, 0.18, 0.2);
  column.rotation.x = -0.28;
  const headset = inked(new THREE.CapsuleGeometry(0.035, 0.12, 4, 10), toon(red), 0.006);
  headset.rotation.z = Math.PI / 2;
  headset.position.set(0, 0.39, 0.25);
  const bezel = inked(new THREE.TorusGeometry(0.032, 0.008, 8, 18), toon(chrome), 0.003);
  bezel.position.set(0, 0.39, 0.29);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 18), glow(0xfff3b0));
  lens.position.set(0, 0.39, 0.292);
  // handlebar, grips, mirrors
  const bar = cyl(0.008, 0.008, 0.3, 6, chrome, 0.003);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0.15, 0.4, 0.24);
  [-1, 1].forEach((s) => {
    const grip = cyl(0.013, 0.013, 0.05, 8, dark, 0.003);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(s * 0.17 + (s > 0 ? 0 : 0.05), 0.4, 0.24);
    const stalk = cyl(0.004, 0.004, 0.09, 4, chrome, 0.002);
    stalk.position.set(s * 0.1, 0.4, 0.24);
    stalk.rotation.z = -s * 0.35;
    const mirror = inked(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 14), toon(chrome), 0.003);
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(s * 0.13, 0.485, 0.24);
    g.add(grip, stalk, mirror);
  });
  // floorboard with rubber strips
  const floor = box(0.12, 0.02, 0.2, dark, 0.005);
  floor.position.set(0, 0.07, 0.02);
  for (let i = 0; i < 4; i++) {
    const strip = box(0.1, 0.004, 0.012, 0x5a5270, 0);
    strip.position.set(0, 0.09, -0.06 + i * 0.05);
    g.add(strip);
  }
  // rear body: a rounded cowl over the engine and the back wheel
  const cowl = inked(new THREE.SphereGeometry(0.1, 20, 14), toon(red), 0.008);
  cowl.scale.set(0.8, 0.75, 1.55);
  cowl.position.set(0, 0.16, -0.13);
  const trim = inked(new THREE.TorusGeometry(0.1, 0.006, 6, 24), toon(chrome), 0.002);
  trim.rotation.y = Math.PI / 2;
  trim.scale.set(1, 0.75, 1.55);
  trim.position.set(0.075, 0.16, -0.13);
  // seat: a long padded saddle
  const seat = inked(new THREE.CapsuleGeometry(0.045, 0.2, 4, 12), toon(seatBrown), 0.006);
  seat.rotation.x = Math.PI / 2;
  seat.scale.set(1.2, 1, 0.55);
  seat.position.set(0, 0.245, -0.09);
  // exhaust, tail light and plate
  const pipe = cyl(0.016, 0.016, 0.24, 10, chrome, 0.004);
  pipe.rotation.x = Math.PI / 2 - 0.12;
  pipe.position.set(0.075, 0.075, -0.04);
  const tip = cyl(0.02, 0.02, 0.03, 10, 0x8a8fa0, 0.003);
  tip.rotation.x = Math.PI / 2;
  tip.position.set(0.075, 0.06, -0.3);
  const tail = inked(new THREE.BoxGeometry(0.06, 0.025, 0.02), glow(0xff3b3b), 0.004);
  tail.position.set(0, 0.2, -0.29);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), new THREE.MeshBasicMaterial({ map: plateTexture("59-VG 26") }));
  plate.position.set(0, 0.14, -0.3);
  plate.rotation.y = Math.PI;
  // kick stand and a little basket up front
  const stand = cyl(0.005, 0.005, 0.09, 4, dark, 0.002);
  stand.position.set(-0.05, 0.02, -0.02);
  stand.rotation.z = 0.6;
  const basket = box(0.1, 0.05, 0.06, 0xc8964f, 0.004);
  basket.position.set(0, 0.28, 0.31);
  g.add(fender, shield, column, headset, bezel, lens, bar, floor, cowl, trim, seat, pipe, tip, tail, plate, stand, basket);
  // Nine on one bike: three on the saddle, three on their heads, then two, then one
  const H = 0.3 / 1.35; // one mascot tall, in the bike's own (scaled) units
  const base = 0.27;
  const slots = [
    [0, base, 0.06], [0, base, -0.07], [0, base, -0.2],
    [0, base + H, 0.06], [0, base + H, -0.07], [0, base + H, -0.2],
    [0, base + H * 2, 0.0], [0, base + H * 2, -0.13],
    [0, base + H * 3, -0.07],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return { group: g, slots, wheels, exhaust: new THREE.Vector3(0.075, 0.06, -0.33) };
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

