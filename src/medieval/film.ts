import { CREW, LITTLE_GIANT } from "../crew";
import type { SceneDef } from "../film/engine";
import type { Cue } from "../film/kit";
import { arrival, portal } from "./sets/arrival";
import { jester, king, knight } from "./sets/court";
import { alchemist, bard, heretic } from "./sets/folk";
import { feast } from "./sets/feast";
import { blacksmith, painter, scribe } from "./sets/workshops";

/**
 * THE LITTLE KINGDOM — the crew fall through a hole in time into 1326, and
 * the village hands every one of them a job. Nine little scenes, a feast,
 * and a knighting.
 */
const who = (handle: string) => CREW.find((c) => c.handle === handle)!;
const S = 5;
const R0 = 10.5;
const at = (i: number) => R0 + i * S;

export const SCENES: SceneDef[] = [
  {
    id: "portal", t0: 0, t1: 5.5, build: portal,
    captions: [{ u0: 2.5, u1: 5.4, en: "One wrong turn at the Đông Sơn drum…", vi: "Rẽ nhầm một cái ở trống đồng Đông Sơn…" }],
  },
  {
    id: "arrival", t0: 5.5, t1: R0, build: arrival,
    captions: [
      { u0: 0.3, u1: 2.6, en: "…and the whole crew landed in 1326.", vi: "…và cả hội rơi thẳng vào năm 1326." },
      { u0: 2.8, u1: 4.9, en: "The village gave everyone a job.", vi: "Dân làng giao cho mỗi người một việc." },
    ],
  },
  {
    id: "king", t0: at(0), t1: at(1), build: king, member: who("nnphong1904"),
    credit: { title: "The King", vi: "Chương I · Nhà Vua", role: "as King Phong the First", roleVi: "vai Vua Phong Đệ Nhất" },
    captions: [
      { u0: 0.3, u1: 2.8, en: "King Phong the First. The crown is a little big.", vi: "Vua Phong Đệ Nhất. Vương miện hơi rộng." },
      { u0: 3.0, u1: 4.9, en: "First royal decree: 1, 2, 3, ZÔ!", vi: "Chiếu chỉ đầu tiên: một, hai, ba, ZÔ!" },
    ],
  },
  {
    id: "knight", t0: at(1), t1: at(2), build: knight, member: who("baronha"),
    credit: { title: "The Knight", vi: "Chương II · Hiệp Sĩ", role: "as Sir Shades", roleVi: "vai Hiệp sĩ Kính Râm" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Sir Shades charges the training dummy…", vi: "Hiệp sĩ Kính Râm lao vào hình nộm…" },
      { u0: 2.6, u1: 4.9, en: "…the dummy won. The sunglasses survived.", vi: "…hình nộm thắng. Kính râm vẫn nguyên." },
    ],
  },
  {
    id: "jester", t0: at(2), t1: at(3), build: jester, member: who("giaBaoJS"),
    credit: { title: "The Jester", vi: "Chương III · Anh Hề", role: "& the poodle, as the court jesters", roleVi: "và bé poodle, hai anh hề cung đình" },
    captions: [
      { u0: 0.3, u1: 2.4, en: "Three balls. One poodle. One hoop.", vi: "Ba quả bóng. Một bé poodle. Một cái vòng." },
      { u0: 2.6, u1: 4.9, en: "Guess who gets the applause.", vi: "Đoán xem ai được vỗ tay." },
    ],
  },
  {
    id: "painter", t0: at(3), t1: at(4), build: painter, member: who("anhquan291"),
    credit: { title: "The Court Painter", vi: "Chương IV · Họa Sĩ", role: "as the fastest painter in Europe", roleVi: "vai họa sĩ nhanh nhất châu Âu" },
    captions: [
      { u0: 0.3, u1: 1.9, en: "A royal portrait takes three months.", vi: "Một bức chân dung mất ba tháng." },
      { u0: 2.1, u1: 4.9, en: "Quan: one click.", vi: "Quan: một cú bấm." },
    ],
  },
  {
    id: "blacksmith", t0: at(4), t1: at(5), build: blacksmith, member: who("tuanngocptn"),
    credit: { title: "The Blacksmith", vi: "Chương V · Thợ Rèn", role: "as the blacksmith", roleVi: "vai thợ rèn" },
    captions: [
      { u0: 0.3, u1: 2.6, en: "Nick forges a sword for the king…", vi: "Nick rèn kiếm cho nhà vua…" },
      { u0: 2.8, u1: 4.9, en: "…okay, a chain. It's always a chain.", vi: "…à thôi, dây chuyền. Lúc nào cũng là dây chuyền." },
    ],
  },
  {
    id: "scribe", t0: at(5), t1: at(6), build: scribe, member: who("huytdps13400"),
    credit: { title: "The Scribe", vi: "Chương VI · Thầy Chép Sách", role: "as Brother David", roleVi: "vai thầy tu David" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Brother David copies the sacred texts…", vi: "Thầy David chép sách thánh…" },
      { u0: 2.5, u1: 4.9, en: "…with a few TODOs.", vi: "…kèm vài dòng TODO." },
    ],
  },
  {
    id: "alchemist", t0: at(6), t1: at(7), build: alchemist, member: who("khoatranthanh"),
    credit: { title: "The Alchemist", vi: "Chương VII · Nhà Giả Kim", role: "as the alchemist (and dad)", roleVi: "vai nhà giả kim (kiêm bố bỉm)" },
    captions: [
      { u0: 0.3, u1: 2.2, en: "Khoa tries a new potion on the kids…", vi: "Khoa thử thuốc mới lên hai đứa nhỏ…" },
      { u0: 2.4, u1: 4.9, en: "Babies → frogs → princes. Close enough.", vi: "Em bé → ếch → hoàng tử. Cũng gần đúng." },
    ],
  },
  {
    id: "bard", t0: at(7), t1: at(8), build: bard, member: who("dennytosp"),
    credit: { title: "The Bard", vi: "Chương VIII · Người Hát Rong", role: "as the bard (with his own mic)", roleVi: "vai người hát rong (tự mang micro)" },
    captions: [
      { u0: 0.3, u1: 2.3, en: "Mad Dinh brought a lute. And a microphone.", vi: "Mad Dinh mang theo đàn luýt. Và micro." },
      { u0: 2.5, u1: 4.9, en: "The tavern has never been this loud.", vi: "Quán rượu chưa bao giờ ồn đến thế." },
    ],
  },
  {
    id: "heretic", t0: at(8), t1: at(9), build: heretic, member: who("ritesh"),
    credit: { title: "The Heretic", vi: "Chương IX · Kẻ Tội Đồ", role: "accused of sorcery", roleVi: "bị buộc tội phù thủy" },
    captions: [
      { u0: 0.3, u1: 2.4, en: "Ritesh's crime: a glowing black mirror.", vi: "Tội của Ritesh: cầm \"tấm gương đen phát sáng\"." },
      { u0: 2.6, u1: 4.9, en: "So he went live. 10k peasants watching.", vi: "Thế là cậu ấy livestream. 10 nghìn dân làng xem." },
    ],
  },
  {
    id: "feast", t0: at(9), t1: at(9) + 5.5, build: feast, member: LITTLE_GIANT,
    credit: { title: "Sir Little Giant", vi: "Kết · Yến Tiệc", role: "as the lost traveller, knighted", roleVi: "vai kẻ lạc đường được phong hiệp sĩ" },
    captions: [
      { u0: 0.3, u1: 2.6, en: "And the lost traveller? Knighted.", vi: "Còn kẻ lạc đường? Được phong hiệp sĩ." },
      { u0: 2.9, u1: 5.4, en: "Long live the VGang kingdom!", vi: "Vương quốc VGang muôn năm!" },
    ],
  },
];

export const FILM = {
  signOff: SCENES[SCENES.length - 1].t1,
  end: SCENES[SCENES.length - 1].t1 + 6.5,
  musicAt: 2.3,
};

export const GLOBAL_CUES: [number, Cue][] = [
  ...SCENES.slice(2).map((s): [number, Cue] => [s.t0 - 0.03, { kind: "sfx", name: "whoosh", volume: 0.35 }]),
];
