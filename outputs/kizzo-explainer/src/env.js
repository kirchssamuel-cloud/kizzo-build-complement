// Environnement : fond dégradé navy avec halos de marque, sol infini (ombres douces),
// faisceaux volumétriques, poussière lumineuse (bokeh), éclairage studio.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fxMaterial, setFX } from './materials.js';
import { rng } from './util.js';

export function createEnvironment(renderer, scene) {
  // Réflexions réalistes : studio procédural pré-filtré (PMREM)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();

  // ---- Fond (sphère qui suit la caméra)
  const bgMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#16233D') },
      uBottom: { value: new THREE.Color('#070C18') },
      uG1Dir: { value: new THREE.Vector3(-0.5, 0.6, -0.6).normalize() },
      uG1Col: { value: new THREE.Color('#3DB5DA').multiplyScalar(0.35) },
      uG2Dir: { value: new THREE.Vector3(0.6, -0.1, -0.8).normalize() },
      uG2Col: { value: new THREE.Color('#F97316').multiplyScalar(0.22) },
      uG3Dir: { value: new THREE.Vector3(0, 0.2, -1).normalize() },
      uG3Col: { value: new THREE.Color('#ffffff').multiplyScalar(0.0) },
      uTime: { value: 0 },
      uExposure: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uBottom, uG1Dir, uG1Col, uG2Dir, uG2Col, uG3Dir, uG3Col;
      uniform float uTime, uExposure;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = smoothstep(-0.55, 0.75, d.y);
        vec3 col = mix(uBottom, uTop, h);
        col += uG1Col * pow(max(dot(d, uG1Dir), 0.0), 5.0);
        col += uG2Col * pow(max(dot(d, uG2Dir), 0.0), 4.0);
        col += uG3Col * pow(max(dot(d, uG3Dir), 0.0), 9.0);
        col *= uExposure;
        col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 160.0;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const bg = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 24), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -10;
  scene.add(bg);

  // ---- Sol : cyclorama sombre qui reçoit les ombres et s'évanouit dans le fond
  const floorMat = new THREE.MeshStandardMaterial({ color: '#0C1424', roughness: 0.42, metalness: 0.0, transparent: true, envMapIntensity: 0.25 });
  floorMat.onBeforeCompile = (sh) => {
    sh.uniforms.uFloorFade = floorMat.userData.fade;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorXY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorXY = position.xy;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorXY;\nuniform float uFloorFade;')
      .replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\nfloat fr = length(vFloorXY) / 9.0;\ngl_FragColor.a *= (1.0 - smoothstep(0.25, 1.0, fr)) * uFloorFade;'
      );
  };
  floorMat.userData.fade = { value: 1 };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 96), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.renderOrder = -5;
  scene.add(floor);

  // ---- Éclairage studio
  const hemi = new THREE.HemisphereLight('#BFD9FF', '#0A0F1C', 0.22);
  scene.add(hemi);
  const key = new THREE.SpotLight('#FFF4E8', 38, 30, 0.55, 0.65, 1.6);
  key.position.set(-3.2, 7.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 9;
  key.shadow.blurSamples = 16;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 20;
  scene.add(key, key.target);
  const rimC = new THREE.PointLight('#3DB5DA', 16, 14, 1.6);
  rimC.position.set(-3.5, 2.5, -3.2);
  const rimO = new THREE.PointLight('#F97316', 14, 14, 1.6);
  rimO.position.set(3.6, 1.2, -2.6);
  const fill = new THREE.DirectionalLight('#DDEBFF', 0.4);
  fill.position.set(3, 2, 6);
  const sweep = new THREE.PointLight('#ffffff', 0, 6, 1.5);
  scene.add(rimC, rimO, fill, sweep);

  // ---- Faisceaux volumétriques (cônes additifs)
  const shaftMat = () =>
    fxMaterial({
      uniforms: { uColor: { value: new THREE.Color('#CFE6FF') }, uIntensity: { value: 0.0 } },
      vertex: /* glsl */ `
        varying vec3 vN; varying vec3 vVP; varying vec2 vUv; varying float vViewZ;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vVP = mv.xyz; vViewZ = mv.z;
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragment: /* glsl */ `
        uniform vec3 uColor; uniform float uIntensity; uniform float uTime;
        varying vec3 vN; varying vec3 vVP; varying vec2 vUv; varying float vViewZ;
        float n2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(n2(i),n2(i+vec2(1,0)),f.x), mix(n2(i+vec2(0,1)),n2(i+vec2(1,1)),f.x), f.y); }
        void main() {
          float facing = abs(dot(normalize(vN), normalize(-vVP)));
          float edge = pow(facing, 2.5);
          float along = pow(vUv.y, 1.4) * smoothstep(0.0, 0.25, vUv.y);
          float flick = 0.75 + 0.25 * vn(vec2(vUv.x * 9.0, vUv.y * 3.0 - uTime * 0.25));
          float a = edge * along * flick * uIntensity * fxDepthFade(vViewZ, 0.6);
          gl_FragColor = vec4(uColor * a, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  const shafts = new THREE.Group();
  const shaftDefs = [
    { pos: [-1.6, 4.2, 1.2], r: 1.25, h: 9, tilt: [0.12, 0, 0.18], color: '#D7EBFF' },
    { pos: [1.4, 4.4, -0.8], r: 1.0, h: 9, tilt: [-0.08, 0, -0.16], color: '#7FD3EC' },
    { pos: [0.2, 4.6, -2.6], r: 1.6, h: 10, tilt: [0.05, 0, 0.05], color: '#FFD3B0' },
  ];
  for (const s of shaftDefs) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, s.r, s.h, 48, 1, true), shaftMat());
    m.material.uniforms.uColor.value.set(s.color);
    m.position.set(...s.pos);
    m.rotation.set(...s.tilt);
    m.frustumCulled = false;
    shafts.add(m);
  }
  setFX(shafts);
  scene.add(shafts);

  // ---- Poussière lumineuse (bokeh calculé dans le shader selon la mise au point)
  const N = 700;
  const r = rng(42);
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (r() - 0.5) * 10;
    pos[i * 3 + 1] = (r() - 0.5) * 7;
    pos[i * 3 + 2] = (r() - 0.5) * 10;
    seed[i * 4] = r();
    seed[i * 4 + 1] = r();
    seed[i * 4 + 2] = r();
    seed[i * 4 + 3] = r();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const dustMat = fxMaterial({
    uniforms: {
      uT: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(10, 7, 10) },
      uFocus: { value: 5 },
      uAperture: { value: 0.6 },
      uPx: { value: 1 },
      uIntensity: { value: 1 },
      uWarm: { value: new THREE.Color('#FFC59A') },
      uCool: { value: new THREE.Color('#9FDFF2') },
    },
    vertex: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uT; uniform vec3 uCenter; uniform vec3 uBox; uniform float uFocus; uniform float uAperture; uniform float uPx;
      varying float vA; varying vec3 vCol; varying float vViewZ; varying float vSharp;
      uniform vec3 uWarm; uniform vec3 uCool;
      void main() {
        vec3 drift = vec3(sin(uT * 0.21 + aSeed.x * 6.28) * 0.35, uT * (0.04 + aSeed.y * 0.06), cos(uT * 0.17 + aSeed.z * 6.28) * 0.35);
        vec3 p = position + drift - uCenter + uBox * 0.5;
        p = mod(p, uBox) - uBox * 0.5 + uCenter;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vViewZ = mv.z;
        float dist = -mv.z;
        float coc = abs(dist - uFocus) / dist * uAperture * 34.0;
        float base = (1.5 + aSeed.w * 2.5);
        float size = base + coc;
        gl_PointSize = size * uPx;
        vSharp = base / size;
        float edgeFade = 1.0 - smoothstep(0.38, 0.5, max(max(abs(p.x - uCenter.x) / uBox.x, abs(p.y - uCenter.y) / uBox.y), abs(p.z - uCenter.z) / uBox.z));
        vA = (0.35 + 0.65 * aSeed.y) * (0.6 + 0.4 * sin(uT * (1.0 + aSeed.x * 2.0) + aSeed.z * 30.0)) * edgeFade * smoothstep(0.3, 1.2, dist);
        vA *= vSharp * vSharp * 0.9 + 0.1;
        vCol = mix(uCool, uWarm, step(0.62, aSeed.x));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment: /* glsl */ `
      uniform float uIntensity;
      varying float vA; varying vec3 vCol; varying float vViewZ; varying float vSharp;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c) * 2.0;
        float disc = mix(smoothstep(1.0, 0.82, r) * (0.75 + 0.25 * smoothstep(0.6, 0.95, r)), pow(max(1.0 - r, 0.0), 2.0), vSharp);
        float a = disc * vA * uIntensity * fxDepthFade(vViewZ, 0.4);
        if (a < 0.002) discard;
        gl_FragColor = vec4(vCol * a, 1.0);
      }
    `,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  setFX(dust);
  scene.add(dust);

  return { bg, bgMat, floor, floorMat, hemi, key, rimC, rimO, fill, sweep, shafts, dust, dustMat, envTex };
}
