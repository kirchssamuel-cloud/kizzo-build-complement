// Crayon à papier taillé, modélisé pour la macro : prisme hexagonal laqué orange, cône de bois
// taillé (bord de peinture festonné là où le cône coupe les pans), mine de graphite,
// frette métallique et gomme. Pointe à l'origine, axe vers +y.
import * as THREE from 'three';
import { TAU } from '../util.js';

export const PENCIL = {
  rIn: 0.0365, // demi-largeur entre pans (crayon de 7,3 mm)
  rTip: 0.0011,
  lead: 0.045, // graphite visible
  cone: 0.205, // pointe -> fin du cône
  body: 1.7,
  ferrule: 0.085,
  eraser: 0.075,
};

const P = PENCIL;
const rCorner = P.rIn / Math.cos(Math.PI / 6);
/** Rayon du prisme hexagonal dans la direction phi. */
const rHex = (phi) => {
  const a = ((phi % (TAU / 6)) + TAU / 6) % (TAU / 6) - TAU / 12;
  return P.rIn / Math.cos(a);
};
/** Rayon du cône taillé à la hauteur y. */
const rCone = (y) => {
  const k = (rCorner * 1.03 - P.rTip) / P.cone;
  const r = P.rTip + y * k;
  return y < 0.004 ? r * Math.sqrt(Math.max(0, y) / 0.004) : r;
};

function surface() {
  const NPHI = 6 * 26;
  const ys = [];
  // très dense près de la pointe, puis le long du cône, puis quelques anneaux sur le corps
  for (let i = 0; i <= 40; i++) ys.push(P.lead * Math.pow(i / 40, 1.6));
  for (let i = 1; i <= 70; i++) ys.push(P.lead + (P.cone + 0.02 - P.lead) * (i / 70));
  for (let i = 1; i <= 8; i++) ys.push(P.cone + 0.02 + (P.body - P.cone - 0.02) * (i / 8));
  const pos = [], uv = [], reg = [];
  for (const y of ys) {
    for (let j = 0; j <= NPHI; j++) {
      const phi = (j / NPHI) * TAU;
      const rh = rHex(phi), rc = rCone(y);
      const r = Math.min(rh, rc);
      pos.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
      uv.push(j / NPHI, y);
      reg.push(y < P.lead ? 0 : rc < rh - 1e-5 ? 1 : 2);
    }
  }
  const row = NPHI + 1;
  const groups = [[], [], []];
  for (let i = 0; i < ys.length - 1; i++) {
    for (let j = 0; j < NPHI; j++) {
      const a = i * row + j, b2 = a + 1, c = a + row, d = c + 1;
      // matériau du quad : graphite / bois / laque (le plus « extérieur » l'emporte)
      const yc = (ys[i] + ys[i + 1]) / 2;
      const phic = ((j + 0.5) / NPHI) * TAU;
      const g = yc < P.lead ? 0 : rCone(yc) < rHex(phic) - 1e-5 ? 1 : 2;
      groups[g].push(a, c, b2, b2, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const idx = [...groups[0], ...groups[1], ...groups[2]];
  geo.setIndex(idx);
  geo.addGroup(0, groups[0].length, 0);
  geo.addGroup(groups[0].length, groups[1].length, 1);
  geo.addGroup(groups[0].length + groups[1].length, groups[2].length, 2);
  geo.computeVertexNormals();
  void reg;
  return geo;
}

/** Marquage doré sur un pan (« KIZZO  HB »). */
function imprint() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 64;
  const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  // tracé après le chargement des polices (appelé par la mise en scène)
  const draw = () => {
  x.fillStyle = '#000';
  x.fillRect(0, 0, 1024, 64);
  x.fillStyle = '#fff';
  x.font = '800 40px Outfit, sans-serif';
  x.textBaseline = 'middle';
  x.fillText('KIZZO', 40, 34);
  x.font = '700 30px "Space Grotesk", sans-serif';
  x.fillText('HB · 2', 210, 35);
  x.font = '600 26px "Plus Jakarta Sans", sans-serif';
  x.fillText('Le temps d’écran se gagne en apprenant', 360, 35);
  tex.needsUpdate = true;
  };
  return { canvas: c, tex, draw };
}

export function createPencil() {
  const group = new THREE.Group();
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: '#F2600C',
    roughness: 0.42,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.0,
  });
  const wood = new THREE.MeshStandardMaterial({ color: '#B98352', roughness: 0.82, envMapIntensity: 0.3 });
  // grain du bois et stries de taille-crayon (procédural, coordonnées locales)
  wood.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLoc;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLoc;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float ang = atan(vLoc.z, vLoc.x);
        float rings = 0.5 + 0.5 * sin(vLoc.y * 380.0 + ang * 2.0);
        float grain = 0.5 + 0.5 * sin(ang * 14.0 + vLoc.y * 55.0 + sin(ang * 5.0) * 0.8);
        diffuseColor.rgb *= 0.9 + 0.05 * rings + 0.09 * grain;`
      );
  };
  const graphite = new THREE.MeshPhysicalMaterial({ color: '#3A3B3F', roughness: 0.42, metalness: 0.25, envMapIntensity: 0.8 });
  const body = new THREE.Mesh(surface(), [graphite, wood, lacquer]);
  body.castShadow = true;
  group.add(body);

  // marquage doré sur un pan
  const im = imprint();
  const gold = new THREE.MeshPhysicalMaterial({ color: '#F6D58A', metalness: 1, roughness: 0.28, alphaMap: im.tex, transparent: true, depthWrite: false, envMapIntensity: 1.4 });
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.02 * (64 / 1024) * 0.62), gold);
  decal.rotation.z = Math.PI / 2;
  decal.rotation.y = 0; // face au pan +z
  decal.position.set(0, P.cone + 0.62, P.rIn + 0.0004);
  group.add(decal);

  // frette (anneaux) + gomme
  const metal = new THREE.MeshPhysicalMaterial({ color: '#C9CDD3', metalness: 1, roughness: 0.25 });
  const pts = [];
  const y0 = P.body;
  for (let i = 0; i <= 24; i++) {
    const k = i / 24;
    const ridge = 0.0025 * Math.max(0, Math.sin(k * Math.PI * 6));
    pts.push(new THREE.Vector2(rCorner * 0.985 + ridge, y0 + k * P.ferrule));
  }
  const ferrule = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), metal);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(rCorner * 0.9, rCorner * 0.93, P.eraser, 40), new THREE.MeshStandardMaterial({ color: '#E88A9A', roughness: 0.85 }));
  eraser.position.y = y0 + P.ferrule + P.eraser / 2 - 0.002;
  ferrule.castShadow = eraser.castShadow = true;
  group.add(ferrule, eraser);

  return {
    group,
    materials: { lacquer, wood, graphite, gold, metal },
    /** Marquage doré, une fois les polices chargées. */
    drawImprint: im.draw,
    /** Clone pour le reflet (mêmes géométries / matériaux). */
    clone() {
      return group.clone(true);
    },
  };
}
