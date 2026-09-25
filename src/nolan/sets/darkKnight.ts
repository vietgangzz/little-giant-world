import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { detonator, greenHair, jokerMakeup, purpleSuit } from "../../film/makeup";
import { ball, box, canvasTexture, cyl, ease, lights, move, picture, seeded, seg, shot, skyDome, V, windows, type FilmSet, type Frame, flock, motes } from "../../film/kit";

/**
 * THE DARK KNIGHT — Bao Ha as the Joker. Green hair, white greasepaint, the
 * long red smile. He strolls out of Gotham General, presses the button, the
 * windows go one by one… then nothing. A shake of the remote. Then everything.
 */
function car(color: number, stripe?: number) {
  const g = new THREE.Group();
  const body = box(2.0, 0.7, 4.2, color, 0.03);
  body.position.y = 0.3;
  const cabin = box(1.7, 0.6, 2.2, 0x2b3038, 0.025);
  cabin.position.set(0, 1.0, -0.3);
  g.add(body, cabin);
  if (stripe !== undefined) {
    const band = box(2.02, 0.16, 4.22, stripe, 0);
    band.position.y = 0.55;
    const bar = box(1.2, 0.14, 0.3, 0xe63946, 0.01);
    bar.position.set(0, 1.62, -0.3);
    const blue = box(0.5, 0.15, 0.3, 0x3a86ff, 0);
    blue.position.set(0.35, 1.63, -0.3);
    g.add(band, bar, blue);
  }
  [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]].forEach(([x, z]) => {
    const w = inked(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14), toon(0x16181c), 0.015);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.38, z);
    g.add(w);
  });
  return g;
}

function schoolBus() {
  const g = new THREE.Group();
  const body = box(2.6, 2.4, 9, 0xf2b705, 0.04);
  body.position.y = 0.4;
  const stripe = box(2.62, 0.14, 9.02, 0x1c1a24, 0);
  stripe.position.y = 1.4;
  g.add(body, stripe);
  for (let i = 0; i < 6; i++) [-1, 1].forEach((sd) => { const w = box(0.04, 0.7, 1.0, 0x2b3038, 0); w.position.set(sd * 1.31, 1.8, -3.2 + i * 1.3); g.add(w); });
  [[-1.2, 3], [1.2, 3], [-1.2, -3], [1.2, -3]].forEach(([x, z]) => {
    const w = inked(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 14), toon(0x16181c), 0.015);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w);
  });
  return g;
}

