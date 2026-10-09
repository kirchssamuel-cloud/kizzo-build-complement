// WebGL stage for the vertical ad: a backdrop that composites the character
// shots (cover-fit, blur, masks, pastel grade), a 3D world (phone showing the
// real Kizzo screenshots, the desk and lesson page, illustrative quiz cards,
// ink particles) and a screen-space HUD layer (ribbons, clock ring, answer
// card, sparks).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BRAND, APP } from './palette.js';
import { rng } from './timeline.js';
import { PAGE } from './lesson.js';

export const W = 1080;
export const H = 1920;
const col = (hex) => new THREE.Color(hex);

// ── Backdrop ──────────────────────────────────────────────────────────────
function buildBackdrop() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: null },
      uB: { value: null },
      uZA: { value: new THREE.Vector3(1, 0, 0) },
      uZB: { value: new THREE.Vector3(1, 0, 0) },
      uRes: { value: new THREE.Vector2(W, H) },
      uBlur: { value: 0 },
      uMotion: { value: new THREE.Vector2(0, 0) },
      uMix: { value: 0 },
      uMode: { value: 0 },
      uC: { value: new THREE.Vector2(540, 960) },
      uR: { value: 0 },
      uSoft: { value: 40 },
      uRect: { value: new THREE.Vector4(540, 960, 100, 100) },
      uRectR: { value: 36 },
      uPastel: { value: 1 },
      uP0: { value: col(APP.skyTop) },
      uP1: { value: col(APP.sand) },
      uP2: { value: col(APP.peach) },
      uDim: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uA, uB;
      uniform vec3 uZA, uZB, uP0, uP1, uP2;
      uniform vec2 uRes, uMotion, uC;
      uniform vec4 uRect;
      uniform float uBlur, uMix, uMode, uR, uSoft, uRectR, uPastel, uDim, uTime;
      varying vec2 vUv;
      const vec2 PD[12] = vec2[12](
        vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
        vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
        vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598));
      vec2 xf(vec2 uv, vec3 z) { return (uv - 0.5 - z.yz) / z.x + 0.5; }
      vec3 tap(sampler2D t, vec2 uv) { return texture(t, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }
      vec3 look(sampler2D t, vec2 uv) {
        vec3 c = tap(t, uv);
        float n = 1.0;
        if (uBlur > 0.5) {
          vec2 px = uBlur / uRes;
          for (int i = 0; i < 12; i++) { c += tap(t, uv + PD[i] * px); n += 1.0; }
          for (int i = 0; i < 12; i++) { c += tap(t, uv + PD[i] * px * 0.5); n += 1.0; }
        }
        if (length(uMotion) > 0.5) {
          vec2 m = uMotion / uRes;
          for (int i = 1; i <= 8; i++) { float k = float(i) / 8.0 - 0.5; c += tap(t, uv + m * k) * 1.5; n += 1.5; }
        }
        return c / n;
      }
      vec3 pastel(vec2 uv) {
        float y = 1.0 - uv.y;
        vec3 c = mix(uP0, uP1, smoothstep(0.0, 0.55, y));
        c = mix(c, uP2, smoothstep(0.45, 1.0, y));
        vec2 a = vec2(0.22 + 0.04 * sin(uTime * 0.3), 0.72);
        vec2 b = vec2(0.82, 0.30 + 0.03 * cos(uTime * 0.25));
        vec2 asp = vec2(1.0, 1.7778);
        c += vec3(1.0, 0.98, 0.95) * 0.10 * exp(-dot((uv - a) * asp, (uv - a) * asp) * 5.0);
        c += vec3(1.0, 0.95, 0.9) * 0.08 * exp(-dot((uv - b) * asp, (uv - b) * asp) * 6.0);
        return c;
      }
      float maskB() {
        if (uMode < 0.5) return uMix;
        vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
        if (uMode < 1.5) return 1.0 - smoothstep(uR - uSoft, uR + uSoft, length(p - uC));
        vec2 q = abs(p - uRect.xy) - uRect.zw + uRectR;
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRectR;
        return (1.0 - smoothstep(-1.2, 1.2, d)) * step(0.001, uMix);
      }
      void main() {
        vec3 a = pastel(vUv), b = a;
        if (uZA.x > 0.0) a = look(uA, xf(vUv, uZA));
        if (uZB.x > 0.0) b = look(uB, xf(vUv, uZB));
        // the pastel grade belongs to the outgoing shot only, never to the one revealed
        a = mix(a, pastel(vUv), uPastel);
        vec3 c = mix(a, b, maskB());
        gl_FragColor = vec4(c * uDim, 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  m.renderOrder = -100;
  return m;
}

// ── Phone ────────────────────────────────────────────────────────────────
export const PHONE = { screenW: 0.92, screenH: 2.0, bezel: 0.05, bodyR: 0.17, screenR: 0.13, depth: 0.06, bevel: 0.026 };
PHONE.bodyW = PHONE.screenW + 2 * PHONE.bezel;
PHONE.bodyH = PHONE.screenH + 2 * PHONE.bezel;
PHONE.front = PHONE.depth / 2 + PHONE.bevel;

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function buildPhone() {
  const P = PHONE;
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(roundedRect(P.bodyW - 2 * P.bevel, P.bodyH - 2 * P.bevel, P.bodyR - P.bevel), {
    depth: P.depth, bevelEnabled: true, bevelThickness: P.bevel, bevelSize: P.bevel, bevelSegments: 10, curveSegments: 40,
  });
  geo.translate(0, 0, -P.depth / 2);
  const frame = new THREE.MeshPhysicalMaterial({ color: col('#D9E1E8'), metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: col('#0A0E14'), metalness: 0.2, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const back = new THREE.MeshPhysicalMaterial({ color: col('#E7EDF2'), metalness: 0.1, roughness: 0.45, clearcoat: 0.6 });
  const body = new THREE.Mesh(geo, [glass, frame]);
  body.castShadow = true;
  g.add(body);
  // back panel (pale, so a flipped phone reads light)
  const backPanel = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(P.bodyW - 0.02, P.bodyH - 0.02, P.bodyR - 0.01), 24), back);
  backPanel.rotation.y = Math.PI;
  backPanel.position.z = -P.front - 0.001;
  g.add(backPanel);
  for (const [side, y, len] of [[-1, 0.58, 0.1], [-1, 0.38, 0.14], [1, 0.46, 0.22]]) {
    const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, len, 4, 12), frame);
    k.position.set(side * (P.bodyW / 2 + 0.003), y, 0);
    g.add(k);
  }
  const screenMat = new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: null },
      uB: { value: null },
      uWipe: { value: 0 },
      uWipeMode: { value: 0 },
      uWipeC: { value: new THREE.Vector2(0.5, 0.5) },
      uCrop: { value: new THREE.Vector3(1, 0.5, 0.5) },
      uTapC: { value: new THREE.Vector2(0.5, 0.5) },
      uTapT: { value: -1 },
      uPower: { value: 1 },
      uSize: { value: new THREE.Vector2(P.screenW, P.screenH) },
      uRadius: { value: P.screenR },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uA, uB;
      uniform float uWipe, uWipeMode, uTapT, uPower, uRadius;
      uniform vec2 uWipeC, uTapC, uSize;
      uniform vec3 uCrop;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      float rrect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float mask = 1.0 - smoothstep(-0.0025, 0.0005, rrect(p, uSize * 0.5, uRadius));
        // crop/zoom in top-down screen coordinates (like the screenshot pixels)
        vec2 top = vec2(vUv.x, 1.0 - vUv.y);
        vec2 cu = (top - 0.5) / uCrop.x + uCrop.yz;
        vec2 tuv = vec2(cu.x, 1.0 - cu.y);
        vec3 a = texture(uA, tuv).rgb;
        vec3 b = texture(uB, tuv).rgb;
        vec2 asp = vec2(1.0, uSize.y / uSize.x);
        float m;
        if (uWipeMode < 0.5) {
          float d = length((vec2(vUv.x, 1.0 - vUv.y) - uWipeC) * asp);
          float R = uWipe * 2.4;
          m = 1.0 - smoothstep(R - 0.02, R + 0.002, d);
        } else {
          float y = 1.0 - vUv.y;
          m = 1.0 - smoothstep(1.0 - uWipe * 1.06, 1.0 - uWipe * 1.06 + 0.04, y);
        }
        vec3 c = mix(a, b, m);
        // touch feedback: a soft ring where the finger lands
        if (uTapT >= 0.0 && uTapT < 0.6) {
          float d = length((vec2(vUv.x, 1.0 - vUv.y) - uTapC) * asp);
          float r = 0.02 + uTapT * 0.28;
          float ring = exp(-pow((d - r) / 0.012, 2.0)) * (1.0 - uTapT / 0.6);
          float dot = (1.0 - smoothstep(0.035, 0.045, d)) * (1.0 - smoothstep(0.0, 0.25, uTapT)) * 0.35;
          c = mix(c, vec3(1.0), clamp(ring * 0.8 + dot, 0.0, 1.0));
        }
        c *= uPower;
        vec3 N = normalize(vN), V = normalize(vV);
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        float strip = smoothstep(0.93, 0.997, dot(R, normalize(vec3(-0.5, 0.55, 0.67))));
        c += vec3(strip * 0.10 + fres * 0.05);
        gl_FragColor = vec4(c, mask);
      }`,
    transparent: true,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(P.screenW, P.screenH), screenMat);
  screen.position.z = P.front + 0.0015;
  screen.renderOrder = 2;
  g.add(screen);
  // soft drop shadow when the phone floats over a shot
  const shadowMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.3 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; varying vec2 vUv;
      void main(){ vec2 q = (vUv - 0.5) * vec2(1.0, 1.0); vec2 b = vec2(0.36, 0.42);
        vec2 d = max(abs(q) - b, 0.0); float a = exp(-dot(d, d) * 120.0) * (1.0 - smoothstep(0.0, 0.12, length(d)));
        gl_FragColor = vec4(0.05, 0.12, 0.18, a * uOpacity); }`,
    transparent: true,
    depthWrite: false,
  });
  const dropShadow = new THREE.Mesh(new THREE.PlaneGeometry(P.bodyW * 1.5, P.bodyH * 1.3), shadowMat);
  dropShadow.position.set(0.12, -0.16, -0.35);
  dropShadow.renderOrder = -1;
  g.add(dropShadow);
  return { group: g, screen, screenMat, dropShadow };
}

