// WebGL stage: renderer + post chain, the 3D world (abstract brand geometry,
// the phone, floating panels, rings, particles) and a screen-space HUD layer
// (the orange orb, flares, logo particles) composited before bloom.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BRAND, TONE } from './palette.js';
import { rng } from './timeline.js';

export const W = 1920;
export const H = 1080;

const col = (hex) => new THREE.Color(hex);

// ── Materials ─────────────────────────────────────────────────────────────

// Thin luminous ring that can draw itself on, run as a comet trail, or show
// a progress arc. Arc parameter is 0 at 12 o'clock, increasing clockwise.
function arcMaterial(a, b = a, intensity = 1.6) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: col(a) },
      uColorB: { value: col(b) },
      uStart: { value: 0 },
      uEnd: { value: 1 },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
      uHead: { value: 0 },
      uTail: { value: 0 },
      uTrack: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying float vA;
      varying float vRim;
      void main() {
        float a = atan(position.y, position.x);
        vA = fract((1.5707963 - a) / 6.2831853);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vRim = 1.0 - abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA, uColorB;
      uniform float uStart, uEnd, uOpacity, uIntensity, uHead, uTail, uTrack;
      varying float vA;
      varying float vRim;
      float seg(float a) {
        if (a < uStart || a > uEnd) return 0.0;
        float x = (a - uStart) / max(uEnd - uStart, 1e-4);
        return uTail > 0.0 ? smoothstep(0.0, uTail, x) : 1.0;
      }
      void main() {
        float s = max(seg(vA), seg(vA + 1.0));
        float hd = min(abs(uEnd - vA), abs(uEnd - vA - 1.0));
        float head = exp(-hd * 70.0) * step(1e-3, s) * uHead;
        vec3 c = mix(uColorA, uColorB, vA);
        float lum = s * uIntensity * (0.75 + 0.5 * vRim) + head * 5.0;
        gl_FragColor = vec4((c * lum + c * uTrack * 0.22) * uOpacity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Luminous glass: bright fresnel rim, nearly empty core.
function rimMaterial(hex, power = 2.4, intensity = 1.8, core = 0.05) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: col(hex) },
      uOpacity: { value: 1 },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uCore: { value: core },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uPower, uIntensity, uCore;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), uPower);
        gl_FragColor = vec4(uColor * (f * uIntensity + uCore) * uOpacity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Soft radial glow card (additive).
function glowMaterial(hex, intensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col(hex) }, uOpacity: { value: 1 }, uIntensity: { value: intensity }, uFalloff: { value: 2.6 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uIntensity, uFalloff; varying vec2 vUv;
      void main(){ float d = length(vUv - 0.5) * 2.0; float g = exp(-d * d * uFalloff) * smoothstep(1.0, 0.7, d);
        gl_FragColor = vec4(uColor * g * uIntensity * uOpacity, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

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

// ── Phone ────────────────────────────────────────────────────────────────
export const PHONE = {
  screenW: 0.9227,
  screenH: 2.0,
  bezel: 0.046,
  bodyR: 0.158,
  screenR: 0.12,
  depth: 0.058,
  bevel: 0.024,
};
PHONE.bodyW = PHONE.screenW + 2 * PHONE.bezel;
PHONE.bodyH = PHONE.screenH + 2 * PHONE.bezel;
PHONE.front = PHONE.depth / 2 + PHONE.bevel;

// screen point (iPhone pts) → phone-local coordinates on the glass
export function screenPtToLocal(x, y) {
  return new THREE.Vector3((x / 430 - 0.5) * PHONE.screenW, (0.5 - y / 932) * PHONE.screenH, PHONE.front + 0.002);
}

function buildPhone(texParent, texKid) {
  const g = new THREE.Group();
  const P = PHONE;
  const shape = roundedRect(P.bodyW - 2 * P.bevel, P.bodyH - 2 * P.bevel, P.bodyR - P.bevel);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: P.depth,
    bevelEnabled: true,
    bevelThickness: P.bevel,
    bevelSize: P.bevel,
    bevelSegments: 10,
    curveSegments: 40,
  });
  bodyGeo.translate(0, 0, -P.depth / 2);
  const frame = new THREE.MeshPhysicalMaterial({
    color: col('#3A4864'),
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.25,
  });
  const glassBody = new THREE.MeshPhysicalMaterial({
    color: col('#05070D'),
    metalness: 0.3,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.8,
  });
  const body = new THREE.Mesh(bodyGeo, [glassBody, frame]);
  g.add(body);

  // side keys
  const keys = [
    [-1, 0.56, 0.1],
    [-1, 0.36, 0.14],
    [1, 0.44, 0.22],
  ];
  for (const [side, y, len] of keys) {
    const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, len, 4, 12), frame);
    k.position.set(side * (P.bodyW / 2 + 0.002), y, 0);
    g.add(k);
  }

  // camera module on the back
  const bumpGeo = new THREE.ExtrudeGeometry(roundedRect(0.4, 0.42, 0.1), {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 4,
    curveSegments: 20,
  });
  const bump = new THREE.Mesh(bumpGeo, glassBody);
  bump.rotation.y = Math.PI;
  bump.position.set(0.22, 0.73, -P.front + 0.004);
  g.add(bump);
  const lensGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.03, 32);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: col('#0B1324'), metalness: 0.6, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.5 });
  for (const [x, y] of [[0.13, 0.82], [0.13, 0.64], [0.3, 0.73]]) {
    const l = new THREE.Mesh(lensGeo, lensMat);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, y, -P.front - 0.02);
    g.add(l);
  }

  // display
  const screenMat = new THREE.ShaderMaterial({
    uniforms: {
      uTexA: { value: texParent },
      uTexB: { value: texKid },
      uMix: { value: 0 },
      uPower: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: new THREE.Vector2(P.screenW, P.screenH) },
      uRadius: { value: P.screenR },
      uEdge: { value: col(BRAND.orange) },
      uGlare: { value: 1 },
      uDim: { value: 1 },
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
      uniform sampler2D uTexA, uTexB;
      uniform float uMix, uPower, uTime, uRadius, uGlare, uDim;
      uniform vec2 uSize; uniform vec3 uEdge;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      float rrect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float d = rrect(p, uSize * 0.5, uRadius);
        float mask = 1.0 - smoothstep(-0.0025, 0.0005, d);
        // liquid wipe: kid UI floods up from the bottom
        float live = step(0.0005, uMix) * step(uMix, 0.9995);
        float front = mix(-0.12, 1.12, uMix);
        float wave = (0.016 * sin(vUv.x * 7.0 + uTime * 6.0) + 0.006 * sin(vUv.x * 15.0 - uTime * 9.0)) * live;
        float y = vUv.y - wave;
        float edge = exp(-abs(y - front) * 120.0) * live;
        float mB = 1.0 - smoothstep(front - 0.004, front + 0.004, y);
        vec2 ref = vec2(0.0, edge * 0.035);
        vec3 a = texture2D(uTexA, vUv + ref).rgb;
        vec3 b = texture2D(uTexB, vUv - ref).rgb;
        vec3 c = mix(a, b, mB);
        c += mix(uEdge, vec3(1.0), 0.35) * edge * 1.8;
        // power-on: the UI opens as an expanding ring of brand-blue light
        float rad = length(p * vec2(1.0, 0.62));
        float pr = uPower * 0.82;
        c *= smoothstep(pr, pr - 0.06, rad) * uDim;
        c += vec3(0.17, 0.73, 0.93) * exp(-abs(rad - pr) * 55.0) * (1.0 - smoothstep(0.7, 1.0, uPower)) * step(0.001, uPower) * 2.2 * uDim;
        // glass: fresnel + two studio softboxes moving with the device
        vec3 N = normalize(vN), V = normalize(vV);
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        float strip = smoothstep(0.9, 0.995, dot(R, normalize(vec3(-0.55, 0.5, 0.67))));
        float strip2 = smoothstep(0.96, 0.999, dot(R, normalize(vec3(0.7, -0.25, 0.66))));
        float sky = smoothstep(-0.2, 1.0, R.y) * 0.05;
        c += (strip * 0.22 + strip2 * 0.12 + sky) * (0.35 + fres) * uGlare;
        gl_FragColor = vec4(c, mask);
      }`,
    transparent: true,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(P.screenW, P.screenH), screenMat);
  screen.position.z = P.front + 0.0015;
  screen.renderOrder = 2;
  g.add(screen);

  // light the device casts into the haze behind it
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 6.2), glowMaterial(BRAND.blue, 0.35));
  halo.position.z = -0.6;
  halo.renderOrder = -5;
  g.add(halo);

  return { group: g, screen, screenMat, halo, frame };
}

// ── Particles ─────────────────────────────────────────────────────────────
const POINT_FRAG = /* glsl */ `
  varying vec3 vColor; varying float vAlpha; varying float vKind;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = length(q) * 2.0;
    float disc = 1.0 - smoothstep(0.7, 1.0, d);
    float ringS = smoothstep(0.55, 0.7, d) * (1.0 - smoothstep(0.85, 1.0, d));
    float s = mix(disc, ringS, step(0.5, vKind));
    if (s < 0.01) discard;
    gl_FragColor = vec4(vColor * s * vAlpha, 1.0);
  }`;

function buildDust(count = 520) {
  const r = rng(7);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 2);
  const colr = new Float32Array(count * 3);
  const palette = [col('#CFEFFF'), col(BRAND.blue), col('#FFFFFF'), col(BRAND.orange)];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * 20;
    pos[i * 3 + 1] = (r() - 0.5) * 11;
    pos[i * 3 + 2] = -12 + r() * 19;
    seed[i * 2] = r();
    seed[i * 2 + 1] = 0.4 + r() * 1.4;
    const c = palette[r() < 0.07 ? 3 : r() < 0.45 ? 1 : r() < 0.7 ? 2 : 0];
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uWarp: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec2 aSeed; attribute vec3 aColor;
      uniform float uTime, uWarp;
      varying vec3 vColor; varying float vAlpha; varying float vKind;
      void main() {
        vec3 p = position;
        float s = aSeed.x * 6.2831;
        p += vec3(sin(uTime * 0.21 + s) * 0.35, uTime * 0.045 * aSeed.y + sin(uTime * 0.33 + s * 2.0) * 0.2, cos(uTime * 0.17 + s) * 0.3);
        p.z += uWarp * (1.0 + aSeed.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        float size = (0.8 + aSeed.y * 1.1) * (26.0 / depth);
        gl_PointSize = clamp(size, 1.0, 5.0);
        vAlpha = (0.25 + 0.5 * aSeed.x) * smoothstep(2.2, 4.5, depth) * smoothstep(24.0, 10.0, depth);
        vAlpha *= 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.y) + s);
        vColor = aColor;
        vKind = 0.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: POINT_FRAG.replace('vec4(vColor * s * vAlpha, 1.0)', 'vec4(vColor * s * vAlpha * uOpacity, 1.0)').replace(
      'varying vec3 vColor;',
      'uniform float uOpacity; varying vec3 vColor;'
    ),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function buildFloor() {
  const pts = [];
  for (let x = -14; x <= 14; x += 0.5) for (let z = -16; z <= 6; z += 0.5) pts.push(x, 0, z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uColor: { value: col(BRAND.blue) } },
    vertexShader: /* glsl */ `
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = length(position.xz - vec2(0.0, -1.0));
        vA = smoothstep(12.0, 2.0, d) * smoothstep(0.5, 3.0, -mv.z);
        gl_PointSize = clamp(110.0 / -mv.z, 1.0, 6.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform vec3 uColor; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float s = 1.0 - smoothstep(0.5, 1.0, d);
        gl_FragColor = vec4(uColor * s * vA * uOpacity, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(geo, mat);
  p.position.y = -2.15;
  p.frustumCulled = false;
  return p;
}

// Reward burst: brand circles and rings thrown out of the screen.
function buildBurst(count = 420) {
  const r = rng(21);
  const dir = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);
  const colr = new Float32Array(count * 3);
  const pal = [col(BRAND.orange), col(BRAND.blue), col('#FFFFFF'), col('#FFD2AE')];
  for (let i = 0; i < count; i++) {
    // biased toward the viewer and sideways, not into the device
    let x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 1.2 - 0.1;
    const l = Math.hypot(x, y, z) || 1;
    dir.set([x / l, y / l, z / l], i * 3);
    data.set([1.2 + r() * 3.6, 0.5 + r() * 1.8, r() < 0.22 ? 1 : 0, r()], i * 4);
    const c = pal[r() < 0.42 ? 0 : r() < 0.7 ? 1 : r() < 0.9 ? 2 : 3];
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uOrigin: { value: new THREE.Vector3() }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 aDir; attribute vec4 aData; attribute vec3 aColor;
      uniform float uT; uniform vec3 uOrigin;
      varying vec3 vColor; varying float vAlpha; varying float vKind;
      void main() {
        float t = max(uT, 0.0);
        float drag = 2.4;
        vec3 p = uOrigin + aDir * aData.x * (1.0 - exp(-drag * t)) / drag;
        p.y -= 0.28 * t * t;
        p += vec3(sin(aData.w * 40.0 + t * 2.0), cos(aData.w * 27.0 + t * 1.6), 0.0) * 0.06 * t;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(aData.y * 7.0 * (6.0 / -mv.z), 1.0, 44.0);
        vAlpha = step(0.0, uT) * smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.8, 1.9, t + aData.w * 0.4));
        vColor = aColor * mix(1.7, 1.0, smoothstep(0.0, 0.5, t));
        vKind = aData.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

// ── HUD (screen space, pixels, y up) ─────────────────────────────────────
function buildHUD() {
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);

  const orbMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: col(BRAND.orange) },
      uCore: { value: 0.12 },
      uGlow: { value: 1 },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uCore, uGlow, uOpacity; varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5);
        float aa = fwidth(d) * 1.2;
        float core = 1.0 - smoothstep(uCore - aa, uCore + aa, d);
        float halo = (exp(-max(d - uCore, 0.0) * 22.0) * 0.9 + exp(-max(d - uCore, 0.0) * 7.0) * 0.25) * smoothstep(0.5, 0.25, d);
        vec3 c = uColor * core * (1.0 + 0.45 * max(uGlow - 1.0, 0.0)) + uColor * halo * uGlow * (1.0 - core);
        gl_FragColor = vec4(c * uOpacity, 1.0);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const orb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), orbMat);
  scene.add(orb);

  // anamorphic streak
  const flareMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col('#9FE3FF') }, uOpacity: { value: 0 }, uWidth: { value: 0.5 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uWidth; varying vec2 vUv;
      void main() {
        float x = abs(vUv.x - 0.5) * 2.0, y = abs(vUv.y - 0.5) * 2.0;
        float core = exp(-y * y * 900.0) * exp(-x * x / (uWidth * uWidth + 1e-4) * 3.0);
        float wide = exp(-y * y * 40.0) * exp(-x * x / (uWidth * uWidth + 1e-4) * 6.0) * 0.18;
        gl_FragColor = vec4(uColor * (core * 2.2 + wide) * uOpacity, 1.0);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, 220), flareMat);
  scene.add(flare);

  // pulse ring (orb landing, card snaps)
  const pulseMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col(BRAND.orange) }, uOpacity: { value: 0 }, uR: { value: 0.3 }, uW: { value: 0.02 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uR, uW; varying vec2 vUv;
      void main() { float d = length(vUv - 0.5); float r = exp(-pow((d - uR) / uW, 2.0));
        gl_FragColor = vec4(uColor * r * uOpacity * 1.6, 1.0); }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pulse = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pulseMat);
  scene.add(pulse);

  const flashMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col('#BFEBFF') }, uOpacity: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform vec2 uCenter; varying vec2 vUv;
      void main() { vec2 q = (vUv - uCenter) * vec2(1.777, 1.0); float g = exp(-dot(q, q) * 2.5) * 0.85 + 0.15;
        gl_FragColor = vec4(uColor * g * uOpacity, 1.0); }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
  flash.frustumCulled = false;
  flash.renderOrder = 10;
  scene.add(flash);

  return { scene, cam, orb, flare, pulse, flash };
}

