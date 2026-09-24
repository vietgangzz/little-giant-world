import * as THREE from "three";
import { dressed } from "../../accessories";
import { LITTLE_GIANT } from "../../crew";
import { easeOutBack } from "../../noise";
import { inked, toon } from "../../toon";
import { additive, box, canvasTexture, cyl, glide, lights, move, picture, seg, shot, V, type FilmSet, type Frame } from "../../film/kit";

/**
 * Cold open on the VGang soundstage: Little Giant in a beret on an apple box,
 * the big IMAX camera, the lights, and a clapperboard that snaps shut on the cut.
 */
export function opening(): FilmSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14111c);
  scene.fog = new THREE.Fog(0x14111c, 14, 34);
  lights(scene, { sky: 0xcfc6ff, ground: 0x2a2233, fill: 0.9, keyI: 2.6, from: V(-5, 10, 7), span: 10 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon(0x2b2733));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  // gaffer-tape marks on the stage floor
  [[-1.2, 1.8, 0.4], [1.6, 2.4, -0.3], [0, 3.6, 0.1]].forEach(([x, z, r]) => {
    const tape = box(0.9, 0.01, 0.12, 0xffc93c, 0);
    tape.position.set(x, 0.002, z);
    tape.rotation.y = r;
    scene.add(tape);
    const cross = tape.clone();
    cross.rotation.y = r + Math.PI / 2;
    scene.add(cross);
  });
  scene.add(floor);

  // a painted cyclorama backdrop, the kind every studio has
  const cyc = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 12, 40, 1, true, Math.PI * 0.6, Math.PI * 0.8), toon(0x3a3350, { side: THREE.BackSide }));
  cyc.position.set(0, 6, 2);
  scene.add(cyc);
  const logo = picture(7, 2.4, canvasTexture(1024, 352, (ctx, W, H) => {
    ctx.fillStyle = "#3a3350"; ctx.fillRect(0, 0, W, H);
    ctx.font = "700 150px Oswald, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#4d4468"; ctx.fillText("VGANG STUDIOS", W / 2, H / 2 + 8);
  }), true);
  logo.position.set(0, 4.6, -12.2);
  scene.add(logo);

  // apple box and the director
  const apple = box(1.7, 0.5, 1.2, 0xc8964f);
  apple.position.set(0, 0, 0);
  scene.add(apple);
  const director = dressed(LITTLE_GIANT);
  director.root.scale.setScalar(1);
  director.root.position.set(0, 0.5, 0);
  director.root.rotation.y = 0.35;
  scene.add(director.root);

  // director's chair
  const chair = new THREE.Group();
  const wood = 0x8a5a36;
  [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]].forEach(([x, z]) => {
    const leg = box(0.08, 1.4, 0.08, wood, 0.015);
    leg.position.set(x, 0, z);
    leg.rotation.x = z > 0 ? -0.25 : 0.25;
    chair.add(leg);
  });
  const seat = box(1.2, 0.05, 0.8, 0x1c1a24, 0.015);
  seat.position.y = 1.0;
  const back = picture(1.2, 0.5, canvasTexture(256, 108, (ctx, W, H) => {
    ctx.fillStyle = "#1c1a24"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f6ecd6"; ctx.font = "700 44px Oswald, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("DIRECTOR", W / 2, H * 0.36);
    ctx.font = "600 30px Oswald, Impact, sans-serif"; ctx.fillStyle = "#c6df70";
    ctx.fillText("L. GIANT", W / 2, H * 0.74);
  }), true);
  back.position.set(0, 1.75, -0.42);
  chair.add(seat, back);
  chair.position.set(-3.2, 0, -1.2);
  chair.rotation.y = 0.5;
  scene.add(chair);

  // the IMAX camera: a big box body, two film reels and a long lens
  const rig = new THREE.Group();
  const bodyCam = box(1.3, 0.9, 1.8, 0x23202c);
  bodyCam.position.y = 1.5;
  const lens = cyl(0.3, 0.36, 0.8, 0x121017, 20);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.95, 0.9);
  const reels = [0.55, -0.35].map((z) => {
    const r = inked(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 24), toon(0x3a3645), 0.02);
    r.rotation.z = Math.PI / 2;
    r.position.set(0, 2.85, z);
    rig.add(r);
    return r;
  });
  const badge = picture(0.8, 0.26, canvasTexture(256, 84, (ctx, W, H) => {
    ctx.fillStyle = "#23202c"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#6bcbff"; ctx.font = "800 58px Oswald, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("IMAX", W / 2, H / 2 + 3);
  }), true);
  badge.position.set(0.66, 1.95, 0.2);
  badge.rotation.y = Math.PI / 2;
  const tripod = new THREE.Group();
  [0, 2.1, 4.2].forEach((a) => {
    const leg = cyl(0.05, 0.05, 1.3, 0x55505f, 8, 0.012);
    leg.position.set(Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35);
    leg.rotation.set(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3);
    tripod.add(leg);
  });
  rig.add(bodyCam, lens, badge, tripod);
  rig.position.set(3.4, 0, -0.6);
  rig.rotation.y = -0.9;
  scene.add(rig);

  // two big fresnel lamps with visible beams through the haze
  const beams: THREE.Mesh[] = [];
  [[-5.5, -3, 0.8], [5.8, -2.2, -0.9]].forEach(([x, z, yaw]) => {
    const lamp = new THREE.Group();
    const stand = cyl(0.06, 0.06, 3.2, 0x55505f, 8, 0.012);
    const head = cyl(0.5, 0.42, 0.7, 0x2f2b38, 18);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 3.3, 0);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0xfff1c8 }));
    face.position.set(0, 3.3, 0.36);
    lamp.add(stand, head, face);
    lamp.position.set(x, 0, z);
    lamp.rotation.y = yaw;
    scene.add(lamp);
    // a soft beam from the lamp head down onto the apple box
    const from = V(x, 3.3, z), to = V(0, 0.6, 0);
    const len = from.distanceTo(to);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.3, len, 24, 1, true), additive(0xfff1c8, 0.05));
    beam.geometry.translate(0, -len / 2, 0);
    beam.position.copy(from);
    beam.quaternion.setFromUnitVectors(V(0, -1, 0), to.clone().sub(from).normalize());
    beams.push(beam);
    scene.add(beam);
  });

  // the clapperboard that closes the scene, held just in front of the lens
  const clap = new THREE.Group();
  const slate = picture(1.6, 1.1, canvasTexture(512, 352, (ctx, W, H) => {
    ctx.fillStyle = "#16141c"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#f6ecd6"; ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.beginPath(); ctx.moveTo(14, H * 0.45); ctx.lineTo(W - 14, H * 0.45); ctx.moveTo(W * 0.5, H * 0.45); ctx.lineTo(W * 0.5, H - 14); ctx.stroke();
    ctx.fillStyle = "#f6ecd6"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = "700 56px Oswald, Impact, sans-serif"; ctx.fillText("THE NOLAN CUT", 36, H * 0.26);
    ctx.font = "500 30px Oswald, Impact, sans-serif";
    ctx.fillText("SCENE  01", 36, H * 0.62); ctx.fillText("TAKE  1", W * 0.5 + 22, H * 0.62);
    ctx.fillText("DIR. L. GIANT", 36, H * 0.84); ctx.fillText("VGANG STUDIOS", W * 0.5 + 22, H * 0.84);
  }), true);
  const stripes = canvasTexture(256, 32, (ctx, W, H) => {
    ctx.fillStyle = "#f6ecd6"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#16141c";
    for (let i = -1; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 32, H); ctx.lineTo(i * 32 + 16, H); ctx.lineTo(i * 32 + 32, 0); ctx.lineTo(i * 32 + 16, 0); ctx.fill(); }
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.05), [0, 0, 0, 0, 0, 0].map(() => new THREE.MeshBasicMaterial({ map: stripes })));
  base.position.y = 0.63;
  const stick = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.05), [0, 0, 0, 0, 0, 0].map(() => new THREE.MeshBasicMaterial({ map: stripes })));
  stick.geometry.translate(0.8, 0, 0);
  const hinge = new THREE.Group();
  hinge.position.set(-0.8, 0.72, 0);
  stick.position.y = 0.08;
  hinge.add(stick);
  clap.add(slate, base, hinge);
  scene.add(clap);

  const cues: FilmSet["cues"] = [
    [2.35, { kind: "sfx", name: "braam", volume: 0.8 }],
    [3.55, { kind: "pop", text: "ACTION!", at: V(0.9, 3.3, 0.4), big: true }],
    [3.5, { kind: "sfx", name: "pop-1", volume: 0.7 }],
    [4.72, { kind: "sfx", name: "clap", volume: 1 }],
  ];

  function update(u: number): Frame {
    director.update(u);
    // he lifts the megaphone and hops as he calls it
    if (u > 3.4 && u < 3.45) director.hop(3.42, 0.5, 0.45);
    director.cheering = u > 3.3 && u < 4.4 ? 0.7 : 0;
    director.root.rotation.y = 0.35 + Math.sin(u * 1.3) * 0.05;
    reels.forEach((r, i) => (r.rotation.x = u * (i ? -3 : 3)));
    beams.forEach((b, i) => ((b.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(u * 3 + i) * 0.01));

    // the clapper rises into frame, snaps shut, and the film cuts
    const cam = glide(u, 2.2, 4.3, V(1.2, 1.1, 7.2), V(0.5, 1.6, 4.4));
    const look = glide(u, 2.2, 4.3, V(0, 1.7, 0), V(0.1, 1.9, 0));
    const inFront = easeOutBack(seg(u, 4.05, 4.45));
    const toCam = cam.clone().sub(look).normalize();
    clap.position.copy(cam).addScaledVector(toCam, -1.9).add(V(0, -1.35 + inFront * 0.9, 0));
    clap.lookAt(cam);
    hinge.rotation.z = u < 4.72 ? 0.55 * Math.min(1, seg(u, 4.1, 4.3) + 0.3) * (1 - seg(u, 4.62, 4.72)) : 0;
    clap.visible = u > 4.0;

    let s = shot(cam, look, 38);
    if (u < 2.2) s = move(u, 0, 2.2, shot(V(-2.4, 2.4, 9.5), V(0, 1.4, 0), 34), shot(V(1.2, 1.1, 7.2), V(0, 1.7, 0), 38));
    return { shot: s, grade: { sat: 0.95, contrast: 1.08, vignette: 0.5 } };
  }
  return { scene, update, cues };
}
