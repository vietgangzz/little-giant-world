import "./style.css";
import { runFilm } from "../film/player";
import { FILM, GLOBAL_CUES, SCENES } from "./film";

const ROMAN = ["", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "✦"];

await runFilm({
  scenes: SCENES,
  timing: FILM,
  globalCues: GLOBAL_CUES,
  dir: "medieval",
  sounds: [
    "feast", "gallop", "cheer", "cheer-soft", "chant", "crowd", "clang", "anvil", "bubble", "splat", "quill", "bell", "plop", "portal",
    "zap", "sword", "thud", "clink", "cloth", "fire", "dunk", "jingle", "bells", "whoosh", "land", "pop-1", "pop-2", "shutter", "flash", "tick", "braam",
  ],
  music: "feast",
  musicVolume: 0.55,
  fonts: ["700 40px Cinzel", "900 40px 'Cinzel Decorative'", "40px MedievalSharp", "20px 'IM Fell English'"],
  cards: [
    { t0: 0, t1: 1.15, small: "VGang Studios presents", big: "a tale of long ago" },
    { t0: 1.15, t1: 2.3, small: "ngày xửa ngày xưa…", big: "The Little Kingdom" },
  ],
  slate: (i) => ROMAN[i] ?? "",
  starring: "starring",
  leadLabel: "The Traveller",
});
