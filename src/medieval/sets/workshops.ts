import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW, hex } from "../../crew";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { drawMascot } from "../../film/costumes";
import { additive, ball, box, canvasTexture, cyl, ease, lights, move, picture, seg, shot, V, type FilmSet, type Frame } from "../../film/kit";
import { archWindow, barrel, candle, flicker, plankTex, room, stoneTex, table, torch } from "../props";
import { apron, hammer, monkHood, painterBeret, quill, villager } from "../wardrobe";

const who = (h: string) => CREW.find((c) => c.handle === h)!;
type Cues = FilmSet["cues"];

/* ------------------------------------------------------------------ the painter */

export function painter(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x201814);
  lights(scene, { sky: 0xfff0dc, ground: 0x5a4a3a, fill: 1.3, key: 0xfff4e0, keyI: 2.0, from: V(-8, 10, 6), span: 10 });
  scene.add(room(14, 12, 7, { wall: plankTex("#c9b08a"), floor: plankTex("#7a5a3c") }));
  const win = archWindow(2.2, 3.4);
  win.position.set(-6.9, 1.6, -1);
  win.rotation.y = Math.PI / 2;
  scene.add(win);
  // the sitter: a noble lady in a tall hennin, on a velvet chair
  const chair = box(1.8, 1.0, 1.4, 0xa4161a, 0.02);
  chair.position.set(-3, 0, -2.5);
  const chairBack = box(1.8, 2.2, 0.25, 0x6b4226, 0.02);
  chairBack.position.set(-3, 0, -3.2);
  scene.add(chair, chairBack);
  const lady = villager(0xf0c8d0, 2); // index 2: bare-headed, the hennin goes on instead
  const hennin = inked(new THREE.ConeGeometry(0.5, 1.8, 18), toon(0x7b2cbf), 0.02);
  hennin.position.set(0.1, 2.6, -0.1);
  hennin.rotation.z = -0.25;
  const veil = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.4, 8, 1, true), new THREE.MeshToonMaterial({ color: 0xfff6f8, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  veil.position.set(-0.2, 3.1, -0.2);
  veil.rotation.z = 2.4;
  lady.rig.add(hennin, veil);
  lady.root.position.set(-3, 1.0, -2.5);
  lady.root.rotation.y = 0.7;
  scene.add(lady.root);
  // the easel, and the portrait that appears on it
  const easel = new THREE.Group();
  [[-0.6, 0.15], [0.6, 0.15], [0, -0.6]].forEach(([x, z]) => { const leg = box(0.1, 3.4, 0.1, 0x7a5230, 0.012); leg.position.set(x, 0, z); leg.rotation.x = z < 0 ? 0.25 : -0.1; easel.add(leg); });
  const canvasBoard = box(1.9, 1.5, 0.08, 0xf6f0e2, 0.02);
  canvasBoard.position.set(0, 1.5, 0.25);
  const portrait = picture(1.7, 1.3, canvasTexture(340, 260, (ctx, W, H) => {
    ctx.fillStyle = "#3a4a3a"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.5, W * 0.6);
    g.addColorStop(0, "#8a9a6a"); g.addColorStop(1, "#2a3424"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawMascot(ctx, W / 2, H * 0.2, H * 0.72, "#f0c8d0", "#234d37");
    ctx.fillStyle = "#7b2cbf"; ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.02); ctx.lineTo(W * 0.42, H * 0.3); ctx.lineTo(W * 0.6, H * 0.3); ctx.fill();
    ctx.strokeStyle = "#c99a3c"; ctx.lineWidth = 14; ctx.strokeRect(0, 0, W, H);
  }), true);
  portrait.position.set(0, 2.25, 0.3);
  easel.add(canvasBoard, portrait);
  easel.position.set(1.2, 0, -1.4);
  easel.rotation.y = -0.5;
  scene.add(easel);
  // everyone else's half-finished portraits, stacked against the wall
  ["3 MONTHS", "6 MONTHS", "1 YEAR"].forEach((label, i) => {
    const p = picture(1.4, 1.1, canvasTexture(200, 160, (ctx, W, H) => {
      ctx.fillStyle = "#e8dcc0"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#8a6a4a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.45, 30 + i * 8, 36, 0, 0, Math.PI * (0.6 + i * 0.5)); ctx.stroke();
      ctx.fillStyle = "#a4161a"; ctx.font = "700 22px Cinzel, serif"; ctx.textAlign = "center"; ctx.fillText(label, W / 2, H - 16);
      ctx.strokeStyle = "#6b4226"; ctx.lineWidth = 10; ctx.strokeRect(0, 0, W, H);
    }), true);
    p.position.set(3.5 + i * 0.9, 0.7, -5.8 + i * 0.25);
    p.rotation.set(-0.15, -0.2, 0);
    scene.add(p);
  });
  const hero = dressed(who("anhquan291"));
  hero.root.scale.setScalar(1);
  hero.root.position.set(2.9, 0, 0.8);
  hero.root.rotation.y = -1.1;
  painterBeret(hero);
  hero.parts.suitcase.visible = false;
  scene.add(hero.root);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), additive(0xffffff, 0));
  hero.parts.camera.add(flash);
  flash.position.z = 0.3;
  const polaroid = new THREE.Group();
  polaroid.add(box(0.5, 0.6, 0.02, 0xfbf7ee, 0.01));
  scene.add(polaroid);

  const cues: Cues = [
    [0.2, { kind: "pop", text: "Hold still… for 3 months", at: V(-3, 4.3, -2.5) }],
    [2.0, { kind: "sfx", name: "shutter", volume: 1 }],
    [2.0, { kind: "sfx", name: "flash", volume: 0.8 }],
    [2.1, { kind: "pop", text: "CLICK!", at: V(3, 3, 1), big: true }],
    [3.2, { kind: "sfx", name: "pop-1", volume: 0.8 }],
    [3.8, { kind: "sfx", name: "thud", volume: 0.7 }],
    [3.9, { kind: "pop", text: "*faints*", at: V(-3.4, 3.2, -2.2) }],
  ];
  function update(u: number): Frame {
    hero.update(u);
    lady.update(u);
    (flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - Math.abs(u - 2.05) / 0.12);
    hero.cheering = u > 1.4 && u < 2.3 ? 0.4 : u > 3.3 ? 0.8 : 0;
    // the polaroid slides out and flies to the easel: the portrait is done
    const out = seg(u, 2.2, 2.6), fly = seg(u, 2.7, 3.2);
    polaroid.visible = u > 2.2 && u < 3.25;
    polaroid.position.copy(V(2.9, 1.4 + out * 0.5, 1.4)).lerp(V(1.2, 2.2, -1.1), ease(fly));
    polaroid.rotation.set(0, -0.5, fly * 6);
    portrait.visible = u > 3.2;
    portrait.scale.setScalar(u > 3.2 ? easeOutBack(seg(u, 3.2, 3.5)) : 0.01);
    // the sitter faints clean off the chair
    const faint = ease(seg(u, 3.6, 4.1));
    lady.root.rotation.set(-faint * 1.3, 0.7, 0);
    lady.root.position.set(-3, 1.0 - faint * 0.4, -2.5 - faint * 0.3);
    const s = u < 2.6 ? move(u, 0, 2.6, shot(V(-0.6, 3.4, 10.5), V(0, 1.8, -1.6), 40), shot(V(-0.2, 3.2, 9.4), V(0.3, 1.9, -1.4), 38))
      : move(u, 2.6, 5, shot(V(-0.4, 3.2, 9.2), V(-0.4, 1.9, -1.6), 40), shot(V(-1.2, 3.0, 9.0), V(-1.2, 1.8, -1.8), 42));
    return { shot: s, grade: { sat: 1.05, contrast: 1.06, vignette: 0.55, gain: new THREE.Color(1.08, 1.0, 0.9) } };
  }
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the blacksmith */

