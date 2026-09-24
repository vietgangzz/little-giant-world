import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { box, canvasTexture, cyl, ease, lights, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../kit";
import { lerp } from "../../noise";

/**
 * TENET — a temporal pincer on a concrete plaza. Ritesh walks forwards on the
 * red side, his inverted self walks backwards on the blue side; a phone falls
 * up into his hand, glass un-shatters, a flipped car rights itself. The camera
 * move is a palindrome: it runs in, then retraces itself exactly.
 */
function sedan(color: number) {
  const g = new THREE.Group();
  const body = box(2.0, 0.6, 4.2, color, 0.04);
  body.position.y = 0.35;
  const cabin = box(1.7, 0.6, 2.2, 0x2b3038, 0.03);
  cabin.position.set(0, 0.95, -0.2);
  g.add(body, cabin);
  [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]].forEach(([x, z]) => {
    const w = inked(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16), toon(0x16181c), 0.02);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.38, z);
    g.add(w);
  });
  return g;
}

export function tenet(): FilmSet {
  const ritesh = CREW.find((c) => c.handle === "ritesh")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb8bcc2, 30, 90);
  scene.add(skyDome(0xa9b4c2, 0xb8bcc2, 0xd8dce0));
  lights(scene, { sky: 0xeef1f6, ground: 0x6d6a66, fill: 1.3, key: 0xfff6ea, keyI: 2.2, from: V(-3, 14, 10), span: 14 });

  const concrete = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = "#a7a39d"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#8f8b85"; ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); ctx.moveTo(0, i * 64); ctx.lineTo(W, i * 64); ctx.stroke(); }
  }, [16, 16]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshToonMaterial({ map: concrete }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // the palindrome, painted on the plaza: SATOR / AREPO / TENET / OPERA / ROTAS
  const sator = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false,
    map: canvasTexture(256, 256, (ctx, W) => {
      ctx.fillStyle = "rgba(40,40,44,0.5)"; ctx.font = "700 40px Oswald, Impact, sans-serif"; ctx.textAlign = "center";
      ["SATOR", "AREPO", "TENET", "OPERA", "ROTAS"].forEach((w, i) => ctx.fillText(w.split("").join(" "), W / 2, 44 + i * 48));
    }),
  }));
  sator.rotation.x = -Math.PI / 2;
  sator.position.set(0, 0.01, 3.2);
  scene.add(sator);

  // brutalist backdrop: banded concrete block and a colonnade
  const block = box(40, 14, 6, new THREE.MeshToonMaterial({
    map: canvasTexture(256, 128, (ctx, W, H) => {
      ctx.fillStyle = "#9c988f"; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16) { ctx.fillStyle = "#6f6b64"; ctx.fillRect(0, y + 10, W, 4); }
      for (let x = 8; x < W; x += 24) { ctx.fillStyle = "#2f3136"; ctx.fillRect(x, 20, 12, 90); }
    }, [3, 1]),
  }), 0.05);
  block.position.set(0, 0, -16);
  scene.add(block);
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i) < 1) continue;
    const col = box(0.9, 7, 0.9, 0xb3afa7, 0.03);
    col.position.set(i * 3.2, 0, -8);
    scene.add(col);
  }

  // the turnstile: a big glass drum, red half and blue half
  const turn = new THREE.Group();
  const frame = cyl(2.6, 2.6, 0.3, 0x2f3136, 32, 0.03);
  const cap = frame.clone();
  cap.position.y = 4.2;
  const glassMat = (c: number) => new THREE.MeshToonMaterial({ color: c, transparent: true, opacity: 0.45, side: THREE.DoubleSide, gradientMap: toon(c).gradientMap });
  const left = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.9, 32, 1, true, Math.PI, Math.PI), glassMat(0xe04848));
  const right = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.9, 32, 1, true, 0, Math.PI), glassMat(0x4880e0));
  left.position.y = right.position.y = 2.25;
  const vane = box(0.12, 3.9, 5, 0x2f3136, 0.02);
  vane.position.y = 0.3;
  turn.add(frame, cap, left, right, vane);
  turn.position.set(0, 0, -3.5);
  scene.add(turn);

  // Ritesh and his inverted self
  const hero = dressed(ritesh);
  hero.root.scale.setScalar(1);
  scene.add(hero.root);
  const twin = dressed(ritesh);
  twin.root.scale.setScalar(1);
  twin.parts.phone.visible = true;
  scene.add(twin.root);
  // a blue wash over the twin: every material on it swapped for a cooler copy
  twin.root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !(mesh.material as THREE.MeshToonMaterial).color) return;
    const m = (mesh.material as THREE.MeshToonMaterial).clone();
    if (m.color) m.color.lerp(new THREE.Color(0x5a8fe0), 0.35);
    mesh.material = m;
  });
  const loosePhone = hero.parts.phone.clone();
  scene.add(loosePhone);

  // glass that un-shatters, and a car that un-flips
  const pane = new THREE.Group();
  const rand = seeded(12);
  const shards = Array.from({ length: 14 }, () => {
    const s = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(rand() * 0.9 + 0.3, rand() * 0.4, 0), V(rand() * 0.4, rand() * 0.9 + 0.3, 0)]),
      new THREE.MeshBasicMaterial({ color: 0xcfe3f0, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    const home = V((rand() - 0.5) * 2.0 - 0.3, 1 + rand() * 1.9, 0);
    const away = home.clone().add(V((rand() - 0.5) * 6, (rand() - 0.6) * 3, 3 + rand() * 4));
    pane.add(s);
    return { s, home, away, spin: V(rand() * 6, rand() * 6, rand() * 6) };
  });
  // an empty window frame for the glass to fly back into
  [[0, 0.6, 2.8, 0.14], [0, 3.66, 2.8, 0.14], [-1.33, 0.6, 0.14, 3.2], [1.33, 0.6, 0.14, 3.2]].forEach(([x, y, w, h]) => {
    const bar = box(w, h, 0.14, 0x2f3136, 0.02);
    bar.position.set(x, y, 0);
    pane.add(bar);
  });
  pane.position.set(-7, 0, -5);
  pane.rotation.y = 0.5;
  scene.add(pane);
  const car = sedan(0x3a4a5a);
  scene.add(car);
  const birds = Array.from({ length: 5 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V(-0.4, 0.15, 0), V(0, 0, 0), V(0.4, 0.15, 0)]), new THREE.LineBasicMaterial({ color: 0x2a2c30 }));
    const line = new THREE.Line(b.geometry, b.material as THREE.LineBasicMaterial);
    scene.add(line);
    return { line, i };
  });

  const cues: FilmSet["cues"] = [
    [0.05, { kind: "sfx", name: "shatter", volume: 0.8, reverse: true }],
    [0.7, { kind: "sfx", name: "whoosh", volume: 0.8, reverse: true }],
    [1.3, { kind: "sfx", name: "pop-2", volume: 0.8, reverse: true }],
    [2.45, { kind: "sfx", name: "braam", volume: 0.7, reverse: true }],
    [2.5, { kind: "pop", text: "!TENET", at: V(0, 3.6, -1.2), big: true }],
    [2.7, { kind: "sfx", name: "crash", volume: 0.9, reverse: true }],
  ];

  function update(u: number): Frame {
    // the whole scene is a palindrome around u = 2.5
    const p = 2.5 - Math.abs(u - 2.5);
    hero.update(u);
    twin.update(5 - u);
    const approach = ease(seg(p, 0, 2.5));
    hero.root.position.set(lerp(-5.2, -1.3, approach), 0, 0.8);
    hero.root.rotation.y = u < 2.5 ? Math.PI / 2 - 0.25 : -Math.PI / 2 + 0.25;
    twin.root.position.set(lerp(5.2, 1.3, approach), 0, 0.8);
    twin.root.rotation.y = u < 2.5 ? -Math.PI / 2 - 0.25 + Math.PI : Math.PI / 2 + 0.25 + Math.PI;
    // walking forwards vs. backwards: the same bob, the twin's played in reverse
    hero.rig.position.y = Math.abs(Math.sin(u * 7)) * 0.12;
    twin.rig.position.y = Math.abs(Math.sin((5 - u) * 7)) * 0.12;
    hero.cheering = twin.cheering = Math.abs(u - 2.5) < 0.5 ? 1 : 0;

    // the phone falls UP from the floor into his hand
    const catchT = seg(u, 0.6, 1.3);
    hero.parts.phone.visible = catchT >= 1;
    loosePhone.visible = catchT < 1;
    hero.leftHand.updateWorldMatrix(true, false);
    const handAt = hero.parts.phone.getWorldPosition(V(0, 0, 0));
    const floorAt = hero.root.position.clone().add(V(-0.6, 0.05, 1.2));
    const k = catchT * catchT;
    loosePhone.position.copy(floorAt).lerp(handAt, k);
    loosePhone.position.y += Math.sin(catchT * Math.PI) * 0.4;
    loosePhone.rotation.set(-Math.PI / 2 * (1 - k), catchT * 6, 0);
    loosePhone.scale.setScalar(1);

    // glass flies back together over the first second and a half
    const mend = ease(seg(u, 0, 1.6));
    shards.forEach((s) => {
      s.s.position.copy(s.away).lerp(s.home, mend);
      s.s.rotation.set(s.spin.x * (1 - mend), s.spin.y * (1 - mend), s.spin.z * (1 - mend));
    });
    // the car: upside down on the roof, rolls back over and reverses away
    const unflip = ease(seg(u, 2.6, 3.8));
    car.position.set(lerp(6.5, 6.0, unflip) + seg(u, 3.8, 5) * 3, Math.sin(unflip * Math.PI) * 2.2 + (1 - unflip) * 1.3, -5.5);
    car.rotation.set(0, -0.6, Math.PI * (1 - unflip));
    birds.forEach(({ line, i }) => {
      line.position.set(10 - ((u * 3 + i * 3) % 24), 7 + i * 0.6 + Math.sin(u * 3 + i) * 0.3, -6 - i);
      line.scale.y = Math.sin(-u * 16 + i) > 0 ? 1 : -0.6;
    });
    turn.rotation.y = -u * 0.8;

    // the palindrome dolly: in to the turnstile, then exactly back out
    const k2 = ease(seg(p, 0, 2.5));
    const s = shot(V(0, lerp(3.2, 2.2, k2), lerp(15, 8.2, k2)), V(0, lerp(2.0, 1.6, k2), -2), lerp(36, 40, k2));
    return { shot: s, grade: { split: 1, sat: 0.9, contrast: 1.12, vignette: 0.5, gain: new THREE.Color(1.0, 0.99, 1.02) } };
  }
  return { scene, update, cues };
}
