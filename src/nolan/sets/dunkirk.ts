import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { extra, wearBrodie } from "../../film/costumes";
import { ball, box, canvasTexture, cyl, ease, glide, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";

/**
 * DUNKIRK — the mole. Soldiers queue down a long wooden pier into a grey sea,
 * a Spitfire tears overhead, and David (backpack, homework and all) is the
 * first to see the little ships coming. "What do you see?" "Home."
 */
function spitfire() {
  const g = new THREE.Group();
  const camo = toon(0x6f7048);
  const fus = inked(new THREE.CapsuleGeometry(0.42, 3.6, 6, 14), camo, 0.04);
  fus.rotation.x = Math.PI / 2;
  const wingShape = new THREE.Shape();
  wingShape.absellipse(0, 0, 3.8, 1.0, 0, Math.PI * 2, false, 0);
  const wing = inked(new THREE.ExtrudeGeometry(wingShape, { depth: 0.12, bevelEnabled: false }), camo, 0.035);
  wing.rotation.x = Math.PI / 2;
  wing.position.set(0, -0.15, 0.4);
  const roundel = (r: number) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({
      map: canvasTexture(64, 64, (ctx) => {
        [["#2b3f8f", 32], ["#f4f1e8", 22], ["#c0262d", 12]].forEach(([c, rr]) => { ctx.fillStyle = c as string; ctx.beginPath(); ctx.arc(32, 32, rr as number, 0, 7); ctx.fill(); });
      }),
    }));
    return m;
  };
  [-2.4, 2.4].forEach((x) => { const r = roundel(0.45); r.rotation.x = -Math.PI / 2; r.position.set(x, -0.02, 0.4); g.add(r); });
  const tail = inked(new THREE.BoxGeometry(0.08, 1.0, 0.9), camo, 0.02);
  tail.position.set(0, 0.5, -1.9);
  const stab = inked(new THREE.BoxGeometry(2.2, 0.08, 0.7), camo, 0.02);
  stab.position.set(0, 0.05, -1.9);
  const canopy = ball(0.34, toon(0x9fc4d4), 0.02);
  canopy.scale.set(0.8, 0.7, 1.4);
  canopy.position.set(0, 0.42, 0.2);
  const spinner = inked(new THREE.ConeGeometry(0.22, 0.5, 12), toon(0x2b2b2b), 0.015);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 2.3;
  const prop = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), new THREE.MeshBasicMaterial({ color: 0x3a3a3a, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  prop.position.z = 2.2;
  g.add(fus, wing, tail, stab, canopy, spinner, prop);
  return g;
}

function littleShip(hull: number, cabin: number, seed: number) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-1.6, 0.6); shape.lineTo(1.6, 0.6); shape.quadraticCurveTo(1.4, -0.2, 0.4, -0.4); shape.lineTo(-1.2, -0.4); shape.quadraticCurveTo(-1.6, 0, -1.6, 0.6);
  const body = inked(new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false }), toon(hull), 0.04);
  body.rotation.y = Math.PI / 2;
  body.position.x = -0.6;
  const house = box(0.9, 0.7, 1.2, cabin, 0.03);
  house.position.set(0, 0.6, -0.3);
  const mast = cyl(0.05, 0.04, 2.2, 0x5a3f2e, 6, 0.015);
  mast.position.set(0, 0.6, 0.5);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ color: seed % 2 ? 0xc0262d : 0x2b3f8f, side: THREE.DoubleSide }));
  flag.position.set(0, 2.6, 0.75);
  g.add(body, house, mast, flag);
  return g;
}

