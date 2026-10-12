// Matériaux partagés : reflets "softbox" sur verre, FX additifs avec test de profondeur
// manuel (soft particles), halos, rayons, anneaux. Les FX sont rendus APRÈS la profondeur
// de champ (calque 1) pour rester nets et lumineux.
import * as THREE from 'three';

export const LAYER_FX = 1;

/** Uniforms communs à tous les matériaux FX (mis à jour par le pipeline de post-prod). */
export const fxShared = {
  tSceneDepth: { value: null },
  uRes: { value: new THREE.Vector2(1, 1) },
  uNear: { value: 0.1 },
  uFar: { value: 100 },
  uTime: { value: 0 },
};

const FX_DEPTH = /* glsl */ `
  #include <packing>
  uniform sampler2D tSceneDepth;
  uniform vec2 uRes;
  uniform float uNear;
  uniform float uFar;
  // 1 = visible, 0 = derrière la géométrie ; transition douce près des intersections
  float fxDepthFade(float fragViewZ, float softness) {
    float d = texture2D(tSceneDepth, gl_FragCoord.xy / uRes).x;
    float sceneZ = -perspectiveDepthToViewZ(d, uNear, uFar);
    float fz = -fragViewZ;
    return clamp((sceneZ - fz) / softness, 0.0, 1.0);
  }
`;

export function fxMaterial({ vertex, fragment, uniforms = {}, blending = THREE.AdditiveBlending, side = THREE.FrontSide }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fxShared, ...uniforms },
    vertexShader: vertex,
    fragmentShader: FX_DEPTH + fragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending,
    side,
  });
}

export function setFX(obj) {
  obj.traverse((o) => o.layers.set(LAYER_FX));
  return obj;
}

// ---------------------------------------------------------------------------
// Halo billboard (toujours face caméra)

const BILLBOARD_VS = /* glsl */ `
  uniform float uScale;
  varying vec2 vUv;
  varying float vViewZ;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 s = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), 1.0);
    mv.xy += position.xy * s.xy * uScale;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export function glowMaterial(color = '#ffffff', intensity = 1, { power = 2.2, core = 0.0 } = {}) {
  return fxMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uScale: { value: 1 },
      uPower: { value: power },
      uCore: { value: core },
    },
    vertex: BILLBOARD_VS,
    fragment: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity; uniform float uPower; uniform float uCore;
      varying vec2 vUv; varying float vViewZ;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = pow(max(1.0 - r, 0.0), uPower) + uCore * pow(max(1.0 - r * 4.0, 0.0), 2.0);
        a *= fxDepthFade(vViewZ, 0.25);
        gl_FragColor = vec4(uColor * a * uIntensity, 1.0);
      }
    `,
  });
}

export function makeGlow(color, intensity, size, opts) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial(color, intensity, opts));
  m.scale.setScalar(size);
  m.frustumCulled = false;
  setFX(m);
  return m;
}

