// Objets 3D du film « Les règles du jeu » : tuiles d'applis, interrupteur, puces,
// jetons, illustrations des matières (équerre, livre, globe, atome, bulle, étoile) et sablier.
// Chaque objet expose { group, update?(...) } ; tout est piloté par la timeline.
import * as THREE from 'three';
import { roundedSlab, roundedRectShape, roundedPlane } from '../materials.js';
import { CanvasTex, makeCanvas } from '../ui-canvas.js';
import { clamp, lerp, TAU, rng } from '../util.js';
import * as U from './ui.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Plastique laqué (clearcoat), le matériau « jouet premium » de toutes les illustrations. */
export function plastic(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.05, ...o });
}

/** Matériau de face imprimée : texture éclairée + légère auto-illumination (couleurs fidèles). */
function faceMat(tex, emissive = 0.5) {
  return new THREE.MeshPhysicalMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: emissive,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
  });
}

function shadowed(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

// ===========================================================================
// Tuile d'appli (squircle laqué + face imprimée)

export function createAppTile(i, size = 0.34) {
  const group = new THREE.Group();
  const ct = new CanvasTex(128, 128, 2);
  ct.draw('f', (c, w, h) => U.appTileFace(c, w, h, i));
  const d = size * 0.2;
  const slab = new THREE.Mesh(roundedSlab(size, size, d, size * 0.28, 0.012), plastic(U.APP_COL[i][1], { roughness: 0.28 }));
  const face = new THREE.Mesh(roundedPlane(size * 0.985, size * 0.985, size * 0.27, 12), faceMat(ct.texture, 0.55));
  face.position.z = d / 2 + 0.0015;
  group.add(slab, face);
  return { group: shadowed(group), size };
}

// ===========================================================================
// Interrupteur « Quiz de déblocage »

export function createToggle() {
  const group = new THREE.Group();
  const OFF = new THREE.Color(U.R.off), ON = new THREE.Color(U.R.cyan);
  const trackMat = plastic(U.R.off, { roughness: 0.25 });
  const track = new THREE.Mesh(roundedSlab(0.7, 0.34, 0.12, 0.17, 0.03, 16), trackMat);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.135, 48, 24), plastic('#FFFFFF', { roughness: 0.22 }));
  knob.scale.z = 0.7;
  group.add(track, knob);
  shadowed(group);
  return {
    group,
    update(k) {
      trackMat.color.copy(OFF).lerp(ON, clamp(k));
      trackMat.emissive.copy(ON).multiplyScalar(0.25 * clamp(k));
      knob.position.set(lerp(-0.175, 0.175, k), 0, 0.075);
    },
  };
}

// ===========================================================================
// Puce de fréquence (« 15 min ») et jeton (« 5 »)

export function createChip(label) {
  const group = new THREE.Group();
  const ct = new CanvasTex(150, 56, 2);
  const W = 0.44, H = 0.164;
  const bodyMat = plastic('#E6EDF1', { roughness: 0.3 });
  const body = new THREE.Mesh(roundedSlab(W, H, 0.06, H / 2, 0.012, 12), bodyMat);
  const face = new THREE.Mesh(roundedPlane(W * 0.99, H * 0.97, H * 0.48, 12), faceMat(ct.texture, 0.3));
  face.position.z = 0.0315;
  group.add(body, face);
  shadowed(group);
  const C0 = new THREE.Color('#E6EDF1'), C1 = new THREE.Color(U.R.cyan);
  let last = -1;
  return {
    group,
    set(sel) {
      const q = Math.round(clamp(sel) * 6) / 6;
      if (q !== last) {
        ct.draw(String(q), (c, w, h) => U.chipFace(c, w, h, label, q));
        last = q;
      }
      bodyMat.color.copy(C0).lerp(C1, q);
    },
  };
}

export function createCoin(n) {
  const group = new THREE.Group();
  const ct = new CanvasTex(128, 128, 2);
  const r = 0.12;
  const edgeMat = plastic('#E6EDF1', { roughness: 0.28 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 56), edgeMat);
  body.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.99, 56), faceMat(ct.texture, 0.45));
  face.position.z = 0.0255;
  group.add(body, face);
  shadowed(group);
  const C0 = new THREE.Color('#E6EDF1'), C1 = new THREE.Color(U.R.orange);
  let last = -1;
  return {
    group,
    set(sel) {
      const q = Math.round(clamp(sel) * 6) / 6;
      if (q !== last) {
        ct.draw(String(q), (c, w, h) => U.coinFace(c, w, h, n, q));
        last = q;
      }
      edgeMat.color.copy(C0).lerp(C1, q);
    },
  };
}

