/**
 * The VietGang crew as the studio board draws them: one body colour, forest
 * eyes, and one signature prop each. Colours are the board's own values
 * (landing-v2 `CrewMascot.tsx`), so the 3D cast matches the website.
 */
export type Kit = "director" | "beer" | "shades" | "travel" | "poodle" | "student" | "rebel" | "street" | "parent" | "phone";

export type CrewMember = {
  handle: string;
  name: string;
  role: string;
  color: number;
  /** Eye ink, only when the body is too dark for forest eyes. */
  eyes?: number;
  /** The small accent the board uses for rays and trims. */
  accent: number;
  kit: Kit;
  /** A team photo from landing-v2, or null to use the rendered mascot. */
  photo: string | null;
};

export const LITTLE_GIANT: CrewMember = {
  handle: "vietgang", name: "Little Giant", role: "Mascot & director", color: 0xc6df70, accent: 0xe63946, kit: "director", photo: null,
};

/** Board order. The tiny-planet story picks them up in this order too. */
export const CREW: CrewMember[] = [
  { handle: "giaBaoJS", name: "Paul", role: "Engineer", color: 0xe6c667, accent: 0x567449, kit: "poodle", photo: "/team/paul.webp" },
  { handle: "huytdps13400", name: "David", role: "Engineer", color: 0xbadb96, accent: 0xd9784d, kit: "student", photo: "/team/david.webp" },
  { handle: "anhquan291", name: "Quan", role: "Engineer", color: 0x9ecddd, accent: 0xdc7b50, kit: "travel", photo: null },
  { handle: "dennytosp", name: "Mad Dinh", role: "Engineer", color: 0xb1a0cc, accent: 0xd78255, kit: "rebel", photo: "/team/mad-dinh.webp" },
  { handle: "baronha", name: "Bao Ha", role: "Engineer & designer", color: 0xf3b48e, accent: 0x647b42, kit: "shades", photo: "/team/baronha.webp" },
  { handle: "khoatranthanh", name: "Khoa", role: "Engineer", color: 0xd7b0bd, accent: 0xc77f52, kit: "parent", photo: "/team/khoa.webp" },
  { handle: "tuanngocptn", name: "Nick", role: "Engineer", color: 0xd98573, accent: 0x43684a, kit: "street", photo: "/team/nick.webp" },
  { handle: "ritesh", name: "Ritesh", role: "Design engineer", color: 0x89bbaa, accent: 0xd9784d, kit: "phone", photo: null },
  { handle: "nnphong1904", name: "Phong", role: "Engineer", color: 0x315b40, eyes: 0xedf1d2, accent: 0xdc8b57, kit: "beer", photo: "/team/phong.webp" },
];

export const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;
