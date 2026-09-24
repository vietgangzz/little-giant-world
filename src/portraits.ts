import * as THREE from "three";
import { dressed } from "./accessories";
import type { CrewMember } from "./crew";

/**
 * Renders every crew mascot once into a small transparent PNG, so the DOM UI
 * (HUD row, toasts, credits) shows exactly the 3D characters on screen. A
 * throwaway renderer does it at load, then gives its WebGL context back.
 */
export function renderPortraits(members: CrewMember[], size = 192, options: { heroHat?: boolean } = {}) {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a9a, 1.7));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.2);
  key.position.set(-2, 4, 5);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const out = new Map<string, string>();
  for (const member of members) {
    // on the tiny planet the hero wears the nón lá instead of the director's kit
    const m = member.kit === "director" && options.heroHat ? dressed(member, { hat: true, kit: false }) : dressed(member);
    m.root.scale.setScalar(1);
    m.update(0.4);
    scene.add(m.root);
    const box = new THREE.Box3().setFromObject(m.root);
    const center = box.getCenter(new THREE.Vector3());
    const span = Math.max(box.max.x - box.min.x, box.max.y - box.min.y) * 1.08;
    // a three-quarter view from slightly above, the way the board draws them
    camera.position.set(center.x + span * 0.55, center.y + span * 0.35, center.z + span * 1.9);
    camera.lookAt(center);
    renderer.render(scene, camera);
    out.set(member.handle, canvas.toDataURL("image/png"));
    scene.remove(m.root);
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
