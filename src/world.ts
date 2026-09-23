import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { simplex3, smoothstep, lerp, rng } from "./noise";
import { outline, toon } from "./toon";

/** Planet radius. Everything else on the globe is measured against it. */
export const R = 10;
/** Water surface height above R. Terrain below this is seabed. */
export const SEA = 0.06;

const noise = simplex3(20260923);
const ridgeNoise = simplex3(81);

export function latLon(lat: number, lon: number, target = new THREE.Vector3()) {
  const a = THREE.MathUtils.degToRad(lat), o = THREE.MathUtils.degToRad(lon);
  return target.set(Math.cos(a) * Math.sin(o), Math.sin(a), Math.cos(a) * Math.cos(o)).normalize();
}

/* ------------------------------------------------------------------ roads */

/** A great circle around the planet: point(θ) = a·cosθ + b·sinθ. */
export class Ring {
  readonly normal: THREE.Vector3;
  readonly samples = 2048;
  radius = new Float32Array(this.samples);
  bridge = new Uint8Array(this.samples);
  constructor(readonly a: THREE.Vector3, readonly b: THREE.Vector3) {
    this.normal = new THREE.Vector3().crossVectors(a, b).normalize();
  }
  static through(p: THREE.Vector3, q: THREE.Vector3) {
    const a = p.clone().normalize();
    const b = q.clone().sub(a.clone().multiplyScalar(a.dot(q))).normalize();
    return new Ring(a, b);
  }
  static heading(start: THREE.Vector3, toward: THREE.Vector3) {
    return Ring.through(start, toward);
  }
  dir(theta: number, target = new THREE.Vector3()) {
    return target.copy(this.a).multiplyScalar(Math.cos(theta)).addScaledVector(this.b, Math.sin(theta));
  }
  tangent(theta: number, target = new THREE.Vector3()) {
    return target.copy(this.a).multiplyScalar(-Math.sin(theta)).addScaledVector(this.b, Math.cos(theta));
  }
  private index(theta: number) {
    const u = (((theta / (Math.PI * 2)) % 1) + 1) % 1;
    return u * this.samples;
  }
  surface(theta: number) {
    const f = this.index(theta), i = Math.floor(f) % this.samples, j = (i + 1) % this.samples;
    return lerp(this.radius[i], this.radius[j], f - Math.floor(f));
  }
  isBridge(theta: number) {
    return this.bridge[Math.floor(this.index(theta)) % this.samples] === 1;
  }
  /** Road-deck position, optionally pushed sideways into a lane. */
  point(theta: number, lift = 0, side = 0, target = new THREE.Vector3()) {
    const d = this.dir(theta, target);
    const r = this.surface(theta) + lift;
    const s = new THREE.Vector3().crossVectors(this.tangent(theta), d).normalize();
    return d.multiplyScalar(r).addScaledVector(s, side);
  }
  /** Angle of the point on this ring closest to a direction. */
  thetaOf(direction: THREE.Vector3) {
    return Math.atan2(direction.dot(this.b), direction.dot(this.a));
  }
}

/** Road A carries the Vietnam leg of the story, north to south. */
const HOME = latLon(30, -12);
export const roadA = Ring.heading(HOME, latLon(-62, 18));
/** Road B crosses it and carries the world traffic. */
export const roadB = Ring.through(latLon(34, 80), latLon(40, -148));

/** Story beats along road A, in radians from Hà Giang. */
export const STOPS = {
  home: -0.1,
  haGiang: 0.14,
  haLong: 0.5,
  hoiAn: 0.86,
  saiGon: 1.2,
  airport: 1.46,
} as const;

/** Offsets a direction sideways from road A, for sites that sit beside it. */
function besideA(theta: number, side: number) {
  const d = roadA.dir(theta);
  const s = new THREE.Vector3().crossVectors(roadA.tangent(theta), d).normalize();
  return d.addScaledVector(s, side).normalize();
}

