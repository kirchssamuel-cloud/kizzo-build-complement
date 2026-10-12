// Enfant 3D au style "pâte à modeler" des illustrations d'onboarding Kizzo
// (parent-app-work/src/assets/illustrations) : cheveux noirs, t-shirt blanc,
// short orange, baskets blanches. Assis sur un pouf flottant, téléphone en main.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

function limb(r, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, 1, 8, 20), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Oriente une capsule entre deux points. */
function placeLimb(m, a, b) {
  _v.subVectors(b, a);
  const len = _v.length();
  m.position.addVectors(a, b).multiplyScalar(0.5);
  _q.setFromUnitVectors(UP, _v.normalize());
  m.quaternion.copy(_q);
  m.scale.set(1, Math.max(0.05, len), 1);
}

const clay = (color, o = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), ...o });

export function createKid() {
  const group = new THREE.Group();

  const skin = clay('#F1BE98', { roughness: 0.55, sheenColor: new THREE.Color('#FFD9C7'), sheen: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const hair = clay('#1E1B24', { roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.2 });
  const tee = clay('#F4F6F9', { roughness: 0.82, sheenColor: new THREE.Color('#E3F1FA'), sheen: 0.6 });
  const shorts = clay('#F28A3C', { roughness: 0.78 });
  const shoe = clay('#FFFFFF', { roughness: 0.45, clearcoat: 0.5 });
  const sole = clay('#3DB4D9', { roughness: 0.5 });
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#16131a', roughness: 0.15, clearcoat: 1 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const mouthMat = clay('#7A3330', { roughness: 0.5 });
  const cheekMat = new THREE.MeshPhysicalMaterial({ color: '#F08A86', roughness: 0.7, transparent: true, opacity: 0.55, depthWrite: false });
  const poufMat = clay('#3DB4D9', { roughness: 0.82, sheen: 1, sheenColor: new THREE.Color('#A9E6F7'), sheenRoughness: 0.5 });

  // Pouf (profil arrondi en révolution) + passepoil orange
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
  const piping = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.025, 12, 96), shorts);
  piping.rotation.x = Math.PI / 2;
  piping.position.y = -0.04;
  group.add(piping);

  // Short (bassin) + t-shirt
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 24), shorts);
  pelvis.scale.set(1.0, 0.42, 0.86);
  pelvis.position.set(0, 0.16, 0.02);
  pelvis.castShadow = true;
  group.add(pelvis);
  const torsoPts = [
    [0, 0],
    [0.43, 0.02],
    [0.5, 0.22],
    [0.5, 0.6],
    [0.48, 0.92],
    [0.42, 1.15],
    [0.28, 1.3],
    [0.13, 1.36],
    [0, 1.37],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(torsoPts).getPoints(40), 48), tee);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torso.scale.set(1, 1, 0.8);
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.2, -0.12);
  torsoPivot.add(torso);
  group.add(torsoPivot);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 12, 40), tee);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.34, 0.02);
  torsoPivot.add(collar);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.2, 24), skin);
  neck.position.set(0, 1.42, 0.02);
  torsoPivot.add(neck);

  // Tête
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.42, 0.03);
  torsoPivot.add(headPivot);
  const head = new THREE.Group();
  head.position.set(0, 0.58, 0.04);
  headPivot.add(head);
  const HR = 0.6;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(HR, 64, 48), skin);
  skull.scale.set(1.04, 0.98, 1);
  skull.castShadow = true;
  skull.receiveShadow = true;
  head.add(skull);
  const onHead = (x, y, z, out = 0) => new THREE.Vector3(x, y, z).normalize().multiplyScalar(HR + out);
  // oreilles
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), skin);
    ear.scale.set(0.55, 1, 0.75);
    ear.position.set(sx * 0.6, -0.04, -0.02);
    head.add(ear);
  }
  // cheveux : calotte + mèches (bouclées comme sur l'illustration)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(HR + 0.045, 48, 32, 0, Math.PI * 2, 0, 1.42), hair);
  cap.rotation.x = -0.42;
  cap.scale.set(1.06, 1.0, 1.04);
  cap.castShadow = true;
  head.add(cap);
  const tufts = [
    [-0.32, 0.5, 0.28, 0.17],
    [-0.08, 0.56, 0.32, 0.18],
    [0.16, 0.54, 0.3, 0.17],
    [0.36, 0.44, 0.26, 0.14],
    [-0.42, 0.36, 0.3, 0.13],
    [0.05, 0.66, 0.02, 0.2],
    [-0.25, 0.6, -0.2, 0.19],
    [0.28, 0.58, -0.18, 0.18],
    [0.0, 0.42, -0.5, 0.2],
    [0.4, 0.2, -0.38, 0.16],
    [-0.42, 0.18, -0.36, 0.16],
  ];
  for (const [x, y, z, r] of tufts) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), hair);
    t.position.copy(onHead(x, y, z, 0.0));
    t.scale.set(1.1, 0.8, 1.0);
    t.castShadow = true;
    head.add(t);
  }
  // visage
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), eyeMat);
    eye.position.copy(onHead(sx * 0.3, 0.02, 0.95, -0.02));
    eye.scale.set(0.85, 1.15, 0.6);
    head.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), whiteMat);
    glint.position.copy(eye.position).add(new THREE.Vector3(sx * 0.012 + 0.02, 0.03, 0.04));
    head.add(glint);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), hair);
    brow.position.copy(onHead(sx * 0.3, 0.2, 0.92, 0.0));
    brow.rotation.z = Math.PI / 2 + sx * 0.12;
    head.add(brow);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12), cheekMat);
    cheek.position.copy(onHead(sx * 0.46, -0.16, 0.8, -0.03));
    cheek.scale.set(1, 0.7, 0.35);
    cheek.lookAt(cheek.position.clone().multiplyScalar(2));
    head.add(cheek);
    eyes.push({ eye, brow, sx });
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), skin);
  nose.position.copy(onHead(0, -0.08, 1, -0.005));
  head.add(nose);
  const mouthPivot = new THREE.Group();
  mouthPivot.position.copy(onHead(0, -0.28, 0.94, -0.01));
  mouthPivot.lookAt(mouthPivot.position.clone().multiplyScalar(2));
  head.add(mouthPivot);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 24, Math.PI), mouthMat);
  mouth.rotation.z = Math.PI; // arc vers le bas = sourire
  mouthPivot.add(mouth);

  // Bras : manche blanche + avant-bras peau
  const upperL = limb(0.15, tee), upperR = limb(0.15, tee); // manches
  const armL = limb(0.105, skin), armR = limb(0.105, skin); // bras nu sous la manche
  const foreL = limb(0.1, skin), foreR = limb(0.1, skin); // avant-bras
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 16), skin);
  const handR = handL.clone();
  handL.castShadow = handR.castShadow = true;
  group.add(upperL, upperR, armL, armR, foreL, foreR, handL, handR);

  // Jambes : cuisse en short orange, mollet peau, basket blanche semelle cyan
  const thighL = limb(0.19, shorts), thighR = limb(0.19, shorts);
  const shinL = limb(0.12, skin), shinR = limb(0.12, skin);
  const shoeGeo = new THREE.CapsuleGeometry(0.14, 0.2, 6, 16);
  const shoeL = new THREE.Mesh(shoeGeo, shoe), shoeR = new THREE.Mesh(shoeGeo, shoe);
  shoeL.rotation.x = shoeR.rotation.x = Math.PI / 2;
  shoeL.castShadow = shoeR.castShadow = true;
  const soleGeo = new THREE.CapsuleGeometry(0.145, 0.2, 6, 16);
  const soleL = new THREE.Mesh(soleGeo, sole), soleR = new THREE.Mesh(soleGeo, sole);
  soleL.rotation.x = soleR.rotation.x = Math.PI / 2;
  soleL.scale.set(1, 1, 0.45);
  soleR.scale.set(1, 1, 0.45);
  group.add(thighL, thighR, shinL, shinR, shoeL, shoeR, soleL, soleR);

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
    const shL = A(-0.46, 1.28, -0.1), shR = A(0.46, 1.28, -0.1);
    const elL = A(-0.56, 0.68 - d * 0.5, 0.5), elR = A(0.58, 0.66 - d * 0.5, 0.48);
    placeLimb(upperL, shL, shL.clone().lerp(elL, 0.55));
    placeLimb(upperR, shR, shR.clone().lerp(elR, 0.55));
    placeLimb(armL, shL.clone().lerp(elL, 0.45), elL);
    placeLimb(armR, shR.clone().lerp(elR, 0.45), elR);
    // l'avant-bras s'arrête avant le centre de la main (pas d'intersection visible)
    placeLimb(foreL, elL, _v2.subVectors(_hl, elL).multiplyScalar(0.86).add(elL));
    placeLimb(foreR, elR, _v2.subVectors(_hr, elR).multiplyScalar(0.86).add(elR));
    handL.position.copy(_hl);
    handR.position.copy(_hr);
  }

  /**
   * @param {number} t temps
   * @param {number} sad 0..1 (temps écoulé : moue, tête et bras s'abaissent)
   * @param {number} tap 0..1 impulsion de tapotement du pouce
   */
  function update(t, sad = 0, tap = 0) {
    const breathe = Math.sin(t * 2.1) * 0.012;
    torsoPivot.rotation.x = 0.1 + sad * 0.06 + breathe;
    torsoPivot.scale.y = 1 + breathe * 0.6;
    headPivot.rotation.x = 0.4 + sad * 0.2 + Math.sin(t * 1.3) * 0.015;
    headPivot.rotation.z = Math.sin(t * 0.9) * 0.025 - sad * 0.05;
    headPivot.rotation.y = Math.sin(t * 0.7) * 0.03;
    // expression : sourire -> moue ; clignement des yeux
    mouth.scale.set(1 - sad * 0.25, 1 - sad * 1.8, 1);
    const blink = Math.max(0, 1 - Math.abs(((t + 0.3) % 2.6) - 0.08) / 0.08);
    for (const e of eyes) {
      e.eye.scale.y = 1.15 * (1 - blink * 0.85);
      e.brow.rotation.z = Math.PI / 2 + e.sx * (0.12 - sad * 0.35);
    }

    const drop = sad * 0.12;
    lastDrop = drop;
    const hipL = A(-0.27, 0.2, 0.08), hipR = A(0.27, 0.2, 0.08);
    const kneeL = A(-0.29, 0.22, 0.92), kneeR = A(0.29, 0.22, 0.92);
    const swing = Math.sin(t * 1.6) * 0.06;
    const ankL = A(-0.31, -0.6, 1.04 + swing), ankR = A(0.31, -0.58, 1.04 - swing);
    placeLimb(thighL, hipL, kneeL.clone().lerp(hipL, 0.15));
    placeLimb(thighR, hipR, kneeR.clone().lerp(hipR, 0.15));
    placeLimb(shinL, kneeL.clone().lerp(hipL, 0.2), ankL);
    placeLimb(shinR, kneeR.clone().lerp(hipR, 0.2), ankR);
    shoeL.position.copy(ankL).add(A(0, -0.05, 0.08));
    shoeR.position.copy(ankR).add(A(0, -0.05, 0.08));
    soleL.position.copy(shoeL.position).add(A(0, -0.09, 0));
    soleR.position.copy(shoeR.position).add(A(0, -0.09, 0));

    phoneAnchor.position.set(0.02, 1.04 - drop * 0.8, 1.3 - drop * 0.15);
  }
  update(0);

  return { group, head: skull, headPivot, phoneAnchor, update, setHands };
}
