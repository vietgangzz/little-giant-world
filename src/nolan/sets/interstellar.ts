import * as THREE from "three";
import { dressed } from "../../accessories";
import { CREW } from "../../crew";
import { inked, toon } from "../../toon";
import { spaceHelmet } from "../../film/costumes";
import { additive, canvasTexture, ease, lights, move, seg, shot, skyDome, V, type FilmSet, type Frame } from "../../film/kit";

/**
 * INTERSTELLAR — Miller's planet. Quan, bubble helmet on, lines up a photo of
 * some lovely mountains in ankle-deep water. Behind him, the mountains rise.
 * Every tick of the clock is a day back home.
 */
export function interstellar(): FilmSet {
  const quan = CREW.find((c) => c.handle === "anhquan291")!;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xb8c6cc, 0.006);
  scene.add(skyDome(0x9fb0b8, 0x9fb4bc, 0xd9e0e0));
  lights(scene, { sky: 0xe8f0f2, ground: 0x6f8a94, fill: 1.5, key: 0xf4f6f2, keyI: 1.5, from: V(-6, 14, 10), span: 10 });

  // a sheet of shallow water to the horizon, with ripple lines
  const ripples = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = "#7fa3b1"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(220,236,240,0.55)"; ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const y = (i * 37) % H, x = (i * 71) % W;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 6, x + 60, y); ctx.stroke();
    }
  }, [60, 60]);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshToonMaterial({ map: ripples, color: 0xdfeaec }));
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  // the Ranger, parked in the shallows behind him
  const ranger = new THREE.Group();
  const hull = new THREE.Shape([V(-2.6, 0, 0), V(2.8, 0, 0), V(2.2, 0.9, 0), V(-1.6, 1.4, 0), V(-2.8, 0.7, 0)].map((p) => new THREE.Vector2(p.x, p.y)));
  const body = inked(new THREE.ExtrudeGeometry(hull, { depth: 2.4, bevelEnabled: false }), toon(0xe9ebe8), 0.04);
  body.position.z = -1.2;
  const cockpit = inked(new THREE.BoxGeometry(1.4, 0.3, 1.6), toon(0x1b1f25), 0.02);
  cockpit.position.set(1.4, 1.1, 0);
  cockpit.rotation.z = -0.5;
  const stripe = inked(new THREE.BoxGeometry(4.6, 0.12, 2.42), toon(0x9aa0a6), 0);
  stripe.position.set(0, 0.45, 0);
  const wings = inked(new THREE.BoxGeometry(1.6, 0.14, 5.4), toon(0xd4d7d3), 0.03);
  wings.position.set(-1.2, 0.5, 0);
  ranger.add(body, cockpit, stripe, wings);
  ranger.position.set(-6, 0.1, -7);
  ranger.rotation.y = 0.7;
  scene.add(ranger);

  // THE WAVE: a curling wall with a white crest, far enough away to pass for mountains
  const profile = new THREE.Shape();
  profile.moveTo(0, 0);
  profile.bezierCurveTo(-2, 12, -10, 34, -2, 44);
  profile.bezierCurveTo(2, 48, 8, 46, 9, 41);
  profile.bezierCurveTo(4, 43, 0, 40, -4, 30);
  profile.bezierCurveTo(-12, 20, -30, 6, -40, 0);
  profile.closePath();
  const waveGeo = new THREE.ExtrudeGeometry(profile, { depth: 520, steps: 160, bevelEnabled: false, curveSegments: 18 });
  // extrude along x, with the curl of the crest leaning towards the camera (+z)
  waveGeo.rotateY(-Math.PI / 2);
  waveGeo.translate(260, 0, 0);
  // an uneven crest line, so from far away it passes for a mountain range
  const wp = waveGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < wp.count; i++) {
    const x = wp.getX(i);
    wp.setY(i, wp.getY(i) * (0.72 + 0.2 * Math.sin(x * 0.045 + 0.6) + 0.12 * Math.sin(x * 0.13 + 2) + 0.06 * Math.sin(x * 0.31)));
  }
  waveGeo.computeVertexNormals();
  const waveMat = new THREE.MeshToonMaterial({
    color: 0xffffff, gradientMap: toon(0xffffff).gradientMap,
    map: canvasTexture(64, 256, (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, "#2f5566"); g.addColorStop(0.55, "#4d7f93"); g.addColorStop(0.78, "#8fb9c6"); g.addColorStop(0.86, "#f4fbfc"); g.addColorStop(1, "#ffffff");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }),
  });
  // world-space height drives the gradient, so the crest is white however far it rises
  waveMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vH;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvH = position.y / 46.0;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vH;")
      .replace("#include <map_fragment>", "diffuseColor.rgb *= texture2D(map, vec2(0.5, clamp(vH, 0.0, 1.0))).rgb;");
  };
  waveMat.fog = false;
  const wave = new THREE.Mesh(waveGeo, waveMat);
  scene.add(wave);
  const spray = new THREE.Mesh(new THREE.PlaneGeometry(520, 8), additive(0xffffff, 0));
  scene.add(spray);

  const hero = dressed(quan);
  hero.root.scale.setScalar(1);
  hero.root.position.set(0.4, 0, 1.2);
  spaceHelmet(hero);
  scene.add(hero.root);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), additive(0xffffff, 0));
  hero.parts.camera.add(flash);
  flash.position.z = 0.3;
  // little splashes where the feet are
  const splash = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 40), additive(0xffffff, 0.25));
  splash.rotation.x = -Math.PI / 2;
  splash.position.y = 0.02;
  scene.add(splash);

  const cues: FilmSet["cues"] = [
    ...[0.1, 1.35, 2.6, 3.85].map((t): [number, FilmSet["cues"][number][1]] => [t, { kind: "sfx", name: "tick", volume: 0.8, rate: 0.8 }]),
    [1.2, { kind: "sfx", name: "shutter", volume: 0.9 }],
    [1.2, { kind: "pop", text: "CLICK!", at: V(1.6, 2.4, 2.2) }],
    [2.3, { kind: "sfx", name: "rumble", volume: 1 }],
    [2.4, { kind: "sfx", name: "braam", volume: 0.8 }],
    [3.3, { kind: "pop", text: "NOPE!", at: V(0.4, 3.0, 2.0), big: true }],
    [3.3, { kind: "sfx", name: "pop-1", volume: 0.8 }],
  ];

  function update(u: number): Frame {
    hero.update(u);
    // the "mountains" rise and roll in
    const rise = ease(seg(u, 2.1, 5.0));
    wave.position.z = -95 + rise * 62;
    wave.scale.y = 0.34 + rise * 0.8;
    wave.scale.z = 1 + rise * 0.3;
    spray.position.set(0, 44 * wave.scale.y + 4, wave.position.z - 2);
    (spray.material as THREE.MeshBasicMaterial).opacity = rise * 0.25;
    // selfie, look round, then run for it
    (flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - Math.abs(u - 1.25) / 0.12);
    const turn = ease(seg(u, 2.5, 2.9)) * (1 - ease(seg(u, 3.2, 3.45)));
    hero.root.rotation.y = 0.15 + turn * Math.PI * 0.95;
    const run = seg(u, 3.35, 5);
    hero.root.position.set(0.4 + run * 1.2, Math.abs(Math.sin(run * Math.PI * 4)) * 0.6 * (run > 0 ? 1 : 0), 1.2 + run * 3.4);
    if (u > 3.3) hero.cheering = 0.9;
    splash.position.set(hero.root.position.x, 0.02, hero.root.position.z);
    splash.scale.setScalar(0.9 + (u * 1.5 % 1) * 0.9);
    (splash.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - ((u * 1.5) % 1));

    let s;
    if (u < 2.2) {
      // in front of him, the "mountains" small on the horizon behind
      s = move(u, 0, 2.2, shot(V(1.6, 1.7, 8.5), V(0.1, 1.6, -4), 36), shot(V(1.3, 1.5, 7.4), V(0.2, 1.9, -6), 36));
    } else {
      // IMAX: pull back and tilt up as the wall of water fills the sky
      s = move(u, 2.2, 5.0, shot(V(1.3, 1.5, 7.4), V(0.2, 1.9, -6), 36), shot(V(3.2, 0.7, 12.5), V(0.4, 16, -30), 54));
    }
    const shake = seg(u, 3.4, 5) * 0.06;
    return { shot: s, imax: seg(u, 2.2, 3.0), shake, grade: { sat: 0.72, contrast: 1.05, bright: 0.02, vignette: 0.45, gain: new THREE.Color(0.97, 1.0, 1.02) } };
  }
  return { scene, update, cues };
}