export function blacksmith(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120c0a);
  lights(scene, { sky: 0xffb070, ground: 0x2a1a10, fill: 0.7, key: 0xffc890, keyI: 1.2, from: V(-5, 8, 6), span: 8 });
  scene.add(room(14, 12, 7, { wall: stoneTex("#7a6a5a", 8), floor: stoneTex("#5a5048", 9) }));
  const forge = new THREE.Group();
  forge.add(box(3, 1.2, 2, 0x6b5f55, 0.03));
  const coals = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.5), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
  coals.position.y = 1.25;
  const hood = inked(new THREE.CylinderGeometry(0.6, 1.6, 2.2, 4), toon(0x4a4038), 0.03);
  hood.rotation.y = Math.PI / 4;
  hood.position.y = 3.6;
  const fireLight = new THREE.PointLight(0xff7a30, 30, 12, 1.4);
  fireLight.position.set(0, 2, 0.8);
  forge.add(coals, hood, fireLight);
  forge.position.set(-3.2, 0, -3.5);
  scene.add(forge);
  const anvil = new THREE.Group();
  anvil.add(cyl(0.45, 0.35, 0.8, 0x4a3a2a, 10, 0.02));
  const top = box(1.5, 0.35, 0.55, 0x3a3f46, 0.02);
  top.position.y = 0.8;
  const horn = inked(new THREE.ConeGeometry(0.2, 0.7, 10), toon(0x3a3f46), 0.015);
  horn.rotation.z = Math.PI / 2;
  horn.position.set(-1.0, 0.98, 0);
  anvil.add(top, horn);
  anvil.position.set(0.4, 0, 0.2);
  scene.add(anvil);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
  bar.position.set(0.3, 1.2, 0.25);
  scene.add(bar);
  const trough = box(1.8, 0.7, 0.8, 0x6b4a33, 0.02);
  trough.position.set(3.2, 0, -1.8);
  scene.add(trough);
  const b = barrel();
  b.position.set(-5.8, 0, -1);
  scene.add(b);
  // tools on the wall
  for (let i = 0; i < 5; i++) { const tl = hammer(); tl.scale.setScalar(0.8); tl.position.set(1.5 + i * 0.7, 3.4, -5.85); tl.rotation.z = 0.1 * (i - 2); scene.add(tl); }
  const hero = dressed(who("tuanngocptn"));
  hero.root.scale.setScalar(1);
  hero.root.position.set(1.5, 0, -0.9);
  hero.root.rotation.y = -0.6;
  apron(hero);
  const ham = hammer();
  hero.rightHand.add(ham);
  ham.position.set(0, 0.2, 0.2);
  const chainProp = hero.parts.chain;
  scene.add(hero.root);
  // the finished product: a big gold chain, lifted up for inspection
  const bling = new THREE.Group();
  for (let i = 0; i < 16; i++) { const link = inked(new THREE.TorusGeometry(0.12, 0.035, 6, 12), toon(0xe8b64a), 0.008); const a = (i / 16) * Math.PI * 2; link.position.set(Math.sin(a) * 0.6, -Math.cos(a) * 0.8, 0); link.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, a); bling.add(link); }
  scene.add(bling);
  // sparks: a pooled burst on every hammer blow
  const sparkGeo = new THREE.BufferGeometry();
  const N = 120;
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffd060, size: 0.09, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  scene.add(sparks);
  const vel = Array.from({ length: N }, (_, i) => V(Math.sin(i * 12.9) * 2.2, 2 + Math.abs(Math.sin(i * 7.3)) * 3, Math.cos(i * 4.1) * 1.6));
  const hits = [0.5, 1.1, 1.7, 2.3];
  const cues: Cues = [
    [0.05, { kind: "sfx", name: "fire", volume: 0.6 }],
    ...hits.map((t): [number, FilmSet["cues"][number][1]] => [t, { kind: "sfx", name: "anvil", volume: 0.8 }]),
    [1.1, { kind: "pop", text: "CLANG!", at: V(0.3, 2.4, 0.4) }],
    [2.9, { kind: "sfx", name: "dunk", volume: 0.8 }],
    [3.5, { kind: "sfx", name: "jingle", volume: 0.9 }],
    [3.6, { kind: "pop", text: "BLING!", at: V(1.5, 3.6, 0), big: true }],
  ];
  function update(u: number): Frame {
    flicker(scene, u);
    hero.update(u);
    (coals.material as THREE.MeshBasicMaterial).color.setHSL(0.06, 1, 0.5 + Math.sin(u * 13) * 0.05);
    fireLight.intensity = 26 + Math.sin(u * 17) * 5;
    // hammer: up, down on each hit
    const last = hits.filter((h) => u >= h).pop() ?? -1;
    const since = u - last;
    const swing = u < 2.6 ? (since < 0.12 ? 1 - since / 0.12 : Math.min(1, (since - 0.12) / 0.35)) : 0;
    hero.rightHand.position.copy(hero.rest.right).add(V(-0.25, swing * 0.9, 0.3));
    ham.rotation.z = -swing * 1.2;
    const pos = sparkGeo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const age = since + (i % 3) * 0.02;
      if (last < 0 || age > 0.6 || u > 2.8) { pos.setXYZ(i, 0, -50, 0); continue; }
      const v = vel[i];
      pos.setXYZ(i, 0.3 + v.x * age, 1.25 + v.y * age - 4.9 * age * age, 0.25 + v.z * age);
    }
    pos.needsUpdate = true;
    (bar.material as THREE.MeshBasicMaterial).color.set(u < 2.9 ? 0xffa040 : 0x6a6a6a);
    bar.visible = u < 3.0;
    // then he holds up... a gold chain, naturally
    const show = easeOutBack(seg(u, 3.2, 3.6));
    bling.visible = u > 3.2;
    bling.scale.setScalar(Math.max(0.01, show));
    bling.position.set(1.8, 2.9 + Math.sin(u * 3) * 0.05, -0.2);
    bling.rotation.y = u * 2;
    hero.cheering = u > 3.3 ? 0.9 : 0;
    chainProp.visible = true;
    const s = u < 2.8 ? move(u, 0, 2.8, shot(V(1.8, 1.5, 3.4), V(0.2, 1.3, 0), 36), shot(V(2.4, 1.4, 3.8), V(0.4, 1.5, -0.3), 38))
      : move(u, 2.8, 5, shot(V(3.2, 2.3, 5.0), V(1.4, 2.2, -0.7), 40), shot(V(3.6, 2.1, 5.6), V(1.5, 2.5, -0.7), 42));
    return { shot: s, imax: u < 2.8 ? 0.6 : 0, grade: { sat: 1.1, contrast: 1.18, vignette: 0.75, gain: new THREE.Color(1.15, 0.95, 0.8) } };
  }
  void torch; void ball;
  return { scene, update, cues };
}

