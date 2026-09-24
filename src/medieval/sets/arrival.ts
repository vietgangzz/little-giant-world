import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW, LITTLE_GIANT } from "../../crew";
import { easeOutBack } from "../../noise";
import { additive, canvasTexture, ease, glide, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";
import { castle, cobbleTex, cottage, flicker, grassTex, ground, hayCart, stall, tree, well } from "../props";
import { PEASANT, villager } from "../wardrobe";

const CAST = [LITTLE_GIANT, ...CREW];

/**
 * The time portal: a tunnel of bronze drum rings and Roman numerals, the
 * year spinning back from 2026 to 1326, the whole crew tumbling through.
 */
export function portal(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x160c2a);
  scene.fog = new THREE.Fog(0x160c2a, 10, 60);
  lights(scene, { sky: 0xc9b8ff, ground: 0x3a2060, fill: 1.4, key: 0xffe6b0, keyI: 1.6, from: V(4, 6, 8), span: 10 });
  const rings = Array.from({ length: 16 }, (_, i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(5, 0.35, 10, 48), new THREE.MeshToonMaterial({ color: i % 2 ? 0xc9a24a : 0x7b5cd6, emissive: i % 2 ? 0x5a3a10 : 0x2a1a5a }));
    r.position.z = -i * 5;
    scene.add(r);
    return r;
  });
  // Roman numerals drifting past, like a clock face coming apart
  const numerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].map((n, i) => {
    const tex = canvasTexture(128, 64, (ctx, W, H) => {
      ctx.fillStyle = "#f3d98a"; ctx.font = "700 48px Cinzel, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n, W / 2, H / 2 + 2);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    const a = (i / 12) * Math.PI * 2;
    m.position.set(Math.cos(a) * 3.6, Math.sin(a) * 3.6, -8 - i * 3.5);
    scene.add(m);
    return m;
  });
  const swirl = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 90, 32, 1, true), additive(0x9f7aff, 0.08));
  swirl.rotation.x = Math.PI / 2;
  swirl.position.z = -40;
  scene.add(swirl);
  const rand = seeded(3);
  const cast = CAST.map((m, i) => {
    const d = dressed(m, { hat: false, kit: m.kit !== "director" });
    d.root.scale.setScalar(0.7);
    scene.add(d.root);
    return { d, x: (rand() - 0.5) * 5, y: (rand() - 0.5) * 4, z0: -20 - i * 3.2, spin: V(rand() * 3, rand() * 3, rand() * 3) };
  });
  const cues: FilmSet["cues"] = [
    [2.3, { kind: "sfx", name: "portal", volume: 0.9 }],
    [2.6, { kind: "pop", text: "2026", at: V(-2, 2.2, -12) }],
    [3.5, { kind: "pop", text: "1626…", at: V(2, 1.4, -12) }],
    [4.3, { kind: "pop", text: "1326!", at: V(0, 1.6, -10), big: true }],
    [4.3, { kind: "sfx", name: "braam", volume: 0.5 }],
  ];
  function update(u: number): Frame {
    const fly = u * 9;
    rings.forEach((r, i) => { r.position.z = ((((-i * 5 + fly) % 80) + 80) % 80) - 74; r.rotation.z = u * (i % 2 ? 0.6 : -0.4); });
    numerals.forEach((n, i) => { n.position.z = -8 - i * 3.5 + fly * 1.4; n.rotation.z = u * 0.8 + i; n.lookAt(0, 0, 20); });
    cast.forEach((c, i) => {
      c.d.update(u + i);
      c.d.root.position.set(c.x + Math.sin(u * 2 + i) * 0.6, c.y + Math.cos(u * 1.7 + i) * 0.5, c.z0 + u * 11);
      c.d.root.rotation.set(u * c.spin.x, u * c.spin.y, u * c.spin.z);
      c.d.cheering = 1;
    });
    const s = shot(V(Math.sin(u) * 0.5, Math.cos(u * 0.8) * 0.4, 8), V(0, 0, -20), 60, u * 0.25);
    return { shot: s, imax: 1, grade: { sat: 1.15, contrast: 1.1, vignette: 0.8, gain: new THREE.Color(1.05, 0.95, 1.1) } };
  }
  return { scene, update, cues };
}