/** Grande étiquette de valeur (« 15 min », « 5 questions »). */
export function createValueCard() {
  const group = new THREE.Group();
  const ct = new CanvasTex(320, 120, 2);
  const W = 0.86, H = 0.322;
  const face = new THREE.Mesh(roundedPlane(W, H, 0.08, 12), faceMat(ct.texture, 0.18));
  const body = new THREE.Mesh(roundedSlab(W * 0.97, H * 0.94, 0.05, 0.075, 0.012), plastic('#F4F8FA'));
  body.position.z = -0.027;
  group.add(body, face);
  shadowed(group);
  return {
    group,
    set(big, small, col) {
      ct.draw(`${big}|${small}|${col}`, (c, w, h) => U.valueFace(c, w, h, big, small, col));
    },
  };
}

/** Étiquette de matière (pastille colorée sous chaque illustration). */
export function createSubjectLabel(i) {
  const ct = new CanvasTex(180, 48, 2);
  ct.draw('l', (c, w, h) => U.subjectLabel(c, w, h, i));
  const W = 0.42, H = 0.112;
  const group = new THREE.Group();
  const face = new THREE.Mesh(roundedPlane(W, H, H * 0.48, 12), faceMat(ct.texture, 0.6));
  const body = new THREE.Mesh(roundedSlab(W * 0.98, H * 0.92, 0.035, H * 0.45, 0.01, 12), plastic(U.SUBJECT_COL[i]));
  body.position.z = -0.019;
  group.add(body, face);
  return { group: shadowed(group) };
}

// ===========================================================================
// Illustrations des matières

/** Maths : équerre + signe « + » et « × ». */
function mathsProp() {
  const group = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-0.24, -0.2);
  s.lineTo(0.26, -0.2);
  s.lineTo(-0.24, 0.24);
  s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.17, -0.13);
  hole.lineTo(0.06, -0.13);
  hole.lineTo(-0.17, 0.07);
  hole.closePath();
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 6 });
  geo.translate(0, 0, -0.02);
  const sq = new THREE.Mesh(geo, plastic(U.SUBJECT_COL[0], { transmission: 0, roughness: 0.25 }));
  sq.rotation.z = -0.12;
  // graduations sur le grand côté
  const tickMat = plastic('#E8F7FC');
  for (let i = 0; i < 9; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.008, i % 2 ? 0.03 : 0.05, 0.012), tickMat);
    tk.position.set(-0.2 + i * 0.05, -0.2 + 0.03, 0.04);
    sq.add(tk);
  }
  const bar = (w, h, col) => new THREE.Mesh(roundedSlab(w, h, 0.06, h / 2, 0.012), plastic(col));
  const plus = new THREE.Group();
  plus.add(bar(0.17, 0.055, '#F97316'), bar(0.055, 0.17, '#F97316'));
  plus.position.set(0.2, 0.17, 0.08);
  const times = new THREE.Group();
  const t1 = bar(0.14, 0.045, '#FAB43B'), t2 = bar(0.14, 0.045, '#FAB43B');
  t1.rotation.z = Math.PI / 4;
  t2.rotation.z = -Math.PI / 4;
  times.add(t1, t2);
  times.position.set(0.05, 0.31, -0.02);
  group.add(sq, plus, times);
  return {
    group: shadowed(group),
    update(t) {
      plus.rotation.z = Math.sin(t * 1.3) * 0.25;
      times.rotation.z = t * 0.9;
    },
  };
}

