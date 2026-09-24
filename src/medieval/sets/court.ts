import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { ball, box, canvasTexture, cyl, ease, glide, lights, move, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";
import { archWindow, banner, flicker, grassTex, ground, horse, plankTex, room, stoneTex, torch, tower, tree, wall } from "../props";
import { crown, helm, jesterHat, mantle, PEASANT, shieldVG, villager } from "../wardrobe";

const who = (h: string) => CREW.find((c) => c.handle === h)!;
type Cues = FilmSet["cues"];

/* ------------------------------------------------------------------ the king */

export function king(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1210);
  lights(scene, { sky: 0xffe6c0, ground: 0x3a2418, fill: 1.1, key: 0xfff0d0, keyI: 1.8, from: V(-4, 12, 8), span: 12 });
  scene.add(room(16, 22, 10, { wall: stoneTex("#a89c8c", 2), floor: stoneTex("#8a8076", 5) }));
  // red carpet up to a three-step dais and the throne
  const carpet = box(2.6, 0.03, 18, 0xa4161a, 0);
  carpet.position.set(0, 0, 1);
  scene.add(carpet);
  [0, 1, 2].forEach((i) => { const step = box(6 - i * 1.2, 0.3, 3 - i * 0.6, 0x8a8076, 0.02); step.position.set(0, i * 0.3, -8 + i * 0.3); scene.add(step); });
  const throne = new THREE.Group();
  const back = box(2.2, 3.6, 0.35, 0xc99a3c, 0.03);
  back.position.z = -0.7;
  const seat = box(2.2, 0.9, 1.4, 0xc99a3c, 0.03);
  const cushion = box(1.9, 0.2, 1.2, 0xa4161a, 0.02);
  cushion.position.y = 0.9;
  const velvet = box(1.8, 2.8, 0.1, 0xa4161a, 0.01);
  velvet.position.set(0, 0.6, -0.5);
  [-1.1, 1.1].forEach((x) => { const knob = ball(0.2, 0xe8b64a, 0.02); knob.position.set(x, 3.7, -0.7); throne.add(knob); });
  throne.add(back, seat, cushion, velvet);
  throne.position.set(0, 0.9, -8.4);
  scene.add(throne);
  [-5, 5].forEach((x) => { const b = banner(0xa4161a, 1.6, 4.6); b.position.set(x, 8.6, -10.9); scene.add(b); });
  const big = banner(0x2b3f8f, 2.4, 5);
  big.position.set(0, 9.2, -10.9);
  scene.add(big);
  [-3.2, 3.2].forEach((x) => { const t = torch(); t.position.set(x, 3.2, -10.8); scene.add(t); });
  [-7.9, 7.9].forEach((x) => [-4, 3].forEach((z) => { const w = archWindow(1.4, 3); w.position.set(x, 3, z); w.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(w); }));
  // two guards with spears
  const guards = [-3.2, 3.2].map((x, i) => {
    const g = villager(0x9aa3ab, 1);
    g.parts.kerchief.visible = false;
    const helmet = inked(new THREE.SphereGeometry(0.62, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xb9c2cc), 0.02);
    helmet.scale.set(1, 0.8, 0.9);
    helmet.position.set(0.12, 1.72, 0);
    g.rig.add(helmet);
    const spear = new THREE.Group();
    const pole = cyl(0.04, 0.04, 3.4, 0x6b4a33, 6, 0.01);
    const tip = inked(new THREE.ConeGeometry(0.1, 0.4, 6), toon(0xdfe6ee), 0.01);
    tip.position.y = 3.6;
    spear.add(pole, tip);
    spear.position.set(i ? -1.2 : 1.2, -0.6, 0.3);
    g.rightHand.add(spear);
    g.root.position.set(x, 0, -5.5);
    g.root.rotation.y = i ? -0.3 : 0.3;
    scene.add(g.root);
    return g;
  });
  const hero = dressed(who("nnphong1904"));
  hero.root.scale.setScalar(1);
  hero.root.position.set(0, 1.9, -8.2);
  const c = crown(hero, 1.15);
  mantle(hero);
  scene.add(hero.root);
  const crownHome = c.position.clone();

  const cues: Cues = [
    [0.1, { kind: "sfx", name: "bell", volume: 0.5 }],
    [1.9, { kind: "sfx", name: "cloth", volume: 0.7 }],
    [2.1, { kind: "pop", text: "…oops", at: V(0.6, 4.6, -8) }],
    [3.3, { kind: "pop", text: "1…", at: V(-1.2, 4.8, -7.6) }],
    [3.7, { kind: "pop", text: "2…", at: V(0, 5.1, -7.6) }],
    [4.1, { kind: "pop", text: "3…", at: V(1.2, 4.8, -7.6) }],
    [4.4, { kind: "pop", text: "ZÔ!", at: V(0, 5.3, -7), big: true }],
    [4.4, { kind: "sfx", name: "clink", volume: 1 }],
    [4.45, { kind: "sfx", name: "cheer", volume: 0.7 }],
  ];
  function update(u: number): Frame {
    flicker(scene, u);
    hero.update(u);
    guards.forEach((g, i) => { g.update(u + i); g.cheering = u > 4.4 ? 0.8 : 0; });
    // the crown slides down over his eyes, and gets pushed back up
    const slip = seg(u, 1.9, 2.3) * (1 - seg(u, 2.6, 2.95));
    c.position.copy(crownHome).add(V(0.1 * slip, -0.75 * slip, 0.15 * slip));
    c.rotation.z = -0.12 + slip * 0.35;
    hero.waving = u > 2.4 && u < 3.0 ? 1 : 0;
    // stand up and raise the royal tankard
    const stand = ease(seg(u, 3.0, 3.4));
    hero.root.position.set(0, 1.9 + stand * 0.25, -8.2 + stand * 0.6);
    hero.cheering = u > 3.3 ? (u > 4.3 ? 1 : 0.4) : 0;
    let s;
    if (u < 3.0) s = move(u, 0, 3.0, shot(V(0, 2.8, 9), V(0, 3.2, -8), 36), shot(V(0, 2.6, 0.5), V(0, 3.4, -8.2), 34));
    else s = move(u, 3.0, 5.0, shot(V(0.9, 2.0, -3.4), V(0, 3.4, -8.2), 40), shot(V(1.2, 1.8, -2.6), V(0, 3.6, -8.2), 42));
    return { shot: s, grade: { sat: 1.05, contrast: 1.1, vignette: 0.65, gain: new THREE.Color(1.1, 0.98, 0.86) } };
  }
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the knight */

export function knight(): FilmSet {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd8e6ea, 40, 140);
  scene.add(skyDome(0x6fa8dc, 0xbfd6c0, 0xf2ead0));
  lights(scene, { sky: 0xfff4e0, ground: 0x6f8a4a, fill: 1.4, key: 0xfff0d0, keyI: 2.3, from: V(-6, 14, 10), span: 18, focus: V(0, 0, 0) });
  scene.add(ground(grassTex(), 300));
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), toon(0xc9a870));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(0, 0.02, 0);
  scene.add(lane);
  // the tilt: a low fence along the lane
  for (let x = -18; x <= 18; x += 3) { const post = box(0.2, 1.4, 0.2, 0x6b4a33, 0.015); post.position.set(x, 0, -2.4); scene.add(post); }
  const rail = box(36, 0.18, 0.14, 0xe8dcc0, 0.015);
  rail.position.set(0, 1.2, -2.4);
  scene.add(rail);
  // the stands: striped canopy, banners and a cheering crowd
  const stand = box(20, 1.6, 4, new THREE.MeshToonMaterial({ map: plankTex() }), 0.03);
  stand.position.set(0, 0, -8);
  scene.add(stand);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 5), new THREE.MeshToonMaterial({
    map: canvasTexture(256, 32, (ctx, _W, H) => { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? "#f6ecd6" : "#2b3f8f"; ctx.fillRect(i * 16, 0, 16, H); } }),
  }));
  canopy.position.set(0, 5.6, -8.4);
  canopy.rotation.x = -0.15;
  scene.add(canopy);
  [-9, -3, 3, 9].forEach((x, i) => { const p = cyl(0.1, 0.1, 5.6, 0x5a3a22, 6, 0.012); p.position.set(x, 0, -6.2); scene.add(p); const b = banner(i % 2 ? 0xa4161a : 0x2b3f8f, 1.0, 2); b.position.set(x, 5.4, -6.1); scene.add(b); });
  const crowd = Array.from({ length: 12 }, (_, i) => {
    const v = villager(PEASANT[i % PEASANT.length], i);
    v.root.scale.setScalar(0.75);
    v.root.position.set(-8.5 + i * 1.55, 1.6, -8 + (i % 2) * 0.8);
    scene.add(v.root);
    return v;
  });
  const castleBack = tower(2, 10);
  castleBack.position.set(-26, 0, -40);
  const w = wall(24, 6);
  w.position.set(-12, 0, -42);
  scene.add(castleBack, w);
  [[20, -30], [26, -20], [-30, -18], [30, -38]].forEach(([x, z], i) => { const t = tree(i + 2, 1.6); t.position.set(x, 0, z); scene.add(t); });

  // the quintain: a post with a spinning arm (shield one end, sandbag the other)
  const quintain = new THREE.Group();
  quintain.add(cyl(0.2, 0.2, 3.2, 0x6b4a33, 8, 0.02));
  const arm = new THREE.Group();
  const bar = box(3.2, 0.16, 0.16, 0x7a5230, 0.015);
  bar.position.set(0.6, -0.08, 0);
  const target = shieldVG();
  target.scale.setScalar(1.1);
  target.position.set(-1.1, 0, 0.1);
  target.rotation.y = Math.PI / 2;
  const bag = ball(0.45, 0xc9a870, 0.02, 12);
  bag.scale.y = 1.3;
  bag.position.set(2.1, -0.6, 0);
  arm.add(bar, target, bag);
  arm.position.y = 3.0;
  quintain.add(arm);
  quintain.position.set(4, 0, 0.8);
  scene.add(quintain);
  const hay = new THREE.Group();
  for (let i = 0; i < 4; i++) { const b = box(1.6, 0.8, 1.0, 0xe0c060, 0.02); b.position.set((i % 2) * 1.7 - 0.8, Math.floor(i / 2) * 0.8, 0); hay.add(b); }
  hay.position.set(9, 0, 3.5);
  scene.add(hay);

  const steed = horse(0x2b3f8f);
  scene.add(steed.group);
  const hero = dressed(who("baronha"));
  hero.root.scale.setScalar(0.8);
  hero.parts.cigarette.visible = hero.parts.smoke.visible = false;
  const h = helm(hero);
  const lance = new THREE.Group();
  const shaft = inked(new THREE.CylinderGeometry(0.05, 0.14, 4.2, 10), toon(0xe8dcc0), 0.015);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = 1.6;
  const guard = inked(new THREE.ConeGeometry(0.3, 0.5, 12), toon(0x2b3f8f), 0.015);
  guard.rotation.z = -Math.PI / 2;
  lance.add(shaft, guard);
  hero.rightHand.add(lance);
  lance.position.set(0, 0, 0.2);
  const shield = shieldVG();
  shield.scale.setScalar(0.9);
  hero.leftHand.add(shield);
  shield.position.set(-0.1, 0, 0.3);
  shield.rotation.y = -0.4;
  scene.add(hero.root);

  const cues: Cues = [
    [0.35, { kind: "sfx", name: "clang", volume: 0.8 }],
    [0.6, { kind: "sfx", name: "gallop", volume: 1 }],
    [2.4, { kind: "sfx", name: "thud", volume: 1 }],
    [2.4, { kind: "pop", text: "BONK!", at: V(3, 4.4, 1), big: true }],
    [2.9, { kind: "sfx", name: "whoosh", volume: 0.9 }],
    [3.0, { kind: "pop", text: "WHACK!", at: V(5.5, 4.2, 1) }],
    [3.6, { kind: "sfx", name: "plop", volume: 1 }],
    [3.9, { kind: "sfx", name: "cheer", volume: 0.8 }],
    [4.0, { kind: "pop", text: "SIR SHADES!", at: V(9, 3.6, 3.5), big: true }],
  ];
  function update(u: number): Frame {
    flicker(scene, u);
    hero.update(u);
    crowd.forEach((v, i) => { v.update(u + i); v.rig.position.y = u > 3.9 || (u > 2.4 && u < 2.8) ? Math.abs(Math.sin(u * 9 + i)) * 0.4 : 0; });
    h.setVisor(seg(u, 0.2, 0.4) * (1 - seg(u, 3.9, 4.1)));
    // gallop down the lane into the quintain
    const ride = seg(u, 0.5, 2.4);
    const hx = -14 + ride * 17;
    steed.group.position.set(u < 2.4 ? hx : 3 + seg(u, 2.4, 3.6) * 6, 0, 0);
    steed.group.rotation.y = Math.PI / 2;
    steed.pose(u, u < 2.4 ? (u > 0.5 ? 1 : 0.2) : 1 - seg(u, 2.4, 3.6));
    lance.rotation.z = u < 2.4 ? 0 : -0.8;
    // the quintain spins round and the sandbag knocks him clean off
    arm.rotation.y = u < 2.4 ? 0 : -(1 - Math.pow(1 - seg(u, 2.4, 3.8), 3)) * Math.PI * 3.2;
    if (u < 2.95) {
      const saddle = steed.saddle.clone().applyMatrix4(steed.group.matrixWorld);
      steed.group.updateMatrixWorld();
      hero.root.position.copy(steed.saddle).applyMatrix4(steed.group.matrixWorld).add(V(0, 0.1, 0));
      hero.root.rotation.set(0, Math.PI / 2 - 0.3, 0);
      void saddle;
    } else {
      const k = seg(u, 2.95, 3.6);
      hero.root.position.copy(glide(u, 2.95, 3.6, V(3.5, 2.6, 0), V(9, 1.7, 3.5), (x) => x));
      hero.root.position.y += Math.sin(k * Math.PI) * 3;
      hero.root.rotation.set(0, Math.PI / 2 - 0.3 + (u > 3.6 ? -0.9 : 0), u < 3.6 ? k * Math.PI * 2 : 0);
      if (u > 3.6) hero.root.rotation.y = -0.2;
    }
    hero.cheering = u > 4.0 ? 1 : 0;
    let s;
    if (u < 2.4) {
      // tracking alongside the charge
      const x = -14 + ride * 17;
      s = shot(V(x - 1.5, 2.6, 10), V(x + 2.5, 2.2, 0), 38);
      if (u < 0.5) s = shot(V(-12.6, 3.0, 4.2), V(-14, 3.4, 0), 34);
    } else s = move(u, 2.4, 5, shot(V(6, 4.6, 15), V(6, 2.4, 1.5), 40), shot(V(10.5, 4.2, 12), V(8.5, 2.2, 3), 36));
    return { shot: s, grade: { sat: 1.1, contrast: 1.06, vignette: 0.45, gain: new THREE.Color(1.05, 1.0, 0.92) } };
  }
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the jester */

