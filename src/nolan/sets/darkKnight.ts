import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { toon } from "../../toon";
import { batSuit, drawMascot } from "../costumes";
import { additive, around, box, canvasTexture, cyl, lights, move, seeded, shot, skyDome, V, windows, type FilmSet, type Frame } from "../kit";
import { ease, seg } from "../kit";

/**
 * THE DARK KNIGHT — Bao Ha on a Gotham ledge, sunglasses doing the work of a
 * cowl. The IMAX helicopter shot circles down the tower to find him, while the
 * bat-signal throws our mascot's silhouette onto the clouds.
 */
export function darkKnight(): FilmSet {
  const bao = CREW.find((c) => c.handle === "baronha")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d1526, 0.012);
  scene.add(skyDome(0x0b1224, 0x05080f, 0x2a3552));
  lights(scene, { sky: 0x7d93c9, ground: 0x151a26, fill: 1.0, key: 0x9fb6e8, keyI: 1.6, from: V(-8, 14, 6), span: 10 });
  const warm = new THREE.PointLight(0xffb070, 30, 30, 1.4);
  warm.position.set(0, -6, 6);
  scene.add(warm);

  // the tower Bao Ha stands on: its roof at y=0, a parapet and a gargoyle
  const H = 60;
  const facade = windows("#1d2436", "#141a28", "#ffcf7a", 6, 14, 3, 0.3);
  facade.wrapS = facade.wrapT = THREE.RepeatWrapping;
  facade.repeat.set(1, 4);
  const tower = box(8, H, 8, new THREE.MeshToonMaterial({ map: facade }), 0.05);
  tower.position.set(0, -H, -2);
  scene.add(tower);
  const parapet = box(8.4, 0.5, 8.4, 0x2a3040, 0.04);
  parapet.position.set(0, 0, -2);
  scene.add(parapet);
  const ledge = box(3, 0.4, 1.4, 0x353c50, 0.03);
  ledge.position.set(0, 0.2, 2.6);
  scene.add(ledge);
  const gargoyle = new THREE.Group();
  const gBody = box(0.7, 0.9, 1.0, 0x4a4f5e, 0.03);
  const gHead = box(0.5, 0.5, 0.6, 0x4a4f5e, 0.03);
  gHead.position.set(0, 0.7, 0.5);
  const gWing = box(1.4, 0.5, 0.1, 0x3f4452, 0.02);
  gWing.position.set(0, 0.6, -0.3);
  gargoyle.add(gBody, gHead, gWing);
  gargoyle.position.set(-1.4, 0.6, 2.8);
  gargoyle.rotation.y = 0.4;
  scene.add(gargoyle);

  // Gotham around it: towers of lit windows, instanced by facade style
  const rand = seeded(11);
  const styles = [
    windows("#222a3d", "#161c2b", "#ffd28a", 5, 12, 5, 0.35),
    windows("#2b2f3d", "#1a1e2a", "#ffe6a8", 4, 10, 7, 0.25),
    windows("#1f2a3a", "#121a26", "#9fd8ff", 6, 16, 9, 0.2),
  ];
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const r = 14 + rand() * 50;
    const w = 4 + rand() * 6, d = 4 + rand() * 6, h = 30 + rand() * 60;
    const tex = styles[i % 3].clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.round(w / 3), Math.round(h / 8));
    tex.needsUpdate = true;
    const b = box(w, h, d, new THREE.MeshToonMaterial({ map: tex }), 0.04);
    b.position.set(Math.sin(a) * r, -H, Math.cos(a) * r - 6);
    if (Math.abs(b.position.x) < 9 && b.position.z > 0 && b.position.z < 26) continue; // keep the camera path clear
    scene.add(b);
    if (rand() < 0.3) {
      const spire = cyl(0.8, 0.05, 6, 0x2b3040, 6, 0.02);
      spire.position.set(b.position.x, -H + h, b.position.z);
      scene.add(spire);
    }
  }
  // streets far below: a glow of headlights
  const streets = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x3a2a1c }));
  streets.rotation.x = -Math.PI / 2;
  streets.position.y = -H;
  scene.add(streets);

  // the bat-signal on the next roof, beam up into the clouds
  const projector = new THREE.Group();
  const drum = cyl(0.7, 0.7, 1.1, 0x3b4150, 20, 0.03);
  drum.rotation.x = -0.8;
  drum.position.y = 0.9;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: 0xfff3c0 }));
  lens.position.set(0, 1.3, -0.45);
  lens.rotation.x = -0.8 - Math.PI / 2;
  projector.add(drum, lens);
  projector.position.set(-16, -8, -14);
  const roof = box(9, 1, 9, 0x252b3a, 0.04);
  roof.position.set(-16, -9, -14);
  scene.add(projector, roof);
  const signalAt = V(-6, 40, -60);
  const from = V(-16, -6.5, -14);
  const beamLen = from.distanceTo(signalAt);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 0.6, beamLen, 24, 1, true), additive(0xfff1b8, 0.11));
  beam.position.copy(from).lerp(signalAt, 0.5);
  beam.quaternion.setFromUnitVectors(V(0, 1, 0), signalAt.clone().sub(from).normalize());
  scene.add(beam);
  // clouds lit from below, with the mascot silhouette in the signal's oval
  const cloudTex = canvasTexture(1024, 512, (ctx, W, H2) => {
    const r = seeded(21);
    for (let i = 0; i < 38; i++) {
      const x = r() * W, y = H2 * (0.3 + r() * 0.5), s = 60 + r() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, "rgba(90,104,140,0.85)"); g.addColorStop(1, "rgba(40,50,80,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    }
    const cx = W * 0.5, cy = H2 * 0.5;
    const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 230);
    glow.addColorStop(0, "rgba(255,238,170,1)"); glow.addColorStop(0.72, "rgba(255,226,140,0.95)"); glow.addColorStop(1, "rgba(255,220,130,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(cx, cy, 230, 160, 0, 0, 7); ctx.fill();
    drawMascot(ctx, cx, cy - 110, 220, "#10131c");
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(90, 45), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false }));
  clouds.position.copy(signalAt);
  clouds.lookAt(V(0, 2, 12));
  scene.add(clouds);

  // Bao Ha: shades as the cowl, ears, a cape in the wind
  const hero = dressed(bao);
  hero.root.scale.setScalar(1);
  hero.root.position.set(0, 0.4, 2.6);
  hero.root.rotation.y = 0.2;
  const suit = batSuit(hero);
  // Batman doesn't smoke
  hero.parts.cigarette.visible = hero.parts.smoke.visible = false;
  // a cool rim light from the signal side, so he reads against the night
  const rim = new THREE.DirectionalLight(0xbcd4ff, 2.2);
  rim.position.set(-6, 6, -8);
  rim.target = hero.root;
  scene.add(rim);
  hero.rest.right.set(1.0, 0.55, 0.3);
  scene.add(hero.root);
  // a few bats tumbling past
  const bats = Array.from({ length: 6 }, (_, i) => {
    const g = new THREE.Group();
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 3), toon(0x05070c));
    wing.rotation.z = Math.PI / 2;
    const w2 = wing.clone();
    w2.rotation.z = -Math.PI / 2;
    wing.position.x = -0.4; w2.position.x = 0.4;
    g.add(wing, w2);
    scene.add(g);
    return { g, wing, w2, phase: i * 1.3 };
  });

  const cues: FilmSet["cues"] = [
    [0.1, { kind: "sfx", name: "wind", volume: 0.7 }],
    [0.3, { kind: "sfx", name: "hum", volume: 0.5, rate: 0.7 }],
    [2.9, { kind: "sfx", name: "braam", volume: 0.75 }],
    [3.0, { kind: "sfx", name: "cape", volume: 0.8 }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    suit.setWind(u < 3 ? 0.8 : 1.2);
    hero.root.rotation.y = u < 3 ? 0.2 : 0.2 + ease(seg(u, 3, 3.6)) * 0.45;
    bats.forEach((b, i) => {
      const k = (u * 0.35 + b.phase * 0.17) % 1;
      b.g.position.set(-8 + k * 20 + i, 6 + Math.sin(k * 9 + i) * 2 + i * 0.8, -4 - i * 3);
      b.wing.rotation.x = b.w2.rotation.x = Math.sin(u * 22 + i) * 0.8;
    });
    let s;
    if (u < 3.0) {
      // IMAX helicopter: a spiral down and in around the tower
      const k = ease(seg(u, 0, 3.0));
      const angle = 2.4 - k * 2.25;
      const pos = around(V(0, 0, 2.6), angle, 26 - k * 17, 16 - k * 13);
      s = shot(pos, V(0, 1.2, 2.6), 34 - k * 4);
    } else {
      // hero angle: low, the signal burning over his shoulder
      s = move(u, 3.0, 5.0, shot(V(3.6, 0.2, 11.5), V(0, 3.0, 1.6), 38), shot(V(4.0, 0.0, 10.4), V(0.2, 3.6, 0.4), 40));
    }
    return {
      shot: s, imax: u < 3.0 ? 1 : 0,
      grade: { sat: 0.85, contrast: 1.18, vignette: 0.7, lift: new THREE.Color(0.02, 0.035, 0.06), gain: new THREE.Color(0.95, 1.0, 1.12) },
    };
  }
  return { scene, update, cues };
}
