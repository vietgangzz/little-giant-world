import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { goggles } from "../costumes";
import { additive, ball, box, cyl, ease, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../kit";

/**
 * OPPENHEIMER — Trinity, played as a stage show. Mad Dinh counts it down on
 * his mic with his back to the tower, snaps his goggles on, and the desert
 * goes white. Then silence, the fireball, and the sound arriving late.
 */
export function oppenheimer(): FilmSet {
  const mad = CREW.find((c) => c.handle === "dennytosp")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2a2438, 40, 160);
  const sky = skyDome(0x121a3a, 0x2a2030, 0xd9794a);
  scene.add(sky);
  const { hemi, key } = lights(scene, { sky: 0x8a90c0, ground: 0x4a3020, fill: 0.9, key: 0xffc890, keyI: 1.4, from: V(-10, 8, 10), span: 12 });
  const skyU = (sky.material as THREE.ShaderMaterial).uniforms;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), toon(0xb98a5c));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const rand = seeded(6);
  for (let i = 0; i < 70; i++) {
    const b = ball(0.25 + rand() * 0.35, toon(0x7d7a4a), 0.02, 8);
    b.scale.y = 0.6;
    const a = rand() * Math.PI * 2, r = 4 + rand() * 60;
    b.position.set(Math.sin(a) * r, 0.1, Math.cos(a) * r - 10);
    scene.add(b);
  }
  // mesas on the horizon
  for (let i = 0; i < 7; i++) {
    const w = 18 + rand() * 30, h = 6 + rand() * 8;
    const mesa = inked(new THREE.CylinderGeometry(w * 0.4, w * 0.5, h, 7), toon(0x8a5a44), 0.1);
    mesa.position.set(-120 + i * 42 + rand() * 10, h / 2, -130 - rand() * 20);
    scene.add(mesa);
  }
  // stars
  const starGeo = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let i = 0; i < 500; i++) { const a = rand() * Math.PI * 2, e = 0.1 + rand() * 1.2; pts.push(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300); }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff6e0, size: 1.4, sizeAttenuation: false, transparent: true, fog: false }));
  scene.add(stars);

  // the tower: four legs, cross-braces, a shed and the gadget
  const tower = new THREE.Group();
  const steel = 0x3a3a44;
  const H = 18;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = box(0.25, H, 0.25, steel, 0.02);
    leg.position.set(x * 2.4, 0, z * 2.4);
    leg.rotation.set(z * -0.07, 0, x * 0.07);
    tower.add(leg);
  });
  for (let y = 3; y < H; y += 3) {
    const w = 4.6 - (y / H) * 2.2;
    [[0, w / 2], [0, -w / 2], [w / 2, 0], [-w / 2, 0]].forEach(([x, z], i) => {
      const brace = box(i < 2 ? w : 0.14, 0.14, i < 2 ? 0.14 : w, steel, 0.01);
      brace.position.set(x, y, z);
      tower.add(brace);
    });
  }
  const shed = box(2.8, 1.8, 2.8, 0x7a6a58, 0.03);
  shed.position.y = H;
  const gadget = ball(0.9, toon(0x4a4f5a), 0.03);
  gadget.position.y = H + 0.9;
  tower.add(shed, gadget);
  tower.position.set(-4, 0, -44);
  scene.add(tower);

  // the bunker Mad Dinh MCs from
  const bunker = box(6, 2.2, 3, 0x9a948a, 0.04);
  bunker.position.set(-2.5, 0, 0.5);
  const slit = box(3.5, 0.3, 0.1, 0x16161a, 0);
  slit.position.set(-2.5, 1.4, 2.02);
  scene.add(bunker, slit);
  const lamp = cyl(0.08, 0.08, 1.6, 0x3a3a44, 8, 0.015);
  lamp.position.set(0.2, 2.2, 1.7);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
  bulb.position.set(0.2, 3.9, 1.7);
  scene.add(lamp, bulb);

  const hero = dressed(mad);
  hero.root.scale.setScalar(1);
  hero.root.position.set(1.6, 0, 2.6);
  scene.add(hero.root);
  const glasses = goggles(hero);
  const cap = hero.parts.cap;
  const capHome = cap.position.clone();

  // the fireball: nested glowing shells, a stem and a cap, and a ring of dust
  const blast = new THREE.Group();
  const shells = [[0xffffff, 1.0], [0xfff1a0, 1.25], [0xffb347, 1.55], [0xe8542a, 1.85]].map(([c, r]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r as number, 3), new THREE.MeshBasicMaterial({ color: c as number, transparent: true, opacity: 0.95 }));
    blast.add(m);
    return m;
  });
  shells.forEach((m, i) => (m.renderOrder = 10 - i));
  // an ink rim and a smoky dark skirt, so the fireball reads as a drawn shape, not a disc
  const rimInk = new THREE.Mesh(new THREE.IcosahedronGeometry(1.95, 3), new THREE.MeshBasicMaterial({ color: 0x3a1410, side: THREE.BackSide }));
  blast.add(rimInk);
  const billows = Array.from({ length: 9 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd9582c : 0xb8401f }));
    blast.add(b);
    return b;
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 1, 16), new THREE.MeshBasicMaterial({ color: 0xc8502a }));
  const mushroom = new THREE.Mesh(new THREE.TorusGeometry(2.2, 1.1, 12, 24), new THREE.MeshBasicMaterial({ color: 0xe36a32 }));
  mushroom.rotation.x = Math.PI / 2;
  blast.add(stem, mushroom);
  blast.position.set(-4, 0, -44);
  scene.add(blast);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), additive(0xffd9a0, 0.6));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(-4, 0.3, -44);
  scene.add(ring);
  const fire = new THREE.PointLight(0xffa050, 0, 400, 0.9);
  fire.position.set(-4, 14, -40);
  scene.add(fire);

  const cues: FilmSet["cues"] = [
    [0.4, { kind: "pop", text: "3…", at: V(2.6, 3.2, 2.8), big: true }],
    [0.4, { kind: "sfx", name: "mic", volume: 0.8 }],
    [1.0, { kind: "pop", text: "2…", at: V(2.6, 3.3, 2.8), big: true }],
    [1.0, { kind: "sfx", name: "mic", volume: 0.8 }],
    [1.6, { kind: "pop", text: "1…", at: V(2.6, 3.4, 2.8), big: true }],
    [1.6, { kind: "sfx", name: "mic", volume: 0.8 }],
    [1.85, { kind: "sfx", name: "goggles", volume: 0.7 }],
    [2.2, { kind: "duck", volume: 0, seconds: 0.04 }],
    [3.55, { kind: "sfx", name: "boom", volume: 1 }],
    [3.6, { kind: "duck", volume: 1, seconds: 0.6 }],
    [3.7, { kind: "pop", text: "KA-BOOM!", at: V(-4, 22, -40), big: true }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    const lit = seg(u, 2.2, 2.35);
    // countdown to us, goggles on, then he turns round to watch
    hero.cheering = u < 2.1 ? 0.5 + Math.sin(u * 10) * 0.1 : 0;
    hero.root.rotation.y = u < 2.4 ? 0.35 : 0.35 + ease(seg(u, 2.4, 3.0)) * 2.4;
    glasses.visible = u > 1.85;
    // the blast wave reaches him and takes his cap
    const gust = seg(u, 3.6, 4.4);
    cap.position.copy(capHome).add(V(gust * 1.5, gust * 2.4 - gust * gust * 1.2, gust * 1.5));
    cap.rotation.set(gust * 4, 0, gust * 5);
    hero.rig.rotation.x = Math.sin(seg(u, 3.6, 4.0) * Math.PI) * 0.25;

    // fireball growth
    const g = seg(u, 2.2, 5);
    const grow = 1 - Math.pow(1 - g, 3);
    blast.visible = u > 2.2;
    shells.forEach((m, i) => {
      m.scale.setScalar(2 + grow * (7 + i * 0.6));
      m.position.y = 4 + grow * 11;
      (m.material as THREE.MeshBasicMaterial).opacity = i === 0 ? 1 - grow * 0.4 : 0.9;
    });
    rimInk.scale.copy(shells[3].scale);
    rimInk.position.copy(shells[3].position);
    billows.forEach((b, i) => {
      const a = (i / billows.length) * Math.PI * 2 + u * 0.3;
      const r = (2 + grow * 8) * 1.7;
      b.position.set(Math.cos(a) * r, 4 + grow * 11 + Math.sin(a * 2) * r * 0.25 - r * 0.35, Math.sin(a) * r * 0.5);
      b.scale.setScalar(1.5 + grow * 6);
    });
    stem.scale.set(1 + grow * 2, grow * 12, 1 + grow * 2);
    stem.position.y = grow * 6;
    mushroom.scale.setScalar(0.5 + grow * 3.2);
    mushroom.position.y = 4 + grow * 16;
    ring.scale.setScalar(1 + g * 70);
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - g);
    fire.intensity = u > 2.2 ? 700 * (1 - g * 0.5) : 0;
    hemi.intensity = 0.9 + lit * 1.2;
    hemi.color.set(0x8a90c0).lerp(new THREE.Color(0xffb070), lit);
    key.color.set(0xffc890).lerp(new THREE.Color(0xffa050), lit);
    (skyU.uHorizon.value as THREE.Color).set(0xd9794a).lerp(new THREE.Color(0xffc070), lit);
    (skyU.uTop.value as THREE.Color).set(0x121a3a).lerp(new THREE.Color(0x6a3a3a), lit);
    (stars.material as THREE.PointsMaterial).opacity = 1 - lit;
    (bulb.material as THREE.MeshBasicMaterial).color.set(Math.floor(u * 4) % 2 ? 0xff3a2a : 0x551010);

    let s;
    if (u < 2.2) {
      // the MC shot: Mad Dinh big in the foreground, the tower tiny behind him
      s = move(u, 0, 2.2, shot(V(5.6, 2.2, 11.5), V(0.2, 2.2, -12), 34), shot(V(5.0, 2.2, 10.2), V(0.4, 2.3, -12), 32));
    } else {
      // IMAX wide: the fireball fills the sky behind his silhouette
      s = move(u, 2.2, 5, shot(V(4.4, 1.0, 9.6), V(-1.5, 8, -40), 44), shot(V(5.2, 1.2, 11.2), V(-1.8, 12, -40), 50));
    }
    const flash = u < 2.2 ? 0 : Math.max(0, 1 - (u - 2.2) / 0.9);
    const shake = seg(u, 3.55, 3.7) * (1 - seg(u, 3.7, 4.6)) * 0.35;
    return {
      shot: s, imax: seg(u, 2.2, 2.6), shake,
      grade: { flash, sat: 1.0, contrast: 1.15, vignette: 0.6, gain: new THREE.Color(1.1, 0.98, 0.86), lift: new THREE.Color(0.03, 0.01, 0.0) },
    };
  }
  return { scene, update, cues };
}