/** The village square: castle on the hill, and ten mascots falling into a hay cart. */
export function arrival(): FilmSet {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe0e8, 40, 140);
  scene.add(skyDome(0x6fa8dc, 0xbfd6c0, 0xf2e6c8));
  lights(scene, { sky: 0xfff4e0, ground: 0x6f8a4a, fill: 1.4, key: 0xfff0d0, keyI: 2.3, from: V(-10, 14, 8), span: 16 });
  scene.add(ground(grassTex(), 300));
  const square = new THREE.Mesh(new THREE.CircleGeometry(12, 40), new THREE.MeshToonMaterial({ map: cobbleTex([6, 6]) }));
  square.rotation.x = -Math.PI / 2;
  square.position.y = 0.02;
  square.receiveShadow = true;
  scene.add(square);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ map: grassTex([12, 12]), color: 0xe6f0d0 }));
  hill.scale.y = 0.35;
  hill.position.set(4, -1, -52);
  scene.add(hill);
  const keep = castle();
  keep.position.set(4, 9, -52);
  keep.scale.setScalar(1.3);
  scene.add(keep);
  const colors = [0xe8dcc0, 0xf2e2c4, 0xdcc9a6, 0xefe0c9];
  [[-10, -6, 0.4], [-13, 2, 1.2], [11, -5, -0.5], [13, 3, -1.3], [-6, -12, 0.1], [7, -13, -0.2], [-16, -12, 0.8], [17, -10, -0.8]].forEach(([x, z, r], i) => {
    const c = cottage(colors[i % 4], i + 1);
    c.position.set(x, 0, z);
    c.rotation.y = r;
    scene.add(c);
  });
  const w = well();
  w.position.set(-5, 0, 2);
  scene.add(w);
  [[5, 5, 0xc0262d, -0.6], [-4.5, -4, 0x2b3f8f, 0.4]].forEach(([x, z, c, r]) => { const s = stall(c); s.position.set(x, 0, z); s.rotation.y = r; scene.add(s); });
  const rand = seeded(8);
  for (let i = 0; i < 14; i++) { const t = tree(i + 3, 1.2 + rand() * 0.6); const a = rand() * Math.PI * 2; t.position.set(Math.sin(a) * (20 + rand() * 12), 0, Math.cos(a) * (20 + rand() * 12) - 8); scene.add(t); }
  const cart = hayCart();
  cart.position.set(0.5, 0, 1);
  cart.rotation.y = -0.15;
  scene.add(cart);
  const cast = CAST.map((m, i) => {
    const d = dressed(m, { hat: false, kit: m.kit !== "director" });
    d.root.scale.setScalar(0.6);
    scene.add(d.root);
    return { d, x: -1.1 + (i % 5) * 0.55, z: 0.6 + Math.floor(i / 5) * 0.8, t: 0.6 + i * 0.22 };
  });
  const locals = PEASANT.slice(0, 6).map((c, i) => {
    const v = villager(c, i);
    v.root.scale.setScalar(0.85);
    const a = -0.9 + i * 0.36;
    v.root.position.set(Math.sin(a) * 6.2, 0, 1 - Math.cos(a) * 4.2);
    v.root.lookAt(0.5, 0, 1);
    scene.add(v.root);
    return v;
  });
  const dust = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), additive(0xf2dfa0, 0));
  scene.add(dust);

  const cues: FilmSet["cues"] = [
    [0.1, { kind: "sfx", name: "bell", volume: 0.7 }],
    ...cast.map((c, i): [number, FilmSet["cues"][number][1]] => [c.t + 0.45, { kind: "sfx", name: "plop", volume: 0.6, rate: 0.9 + (i % 4) * 0.08 }]),
    [3.0, { kind: "pop", text: "PLOP!", at: V(0.5, 3.5, 1), big: true }],
    [3.9, { kind: "sfx", name: "crowd", volume: 0.6 }],
    [4.0, { kind: "pop", text: "Huh?!", at: V(-5, 3, 3) }],
  ];

  function update(u: number): Frame {
    flicker(scene, u);
    cast.forEach((c, i) => {
      c.d.update(u + i);
      const k = seg(u, c.t, c.t + 0.45);
      const land = V(0.5 + c.x, 1.9, 1 + c.z - 0.7);
      if (i === 0 && u > 3.2) {
        // Little Giant climbs out and hops down onto the cobbles
        const h = seg(u, 3.2, 3.8);
        c.d.root.position.copy(land).lerp(V(0.2, 0, 3.6), h);
        c.d.root.position.y += Math.sin(h * Math.PI) * 1.2;
        c.d.root.rotation.y = Math.sin(u * 3) * 0.5;
        c.d.root.scale.setScalar(0.6 + h * 0.2);
      } else {
        c.d.root.position.copy(glide(u, c.t, c.t + 0.45, V(land.x, 18, land.z), land, (x) => x * x));
        const peek = easeOutBack(seg(u, c.t + 0.5, c.t + 0.9));
        c.d.root.position.y -= (1 - peek) * 0.6;
        c.d.root.rotation.set(k < 1 ? u * 6 : 0, (i - 5) * 0.12, 0);
      }
      c.d.cheering = u > 3.9 ? 0.6 : 0;
    });
    locals.forEach((v, i) => { v.update(u + i); v.rig.position.y = u > 3.9 && u < 4.4 ? 0.3 : 0; });
    const k = seg(u, 0.5, 3.0);
    dust.position.set(0.5, 1.8, 1);
    dust.scale.setScalar(1 + k * 2.5);
    (dust.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.sin(k * Math.PI)) * 0.25;
    // crane down from the castle on the hill to the hay cart
    const s = move(u, 0, 3.0, shot(V(2, 14, 16), V(4, 14, -52), 40), shot(V(3.5, 3.2, 10.5), V(0.4, 1.6, 0.5), 38), (x) => ease(x));
    if (u > 3.0) s.pos.lerp(V(2.6, 2.6, 9), seg(u, 3.0, 5));
    return { shot: s, imax: seg(u, 0, 0.1) * (1 - seg(u, 2.2, 3.0)), grade: { sat: 1.08, contrast: 1.05, vignette: 0.5, gain: new THREE.Color(1.06, 1.0, 0.92) } };
  }
  return { scene, update, cues };
}

