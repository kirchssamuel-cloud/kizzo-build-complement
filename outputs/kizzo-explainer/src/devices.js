// Smartphones et tablette : géométrie réaliste (cadre métal biseauté, verre avant,
// verre arrière dépoli, module photo, boutons), écran texturé + reflets de verre.
import * as THREE from 'three';
import { roundedRectShape, roundedPlane, glassGlareMaterial } from './materials.js';

function bodyGeometry(w, h, d, r, bevel) {
  const shape = roundedRectShape(w - bevel * 2, h - bevel * 2, r - bevel);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 24,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  return g;
}

/**
 * @param {object} o
 * @param {number} o.w largeur, o.h hauteur, o.d épaisseur, o.r rayon des coins
 * @param {number} o.bezel bordure noire autour de l'affichage
 */
export function createDevice({
  w = 0.74,
  h = 1.56,
  d = 0.085,
  r = 0.125,
  bezel = 0.03,
  frame = '#C9CED6',
  back = '#DDE3EA',
  camera = 'phone',
  screenTexture = null,
  brightness = 1.0,
} = {}) {
  const group = new THREE.Group();
  const bevel = Math.min(0.022, d * 0.28);

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: frame,
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1.25,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
  });
  const backMat = new THREE.MeshPhysicalMaterial({
    color: back,
    metalness: 0.15,
    roughness: 0.48,
    clearcoat: 0.7,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.9,
  });
  const body = new THREE.Mesh(bodyGeometry(w, h, d, r, bevel), [backMat, frameMat]);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Verre avant (noir profond, très brillant)
  const front = d / 2;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#020306',
    metalness: 0,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.1,
  });
  const gw = w - bevel * 1.1, gh = h - bevel * 1.1;
  const glass = new THREE.Mesh(roundedPlane(gw, gh, r - bevel * 0.55, 16), glassMat);
  glass.position.z = front + 0.0006;
  glass.receiveShadow = true;
  group.add(glass);

  // Affichage
  const sw = w - bezel * 2, sh = h - bezel * 2, sr = Math.max(0.02, r - bezel * 0.9);
  const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  displayMat.color.setScalar(brightness);
  const display = new THREE.Mesh(roundedPlane(sw, sh, sr, 16), displayMat);
  display.position.z = front + 0.0012;
  group.add(display);

  // Reflets (softbox) au-dessus de tout
  const glareMat = glassGlareMaterial(1);
  const glare = new THREE.Mesh(roundedPlane(gw, gh, r - bevel * 0.55, 16), glareMat);
  glare.position.z = front + 0.004;
  glare.renderOrder = 10;
  group.add(glare);

  // Module photo au dos
  const camGroup = new THREE.Group();
  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#05070b', roughness: 0.05, metalness: 0.2, clearcoat: 1 });
  const ringMat = new THREE.MeshPhysicalMaterial({ color: frame, metalness: 1, roughness: 0.22 });
  if (camera === 'phone') {
    const s = w * 0.42;
    const plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRectShape(s, s, s * 0.28), { depth: 0.008, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3, curveSegments: 12 }),
      backMat
    );
    plate.rotation.y = Math.PI;
    camGroup.add(plate);
    const lensPos = [
      [-s * 0.22, s * 0.22],
      [-s * 0.22, -s * 0.22],
      [s * 0.22, 0],
    ];
    for (const [x, y] of lensPos) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.19, s * 0.19, 0.022, 32), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, -0.012);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.145, s * 0.145, 0.024, 32), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, y, -0.014);
      camGroup.add(ring, lens);
    }
    camGroup.position.set(w / 2 - s / 2 - 0.05, h / 2 - s / 2 - 0.05, -d / 2 - 0.002);
    camGroup.position.x = -camGroup.position.x; // vu de dos, en haut à gauche
  } else {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-w / 2 + 0.12, h / 2 - 0.12, -d / 2 - 0.004);
    camGroup.add(ring);
  }
  group.add(camGroup);

  // Boutons latéraux
  const btnMat = frameMat;
  const btn = (x, y, len) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, len, 4, 8), btnMat);
    b.position.set(x, y, 0);
    group.add(b);
  };
  if (camera === 'phone') {
    btn(-w / 2 - 0.002, h * 0.22, 0.06);
    btn(-w / 2 - 0.002, h * 0.1, 0.09);
    btn(-w / 2 - 0.002, h * -0.02, 0.09);
    btn(w / 2 + 0.002, h * 0.12, 0.14);
  } else {
    const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.1, 4, 8), btnMat);
    top.rotation.z = Math.PI / 2;
    top.position.set(w * 0.3, h / 2 + 0.002, 0);
    group.add(top);
  }

  return {
    group,
    body,
    display,
    displayMat,
    glare,
    glareMat,
    frameMat,
    backMat,
    dims: { w, h, d, sw, sh, front },
    setScreen(tex) {
      if (displayMat.map === tex) return;
      const had = !!displayMat.map;
      displayMat.map = tex;
      if (!had) displayMat.needsUpdate = true;
    },
    /** Convertit des coordonnées écran logiques (px) en position locale sur l'affichage. */
    screenToLocal(px, py, logicalW, logicalH, z = 0) {
      return new THREE.Vector3((px / logicalW - 0.5) * sw, (0.5 - py / logicalH) * sh, front + 0.0015 + z);
    },
  };
}