// Text → logo particles. Built once layout is known (see logo.js).
export function buildLogoParticles(src, dst, dstColor, delays) {
  const n = src.length / 2;
  const r = rng(99);
  const aStart = new Float32Array(n * 3);
  const aEnd = new Float32Array(n * 3);
  const aCol = new Float32Array(n * 3);
  const aRand = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    aStart.set([src[i * 2], H - src[i * 2 + 1], 0], i * 3);
    aEnd.set([dst[i * 2], H - dst[i * 2 + 1], 0], i * 3);
    const c = dstColor[i];
    aCol.set([c.r, c.g, c.b], i * 3);
    aRand.set([delays[i], r(), r(), 1.6 + r() * 1.8], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aStart, 3));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3));
  geo.setAttribute('aCol', new THREE.BufferAttribute(aCol, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uDur: { value: 0.9 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 aEnd; attribute vec3 aCol; attribute vec4 aRand;
      uniform float uT, uDur;
      varying vec3 vColor; varying float vAlpha; varying float vKind;
      void main() {
        float k = clamp((uT - aRand.x) / uDur, 0.0, 1.0);
        float e = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
        vec2 a = position.xy, b = aEnd.xy;
        vec2 p = mix(a, b, e);
        vec2 dir = b - a;
        vec2 perp = normalize(vec2(-dir.y, dir.x) + 1e-4);
        float arc = sin(e * 3.14159);
        p += perp * arc * (aRand.y - 0.5) * 170.0;
        float lift = smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.12, 0.5, k));
        p += vec2(aRand.z - 0.5, aRand.y - 0.2) * 70.0 * lift;
        p += vec2(sin(aRand.z * 60.0 + uT * 7.0), cos(aRand.y * 50.0 + uT * 6.0)) * 10.0 * arc;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
        gl_PointSize = aRand.w * (1.0 + arc * 0.9);
        vec3 white = vec3(1.0);
        vColor = mix(white, aCol, smoothstep(0.15, 0.85, e)) * (1.0 + arc * 0.3);
        vAlpha = step(0.0, uT);
        vKind = 0.0;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; varying vec3 vColor; varying float vAlpha; varying float vKind;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float s = 1.0 - smoothstep(0.55, 1.0, d);
        if (s < 0.01) discard;
        gl_FragColor = vec4(vColor, s * vAlpha * uOpacity);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

// ── World assembly ────────────────────────────────────────────────────────
export function createStage(canvas, surfaces, { preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 80);
  camera.position.set(0, 0, 11);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tex = {};
  for (const [k, s] of Object.entries(surfaces)) {
    const t = new THREE.CanvasTexture(s.c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    tex[k] = t;
  }

  // background: deep navy-black, a lift of the logo navy, volumetric beams
  const bgMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: col(TONE.void) },
      uLift: { value: col(BRAND.navy) },
      uGlowPos: { value: new THREE.Vector2(0.5, 0.5) },
      uGlow: { value: 0 },
      uGlowTint: { value: col(BRAND.navy) },
      uBeams: { value: 0 },
      uBeamPos: { value: new THREE.Vector2(0.5, 1.25) },
      uBeamColor: { value: col('#6FCBF2') },
      uFade: { value: 1 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uGlow, uBeams, uFade;
      uniform vec3 uBase, uLift, uGlowTint, uBeamColor;
      uniform vec2 uGlowPos, uBeamPos;
      varying vec2 vUv;
      float h1(float n) { return fract(sin(n) * 43758.5453); }
      float n1(float x) { float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
      void main() {
        vec2 asp = vec2(1.7778, 1.0);
        vec2 p = (vUv - 0.5) * asp;
        vec3 c = uBase;
        c += uLift * 0.22 * smoothstep(1.25, 0.0, length(p - vec2(0.0, -0.05)));
        vec2 g = p - (uGlowPos - 0.5) * asp;
        c += uGlowTint * uGlow * exp(-dot(g, g) * 3.2);
        vec2 d = p - (uBeamPos - 0.5) * asp;
        float ang = atan(d.x, -d.y);
        float dist = length(d);
        float rays = pow(n1(ang * 11.0 + uTime * 0.12), 3.0) + 0.6 * pow(n1(ang * 27.0 - uTime * 0.09 + 7.0), 4.0) + 0.25;
        float cone = smoothstep(0.75, 0.0, abs(ang));
        float fall = exp(-dist * 0.85) * smoothstep(0.1, 0.6, dist);
        c += uBeamColor * rays * cone * fall * uBeams * 0.16;
        gl_FragColor = vec4(c * uFade, 1.0);
      }`,
    depthWrite: false,
    depthTest: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -100;
  scene.add(bg);

  const floor = buildFloor();
  scene.add(floor);
  const dust = buildDust();
  scene.add(dust);

  // ── opening: brand geometry (circles, the limbs' rounded strokes, the embrace)
  const opening = new THREE.Group();
  scene.add(opening);
  const ringSpec = [
    // radius, tube, colorA, colorB, rotation
    [0.62, 0.006, BRAND.blue, '#BFEBFF', [1.15, 0.25, 0]],
    [0.98, 0.005, '#BFEBFF', BRAND.blue, [0.35, 1.0, 0.2]],
    [1.42, 0.007, BRAND.blue, BRAND.blue, [1.42, 0.05, 0.4]],
    [2.05, 0.006, BRAND.orange, '#FFC79E', [0.95, -0.6, 0]],
    [2.85, 0.008, BRAND.blue, '#BFEBFF', [0.18, 0.28, 0]],
    [3.9, 0.01, '#9FDDF7', BRAND.blue, [0.05, -0.12, 0]],
  ];
  const rings = ringSpec.map(([r, tube, a, b, rot]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 320), arcMaterial(a, b, 1.5));
    m.rotation.set(...rot);
    m.userData.baseRot = rot;
    opening.add(m);
    return m;
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32), rimMaterial(BRAND.blue, 2.2, 1.7, 0.03));
  sphere.position.set(-1.7, 1.25, -1.8);
  opening.add(sphere);
  const capGeo = new THREE.CapsuleGeometry(0.1, 1.7, 8, 32);
  const capSpec = [
    // position, z-rotation (deg), colour
    [[-2.75, -0.35, -2.4], -8, BRAND.blue],
    [[2.55, 1.0, -1.2], 40, BRAND.blue],
    [[2.15, -1.45, 0.6], -46, '#BFEBFF'],
  ];
  const capsules = capSpec.map(([p, deg, c]) => {
    const m = new THREE.Mesh(capGeo, rimMaterial(c, 2.0, 1.5, 0.04));
    m.position.set(...p);
    m.rotation.z = (deg * Math.PI) / 180;
    m.userData.rest = new THREE.Vector3(...p);
    opening.add(m);
    return m;
  });

  // ── trails that orbit the phone as it arrives
  const trails = [
    [1.25, BRAND.blue, '#BFEBFF', [1.2, 0.3, 0.2]],
    [1.45, BRAND.orange, '#FFC79E', [1.35, -0.5, -0.4]],
    [1.65, '#BFEBFF', BRAND.blue, [0.6, 0.9, 0.9]],
  ].map(([r, a, b, rot]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 320), arcMaterial(a, b, 2.2));
    m.rotation.set(...rot);
    m.scale.set(1, 1.35, 1);
    m.material.uniforms.uTail.value = 0.9;
    m.material.uniforms.uHead.value = 1;
    scene.add(m);
    return m;
  });

  // ── phone
  const phone = buildPhone(tex.parent, tex.kid);
  scene.add(phone.group);

  // quiz cards float off the glass
  const cards = ['card0', 'card1', 'card2'].map((k, i) => {
    const s = surfaces[k];
    const wPt = s.w;
    const scale = PHONE.screenW / 430;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(wPt * scale, s.h * scale),
      new THREE.MeshBasicMaterial({ map: tex[k], transparent: true, depthWrite: false, opacity: 0 })
    );
    m.renderOrder = 6 + i;
    phone.group.add(m);
    return m;
  });

  // floating parent panels
  const PT = 0.0038;
  const panels = ['limit', 'week', 'quiz'].map((k, i) => {
    const s = surfaces[k];
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(s.w * PT, s.h * PT),
      new THREE.MeshBasicMaterial({ map: tex[k], transparent: true, depthWrite: false, opacity: 0 })
    );
    m.renderOrder = 4 + i;
    scene.add(m);
    return m;
  });

  // kid progress halo + shockwave
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.007, 8, 360), arcMaterial(BRAND.blue, BRAND.orange, 2.4));
  halo.material.uniforms.uHead.value = 1;
  scene.add(halo);
  const shock = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.012, 8, 360), arcMaterial(BRAND.orange, '#FFFFFF', 2.0));
  scene.add(shock);
  const burst = buildBurst();
  scene.add(burst);

  // lights: brand-coloured rims that travel over the metal frame
  const key = new THREE.DirectionalLight(0xffffff, 0.5);
  key.position.set(2, 4, 6);
  const rimBlue = new THREE.DirectionalLight(col(BRAND.blue), 4);
  rimBlue.position.set(-4, 2, -2.5);
  const rimOrange = new THREE.DirectionalLight(col(BRAND.orange), 2.5);
  rimOrange.position.set(4, -1.5, -2.5);
  scene.add(key, rimBlue, rimOrange, new THREE.AmbientLight(0x0a1830, 0.6));

  const hud = buildHUD();

  // ── post chain
  const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const hudPass = new RenderPass(hud.scene, hud.cam);
  hudPass.clear = false;
  composer.addPass(hudPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.55, 1.03);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0.0009 }, uVignette: { value: 0.45 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uCA, uVignette; varying vec2 vUv;
      float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void main() {
        vec2 c = vUv - 0.5;
        float r2 = dot(c * vec2(1.7778, 1.0), c * vec2(1.7778, 1.0));
        vec2 off = c * r2 * uCA * 4.0;
        vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        col *= mix(1.0, smoothstep(1.35, 0.15, r2), uVignette);
        col += (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 97.0) - 0.5) * (1.5 / 255.0);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(film);

  return {
    THREE,
    renderer,
    composer,
    scene,
    camera,
    tex,
    bgMat,
    floor,
    dust,
    opening,
    rings,
    sphere,
    capsules,
    trails,
    phone,
    cards,
    panels,
    halo,
    shock,
    burst,
    lights: { key, rimBlue, rimOrange },
    hud,
    bloom,
    film,
  };
}
