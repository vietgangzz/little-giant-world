import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { Mascot } from "../../mascot";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { topHat } from "../costumes";
import { additive, ball, box, canvasTexture, cyl, lights, move, seg, seeded, shot, V, type FilmSet, type Frame } from "../kit";

/**
 * THE PRESTIGE — "The Transported Man", Khoa edition. A Victorian stage, a
 * Tesla coil, a top hat. Khoa steps into the lightning, reappears across the
 * stage, and where there were two babies there are now eight.
 */
export function prestige(): FilmSet {
  const khoa = CREW.find((c) => c.handle === "khoatranthanh")!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120c0e);
  scene.fog = new THREE.Fog(0x120c0e, 16, 30);
  const { key } = lights(scene, { sky: 0xffe6c2, ground: 0x3a2020, fill: 0.7, key: 0xffe2b0, keyI: 2.0, from: V(0, 10, 9), span: 9 });
  key.position.set(0, 10, 9);

  // stage floor boards
  const boards = canvasTexture(256, 256, (ctx, W) => {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#7a4b2c" : "#86552f"; ctx.fillRect(0, i * 32, W, 32); ctx.fillStyle = "#5a361f"; ctx.fillRect(0, i * 32 + 30, W, 2); }
  }, [3, 2]);
  const stage = box(16, 1.0, 7, new THREE.MeshToonMaterial({ map: boards }), 0.03);
  stage.position.set(0, -1.0, -1);
  scene.add(stage);
  const apron = box(16, 1.0, 0.1, 0x3a1e16, 0.02);
  apron.position.set(0, -1.0, 2.55);
  scene.add(apron);
  // footlights along the lip
  for (let i = 0; i < 9; i++) {
    const f = ball(0.13, new THREE.MeshBasicMaterial({ color: 0xffe3a0 }), 0.01, 10);
    f.scale.y = 0.6;
    f.position.set(-6 + i * 1.5, 0.02, 2.3);
    scene.add(f);
  }

  // proscenium arch and red curtains
  const gold = 0xc99a3c;
  const pillars = [-6.6, 6.6].map((x) => { const p = box(0.7, 7.5, 0.7, gold); p.position.set(x, -0.1, -0.6); scene.add(p); return p; });
  const lintel = box(14, 1.1, 0.7, gold);
  lintel.position.set(0, 6.3, -0.6);
  scene.add(lintel);
  void pillars;
  const velvet = toon(0x9e1b2c);
  const folds = (x0: number, n: number, dir: number) => {
    for (let i = 0; i < n; i++) {
      const f = inked(new THREE.CylinderGeometry(0.28, 0.34, 6.4, 10), velvet, 0.02);
      f.position.set(x0 + dir * i * 0.42, 3.1, -0.9 - (i % 2) * 0.1);
      scene.add(f);
    }
  };
  folds(-6.1, 5, 1);
  folds(6.1, 5, -1);
  const valance = inked(new THREE.BoxGeometry(12.6, 0.9, 0.3), velvet, 0.02);
  valance.position.set(0, 5.6, -0.8);
  scene.add(valance);
  // backdrop: a painted night sky with stars
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({
    map: canvasTexture(512, 300, (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1b1638"); g.addColorStop(1, "#3a2244");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = seeded(4);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,236,200,${0.3 + r() * 0.7})`; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.8, r() * 2 + 0.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#f6e7b8"; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.22, 26, 0, 7); ctx.fill();
      ctx.fillStyle = "#1b1638"; ctx.beginPath(); ctx.arc(W * 0.76, H * 0.2, 24, 0, 7); ctx.fill();
    }),
  }));
  backdrop.position.set(0, 3, -4.4);
  scene.add(backdrop);

  // the Tesla machine: a tall banded coil with a ring on top and an arch of electrodes
  const tesla = new THREE.Group();
  const plinth = cyl(0.9, 0.9, 0.4, 0x3a3340, 24);
  const coil = cyl(0.42, 0.42, 3.0, 0xc47a3a, 24, 0.02);
  coil.position.y = 0.4;
  for (let i = 0; i < 14; i++) {
    const band = inked(new THREE.TorusGeometry(0.44, 0.035, 6, 24), toon(0x9a5424), 0);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.6 + i * 0.2;
    tesla.add(band);
  }
  const ring = inked(new THREE.TorusGeometry(0.9, 0.3, 14, 28), toon(0xd8dde6), 0.03);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.6;
  tesla.add(plinth, coil, ring);
  tesla.position.set(3.4, 0, -1.8);
  scene.add(tesla);
  // lightning: jagged lines re-rolled every few frames
  const boltMat = new THREE.LineBasicMaterial({ color: 0xcfe8ff });
  const bolts = Array.from({ length: 7 }, () => {
    const line = new THREE.Line(new THREE.BufferGeometry(), boltMat);
    line.frustumCulled = false;
    scene.add(line);
    return line;
  });
  const boltGlow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 20, 14), additive(0x8fc8ff, 0.0));
  boltGlow.position.set(3.4, 3.6, -1.8);
  scene.add(boltGlow);
  const flicker = new THREE.PointLight(0x9fd0ff, 0, 12, 1.2);
  flicker.position.set(3.4, 3.2, -1.2);
  scene.add(flicker);

  // spotlight pool that follows the magician
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), additive(0xfff0c8, 0.22));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.01;
  scene.add(pool);

  const hero = dressed(khoa);
  hero.root.scale.setScalar(1);
  topHat(hero);
  scene.add(hero.root);
  // the prestige: eight babies in a row
  const colors = [0xecc985, 0xb9d6a0, 0x9ecddd, 0xf3b48e, 0xb1a0cc, 0xd98573, 0x89bbaa, 0xe6c667];
  const babies = colors.map((c, i) => {
    const b = new Mascot(c);
    const diaper = inked(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4), toon(0xfff8e8), 0.03);
    diaper.scale.set(1.05, 0.9, 0.75);
    diaper.position.y = 0.72;
    b.rig.add(diaper);
    b.root.position.set(-4.2 + i * 1.05, 0, 1.2 - Math.abs(i - 3.5) * 0.12);
    b.root.rotation.y = (3.5 - i) * 0.06;
    b.bounce = 1.6;
    scene.add(b.root);
    return b;
  });
  // a silhouetted audience in the foreground
  const audience = Array.from({ length: 7 }, (_, i) => {
    const a = new Mascot(0x1a1016, { eyes: 0x1a1016 });
    a.root.scale.setScalar(0.9);
    a.root.position.set(-5.6 + i * 1.9 + (i % 2) * 0.3, -1.7, 5.4 + (i % 2) * 0.5);
    a.root.rotation.y = Math.PI;
    scene.add(a.root);
    return a;
  });

  const cues: FilmSet["cues"] = [
    [0.15, { kind: "sfx", name: "cards", volume: 0.7 }],
    [1.55, { kind: "sfx", name: "hum", volume: 0.7 }],
    [1.9, { kind: "sfx", name: "zap", volume: 0.8 }],
    [2.25, { kind: "sfx", name: "zap", volume: 0.8, rate: 1.2 }],
    [2.55, { kind: "sfx", name: "pop-1", volume: 0.9 }],
    [2.55, { kind: "pop", text: "TA-DA!", at: V(-3.3, 3.2, 0.5), big: true }],
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): [number, FilmSet["cues"][number][1]] => [2.75 + i * 0.12, { kind: "sfx", name: "pop-2", volume: 0.4, rate: 1 + i * 0.06 }]),
  ];
  const rand = seeded(9);

  function update(u: number): Frame {
    hero.update(u);
    // bow, walk into the machine, vanish in the lightning, reappear stage left
    const into = seg(u, 1.0, 1.7);
    const gone = u > 1.8 && u < 2.55;
    const x = u < 2.55 ? -0.4 + into * 3.6 : -3.3;
    hero.root.position.set(x, 0, u < 2.55 ? -0.3 - into * 0.9 : 0.2);
    hero.root.rotation.y = u < 1.0 ? 0.1 : u < 2.55 ? -0.9 : 0.35;
    hero.root.visible = !gone;
    const bow = u < 0.9 ? Math.sin(seg(u, 0.1, 0.9) * Math.PI) * 0.35 : 0;
    hero.rig.rotation.x = bow;
    const reveal = easeOutBack(seg(u, 2.55, 2.85));
    hero.root.scale.setScalar(u < 2.55 ? 1 : Math.max(0.01, reveal));
    hero.cheering = u > 2.9 ? 0.8 : 0;
    pool.position.x = hero.root.position.x;
    pool.position.z = hero.root.position.z;
    // two babies at the start, eight after the trick
    babies.forEach((b, i) => {
      const first = i === 3 || i === 4;
      const pop = first ? 1 : easeOutBack(seg(u, 2.7 + Math.abs(i - 3.5) * 0.12, 3.0 + Math.abs(i - 3.5) * 0.12));
      b.root.scale.setScalar(0.34 * Math.max(0.001, pop));
      b.root.position.y = u > 2.7 ? Math.abs(Math.sin(u * 7 + i)) * 0.25 : 0;
      b.update(u + i * 0.2);
    });
    audience.forEach((a, i) => { a.update(u); a.rig.position.y = u > 2.6 ? Math.abs(Math.sin(u * 8 + i)) * 0.15 : 0; });

    // lightning between the coil and the ring, then everywhere
    const charge = seg(u, 1.4, 1.8) * (1 - seg(u, 2.45, 2.6));
    const reroll = Math.floor(u * 24);
    bolts.forEach((line, i) => {
      line.visible = charge > 0.05 && (i < 3 || charge > 0.6);
      if (!line.visible) return;
      const pts: THREE.Vector3[] = [];
      const a = V(3.4, 3.6, -1.8);
      const ang = i * 0.9 + reroll * 1.7;
      const b = i < 3 ? V(3.4 + Math.cos(ang) * 2.6, 0.2 + (i % 2) * 2, -1.8 + Math.sin(ang) * 1.5) : V(0.6 + (i - 3) * 1.2, 0.3, -1.4);
      for (let k = 0; k <= 8; k++) {
        const p = a.clone().lerp(b, k / 8);
        if (k && k < 8) p.add(V((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4));
        pts.push(p);
      }
      line.geometry.setFromPoints(pts);
    });
    (boltGlow.material as THREE.MeshBasicMaterial).opacity = charge * (0.18 + Math.random() * 0.1);
    flicker.intensity = charge * (20 + Math.random() * 25);
    ring.rotation.z = u * 2;

    // from the stalls: a symmetrical wide that slowly pushes in, then eases left to the reveal
    let s = move(u, 0, 2.5, shot(V(0, 2.6, 13.5), V(0, 2.1, -1), 36), shot(V(0.6, 2.3, 10.5), V(0.8, 1.9, -1), 36));
    if (u > 2.5) s = move(u, 2.5, 4.8, s, shot(V(-1.0, 2.1, 9.4), V(-1.2, 1.3, 0.4), 38));
    const flash = gone && u < 1.95 ? 0.6 : 0;
    return { shot: s, grade: { sepia: 0.28, sat: 0.95, contrast: 1.12, vignette: 0.75, flash, gain: new THREE.Color(1.08, 0.98, 0.86) } };
  }
  return { scene, update, cues };
}
