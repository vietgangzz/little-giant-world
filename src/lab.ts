import * as THREE from "three";
import { dressed } from "./accessories";
import { CREW, LITTLE_GIANT } from "./crew";

/** Dev page: the whole cast in a row, for checking costumes (?yaw=0.6&hat). */
const params = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#c") as HTMLCanvasElement, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff8e7);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a9a, 1.6));
const key = new THREE.DirectionalLight(0xfff4e0, 2.3);
key.position.set(-4, 8, 8);
key.castShadow = true;
key.shadow.camera.left = key.shadow.camera.bottom = -14;
key.shadow.camera.right = key.shadow.camera.top = 14;
scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshToonMaterial({ color: 0xf1e6cc }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const yaw = Number(params.get("yaw") ?? 0.35);
const cast = [LITTLE_GIANT, ...CREW].map((m, i) => {
  const d = dressed(m, { hat: params.has("hat") && i === 0, kit: !(params.has("hat") && i === 0) });
  d.root.scale.setScalar(1);
  d.root.position.set((i - 4.5) * 2.9, 0, 0);
  d.root.rotation.y = yaw;
  scene.add(d.root);
  return d;
});
const camera = new THREE.PerspectiveCamera(Number(params.get("fov") ?? 30), 1, 0.1, 200);
const focus = Number(params.get("focus") ?? -1);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
const t0 = performance.now();
renderer.setAnimationLoop(() => {
  const t = (performance.now() - t0) / 1000;
  cast.forEach((m) => m.update(Number(params.get("t") ?? t)));
  if (focus >= 0) {
    const x = cast[focus].root.position.x;
    camera.position.set(x + 1.2, 1.6, 5.2);
    camera.lookAt(x, 1.0, 0);
  } else {
    camera.position.set(0, 4, 34);
    camera.lookAt(0, 1.1, 0);
  }
  renderer.render(scene, camera);
});
Object.assign(window, { __lg: { cast } });
