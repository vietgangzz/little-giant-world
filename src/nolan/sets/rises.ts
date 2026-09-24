import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { toon } from "../../toon";
import { extra } from "../../film/costumes";
import { additive, box, canvasTexture, cyl, ease, lights, move, seeded, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";

/**
 * THE DARK KNIGHT RISES — the Pit. A deep stone well, a disc of sky at the
 * top, prisoners chanting at the bottom. Nick skips the rope, makes the leap,
 * and a cloud of bats bursts out past him.
 */
export function rises(): FilmSet {
  const nick = CREW.find((c) => c.handle === "tuanngocptn")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2a1e14, 18, 60);
  scene.add(skyDome(0xfff2d0, 0x2a1e14, 0xffe0a8));
  lights(scene, { sky: 0xffe2b0, ground: 0x2a1a10, fill: 1.0, key: 0xfff0d0, keyI: 2.8, from: V(3, 30, 2), span: 12, focus: V(0, 14, 0) });

  const R = 5, H = 26;
  const stone = canvasTexture(256, 256, (ctx, W, Hh) => {
    ctx.fillStyle = "#6b5236"; ctx.fillRect(0, 0, W, Hh);
    const r = seeded(3);
    for (let y = 0; y < Hh; y += 32) for (let x = (y / 32) % 2 ? -24 : 0; x < W; x += 48) {
      const v = 0.8 + r() * 0.3;
      ctx.fillStyle = `rgb(${Math.round(128 * v)},${Math.round(100 * v)},${Math.round(70 * v)})`;
      ctx.fillRect(x + 2, y + 2, 44, 28);
    }
  }, [6, 5]);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), new THREE.MeshToonMaterial({ map: stone, side: THREE.BackSide }));
  wall.position.y = H / 2;
  wall.receiveShadow = true;
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 40), toon(0x5a4630));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const ground = new THREE.Mesh(new THREE.RingGeometry(R, 80, 48), toon(0xc9a870));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = H;
  ground.receiveShadow = true;
  scene.add(ground);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.35, 8, 48), toon(0x8a6a44));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = H;
  scene.add(lip);
  // a shaft of sunlight down the well
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.6, H, 32, 1, true), additive(0xffe6b0, 0.06));
  shaft.position.set(0.8, H / 2, 0);
  shaft.rotation.z = 0.08;
  scene.add(shaft);

  // ledges spiralling up the wall, and the rope nobody uses
  const ledges = [[0.2, 4], [0.9, 8], [1.6, 12], [2.3, 16], [2.9, 20.5]].map(([a, y]) => {
    const l = box(1.8, 0.4, 1.4, 0x7c6040, 0.03);
    l.position.set(Math.sin(a) * (R - 0.6), y - 0.4, Math.cos(a) * (R - 0.6));
    l.rotation.y = a;
    scene.add(l);
    return { a, y };
  });
  const rope = cyl(0.06, 0.06, H - 2, 0xc9a870, 6, 0.012);
  rope.position.set(-2.4, 2, -3.6);
  scene.add(rope);
  // torches
  [0.5, 3.6].forEach((a) => {
    const torch = new THREE.PointLight(0xff9a4a, 8, 10, 1.4);
    torch.position.set(Math.sin(a) * (R - 0.4), 3, Math.cos(a) * (R - 0.4));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
    flame.position.copy(torch.position);
    scene.add(torch, flame);
  });

  // prisoners chanting in a ring at the bottom
  const rand = seeded(8);
  const prisoners = Array.from({ length: 9 }, (_, i) => {
    const m = extra([0x9a8a70, 0x8a7a66, 0xa8977a][i % 3]);
    m.root.scale.setScalar(0.8);
    const a = (i / 9) * Math.PI * 2 + 0.4;
    m.root.position.set(Math.sin(a) * 3.2, 0, Math.cos(a) * 3.2);
    m.root.rotation.y = a + Math.PI + (rand() - 0.5) * 0.4;
    scene.add(m.root);
    return m;
  });

  const hero = dressed(nick);
  hero.root.scale.setScalar(1);
  scene.add(hero.root);
  const spot = (a: number, y: number, inset = 1.2) => V(Math.sin(a) * (R - inset), y, Math.cos(a) * (R - inset));
  const rim = spot(3.35, H, -0.8);

  // bats: one instanced flock
  const batGeo = new THREE.BufferGeometry();
  batGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, -0.5, 0.1, -0.15, -0.25, 0, 0.2, 0, 0, 0, 0.5, 0.1, -0.15, 0.25, 0, 0.2], 3));
  batGeo.computeVertexNormals();
  const bats = new THREE.InstancedMesh(batGeo, new THREE.MeshBasicMaterial({ color: 0x0c0806, side: THREE.DoubleSide }), 60);
  bats.frustumCulled = false;
  scene.add(bats);
  const flock = Array.from({ length: 60 }, () => ({ a: rand() * Math.PI * 2, r: 1 + rand() * 3, speed: 5 + rand() * 6, delay: rand() * 0.6, spin: 2 + rand() * 3 }));
  const m4 = new THREE.Matrix4();

  const cues: FilmSet["cues"] = [
    ...[0.2, 0.75, 1.3, 1.85].map((t, i): [number, FilmSet["cues"][number][1]] => [t, { kind: "sfx", name: "chant", volume: 0.8, rate: i % 2 ? 1.15 : 1 }]),
    [0.45, { kind: "pop", text: "DESHI!", at: V(-2.5, 3.2, 1) }],
    [1.55, { kind: "pop", text: "BASARA!", at: V(2.5, 3.4, 0) }],
    [1.0, { kind: "sfx", name: "whoosh", volume: 0.6 }],
    [2.9, { kind: "sfx", name: "whoosh", volume: 0.9 }],
    [3.0, { kind: "sfx", name: "bats", volume: 0.9 }],
    [3.75, { kind: "sfx", name: "land", volume: 0.9 }],
    [3.9, { kind: "pop", text: "RISE!", at: rim.clone().add(V(0, 3, 0)), big: true }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    prisoners.forEach((m, i) => { m.update(u + i); m.rig.position.y = Math.abs(Math.sin(u * 7.2 + (i % 2) * 1.5)) * 0.3; m.cheering = u > 3.7 ? 1 : 0.4; });
    // Nick: ledge 16 → ledge 20.5, then the big one out onto the rim
    const a = spot(ledges[3].a, ledges[3].y), b = spot(ledges[4].a, ledges[4].y);
    let p: THREE.Vector3;
    if (u < 1.0) p = a;
    else if (u < 1.6) { const k = seg(u, 1.0, 1.6); p = a.clone().lerp(b, k); p.y += Math.sin(k * Math.PI) * 1.6; }
    else if (u < 2.9) p = b;
    else if (u < 3.75) { const k = ease(seg(u, 2.9, 3.75)); p = b.clone().lerp(rim, k); p.y += Math.sin(k * Math.PI) * 3.4; }
    else p = rim;
    hero.root.position.copy(p);
    const facing = u < 3.75 ? Math.atan2(-p.x, -p.z) + 0.6 : 3.35 + Math.PI;
    hero.root.rotation.y = facing;
    hero.cheering = u > 3.8 ? 1 : 0;
    hero.rig.rotation.x = u > 2.9 && u < 3.75 ? -Math.sin(seg(u, 2.9, 3.75) * Math.PI) * 0.4 : 0;

    // the bats burst up the shaft as he jumps
    flock.forEach((f, i) => {
      const k = u - 2.9 - f.delay;
      if (k < 0) { m4.makeScale(0, 0, 0); bats.setMatrixAt(i, m4); return; }
      const ang = f.a + k * f.spin;
      const pos = V(Math.sin(ang) * f.r, 2 + k * f.speed * 3, Math.cos(ang) * f.r);
      const flap = Math.sin(u * 40 + i) * 0.6;
      m4.compose(pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(flap, -ang, 0)), V(1.2, 1.2, 1.2));
      bats.setMatrixAt(i, m4);
    });
    bats.instanceMatrix.needsUpdate = true;

    let s;
    if (u < 2.9) {
      // from the bottom of the pit, straight up at the light
      s = move(u, 0, 2.9, shot(V(-0.6, 1.4, -1.8), V(1.2, 18, 1.6), 62), shot(V(-0.4, 1.2, -1.2), V(1.6, 20, 0.6), 58));
    } else {
      // from above the rim, looking down the well as he lands in the sun
      s = move(u, 2.9, 4.2, shot(rim.clone().add(V(-3.5, 9, 4.5)), rim.clone().add(V(1.5, -5, -2)), 50), shot(rim.clone().add(V(-5.5, 3.2, 6.5)), rim.clone().add(V(0, 1.2, 0)), 40));
    }
    return { shot: s, imax: u < 2.9 ? 1 : seg(u, 4.2, 4.8), grade: { sat: 0.82, contrast: 1.16, vignette: 0.7, lift: new THREE.Color(0.04, 0.025, 0.0), gain: new THREE.Color(1.1, 1.0, 0.84) } };
  }
  return { scene, update, cues };
}
