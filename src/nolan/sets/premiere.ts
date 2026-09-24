import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW, LITTLE_GIANT, hex } from "../../crew";
import { Mascot } from "../../mascot";
import { batSuit, drawMascot, goggles, spaceHelmet, spinningTop, topHat, wearBrodie } from "../costumes";
import { additive, box, canvasTexture, ease, lights, move, seeded, seg, shot, V, type FilmSet, type Frame } from "../kit";

/**
 * The premiere: the whole cast takes a bow in costume in front of the IMAX
 * screen, the camera pulls back over the seats, and then — one last Nolan
 * joke — a close-up on the spinning top, cut to black before it falls.
 */
export function premiere(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0a12);
  scene.fog = new THREE.Fog(0x0d0a12, 30, 70);
  lights(scene, { sky: 0xffe6c8, ground: 0x2a1a24, fill: 0.9, key: 0xfff0d8, keyI: 2.4, from: V(0, 12, 12), span: 12 });

  // the screen, curved, showing the poster
  const cast = [LITTLE_GIANT, ...CREW];
  const poster = canvasTexture(2048, 820, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0e1426"); g.addColorStop(1, "#2a1a30");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f6ecd6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "300 150px Oswald, Impact, sans-serif";
    ctx.fillText("T H E   N O L A N   C U T", W / 2, H * 0.24);
    ctx.font = "400 44px Oswald, Impact, sans-serif"; ctx.fillStyle = "#c6df70";
    ctx.fillText("A   V G A N G   S T U D I O S   P R O D U C T I O N", W / 2, H * 0.42);
    cast.forEach((m, i) => drawMascot(ctx, W * (0.1 + i * 0.089), H * 0.56, 190, hex(m.color), m.eyes ? hex(m.eyes) : "#234d37"));
  });
  // seen from inside the curve, the texture runs backwards: mirror it back
  poster.wrapS = THREE.RepeatWrapping;
  poster.repeat.x = -1;
  const screenGeo = new THREE.CylinderGeometry(40, 40, 13, 48, 1, true, Math.PI - 0.34, 0.68);
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: poster, side: THREE.BackSide }));
  screen.position.set(0, 8.5, 26);
  scene.add(screen);
  const screenLight = new THREE.PointLight(0x9fb6ff, 60, 30, 1.2);
  screenLight.position.set(0, 7, -8);
  scene.add(screenLight);

  // stage, curtains at the wings, red carpet down the aisle
  const stage = box(24, 1, 6, 0x3a2430, 0.04);
  stage.position.set(0, 0, -9);
  scene.add(stage);
  [-13, 13].forEach((x) => {
    const c = box(3, 16, 2, 0x8e1a2a, 0.04);
    c.position.set(x, 0, -11);
    scene.add(c);
  });
  const carpet = box(3, 0.02, 40, 0xb3263a, 0);
  carpet.position.set(0, 0.01, 12);
  scene.add(carpet);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshToonMaterial({ color: 0x1c1420 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // rows of seats: one instanced mesh
  const seatGeo = new THREE.BoxGeometry(0.9, 1.1, 0.9);
  seatGeo.translate(0, 0.55, 0);
  const seats = new THREE.InstancedMesh(seatGeo, new THREE.MeshToonMaterial({ color: 0x8e1a2a }), 200);
  let n = 0;
  for (let row = 0; row < 10; row++) for (let i = 0; i < 20; i++) {
    const x = (i - 9.5) * 1.1 + (i >= 10 ? 1.6 : -1.6);
    const m = new THREE.Matrix4().makeTranslation(x, row * 0.35, 2 + row * 1.6);
    seats.setMatrixAt(n++, m);
  }
  scene.add(seats);
  // a scattering of audience silhouettes
  const rand = seeded(15);
  for (let k = 0; k < 26; k++) {
    const a = new Mascot(0x120c16, { eyes: 0x120c16 });
    const row = Math.floor(rand() * 10), i = Math.floor(rand() * 20);
    a.root.scale.setScalar(0.45);
    a.root.position.set((i - 9.5) * 1.1 + (i >= 10 ? 1.6 : -1.6), row * 0.35 + 0.9, 2 + row * 1.6);
    a.root.rotation.y = Math.PI;
    scene.add(a.root);
  }

  // the cast, in costume
  const people = cast.map((member, i) => {
    const m = dressed(member);
    m.root.scale.setScalar(0.95);
    m.root.position.set((i - 4.5) * 2.2, 1, -8.2 + Math.abs(i - 4.5) * 0.12);
    m.root.rotation.y = -(i - 4.5) * 0.05;
    if (member.handle === "khoatranthanh") topHat(m);
    if (member.handle === "baronha") { batSuit(m); m.parts.cigarette.visible = m.parts.smoke.visible = false; }
    if (member.handle === "anhquan291") spaceHelmet(m);
    if (member.handle === "huytdps13400") wearBrodie(m, 0x6b7545);
    if (member.handle === "dennytosp") goggles(m).position.y = 0.02;
    if (member.handle === "anhquan291") m.parts.suitcase.visible = false;
    scene.add(m.root);
    return m;
  });

  // sweeping spotlights
  const beams = [-8, -3, 3, 8].map((x, i) => {
    const b = new THREE.Mesh(new THREE.ConeGeometry(2.6, 18, 20, 1, true), additive(i % 2 ? 0xfff1c8 : 0xc6df70, 0.08));
    b.geometry.translate(0, -9, 0);
    b.position.set(x, 17, -2);
    scene.add(b);
    return b;
  });
  // confetti
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 220);
  const bits = Array.from({ length: 220 }, (_, i) => {
    confetti.setColorAt(i, new THREE.Color([0xffc93c, 0xe63946, 0xc6df70, 0x9ecddd, 0xf3b48e, 0xb1a0cc][i % 6]));
    return { x: (rand() - 0.5) * 26, z: -10 + rand() * 14, speed: 1.2 + rand() * 1.4, phase: rand() * 10, h: 14 + rand() * 6 };
  });
  confetti.frustumCulled = false;
  scene.add(confetti);
  const m4 = new THREE.Matrix4();

  // the totem, spinning on the lip of the stage
  const top = spinningTop();
  top.group.scale.setScalar(0.5);
  top.group.position.set(0.2, 1.0, -6.3);
  scene.add(top.group);

  const cues: FilmSet["cues"] = [
    [0.05, { kind: "sfx", name: "applause", volume: 0.8 }],
    [0.2, { kind: "sfx", name: "pop-1", volume: 0.6 }],
    [1.2, { kind: "pop", text: "BRAVO!", at: V(-6, 5, -7) }],
    [2.0, { kind: "pop", text: "ENCORE!", at: V(6, 5.4, -7) }],
    [3.6, { kind: "sfx", name: "spin", volume: 0.8 }],
  ];

  function update(u: number): Frame {
    people.forEach((m, i) => {
      m.update(u + i * 0.1);
      const bow = Math.sin(seg(u, 0.3 + i * 0.07, 1.3 + i * 0.07) * Math.PI);
      m.rig.rotation.x = bow * 0.45;
      m.cheering = u > 1.5 ? 1 : 0;
    });
    beams.forEach((b, i) => { b.rotation.z = Math.sin(u * 1.4 + i * 1.7) * 0.5; b.rotation.x = 0.3 + Math.cos(u * 1.1 + i) * 0.2; });
    bits.forEach((b, i) => {
      const y = b.h - ((u * b.speed + b.phase) % 16);
      m4.compose(V(b.x + Math.sin(u * 2 + b.phase) * 0.4, y, b.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(u * 4 + b.phase, u * 3, 0)), V(1, 1, 1));
      confetti.setMatrixAt(i, m4);
    });
    confetti.instanceMatrix.needsUpdate = true;
    const wobble = seg(u, 4.4, 5.6);
    top.update(u, wobble * wobble);

    let s;
    if (u < 3.6) {
      // from the cast, back over the seats to the whole house
      s = move(u, 0, 3.6, shot(V(0.5, 3.0, -1.5), V(0, 2.4, -8.5), 44), shot(V(0, 8.5, 22), V(0, 4.6, -8), 44), (k) => ease(k));
    } else {
      // the top, close, the crew soft behind it
      s = move(u, 3.6, 5.6, shot(V(1.0, 1.9, -4.0), V(0.2, 1.5, -6.6), 30), shot(V(0.75, 1.75, -4.5), V(0.2, 1.42, -6.5), 27));
    }
    return { shot: s, imax: u < 3.6 ? seg(u, 1.4, 3.2) : 0, grade: { sat: 1.05, contrast: 1.1, vignette: 0.6, gain: new THREE.Color(1.05, 1.0, 0.95) } };
  }
  return { scene, update, cues };
}