export function darkKnight(): FilmSet {
  const bao = CREW.find((c) => c.handle === "baronha")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xaab0b8, 45, 160);
  scene.add(skyDome(0x8c96a4, 0x9aa0a8, 0xc8ccd0));
  const { hemi } = lights(scene, { sky: 0xe6ecf4, ground: 0x6a6660, fill: 1.3, key: 0xf4f2ec, keyI: 1.6, from: V(-8, 14, 10), span: 22, focus: V(0, 0, -6) });

  // street, kerb, parking bays and lane markings
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshToonMaterial({
    map: canvasTexture(128, 128, (ctx, W, H) => {
      ctx.fillStyle = "#4a4c52"; ctx.fillRect(0, 0, W, H);
      const r = seeded(4);
      for (let i = 0; i < 200; i++) { ctx.fillStyle = r() < 0.5 ? "#44464c" : "#52545a"; ctx.fillRect(r() * W, r() * H, 2, 2); }
    }, [40, 40]),
  }));
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.receiveShadow = true;
  scene.add(asphalt);
  const sidewalk = box(80, 0.2, 10, 0xa9a59c, 0.02);
  sidewalk.position.set(0, 0, -7);
  scene.add(sidewalk);
  for (let x = -30; x <= 30; x += 4) { const line = box(0.2, 0.01, 2.2, 0xe8e2d0, 0); line.position.set(x, 0.01, 4); scene.add(line); }
  for (let x = -36; x <= 36; x += 6) { const dash = box(2.4, 0.01, 0.18, 0xf2c94c, 0); dash.position.set(x, 0.011, 10); scene.add(dash); }

  // GOTHAM GENERAL: a long block with two wings, a canopy, and a red-cross sign
  const hosp = new THREE.Group();
  const face = windows("#d9d4c8", "#6e7f8f", "#f2f0e0", 10, 5, 12, 0.1);
  face.wrapS = face.wrapT = THREE.RepeatWrapping;
  face.repeat.set(3, 1);
  const main = box(40, 16, 12, new THREE.MeshToonMaterial({ map: face }), 0.05);
  const roofline = box(41, 0.8, 12.6, 0x9a958a, 0.03);
  roofline.position.y = 16;
  hosp.add(main, roofline);
  const wingTex = face.clone(); wingTex.repeat.set(1.2, 1.4); wingTex.needsUpdate = true;
  const wings = [-24, 24].map((x) => { const w = box(10, 20, 14, new THREE.MeshToonMaterial({ map: wingTex }), 0.05); w.position.set(x, 0, -2); hosp.add(w); return w; });
  const canopy = box(10, 0.5, 5, 0xe8e4da, 0.03);
  canopy.position.set(0, 4, 8);
  [-4.5, 4.5].forEach((x) => { const p = cyl(0.2, 0.2, 4, 0xe8e4da, 10, 0.02); p.position.set(x, 0, 10); hosp.add(p); });
  const doors = box(6, 3.6, 0.2, 0x7fa4b8, 0.02);
  doors.position.set(0, 0, 6.05);
  hosp.add(canopy, doors);
  const sign = picture(16, 2.2, canvasTexture(1024, 140, (ctx, W, H) => {
    ctx.fillStyle = "#1f3b5a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f4f1ea"; ctx.font = "700 76px Oswald, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("GOTHAM GENERAL HOSPITAL", W / 2 + 40, H / 2 + 4);
    ctx.fillStyle = "#f4f1ea"; ctx.fillRect(40, 30, 80, 80);
    ctx.fillStyle = "#d62828"; ctx.fillRect(70, 38, 20, 64); ctx.fillRect(48, 60, 64, 20);
  }), true);
  sign.position.set(0, 12.6, 6.1);
  hosp.add(sign);
  hosp.position.set(0, 0, -20);
  scene.add(hosp);
  // Gotham behind it
  const rand = seeded(31);
  for (let i = 0; i < 26; i++) {
    const h = 20 + rand() * 40, w = 6 + rand() * 8;
    const t = windows("#6a7280", "#4a5260", "#c8d0da", 5, 12, i, 0.2);
    const b = box(w, h, w, new THREE.MeshToonMaterial({ map: t }), 0.04);
    b.position.set(-70 + i * 5.6 + rand() * 3, 0, -50 - rand() * 30);
    scene.add(b);
  }
  // cars in the lot, a police car, an ambulance, and the yellow school bus at the kerb
  ([[-14, 1.5, 0x8a3a3a], [-9, 1.5, 0x3a5a8a], [9, 1.5, 0xd9d4c8], [14, 1.5, 0x2b3038]] as [number, number, number][]).forEach(([x, z, c]) => { const k = car(c); k.position.set(x, 0, z); scene.add(k); });
  const cop = car(0x1c1f26, 0xf4f1ea);
  cop.position.set(-18, 0, 9.5);
  cop.rotation.y = Math.PI / 2;
  const amb = car(0xf4f1ea, 0xd62828);
  amb.position.set(18, 0, 1.5);
  amb.scale.set(1.1, 1.3, 1.2);
  const bus = schoolBus();
  bus.position.set(-16, 0, 13);
  bus.rotation.y = Math.PI / 2;
  scene.add(cop, amb, bus);
  for (const x of [-24, -12, 12, 24]) {
    const lamp = cyl(0.1, 0.08, 6, 0x2b2b30, 8, 0.015);
    lamp.position.set(x, 0, 7.5);
    const arm = box(1.4, 0.12, 0.12, 0x2b2b30, 0.01);
    arm.position.set(x + 0.6, 6, 7.5);
    scene.add(lamp, arm);
  }

  // the Joker
  const hero = dressed(bao);
  hero.root.scale.setScalar(1);
  hero.parts.shades.visible = hero.parts.cigarette.visible = hero.parts.smoke.visible = false;
  jokerMakeup(hero);
  greenHair(hero);
  purpleSuit(hero);
  const remote = detonator();
  hero.rightHand.add(remote);
  remote.position.set(0.05, 0.12, 0.12);
  scene.add(hero.root);

  // explosions: a run of window blasts, then the whole building
  type Blast = { at: number; pos: THREE.Vector3; size: number; core: THREE.Mesh; fire: THREE.Mesh; smoke: THREE.Mesh[] };
  const blastAt = (at: number, pos: THREE.Vector3, size: number): Blast => {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true }));
    const fire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true }));
    const smoke = Array.from({ length: 4 }, () => { const s = ball(1, toon(0x55575c), 0.03, 10); scene.add(s); return s; });
    scene.add(fire, core);
    return { at, pos, size, core, fire, smoke };
  };
  const blasts: Blast[] = [
    ...[[-14, 6], [-6, 11], [4, 5], [12, 10], [-18, 13], [17, 4]].map(([x, y], i) => blastAt(1.95 + i * 0.13, V(x, y, -13.5), 2.6)),
    ...[-16, -6, 4, 14].map((x, i) => blastAt(3.5 + i * 0.05, V(x, 8, -16), 9)),
  ];
  const flash = new THREE.PointLight(0xffa050, 0, 120, 1);
  flash.position.set(0, 10, -8);
  scene.add(flash);
  // the collapse throws up a rolling wall of dust: a row of billows, not one ball
  const dust = Array.from({ length: 12 }, (_, i) => { const b = ball(1, toon(i % 2 ? 0xa8a296 : 0x8f897e), 0.04, 12); scene.add(b); return b; });

  const cues: FilmSet["cues"] = [
    [0.1, { kind: "sfx", name: "steps", volume: 0.6 }],
    [1.8, { kind: "sfx", name: "mic", volume: 0.9 }],
    [1.85, { kind: "pop", text: "*click*", at: V(1.6, 2.6, 2) }],
    ...[0, 1, 2, 3, 4, 5].map((i): [number, FilmSet["cues"][number][1]] => [1.95 + i * 0.13, { kind: "sfx", name: "crash", volume: 0.55, rate: 0.8 + i * 0.05 }]),
    [2.9, { kind: "pop", text: "…?", at: V(1.2, 3.4, 2), big: true }],
    [3.0, { kind: "sfx", name: "shake", volume: 0.8 }],
    [3.25, { kind: "sfx", name: "mic", volume: 0.9 }],
    [3.45, { kind: "sfx", name: "boom", volume: 1 }],
    [3.5, { kind: "pop", text: "KA-BOOM!", at: V(0, 18, -14), big: true }],
    [4.3, { kind: "pop", text: "HA HA HA!", at: V(-0.6, 3.2, 3.8) }],
  ];

  const air0 = motes(scene, { count: 260, color: 0xd8d2c8, size: 0.07, center: V(0, 6, -6), spread: V(30, 12, 24), rise: -0.6, drift: 0.6, opacity: 0.55 });
  const air1 = flock(scene, 7, V(-10, 22, -40), V(1, 0, 0.2));
  function update(u: number): Frame {
    air0(u);
    air1(u);
    hero.update(u);
    // the walk: out through the doors and across the lot towards us
    const walk = u * 0.8;
    hero.root.position.set(0.6 + Math.sin(u * 3) * 0.08, Math.abs(Math.sin(u * 7)) * 0.08, -12.5 + walk * 3);
    hero.root.rotation.y = Math.sin(u * 3.5) * 0.12;
    hero.rig.rotation.z = Math.sin(u * 7) * 0.05;
    // hand up with the remote at the click, a baffled shake, then again
    const aim = seg(u, 1.5, 1.75) * (1 - seg(u, 2.4, 2.7));
    const again = seg(u, 2.85, 3.0) * (1 - seg(u, 3.5, 3.8));
    hero.rightHand.position.copy(hero.rest.right).add(V(0.1, (aim + again) * 0.7, 0.2 + (aim + again) * 0.2));
    if (u > 2.95 && u < 3.25) hero.rightHand.position.x += Math.sin(u * 60) * 0.08;
    remote.rotation.z = again * 0.3;
    (remote.userData.button as THREE.Mesh).scale.y = (u > 1.78 && u < 1.9) || (u > 3.22 && u < 3.34) ? 0.3 : 1;
    hero.cheering = u > 4.1 ? 0.6 : 0;

    let heat = 0;
    blasts.forEach((b) => {
      const k = u - b.at;
      const live = k > 0;
      const g = live ? 1 - Math.pow(1 - Math.min(1, k / 0.6), 3) : 0;
      b.core.visible = b.fire.visible = live && k < 1.4;
      b.core.position.copy(b.pos);
      b.fire.position.copy(b.pos);
      b.core.scale.setScalar(b.size * (0.4 + g * 0.6) * 0.6);
      b.fire.scale.setScalar(b.size * (0.4 + g * 0.7));
      (b.core.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k / 1.2);
      (b.fire.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k / 1.5);
      b.smoke.forEach((s, i) => {
        s.visible = live;
        s.position.copy(b.pos).add(V(Math.sin(i * 2.1) * b.size * 0.5, g * b.size * 0.6 + i * b.size * 0.25 + k * 1.2, Math.cos(i * 1.7) * b.size * 0.3 + 1));
        s.scale.setScalar(b.size * (0.3 + g * 0.45) * (1 + k * 0.2));
      });
      if (live && k < 0.8) heat = Math.max(heat, (1 - k / 0.8) * (b.size > 5 ? 1 : 0.35));
    });
    flash.intensity = heat * 380;
    hemi.intensity = 1.3 + heat * 0.4;
    // the big one: the main block sinks into its own dust
    const fall = ease(seg(u, 3.6, 5));
    main.scale.y = 1 - fall * 0.55;
    roofline.position.y = 16 * (1 - fall * 0.55);
    wings.forEach((w, i) => { w.rotation.z = fall * (i ? -0.12 : 0.12); w.scale.y = 1 - fall * 0.3; });
    sign.position.y = 12.6 * (1 - fall * 0.5);
    sign.rotation.z = fall * 0.25;
    dust.forEach((b, i) => {
      b.visible = u > 3.6;
      const x = -22 + i * 4;
      b.position.set(x, 0.5 + fall * (1.5 + (i % 3)), -13 + fall * 2 + (i % 2) * 1.5);
      b.scale.setScalar(1.2 + fall * (2.2 + (i % 4) * 0.5));
    });

    let s;
    if (u < 1.9) {
      // backing away in front of him as he walks, the hospital filling the frame behind
      const z = -12.5 + walk * 3;
      s = shot(V(1.6, 2.0, z + 5.2), V(0.6, 2.4, z - 4), 40);
    } else {
      // wide and low from the street: him walking towards us, the building going up behind
      s = move(u, 1.9, 5, shot(V(3.6, 1.3, 9.5), V(-0.5, 5.5, -14), 48), shot(V(3.9, 1.2, 10.5), V(-0.5, 6.5, -14), 50));
    }
    const shake = seg(u, 3.45, 3.6) * (1 - seg(u, 3.6, 4.6)) * 0.3 + (u > 1.95 && u < 2.8 ? 0.04 : 0);
    return {
      shot: s, imax: u < 1.9 ? 0 : seg(u, 1.9, 2.3), shake,
      grade: { sat: 0.82, contrast: 1.16, vignette: 0.6, lift: new THREE.Color(0.02, 0.03, 0.04), gain: new THREE.Color(1.0, 1.0, 1.06) },
    };
  }
  return { scene, update, cues };
}