export function dunkirk(): FilmSet {
  const david = CREW.find((c) => c.handle === "huytdps13400")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xaab4b0, 30, 130);
  scene.add(skyDome(0x8d9a9c, 0x9eaaa6, 0xc8cdc4));
  lights(scene, { sky: 0xdfe4dc, ground: 0x7a735e, fill: 1.4, key: 0xf2eee0, keyI: 1.7, from: V(-8, 12, 6), span: 14, focus: V(0, 0, -4) });

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshToonMaterial({
    color: 0xcfd8d2,
    map: canvasTexture(128, 128, (ctx, W, H) => {
      ctx.fillStyle = "#5f7b78"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(200,214,206,0.5)"; ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) { const y = (i * 29) % H, x = (i * 53) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 4, x + 28, y); ctx.stroke(); }
    }, [90, 90]),
  }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.6;
  sea.receiveShadow = true;
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), toon(0xcdbb90));
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, -0.55, 38);
  beach.receiveShadow = true;
  scene.add(sea, beach);

  // the mole: planks on piles, running out to sea
  const L = 70;
  const deck = box(3.2, 0.3, L, new THREE.MeshToonMaterial({
    map: canvasTexture(64, 256, (ctx, W) => {
      for (let i = 0; i < 32; i++) { ctx.fillStyle = i % 2 ? "#8a6a4a" : "#7c5e41"; ctx.fillRect(0, i * 8, W, 8); ctx.fillStyle = "#5a4230"; ctx.fillRect(0, i * 8 + 7, W, 1); }
    }, [1, 20]),
  }), 0.03);
  deck.position.set(0, 0.7, -L / 2 + 8);
  scene.add(deck);
  for (let z = 7; z > -L + 8; z -= 3) [-1.5, 1.5].forEach((x) => {
    const pile = cyl(0.14, 0.14, 1.9, 0x4a3828, 8, 0.015);
    pile.position.set(x, -0.9, z);
    scene.add(pile);
  });
  [-1.55, 1.55].forEach((x) => {
    const rail = box(0.08, 0.08, L, 0x5a4230, 0.01);
    rail.position.set(x, 1.6, -L / 2 + 8);
    scene.add(rail);
  });

  // soldiers queued in two files, facing the sea
  const rand = seeded(5);
  const soldiers = Array.from({ length: 22 }, (_, i) => {
    const m = extra([0x8c9577, 0x7f8a6d, 0x96917a, 0x8a8f7e][i % 4]);
    wearBrodie(m);
    m.root.scale.setScalar(0.62);
    m.root.position.set(i % 2 ? 0.75 : -0.75, 1.0, -3 - Math.floor(i / 2) * 2.3 - rand() * 0.4);
    m.root.rotation.y = Math.PI + (rand() - 0.5) * 0.3;
    scene.add(m.root);
    return m;
  });
  // the town burning on the horizon: a column of smoke
  const smoke = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const p = ball(3 + i * 0.6, toon(0x4a4a4e), 0);
    p.position.set(-40 + Math.sin(i) * 3 + i * 1.8, i * 4.2, -90 - i);
    smoke.add(p);
  }
  scene.add(smoke);

  const hero = dressed(david);
  hero.root.scale.setScalar(0.8);
  hero.root.position.set(0.85, 1.0, -0.6);
  hero.root.rotation.y = Math.PI - 0.3;
  wearBrodie(hero, 0x6b7545);
  scene.add(hero.root);

  const plane = spitfire();
  scene.add(plane);
  const ships = [[0xf4f1e8, 0x2b3f8f], [0x2b3f8f, 0xf4f1e8], [0xc0262d, 0xf4f1e8], [0xf4f1e8, 0x6b8f6b], [0x3a6b8f, 0xe8dcc0], [0xe8dcc0, 0xc0262d], [0x4a5a3a, 0xf4f1e8]]
    .map(([h, c], i) => {
      const s = littleShip(h, c, i);
      s.position.set(-16 + i * 5.5 + rand() * 2, -0.6, -70 - rand() * 12);
      s.rotation.y = Math.PI + (rand() - 0.5) * 0.5;
      scene.add(s);
      return s;
    });

  const cues: FilmSet["cues"] = [
    ...[0.1, 0.6, 1.05, 1.45, 1.8, 2.1, 2.35].map((t): [number, FilmSet["cues"][number][1]] => [t, { kind: "sfx", name: "tick", volume: 0.7, rate: 1.1 }]),
    [0.9, { kind: "sfx", name: "engine", volume: 0.9 }],
    [3.7, { kind: "sfx", name: "horn", volume: 0.8 }],
    [3.9, { kind: "pop", text: "HOME!", at: V(4, 5, -30), big: true }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    soldiers.forEach((m, i) => {
      m.update(u + i);
      m.rig.position.y = u > 3.7 ? Math.abs(Math.sin(u * 9 + i)) * 0.35 : 0;
      m.rig.rotation.y = u > 1.4 && u < 2.8 ? Math.sin(seg(u, 1.4, 2.8) * Math.PI) * -0.5 : 0; // everyone looks up at the plane
    });
    hero.cheering = u > 3.7 ? 1 : 0;
    // the Spitfire: from behind the camera, low over the mole, out to sea
    plane.position.copy(glide(u, 0.9, 2.9, V(6, 7, 26), V(-8, 9, -90), (k) => k));
    plane.lookAt(V(-8, 9, -90));
    plane.rotateZ(0.35);
    (plane.children[plane.children.length - 1] as THREE.Mesh).rotation.z = u * 60;
    ships.forEach((s, i) => {
      s.position.z = -78 + i * 0.8 + ease(seg(u, 2.6, 5)) * 26;
      s.position.y = -0.55 + Math.sin(u * 2 + i) * 0.08;
      s.rotation.z = Math.sin(u * 1.6 + i) * 0.05;
    });

    let s;
    if (u < 2.5) {
      // down the length of the mole, low over the planks
      s = move(u, 0, 2.5, shot(V(2.1, 1.9, 7.4), V(-0.2, 1.6, -30), 34), shot(V(1.9, 1.8, 6.2), V(-0.2, 1.8, -30), 34));
      if (u > 1.3) s.look.lerp(plane.position, Math.sin(seg(u, 1.3, 2.5) * Math.PI) * 0.25);
    } else if (u < 3.6) {
      // his face as he sees them
      s = move(u, 2.5, 3.6, shot(V(0.3, 1.9, -4.9), V(0.85, 1.7, -0.6), 30), shot(V(0.35, 1.9, -4.4), V(0.85, 1.75, -0.6), 28));
    } else {
      // over his shoulder: the little ships, all of them
      s = move(u, 3.6, 5, shot(V(2.4, 3.0, 4.4), V(-0.4, 1.0, -50), 32), shot(V(2.6, 3.2, 5.4), V(-0.4, 1.4, -50), 36));
    }
    return { shot: s, imax: u < 2.5 ? 0 : seg(u, 3.6, 4.2), grade: { sat: 0.6, contrast: 1.12, vignette: 0.6, lift: new THREE.Color(0.02, 0.03, 0.03), gain: new THREE.Color(1.02, 1.0, 0.94) } };
  }
  return { scene, update, cues };
}