// ── Desk + lesson page ───────────────────────────────────────────────────
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#EAD6BC';
  ctx.fillRect(0, 0, 1024, 1024);
  const r = rng(3);
  for (let i = 0; i < 140; i++) {
    const y = r() * 1024;
    ctx.strokeStyle = `rgba(${170 + r() * 30}, ${130 + r() * 20}, ${90 + r() * 20}, ${0.05 + r() * 0.07})`;
    ctx.lineWidth = 1 + r() * 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.004 + i) * 10 * r());
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

export const SHEET = { w: 1.5, h: 1.5 * (PAGE.h / PAGE.w) };

function buildDesk(lessonCanvas) {
  const g = new THREE.Group();
  const table = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75, metalness: 0, envMapIntensity: 0.25 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  g.add(table);
  // the page, with a slight curl at its edges
  const geo = new THREE.PlaneGeometry(SHEET.w, SHEET.h, 24, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (SHEET.w / 2), y = pos.getY(i) / (SHEET.h / 2);
    pos.setZ(i, 0.018 * (x * x * x * x) + 0.01 * Math.max(0, y) ** 6);
  }
  geo.computeVertexNormals();
  const tex = new THREE.CanvasTexture(lessonCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const sheet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, envMapIntensity: 0.3 }));
  sheet.rotation.x = -Math.PI / 2;
  sheet.rotation.z = 0.06;
  sheet.position.set(0, 0.004, 0);
  sheet.receiveShadow = true;
  sheet.castShadow = true;
  g.add(sheet);
  // scan overlay: cyan underlines + orange scan pulse, drawn per frame
  const oc = document.createElement('canvas');
  oc.width = PAGE.w / 2;
  oc.height = PAGE.h / 2;
  const otex = new THREE.CanvasTexture(oc);
  otex.colorSpace = THREE.SRGBColorSpace;
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.w, SHEET.h, 24, 32), new THREE.MeshBasicMaterial({ map: otex, transparent: true, depthWrite: false }));
  overlay.geometry.attributes.position.array.set(geo.attributes.position.array);
  overlay.rotation.copy(sheet.rotation);
  overlay.position.set(0, 0.006, 0);
  overlay.renderOrder = 3;
  g.add(overlay);
  return { group: g, table, sheet, overlay, overlayCanvas: oc, overlayTex: otex };
}