export type WorldStop = {
  id: string; name: string; vi: string; dir: THREE.Vector3; color: number; flag: string[];
};
/** Plane tour order. Colours are the local friend's body colour. */
export const WORLD: WorldStop[] = [
  { id: "singapore", name: "Singapore", vi: "Singapore", dir: latLon(-22, 42), color: 0xf28b82, flag: ["#ef3340", "#ffffff"] },
  { id: "tokyo", name: "Tokyo", vi: "Tokyo", dir: latLon(26, 84), color: 0xf7f2ea, flag: ["#ffffff", "#bc002d"] },
  { id: "cairo", name: "Cairo", vi: "Cairo", dir: latLon(-4, 148), color: 0xe8c07a, flag: ["#ce1126", "#ffffff", "#000000"] },
  { id: "paris", name: "Paris", vi: "Paris", dir: latLon(42, -150), color: 0x9fb6ff, flag: ["#0055a4", "#ffffff", "#ef4135"] },
  { id: "newyork", name: "New York", vi: "New York", dir: latLon(12, -86), color: 0x7fd6b0, flag: ["#3c3b6e", "#ffffff", "#b22234"] },
];
export const PLAZA = latLon(64, 34);

type Blob = { c: THREE.Vector3; r: number; h: number; mtn: number };
type Site = { c: THREE.Vector3; r: number; h: number };

const blobs: Blob[] = [];
const sites: Site[] = [];

// Vietnam: a mountainous north, a stretch of sea studded with karsts, then a long S down to the delta.
blobs.push({ c: roadA.dir(-0.28), r: 0.36, h: 1.1, mtn: 1 });
blobs.push({ c: besideA(-0.05, -0.12), r: 0.3, h: 1, mtn: 0.9 });
blobs.push({ c: roadA.dir(0.14), r: 0.2, h: 1, mtn: 0.35 });
blobs.push({ c: roadA.dir(STOPS.haLong), r: 0.085, h: 1.1, mtn: 0 });
[0.8, 0.94, 1.08, 1.22, 1.36, 1.5, 1.62].forEach((t, i) =>
  blobs.push({ c: besideA(t, Math.sin(i * 0.9) * 0.05), r: 0.15, h: 1, mtn: i < 3 ? 0.5 : 0.15 }));
blobs.push({ c: besideA(1.1, 0.24), r: 0.2, h: 0.95, mtn: 0.8 }); // the highlands to the west
sites.push({ c: besideA(STOPS.home, 0.028), r: 0.07, h: 0.34 });
sites.push({ c: roadA.dir(STOPS.haLong), r: 0.05, h: 0.2 });
sites.push({ c: besideA(STOPS.hoiAn, -0.04), r: 0.08, h: 0.2 });
sites.push({ c: besideA(STOPS.saiGon, 0.03), r: 0.1, h: 0.22 });
sites.push({ c: roadA.dir(STOPS.airport), r: 0.09, h: 0.2 });

// The world stops each get a continent and a flat plaza for their landmark.
WORLD.forEach((stop, i) => {
  blobs.push({ c: stop.dir, r: 0.36, h: 1.05, mtn: i === 1 ? 0 : 0.25 });
  sites.push({ c: stop.dir, r: 0.2, h: 0.24 });
});
// Filler continents so the globe never reads as a scatter of islands.
[[48, 20, 0.4], [-50, -40, 0.42], [-30, -120, 0.36], [70, 120, 0.4], [-70, 90, 0.4], [10, -35, 0.25], [-45, 170, 0.3]].forEach(
  ([la, lo, r]) => blobs.push({ c: latLon(la, lo), r, h: 1, mtn: 0.7 }));
// More land, seeded, kept clear of the Vietnam coastline so the bays stay open.
{
  const random = rng(314);
  const keepOpen = [roadA.dir(STOPS.haLong), roadA.dir(0.3), roadA.dir(0.68)];
  for (let placed = 0, tries = 0; placed < 16 && tries < 400; tries++) {
    const c = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1);
    if (c.lengthSq() > 1 || c.lengthSq() < 0.05) continue;
    c.normalize();
    if (keepOpen.some((k) => c.angleTo(k) < 0.55)) continue;
    if (c.angleTo(roadA.dir(0.6)) < 0.9) continue;
    blobs.push({ c, r: 0.22 + random() * 0.22, h: 0.9 + random() * 0.2, mtn: 0.25 + random() * 0.5 });
    placed++;
  }
}
blobs.push({ c: PLAZA, r: 0.32, h: 1.05, mtn: 0.2 });
sites.push({ c: PLAZA, r: 0.22, h: 0.32 });