/** Halo étiré façon anamorphique (lens streak) */
export function makeStreak(color, intensity, w, h) {
  const mat = fxMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uScale: { value: 1 } },
    vertex: BILLBOARD_VS,
    fragment: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity;
      varying vec2 vUv; varying float vViewZ;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float a = pow(max(1.0 - abs(p.y), 0.0), 6.0) * pow(max(1.0 - abs(p.x), 0.0), 1.6);
        a *= fxDepthFade(vViewZ, 0.25);
        gl_FragColor = vec4(uColor * a * uIntensity, 1.0);
      }
    `,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.scale.set(w, h, 1);
  m.frustumCulled = false;
  setFX(m);
  return m;
}

// ---------------------------------------------------------------------------
// Onde de choc (anneau plat qui s'étend)

export function makeShockwave(color = '#ffffff') {
  const mat = fxMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: 0 }, uIntensity: { value: 2 } },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vViewZ = mv.z; gl_Position = projectionMatrix * mv; }
    `,
    fragment: /* glsl */ `
      uniform vec3 uColor; uniform float uK; uniform float uIntensity;
      varying vec2 vUv; varying float vViewZ;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float rad = 0.2 + uK * 0.78;
        float w = mix(0.012, 0.05, uK);
        float ring = exp(-pow((r - rad) / w, 2.0));
        float inner = smoothstep(rad, rad - 0.25, r) * step(r, rad) * 0.06;
        float a = (ring + inner) * pow(1.0 - uK, 1.6);
        a *= fxDepthFade(vViewZ, 0.3);
        gl_FragColor = vec4(uColor * a * uIntensity, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  setFX(m);
  return m;
}

// ---------------------------------------------------------------------------
// Rayons volumétriques (god rays) derrière un objet héros

export function makeGodRays(colorA = '#FFB27A', colorB = '#7FD3EC', rays = 18) {
  const mat = fxMaterial({
    uniforms: {
      uA: { value: new THREE.Color(colorA) },
      uB: { value: new THREE.Color(colorB) },
      uIntensity: { value: 0 },
      uRot: { value: 0 },
      uRays: { value: rays },
    },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vViewZ = mv.z; gl_Position = projectionMatrix * mv; }
    `,
    fragment: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; uniform float uIntensity; uniform float uRot; uniform float uRays;
      varying vec2 vUv; varying float vViewZ;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float a = atan(p.y, p.x) + uRot;
        float idx = floor((a + 3.14159) / 6.28318 * uRays);
        float f = fract((a + 3.14159) / 6.28318 * uRays);
        float w = mix(0.15, 0.45, h(idx * 7.13));
        float ray = smoothstep(w, 0.0, abs(f - 0.5)) * mix(0.35, 1.0, h(idx * 3.71));
        float fall = pow(max(1.0 - r, 0.0), 1.6) * smoothstep(0.0, 0.18, r);
        float core = pow(max(1.0 - r * 1.6, 0.0), 3.0) * 0.25;
        vec3 col = mix(uA, uB, h(idx * 1.37));
        float k = (ray * fall + core) * uIntensity * fxDepthFade(vViewZ, 0.5);
        gl_FragColor = vec4(col * k, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  setFX(m);
  return m;
}

// ---------------------------------------------------------------------------
// Reflet de verre (softbox virtuelle) — donne les balayages de lumière premium

export function glassGlareMaterial(intensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uIntensity: { value: intensity }, uShift: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vWP; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWP = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uIntensity; uniform float uShift;
      varying vec3 vN; varying vec3 vWP; varying vec2 vUv;
      void main() {
        vec3 V = normalize(cameraPosition - vWP);
        vec3 N = normalize(vN);
        vec3 R = reflect(-V, N);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
        // grande softbox en haut à gauche + bande fine (strip light)
        float b1 = smoothstep(0.62, 0.97, dot(R, normalize(vec3(-0.55, 0.75, 0.4))));
        float sd = dot(R, normalize(vec3(0.9, 0.35, 0.25))) - 0.22 + uShift;
        float b2 = smoothstep(0.07, 0.0, abs(sd)) * 0.8;
        // reflet diagonal discret sur la surface
        float diag = smoothstep(0.035, 0.0, abs(vUv.x * 0.8 + vUv.y - 1.15 - uShift * 2.0)) * 0.12;
        float g = b1 * 0.32 + b2 * 0.22 + fres * 0.35 + diag;
        gl_FragColor = vec4(vec3(1.0) * g * uIntensity, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ---------------------------------------------------------------------------
// Géométries utilitaires

export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
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

/** Plan aux coins arrondis avec UV normalisées 0..1 (pour les textures d'écran). */
export function roundedPlane(w, h, r, seg = 10) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), seg);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** Dalle arrondie extrudée avec biseau doux, centrée en z. */
export function roundedSlab(w, h, d, r, bevel = 0.015, seg = 8) {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.0001, d - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: seg,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  return g;
}

/** Texture d'ombre douce (rectangle arrondi flouté) pour l'occlusion de contact des calques UI. */
let _shadowTex = null;
export function softShadowTexture() {
  if (_shadowTex) return _shadowTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.filter = 'blur(22px)';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(48, 48, 160, 160, 36);
  ctx.fill();
  _shadowTex = new THREE.CanvasTexture(c);
  return _shadowTex;
}

export function shadowPlane(w, h, opacity = 0.5) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.6, h * 1.6),
    new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, opacity, depthWrite: false, color: '#020617' })
  );
  m.renderOrder = 1;
  return m;
}
