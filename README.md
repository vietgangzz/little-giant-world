# Little Giant! — a VietGang tiny-planet tale

A 50-second interactive short about the VietGang mascot. Little Giant rounds up the
crew on one xe máy through Hà Giang, Hạ Long, Hội An and Sài Gòn (nine on one bike,
totally normal). Then the whole crew flies around a tiny planet: Singapore, Tokyo,
Cairo, Paris and New York. Everyone ends up back home around a Đông Sơn bronze drum.

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
- **Mascot**: the approved Little Giant SVG paths, extruded and bevelled, with a
  nón lá lathed from the landing page's hat profile.

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
- Made with ♥ by VietGang and Claude Opus 5.5.