const tmp = new THREE.Vector3();
function angle(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
}
function fbm(d: THREE.Vector3, freq: number, octaves: number) {
  let sum = 0, amp = 0.5, f = freq;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(d.x * f + 11, d.y * f - 3, d.z * f + 5);
    amp *= 0.5; f *= 2.03;
  }
  return sum;
}
/** How far a point is from any road, 0 on the asphalt, 1 in the clear. */
function roadClear(d: THREE.Vector3) {
  return Math.min(
    smoothstep(0.05, 0.24, Math.abs(d.dot(roadA.normal))),
    smoothstep(0.03, 0.12, Math.abs(d.dot(roadB.normal))),
  );
}

export type Sample = { h: number; land: number; mountain: number; site: number };
/** Height above R, plus the masks the colouring and scattering need. */
export function sample(direction: THREE.Vector3): Sample {
  const d = tmp.copy(direction).normalize();
  let land = 0, mtn = 0;
  for (const blob of blobs) {
    const a = angle(d, blob.c);
    if (a > blob.r) continue;
    const w = 1 - smoothstep(blob.r * 0.3, blob.r, a);
    land = Math.max(land, w * blob.h);
    mtn = Math.max(mtn, blob.mtn * (1 - smoothstep(blob.r * 0.1, blob.r * 0.85, a)));
  }
  const e = land + fbm(d, 2.4, 4) * 0.34 - 0.44;
  let h = e > 0 ? e * 0.55 : e * 1.5;
  const ridge = 1 - Math.abs(ridgeNoise(d.x * 4.3, d.y * 4.3, d.z * 4.3));
  const detail = 1 - Math.abs(ridgeNoise(d.x * 9 + 3, d.y * 9, d.z * 9));
  const mountain = Math.pow(ridge, 3) * (0.75 + detail * 0.35) * mtn * smoothstep(0.06, 0.34, e) * roadClear(d);
  h += mountain * 1.8;
  let site = 0;
  for (const s of sites) {
    const a = angle(d, s.c);
    if (a > s.r) continue;
    const w = 1 - smoothstep(s.r * 0.55, s.r, a);
    h = lerp(h, s.h, w);
    site = Math.max(site, w);
  }
  return { h, land: e, mountain: mountain * (1 - site), site };
}
export const heightAt = (d: THREE.Vector3) => sample(d).h;
/** Ground position (never below the water) for a direction. */
export function groundPoint(d: THREE.Vector3, lift = 0, target = new THREE.Vector3()) {
  const n = target.copy(d).normalize();
  return n.multiplyScalar(R + Math.max(heightAt(n), SEA) + lift);
}

/* --------------------------------------------------------------- geometry */

const C = (hex: number) => new THREE.Color(hex);
const PALETTE = {
  deep: C(0x1d3fa8), mid: C(0x2c7fe0), shallow: C(0x58d0e6), foam: C(0xd6fbff),
  sand: C(0xf6d68d), grassA: C(0x8ad64a), grassB: C(0x3fae4c), forest: C(0x2e8b47),
  dune: C(0xf0cf86), buckwheat: C(0xf5a3c7), jade: C(0x6fe0c8), emerald: C(0x1fa99a),
  rock: C(0xa592aa), rockDark: C(0x75648a), snow: C(0xfbf8ff), terrace: C(0xc8e05a),
};