export function jester(): FilmSet {
  const scene = new THREE.Scene();
  scene.add(skyDome(0x7fb2de, 0xa89c8c, 0xf2ead0));
  lights(scene, { sky: 0xfff4e0, ground: 0x7a6a58, fill: 1.3, key: 0xfff0d0, keyI: 2.2, from: V(-5, 12, 8), span: 12 });
  const yard = new THREE.Mesh(new THREE.CircleGeometry(20, 40), new THREE.MeshToonMaterial({ map: stoneTex("#b3a996", 11, [8, 8]) }));
  yard.rotation.x = -Math.PI / 2;
  yard.receiveShadow = true;
  scene.add(yard);
  [0, 1, 2, 3, 4, 5].forEach((i) => { const a = (i / 6) * Math.PI * 2 + 0.5; const w = wall(11, 5, 1.2); w.position.set(Math.sin(a) * 13, 0, Math.cos(a) * 13); w.rotation.y = a; scene.add(w); });
  [0.5, 1.55, 2.6, 3.65, 4.7, 5.75].forEach((a, i) => { const t = tower(1.4, 8, i % 2 ? 0x8c2f39 : 0x3d4f7a); t.position.set(Math.sin(a + 0.52) * 14, 0, Math.cos(a + 0.52) * 14); scene.add(t); });
  const audience = Array.from({ length: 9 }, (_, i) => {
    const v = villager(PEASANT[i % PEASANT.length], i + 1);
    v.root.scale.setScalar(0.9);
    const a = Math.PI + (i - 4) * 0.28;
    v.root.position.set(Math.sin(a) * 7, 0, Math.cos(a) * 7);
    v.root.lookAt(0, 0, 0);
    scene.add(v.root);
    return v;
  });
  const hero = dressed(who("giaBaoJS"));
  hero.root.scale.setScalar(1);
  jesterHat(hero);
  scene.add(hero.root);
  const dog = hero.parts.poodle;
  const dogHome = dog.position.clone();
  const hoop = new THREE.Group();
  const ring = inked(new THREE.TorusGeometry(0.7, 0.06, 8, 30), toon(0xe63946), 0.012);
  ring.position.y = 1.5;
  const stick = cyl(0.04, 0.04, 0.9, 0x6b4a33, 6, 0.01);
  hoop.add(ring, stick);
  hoop.position.set(-3.1, 0, 0.9);
  hoop.rotation.y = Math.PI / 2 + 0.5;
  scene.add(hoop);
  const balls = [0xe63946, 0xffc93c, 0x3a86ff].map((c) => { const b = ball(0.16, c, 0.015, 12); scene.add(b); return b; });

  const cues: Cues = [
    [0.2, { kind: "sfx", name: "bells", volume: 0.7 }],
    [1.8, { kind: "sfx", name: "whoosh", volume: 0.7 }],
    [2.2, { kind: "pop", text: "HUP!", at: V(-3.1, 3.2, 0.9) }],
    [3.4, { kind: "sfx", name: "jingle", volume: 0.9 }],
    [3.5, { kind: "pop", text: "TA-DA!", at: V(-1.8, 2.6, 1.2), big: true }],
    [3.6, { kind: "sfx", name: "cheer", volume: 0.8 }],
  ];
  function update(u: number): Frame {
    hero.update(u);
    hero.root.rotation.y = 0.35;
    audience.forEach((v, i) => { v.update(u + i); v.rig.position.y = u > 3.5 ? Math.abs(Math.sin(u * 8 + i)) * 0.35 : 0; v.cheering = u > 3.5 ? 1 : 0; });
    // three balls in a cascade over his head, then all three land on the pup's nose
    const handL = V(-0.9, 1.0, 0.6), handR = V(1.0, 1.0, 0.6);
    balls.forEach((b, i) => {
      if (u < 3.0) {
        const p = ((u * 1.4 + i / 3) % 1);
        const from = Math.floor(u * 1.4 + i / 3) % 2 ? handL : handR, to = from === handL ? handR : handL;
        b.position.copy(from).lerp(to, p);
        b.position.y += Math.sin(p * Math.PI) * 2.2;
        b.position.applyAxisAngle(V(0, 1, 0), 0.35);
      } else {
        const nose = dog.getWorldPosition(V(0, 0, 0)).add(V(0.15, 1.05 + i * 0.3, 0.25));
        b.position.lerp(nose, Math.min(1, seg(u, 3.0, 3.4) * 1.2 + 0.1));
      }
    });
    hero.cheering = u < 3.0 ? 0.35 + Math.abs(Math.sin(u * 8.8)) * 0.2 : 0.2;
    // the poodle sprints and leaps through the hoop, and back to its spot
    const run = seg(u, 1.6, 2.8);
    dog.userData.walking = u > 1.4 && u < 3.0 ? 1 : 0;
    if (run > 0 && run < 1) {
      const p = V(-1.35, 0, 0.45).lerp(V(-5.2, 0, 0.1), run);
      p.y = Math.sin(run * Math.PI) * 1.4;
      dog.position.copy(p);
      dog.rotation.y = -Math.PI / 2 + 0.5;
      dog.rotation.z = Math.sin(run * Math.PI) * 0.3;
    } else if (run >= 1) {
      const k = seg(u, 2.8, 3.2);
      dog.position.copy(V(-5.2, 0, 0.1).lerp(dogHome, ease(k)));
      dog.rotation.set(0, k < 1 ? Math.PI / 2 : 0.5, 0);
    } else { dog.position.copy(dogHome); dog.rotation.set(0, 0.5, 0); }
    const a = 0.4 + u * 0.22;
    const s = shot(V(Math.sin(a) * 8.5 - 1, 2.6, Math.cos(a) * 8.5), V(-1.2, 1.3, 0.4), 36);
    return { shot: s, grade: { sat: 1.12, contrast: 1.05, vignette: 0.45, gain: new THREE.Color(1.04, 1.0, 0.94) } };
  }
  void easeOutBack;
  return { scene, update, cues };
}
