import { CREW, LITTLE_GIANT } from "../crew";
import type { SceneDef } from "../film/engine";
import type { Cue } from "../film/kit";
import { opening } from "./sets/opening";
import { memento } from "./sets/memento";
import { prestige } from "./sets/prestige";
import { darkKnight } from "./sets/darkKnight";
import { inception } from "./sets/inception";
import { interstellar } from "./sets/interstellar";
import { dunkirk } from "./sets/dunkirk";
import { rises } from "./sets/rises";
import { tenet } from "./sets/tenet";
import { oppenheimer } from "./sets/oppenheimer";
import { premiere } from "./sets/premiere";

/**
 * THE NOLAN CUT — nine VGang members, nine Christopher Nolan scenes, one
 * minute. Each scene is its own little set with its own camera language and
 * grade; the film cuts between them on a fixed timeline.
 */

const who = (handle: string) => CREW.find((c) => c.handle === handle)!;
const S = 5; // every film gets five seconds
const at = (i: number) => S + i * S;

export const SCENES: SceneDef[] = [
  {
    id: "opening", t0: 0, t1: 5, build: opening, member: LITTLE_GIANT,
    captions: [{ u0: 2.5, u1: 4.6, en: "Nine friends. Nine Nolan films. One tiny studio.", vi: "Chín người bạn. Chín phim Nolan. Một studio tí hon." }],
  },
  {
    id: "memento", t0: at(0), t1: at(1), build: memento, member: who("nnphong1904"),
    credit: { title: "MEMENTO", vi: "Kẻ Mất Trí Nhớ", role: "as the man who can't remember the last round", roleVi: "vai gã không nhớ mình đã uống mấy ly" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Phong can't remember how many beers he's had…", vi: "Phong không nhớ mình đã uống mấy ly…" },
      { u0: 2.5, u1: 4.9, en: "…so he wrote it down. Everywhere.", vi: "…nên ghi chú khắp nơi." },
    ],
  },
  {
    id: "prestige", t0: at(1), t1: at(2), build: prestige, member: who("khoatranthanh"),
    credit: { title: "THE PRESTIGE", vi: "Ảo Thuật Gia Đấu Trí", role: "as The Great Dad-ini", roleVi: "vai ông bố ảo thuật gia" },
    captions: [
      { u0: 0.2, u1: 2.0, en: "Are you watching closely?", vi: "Nhìn kỹ nhé…" },
      { u0: 2.6, u1: 4.9, en: "One baby goes in. Eight babies come out.", vi: "Một em bé đi vào. Tám em bé đi ra." },
    ],
  },
  {
    id: "darkKnight", t0: at(2), t1: at(3), build: darkKnight, member: who("baronha"),
    credit: { title: "THE DARK KNIGHT", vi: "Kỵ Sĩ Bóng Đêm", role: "as the Dark Knight, in sunglasses", roleVi: "vai Kỵ Sĩ Bóng Đêm đeo kính râm" },
    captions: [
      { u0: 0.3, u1: 2.8, en: "Gotham called. They drew our mascot on the sky.", vi: "Gotham gọi. Họ chiếu cả mascot lên trời." },
      { u0: 3.0, u1: 4.9, en: "Why so serious? It's just the shades.", vi: "Sao nghiêm túc thế? Tại cái kính thôi." },
    ],
  },
  {
    id: "inception", t0: at(3), t1: at(4), build: inception, member: who("giaBaoJS"),
    credit: { title: "INCEPTION", vi: "Kẻ Đánh Cắp Giấc Mơ", role: "& the poodle, as the dreamers", roleVi: "và bé poodle, hai kẻ mộng mơ" },
    captions: [
      { u0: 0.3, u1: 2.4, en: "In Paul's dream, Paris folds in half…", vi: "Trong mơ của Paul, Paris gập đôi lại…" },
      { u0: 2.6, u1: 4.9, en: "…the poodle is not impressed.", vi: "…bé poodle vẫn thản nhiên." },
    ],
  },
  {
    id: "interstellar", t0: at(4), t1: at(5), build: interstellar, member: who("anhquan291"),
    credit: { title: "INTERSTELLAR", vi: "Hố Đen Tử Thần", role: "as the astronaut on a photo trip", roleVi: "vai phi hành gia đi du lịch chụp ảnh" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Quan found the perfect mountains for a photo.", vi: "Quan tìm được dãy núi đẹp để chụp hình." },
      { u0: 2.5, u1: 4.9, en: "Those aren't mountains. That's a wave.", vi: "Đó không phải núi. Đó là sóng." },
    ],
  },
  {
    id: "dunkirk", t0: at(5), t1: at(6), build: dunkirk, member: who("huytdps13400"),
    credit: { title: "DUNKIRK", vi: "Cuộc Di Tản Dunkirk", role: "as the soldier who brought his homework", roleVi: "vai người lính mang theo bài tập" },
    captions: [
      { u0: 0.3, u1: 2.6, en: "What do you see?", vi: "Cậu thấy gì?" },
      { u0: 2.9, u1: 4.9, en: "Home.", vi: "Nhà." },
    ],
  },
  {
    id: "rises", t0: at(6), t1: at(7), build: rises, member: who("tuanngocptn"),
    credit: { title: "THE DARK KNIGHT RISES", vi: "Kỵ Sĩ Bóng Đêm Trỗi Dậy", role: "as the one who climbs out", roleVi: "vai người leo lên khỏi giếng" },
    captions: [
      { u0: 0.3, u1: 2.2, en: "No rope. Just the chain.", vi: "Không dây thừng. Chỉ có dây chuyền." },
      { u0: 2.5, u1: 4.9, en: "Rise. (Leg day finally paid off.)", vi: "Trỗi dậy. (Tập chân cuối cùng cũng có ích.)" },
    ],
  },
  {
    id: "tenet", t0: at(7), t1: at(8), build: tenet, member: who("ritesh"),
    credit: { title: "TENET", vi: "Tenet", role: "as the protagonist (in reverse)", roleVi: "vai nhân vật chính (tua ngược)" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Don't try to understand it. Feel it.", vi: "Đừng cố hiểu. Hãy cảm nhận." },
      { u0: 2.5, u1: 4.9, en: "Ritesh replies before you've even asked.", vi: "Ritesh trả lời trước cả khi bạn hỏi." },
    ],
  },
  {
    id: "oppenheimer", t0: at(8), t1: at(9), build: oppenheimer, member: who("dennytosp"),
    credit: { title: "OPPENHEIMER", vi: "Oppenheimer", role: "as the man with the loudest mic", roleVi: "vai người cầm micro to nhất" },
    captions: [
      { u0: 0.2, u1: 2.1, en: "Three… two… one…", vi: "Ba… hai… một…" },
      { u0: 3.7, u1: 4.95, en: "The loudest mic drop in history.", vi: "Pha thả mic ồn nhất lịch sử." },
    ],
  },
  {
    id: "premiere", t0: at(9), t1: at(9) + 5.6, build: premiere,
    captions: [{ u0: 0.4, u1: 3.4, en: "Starring: the whole crew.", vi: "Diễn viên chính: cả hội." }],
  },
];

export const FILM = {
  signOff: SCENES[SCENES.length - 1].t1,
  end: SCENES[SCENES.length - 1].t1 + 6.6,
  /** The music starts on the opening clap. */
  musicAt: 4.72,
};

/** Cues that belong to the whole film rather than one set: ticks, the slate claps. */
export const GLOBAL_CUES: [number, Cue][] = [
  // the Zimmer watch: a tick every second over the cold open, speeding up
  ...[0.25, 1.05, 1.75, 2.35, 2.85, 3.3, 3.7, 4.05, 4.35].map((t): [number, Cue] => [t, { kind: "sfx", name: "tick", volume: 0.55 }]),
  ...SCENES.slice(1).map((s): [number, Cue] => [s.t0 - 0.02, { kind: "sfx", name: "cut", volume: 0.45 }]),
];