export function buildPlanet() {
  const group = new THREE.Group();
  group.name = "planet";

  const source = new THREE.IcosahedronGeometry(1, 110);
  source.deleteAttribute("normal");
  source.deleteAttribute("uv");
  const geometry = mergeVertices(source);
  source.dispose();
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const waterColors = new Float32Array(pos.count * 3);
  const d = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const s = sample(d);
    const r = R + s.h;
    pos.setXYZ(i, d.x * r, d.y * r, d.z * r);
    // land
    const vary = fbm(d, 9, 2) * 0.5 + 0.5;
    const desert = smoothstep(0.34, 0.18, d.angleTo(WORLD[2].dir));
    const buckwheat = smoothstep(0.5, 0.3, d.angleTo(roadA.dir(-0.15)));
    if (s.h < SEA + 0.07) c.copy(PALETTE.sand);
    else if (desert > 0 && s.mountain < 0.2) c.copy(PALETTE.grassA).lerp(PALETTE.dune, desert);
    else {
      c.copy(PALETTE.grassA).lerp(PALETTE.grassB, THREE.MathUtils.clamp(vary * 1.2 - 0.1, 0, 1));
      if (s.h > 0.5) c.lerp(PALETTE.forest, 0.35);
      const rock = smoothstep(0.08, 0.3, s.mountain);
      c.lerp(vary > 0.5 ? PALETTE.rock : PALETTE.rockDark, rock);
      if (s.h > 1.3) c.lerp(PALETTE.snow, smoothstep(1.3, 1.55, s.h));
      // Hà Giang's buckwheat fields: pink patches between the terraces
      if (buckwheat > 0 && s.mountain < 0.1 && fbm(d, 11, 2) > 0.26) c.lerp(PALETTE.buckwheat, buckwheat * 0.7);
    }
    colors.set([c.r, c.g, c.b], i * 3);
    // water colour comes from the depth underneath it
    const depth = SEA - s.h;
    if (depth < 0.03) c.copy(PALETTE.foam);
    else if (depth < 0.2) c.copy(PALETTE.shallow).lerp(PALETTE.mid, smoothstep(0.03, 0.2, depth));
    else c.copy(PALETTE.mid).lerp(PALETTE.deep, smoothstep(0.2, 0.9, depth));
    // Hạ Long's water is emerald, not ocean blue
    const bay = smoothstep(0.42, 0.2, d.angleTo(roadA.dir(STOPS.haLong)));
    if (bay > 0 && depth >= 0.03) c.lerp(depth < 0.2 ? PALETTE.jade : PALETTE.emerald, bay * 0.85);
    waterColors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, toon(0xffffff, { vertexColors: true }));
  ground.receiveShadow = true;
  ground.castShadow = true;
  ground.name = "terrain";
  group.add(ground);

  // The water shell shares the vertex layout, so each vertex can carry the depth tint.
  const waterGeometry = new THREE.BufferGeometry();
  const wpos = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize().multiplyScalar(R + SEA);
    wpos.set([d.x, d.y, d.z], i * 3);
  }
  waterGeometry.setAttribute("position", new THREE.BufferAttribute(wpos, 3));
  waterGeometry.setAttribute("color", new THREE.BufferAttribute(waterColors, 3));
  waterGeometry.setIndex(geometry.getIndex());
  waterGeometry.computeVertexNormals();
  const water = new THREE.Mesh(waterGeometry, toon(0xffffff, { vertexColors: true }));
  water.receiveShadow = true;
  water.name = "water";
  group.add(water);

  // Pale rim of atmosphere, the halo that outlines the planet in orbit.
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.1, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xbfe6ff) }, uFade: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uFade; varying vec3 vN; varying vec3 vV;
        void main(){ float f = 1.0 - abs(dot(vN, vV)); float rim = smoothstep(0.55, 0.92, f) * (1.0 - smoothstep(0.93, 1.0, f));
          gl_FragColor = vec4(uColor * rim * 1.1 * uFade, rim * uFade); }`,
    }),
  );
  halo.name = "halo";
  group.add(halo);
  return group;
}

/** Road decks, dashes, rails and bridge piers for a ring. */
export function buildRoad(ring: Ring, deckColor = 0x34304a) {
  const N = ring.samples;
  const raw = new Float32Array(N);
  const d = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    raw[i] = R + Math.max(heightAt(ring.dir(th, d)), SEA + 0.2) + 0.04;
  }
  // Smooth the deck so it glides over bumps, then never let it sink into the hill.
  const smooth = (src: Float32Array, win: number) => {
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let k = -win; k <= win; k++) sum += src[(i + k + N) % N];
      out[i] = sum / (win * 2 + 1);
    }
    return out;
  };
  let deck = smooth(raw, 14);
  for (let i = 0; i < N; i++) deck[i] = Math.max(deck[i], raw[i]);
  deck = smooth(deck, 4);
  for (let i = 0; i < N; i++) {
    ring.radius[i] = deck[i];
    const th = (i / N) * Math.PI * 2;
    ring.bridge[i] = heightAt(ring.dir(th, d)) < SEA + 0.02 ? 1 : 0;
  }

  const group = new THREE.Group();
  const ribbon = (width: number, lift: number, keep: (i: number) => boolean) => {
    const positions: number[] = [];
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      if (!keep(i)) continue;
      const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2;
      const a0 = ring.point(t0, lift, -width / 2, p.clone()), b0 = ring.point(t0, lift, width / 2, q.clone());
      const a1 = ring.point(t1, lift, -width / 2), b1 = ring.point(t1, lift, width / 2);
      positions.push(...a0.toArray(), ...a1.toArray(), ...b0.toArray(), ...b0.toArray(), ...a1.toArray(), ...b1.toArray());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  };
  const asphalt = new THREE.Mesh(ribbon(0.34, 0, () => true), toon(deckColor, { side: THREE.DoubleSide }));
  asphalt.receiveShadow = true;
  const kerb = new THREE.Mesh(ribbon(0.42, -0.012, () => true), toon(0x16102a, { side: THREE.DoubleSide }));
  const dashes = new THREE.Mesh(ribbon(0.03, 0.004, (i) => i % 10 < 5), toon(0xffd23f, { side: THREE.DoubleSide }));
  const redDeck = new THREE.Mesh(ribbon(0.46, -0.03, (i) => ring.bridge[i] === 1), toon(0xe03a5c, { side: THREE.DoubleSide }));
  redDeck.castShadow = true;
  group.add(kerb, asphalt, dashes, redDeck);

  // Bridge rails and piers, instanced.
  const railGeo = new THREE.BoxGeometry(0.03, 0.07, 0.07);
  const pierGeo = new THREE.CylinderGeometry(0.05, 0.07, 1, 8);
  const railM: THREE.Matrix4[] = [], pierM: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), m = new THREE.Matrix4();
  for (let i = 0; i < N; i += 2) {
    if (!ring.bridge[i]) continue;
    const th = (i / N) * Math.PI * 2;
    ring.dir(th, up); ring.tangent(th, fwd); side.crossVectors(up, fwd);
    for (const s of [-0.22, 0.22]) {
      const p = ring.point(th, 0.03, s);
      m.identity().makeBasis(side, up, fwd).setPosition(p);
      railM.push(m.clone().scale(new THREE.Vector3(1, 1, 3.2)));
    }
    if (i % 26 === 0) {
      const top = ring.surface(th) - 0.03, bottom = R - 0.5;
      const p = up.clone().multiplyScalar((top + bottom) / 2);
      m.makeBasis(side, up, fwd).setPosition(p);
      pierM.push(m.clone().scale(new THREE.Vector3(1, top - bottom, 1)));
    }
  }
  const rails = new THREE.InstancedMesh(railGeo, toon(0xe03a5c), railM.length);
  railM.forEach((mm, i) => rails.setMatrixAt(i, mm));
  const piers = new THREE.InstancedMesh(pierGeo, toon(0xd9d2e6), pierM.length);
  pierM.forEach((mm, i) => piers.setMatrixAt(i, mm));
  piers.castShadow = true;
  group.add(rails, piers);
  return group;
}

/* ---------------------------------------------------------------- scatter */

/** Orients an object so +Y points out of the planet and +Z along a heading. */
export function standOn(object: THREE.Object3D, direction: THREE.Vector3, lift = 0, yaw = 0, heading?: THREE.Vector3) {
  const up = direction.clone().normalize();
  const ref = heading ? heading.clone() : Math.abs(up.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const fwd = ref.sub(up.clone().multiplyScalar(ref.dot(up))).normalize();
  const side = new THREE.Vector3().crossVectors(up, fwd);
  object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, fwd));
  if (yaw) object.rotateY(yaw);
  groundPoint(up, lift, object.position);
  return object;
}

export function scatterTrees(count = 1400) {
  const random = rng(5);
  const group = new THREE.Group();
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const pineGeo = new THREE.ConeGeometry(0.8, 2, 7);
  pineGeo.translate(0, 1.4, 0);
  crownGeo.translate(0, 1.5, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const round: THREE.Matrix4[] = [], pine: THREE.Matrix4[] = [], blossom: THREE.Matrix4[] = [], trunks: THREE.Matrix4[] = [];
  const roundColors: THREE.Color[] = [];
  const d = new THREE.Vector3(), o = new THREE.Object3D();
  const greens = [0x5cc84a, 0x3faa4a, 0x8fdc52, 0x2f9444, 0xb4e35a];
  let tries = 0;
  while (round.length + pine.length + blossom.length < count && tries++ < count * 30) {
    d.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1);
    if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
    d.normalize();
    const s = sample(d);
    if (s.h < SEA + 0.08 || s.h > 1.25 || s.site > 0.2) continue;
    // keep the landmark sets and the drum plaza clear for the camera
    if (WORLD.some((w) => angle(d, w.dir) < 0.34) || angle(d, PLAZA) < 0.3) continue;
    if (Math.abs(d.dot(roadA.normal)) < 0.06 || Math.abs(d.dot(roadB.normal)) < 0.025) continue;
    if (s.mountain > 0.25 && random() < 0.7) continue;
    const size = 0.07 + random() * 0.07;
    standOn(o, d, -0.02, random() * 6.28);
    o.scale.setScalar(size);
    o.updateMatrix();
    trunks.push(o.matrix.clone());
    const nearHome = angle(d, roadA.dir(0)) < 0.45;
    if (s.h > 0.55 || s.mountain > 0.12) pine.push(o.matrix.clone());
    else if (random() < (nearHome ? 0.3 : 0.07)) blossom.push(o.matrix.clone());
    else {
      round.push(o.matrix.clone());
      roundColors.push(new THREE.Color(greens[Math.floor(random() * greens.length)]));
    }
  }
  const sets: { mesh: THREE.InstancedMesh; mats: THREE.Matrix4[]; at: THREE.Vector3[]; hidden: Uint8Array }[] = [];
  const make = (geo: THREE.BufferGeometry, mats: THREE.Matrix4[], color: number, colors?: THREE.Color[], ink = 0) => {
    const mesh = new THREE.InstancedMesh(geo, toon(color), mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    colors?.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (ink) outline(mesh, ink);
    sets.push({ mesh, mats, at: mats.map((m) => new THREE.Vector3().setFromMatrixPosition(m)), hidden: new Uint8Array(mats.length) });
    return mesh;
  };
  group.add(
    make(trunkGeo, trunks, 0x7a4b3a),
    make(crownGeo, round, 0xffffff, roundColors, 0.09),
    make(pineGeo, pine, 0x2d8a4e, undefined, 0.09),
    make(crownGeo, blossom, 0xff9ec7, undefined, 0.09),
  );
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  /** Trees the camera is about to fly into shrink away instead of filling the frame. */
  const update = (camera: THREE.Vector3) => {
    for (const set of sets) {
      let dirty = false;
      for (let i = 0; i < set.at.length; i++) {
        const near = set.at[i].distanceToSquared(camera) < 0.36 ? 1 : 0;
        if (near === set.hidden[i]) continue;
        set.hidden[i] = near;
        set.mesh.setMatrixAt(i, near ? zero : set.mats[i]);
        dirty = true;
      }
      if (dirty) set.mesh.instanceMatrix.needsUpdate = true;
    }
  };
  return { group, update };
}