/* ---------------------------------------------------------------- the scribe */

export function scribe(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c10);
  lights(scene, { sky: 0x8a9ac8, ground: 0x2a2018, fill: 0.6, key: 0xaab8ff, keyI: 0.9, from: V(-8, 10, 2), span: 8 });
  scene.add(room(12, 10, 7, { wall: stoneTex("#8a8076", 12), floor: stoneTex("#5a5048", 13) }));
  const win = archWindow(1.6, 3.2, 0xc8d4ff);
  win.position.set(-2, 2.2, -4.95);
  scene.add(win);
  // shelves of books
  [-4.5, 4.5].forEach((x) => {
    const shelf = box(1.4, 4.5, 0.8, 0x5a3a22, 0.02);
    shelf.position.set(x, 0, -4.4);
    scene.add(shelf);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) {
      const bk = box(0.16, 0.7 + (i % 3) * 0.08, 0.5, [0x8c2f39, 0x2b3f8f, 0x3a6b3a, 0x7a5a2a][(i + r) % 4], 0.006);
      bk.position.set(x - 0.5 + i * 0.2, 0.3 + r * 1.05, -4.1);
      scene.add(bk);
    }
  });
  const desk = table(3, 1.6, 1.3, 0x6b4a33);
  desk.position.set(0, 0, -1.2);
  scene.add(desk);
  const lectern = box(2.2, 0.1, 1.2, 0x5a3a22, 0.015);
  lectern.position.set(0, 1.3, -1.3);
  lectern.rotation.x = 0.25;
  scene.add(lectern);
  // the illuminated page, with a modern note at the bottom
  const page = picture(2.0, 1.1, canvasTexture(640, 352, (ctx, W, H) => {
    ctx.fillStyle = "#f3e6c4"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e0cfa0"; ctx.fillRect(W / 2 - 2, 0, 4, H);
    const drop = (x: number) => {
      ctx.fillStyle = "#2b3f8f"; ctx.fillRect(x, 26, 64, 64);
      ctx.fillStyle = "#e8b64a"; ctx.font = "700 54px Cinzel, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(x < W / 2 ? "V" : "G", x + 32, 60);
    };
    drop(26); drop(W / 2 + 26);
    ctx.fillStyle = "#3a2a1c"; ctx.font = "400 17px 'IM Fell English', serif"; ctx.textAlign = "left";
    const lines = ["In principio erat codex,", "et codex erat apud VGang,", "et deploy fiebat die Veneris…", "", "Liber I · caput II"];
    lines.forEach((l, i) => ctx.fillText(l, 100, 44 + i * 26));
    ["Hello, world.", "Ora et compila.", "Amen, merge.", ""].forEach((l, i) => ctx.fillText(l, W / 2 + 100, 44 + i * 26));
    ctx.fillStyle = "#a4161a"; ctx.font = "400 22px 'Permanent Marker', cursive";
    ctx.fillText("// TODO: fix bug", 40, H - 60);
    ctx.fillText("before release!!", 60, H - 30);
    drawMascot(ctx, W * 0.78, H - 110, 90, "#badb96", "#234d37");
    ctx.strokeStyle = "#c99a3c"; ctx.lineWidth = 6; ctx.strokeRect(12, 12, W - 24, H - 24);
  }), true);
  page.position.set(0, 1.42, -1.25);
  page.rotation.x = -Math.PI / 2 + 0.25;
  scene.add(page);
  const candles = [-1.2, 1.2].map((x) => { const c = candle(0.5); c.position.set(x, 1.3, -1.8); scene.add(c); return c; });
  const warm = new THREE.PointLight(0xffc070, 6, 8, 1.4);
  warm.position.set(0, 2.4, -2.2);
  scene.add(warm);
  const inkpot = cyl(0.12, 0.1, 0.18, 0x1a1a24, 10, 0.01);
  inkpot.position.set(0.9, 1.3, -0.9);
  scene.add(inkpot);
  const hero = dressed(who("huytdps13400"));
  hero.root.scale.setScalar(0.9);
  hero.root.position.set(0.1, 0.55, 0.5);
  hero.root.rotation.y = Math.PI;
  monkHood(hero);
  const stool = cyl(0.6, 0.6, 0.55, 0x5a3a22, 12, 0.02);
  stool.position.set(0.1, 0, 0.6);
  scene.add(stool);
  const q = quill();
  hero.rightHand.add(q);
  q.position.set(0, 0.2, 0.1);
  q.rotation.z = -0.4;
  scene.add(hero.root);

  const cues: Cues = [
    [0.2, { kind: "sfx", name: "quill", volume: 0.8 }],
    [1.2, { kind: "sfx", name: "quill", volume: 0.8 }],
    [2.2, { kind: "sfx", name: "bell", volume: 0.4 }],
    [3.3, { kind: "pop", text: "…TODO?!", at: V(0.2, 2.4, -1.2), big: true }],
    [3.3, { kind: "sfx", name: "pop-2", volume: 0.8 }],
  ];
  function update(u: number): Frame {
    flicker(scene, u);
    hero.update(u);
    hero.rightHand.position.copy(hero.rest.right).add(V(Math.sin(u * 9) * 0.12, 0.3 + Math.abs(Math.sin(u * 14)) * 0.05, 0.4));
    void candles;
    let s;
    if (u < 2.4) s = move(u, 0, 2.4, shot(V(-2.2, 3.4, -4.4), V(0.1, 1.9, 0.4), 40), shot(V(-1.7, 3.2, -4.0), V(0.1, 1.9, 0.4), 38));
    else s = move(u, 2.4, 5, shot(V(0.0, 3.0, 0.3), V(0, 1.35, -1.3), 32), shot(V(0.0, 2.7, -0.3), V(0, 1.35, -1.25), 30));
    return { shot: s, grade: { sat: 0.95, contrast: 1.15, vignette: 0.8, gain: new THREE.Color(1.06, 0.98, 0.9) } };
  }
  void plankTex; void ease;
  return { scene, update, cues };
}

void hex;
