import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { spinningTop } from "../../film/costumes";
import { box, canvasTexture, cyl, ease, lights, move, seeded, seg, shot, skyDome, V, windows, type FilmSet, type Frame } from "../../film/kit";

/**
 * INCEPTION — Paul walks the poodle down a Paris street while the far half of
 * the city hinges up and folds over their heads. The camera stays low behind
 * them and tilts up into the upside-down boulevard.
 */
function street(length: number, seed: number) {
  const g = new THREE.Group();
  const rand = seeded(seed);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, length), new THREE.MeshToonMaterial({
    map: canvasTexture(128, 256, (ctx, W, H) => {
      ctx.fillStyle = "#6e6a70"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#7b777e";
      for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < W; x += 8) ctx.fillRect(x + 1, y + 1, 6, 6);
    }, [2, length / 4]),
  }));
  road.rotation.x = -Math.PI / 2;
  road.position.z = -length / 2;
  road.receiveShadow = true;
  g.add(road);
  [-1, 1].forEach((side) => {
    const walk = box(3, 0.2, length, 0xc9bfa9, 0.02);
    walk.position.set(side * 5.5, 0, -length / 2);
    g.add(walk);
    // Haussmann blocks: cream stone, window grid, blue-grey mansard roofs
    for (let z = -2; z > -length + 4; z -= 6.4) {
      const h = 9 + rand() * 3;
      const facade = windows("#e6dcc4", "#5a6a80", "#f4d58a", 4, 5, Math.floor(rand() * 99), 0.15);
      const b = box(6, h, 6, new THREE.MeshToonMaterial({ map: facade }), 0.04);
      b.position.set(side * 10, 0, z - 3.2);
      g.add(b);
      const roofGeo = new THREE.CylinderGeometry(2.9, 4.3, 2.4, 4);
      roofGeo.rotateY(Math.PI / 4);
      roofGeo.translate(0, 1.2, 0);
      const roof = inked(roofGeo, toon(0x5d6b80), 0.04);
      roof.position.set(side * 10, h, z - 3.2);
      g.add(roof);
      // wrought-iron balcony strip on two floors
      [0.45, 0.75].forEach((f) => {
        const bal = box(0.5, 0.35, 5.6, 0x2b2b33, 0.01);
        bal.position.set(side * 7.1, h * f, z - 3.2);
        g.add(bal);
      });
      if (rand() < 0.5) {
        const chimney = box(0.6, 1.2, 0.6, 0xc9b79a, 0.02);
        chimney.position.set(side * (10 + (rand() - 0.5) * 3), h + 2, z - 3.2 + (rand() - 0.5) * 3);
        g.add(chimney);
      }
    }
    // lamp posts
    for (let z = -4; z > -length + 2; z -= 8) {
      const post = cyl(0.08, 0.06, 3.4, 0x23232b, 8, 0.015);
      post.position.set(side * 4.3, 0.2, z);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe6a8 }));
      lamp.position.set(side * 4.3, 3.7, z);
      g.add(post, lamp);
    }
  });
  return g;
}

export function inception(): FilmSet {
  const paul = CREW.find((c) => c.handle === "giaBaoJS")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb9c3cf, 30, 90);
  scene.add(skyDome(0x9fb2c8, 0xb9c3cf, 0xdfe3e6));
  lights(scene, { sky: 0xe6edf6, ground: 0x7a7468, fill: 1.3, key: 0xfff2dc, keyI: 2.2, from: V(-8, 16, 4), span: 18, focus: V(0, 0, -4) });

  const near = street(30, 3);
  near.position.z = 12;
  scene.add(near);
  // the hinge: everything beyond z = -18 folds up and over
  const hinge = new THREE.Group();
  hinge.position.z = -18;
  hinge.add(street(46, 17));
  scene.add(hinge);

  // a café on the right: red striped awning, tables, the spinning top on one of them
  const cafe = new THREE.Group();
  const awning = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 5), new THREE.MeshToonMaterial({
    map: canvasTexture(64, 256, (ctx, W) => { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? "#f6ecd6" : "#c0262d"; ctx.fillRect(0, i * 16, W, 16); } }),
  }));
  awning.rotation.z = 0.6;
  awning.position.set(6.6, 3.2, 3);
  cafe.add(awning);
  const tops: ReturnType<typeof spinningTop>[] = [];
  [[5.4, 4.6], [5.6, 2.2], [5.2, 0.4]].forEach(([x, z], i) => {
    const leg = cyl(0.05, 0.05, 1.0, 0x23232b, 8, 0.012);
    const top = cyl(0.5, 0.5, 0.06, 0xdfe3e6, 20, 0.015);
    top.position.y = 1.0;
    const t = new THREE.Group();
    t.add(leg, top);
    t.position.set(x, 0.2, z);
    cafe.add(t);
    [-1, 1].forEach((s) => {
      const chair = box(0.45, 0.9, 0.45, 0x2b2b33, 0.012);
      chair.position.set(x + s * 0.7, 0.2, z);
      cafe.add(chair);
    });
    if (i === 0) {
      const spin = spinningTop();
      spin.group.scale.setScalar(0.35);
      spin.group.position.set(x, 1.27, z);
      cafe.add(spin.group);
      tops.push(spin);
    }
  });
  scene.add(cafe);

  const hero = dressed(paul);
  hero.root.scale.setScalar(1);
  hero.parts.poodle.userData.walking = 1;
  scene.add(hero.root);

  const cues: FilmSet["cues"] = [
    [0.2, { kind: "sfx", name: "steps", volume: 0.5 }],
    [0.9, { kind: "sfx", name: "braam", volume: 0.9 }],
    [1.4, { kind: "sfx", name: "rumble", volume: 0.7 }],
    [3.6, { kind: "pop", text: "WOOF.", at: V(-1.7, 1.8, -2.5) }],
    [3.6, { kind: "sfx", name: "pop-2", volume: 0.5 }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    // Paul and the pup stroll away from us down the middle of the road
    const walk = u * 1.05;
    hero.root.position.set(-0.2 + Math.sin(u * 0.8) * 0.1, Math.abs(Math.sin(u * 6)) * 0.08, 3.4 - walk);
    hero.root.rotation.y = Math.PI + 0.15;
    hero.rig.rotation.z = Math.sin(u * 6) * 0.04;
    // the fold: flat, then up past vertical and on over our heads
    const fold = ease(seg(u, 0.8, 4.6));
    hinge.rotation.x = fold * Math.PI * 0.9;
    tops.forEach((s) => s.update(u, 0.1));
    // low behind them, then crane down and tilt right up into the upside-down city
    const s = move(u, 0, 4.8, shot(V(1.4, 1.6, 10.5), V(-0.3, 2.0, -6), 44), shot(V(0.9, 0.9, 7.6), V(-0.2, 14, -18), 58));
    s.roll = Math.sin(seg(u, 1.5, 4.8) * Math.PI) * 0.05;
    return { shot: s, imax: seg(u, 1.6, 2.8), grade: { sat: 0.78, contrast: 1.1, vignette: 0.55, lift: new THREE.Color(0.02, 0.025, 0.035), gain: new THREE.Color(0.96, 1.0, 1.06) } };
  }
  return { scene, update, cues };
}
