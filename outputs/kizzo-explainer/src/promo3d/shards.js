// Verre de l'écran brisé, en éclats 3D : motif de fracture radial (fissures rayonnantes +
// anneaux) découpé au rectangle de l'écran. Les éclats sont du verre : teinte sombre
// translucide, arêtes qui accrochent la lumière, reflet spéculaire.
import * as THREE from 'three';
import { rng, TAU } from '../util.js';

function clipRect(poly, x0, y0, x1, y1) {
  const edges = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  let out = poly;
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i], b = src[(i + 1) % src.length];
      const ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    if (!out.length) return out;
  }
  return out;
}

/** Cellules de fracture sur un écran W × H (px logiques) autour de (ix, iy). */
export function fracture(W, H, ix, iy, seed = 9) {
  const r = rng(seed);
  const NA = 16;
  const angles = [];
  for (let i = 0; i < NA; i++) angles.push(((i + 0.5 + (r() - 0.5) * 0.6) / NA) * TAU);
  const RINGS = [0, 14, 36, 70, 118, 182, 262, 370, 520, 760];
  const V = angles.map((a) =>
    RINGS.map((rad, j) => {
      const rr = j === 0 ? 0 : rad * (0.84 + r() * 0.32);
      const aa = a + (j ? (r() - 0.5) * 0.12 : 0);
      return [ix + Math.cos(aa) * rr, iy + Math.sin(aa) * rr];
    })
  );
  const cells = [];
  for (let i = 0; i < NA; i++) {
    const i2 = (i + 1) % NA;
    for (let j = 0; j < RINGS.length - 1; j++) {
      const poly = j === 0 ? [V[i][0], V[i][1], V[i2][1]] : [V[i][j], V[i2][j], V[i2][j + 1], V[i][j + 1]];
      const c = clipRect(poly, 0, 0, W, H);
      if (c.length < 3) continue;
      let area = 0;
      for (let k = 0; k < c.length; k++) area += c[k][0] * c[(k + 1) % c.length][1] - c[(k + 1) % c.length][0] * c[k][1];
      if (Math.abs(area) < 8) continue;
      const cx = c.reduce((s, q) => s + q[0], 0) / c.length;
      const cy = c.reduce((s, q) => s + q[1], 0) / c.length;
      cells.push({ poly: c, cx, cy, dist: Math.hypot(cx - ix, cy - iy), rnd: [r(), r(), r(), r(), r(), r()] });
    }
  }
  return cells;
}

/** Géométrie d'un éclat centrée sur son centroïde (unités locales du téléphone). */
export function shardGeometry(cell, toLocal) {
  const c = toLocal(cell.cx, cell.cy);
  const pts = cell.poly.map((p) => toLocal(p[0], p[1]).sub(c));
  const pos = [0, 0, 0], edge = [0];
  for (const p of pts) pos.push(p.x, p.y, 0), edge.push(1);
  const idx = [];
  for (let i = 0; i < pts.length; i++) idx.push(0, 1 + i, 1 + ((i + 1) % pts.length));
  if (pts[0].x * pts[1].y - pts[0].y * pts[1].x < 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('edge', new THREE.Float32BufferAttribute(edge, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, center: c };
}

/** Verre : teinte sombre translucide, arête lumineuse (orange quand l'écran se rallume), spéculaire. */
export function glassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGlow: { value: 0 },
      uAlpha: { value: 1 },
      uLight: { value: new THREE.Vector3(-0.45, 0.7, 0.55).normalize() },
    },
    vertexShader: /* glsl */ `
      attribute float edge;
      varying float vEdge; varying vec3 vN; varying vec3 vV;
      void main() {
        vEdge = edge;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uGlow, uAlpha; uniform vec3 uLight;
      varying float vEdge; varying vec3 vN; varying vec3 vV;
      void main() {
        vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
        vec3 V = normalize(vV);
        float spec = pow(max(dot(reflect(-uLight, N), V), 0.0), 60.0);
        float fres = pow(1.0 - abs(dot(N, V)), 3.0);
        float rim = smoothstep(0.93, 1.0, vEdge);
        vec3 edgeCol = mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.62, 0.3), uGlow);
        vec3 col = vec3(0.02, 0.025, 0.04) + edgeCol * rim * 1.1 + vec3(spec * 1.4) + vec3(0.25) * fres;
        float a = (0.18 + rim * 0.6 + spec * 0.6 + fres * 0.3) * uAlpha;
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