/** Français : livre ouvert (pages lignées, couverture orange, signet). */
function frenchProp() {
  const group = new THREE.Group();
  // texte tracé une fois les polices chargées (CanvasTex)
  const page = new CanvasTex(128, 160, 2);
  page.draw('p', (ctx) => {
    ctx.fillStyle = '#FFFDF7';
    ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = 'rgba(16,43,59,0.22)';
    for (let y = 34; y < 150; y += 13) ctx.fillRect(14, y, 100 - ((y * 7) % 30), 3.5);
    ctx.fillStyle = '#F97316';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillText('Aa', 14, 26);
  });
  const tex = page.texture;
  const pageMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.6, clearcoat: 0.2 });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: '#F3EEE2', roughness: 0.7 });
  const coverMat = plastic(U.SUBJECT_COL[1]);
  const half = (side) => {
    const g = new THREE.Group();
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.04), [edgeMat, edgeMat, edgeMat, edgeMat, pageMat, edgeMat]);
    pages.position.set(side * 0.13, 0, 0.022);
    const cover = new THREE.Mesh(roundedSlab(0.27, 0.36, 0.018, 0.02, 0.006), coverMat);
    cover.position.set(side * 0.135, 0, -0.004);
    g.add(pages, cover);
    g.rotation.y = -side * 0.32;
    return g;
  };
  const L = half(-1), Rr = half(1);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 16), coverMat);
  spine.position.z = -0.01;
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.006), plastic('#3DB4D9'));
  ribbon.position.set(0.04, -0.22, 0.03);
  group.add(L, Rr, spine, ribbon);
  group.rotation.x = -0.25;
  return {
    group: shadowed(group),
    update(t) {
      const flap = Math.sin(t * 1.6) * 0.06;
      L.rotation.y = 0.32 + flap;
      Rr.rotation.y = -0.32 - flap;
    },
  };
}

/** Histoire-Géo : globe terrestre sur pied. */
function geoProp() {
  const group = new THREE.Group();
  const { canvas, ctx } = makeCanvas(256, 128, 2);
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#5CC8E6');
  g.addColorStop(1, '#2A8FC4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  // continents stylisés (déterministes)
  const r = rng(7);
  const blob = (cx, cy, rx, ry, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * TAU;
      const k = 0.75 + r() * 0.45;
      const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  [
    [40, 40, 26, 18], [58, 82, 12, 22], [120, 36, 18, 14], [128, 72, 16, 24], [176, 40, 34, 18], [204, 92, 16, 10], [96, 112, 60, 6],
  ].forEach(([x, y, rx, ry]) => blob(x, y, rx, ry, '#2FBF7F'));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.08 }));
  const tilt = new THREE.Group();
  tilt.rotation.z = 0.41;
  tilt.position.y = 0.06;
  tilt.add(earth);
  const metal = new THREE.MeshPhysicalMaterial({ color: '#E7C27A', metalness: 1, roughness: 0.25 });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.011, 10, 64, Math.PI * 1.15), metal);
  arc.rotation.z = Math.PI / 2 - 0.41 + Math.PI * 0.075;
  arc.position.y = 0.06;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.12, 16), metal);
  stem.position.y = -0.2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.04, 40), plastic(U.SUBJECT_COL[2]));
  base.position.y = -0.27;
  group.add(tilt, arc, stem, base);
  return {
    group: shadowed(group),
    update(t) {
      earth.rotation.y = t * 0.9;
    },
  };
}

/** Sciences : atome (noyau + 3 orbites + électrons). */
function scienceProp() {
  const group = new THREE.Group();
  const nucleus = new THREE.Group();
  [
    [0.03, 0.02, 0, '#F97316'], [-0.035, 0.015, 0.02, '#3DB4D9'], [0, -0.035, 0.015, '#F97316'], [0.01, 0.005, -0.04, '#3DB4D9'],
  ].forEach(([x, y, z, c]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), plastic(c));
    m.position.set(x, y, z);
    nucleus.add(m);
  });
  group.add(nucleus);
  const orbitMat = new THREE.MeshPhysicalMaterial({ color: U.SUBJECT_COL[3], emissive: new THREE.Color(U.SUBJECT_COL[3]), emissiveIntensity: 0.5, roughness: 0.3, clearcoat: 1 });
  const eMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#E9E3FF'), emissiveIntensity: 1.2, roughness: 0.2 });
  const orbits = [0, 1, 2].map((i) => {
    const o = new THREE.Group();
    o.rotation.set(Math.PI / 2 + 0.25, 0, (i * Math.PI) / 3);
    o.add(new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.009, 10, 96), orbitMat));
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), eMat);
    o.add(e);
    group.add(o);
    return { o, e, ph: i * 2.1 };
  });
  return {
    group: shadowed(group),
    update(t) {
      orbits.forEach(({ e, ph }, i) => {
        const a = t * (2.2 + i * 0.4) + ph;
        e.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0);
      });
      nucleus.rotation.set(t * 0.7, t * 1.1, 0);
    },
  };
}

