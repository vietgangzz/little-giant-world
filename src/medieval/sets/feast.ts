import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW, LITTLE_GIANT } from "../../crew";
import { ball, box, cyl, ease, lights, move, seeded, seg, shot, V, type FilmSet, type Frame, motes } from "../../film/kit";
import { archWindow, banner, candle, flicker, room, stoneTex, table, tankard, torch } from "../props";
import { apron, crown, helm, jesterHat, mantle, painterBeret, sword, wizardHat } from "../wardrobe";
import { cloak, dirt, raggedHat, rags, shackles } from "../../film/makeup";

/**
 * The feast in the great hall: everyone in their new job's clothes round one
 * long table. King Phong knights Little Giant, and the whole kingdom raises a
 * tankard — 1, 2, 3, ZÔ!
 */
export function feast(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x140e0c);
  lights(scene, { sky: 0xffe0b8, ground: 0x3a2418, fill: 1.2, key: 0xffe8c8, keyI: 1.8, from: V(-3, 12, 8), span: 12 });
  scene.add(room(20, 20, 11, { wall: stoneTex("#a89c8c", 16), floor: stoneTex("#7a7068", 17) }));
  [-6, -2, 2, 6].forEach((x, i) => { const b = banner(i % 2 ? 0xa4161a : 0x2b3f8f, 1.8, 5); b.position.set(x, 9.5, -9.9); scene.add(b); });
  [-9.9, 9.9].forEach((x) => [-5, 1].forEach((z) => { const w = archWindow(1.6, 3.4); w.position.set(x, 3.4, z); w.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(w); }));
  [-8, 8].forEach((x) => [-8, 4].forEach((z) => { const t = torch(); t.position.set(x > 0 ? 9.7 : -9.7, 3, z); scene.add(t); }));
  const hearth = box(4, 3, 1, 0x6b5f55, 0.03);
  hearth.position.set(0, 0, -9.5);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.5, 10), new THREE.MeshBasicMaterial({ color: 0xff9030 }));
  fire.position.set(0, 0.8, -8.9);
  fire.userData.flame = fire;
  const fireL = new THREE.PointLight(0xff9040, 18, 12, 1.4);
  fireL.position.set(0, 1.5, -8);
  fire.userData.light = fireL;
  scene.add(hearth, fire, fireL);
  // the long table, laden
  const long = table(12, 2.6, 1.1, 0x7a5230);
  long.position.set(0, 0, -1);
  scene.add(long);
  const rand = seeded(12);
  for (let i = 0; i < 12; i++) {
    const x = -5.4 + i;
    const plate = cyl(0.3, 0.3, 0.04, 0xe8dcc0, 14, 0.008);
    plate.position.set(x, 1.1, -1 + (i % 2 ? 0.7 : -0.7));
    scene.add(plate);
    if (i % 3 === 0) {
      const roast = ball(0.35, 0xb5651d, 0.02, 12);
      roast.scale.set(1.3, 0.8, 1);
      roast.position.set(x + 0.4, 1.35, -1);
      scene.add(roast);
    } else if (i % 3 === 1) {
      const bread = ball(0.25, 0xd9a55a, 0.015, 10);
      bread.scale.set(1.4, 0.7, 0.9);
      bread.position.set(x + 0.4, 1.25, -1);
      scene.add(bread);
    } else {
      for (let k = 0; k < 4; k++) { const f = ball(0.1, [0xe63946, 0x7fae4e, 0xffc93c][k % 3], 0.008, 8); f.position.set(x + 0.3 + rand() * 0.3, 1.2, -1 + (rand() - 0.5) * 0.3); scene.add(f); }
    }
    if (i % 4 === 2) { const c = candle(0.6); c.position.set(x, 1.1, -1); scene.add(c); }
  }
  // a candle chandelier overhead
  const chandelier = new THREE.Group();
  const ring = cyl(2.4, 2.4, 0.2, 0x3a2a1c, 20, 0.02);
  chandelier.add(ring);
  for (let i = 0; i < 8; i++) { const c = candle(0.4); const a = (i / 8) * Math.PI * 2; c.position.set(Math.sin(a) * 2.3, 0.2, Math.cos(a) * 2.3); chandelier.add(c); }
  chandelier.position.set(0, 7.2, -1);
  scene.add(chandelier);

  // everyone, in costume
  const people = [LITTLE_GIANT, ...CREW].map((member) => {
    const m = dressed(member, { kit: member.kit !== "director" });
    m.root.scale.setScalar(0.85);
    scene.add(m.root);
    return { m, member };
  });
  const by = (h: string) => people.find((p) => p.member.handle === h)!.m;
  const k = by("nnphong1904");
  crown(k, 1.15); mantle(k);
  const blade = sword(1.5);
  k.rightHand.add(blade);
  blade.position.set(0, 0.1, 0.2);
  helm(by("baronha")).setVisor(0);
  by("baronha").parts.cigarette.visible = by("baronha").parts.smoke.visible = false;
  jesterHat(by("giaBaoJS"));
  painterBeret(by("anhquan291")); by("anhquan291").parts.suitcase.visible = false;
  apron(by("tuanngocptn"));
  { const d = by("huytdps13400"); d.parts.backpack.visible = false; rags(d); dirt(d); shackles(d); }
  wizardHat(by("khoatranthanh"));
  { const d = by("dennytosp"); d.parts.cap.visible = d.parts.bag.visible = d.parts.strap.visible = false; raggedHat(d); cloak(d); dirt(d, 0.9); }
  const hero = by("vietgang");
  // seats: the king at the head of the table, the rest down both sides
  // the crew along the far side of the table, facing the hall (and us)
  ["giaBaoJS", "huytdps13400", "anhquan291", "dennytosp", "baronha", "khoatranthanh", "tuanngocptn", "ritesh"].forEach((h, i) => {
    const m = by(h);
    m.root.position.set(-4.4 + i * 1.3, 0.3, -2.6 + (i % 2) * 0.15);
    m.root.rotation.y = (i - 3.5) * -0.05;
  });
  const mugs = people.filter((p) => p.member.handle !== "nnphong1904").map(({ m }) => { const t = tankard(); m.rightHand.add(t); t.position.set(0.1, 0.05, 0.1); t.visible = false; return t; });

  const cues: FilmSet["cues"] = [
    [0.2, { kind: "sfx", name: "sword", volume: 0.9 }],
    [1.0, { kind: "sfx", name: "clang", volume: 0.5, rate: 1.3 }],
    [1.6, { kind: "sfx", name: "clang", volume: 0.5, rate: 1.3 }],
    [2.1, { kind: "pop", text: "ARISE, SIR LITTLE GIANT!", at: V(-6.5, 3.8, -1), big: true }],
    [2.2, { kind: "sfx", name: "cheer", volume: 0.8 }],
    [3.2, { kind: "pop", text: "1·2·3…", at: V(0, 3.6, -1) }],
    [4.0, { kind: "pop", text: "ZÔ!!!", at: V(0, 4.2, -1), big: true }],
    [4.0, { kind: "sfx", name: "clink", volume: 1 }],
    [4.05, { kind: "sfx", name: "chant", volume: 0.9 }],
  ];
  const air0 = motes(scene, { count: 160, color: 0xffc070, size: 0.05, center: V(0, 4, -2), spread: V(18, 8, 16), rise: 0.2, opacity: 0.6, twinkle: true });
  function update(u: number): Frame {
    air0(u);
    flicker(scene, u);
    people.forEach(({ m }, i) => { m.update(u + i * 0.2); m.cheering = u > 4.0 ? 1 : u > 2.2 && u < 2.9 ? 0.7 : 0; });
    // the king at the head of the table, Little Giant kneeling before him
    k.root.position.set(-7.2, 0, -1);
    k.root.rotation.y = Math.PI / 2;
    const kneel = u < 2.2;
    hero.root.position.set(-5.6, 0, -1);
    hero.root.rotation.y = -Math.PI / 2;
    hero.rig.rotation.x = kneel ? 0.35 : 0;
    hero.root.scale.setScalar(0.85);
    // the sword touches one shoulder, then the other
    const tap = u < 1.0 ? 0 : u < 1.6 ? 1 : u < 2.2 ? -1 : 0;
    blade.rotation.set(tap ? -1.35 : 0, 0, tap * 0.35);
    if (u > 2.2 && u < 2.26) hero.hop(2.22, 0.8, 0.5);
    mugs.forEach((t) => (t.visible = u > 2.9));
    let s;
    if (u < 2.8) s = move(u, 0, 2.8, shot(V(-6.2, 2.6, 5.4), V(-6.4, 1.7, -1), 38), shot(V(-6.3, 2.3, 4.2), V(-6.4, 1.8, -1), 36));
    else s = move(u, 2.8, 5.5, shot(V(0, 3.4, 7.5), V(0, 1.6, -1.2), 42), shot(V(0, 8.8, 10.5), V(0, 2.2, -2), 46), (x) => ease(x));
    return { shot: s, imax: seg(u, 3.6, 4.6), grade: { sat: 1.12, contrast: 1.08, vignette: 0.6, gain: new THREE.Color(1.1, 0.98, 0.86) } };
  }
  return { scene, update, cues };
}
