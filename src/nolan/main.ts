import "./style.css";
import { runFilm } from "../film/player";
import { FILM, GLOBAL_CUES, SCENES } from "./film";

await runFilm({
  scenes: SCENES,
  timing: FILM,
  globalCues: GLOBAL_CUES,
  dir: "nolan",
  sounds: [
    "heroic", "tick", "cut", "clap", "braam", "shutter", "shake", "flash", "clink", "cards", "hum", "zap", "wind", "cape", "steps",
    "rumble", "engine", "horn", "chant", "whoosh", "land", "pop-1", "pop-2", "bats", "shatter", "crash", "mic", "goggles", "boom", "spin", "applause",
  ],
  music: "heroic",
  musicVolume: 0.6,
  fonts: ["300 40px Oswald", "700 40px Oswald", "40px 'Permanent Marker'"],
  cards: [
    { t0: 0, t1: 1.05, small: "VGANG STUDIOS", big: "presents" },
    { t0: 1.05, t1: 2.25, small: "a film in nine scenes", big: "THE NOLAN CUT" },
  ],
  slate: (i) => `SC. ${String(i).padStart(2, "0")}`,
  starring: "starring",
  leadLabel: "DIRECTOR",
});
