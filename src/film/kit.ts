import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp, easeInOut, lerp } from "../noise";
import { inked, toon } from "../toon";

/**
 * Building blocks for the film sets. Every set is authored at mascot scale:
 * a mascot is 2 units tall, the floor is y=0 and the cast faces +Z.
 */

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll?: number };
export type Grade = {
  sat: number; contrast: number; bright: number; bw: number; sepia: number; split: number;
  flash: number; vignette: number; grain: number; lift: THREE.Color; gain: THREE.Color;
};
export type Cue =
  | { kind: "sfx"; name: string; volume?: number; rate?: number; reverse?: boolean }
  | { kind: "pop"; text: string; at: THREE.Vector3; big?: boolean }
  | { kind: "duck"; volume: number; seconds?: number };
export type Frame = { shot: Shot; grade?: Partial<Grade>; imax?: number; shake?: number };

export interface FilmSet {
  readonly scene: THREE.Scene;
  /** Pose everything for local time u (seconds since the cut) and say where the camera is. */
  update(u: number): Frame;
  /** Things that happen at a local time: sounds and comic pops. */
  readonly cues: [number, Cue][];
}

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Box sitting on y=0. */
export function box(w: number, h: number, d: number, color: number | THREE.Material, ink = 0.03) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return inked(g, color instanceof THREE.Material ? color : toon(color), ink);
}
export function rbox(w: number, h: number, d: number, r: number, color: number, ink = 0.03) {
  const g = new RoundedBoxGeometry(w, h, d, 3, r);
  g.translate(0, h / 2, 0);
  return inked(g, toon(color), ink);
}
/** Cylinder sitting on y=0 (bottom radius first). */
export function cyl(r0: number, r1: number, h: number, color: number | THREE.Material, seg = 20, ink = 0.03) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg);
  g.translate(0, h / 2, 0);
  return inked(g, color instanceof THREE.Material ? color : toon(color), ink);
}
export function ball(r: number, color: number | THREE.Material, ink = 0.03, seg = 18) {
  return inked(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), color instanceof THREE.Material ? color : toon(color), ink);
}
export function glowMat(color: number, strength = 1) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength) });
}
export function additive(color: number, opacity = 0.5) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}

/** A canvas texture, drawn once. */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(...repeat); }
  return tex;
}
export function picture(w: number, h: number, tex: THREE.Texture, lit = false) {
  const mat = lit ? new THREE.MeshToonMaterial({ map: tex }) : new THREE.MeshBasicMaterial({ map: tex });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/** Facade texture: a wall colour with a grid of windows, some of them lit. */
export function windows(wall: string, glass: string, lit: string, cols: number, rows: number, seed = 1, litShare = 0.35) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
    const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      ctx.fillStyle = rand() < litShare ? lit : glass;
      ctx.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.2, cw * 0.56, rh * 0.58);
    }
  });
}

