// Logo Kizzo en 3D (extrusion biseautée du tracé officiel) + "+15" extrudé en Outfit.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { LOGO } from './logo-shape.js';
import { GLYPHS } from './glyphs.js';

function smoothExtrude(shapes, depth, bevel, bevelSize, curveSegments = 48) {
  let g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize,
    bevelSegments: 10,
    curveSegments,
  });
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-5);
  g.computeVertexNormals();
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Ajoute un "balayage de brillance" (shine sweep) dans l'émissif d'un matériau standard. */
function addShine(mat, sweepUniform, colorUniform) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSweep = sweepUniform;
    sh.uniforms.uSweepCol = colorUniform;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjP = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjP;\nuniform float uSweep;\nuniform vec3 uSweepCol;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float sd = (vObjP.x * 0.8 + vObjP.y * 0.45) - uSweep;
        totalEmissiveRadiance += uSweepCol * (exp(-sd * sd * 60.0) * 1.4 + exp(-sd * sd * 6.0) * 0.12);`
      );
  };
}

export function createLogo3D() {
  const group = new THREE.Group();
  const sweep = { value: -10 };
  const sweepCol = { value: new THREE.Color('#ffffff') };

  const cyanMat = new THREE.MeshPhysicalMaterial({
    color: '#3DB5DA',
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    emissive: new THREE.Color('#3DB5DA'),
    emissiveIntensity: 0.12,
    envMapIntensity: 1.1,
  });
  const orangeMat = new THREE.MeshPhysicalMaterial({
    color: '#F97316',
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    emissive: new THREE.Color('#F97316'),
    emissiveIntensity: 0.14,
    envMapIntensity: 1.1,
  });
  addShine(cyanMat, sweep, sweepCol);
  addShine(orangeMat, sweep, sweepCol);

  const depth = 0.14, bevel = 0.05, bevelSize = 0.03;
  // Le biseau élargit la forme : on décale le contour vers l'intérieur pour garder
  // exactement la silhouette du logo officiel.
  const pts = LOGO.body;
  const inset = pts.map(([x, y], i) => {
    const [px, py] = pts[(i - 1 + pts.length) % pts.length];
    const [nx, ny] = pts[(i + 1) % pts.length];
    const tx = nx - px, ty = ny - py;
    const l = Math.hypot(tx, ty) || 1;
    // contour CCW : la normale sortante est (ty, -tx)
    return new THREE.Vector2(x - (ty / l) * bevelSize, y + (tx / l) * bevelSize);
  });
  const bodyShape = new THREE.Shape(inset);
  const bodyGeo = smoothExtrude([bodyShape], depth, bevel, bevelSize, 1);

  // cercle sans point dupliqué (évite la couture visible au lissage des normales)
  const circleGeo = (r) => {
    const n = 96;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector2(Math.cos(a) * (r - bevelSize), Math.sin(a) * (r - bevelSize)));
    }
    return smoothExtrude([new THREE.Shape(pts)], depth, bevel, bevelSize, 1);
  };
  // le corps est tracé à la taille finale ; on compense le biseau en le rétrécissant légèrement
  bodyGeo.computeBoundingBox();

  const body = new THREE.Mesh(bodyGeo, cyanMat);
  const head = new THREE.Mesh(circleGeo(LOGO.head.r), cyanMat);
  const child = new THREE.Mesh(circleGeo(LOGO.child.r), orangeMat);
  head.userData.home = new THREE.Vector3(LOGO.head.c[0], LOGO.head.c[1], 0);
  child.userData.home = new THREE.Vector3(LOGO.child.c[0], LOGO.child.c[1], 0.02);
  body.userData.home = new THREE.Vector3(0, 0, 0);
  for (const m of [body, head, child]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.copy(m.userData.home);
    group.add(m);
  }
  return { group, body, head, child, sweep, cyanMat, orangeMat };
}

export function createPlus15() {
  const sp = new THREE.ShapePath();
  for (const c of GLYPHS.plus15.cmds) {
    if (c[0] === 'M') sp.moveTo(c[1], c[2]);
    else if (c[0] === 'L') sp.lineTo(c[1], c[2]);
    else if (c[0] === 'Q') sp.quadraticCurveTo(c[1], c[2], c[3], c[4]);
    else if (c[0] === 'C') sp.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
  }
  sp.userData = { style: { fillRule: 'nonzero' } };
  const shapes = SVGLoader.createShapes(sp);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.035,
    bevelSegments: 8,
    curveSegments: 16,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  const face = new THREE.MeshPhysicalMaterial({
    color: '#F97316',
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color('#F97316'),
    emissiveIntensity: 0.2,
  });
  const side = new THREE.MeshPhysicalMaterial({
    color: '#FFB070',
    roughness: 0.2,
    metalness: 1,
    envMapIntensity: 1.6,
    emissive: new THREE.Color('#C2410C'),
    emissiveIntensity: 0.15,
  });
  const mesh = new THREE.Mesh(geo, [face, side]);
  mesh.castShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  return { group, mesh, face, side };
}
