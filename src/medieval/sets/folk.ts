import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { additive, ball, box, canvasTexture, cyl, ease, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";
import { barrel, candle, cobbleTex, cottage, flicker, ground, plankTex, room, stall, stocks, stoneTex, table, tankard, torch } from "../props";
import { bardCap, crown, lute, PEASANT, villager, wizardHat } from "../wardrobe";

const who = (h: string) => CREW.find((c) => c.handle === h)!;
type Cues = FilmSet["cues"];

/* ---------------------------------------------------------------- the alchemist */

function frog() {
  const g = new THREE.Group();
  const body = ball(0.5, 0x5fae4a, 0.025, 14);
  body.scale.set(1.1, 0.7, 1);
  body.position.y = 0.35;
  [-0.22, 0.22].forEach((x) => {
    const eye = ball(0.16, 0x5fae4a, 0.015, 10); eye.position.set(x, 0.72, 0.2);
    const pupil = ball(0.07, 0x1c1a24, 0, 8); pupil.position.set(x, 0.76, 0.33);
    const leg = ball(0.2, 0x4f9a3c, 0.012, 8); leg.scale.set(1.2, 0.5, 1.4); leg.position.set(x * 2.4, 0.12, -0.1);
    g.add(eye, pupil, leg);
  });
  const mouth = inked(new THREE.TorusGeometry(0.2, 0.02, 6, 12, Math.PI), toon(0x1c1a24), 0);
  mouth.rotation.set(0, 0, Math.PI);
  mouth.position.set(0, 0.45, 0.46);
  g.add(body, mouth);
  return g;
}

export function alchemist(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120e1a);
  lights(scene, { sky: 0xb8a8ff, ground: 0x2a1a30, fill: 0.8, key: 0xd0c8ff, keyI: 1.1, from: V(-5, 10, 6), span: 8 });
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 9, 32, 1, true), new THREE.MeshToonMaterial({ map: stoneTex("#7a7090", 14, [6, 3]), side: THREE.BackSide }));
  walls.position.y = 4.5;
  scene.add(walls);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshToonMaterial({ map: stoneTex("#5a5068", 15, [4, 4]) }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  // shelves of coloured bottles round the wall
  const rand = seeded(21);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + (i / 26 - 0.5) * 2.6;
    const row = i % 3;
    const bottle = cyl(0.14, 0.18, 0.4 + rand() * 0.3, new THREE.MeshToonMaterial({ color: [0xe63946, 0x3a86ff, 0x2ec27e, 0xffc93c, 0xb14aed][i % 5], emissive: 0x111111 }), 10, 0.012);
    bottle.position.set(Math.sin(a) * 6.3, 1.6 + row * 1.3, Math.cos(a) * 6.3);
    scene.add(bottle);
    if (i % 3 === 0) { const shelf = box(1.8, 0.1, 0.5, 0x5a3a22, 0.01); shelf.position.set(Math.sin(a) * 6.4, 1.5 + row * 1.3, Math.cos(a) * 6.4); shelf.rotation.y = a; scene.add(shelf); }
  }
  // a star chart
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 256, (ctx, W, H) => {
      ctx.fillStyle = "#e9dcb4"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#6b4a33"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, 100, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, 7); ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60); ctx.lineTo(W / 2 + Math.cos(a) * 100, H / 2 + Math.sin(a) * 100); ctx.stroke(); }
      ctx.fillStyle = "#e8b64a"; ctx.beginPath(); ctx.arc(W / 2, H / 2, 24, 0, 7); ctx.fill();
    }),
  }));
  chart.position.set(-2.6, 4.2, -6.3);
  chart.rotation.y = 0.35;
  scene.add(chart);
  // the cauldron over a fire, bubbling green
  const cauldron = new THREE.Group();
  const pot = inked(new THREE.SphereGeometry(1.1, 22, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), toon(0x24232b, { side: THREE.DoubleSide }), 0.03);
  pot.position.y = 1.3;
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.98, 24), new THREE.MeshBasicMaterial({ color: 0x5dff7a }));
  brew.rotation.x = -Math.PI / 2;
  brew.position.y = 1.8;
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 10), new THREE.MeshBasicMaterial({ color: 0xff8a30 }));
  fire.position.y = 0.35;
  const glow = new THREE.PointLight(0x7dff9a, 14, 9, 1.4);
  glow.position.y = 2.6;
  cauldron.add(pot, brew, fire, glow);
  cauldron.position.set(0, 0, -1.6);
  scene.add(cauldron);
  const bubbles = Array.from({ length: 10 }, (_, i) => { const b = ball(0.12, new THREE.MeshBasicMaterial({ color: 0x9dffb0 }), 0, 8); b.userData.p = i * 0.37; scene.add(b); return b; });
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), additive(0x7dff9a, 0));
  scene.add(smoke);

  const hero = dressed(who("khoatranthanh"));
  hero.root.scale.setScalar(1);
  hero.root.position.set(2.0, 0, -0.6);
  hero.root.rotation.y = -0.9;
  wizardHat(hero);
  scene.add(hero.root);
  // the babies, moved over by the pot so the trick is in frame
  const babies = [hero.parts.babyA, hero.parts.babyB];
  const frogs = babies.map(() => { const f = frog(); scene.add(f); return f; });
  const tinyCrowns = babies.map((b) => {
    const c = new THREE.Group();
    for (let i = 0; i < 5; i++) { const s = inked(new THREE.ConeGeometry(0.12, 0.3, 4), toon(0xe8b64a), 0.02); const a = (i / 5) * Math.PI * 2; s.position.set(Math.sin(a) * 0.35, 0.15, Math.cos(a) * 0.35); c.add(s); }
    c.add(inked(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 16, 1, true), toon(0xe8b64a, { side: THREE.DoubleSide }), 0.015));
    c.position.set(0.1, 2.0, 0);
    (b.children[0] as THREE.Object3D).add(c);
    return c;
  });
  void crown;

  const cues: Cues = [
    [0.1, { kind: "sfx", name: "bubble", volume: 0.8 }],
    [1.0, { kind: "sfx", name: "bubble", volume: 0.8 }],
    [1.6, { kind: "sfx", name: "zap", volume: 1 }],
    [1.65, { kind: "pop", text: "ZAP!", at: V(0.8, 2.8, 0.8), big: true }],
    [2.3, { kind: "pop", text: "ribbit.", at: V(0.8, 1.6, 1.4) }],
    [3.2, { kind: "sfx", name: "zap", volume: 1, rate: 1.2 }],
    [3.3, { kind: "pop", text: "✨ PRINCES! ✨", at: V(0.8, 2.6, 1.2), big: true }],
    [3.4, { kind: "sfx", name: "jingle", volume: 0.8 }],
  ];
  function update(u: number): Frame {
    hero.update(u);
    bubbles.forEach((b, i) => { const k = (u * 0.8 + b.userData.p) % 1; b.position.set(Math.sin(i * 2.3) * 0.6, 1.8 + k * 1.4, -1.6 + Math.cos(i * 1.7) * 0.5); b.scale.setScalar(1 - k); });
    (brew.material as THREE.MeshBasicMaterial).color.setHSL(0.36 + (u > 3.2 ? 0.5 : 0) * seg(u, 3.2, 3.6), 1, 0.6 + Math.sin(u * 8) * 0.05);
    hero.cheering = (u > 1.3 && u < 1.8) || (u > 2.9 && u < 3.4) ? 0.9 : u > 3.6 ? 0.5 : 0;
    // babies → frogs → crowned princes
    const asFrog = u > 1.65 && u < 3.25;
    babies.forEach((b, i) => {
      b.visible = !asFrog;
      b.position.set(-0.6 + i * -1.0, 0, 1.4 - i * 0.2);
      tinyCrowns[i].visible = u > 3.25;
      frogs[i].visible = asFrog;
      frogs[i].position.copy(b.getWorldPosition(V(0, 0, 0)));
      frogs[i].position.y = Math.abs(Math.sin(u * 5 + i)) * 0.4;
      frogs[i].scale.setScalar(0.6 * easeOutBack(seg(u, 1.65, 1.9)));
      frogs[i].rotation.y = -0.4;
    });
    const puff = Math.max(Math.max(0, 1 - Math.abs(u - 1.7) / 0.35), Math.max(0, 1 - Math.abs(u - 3.25) / 0.35));
    smoke.position.set(-0.2, 1.0, 1.0);
    smoke.scale.setScalar(1 + puff * 1.5);
    (smoke.material as THREE.MeshBasicMaterial).opacity = puff * 0.4;
    const a = -0.3 + u * 0.12;
    const s = shot(V(Math.sin(a) * 6.2, 3.0, Math.cos(a) * 6.2 - 0.3), V(0.3, 1.3, -0.4), 40);
    return { shot: s, grade: { sat: 1.15, contrast: 1.12, vignette: 0.8, gain: new THREE.Color(0.95, 1.05, 1.08) } };
  }
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the bard */