/** A gradient sky dome that follows the camera. */
export function skyDome(top: number, bottom: number, horizon = bottom, radius = 400) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color(top) }, uBottom: { value: new THREE.Color(bottom) }, uHorizon: { value: new THREE.Color(horizon) } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop, uBottom, uHorizon; varying vec3 vDir;
      void main(){ float h = vDir.y;
        vec3 c = mix(uHorizon, uTop, smoothstep(0.0, 0.55, h));
        c = mix(uBottom, c, smoothstep(-0.25, 0.02, h));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

/** Hemisphere fill plus one shadow-casting key light aimed at a focus point. */
export function lights(scene: THREE.Scene, opts: { sky?: number; ground?: number; fill?: number; key?: number; keyI?: number; from?: THREE.Vector3; span?: number; focus?: THREE.Vector3 } = {}) {
  const hemi = new THREE.HemisphereLight(opts.sky ?? 0xf1ecff, opts.ground ?? 0x6a5a8a, opts.fill ?? 1.4);
  const key = new THREE.DirectionalLight(opts.key ?? 0xfff4e0, opts.keyI ?? 2.2);
  const focus = opts.focus ?? V(0, 0, 0);
  key.position.copy(focus).add(opts.from ?? V(-6, 12, 9));
  key.target.position.copy(focus);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  const span = opts.span ?? 14;
  const c = key.shadow.camera;
  c.left = c.bottom = -span; c.right = c.top = span; c.near = 0.5; c.far = 80;
  scene.add(hemi, key, key.target);
  return { hemi, key };
}

/* ------------------------------------------------------------- motion */

export const ease = easeInOut;
export const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
/** Eased blend between two vectors over [a, b] of local time. */
export function glide(u: number, a: number, b: number, from: THREE.Vector3, to: THREE.Vector3, curve = ease) {
  return from.clone().lerp(to, curve(seg(u, a, b)));
}
/** A camera move between two framings. */
export function move(u: number, a: number, b: number, from: Shot, to: Shot, curve = ease): Shot {
  const k = curve(seg(u, a, b));
  return {
    pos: from.pos.clone().lerp(to.pos, k),
    look: from.look.clone().lerp(to.look, k),
    fov: lerp(from.fov, to.fov, k),
    roll: lerp(from.roll ?? 0, to.roll ?? 0, k),
  };
}
export const shot = (pos: THREE.Vector3, look: THREE.Vector3, fov = 40, roll = 0): Shot => ({ pos, look, fov, roll });
/** Orbit a point: angle in radians around Y, radius, height. */
export function around(center: THREE.Vector3, angle: number, radius: number, height: number) {
  return center.clone().add(V(Math.sin(angle) * radius, height, Math.cos(angle) * radius));
}

/** Seeded random for set dressing. */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** A group of extra mascots (extras, prisoners, soldiers) that can bob in place. */
export function crowdBob(m: { root: THREE.Object3D; rig: THREE.Object3D }, t: number, amount = 0.08, speed = 6, phase = 0) {
  m.rig.position.y = Math.abs(Math.sin(t * speed + phase)) * amount;
}

/**
 * Atmosphere: a drifting cloud of little points (dust in a sunbeam, embers,
 * ash, fireflies, snow). Returns an update to call with local time.
 */
export function motes(scene: THREE.Scene, opts: { count?: number; color?: number; size?: number; center?: THREE.Vector3; spread?: THREE.Vector3; rise?: number; drift?: number; twinkle?: boolean; opacity?: number } = {}) {
  const n = opts.count ?? 160;
  const c = opts.center ?? V(0, 3, 0), sp = opts.spread ?? V(12, 6, 12);
  const rand = seeded(n * 7 + Math.round(c.x * 13));
  const base = Array.from({ length: n }, () => V((rand() - 0.5) * sp.x, rand() * sp.y, (rand() - 0.5) * sp.z));
  const phase = Array.from({ length: n }, () => rand() * 10);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ color: opts.color ?? 0xfff2d0, size: opts.size ?? 0.06, transparent: true, opacity: opts.opacity ?? 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.position.copy(c).add(V(0, -sp.y / 2, 0));
  scene.add(pts);
  const rise = opts.rise ?? 0.15, drift = opts.drift ?? 0.3;
  return (u: number) => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      const b = base[i], p = phase[i];
      const y = ((b.y + u * rise * (0.6 + (p % 1)) ) % sp.y + sp.y) % sp.y;
      pos.setXYZ(i, b.x + Math.sin(u * 0.7 + p) * drift, y, b.z + Math.cos(u * 0.5 + p) * drift);
    }
    pos.needsUpdate = true;
    if (opts.twinkle) mat.opacity = (opts.opacity ?? 0.8) * (0.6 + Math.sin(u * 5) * 0.4);
  };
}

/** A loose flock of birds: little flapping Vs crossing the sky. */
export function flock(scene: THREE.Scene, count = 7, at = V(0, 14, -30), heading = V(1, 0, 0.2), color = 0x2a2420) {
  const mat = new THREE.LineBasicMaterial({ color });
  const birds = Array.from({ length: count }, (_, i) => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-0.5, 0.2, 0), V(0, 0, 0), V(0.5, 0.2, 0)]), mat);
    scene.add(line);
    return { line, off: V((i % 3) * -1.4, Math.sin(i * 1.7) * 1.2, Math.floor(i / 3) * 1.2 + (i % 2) * 0.6), ph: i * 0.9 };
  });
  const dir = heading.clone().normalize();
  return (u: number) => birds.forEach((b) => {
    b.line.position.copy(at).addScaledVector(dir, u * 4 - 14).add(b.off);
    b.line.scale.y = Math.sin(u * 10 + b.ph) > 0 ? 1 : -0.7;
  });
}