// ── Particles: ink lifting off the page ─────────────────────────────────
function questionSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(14, 14, 100, 100, 30);
  ctx.fill();
  ctx.fillStyle = BRAND.orange;
  ctx.font = '800 78px Outfit, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildInk(uvs, sheet) {
  const n = uvs.length / 2;
  const r = rng(11);
  const start = new Float32Array(n * 3);
  const data = new Float32Array(n * 4);
  const colr = new Float32Array(n * 3);
  sheet.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const pal = [col(BRAND.cyan), col(BRAND.orange), col('#7FD3F2'), col(APP.teal)];
  for (let i = 0; i < n; i++) {
    v.set((uvs[i * 2] - 0.5) * SHEET.w, (0.5 - uvs[i * 2 + 1]) * SHEET.h, 0.01).applyMatrix4(sheet.matrixWorld);
    start.set([v.x, v.y, v.z], i * 3);
    // delay follows the reading order (top of the page first)
    data.set([uvs[i * 2 + 1] * 0.9 + r() * 0.25, r(), r() < 0.1 ? 1 : 0, 0.7 + r() * 0.8], i * 4);
    const c = pal[r() < 0.45 ? 0 : r() < 0.6 ? 1 : r() < 0.5 ? 2 : 3];
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uTarget: { value: new THREE.Vector3() }, uQ: { value: questionSprite() }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aData; attribute vec3 aColor;
      uniform float uT, uScale; uniform vec3 uTarget;
      varying vec3 vColor; varying float vAlpha; varying float vQ;
      void main() {
        float t = uT - aData.x;
        float lift = smoothstep(0.0, 0.9, t);
        float go = smoothstep(0.9, 2.3, t);
        float s = aData.y * 6.2831;
        vec3 p = position;
        vec3 up = vec3(sin(s) * 0.25, 0.35 + aData.y * 0.45, cos(s) * 0.2);
        vec3 hover = p + up * lift + vec3(sin(t * 2.0 + s), 0.0, cos(t * 1.7 + s)) * 0.05 * lift;
        vec3 mid = mix(hover, uTarget, 0.5) + vec3(0.0, 0.5, 0.2);
        vec3 a = mix(hover, mid, go), b = mix(mid, uTarget, go);
        p = mix(a, b, go);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float q = aData.z * smoothstep(0.4, 1.0, t);
        gl_PointSize = uScale * (mix(9.0, 46.0, q) * aData.w) * (3.0 / -mv.z) * (1.0 - 0.6 * smoothstep(1.8, 2.3, t));
        vAlpha = step(0.0, t) * smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(2.05, 2.35, t));
        vColor = aColor * 1.15;
        vQ = q;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uQ;
      varying vec3 vColor; varying float vAlpha; varying float vQ;
      void main() {
        vec2 pc = gl_PointCoord;
        float d = length(pc - 0.5) * 2.0;
        float dotA = 1.0 - smoothstep(0.6, 1.0, d);
        vec4 q = texture(uQ, vec2(pc.x, 1.0 - pc.y));
        vec3 c = mix(vColor, q.rgb, vQ);
        float a = mix(dotA, q.a, vQ) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(c, a);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  return pts;
}

// ── HUD: ribbons drawn in stage pixels (y down) ──────────────────────────
export function ribbon(points, { width = 10, a = BRAND.cyan, b = BRAND.cyan, closed = false, glow = 1.0 } = {}) {
  // points: [[x,y], ...] in stage px. Builds a smooth strip.
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, H - y, 0)), closed, 'centripetal');
  const N = 220;
  const pos = [], uvs = [], idx = [];
  const pts = curve.getSpacedPoints(N);
  for (let i = 0; i <= N; i++) {
    const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)];
    const tx = q.x - o.x, ty = q.y - o.y;
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l, ny = tx / l;
    pos.push(p.x + nx, p.y + ny, 0, p.x - nx, p.y - ny, 0);
    uvs.push(i / N, 1, i / N, -1);
    if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uHead: { value: 0 }, uLen: { value: 1 }, uWidth: { value: width }, uA: { value: col(a) }, uB: { value: col(b) },
      uOpacity: { value: 1 }, uGlow: { value: glow }, uClosed: { value: closed ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uWidth; varying vec2 vUv;
      void main() {
        vUv = uv;
        // positions carry the unit normal offset; scale it to the stroke width
        vec3 p = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uHead, uLen, uOpacity, uGlow, uClosed; uniform vec3 uA, uB; varying vec2 vUv;
      void main() {
        float u = vUv.x;
        float tail = uHead - uLen;
        float uu = u;
        if (uClosed > 0.5 && uu > uHead) uu -= 1.0;
        float vis = step(tail, uu) * step(uu, uHead);
        float k = clamp((uu - tail) / max(uLen, 1e-4), 0.0, 1.0);
        float taper = smoothstep(0.0, 0.25, k) * (1.0 - smoothstep(0.985, 1.0, k) * 0.0);
        float edge = 1.0 - smoothstep(0.55, 1.0, abs(vUv.y));
        vec3 c = mix(uA, uB, k) * (1.0 + 0.6 * uGlow * smoothstep(0.85, 1.0, k));
        float a = vis * edge * taper * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(c, a);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  // widen the strip in object space once (positions were built with unit normals)
  const arr = geo.attributes.position.array;
  for (let i = 0; i <= N; i++) {
    const ax = arr[i * 6], ay = arr[i * 6 + 1], bx = arr[i * 6 + 3], by = arr[i * 6 + 4];
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, nx = (ax - bx) / 2, ny = (ay - by) / 2;
    arr[i * 6] = cx + nx * width / 2;
    arr[i * 6 + 1] = cy + ny * width / 2;
    arr[i * 6 + 3] = cx - nx * width / 2;
    arr[i * 6 + 4] = cy - ny * width / 2;
  }
  geo.attributes.position.needsUpdate = true;
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

function hudQuad(canvas, w, h) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  m.frustumCulled = false;
  return { mesh: m, tex: t };
}

function buildSparks(count = 70) {
  const r = rng(31);
  const dir = new Float32Array(count * 3), data = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.2;
    const s = 160 + r() * 380;
    dir.set([Math.cos(a) * s, -Math.sin(a) * s, 0], i * 3);
    data.set([4 + r() * 9, r()], i * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uOrigin: { value: new THREE.Vector2() } },
    vertexShader: /* glsl */ `
      attribute vec3 aDir; attribute vec2 aData; uniform float uT; uniform vec2 uOrigin; varying float vA; varying float vMix;
      void main() {
        float t = max(uT, 0.0);
        vec2 p = uOrigin + aDir.xy * (1.0 - exp(-3.0 * t)) / 3.0 + vec2(0.0, 60.0 * t * t);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
        gl_PointSize = aData.x * (1.0 - smoothstep(0.6, 1.3, t));
        vA = step(0.0, uT) * (1.0 - smoothstep(0.7, 1.3, t + aData.y * 0.3));
        vMix = aData.y;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying float vMix;
      void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = (1.0 - smoothstep(0.6, 1.0, d)) * vA; if (a < 0.01) discard;
        vec3 c = mix(vec3(1.0, 0.48, 0.11), vec3(1.0, 0.72, 0.45), vMix);
        gl_FragColor = vec4(c * 1.2, a); }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

// ── Stage ────────────────────────────────────────────────────────────────
export function createStage(canvas, assets, { preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 80);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const backdrop = buildBackdrop();
  scene.add(backdrop);

  const hemi = new THREE.HemisphereLight(0xfffaf2, 0xd9c4ae, 0.9);
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.5);
  sun.position.set(-2.5, 6, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -3;
  sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3;
  sun.shadow.camera.bottom = -3;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 20;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  const rim = new THREE.DirectionalLight(col(BRAND.cyan), 1.2);
  rim.position.set(3, 1, -2);
  scene.add(hemi, sun, sun.target, rim);

  // phone
  const phone = buildPhone();
  scene.add(phone.group);
  const screens = {};
  for (const [k, img] of Object.entries(assets.screens)) {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.needsUpdate = true;
    screens[k] = t;
  }

  // desk, page, ink
  const desk = buildDesk(assets.lesson.canvas);
  desk.group.position.set(0, -2.6, 0);
  scene.add(desk.group);
  desk.group.updateMatrixWorld(true);
  const ink = buildInk(assets.inkUV, desk.sheet);
  scene.add(ink);

  // illustrative quiz cards (3D, emerge from the phone)
  const cards = assets.cardCanvases.map((cv, i) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25 * (cv.height / cv.width)), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.renderOrder = 10 + i;
    scene.add(m);
    return m;
  });

  // HUD
  const hud = new THREE.Scene();
  const hudCam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  const R = {};
  const tp = assets.poi.tablet;
  R.cyanIn = ribbon([[tp[0], tp[1]], [tp[0] - 260, tp[1] - 260], [200, 760], [520, 560], [860, 700], [940, 380], [700, 180]], { width: 16, a: '#7FD8F7', b: BRAND.cyan });
  R.orangeIn = ribbon([[tp[0] + 40, tp[1] + 60], [tp[0] + 300, tp[1] - 120], [880, 980], [640, 820], [420, 900], [300, 640]], { width: 12, a: '#FFB27A', b: BRAND.orange });
  const fam = assets.poi.family;
  const orbit = (rx, ry, rot, cx, cy) => {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  };
  R.orbitCyan = ribbon(orbit(470, 230, -0.22, fam[0], fam[1]), { width: 9, a: '#9BE0F8', b: BRAND.cyan, closed: true });
  R.orbitOrange = ribbon(orbit(430, 270, 0.3, fam[0], fam[1] + 40), { width: 7, a: '#FFC59A', b: BRAND.orange, closed: true });
  R.arc = ribbon([[300, 1120], [330, 760], [540, 560], [790, 690], [820, 960]], { width: 22, a: '#8EDBF7', b: BRAND.cyan });
  for (const k of Object.keys(R)) {
    R[k].visible = false;
    hud.add(R[k]);
  }
  // clock ring: lives behind the phone so the device sits inside the dial
  const ringTex = new THREE.CanvasTexture(assets.ringCanvas);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 2.12), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false }));
  ringMesh.position.z = -0.45;
  ringMesh.renderOrder = -2;
  ringMesh.visible = false;
  phone.group.add(ringMesh);
  // answer card overlay (illustrative) for the kid's shot
  const answer = hudQuad(assets.answerCanvas, assets.answerCanvas.width / 2, assets.answerCanvas.height / 2);
  answer.mesh.visible = false;
  hud.add(answer.mesh);
  const sparks = buildSparks();
  hud.add(sparks);

  // post: gentle bloom only on HDR accents
  const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const hudPass = new RenderPass(hud, hudCam);
  hudPass.clear = false;
  composer.addPass(hudPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.5, 1.02);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void main() {
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        vec2 q = (vUv - 0.5) * vec2(0.5625, 1.0);
        c *= 1.0 - 0.18 * smoothstep(0.25, 0.75, length(q));
        c += (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 97.0) - 0.5) * (1.5 / 255.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  composer.addPass(film);

  return { THREE, renderer, composer, scene, camera, backdrop, phone, screens, desk, ink, cards, hud, hudCam, R, ringMesh, ringTex, answer, sparks, sun, bloom, film };
}
