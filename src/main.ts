import * as THREE from "three";
import "./style.css";
import { Sound } from "./audio";
import { clamp, lerp, smoothstep } from "./noise";
import { car, clouds, smallPlane, starfield, Trails } from "./props";
import { airport, haGiang, haLong, hoiAn, saiGon, worldLandmarks } from "./scenery";
import { hex } from "./crew";
import { renderPortraits } from "./portraits";
import { CAPTIONS, CHAPTERS, CREW, LITTLE_GIANT, Story, T, type Cue, type Shot } from "./story";
import { buildPlanet, buildRoad, heightAt, R, Ring, roadA, roadB, scatterTrees } from "./world";

type Mode = "story" | "orbit" | "bike" | "plane";
const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

await document.fonts.load("92px Bangers").catch(() => undefined);

/* ------------------------------------------------------------ renderer */

const canvas = $<HTMLCanvasElement>("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 1500);
camera.position.set(0, 8, 44);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(900, 32, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uUp: { value: new THREE.Vector3(0, 1, 0) }, uAlt: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uUp; uniform float uAlt; varying vec3 vDir;
      void main(){
        float h = dot(normalize(vDir), uUp);
        vec3 space = mix(vec3(0.27,0.16,0.53), vec3(0.36,0.22,0.64), smoothstep(-0.6,0.8,vDir.y));
        vec3 day = mix(vec3(0.66,0.84,1.0), vec3(0.33,0.6,0.96), smoothstep(-0.05,0.55,h));
        gl_FragColor = vec4(mix(space, day, uAlt), 1.0);
      }`,
  }),
);
sky.frustumCulled = false;
scene.add(sky);
const stars = starfield();
scene.add(stars);

const hemi = new THREE.HemisphereLight(0xf1ecff, 0x6a5a8a, 1.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

/* --------------------------------------------------------------- world */

const planet = buildPlanet();
const trees = scatterTrees();
scene.add(planet, buildRoad(roadA), buildRoad(roadB), trees.group, haGiang(), haLong(), hoiAn(), saiGon(), airport(), worldLandmarks());
// boats, rafts and river lanterns rock gently on the water
const bobbers: { obj: THREE.Object3D; base: THREE.Vector3; phase: number }[] = [];
scene.traverse((o) => { if (o.userData.bob !== undefined) bobbers.push({ obj: o, base: o.position.clone(), phase: o.userData.bob }); });
const sky3d = clouds();
scene.add(sky3d.group);
const trails = new Trails();
scene.add(trails.mesh);
const story = new Story();
scene.add(story.group);

// ambient traffic: cars both ways on both roads, planes on their own great circles
const traffic = Array.from({ length: 22 }, (_, i) => {
  const ring = i % 3 ? roadB : roadA;
  const dir = ring === roadA ? -1 : i % 2 ? 1 : -1;
  const mesh = car([0xff6b6b, 0x6bcbff, 0xffc93c, 0xa78bfa, 0xf4f1ff, 0x5ee6a8][i % 6]);
  scene.add(mesh);
  return { ring, mesh, theta: (i / 22) * Math.PI * 2 * 3.1, speed: (0.05 + (i % 5) * 0.008) * dir, side: 0.08 * dir * (ring === roadA ? -1 : 1) };
});
const flyers = Array.from({ length: 4 }, (_, i) => {
  const a = new THREE.Vector3(Math.sin(i * 2.1), Math.cos(i * 1.3), Math.sin(i * 0.7 + 1)).normalize();
  const b = new THREE.Vector3(0, 1, 0).cross(a).normalize();
  const mesh = smallPlane([0xff6b6b, 0x6bcbff, 0xffc93c, 0xa78bfa][i]);
  scene.add(mesh);
  return { ring: new Ring(a, b), mesh, alt: 2.4 + i * 0.3, speed: 0.1 + i * 0.02, last: 0 };
});

/* -------------------------------------------------------------- camera */

const orbit = {
  dir: roadA.dir(0.45).add(new THREE.Vector3(0, 0.25, 0)).normalize(),
  up: new THREE.Vector3(0, 1, 0),
  dist: 34,
  targetDist: 34,
  vx: 0, vy: 0,
  idle: 0,
};
function orbitShot(): Shot {
  const ground = R + Math.max(heightAt(orbit.dir), 0.06);
  orbit.dist = lerp(orbit.dist, Math.max(orbit.targetDist, ground + 0.5), 0.12);
  const tilt = smoothstep(R + 14, R + 0.6, orbit.dist);
  const pos = orbit.dir.clone().multiplyScalar(orbit.dist);
  const ahead = orbit.dir.clone().multiplyScalar(R).addScaledVector(orbit.up, 3.2 + (orbit.dist - R));
  return {
    pos,
    look: new THREE.Vector3().lerp(ahead, tilt),
    up: orbit.up.clone().lerp(orbit.dir, tilt).normalize(),
    stiffness: 12,
    fov: lerp(42, 55, tilt),
  };
}
function rotateOrbit(dx: number, dy: number) {
  const right = new THREE.Vector3().crossVectors(orbit.up, orbit.dir).normalize();
  const k = 0.0045 * clamp((orbit.dist - R) / 14, 0.08, 1.4);
  const q = new THREE.Quaternion().setFromAxisAngle(orbit.up, -dx * k)
    .multiply(new THREE.Quaternion().setFromAxisAngle(right, dy * k));
  orbit.dir.applyQuaternion(q).normalize();
  orbit.up.applyQuaternion(q);
  orbit.up.sub(orbit.dir.clone().multiplyScalar(orbit.up.dot(orbit.dir))).normalize();
}
const camLook = new THREE.Vector3();
const camUp = new THREE.Vector3(0, 1, 0);
/** The ground (or sea) radius under a point, plus a margin. */
function floorAt(p: THREE.Vector3, margin: number) {
  return R + Math.max(heightAt(p), 0.06) + margin;
}
/**
 * Keeps a camera position out of the hills: never below the ground, and raised
 * until nothing on the planet stands between it and what it is looking at.
 */
function clearView(pos: THREE.Vector3, look: THREE.Vector3) {
  const p = pos.clone();
  if (p.length() > R + 4) return p;
  for (let pass = 0; pass < 6; pass++) {
    let worst = 0;
    const floor = floorAt(p, 0.22);
    if (p.length() < floor) worst = floor - p.length();
    for (let i = 1; i < 12; i++) {
      const q = p.clone().lerp(look, i / 12);
      const need = floorAt(q, 0.04) - q.length();
      // obstacles near the camera cost more height to clear than ones near the subject
      if (need > 0) worst = Math.max(worst, need * (1.3 - i / 12));
    }
    if (worst <= 0) break;
    p.addScaledVector(p.clone().normalize(), worst + 0.05);
  }
  return p;
}
function applyShot(shot: Shot, dt: number, snap = false) {
  const k = snap ? 1 : 1 - Math.exp(-dt * shot.stiffness);
  camera.position.lerp(clearView(shot.pos, shot.look), k);
  const floor = floorAt(camera.position, 0.18);
  if (camera.position.length() < floor) camera.position.setLength(floor);
  camLook.lerp(shot.look, k);
  camUp.lerp(shot.up, k).normalize();
  camera.up.copy(camUp);
  camera.lookAt(camLook);
  camera.fov = lerp(camera.fov, shot.fov, k);
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------------ UI */

const sound = new Sound();
let mode: Mode = "orbit";
let storyTime = 0;
let playing = false;
let freeTime = 0;
let started = false;
/** QA only: pins the camera to an exact shot. */
let debugShot: Shot | null = null;
const clean = params.has("clean");
document.body.classList.toggle("clean", clean);

// every mascot rendered once, in costume, for the DOM UI
const CAST = [LITTLE_GIANT, ...CREW];
const mascotShots = renderPortraits(CAST, 192, { heroHat: true });
const mascotOf = (m: (typeof CAST)[number]) => mascotShots.get(m.handle) ?? "/vgang-mascot.svg";
// the sign-off parades the whole crew under the VG TEAM title
CAST.forEach((m, i) => {
  const face = document.createElement("figure");
  face.style.setProperty("--c", hex(m.color));
  face.style.setProperty("--i", String(i));
  face.innerHTML = `<img src="${mascotOf(m)}" alt="${m.name}" /><figcaption>${m.name}</figcaption>`;
  $("#signoff-crew").append(face);
});
const crewRow = $("#crew-row");
CAST.forEach((m, i) => {
  const face = document.createElement("i");
  face.style.setProperty("--c", hex(m.color));
  face.innerHTML = `<img src="${mascotOf(m)}" alt="" />`;
  face.title = m.name;
  face.dataset.i = String(i);
  crewRow.append(face);
});
function setCount(crew: number, friends: number) {
  crewRow.querySelectorAll("i").forEach((el, i) => el.classList.toggle("on", i < crew));
  $("#crew-count").textContent = `${crew}/${CAST.length}`;
  $("#friend-count").textContent = String(friends);
}

const pops: { el: HTMLElement; at: THREE.Vector3; born: number }[] = [];
function spawnPop(at: THREE.Vector3, text = "POP!") {
  const el = document.createElement("div");
  el.className = "pop";
  el.innerHTML = `<span>${text}</span>`;
  $("#pops").append(el);
  pops.push({ el, at: at.clone(), born: performance.now() });
}
function toast(text: string, color: number, portrait?: string, mascot?: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.style.setProperty("--c", `#${color.toString(16).padStart(6, "0")}`);
  // the member's photo, with their mascot peeking over its shoulder
  el.innerHTML = `${portrait ? `<img src="${portrait}" alt="" />` : "<b>★</b>"}${mascot ? `<img class="buddy" src="${mascot}" alt="" />` : ""}<span>${text}</span>`;
  $("#toasts").append(el);
  setTimeout(() => el.classList.add("out"), 2300);
  setTimeout(() => el.remove(), 2800);
}
function stamp(text: string) {
  const el = document.createElement("div");
  el.className = "stamp";
  el.textContent = text;
  el.style.setProperty("--r", `${(Math.random() * 16 - 8).toFixed(1)}deg`);
  $("#stamps").append(el);
}
function handle(cue: Cue) {
  switch (cue.kind) {
    case "sfx": sound.play(cue.name, cue.volume ?? 0.8); break;
    case "pop": spawnPop(cue.at, cue.text); break;
    case "toast": toast(cue.text, cue.color, cue.member ? cue.member.photo ?? mascotOf(cue.member) : undefined, cue.member?.photo ? mascotOf(cue.member) : undefined); break;
    case "stamp": stamp(cue.text); break;
    case "count": setCount(cue.crew, cue.friends); break;
    case "signoff": document.body.classList.add("signing"); break;
  }
}

let captionIndex = -2;
let chapterIndex = -1;
function updateCaption(t: number) {
  const i = mode === "story" ? CAPTIONS.findIndex((c) => t >= c.t0 && t < c.t1) : -1;
  if (i !== captionIndex) {
    captionIndex = i;
    const box = $("#caption");
    box.classList.remove("show");
    if (i >= 0) {
      void box.offsetWidth;
      box.querySelector(".en")!.textContent = CAPTIONS[i].en;
      box.querySelector(".vi")!.textContent = CAPTIONS[i].vi;
      box.classList.add("show");
    }
  }
  let c = -1;
  CHAPTERS.forEach((ch, k) => { if (t >= ch.t) c = k; });
  if (mode === "story" && c !== chapterIndex) {
    chapterIndex = c;
    if (c >= 0) {
      const chip = $("#chapter");
      chip.innerHTML = `<b>${CHAPTERS[c].label}</b><i>${CHAPTERS[c].vi}</i>`;
      chip.classList.remove("show");
      void chip.offsetWidth;
      chip.classList.add("show");
    }
  }
}

function setMode(next: Mode) {
  if (next === "story") {
    startStory(0);
    return;
  }
  if (mode === "story") {
    playing = false;
    sound.fadeMusic(1.2);
    document.body.classList.remove("signing");
    // hand the camera to the orbit rig from wherever the story left it
    orbit.dir.copy(camera.position).normalize();
    orbit.targetDist = orbit.dist = Math.max(camera.position.length(), R + 2);
    orbit.up.copy(camera.up).sub(orbit.dir.clone().multiplyScalar(camera.up.dot(orbit.dir))).normalize();
  }
  if (mode === "story") {
    $("#stamps").innerHTML = "";
    $("#toasts").innerHTML = "";
  }
  mode = next;
  freeTime = 0;
  document.body.dataset.mode = mode;
  document.querySelectorAll<HTMLButtonElement>(".modes button[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
  updateCaption(0);
  setCount(CAST.length, 5);
}

function startStory(at: number) {
  mode = "story";
  document.body.dataset.mode = mode;
  document.querySelectorAll<HTMLButtonElement>(".modes button[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === "story"));
  document.body.classList.remove("signing", "ended");
  $("button[data-mode=story]").textContent = "▶ Story";
  $("#stamps").innerHTML = "";
  $("#toasts").innerHTML = "";
  storyTime = at;
  story.seek(at);
  chapterIndex = -1;
  captionIndex = -2;
  setCount(1, 0);
  playing = true;
  sound.startMusic(at);
  applyShot(story.update(at, false), 0, true);
}

/** Every first interaction goes through here: audio can only unlock inside a gesture. */
async function begin() {
  if (!started) {
    started = true;
    document.body.classList.add("started");
  }
  await sound.unlock();
}
async function start() {
  if (started) return;
  await begin();
  startStory(Math.max(0, Number(params.get("t") ?? 0) || 0));
}
async function go(next: Mode) {
  await begin();
  setMode(next);
}
$("#play").addEventListener("click", start);
document.querySelectorAll<HTMLButtonElement>(".modes button[data-mode]").forEach((b) =>
  b.addEventListener("click", () => void go(b.dataset.mode as Mode)));
$("#mute").addEventListener("click", () => {
  sound.setMuted(!sound.muted);
  $("#mute").classList.toggle("muted", sound.muted);
});
addEventListener("keydown", (e) => {
  if (e.key === "1") void go("orbit");
  if (e.key === "2") void go("bike");
  if (e.key === "3") void go("plane");
  if (e.key.toLowerCase() === "r") void go("story");
  if (e.key.toLowerCase() === "m") $("#mute").click();
  if (e.key === " " && mode === "story") {
    playing = !playing;
    if (playing) sound.startMusic(storyTime); else sound.stopMusic();
    e.preventDefault();
  }
});

// drag to spin, wheel / pinch to zoom
const pointers = new Map<number, { x: number; y: number }>();
let pinch = 0;
canvas.addEventListener("pointerdown", (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  if (mode !== "orbit" && mode !== "story") return;
  if (mode === "story" && !playing) setMode("orbit");
});
canvas.addEventListener("pointermove", (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (mode !== "orbit") return;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) orbit.targetDist = clamp(orbit.targetDist * (pinch / d), R + 0.4, 46);
    pinch = d;
    return;
  }
  orbit.vx = dx; orbit.vy = dy;
  rotateOrbit(dx, dy);
  orbit.idle = 0;
});
const release = (e: PointerEvent) => { pointers.delete(e.pointerId); pinch = 0; };
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (mode !== "orbit") setMode("orbit");
  orbit.targetDist = clamp(orbit.targetDist * Math.exp(e.deltaY * 0.0012), R + 0.4, 46);
  orbit.idle = 0;
}, { passive: false });

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole planet in frame on a tall phone
  camera.zoom = w / h < 0.8 ? 0.62 : 1;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

