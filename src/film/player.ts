import * as THREE from "three";
import { Sound } from "../audio";
import { CREW, LITTLE_GIANT, hex } from "../crew";
import { clamp, lerp } from "../noise";
import { renderPortraits } from "../portraits";
import { Film, type SceneDef } from "./engine";
import { FilmLook } from "./post";
import type { Cue, Shot } from "./kit";

/**
 * The film player shared by every short on the site: renderer, grade pass,
 * letterbox, title cards, subtitles, comic pops, sound and transport. A route
 * only supplies its scenes, its sounds and a few words.
 */
export type FilmConfig = {
  scenes: SceneDef[];
  timing: { signOff: number; end: number; musicAt: number };
  globalCues: [number, Cue][];
  /** Folder under public/audio, the sample names in it, and which one is the music. */
  dir: string;
  sounds: string[];
  music: string;
  musicVolume: number;
  fonts: string[];
  /** Black cards over the cold open. */
  cards: { t0: number; t1: number; small: string; big: string }[];
  slate: (i: number) => string;
  starring: string;
  leadLabel: string;
};

export async function runFilm(cfg: FilmConfig) {
  const params = new URLSearchParams(location.search);
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
  await Promise.all(cfg.fonts.map((f) => document.fonts.load(f).catch(() => undefined)));

  /* ------------------------------------------------------------ renderer */

  const canvas = $<HTMLCanvasElement>("#film");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  const ratio = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(ratio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const look = new FilmLook(renderer);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
  const film = new Film(cfg.scenes, cfg.globalCues);

  const sound = new Sound(cfg.sounds.map((n) => `${cfg.dir}/${n}`), `${cfg.dir}/${cfg.music}`);

  /* -------------------------------------------------------------- the cast UI */

  const CAST = [LITTLE_GIANT, ...CREW];
  const faces = renderPortraits(CAST, 192);
  const face = (handle: string) => faces.get(handle) ?? "/vgang-mascot.svg";
  CAST.forEach((m, i) => {
    const img = document.createElement("img");
    img.src = face(m.handle);
    img.alt = m.name;
    img.style.setProperty("--i", String(i));
    $("#poster-cast").append(img);
  });
  cfg.scenes.forEach((s) => {
    if (!s.member) return;
    const el = document.createElement("figure");
    el.style.setProperty("--c", hex(s.member.color === 0x315b40 ? 0x7fb08a : s.member.color));
    el.style.setProperty("--i", String($("#credits").children.length));
    el.innerHTML = `<img src="${face(s.member.handle)}" alt="" /><figcaption><b>${s.member.name}</b><i>${s.credit?.title ?? cfg.leadLabel}</i></figcaption>`;
    $("#credits").append(el);
  });

  /* ------------------------------------------------------------ state */

  let t = 0;
  let playing = false;
  let started = false;
  let frozen = false;
  let now = 0;
  let sceneIndex = -1;
  let captionKey = "";

  const shake = new THREE.Vector3();
  function frameCamera(s: Shot, amount: number, imax: number) {
    // the authored fov is the vertical fov of a 2.39:1 scope band; keep its width,
    // and let the IMAX moments open the frame up and down
    const w = innerWidth, h = innerHeight, screen = w / h;
    const portrait = screen < 1.1;
    const scope = portrait ? Math.max(screen, 0.92) : Math.max(2.39, screen);
    const band = lerp(scope, screen, imax);
    const halfW = Math.tan(THREE.MathUtils.degToRad(s.fov) / 2) * 2.39 * (portrait ? 0.62 : 1);
    const bandH = halfW / band;
    const fraction = Math.min(1, screen / band);
    const halfV = Math.min(bandH / fraction, 1.15);
    camera.fov = THREE.MathUtils.radToDeg(Math.atan(halfV)) * 2;
    camera.aspect = screen;
    camera.updateProjectionMatrix();
    const bar = Math.max(0, (h - w / band) / 2);
    document.documentElement.style.setProperty("--bar", `${bar.toFixed(1)}px`);
    shake.set(Math.sin(now * 41) + Math.sin(now * 23), Math.sin(now * 37) + Math.cos(now * 29), 0).multiplyScalar(amount * 0.5);
    camera.position.copy(s.pos).add(shake);
    camera.up.set(0, 1, 0);
    camera.lookAt(s.look.clone().add(shake.multiplyScalar(0.5)));
    if (s.roll) camera.rotateZ(s.roll);
  }

  /* ------------------------------------------------------------ UI cues */

  const pops: { el: HTMLElement; at: THREE.Vector3; born: number }[] = [];
  function pop(text: string, at: THREE.Vector3, big = false) {
    const el = document.createElement("div");
    el.className = `pop${big ? " big" : ""}`;
    el.innerHTML = `<span>${text}</span>`;
    $("#pops").append(el);
    pops.push({ el, at: at.clone(), born: performance.now() });
  }
  function handle(cue: Cue) {
    if (cue.kind === "sfx") sound.play(`${cfg.dir}/${cue.name}`, cue.volume ?? 0.8, { rate: cue.rate, reverse: cue.reverse });
    else if (cue.kind === "pop") { if (!frozen) pop(cue.text, cue.at, cue.big); }
    else if (cue.kind === "duck") sound.duck(cue.volume * 0.6, cue.seconds ?? 0.8);
  }

  function showScene(i: number) {
    const s = cfg.scenes[i];
    const title = $("#title");
    title.classList.remove("show");
    $("#pops").innerHTML = "";
    pops.length = 0;
    if (s.credit && s.member) {
      void title.offsetWidth;
      title.querySelector(".kicker")!.textContent = s.credit.vi;
      const film = title.querySelector(".film") as HTMLElement;
      film.textContent = s.credit.title;
      film.dataset.id = s.id;
      title.querySelector(".star")!.innerHTML = `${cfg.starring} <b style="--c:${hex(s.member.color)}">${s.member.name}</b> ${s.credit.role}<span>${s.member.name} ${s.credit.roleVi}</span>`;
      title.classList.add("show");
      const slate = $("#slate");
      slate.querySelector("b")!.textContent = cfg.slate(i);
      slate.classList.remove("clap");
      void slate.offsetWidth;
      slate.classList.add("clap");
    }
    document.body.dataset.scene = s.id;
  }

  function updateText() {
    const s = cfg.scenes[sceneIndex];
    const local = t - s.t0;
    const c = t < cfg.timing.signOff ? s.captions.find((c) => local >= c.u0 && local < c.u1) : undefined;
    const key = c ? `${s.id}:${c.u0}` : "";
    if (key !== captionKey) {
      captionKey = key;
      const sub = $("#sub");
      sub.classList.remove("show");
      if (c) {
        void sub.offsetWidth;
        sub.querySelector(".en")!.textContent = c.en;
        sub.querySelector(".vi")!.textContent = c.vi;
        sub.classList.add("show");
      }
    }
    // the cold open's title cards
    const card = $("#card");
    const shown = started ? cfg.cards.findIndex((c) => t >= c.t0 && t < c.t1) : -1;
    if (shown >= 0) {
      card.querySelector(".small")!.textContent = cfg.cards[shown].small;
      card.querySelector(".big")!.textContent = cfg.cards[shown].big;
    }
    card.classList.toggle("show", shown >= 0);
    card.classList.toggle("second", shown > 0);
    document.body.classList.toggle("signing", t >= cfg.timing.signOff);
  }

  /* ------------------------------------------------------------ transport */

  function seek(to: number) {
    t = clamp(to, 0, cfg.timing.end);
    film.seek(t);
    sceneIndex = -1;
    captionKey = "-";
    document.body.classList.remove("ended");
  }
  function play(from = 0) {
    seek(from);
    playing = true;
    document.body.dataset.state = "playing";
    $("#replay").textContent = "❚❚ Pause";
    const offset = t - cfg.timing.musicAt;
    if (offset >= 0) sound.startMusic(offset, cfg.musicVolume);
  }
  async function begin() {
    if (!started) {
      started = true;
      document.body.classList.add("started");
    }
    await sound.unlock();
  }
  $("#play").addEventListener("click", async () => { await begin(); play(Number(params.get("t") ?? 0) || 0); });
  $("#replay").addEventListener("click", async () => {
    await begin();
    if (t >= cfg.timing.end - 0.05 || !playing && document.body.classList.contains("ended")) { play(0); return; }
    playing = !playing;
    $("#replay").textContent = playing ? "❚❚ Pause" : "▶ Play";
    if (playing && t >= cfg.timing.musicAt) sound.startMusic(t - cfg.timing.musicAt, cfg.musicVolume); else sound.stopMusic();
  });
  $("#mute").addEventListener("click", () => { sound.setMuted(!sound.muted); $("#mute").classList.toggle("muted", sound.muted); });
  addEventListener("keydown", (e) => {
    if (e.key === " ") { $("#replay").click(); e.preventDefault(); }
    if (e.key.toLowerCase() === "m") $("#mute").click();
    if (e.key.toLowerCase() === "r") { void begin().then(() => play(0)); }
  });
  document.body.classList.toggle("clean", params.has("clean"));

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    look.setSize(innerWidth, innerHeight, ratio);
  }
  addEventListener("resize", resize);
  resize();

  // compile every set's shaders now, so no cut hitches on first sight
  film.prime((scene, frame) => { frameCamera(frame.shot, 0, 0); renderer.compile(scene, camera); });

  /* ------------------------------------------------------------ loop */

  const clock = new THREE.Timer();
  function frame() {
    clock.update();
    const dt = Math.min(clock.getDelta(), 1 / 20);
    now += dt;
    if (playing) {
      const before = t;
      t += dt;
      if (before < cfg.timing.musicAt && t >= cfg.timing.musicAt) sound.startMusic(t - cfg.timing.musicAt, cfg.musicVolume);
      if (t >= cfg.timing.end) {
        t = cfg.timing.end;
        playing = false;
        document.body.classList.add("ended");
        $("#replay").textContent = "↺ Replay";
      }
    }
    const view = film.update(t, playing);
    for (const cue of film.drainCues()) handle(cue);
    if (view.index !== sceneIndex) { sceneIndex = view.index; showScene(sceneIndex); }
    updateText();
    frameCamera(view.frame.shot, view.frame.shake ?? 0, view.frame.imax ?? 0);
    // after the cut to black the film is over: the frame goes dark under the sign-off
    if (t >= cfg.timing.signOff) {
      view.grade.gain = new THREE.Color(0, 0, 0);
      view.grade.lift = new THREE.Color(0, 0, 0);
      view.grade.grain = 0.035;
    }
    look.apply(view.grade, now);
    look.render(view.scene, camera);
    $("#progress").style.transform = `scaleX(${clamp(t / cfg.timing.end)})`;

    const t0 = performance.now();
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      const age = (t0 - p.born) / 1000;
      if (age > 1.2) { p.el.remove(); pops.splice(i, 1); continue; }
      const v = p.at.clone().project(camera);
      p.el.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px)`;
      p.el.style.opacity = v.z > 1 ? "0" : "1";
    }
    requestAnimationFrame(frame);
  }

  if (params.has("debug")) {
    Object.assign(window, {
      __lg: {
        at(to: number) {
          started = true;
          frozen = true;
          document.body.classList.add("started");
          document.body.dataset.state = "playing";
          playing = false;
          seek(to);
        },
        film, camera, THREE,
        time: () => t,
      },
    });
  }
  if (params.has("autoplay")) void begin().then(() => play(Number(params.get("t") ?? 0) || 0));
  requestAnimationFrame(frame);

}
