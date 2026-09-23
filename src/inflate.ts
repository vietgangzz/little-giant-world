import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * "Balloon" inflation of a flat silhouette. A grid is laid over the outline,
 * cells that touch the inside are kept, and vertices that fall outside are
 * snapped onto the outline. Each vertex is then lifted by a height that depends
 * on its distance to the edge, so a disc inflates into an ellipsoid and the brand
 * silhouette becomes a round, pebble-like body instead of an extruded slab.
 */

export type Contour = THREE.Vector2[];

type Hit = { d: number; qx: number; qy: number };

/** Signed distance to a closed polyline: positive inside, with the nearest edge point. */
export function signedDistance(x: number, y: number, c: Contour): Hit {
  let best = Infinity, qx = x, qy = y, inside = false;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const a = c[j], b = c[i];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    const ex = b.x - a.x, ey = b.y - a.y;
    const len = ex * ex + ey * ey || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / len));
    const px = a.x + ex * t, py = a.y + ey * t;
    const dd = (x - px) ** 2 + (y - py) ** 2;
    if (dd < best) { best = dd; qx = px; qy = py; }
  }
  const d = Math.sqrt(best);
  return { d: inside ? d : -d, qx, qy };
}

/**
 * Builds the surface. `lift(x, y, d)` returns the height above z=0 for a point
 * at distance `d` inside the outline. With `twoSided`, the back mirrors the
 * front and the two meet exactly on the outline, so the result is closed.
 */
export function inflate(contour: Contour, resolution: number, lift: (x: number, y: number, d: number) => number, twoSided = true) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  contour.forEach((p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });
  const step = Math.max(maxX - minX, maxY - minY) / resolution;
  const cols = Math.ceil((maxX - minX) / step) + 3, rows = Math.ceil((maxY - minY) / step) + 3;
  const x0 = minX - step, y0 = minY - step;
  const hits: Hit[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) hits.push(signedDistance(x0 + i * step, y0 + j * step, contour));

  const front: number[] = [], back: number[] = [];
  const vertex = (i: number, j: number) => {
    const h = hits[j * cols + i];
    const x = h.d >= 0 ? x0 + i * step : h.qx;
    const y = h.d >= 0 ? y0 + j * step : h.qy;
    const z = lift(x, y, Math.max(h.d, 0));
    return [x, y, z];
  };
  const tri = (a: number[], b: number[], c: number[]) => {
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-9) return;
    const [p, q] = area > 0 ? [b, c] : [c, b];
    front.push(...a, ...p, ...q);
    if (twoSided) back.push(a[0], a[1], -a[2], q[0], q[1], -q[2], p[0], p[1], -p[2]);
  };
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const ids = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const inside = ids.map(([a, b]) => hits[b * cols + a].d > 0);
      if (!inside.some(Boolean)) continue;
      const [a, b, c, d] = ids.map(([u, v]) => vertex(u, v));
      if (inside[0] || inside[1] || inside[2]) tri(a, b, c);
      if (inside[0] || inside[2] || inside[3]) tri(a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...front, ...back], 3));
  const merged = mergeVertices(g, 1e-5);
  g.dispose();
  merged.computeVertexNormals();
  return merged;
}

/** Circular edge profile: 0 at the rim, 1 once `d` reaches `r`, vertical at the rim. */
export const dome = (d: number, r: number) => {
  const t = Math.min(1, Math.max(0, d / r));
  return Math.sqrt(1 - (1 - t) * (1 - t));
};