/* ---------------------------------------------------------------- loop */

const clock = new THREE.Timer();
let now = 0;
const tmpV = new THREE.Vector3();
const lightDir = new THREE.Vector3();
let lastTrail = 0;

function frame() {
  clock.update();
  const dt = Math.min(clock.getDelta(), 1 / 20);
  now += dt;
  let shot: Shot;
  if (mode === "story") {
    if (playing) storyTime += dt;
    shot = story.update(storyTime, playing);
    for (const cue of story.drainCues()) handle(cue);
    if (storyTime > T.end - 3.2 && storyTime - dt <= T.end - 3.2) sound.fadeMusic(3);
    if (storyTime >= T.end) {
      setMode("orbit");
      document.body.classList.add("ended");
      $("button[data-mode=story]").textContent = "↺ Replay";
    }
    $("#progress").style.transform = `scaleX(${clamp(storyTime / T.end)})`;
  } else {
    freeTime += dt;
    const free = story.free(mode, freeTime);
    if (mode === "orbit") {
      orbit.idle += dt;
      if (!pointers.size) {
        orbit.vx *= 0.92; orbit.vy *= 0.92;
        rotateOrbit(orbit.vx + (orbit.idle > 2.5 ? -0.35 : 0), orbit.vy);
      }
    }
    shot = free ?? orbitShot();
  }
  if (debugShot) shot = debugShot;
  applyShot(shot, dt, !!debugShot);
  updateCaption(storyTime);

  // world life
  sky3d.update(dt);
  traffic.forEach((c) => {
    c.theta += c.speed * dt;
    const up = c.ring.dir(c.theta, tmpV).clone();
    const fwd = c.ring.tangent(c.theta).multiplyScalar(Math.sign(c.speed));
    c.mesh.position.copy(c.ring.point(c.theta, 0, c.side));
    c.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd));
  });
  const emit = now - lastTrail > 0.035;
  if (emit) lastTrail = now;
  flyers.forEach((f) => {
    const th = now * f.speed + f.alt;
    const up = f.ring.dir(th).clone();
    const fwd = f.ring.tangent(th);
    f.mesh.position.copy(up).multiplyScalar(R + f.alt);
    f.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd));
    if (emit) trails.emit(f.mesh.position.clone().addScaledVector(fwd, -0.2), now);
  });
  for (const p of story.puffs.splice(0)) trails.emit(p, now);
  trails.update(now, 1);
  trees.update(camera.position);
  bobbers.forEach((b) => b.obj.position.copy(b.base).addScaledVector(b.base.clone().normalize(), Math.sin(now * 1.6 + b.phase) * 0.008));

  // sky: space far out, day-blue near the ground
  const alt = camera.position.length();
  const skyAmount = smoothstep(R + 3.4, R + 0.9, alt);
  (sky.material as THREE.ShaderMaterial).uniforms.uAlt.value = skyAmount;
  (sky.material as THREE.ShaderMaterial).uniforms.uUp.value.copy(camera.position).normalize();
  sky.position.copy(camera.position);
  (stars.material as THREE.PointsMaterial).opacity = 1 - skyAmount * 0.8;
  ((planet.getObjectByName("halo") as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uFade.value = smoothstep(R * 1.12, R * 1.5, alt);
  stars.position.copy(camera.position);

  // key light rides with the camera: upper-left, a little in front
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const upv = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
  lightDir.copy(upv).multiplyScalar(1).addScaledVector(right, -0.7).addScaledVector(back, 0.8).normalize();
  const focus = camLook.lengthSq() < 1 ? new THREE.Vector3() : camLook.clone();
  const span = clamp(camera.position.distanceTo(focus) * 0.55, 2.5, 14);
  sun.target.position.copy(focus);
  sun.position.copy(focus).addScaledVector(lightDir, 30);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -span;
  sc.right = sc.top = span;
  sc.near = 1; sc.far = 70;
  sc.updateProjectionMatrix();

  // comic pops follow their spot in the world
  const t0 = performance.now();
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i];
    const age = (t0 - p.born) / 1000;
    if (age > 1.1) { p.el.remove(); pops.splice(i, 1); continue; }
    const v = p.at.clone().project(camera);
    p.el.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px)`;
    p.el.style.opacity = v.z > 1 ? "0" : "1";
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

setMode("orbit");
document.body.dataset.mode = "intro";
// QA hook: freeze and scrub the story deterministically (?debug)
if (params.has("debug")) {
  Object.assign(window, {
    __lg: {
      at(t: number) {
        started = true;
        document.body.classList.add("started");
        if (mode !== "story") startStory(t);
        storyTime = t; story.seek(t); playing = false;
        document.body.classList.toggle("signing", t >= T.signOff);
        applyShot(story.update(t, false), 0, true);
      },
      mode: setMode,
      orbit,
      story,
      THREE,
      camera,
      time: () => storyTime,
      /** Pin the camera relative to an object's own axes (forward, right, up), in world units. */
      frame(o: THREE.Object3D, f: number, r: number, u: number, lookUp = 0.15, fov = 35) {
        o.updateMatrixWorld();
        const p = o.getWorldPosition(new THREE.Vector3());
        const q = o.getWorldQuaternion(new THREE.Quaternion());
        const up = p.clone().normalize();
        const pos = p.clone().addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(q), f)
          .addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(q), r).addScaledVector(up, u);
        debugShot = { pos, look: p.clone().addScaledVector(up, lookUp), up, stiffness: 100, fov };
      },
      /** Pin the camera: positions in world units, `up` defaults to the local vertical. */
      cam(pos: number[] | null, look?: number[], fov = 45) {
        if (!pos) { debugShot = null; return; }
        const p = new THREE.Vector3(...(pos as [number, number, number]));
        debugShot = { pos: p, look: new THREE.Vector3(...(look as [number, number, number])), up: p.clone().normalize(), stiffness: 100, fov };
      },
    },
  });
}
if (params.has("autoplay")) void start();
requestAnimationFrame(frame);
