import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { extra, wearBrodie } from "../../film/costumes";
import { ball, box, canvasTexture, cyl, ease, lights, move, seeded, seg, shot, skyDome, V, windows, type FilmSet, type Frame, flock, motes } from "../../film/kit";

/**
 * DUNKIRK — the opening: an empty town, leaflets drifting down, a handful of
 * soldiers running for the beach. Shots ring out and, one by one, they fall.
 * Only David makes it over the sandbags.
 */
function house(seed: number, color: string) {
  const g = new THREE.Group();
  const r = seeded(seed + 1);
  const h = 7 + r() * 3, w = 4.4;
  const tex = windows(color, "#3a3f46", "#5a5f66", 3, 3, seed + 1, 0.1);
  g.add(box(w, h, 5, new THREE.MeshToonMaterial({ map: tex }), 0.04));
  const roofGeo = new THREE.CylinderGeometry(0.1, 3.4, 2.4, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(1, 1, 1.3);
  const roof = inked(roofGeo, toon(0x5a4a44), 0.03);
  roof.position.y = h + 1.2;
  const chimney = box(0.6, 1.6, 0.6, 0x7a4a3a, 0.02);
  chimney.position.set(1.2, h + 1, 0.6);
  // shutters, some hanging off their hinges
  for (let i = 0; i < 3; i++) {
    const sh = box(0.5, 1.1, 0.08, [0x4a6a5a, 0x6a4a3a, 0x4a5a7a][seed % 3], 0.01);
    sh.position.set(-1.6 + i * 1.5, h * 0.55, 2.55);
    sh.rotation.z = r() < 0.3 ? 0.4 : 0;
    g.add(sh);
  }
  g.add(roof, chimney);
  return g;
}

export function dunkirk(): FilmSet {
  const david = CREW.find((c) => c.handle === "huytdps13400")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb4bab4, 25, 90);
  scene.add(skyDome(0x9aa6a4, 0xaab2ac, 0xd4d6cc));
  lights(scene, { sky: 0xe6eae0, ground: 0x6a665a, fill: 1.4, key: 0xf2eee0, keyI: 1.5, from: V(-8, 14, 6), span: 18, focus: V(0, 0, -10) });

  // cobbled street between terraces of brick and plaster houses
  const cobble = new THREE.Mesh(new THREE.PlaneGeometry(10, 120), new THREE.MeshToonMaterial({
    map: canvasTexture(128, 128, (ctx, W, H) => {
      ctx.fillStyle = "#5e5a52"; ctx.fillRect(0, 0, W, H);
      const r = seeded(2);
      for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) { ctx.fillStyle = `hsl(35, 6%, ${38 + r() * 12}%)`; ctx.fillRect(x + 1, y + 1, 10, 10); }
    }, [4, 48]),
  }));
  cobble.rotation.x = -Math.PI / 2;
  cobble.receiveShadow = true;
  scene.add(cobble);
  [-1, 1].forEach((side) => {
    const walk = box(3, 0.25, 120, 0x8a857a, 0.02);
    walk.position.set(side * 6.5, 0, 0);
    scene.add(walk);
    for (let i = 0; i < 12; i++) {
      const hs = house(i * 3 + (side > 0 ? 1 : 0), ["#a4543e", "#c8b89a", "#9a6a4a", "#d8ccb4"][(i + (side > 0 ? 1 : 0)) % 4]);
      hs.position.set(side * 10.6, 0, 20 - i * 5);
      hs.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(hs);
    }
  });
  // debris of a town already fought over: crates, a fallen bicycle, lamp posts
  const rand = seeded(17);
  for (let i = 0; i < 8; i++) {
    const crate = box(0.8, 0.7, 0.8, 0x8a6a4a, 0.02);
    crate.position.set((rand() < 0.5 ? -1 : 1) * (4 + rand() * 1.2), 0.25, -30 + rand() * 40);
    crate.rotation.y = rand();
    scene.add(crate);
  }
  const bike = new THREE.Group();
  [-0.55, 0.55].forEach((z) => { const w = inked(new THREE.TorusGeometry(0.35, 0.04, 6, 18), toon(0x1c1a1c), 0.008); w.position.set(0, 0.36, z); w.rotation.y = Math.PI / 2; bike.add(w); });
  const frame = box(0.06, 0.06, 1.1, 0x3a4a3a, 0.006);
  frame.position.y = 0.6;
  bike.add(frame);
  bike.position.set(-4.3, 0.05, -14);
  bike.rotation.set(0, 0.3, Math.PI / 2 - 0.1);
  scene.add(bike);
  for (let z = -40; z < 12; z += 10) { const post = cyl(0.08, 0.06, 4.6, 0x2b2b2b, 8, 0.012); post.position.set(4.9, 0.25, z); scene.add(post); }

  // the French sandbag barricade the survivor has to reach
  const barricade = new THREE.Group();
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const bag = ball(0.42, 0xb8a67e, 0.02, 10);
    bag.scale.set(1.3, 0.55, 0.8);
    bag.position.set(-3.6 + i * 0.9 + (row % 2) * 0.45, 0.25 + row * 0.42, 0);
    barricade.add(bag);
  }
  barricade.position.set(0, 0, -4);
  scene.add(barricade);
  const poilu = extra(0x8a96a8);
  wearBrodie(poilu, 0x5a6a8a);
  poilu.root.scale.setScalar(0.8);
  poilu.root.position.set(2.3, 0, -3);
  poilu.root.rotation.y = Math.PI;
  scene.add(poilu.root);
  const rifle = box(0.08, 0.08, 1.4, 0x5a3a22, 0.008);
  rifle.position.set(0, 0, 0.5);
  poilu.rightHand.add(rifle);

  // leaflets drifting down: "WE SURROUND YOU"
  const leafTex = canvasTexture(64, 88, (ctx, W) => {
    ctx.fillStyle = "#efe6cc"; ctx.fillRect(0, 0, W, 88);
    ctx.fillStyle = "#2b2b2b"; ctx.font = "700 11px Oswald, sans-serif"; ctx.textAlign = "center";
    ["WE", "SURROUND", "YOU"].forEach((w, i) => ctx.fillText(w, W / 2, 26 + i * 16));
    ctx.fillRect(10, 70, 44, 3);
  });
  const leaflets = Array.from({ length: 40 }, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshBasicMaterial({ map: leafTex, side: THREE.DoubleSide }));
    scene.add(m);
    return { m, x: (rand() - 0.5) * 12, z: -34 + rand() * 40, h: 4 + rand() * 12, ph: rand() * 10 };
  });

  // the squad, running at us. Everyone but David goes down.
  const runners = Array.from({ length: 5 }, (_, i) => {
    const m = extra([0x8c9577, 0x7f8a6d, 0x96917a, 0x8a8f7e, 0x8c9577][i]);
    const helmet = wearBrodie(m);
    m.root.scale.setScalar(0.75);
    scene.add(m.root);
    return { m, helmet, x: [-2.4, 1.8, -0.9, 2.6, -2.9][i], z0: -27 - i * 1.3, falls: [0.9, 1.5, 2.05, 2.55, 3.0][i], speed: 5.2 - i * 0.1 };
  });
  const hero = dressed(david);
  hero.root.scale.setScalar(0.8);
  wearBrodie(hero, 0x6b7545);
  scene.add(hero.root);

  const cues: FilmSet["cues"] = [
    [0.1, { kind: "sfx", name: "run", volume: 0.8 }],
    ...runners.flatMap((r): [number, FilmSet["cues"][number][1]][] => [
      [r.falls - 0.05, { kind: "sfx", name: "gunshot", volume: 0.9 }],
      [r.falls + 0.35, { kind: "sfx", name: "fall", volume: 0.7 }],
    ]),
    [1.0, { kind: "sfx", name: "run", volume: 0.8 }],
    [2.0, { kind: "sfx", name: "tick", volume: 0.9, rate: 1.2 }],
    [3.4, { kind: "sfx", name: "whoosh", volume: 0.8 }],
    [3.9, { kind: "sfx", name: "land", volume: 0.9 }],
    [4.0, { kind: "pop", text: "MADE IT!", at: V(0.6, 3.2, -1.5), big: true }],
  ];

  const air0 = motes(scene, { count: 200, color: 0xd0ccc4, size: 0.06, center: V(0, 5, -12), spread: V(12, 10, 40), rise: -0.4, opacity: 0.5 });
  const air1 = flock(scene, 7, V(-12, 18, -40), V(1, 0, 0.2));
  function update(u: number): Frame {
    air0(u);
    air1(u);
    hero.update(u);
    poilu.update(u);
    leaflets.forEach((l, i) => {
      const y = l.h - ((u * 0.9 + l.ph) % 14);
      l.m.position.set(l.x + Math.sin(u * 1.4 + i) * 0.6, Math.max(0.03, y), l.z);
      l.m.rotation.set(y > 0.05 ? u * 2 + i : -Math.PI / 2, u * 1.3 + i, y > 0.05 ? Math.sin(u * 3 + i) : 0);
    });
    // runners: sprint, get hit, pitch forward onto their faces and lie still
    runners.forEach((r, i) => {
      r.m.update(u + i);
      const t = Math.min(u, r.falls);
      const z = r.z0 + t * r.speed;
      const hit = seg(u, r.falls, r.falls + 0.4);
      r.m.root.position.set(r.x + Math.sin(t * 9 + i) * 0.08, hit > 0 ? 0 : Math.abs(Math.sin(u * 11 + i)) * 0.25, z + hit * 0.9);
      r.m.root.rotation.set(ease(hit) * Math.PI * 0.47, (i % 2 ? 0.08 : -0.08) * (1 - hit), 0);
      r.m.rig.rotation.x = hit > 0 ? 0 : 0.2;
      r.m.leftHand.position.y = hit > 0 ? 0.3 : 0.8 + Math.sin(u * 11 + i) * 0.25;
      r.m.rightHand.position.y = hit > 0 ? 0.3 : 0.8 - Math.sin(u * 11 + i) * 0.25;
      // the helmet comes off and rolls away
      const roll = seg(u, r.falls + 0.15, r.falls + 0.9);
      r.helmet.position.set(0.12 + roll * 0.8, 2.0 - roll * 0.5, roll * 1.6);
      r.helmet.rotation.x = roll * 4;
    });
    // David: flat out down the middle, then over the sandbags
    const z = -24 + Math.min(u, 3.35) * 5.1;
    const vault = seg(u, 3.35, 3.9);
    hero.root.position.set(0.3 + Math.sin(u * 9) * 0.1, Math.abs(Math.sin(u * 11)) * 0.28 * (1 - vault) + Math.sin(vault * Math.PI) * 1.6, z + vault * 3.2);
    hero.root.rotation.set(vault > 0 && vault < 1 ? -Math.sin(vault * Math.PI) * 0.4 : 0.15, 0, 0);
    if (u > 3.9) { hero.root.position.set(0.3, 0, -0.5 + seg(u, 3.9, 5) * 0.8); hero.root.rotation.set(0, 0.2, 0); }
    hero.cheering = u > 4.0 ? 0.6 : 0;

    let s;
    if (u < 3.2) {
      // backing down the street just ahead of him, low, as the others drop around him
      s = shot(V(2.2, 3.0, z + 8.5), V(0, 0.9, z - 5), 42);
    } else {
      // from behind the barricade as he comes over it
      s = move(u, 3.2, 5, shot(V(-1.4, 1.5, 2.5), V(0.2, 1.4, -8), 42), shot(V(-1.8, 1.7, 3.4), V(0.2, 1.3, -6), 42));
    }
    const shakeAmt = runners.some((r) => Math.abs(u - r.falls) < 0.08) ? 0.12 : 0.02;
    return { shot: s, shake: shakeAmt, grade: { sat: 0.58, contrast: 1.14, vignette: 0.65, lift: new THREE.Color(0.02, 0.03, 0.03), gain: new THREE.Color(1.02, 1.0, 0.94) } };
  }
  return { scene, update, cues };
}
