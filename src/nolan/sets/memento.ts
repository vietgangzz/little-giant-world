import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { toon } from "../../toon";
import { polaroid, drawMascot } from "../costumes";
import { box, canvasTexture, cyl, lights, move, picture, seg, shot, V, type FilmSet, type Frame } from "../kit";

/**
 * MEMENTO — Phong in a motel room, shaking a polaroid that fades instead of
 * developing, in black and white; then a snap to colour on the wall of notes
 * he left himself, and the one note he always trusts: 1 · 2 · 3 · ZÔ!
 */
export function memento(): FilmSet {
  const phong = CREW.find((c) => c.handle === "nnphong1904")!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2420);
  lights(scene, { sky: 0xfff0d8, ground: 0x4a3a30, fill: 1.2, key: 0xfff1d6, keyI: 2.4, from: V(6, 9, 7), span: 8 });

  // the room: carpet, striped wallpaper, a window with blinds
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshToonMaterial({
    map: canvasTexture(128, 128, (ctx, W, H) => {
      ctx.fillStyle = "#6b4a3a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#5e4033";
      for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if ((i + j) % 2) ctx.fillRect(i * 8, j * 8, 8, 8);
    }, [8, 7]),
  }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.receiveShadow = true;
  scene.add(carpet);
  const paper = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = "#d9c9a6"; ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 32) { ctx.fillStyle = "#cbb892"; ctx.fillRect(x, 0, 12, H); ctx.fillStyle = "#b99c74"; ctx.fillRect(x + 20, 0, 2, H); }
  }, [4, 1]);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshToonMaterial({ map: paper }));
  back.position.set(0, 3, -3.5);
  back.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshToonMaterial({ map: paper }));
  side.rotation.y = -Math.PI / 2;
  side.position.set(5.5, 3, 1);
  side.receiveShadow = true;
  const skirting = box(14, 0.25, 0.08, 0x6b4d36, 0.01);
  skirting.position.set(0, 0, -3.45);
  scene.add(back, side, skirting);
  // window: bright slats of daylight
  const win = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
  win.add(glass);
  for (let i = 0; i < 9; i++) {
    const slat = box(2.3, 0.07, 0.06, 0xe9dcc0, 0.008);
    slat.position.set(0, -0.9 + i * 0.21, 0.04);
    slat.rotation.x = 0.5;
    win.add(slat);
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.1, 0.06), toon(0x6b4d36));
  frame.position.z = -0.04;
  win.add(frame);
  win.position.set(-3.4, 3.1, -3.44);
  scene.add(win);

  // bed, nightstand, lamp
  const bed = new THREE.Group();
  const base = box(3.2, 0.6, 2.4, 0x5a3f2e);
  const mattress = box(3.0, 0.35, 2.2, 0xe8e0cf, 0.02);
  mattress.position.y = 0.6;
  const blanket = box(3.02, 0.3, 1.4, 0x7e8f6a, 0.02);
  blanket.position.set(0, 0.68, 0.42);
  const pillow = box(1.1, 0.22, 0.6, 0xf6f0e2, 0.02);
  pillow.position.set(-0.7, 0.95, -0.7);
  const head = box(3.2, 1.6, 0.15, 0x5a3f2e);
  head.position.set(0, 0, -1.2);
  bed.add(base, mattress, blanket, pillow, head);
  bed.position.set(-2.6, 0, -2.1);
  scene.add(bed);
  const stand = box(0.8, 0.9, 0.7, 0x6b4d36);
  stand.position.set(-0.4, 0, -3.0);
  const lampBase = cyl(0.14, 0.18, 0.5, 0x3b3530, 12, 0.012);
  lampBase.position.set(-0.4, 0.9, -3.0);
  const shade = cyl(0.36, 0.22, 0.4, new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), 18, 0.015);
  shade.position.set(-0.4, 1.35, -3.0);
  const bulb = new THREE.PointLight(0xffd9a0, 6, 6, 1.5);
  bulb.position.set(-0.4, 1.55, -2.8);
  scene.add(stand, lampBase, shade, bulb);
  // an empty can on the nightstand, and a few more on the floor: the evidence
  [[-0.2, 0.9, -2.9], [1.8, 0, -1.5], [2.2, 0, -1.9], [2.05, 0, -1.2]].forEach(([x, y, z], i) => {
    const can = cyl(0.1, 0.1, 0.3, i % 2 ? 0xc4a24a : 0xd9d0bd, 12, 0.01);
    can.position.set(x, y, z);
    if (i === 3) { can.rotation.z = Math.PI / 2; can.position.y = 0.1; }
    scene.add(can);
  });

  // the wall of notes and polaroids, joined by red string
  const wall = new THREE.Group();
  const notes = [
    { x: 1.2, y: 3.4, w: 1.3, h: 0.9, text: ["REMEMBER:", "1 · 2 · 3 · ZÔ!"], color: "#ffe58a", r: -0.06 },
    { x: 3.1, y: 3.7, w: 1.3, h: 0.9, text: ["DON'T TRUST", "\"LAST ONE\""], color: "#ffd1dc", r: 0.08 },
    { x: 2.6, y: 2.4, w: 1.2, h: 0.85, text: ["YOU ARE", "PHONG"], color: "#c8f0d0", r: -0.1 },
    { x: 4.2, y: 2.6, w: 1.1, h: 0.8, text: ["BEER #?", "(ask Bao)"], color: "#ffe58a", r: 0.12 },
  ];
  const pins: THREE.Vector3[] = [];
  notes.forEach((n) => {
    const tex = canvasTexture(256, Math.round(256 * (n.h / n.w)), (ctx, W, H) => {
      ctx.fillStyle = n.color; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#2b2622"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(H * 0.24)}px "Permanent Marker", "Comic Sans MS", cursive`;
      n.text.forEach((line, i) => ctx.fillText(line, W / 2, H * (0.34 + i * 0.36)));
    });
    const note = picture(n.w, n.h, tex, true);
    note.position.set(n.x, n.y, -3.42);
    note.rotation.z = n.r;
    wall.add(note);
    pins.push(V(n.x, n.y + n.h * 0.42, -3.4));
  });
  // polaroids of the crew pinned between the notes
  [["#e6c667", 0.4, 2.3, 0.1], ["#9ecddd", 3.9, 3.9, -0.12], ["#f3b48e", 1.6, 1.9, 0.05]].forEach(([color, x, y, r]) => {
    const p = polaroid((ctx, W, H) => {
      ctx.fillStyle = "#cfd8dc"; ctx.fillRect(0, 0, W, H);
      drawMascot(ctx, W / 2, H * 0.2, H * 0.62, color as string, "#234d37");
    });
    p.group.position.set(x as number, y as number, -3.41);
    p.group.rotation.z = r as number;
    wall.add(p.group);
    pins.push(V(x as number, (y as number) + 0.3, -3.39));
  });
  const string = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([pins[0], pins[4], pins[2], pins[6], pins[1], pins[5], pins[3]]), 80, 0.018, 5),
    new THREE.MeshBasicMaterial({ color: 0xc0262d }),
  );
  wall.add(string);
  scene.add(wall);

  // Phong, beer in one hand and the polaroid in the other
  const hero = dressed(phong);
  hero.root.scale.setScalar(1);
  hero.root.position.set(0.3, 0, 0.3);
  hero.root.rotation.y = 0.25;
  scene.add(hero.root);
  const photo = polaroid((ctx, W, H) => {
    ctx.fillStyle = "#e2d7c4"; ctx.fillRect(0, 0, W, H);
    // a beer mug with "ONE MORE?" scrawled under it
    ctx.fillStyle = "#d69a3e"; ctx.fillRect(W * 0.34, H * 0.28, W * 0.3, H * 0.4);
    ctx.fillStyle = "#fff9e5"; ctx.beginPath(); ctx.arc(W * 0.42, H * 0.28, W * 0.09, 0, 7); ctx.arc(W * 0.56, H * 0.27, W * 0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = "#e4e6c6"; ctx.lineWidth = W * 0.04; ctx.beginPath(); ctx.arc(W * 0.66, H * 0.48, W * 0.08, -1.4, 1.4); ctx.stroke();
    ctx.fillStyle = "#2b2622"; ctx.font = `700 ${W * 0.12}px "Permanent Marker", cursive`; ctx.textAlign = "center";
    ctx.fillText("ONE MORE?", W / 2, H * 0.88);
  });
  photo.group.scale.setScalar(1.2);
  photo.group.position.set(-0.28, 0.35, 0.08);
  hero.leftHand.add(photo.group);
  hero.rest.left.set(-0.95, 0.75, 0.55);

  const cues: FilmSet["cues"] = [
    [0.05, { kind: "sfx", name: "shutter", volume: 0.8 }],
    [0.5, { kind: "sfx", name: "shake", volume: 0.5 }],
    [1.3, { kind: "sfx", name: "shake", volume: 0.5 }],
    [2.4, { kind: "sfx", name: "flash", volume: 0.9 }],
    [3.55, { kind: "pop", text: "1·2·3…", at: V(1.2, 3.1, 0.6) }],
    [4.25, { kind: "pop", text: "ZÔ!", at: V(1.3, 3.2, 0.7), big: true }],
    [4.25, { kind: "sfx", name: "clink", volume: 0.9 }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    // shaking the polaroid, which fades back to nothing (Memento runs backwards)
    const shaking = u < 2.3;
    photo.group.rotation.z = shaking ? Math.sin(u * 30) * 0.25 : 0.1;
    photo.group.position.x = -0.28 + (shaking ? Math.sin(u * 30) * 0.06 : 0);
    photo.develop(1 - seg(u, 0.4, 2.2));
    hero.cheering = u > 4.1 ? 1 : u > 3.5 ? 0.35 : 0;

    const bw = u < 2.4 ? 1 : 0;
    const flash = Math.max(0, 1 - Math.abs(u - 2.42) / 0.12) * 0.9;
    let s;
    if (u < 2.4) {
      // slow push in on Phong, a little handheld
      s = move(u, 0, 2.4, shot(V(2.6, 2.6, 9.6), V(0.0, 1.6, -0.6), 34), shot(V(2.0, 2.3, 7.8), V(-0.1, 1.4, -0.3), 32));
      s.pos.x += Math.sin(u * 2.3) * 0.03;
      s.pos.y += Math.sin(u * 3.1) * 0.02;
    } else {
      // colour: start tight on the notes, then pan across to Phong raising his glass
      s = move(u, 2.4, 4.3, shot(V(2.7, 3.1, 1.2), V(2.5, 3.0, -3.4), 36), shot(V(4.0, 2.7, 8.4), V(1.2, 1.9, -1.5), 38));
    }
    return {
      shot: s,
      grade: { bw, flash, sat: 0.9, contrast: bw ? 1.22 : 1.08, vignette: 0.65, grain: bw ? 0.09 : 0.05, gain: new THREE.Color(1.04, 0.98, 0.9) },
    };
  }
  return { scene, update, cues };
}
