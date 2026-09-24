import * as THREE from "three";
import type { Grade } from "./kit";

/**
 * The film look, as one full-screen pass over the rendered frame: a colour
 * grade per scene (Memento's black and white, Tenet's red/blue split, the
 * Trinity flash), plus vignette, film grain and a faint ink-and-wash paper
 * texture borrowed from the Foldline reference.
 */
export const DEFAULT_GRADE: Grade = {
  sat: 1, contrast: 1, bright: 0, bw: 0, sepia: 0, split: 0, flash: 0, vignette: 0.45, grain: 0.05,
  lift: new THREE.Color(0, 0, 0), gain: new THREE.Color(1, 1, 1),
};

export class FilmLook {
  readonly target: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private scene = new THREE.Scene();
  readonly uniforms: Record<string, THREE.IUniform>;

  constructor(private renderer: THREE.WebGLRenderer) {
    this.target = new THREE.WebGLRenderTarget(4, 4, { samples: 4, type: THREE.HalfFloatType });
    this.uniforms = {
      tScene: { value: this.target.texture },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSat: { value: 1 }, uContrast: { value: 1 }, uBright: { value: 0 }, uBW: { value: 0 }, uSepia: { value: 0 },
      uSplit: { value: 0 }, uFlash: { value: 0 }, uVignette: { value: 0.45 }, uGrain: { value: 0.05 },
      uLift: { value: new THREE.Color(0, 0, 0) }, uGain: { value: new THREE.Color(1, 1, 1) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene; uniform float uTime; uniform vec2 uRes;
        uniform float uSat, uContrast, uBright, uBW, uSepia, uSplit, uFlash, uVignette, uGrain;
        uniform vec3 uLift, uGain;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec2 uv = vUv;
          // a hair of lens fringing towards the corners
          vec2 off = (uv - 0.5) * 0.0025;
          vec3 c = vec3(texture2D(tScene, uv + off).r, texture2D(tScene, uv).g, texture2D(tScene, uv - off).b);
          c = c * uGain + uLift * (1.0 - c);
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(vec3(l), c, uSat);
          c = (c - 0.18) * uContrast + 0.18 + uBright;
          c = max(c, 0.0);
          // Memento black and white: a touch of extra contrast, slightly cool
          vec3 bw = vec3(pow(l, 0.92) * 1.05) * vec3(0.97, 1.0, 1.04);
          c = mix(c, bw, uBW);
          c = mix(c, vec3(l) * vec3(1.12, 0.94, 0.72), uSepia);
          // Tenet: the frame split into red (forwards) and blue (inverted)
          vec3 red = vec3(1.18, 0.82, 0.78), blue = vec3(0.74, 0.9, 1.22);
          c *= mix(vec3(1.0), mix(red, blue, smoothstep(0.47, 0.53, uv.x)), uSplit);
          // ink-and-wash paper: soft fibres that darken the shade a little
          float paper = noise(gl_FragCoord.xy / 3.0) * 0.5 + noise(gl_FragCoord.xy / 22.0) * 0.5;
          c *= 1.0 - (paper - 0.5) * 0.06;
          // film grain, re-rolled every frame
          float g = hash(gl_FragCoord.xy + fract(uTime * 13.0) * 100.0) - 0.5;
          c += g * uGrain * (0.6 + l);
          // vignette
          vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
          c *= 1.0 - uVignette * smoothstep(0.35, 1.1, length(q));
          c = mix(c, vec3(1.0), uFlash);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(geo, material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  setSize(w: number, h: number, ratio: number) {
    this.target.setSize(Math.round(w * ratio), Math.round(h * ratio));
    (this.uniforms.uRes.value as THREE.Vector2).set(w, h);
  }

  apply(grade: Grade, time: number) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uSat.value = grade.sat; u.uContrast.value = grade.contrast; u.uBright.value = grade.bright;
    u.uBW.value = grade.bw; u.uSepia.value = grade.sepia; u.uSplit.value = grade.split; u.uFlash.value = grade.flash;
    u.uVignette.value = grade.vignette; u.uGrain.value = grade.grain;
    (u.uLift.value as THREE.Color).copy(grade.lift); (u.uGain.value as THREE.Color).copy(grade.gain);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}

/** Blends a partial grade over the defaults. */
export function grade(partial: Partial<Grade> = {}): Grade {
  return { ...DEFAULT_GRADE, ...partial, lift: partial.lift ?? DEFAULT_GRADE.lift, gain: partial.gain ?? DEFAULT_GRADE.gain };
}