/** Anglais : bulle de dialogue « Hello! ». */
function englishProp() {
  const group = new THREE.Group();
  const s = roundedRectShape(0.5, 0.32, 0.12);
  // queue de la bulle
  const tail = new THREE.Shape();
  tail.moveTo(-0.14, -0.13);
  tail.lineTo(-0.2, -0.27);
  tail.lineTo(-0.03, -0.14);
  tail.closePath();
  const ex = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.022, bevelSegments: 6, curveSegments: 16 };
  const mat = plastic(U.SUBJECT_COL[4]);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry([s, tail], ex), mat);
  body.position.z = -0.03;
  const lt = new CanvasTex(200, 120, 2);
  lt.draw('h', (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.font = '800 56px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hello!', 100, 80);
  });
  const tex = lt.texture;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.252), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  label.position.z = 0.058;
  group.add(body, label);
  return {
    group: shadowed(group),
    update(t) {
      group.rotation.z = Math.sin(t * 2.0) * 0.05;
    },
  };
}

/** Autres : étoile. */
function starProp() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.11 : 0.25;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 8 });
  geo.translate(0, 0, -0.025);
  const m = new THREE.Mesh(geo, plastic(U.SUBJECT_COL[5], { emissive: new THREE.Color('#F59E0B'), emissiveIntensity: 0.12 }));
  const group = new THREE.Group();
  group.add(m);
  return {
    group: shadowed(group),
    update(t) {
      m.rotation.y = Math.sin(t * 1.4) * 0.5;
    },
  };
}

export function createSubjectProp(i) {
  return [mathsProp, frenchProp, geoProp, scienceProp, englishProp, starProp][i]();
}

// ===========================================================================
// Sablier (verre, sable ambré, flasques orange)

export function createHourglass() {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  // profil du verre (demi-hauteur 0.4)
  const pts = [];
  const prof = (u) => 0.028 + 0.17 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.75);
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    pts.push(new THREE.Vector2(prof(u), -0.4 + u * 0.4));
  }
  for (let i = 1; i <= 40; i++) {
    const u = i / 40;
    pts.push(new THREE.Vector2(prof(1 - u), u * 0.4));
  }
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#E6F7FF',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), glassMat);
  glass.renderOrder = 2;
  // sable
  const sandMat = new THREE.MeshPhysicalMaterial({ color: '#F6B23E', roughness: 0.85, emissive: new THREE.Color('#F59E0B'), emissiveIntensity: 0.18 });
  const topSand = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 48, 1, false), sandMat);
  topSand.rotation.x = Math.PI; // pointe vers le bas (col)
  const botSand = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 48, 1, false), sandMat);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 8), sandMat);
  // flasques + colonnes
  const capMat = plastic('#F97316');
  const capGeo = new THREE.CylinderGeometry(0.235, 0.235, 0.045, 56);
  const capT = new THREE.Mesh(capGeo, capMat);
  capT.position.y = 0.425;
  const capB = new THREE.Mesh(capGeo, capMat);
  capB.position.y = -0.425;
  const postMat = new THREE.MeshPhysicalMaterial({ color: '#7FD3EC', metalness: 1, roughness: 0.2 });
  const posts = [0, 1, 2].map((i) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.82, 12), postMat);
    const a = (i / 3) * TAU + 0.5;
    p.position.set(Math.cos(a) * 0.205, 0, Math.sin(a) * 0.205);
    return p;
  });
  inner.add(topSand, botSand, stream, glass, capT, capB, ...posts);
  shadowed(inner);
  glass.castShadow = false;
  return {
    group,
    inner,
    /** k : fraction du sable passée en bas (0..1), flowing : filet visible. */
    update(k, flowing = true, t = 0) {
      k = clamp(k);
      // haut : cône inversé au-dessus du col, qui se vide
      const ht = 0.3 * Math.cbrt(1 - k);
      topSand.visible = ht > 0.004;
      topSand.scale.set(ht * 0.62, ht, ht * 0.62);
      topSand.position.y = 0.035 + ht / 2;
      // bas : tas qui grossit
      const hb = 0.26 * Math.cbrt(Math.max(0.001, k));
      botSand.visible = k > 0.002;
      botSand.scale.set(0.17 + hb * 0.12, hb, 0.17 + hb * 0.12);
      botSand.position.y = -0.4 + hb / 2;
      stream.visible = flowing && k > 0.001 && k < 0.995;
      const top = 0.03, bot = -0.4 + hb;
      stream.scale.set(1 + Math.sin(t * 40) * 0.15, top - bot, 1);
      stream.position.y = (top + bot) / 2;
    },
  };
}
