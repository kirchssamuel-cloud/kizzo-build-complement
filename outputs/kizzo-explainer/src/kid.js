// Personnage enfant stylisé dans le langage du logo Kizzo : tête-sphère orange (l'enfant
// du logo), corps "clay" doux, assis sur un pouf flottant, téléphone en main.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

function limb(r, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 8, 20), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.r = r;
  return m;
}

/** Oriente une capsule entre deux points (longueur ajustée par scale.y du cylindre). */
function placeLimb(m, a, b) {
  _v.subVectors(b, a);
  const len = _v.length();
  m.position.addVectors(a, b).multiplyScalar(0.5);
  _q.setFromUnitVectors(UP, _v.normalize());
  m.quaternion.copy(_q);
  // CapsuleGeometry(r, 1): hauteur totale = 1 + 2r ; on étire pour atteindre len
  m.scale.set(1, Math.max(0.05, len - 0) / 1, 1);
}

export function createKid() {
  const group = new THREE.Group();

  const skinOrange = new THREE.MeshPhysicalMaterial({
    color: '#F97316',
    roughness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.7,
    sheen: 0.3,
    sheenColor: new THREE.Color('#FFB27A'),
  });
  const hoodie = new THREE.MeshPhysicalMaterial({
    color: '#D5DEE9',
    roughness: 0.85,
    sheen: 0.45,
    sheenColor: new THREE.Color('#D6ECF7'),
    sheenRoughness: 0.55,
  });
  const pants = new THREE.MeshPhysicalMaterial({ color: '#24324D', roughness: 0.7, sheen: 0.6, sheenColor: new THREE.Color('#5B6E93') });
  const shoe = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.4, clearcoat: 0.6 });
  const poufMat = new THREE.MeshPhysicalMaterial({
    color: '#3DB5DA',
    roughness: 0.82,
    sheen: 1,
    sheenColor: new THREE.Color('#A9E6F7'),
    sheenRoughness: 0.5,
  });

  // Pouf (profil arrondi en révolution)
  const poufPts = [];
  const R = 1.08, H = 0.62, rr = 0.22;
  poufPts.push(new THREE.Vector2(0, -H / 2));
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
    poufPts.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, -H / 2 + rr + Math.sin(a) * rr));
  }
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    poufPts.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, H / 2 - rr + Math.sin(a) * rr));
  }
  poufPts.push(new THREE.Vector2(0, H / 2 + 0.01));
  const pouf = new THREE.Mesh(new THREE.LatheGeometry(poufPts, 64), poufMat);
  pouf.position.y = -H / 2;
  pouf.castShadow = true;
  pouf.receiveShadow = true;
  group.add(pouf);
  // passepoil orange
  const piping = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.025, 12, 96), skinOrange);
  piping.rotation.x = Math.PI / 2;
  piping.position.y = -0.04;
  group.add(piping);

  // Torse (sweat) : profil "haricot"
  const torsoPts = [
    [0, 0],
    [0.5, 0.02],
    [0.62, 0.2],
    [0.63, 0.55],
    [0.57, 0.95],
    [0.47, 1.25],
    [0.3, 1.42],
    [0.12, 1.5],
    [0, 1.51],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(torsoPts).getPoints(40), 48), hoodie);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torso.scale.set(1, 1, 0.82);
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.02, -0.15);
  torsoPivot.add(torso);
  group.add(torsoPivot);

  // Capuche (anneau) + tête
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.13, 20, 48), hoodie);
  hood.rotation.x = Math.PI / 2 + 0.35;
  hood.position.set(0, 1.48, -0.04);
  hood.castShadow = true;
  torsoPivot.add(hood);
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.5, 0.02);
  torsoPivot.add(headPivot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.64, 64, 48), skinOrange);
  head.position.set(0, 0.6, 0.06);
  head.castShadow = true;
  head.receiveShadow = true;
  headPivot.add(head);

  // Bras
  const upperL = limb(0.17, hoodie), upperR = limb(0.17, hoodie);
  const foreL = limb(0.15, hoodie), foreR = limb(0.15, hoodie);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), skinOrange);
  const handR = handL.clone();
  handL.castShadow = handR.castShadow = true;
  group.add(upperL, upperR, foreL, foreR, handL, handR);

  // Jambes
  const thighL = limb(0.2, pants), thighR = limb(0.2, pants);
  const shinL = limb(0.17, pants), shinR = limb(0.17, pants);
  const shoeGeo = new THREE.CapsuleGeometry(0.15, 0.18, 6, 16);
  const shoeL = new THREE.Mesh(shoeGeo, shoe), shoeR = new THREE.Mesh(shoeGeo, shoe);
  shoeL.rotation.x = shoeR.rotation.x = Math.PI / 2;
  shoeL.castShadow = shoeR.castShadow = true;
  group.add(thighL, thighR, shinL, shinR, shoeL, shoeR);

  // Position du téléphone tenu (repère du groupe enfant)
  const phoneAnchor = new THREE.Object3D();
  phoneAnchor.position.set(0.02, 1.04, 1.3);
  group.add(phoneAnchor);

  const A = (x, y, z) => new THREE.Vector3(x, y, z);
  let lastDrop = 0;
  const _v2 = new THREE.Vector3();
  const _hl = new THREE.Vector3(), _hr = new THREE.Vector3(), _inv = new THREE.Matrix4();

  /** Place les bras pour que les mains tiennent le téléphone (cibles en coordonnées monde). */
  function setHands(worldL, worldR) {
    group.updateMatrixWorld(true);
    _inv.copy(group.matrixWorld).invert();
    _hl.copy(worldL).applyMatrix4(_inv);
    _hr.copy(worldR).applyMatrix4(_inv);
    const d = lastDrop;
    const shL = A(-0.5, 1.24, -0.12), shR = A(0.5, 1.24, -0.12);
    const elL = A(-0.6, 0.58 - d * 0.5, 0.62), elR = A(0.62, 0.56 - d * 0.5, 0.6);
    placeLimb(upperL, shL, elL);
    placeLimb(upperR, shR, elR);
    // l'avant-bras s'arrête avant le centre de la main (pas d'intersection visible)
    placeLimb(foreL, elL, _v2.subVectors(_hl, elL).multiplyScalar(0.84).add(elL));
    placeLimb(foreR, elR, _v2.subVectors(_hr, elR).multiplyScalar(0.84).add(elR));
    handL.position.copy(_hl);
    handR.position.copy(_hr);
  }

  /**
   * @param {number} t temps
   * @param {number} sad 0..1 (temps écoulé : tête et bras s'abaissent)
   * @param {number} tap 0..1 impulsion de tapotement du pouce
   */
  function update(t, sad = 0, tap = 0) {
    const breathe = Math.sin(t * 2.1) * 0.012;
    torsoPivot.rotation.x = 0.1 + sad * 0.06 + breathe;
    torsoPivot.scale.y = 1 + breathe * 0.6;
    headPivot.rotation.x = 0.42 + sad * 0.22 + Math.sin(t * 1.3) * 0.015;
    headPivot.rotation.z = Math.sin(t * 0.9) * 0.025 - sad * 0.05;
    headPivot.rotation.y = Math.sin(t * 0.7) * 0.03;

    const drop = sad * 0.12;
    lastDrop = drop;
    const hipL = A(-0.3, 0.2, 0.05), hipR = A(0.3, 0.2, 0.05);
    const kneeL = A(-0.32, 0.22, 0.95), kneeR = A(0.32, 0.22, 0.95);
    const swing = Math.sin(t * 1.6) * 0.06;
    const ankL = A(-0.34, -0.62, 1.08 + swing), ankR = A(0.34, -0.6, 1.08 - swing);
    placeLimb(thighL, hipL, kneeL);
    placeLimb(thighR, hipR, kneeR);
    placeLimb(shinL, kneeL, ankL);
    placeLimb(shinR, kneeR, ankR);
    shoeL.position.copy(ankL).add(A(0, -0.06, 0.08));
    shoeR.position.copy(ankR).add(A(0, -0.06, 0.08));

    phoneAnchor.position.set(0.02, 1.04 - drop * 0.8, 1.3 - drop * 0.15);
  }
  update(0);

  return { group, head, headPivot, phoneAnchor, update, setHands };
}
