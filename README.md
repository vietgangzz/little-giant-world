# Little Giant! — a VietGang tiny-planet tale

A 60-second interactive short about the VietGang mascot. Little Giant rounds up the
crew on one xe máy through Hà Giang, Hạ Long, Hội An and Sài Gòn (nine on one bike,
totally normal). Then the whole crew flies around a tiny planet: Singapore, Tokyo,
Cairo, Paris and New York. Everyone ends up back home around a Đông Sơn bronze drum,
and it signs off "made with ♥ by VG TEAM".

After the story the planet is yours:

| Key | Mode |
| --- | --- |
| **R** | Replay the story |
| **1** | Orbit: drag to spin, scroll or pinch to zoom (the camera tilts to the horizon as you get close) |
| **2** | Ride the xe máy with the whole crew stacked on it |
| **3** | Fly the tour plane |
| **M** / **Space** | Mute / pause the story |

URL flags: `?autoplay` starts at once, `?t=30` jumps into the story, `?clean` hides
the controls for screen capture, `?debug` exposes `window.__lg.at(t)` to freeze any
frame.

## Stack

Vite + TypeScript + three.js, no other runtime dependencies.

- **Planet**: one icosphere displaced by continent blobs, simplex fBm and ridged
  mountains. The water shell is tinted per vertex by the depth underneath it.
- **Toon look**: `MeshToonMaterial` on a three-step ramp, inverted-hull ink lines
  pushed along averaged normals (so boxes don't tear at the corners), and
  screen-space halftone dots on the clouds.
- **Story**: a pure function of time (`Story.update(t)`), so any frame can be
  scrubbed and replayed deterministically. Its cues drive the sound, the comic
  pops, the toasts and the passport stamps.
- **Mascot**: the approved Little Giant SVG silhouette, *inflated* like a balloon
  (`src/inflate.ts`): each point is lifted by a circular profile of its distance
  to the outline, so the logo becomes a round pebble. The eyes, sparkles and
  blush are decals that follow the curved face. The nón lá is lathed from the
  landing page's hat profile.
- **Sets**: every location is dressed in a flat local frame (`Local` in
  `src/scenery.ts`) and wrapped onto the sphere, so props always stand upright.
- **Camera**: each shot is a target (position, look, up, stiffness) that the rig
  eases towards. Big moves arc around the subject so they never skim over it.
  A clearance pass lifts the camera above the terrain and out of any hill that
  blocks the line of sight, and trees shrink away when the camera gets close.

```sh
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # typecheck + production build in dist/
```

## Credits

- Music: “Carefree” by Kevin MacLeod (incompetech.com), licensed under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Sound effects: [Kenney](https://kenney.nl) *Music Jingles*, *Impact Sounds*
  and *Interface Sounds*, CC0. All audio is sampled; none of it is synthesised.
- Fonts: Bangers and Nunito (Google Fonts, OFL).
- Made with ♥ by the VG team.

## The Nolan Cut (`/nolan/`)

A second route: VGang Studios restages nine Christopher Nolan scenes in one minute, one crew member per film.

| Scene | Star | Gag / camera |
| --- | --- | --- |
| Memento | Phong | B&W polaroid that fades, snap to colour on the wall of notes: 1·2·3 ZÔ! |
| The Prestige | Khoa | Tesla coil "Transported Man": two babies become eight; symmetrical push-in from the stalls |
| The Dark Knight | Bao Ha | IMAX helicopter spiral down the tower; bat-signal throws the mascot on the clouds |
| Inception | Paul + poodle | Paris folds over their heads; low tracking shot tilting up |
| Interstellar | Quan | "Mountains" behind his selfie rise into a wave; the tick of the clock |
| Dunkirk | David | Along the mole, a Spitfire overhead, "What do you see?" "Home." |
| The Dark Knight Rises | Nick | Worm's-eye up the Pit, the leap, a burst of bats |
| Tenet | Ritesh | Red/blue split, inverted twin, phone falls up, palindrome dolly, sounds played backwards |
| Oppenheimer | Mad Dinh | Mic countdown, white flash, silence, the boom arrives late |

It ends at the premiere on the spinning top, and cuts to black before the top falls.

How it's built:
- Every scene is its own `THREE.Scene` with a pure `update(u)` that returns the shot and the grade. The film cuts on a fixed timeline (`src/nolan/film.ts`).
- The film look is one full-screen pass (`src/nolan/post.ts`). It carries a per-scene colour grade: black & white, sepia, the Tenet split, and the flash. On top of that sit grain, a vignette and a faint ink-and-wash paper texture.
- Scope letterbox bars (2.39:1) with torn-paper edges open up for the IMAX moments. The authored fov keeps its width, so IMAX shows more frame above and below.
- The crew's board looks (colours, beer, shades, camera, poodle, cap, chain, babies, phone) live in `src/accessories.ts` and are shared with the planet story.
- The UI portraits are the 3D mascots rendered once to PNG (`src/portraits.ts`).
- Sound is sampled only: "Heroic Age" by Kevin MacLeod (CC BY 4.0) and Kenney CC0 recordings. The BRAAAM, the applause and the boom are layered and pitched in ffmpeg. The Tenet sounds are reversed buffers.

Dev: `lab.html` lines up the whole dressed cast (`?yaw=0.6&focus=3`).

## The Little Kingdom (`/medieval/`)

A third short, about 65 seconds long. The crew take a wrong turn at the Đông Sơn drum and fall through time into 1326, then drop into a hay cart in the village square. The village hands each of them a job:

| Chapter | Who | Gag |
| --- | --- | --- |
| I · The King | Phong | The crown is too big; first royal decree: 1, 2, 3, ZÔ! |
| II · The Knight | Bao Ha | Sir Shades charges the quintain, the sandbag knocks him into the hay, and the sunglasses survive |
| III · The Jester | Paul + poodle | Juggling; the poodle jumps the hoop and ends up with all three balls on its nose |
| IV · The Court Painter | Quan | A portrait takes three months. One camera click, and the sitter faints |
| V · The Blacksmith | Nick | Forging a sword… it turns out to be a gold chain |
| VI · The Scribe | David | An illuminated manuscript with a `// TODO: fix bug` in the margin |
| VII · The Alchemist | Khoa | Potion: babies → frogs → crowned princes |
| VIII · The Bard | Mad Dinh | Lute plus his own microphone; the tavern dances |
| IX · The Heretic | Ritesh | In the stocks for a "glowing black mirror"; he goes live to 10k peasants |
| The Feast | Little Giant | Knighted by King Phong. Long live the VGang kingdom! |

Both films run on the same player (`src/film/player.ts` and `src/film/engine.ts`). A route only supplies its scenes, sounds and words. The medieval wardrobe (crown, helm, jester hat, hood, wizard hat, bard cap) and the set pieces (castle, cottages, horse, stocks) live in `src/medieval/`.

Audio credits:
- Music: "Master of the Feast" by Kevin MacLeod (CC BY 4.0).
- Horse gallop by AntumDeluge (OpenGameArt, CC BY).
- Crowd cheering by Gregor Quendel (OpenGameArt, CC BY).
- Everything else: Kenney CC0.
