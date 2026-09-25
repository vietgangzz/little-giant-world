import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { additive, ball, box, canvasTexture, cyl, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame, flock, motes } from "../../film/kit";
import { barrel, cobbleTex, cottage, flicker, ground,   stall, stocks, stoneTex } from "../props";
import {  lute, PEASANT, villager, wizardHat } from "../wardrobe";
import { cloak, dirt, raggedHat } from "../../film/makeup";

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
  const air0 = motes(scene, { count: 160, color: 0x9dffb0, size: 0.07, center: V(0, 3, -1), spread: V(10, 6, 10), rise: 0.3, opacity: 0.8, twinkle: true });
  function update(u: number): Frame {
    air0(u);
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
  const air0 = motes(scene, { count: 100, color: 0xfff6e0, size: 0.05, center: V(0, 3, -2), spread: V(20, 5, 16), rise: 0.06, opacity: 0.5 });
  const air1 = flock(scene, 7, V(-14, 16, -25), V(1, 0, 0.2));
  function update(u: number): Frame {
    air0(u);
    air1(u);
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
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the wandering minstrel */

function chicken(seed: number) {
  const g = new THREE.Group();
  const body = ball(0.28, 0xf6f0e2, 0.015, 10);
  body.scale.set(1, 0.85, 1.25);
  body.position.y = 0.3;
  const head = ball(0.14, 0xf6f0e2, 0.012, 8);
  head.position.set(0, 0.55, 0.28);
  const comb = ball(0.07, 0xd62828, 0, 6);
  comb.scale.set(0.5, 1, 1.2);
  comb.position.set(0, 0.7, 0.28);
  const beak = inked(new THREE.ConeGeometry(0.04, 0.1, 5), toon(0xf2b705), 0);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.54, 0.42);
  const tail = ball(0.12, 0xe8e0d0, 0.01, 6);
  tail.position.set(0, 0.45, -0.3);
  g.add(body, head, comb, beak, tail);
  g.userData.head = head;
  g.userData.seed = seed;
  return g;
}

export function minstrel(): FilmSet {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc88a6a, 25, 90);
  scene.add(skyDome(0x5a4a7a, 0xc8906a, 0xffb070));
  lights(scene, { sky: 0xffc8a0, ground: 0x4a3a2a, fill: 1.1, key: 0xffa060, keyI: 2.0, from: V(12, 6, 6), span: 14 });
  // a muddy lane between cottages at dusk
  const mud = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = "#6a5238"; ctx.fillRect(0, 0, W, H);
    const r = seeded(6);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = r() < 0.5 ? "#5a4430" : "#7a6044"; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 3 + r() * 5, 2 + r() * 2, 0, 0, 7); ctx.fill(); }
  }, [20, 20]);
  scene.add(ground(mud, 160));
  const rand = seeded(44);
  // puddles reflecting the sky
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.6 + rand() * 0.9, 20), new THREE.MeshBasicMaterial({ color: 0xe8a07a }));
    p.rotation.x = -Math.PI / 2;
    p.scale.set(1.6, 1, 1);
    p.position.set((rand() - 0.5) * 7, 0.015, -12 + rand() * 16);
    scene.add(p);
  }
  // cottages with warm windows on both sides
  ([[-7, -3, 0.9], [-8, -10, 1.1], [7, -4, -0.9], [8.5, -11, -1.2], [-6, -18, 0.6], [6, -18, -0.5]] as [number, number, number][]).forEach(([x, z, r], i) => {
    const c = cottage([0xdcc9a6, 0xe8dcc0, 0xcdb894][i % 3], i + 11);
    c.position.set(x, 0, z);
    c.rotation.y = r;
    c.scale.setScalar(1.25);
    scene.add(c);
  });
  // a lantern on a post, a cart wheel, a hay pile, a barrel
  const post = cyl(0.08, 0.08, 3, 0x4a3a2a, 6, 0.012);
  post.position.set(3, 0, 0.5);
  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd080 }));
  lantern.position.set(3, 2.9, 0.5);
  const lampLight = new THREE.PointLight(0xffb060, 8, 8, 1.4);
  lampLight.position.set(3, 2.7, 0.8);
  lantern.userData.flame = lantern;
  lantern.userData.light = lampLight;
  scene.add(post, lantern, lampLight);
  const wheel = inked(new THREE.TorusGeometry(0.6, 0.07, 6, 18), toon(0x5a3a22), 0.012);
  wheel.position.set(-3.4, 0.55, -1);
  wheel.rotation.set(0.2, 0.8, 0);
  const hay = ball(1.1, 0xd9b860, 0.03, 12);
  hay.scale.y = 0.55;
  hay.position.set(-4.2, 0.3, -3.5);
  const b = barrel();
  b.position.set(4.2, 0, -2.4);
  scene.add(wheel, hay, b);
  const chickens = Array.from({ length: 4 }, (_, i) => { const c = chicken(i); c.position.set(-2.4 + i * 0.9 + rand(), 0, 1.6 + rand() * 1.5); c.rotation.y = rand() * 6; scene.add(c); return c; });

  const hero = dressed(who("dennytosp"));
  hero.root.scale.setScalar(1);
  hero.parts.cap.visible = hero.parts.bag.visible = hero.parts.strap.visible = false;
  raggedHat(hero);
  cloak(hero);
  dirt(hero, 0.9);
  const l = lute();
  hero.leftHand.add(l);
  l.position.set(0.3, -0.45, 0.5);
  l.rotation.z = -1.2;
  l.scale.setScalar(0.8);
  scene.add(hero.root);
  // the tin cup at his feet, and the coin that lands in it
  const cup = cyl(0.18, 0.2, 0.3, 0x9aa2aa, 12, 0.012);
  scene.add(cup);
  const coin = inked(new THREE.CylinderGeometry(0.1, 0.1, 0.025, 14), toon(0xe8b64a), 0.006);
  scene.add(coin);
  // passers-by: one hurries past, one stops and tosses a coin
  const walkers = [PEASANT[1], PEASANT[5]].map((c, i) => { const v = villager(c, i); v.root.scale.setScalar(0.9); scene.add(v.root); return v; });
  const notes = Array.from({ length: 6 }, (_, i) => {
    const tex = canvasTexture(64, 64, (ctx) => { ctx.fillStyle = ["#ffe3a0", "#f6d77a", "#ffc8a0"][i % 3]; ctx.font = "700 52px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(i % 2 ? "♪" : "♫", 32, 34); });
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    scene.add(n);
    return n;
  });

  const cues: Cues = [
    [0.3, { kind: "pop", text: "♪ la-la-laaa ♪", at: V(0, 3.6, 0) }],
    [1.2, { kind: "sfx", name: "cheer-soft", volume: 0.3 }],
    [2.75, { kind: "sfx", name: "coin", volume: 1 }],
    [2.8, { kind: "pop", text: "*clink*", at: V(0.9, 1.4, 1.2) }],
    [3.55, { kind: "sfx", name: "thud", volume: 0.4, rate: 1.8 }],
    [3.6, { kind: "pop", text: "*chomp*", at: V(0.4, 2.8, 0.8) }],
    [4.2, { kind: "sfx", name: "jingle", volume: 0.8 }],
    [4.2, { kind: "pop", text: "REAL GOLD?!", at: V(0.2, 3.6, 0.8), big: true }],
  ];
  const air0 = motes(scene, { count: 60, color: 0xfff080, size: 0.1, center: V(0, 1.5, -1), spread: V(14, 3, 10), rise: 0.15, drift: 0.8, opacity: 0.9, twinkle: true });
  const air1 = flock(scene, 7, V(-14, 14, -30), V(1, 0, 0.5));
  function update(u: number): Frame {
    air0(u);
    air1(u);
    flicker(scene, u);
    hero.update(u);
    hero.root.position.set(-0.2 + Math.min(u, 2.4) * 0.35, Math.abs(Math.sin(u * 5)) * 0.06, 0);
    hero.root.rotation.y = 0.35 + Math.sin(u * 2.5) * 0.12;
    hero.rig.rotation.z = Math.sin(u * 5) * 0.07;
    l.rotation.z = -0.9 + Math.sin(u * 14) * 0.05;
    const cupAt = V(0.9, 0, 1.3);
    cup.position.copy(cupAt);
    // the coin: tossed from the second passer-by, into the cup, then up to his mouth
    const toss = seg(u, 2.35, 2.75);
    const from = V(3.6, 1.6, 0.4);
    if (u < 3.3) {
      coin.position.copy(from.clone().lerp(cupAt.clone().add(V(0, 0.2, 0)), toss));
      coin.position.y += Math.sin(toss * Math.PI) * 1.2;
      coin.rotation.x = toss * 12;
      coin.visible = u > 2.35;
    } else {
      coin.visible = true;
      const bite = seg(u, 3.3, 3.55);
      coin.position.copy(cupAt.clone().add(V(0, 0.2, 0)).lerp(hero.root.position.clone().add(V(0.45, 1.25, 0.8)), bite));
      coin.rotation.set(Math.PI / 2, 0, 0);
      if (u > 3.55 && u < 3.75) coin.position.y += Math.sin(u * 60) * 0.03;
    }
    hero.rightHand.position.copy(hero.rest.right).add(u > 3.3 && u < 4.1 ? V(-0.45, 0.45, 0.45) : V(0, 0, 0));
    hero.cheering = u > 4.2 ? 1 : 0;
    walkers.forEach((v, i) => {
      v.update(u + i);
      if (i === 0) { v.root.position.set(6 - u * 2.6, Math.abs(Math.sin(u * 8)) * 0.08, -2.2); v.root.rotation.y = -Math.PI / 2; }
      else {
        const stop = Math.min(u, 2.2);
        v.root.position.set(7 - stop * 1.5, stop < 2.2 ? Math.abs(Math.sin(u * 7)) * 0.07 : 0, 0.2);
        v.root.rotation.y = u < 2.2 ? -Math.PI / 2 : -Math.PI / 2 - 0.5;
        v.cheering = u > 2.25 && u < 2.8 ? 0.8 : 0;
      }
    });
    chickens.forEach((c, i) => { (c.userData.head as THREE.Object3D).position.y = 0.55 - Math.max(0, Math.sin(u * 6 + i * 2)) * 0.2; c.rotation.y += 0.004 * (i % 2 ? 1 : -1); });
    notes.forEach((n, i) => { const k = (u * 0.45 + i / 6) % 1; n.position.set(hero.root.position.x + Math.sin(i * 2.1 + u) * 1.2, 2.6 + k * 2, Math.cos(i * 1.3) * 0.5); n.lookAt(0, 3, 12); (n.material as THREE.MeshBasicMaterial).opacity = (1 - k) * (u < 3.3 || u > 4.2 ? 1 : 0.2); });
    const s = u < 2.3 ? move(u, 0, 2.3, shot(V(-2.8, 2.0, 8.2), V(0.2, 1.7, -1), 38), shot(V(-1.6, 1.9, 7.0), V(0.4, 1.7, -0.5), 36))
      : move(u, 2.3, 5, shot(V(2.2, 1.9, 6.4), V(0.6, 1.5, 0.4), 36), shot(V(1.8, 1.8, 5.2), V(0.6, 1.8, 0.4), 32));
    return { shot: s, grade: { sat: 0.95, contrast: 1.08, vignette: 0.6, gain: new THREE.Color(1.12, 0.96, 0.86) } };
  }
  return { scene, update, cues };
}