export function bard(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1210);
  lights(scene, { sky: 0xffd8a8, ground: 0x3a2418, fill: 1.0, key: 0xffe0b0, keyI: 1.5, from: V(-4, 9, 7), span: 10 });
  scene.add(room(16, 12, 6, { wall: plankTex("#8a6448"), floor: plankTex("#6a4a30") }));
  // beams, fireplace, bar and barrels
  for (let x = -6; x <= 6; x += 3) { const beam = box(0.4, 0.4, 12, 0x4a3020, 0.02); beam.position.set(x, 5.4, 0); scene.add(beam); }
  const hearth = box(3.4, 2.4, 1, 0x6b5f55, 0.03);
  hearth.position.set(-4.5, 0, -5.5);
  const flames = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 10), new THREE.MeshBasicMaterial({ color: 0xff8a30 }));
  flames.position.set(-4.5, 0.7, -5.0);
  flames.userData.flame = flames;
  const fireL = new THREE.PointLight(0xff8a40, 16, 10, 1.4);
  fireL.position.set(-4.5, 1.2, -4.4);
  flames.userData.light = fireL;
  scene.add(hearth, flames, fireL);
  const bar = box(5, 1.3, 1, 0x5a3a22, 0.02);
  bar.position.set(4.5, 0, -4.4);
  scene.add(bar);
  [[5.8, -5.6], [4.6, -5.6], [3.4, -5.6]].forEach(([x, z]) => { const b = barrel(); b.position.set(x, 1.3, z); b.rotation.x = Math.PI / 2; b.position.y = 1.7; scene.add(b); });
  [[-6.5, 2], [6.5, 1]].forEach(([x, z]) => { const t = torch(); t.position.set(x, 2.6, z); scene.add(t); });
  // the stage: a table he's standing on
  const stageT = table(2.6, 1.6, 0.9);
  stageT.position.set(0, 0, -2.5);
  scene.add(stageT);
  const hero = dressed(who("dennytosp"));
  hero.root.scale.setScalar(0.95);
  hero.root.position.set(0, 0.9, -2.5);
  hero.parts.cap.visible = false;
  bardCap(hero);
  const l = lute();
  hero.leftHand.add(l);
  l.position.set(0.5, -0.1, 0.35);
  l.rotation.z = -0.9;
  l.scale.setScalar(0.9);
  scene.add(hero.root);
  // the regulars, dancing with tankards
  const patrons = Array.from({ length: 8 }, (_, i) => {
    const v = villager(PEASANT[i], i);
    v.root.scale.setScalar(0.72);
    const a = (i / 8) * Math.PI * 2;
    v.root.position.set(Math.sin(a) * 3.6, 0, -1.2 + Math.cos(a) * 2.4);
    const tk = tankard();
    v.rightHand.add(tk);
    tk.position.set(0.1, 0, 0.1);
    scene.add(v.root);
    return { v, a };
  });
  const notes = Array.from({ length: 8 }, (_, i) => {
    const tex = canvasTexture(64, 64, (ctx) => { ctx.fillStyle = ["#ffc93c", "#c6df70", "#ff8fa3"][i % 3]; ctx.font = "700 52px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(i % 2 ? "♪" : "♫", 32, 34); });
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    scene.add(n);
    return n;
  });
  const cues: Cues = [
    [0.3, { kind: "pop", text: "♪ Hey nonny nonny! ♪", at: V(0, 4.4, -2.3) }],
    [1.6, { kind: "sfx", name: "clink", volume: 0.8 }],
    [2.4, { kind: "sfx", name: "chant", volume: 0.7 }],
    [3.1, { kind: "pop", text: "ENCORE!", at: V(-2.6, 3.0, 0) }],
    [3.8, { kind: "sfx", name: "clink", volume: 0.9 }],
    [3.9, { kind: "pop", text: "YO-HO!", at: V(2.4, 3.2, 0.2), big: true }],
  ];
  function update(u: number): Frame {
    flicker(scene, u);
    hero.update(u);
    hero.rig.rotation.z = Math.sin(u * 7) * 0.08;
    hero.cheering = 0.5 + Math.sin(u * 7) * 0.2;
    l.rotation.z = -0.9 + Math.sin(u * 14) * 0.05;
    patrons.forEach(({ v, a }, i) => {
      v.update(u + i);
      const aa = a + u * 0.6;
      v.root.position.set(Math.sin(aa) * 4.2, Math.abs(Math.sin(u * 7 + i)) * 0.35, -1.6 + Math.cos(aa) * 2.2);
      v.root.rotation.y = aa + Math.PI / 2;
      v.cheering = u > 1.5 ? 0.8 : 0.3;
    });
    notes.forEach((n, i) => { const k = (u * 0.5 + i / 8) % 1; n.position.set(Math.sin(i * 2.1 + u) * 1.6, 3 + k * 2.4, -2.3 + Math.cos(i * 1.3) * 0.6); n.lookAt(0, 3, 10); (n.material as THREE.MeshBasicMaterial).opacity = 1 - k; });
    const s = move(u, 0, 5, shot(V(-3.2, 4.2, 6.8), V(0, 2.4, -2.4), 40), shot(V(3.0, 4.0, 6.6), V(0, 2.5, -2.4), 40));
    return { shot: s, grade: { sat: 1.12, contrast: 1.1, vignette: 0.65, gain: new THREE.Color(1.1, 0.98, 0.86) } };
  }
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the heretic */

export function heretic(): FilmSet {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd8d0c0, 30, 90);
  scene.add(skyDome(0x8aa0b8, 0xb0a890, 0xe8dcc0));
  lights(scene, { sky: 0xfff0dc, ground: 0x6a5a48, fill: 1.3, key: 0xfff0d0, keyI: 2.1, from: V(-6, 13, 9), span: 14 });
  scene.add(ground(cobbleTex([30, 30]), 120));
  [[-9, -9, 0.3], [0, -12, 0], [9, -9, -0.3], [-14, -1, 1.2], [14, -2, -1.2]].forEach(([x, z, r], i) => { const c = cottage([0xe8dcc0, 0xdcc9a6, 0xf2e2c4][i % 3], i + 5); c.position.set(x, 0, z); c.rotation.y = r; c.scale.setScalar(1.3); scene.add(c); });
  const st = stall(0x2b3f8f);
  st.position.set(7, 0, -3);
  st.rotation.y = -0.6;
  scene.add(st);
  const pillory = stocks();
  pillory.position.set(0, 0.3, -1);
  scene.add(pillory);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshToonMaterial({
    map: canvasTexture(256, 100, (ctx, W, H) => {
      ctx.fillStyle = "#e9dcb4"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#6b1010"; ctx.font = "700 30px Cinzel, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("SORCERER", W / 2, H * 0.36);
      ctx.font = "400 18px 'IM Fell English', serif"; ctx.fillText("(glowing black mirror)", W / 2, H * 0.72);
    }),
  }));
  sign.position.set(0, 2.85, -0.85);
  scene.add(sign);
  const hero = dressed(who("ritesh"));
  hero.root.scale.setScalar(1);
  hero.root.position.set(0, 0.3, -1.6);
  scene.add(hero.root);
  // hands through the holes in the board; the phone still in one of them
  hero.rest.left.set(-0.95, 1.4, 0.55);
  hero.rest.right.set(0.95, 1.4, 0.55);
  hero.parts.phone.rotation.set(0, 0, 0);
  const screenGlow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), additive(0x9fd8ff, 0.3));
  hero.parts.phone.add(screenGlow);
  screenGlow.position.z = 0.05;
  const live = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({
    map: canvasTexture(128, 60, (ctx, W, H) => { ctx.fillStyle = "#e63946"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "800 26px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("● LIVE", W / 2, H / 2 + 1); }),
  }));
  live.position.set(0, 0.22, 0.05);
  hero.parts.phone.add(live);
  // the angry mob, with tomatoes — until they see themselves on screen
  const mob = Array.from({ length: 9 }, (_, i) => {
    const v = villager(PEASANT[i % PEASANT.length], i + 2);
    v.root.scale.setScalar(0.9);
    // two knots of villagers either side of the stocks, leaving the front clear
    const a = (i < 5 ? -1 : 1) * (1.05 + (i % 5) * 0.2);
    v.root.position.set(Math.sin(a) * (5 + (i % 2) * 1.4), 0, -1 + Math.cos(a) * 5.2);
    v.root.rotation.y = Math.atan2(-v.root.position.x, -1 - v.root.position.z);
    scene.add(v.root);
    return v;
  });
  const rand = seeded(19);
  const tomatoes = Array.from({ length: 7 }, (_, i) => {
    const t = ball(0.18, 0xd62828, 0.015, 10);
    scene.add(t);
    return { t, from: mob[(i * 3) % mob.length].root.position.clone().add(V(0, 1.6, 0)), to: V(-1.1 + rand() * 2.2, 1.7 + rand() * 0.6, -0.85), at: 0.4 + i * 0.28 };
  });
  const splats = tomatoes.map((tm) => {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), new THREE.MeshBasicMaterial({ color: 0xc41d1d }));
    s.position.copy(tm.to).add(V(0, 0, 0.12));
    s.scale.set(1.3, 0.9, 1);
    scene.add(s);
    return s;
  });
  const cues: Cues = [
    [0.1, { kind: "sfx", name: "crowd", volume: 0.7 }],
    [0.3, { kind: "pop", text: "WITCHCRAFT!", at: V(-4, 3.6, 3.5), big: true }],
    ...tomatoes.map((tm): [number, FilmSet["cues"][number][1]] => [tm.at + 0.35, { kind: "sfx", name: "splat", volume: 0.7 }]),
    [2.6, { kind: "sfx", name: "jingle", volume: 0.8 }],
    [2.7, { kind: "pop", text: "10K 👀", at: V(-1.2, 2.6, 0), big: true }],
    [3.2, { kind: "sfx", name: "cheer-soft", volume: 0.8 }],
    [3.6, { kind: "pop", text: "Am I on?!", at: V(3.5, 3.2, 3.8) }],
  ];
  function update(u: number): Frame {
    hero.update(u);
    hero.leftHand.position.copy(hero.rest.left);
    hero.rightHand.position.copy(hero.rest.right);
    hero.rig.position.y = 0;
    (screenGlow.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(u * 6) * 0.08;
    live.visible = u > 2.6 && Math.floor(u * 3) % 2 === 0;
    const posing = u > 3.0;
    mob.forEach((v, i) => {
      v.update(u + i);
      v.waving = posing ? 1 : 0;
      v.cheering = !posing && u > 0.3 ? 0.6 : posing && i % 2 ? 1 : 0;
      v.rig.position.y = posing ? Math.abs(Math.sin(u * 6 + i)) * 0.25 : 0;
    });
    tomatoes.forEach((tm, i) => {
      const k = seg(u, tm.at, tm.at + 0.35);
      tm.t.visible = k > 0 && k < 1 && u < 2.6;
      tm.t.position.copy(tm.from).lerp(tm.to, k);
      tm.t.position.y += Math.sin(k * Math.PI) * 1.4;
      splats[i].visible = u > tm.at + 0.35;
      splats[i].scale.setScalar(Math.min(1, (u - tm.at - 0.35) * 8) * 1.2);
    });
    const s = u < 2.5 ? move(u, 0, 2.5, shot(V(-2.4, 5.4, 12), V(0, 1.8, -1), 36), shot(V(-1.6, 4.8, 10), V(0, 1.9, -1), 34))
      : move(u, 2.5, 5, shot(V(1.2, 2.2, 3.0), V(-0.9, 1.6, -0.8), 38), shot(V(2.6, 2.8, 8.8), V(0.4, 1.6, 1.5), 44));
    return { shot: s, grade: { sat: 1.05, contrast: 1.06, vignette: 0.5, gain: new THREE.Color(1.05, 1.0, 0.93) } };
  }
  void candle; void ease; void cyl;
  return { scene, update, cues };
}
