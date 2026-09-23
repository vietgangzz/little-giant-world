import * as THREE from "three";

/** The comic look: three hard light bands, dark plum ink lines, halftone shade. */
export const INK = 0x24163f;

let ramp: THREE.DataTexture | null = null;
export function toonRamp() {
  if (ramp) return ramp;
  const steps = new Uint8Array([96, 96, 176, 176, 255, 255, 255, 255]);
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((value, i) => data.set([value, value, value, 255], i * 4));
  ramp = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

const toonCache = new Map<string, THREE.MeshToonMaterial>();
export function toon(color: THREE.ColorRepresentation, options: THREE.MeshToonMaterialParameters = {}) {
  const key = `${new THREE.Color(color).getHexString()}|${JSON.stringify(options)}`;
  const hit = toonCache.get(key);
  if (hit && !options.map) return hit;
  const material = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...options });
  toonCache.set(key, material);
  return material;
}

/**
 * Screen-space halftone dots in the shaded band, the printed-comic texture the
 * clouds in the reference carry. Patched into the toon shader so it keeps shadows.
 */
export function halftone(material: THREE.MeshToonMaterial, strength = 0.22, size = 6) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      float lum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
      float baseLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)) + 1e-3;
      float shade = clamp(1.0 - lum / baseLum, 0.0, 1.0);
      vec2 cell = gl_FragCoord.xy / ${size.toFixed(1)};
      cell.x += step(1.0, mod(floor(cell.y), 2.0)) * 0.5;
      float dotMask = step(length(fract(cell) - 0.5), shade * 0.62);
      outgoingLight = mix(outgoingLight, outgoingLight * 0.72 + vec3(0.02, 0.0, 0.08), dotMask * ${strength.toFixed(2)} * 4.0);
      #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => `halftone-${strength}-${size}`;
  return material;
}

const outlineCache = new Map<string, THREE.MeshBasicMaterial>();
function outlineMaterial(thickness: number, color: number) {
  const key = `${thickness}|${color}`;
  const hit = outlineCache.get(key);
  if (hit) return hit;
  const material = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 outlineNormal;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\ntransformed += outlineNormal * ${thickness.toFixed(4)};`);
  };
  material.customProgramCacheKey = () => `outline-${thickness}`;
  outlineCache.set(key, material);
  return material;
}

/**
 * Hard-edged meshes (boxes, cones) carry one normal per face, so pushing along
 * them tears the hull open at every corner. The hull instead follows normals
 * averaged across every face that shares a position.
 */
function ensureOutlineNormals(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute("outlineNormal")) return;
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const sums = new Map<string, THREE.Vector3>();
  const key = (i: number) =>
    `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
  for (let i = 0; i < position.count; i++) {
    const k = key(i);
    const sum = sums.get(k) ?? sums.set(k, new THREE.Vector3()).get(k)!;
    sum.x += normal.getX(i); sum.y += normal.getY(i); sum.z += normal.getZ(i);
  }
  const out = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const n = sums.get(key(i))!.clone().normalize();
    out.set([n.x, n.y, n.z], i * 3);
  }
  geometry.setAttribute("outlineNormal", new THREE.BufferAttribute(out, 3));
}

/** Adds an inverted-hull ink line. Works for plain and instanced meshes. */
export function outline<T extends THREE.Mesh>(mesh: T, thickness = 0.03, color = INK): T {
  ensureOutlineNormals(mesh.geometry);
  const material = outlineMaterial(thickness, color);
  if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh) {
    const source = mesh as unknown as THREE.InstancedMesh;
    const hull = new THREE.InstancedMesh(source.geometry, material, source.count);
    hull.instanceMatrix = source.instanceMatrix;
    hull.frustumCulled = false;
    hull.name = `${mesh.name} ink`;
    // Instances carry their own transforms and the parent's matrix is identity,
    // so the hull can live as a child and share the instance buffer verbatim.
    source.add(hull);
  } else {
    const hull = new THREE.Mesh(mesh.geometry, material);
    hull.name = "ink";
    hull.raycast = () => {};
    mesh.add(hull);
  }
  return mesh;
}

/** One-liner for the common case: a toon mesh with shadows and an ink line. */
export function inked(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation | THREE.Material,
  thickness = 0.03,
) {
  const material = color instanceof THREE.Material ? color : toon(color);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (thickness > 0) outline(mesh, thickness);
  return mesh;
}
