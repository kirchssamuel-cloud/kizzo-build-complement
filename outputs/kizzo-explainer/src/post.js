// Pipeline de rendu cinématique :
// scène (MSAA, HDR, profondeur) -> profondeur de champ (bokeh) -> FX lumineux (calque 1,
// test de profondeur manuel) -> bloom -> étalonnage (tone mapping neutre, aberration
// chromatique, zoom-blur de transition, vignette, grain) -> écran.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { fxShared, LAYER_FX } from './materials.js';

const QUAD_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export function createPipeline(renderer, scene, camera, { quality = 'high' } = {}) {
  const samples = quality === 'low' ? 0 : 4;
  const depthTex = new THREE.DepthTexture(4, 4);
  depthTex.type = THREE.FloatType;
  const sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples, depthTexture: depthTex });
  const dofRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });

  const taps = quality === 'low' ? 16 : quality === 'medium' ? 24 : 32;
  const dofMat = new THREE.ShaderMaterial({
    defines: { TAPS: taps },
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      uRes: { value: new THREE.Vector2() },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uFocus: { value: 5 },
      uAperture: { value: 0.5 },
      uMaxBlur: { value: 20 },
    },
    vertexShader: QUAD_VS,
    fragmentShader: /* glsl */ `
      #include <packing>
      uniform sampler2D tColor; uniform sampler2D tDepth;
      uniform vec2 uRes; uniform float uNear, uFar, uFocus, uAperture, uMaxBlur;
      varying vec2 vUv;
      float vdist(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar); }
      float coc(float d) { return clamp(uAperture * abs(d - uFocus) / d * uRes.y * 0.02, 0.0, uMaxBlur); }
      float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
      void main() {
        vec3 base = texture2D(tColor, vUv).rgb;
        float cd = vdist(vUv);
        float cc = coc(cd);
        vec3 sum = base; float wsum = 1.0;
        float rot = ign(gl_FragCoord.xy) * 6.28318;
        for (int i = 0; i < TAPS; i++) {
          float fi = float(i) + 0.5;
          float r = sqrt(fi / float(TAPS)) * uMaxBlur;
          float th = fi * 2.39996323 + rot;
          vec2 uv = vUv + vec2(cos(th), sin(th)) * r / uRes;
          float sd = vdist(uv);
          float sc = coc(sd);
          float eff = sd > cd ? min(sc, cc * 2.0 + 0.5) : sc;
          float w = smoothstep(r - 1.5, r + 0.5, eff);
          sum += texture2D(tColor, uv).rgb * w;
          wsum += w;
        }
        vec3 blurred = sum / wsum;
        gl_FragColor = vec4(mix(base, blurred, smoothstep(0.35, 1.6, cc)), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  const finalMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null },
      uRes: { value: new THREE.Vector2() },
      uExposure: { value: 1 },
      uSat: { value: 1 },
      uVignette: { value: 0.55 },
      uGrain: { value: 0.035 },
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uFlashCol: { value: new THREE.Color('#ffffff') },
      uFade: { value: 0 },
      uFadeCol: { value: new THREE.Color('#05080F') },
      uCA: { value: 0.0 },
      uZoom: { value: 0 },
      uZoomCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uLift: { value: 0.0 },
    },
    vertexShader: QUAD_VS,
    fragmentShader: /* glsl */ `
      uniform sampler2D tColor;
      uniform vec2 uRes, uZoomCenter;
      uniform float uExposure, uSat, uVignette, uGrain, uTime, uFlash, uFade, uCA, uZoom, uLift;
      uniform vec3 uFlashCol, uFadeCol;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 tapCA(vec2 uv) {
        vec2 d = uv - 0.5;
        float k = uCA * dot(d, d);
        return vec3(texture2D(tColor, uv - d * k).r, texture2D(tColor, uv).g, texture2D(tColor, uv + d * k).b);
      }
      // Khronos PBR Neutral : préserve fidèlement les couleurs de marque
      vec3 neutral(vec3 color) {
        const float startCompression = 0.8 - 0.04;
        const float desaturation = 0.15;
        float x = min(color.r, min(color.g, color.b));
        float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
        color -= offset;
        float peak = max(color.r, max(color.g, color.b));
        if (peak < startCompression) return color;
        float d = 1.0 - startCompression;
        float newPeak = 1.0 - d * d / (peak + d - startCompression);
        color *= newPeak / peak;
        float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
        return mix(color, vec3(newPeak), g);
      }
      vec3 toSRGB(vec3 c) {
        c = max(c, 0.0);
        return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
      }
      void main() {
        vec3 col = tapCA(vUv);
        if (uZoom > 0.001) {
          vec3 acc = col;
          vec2 dir = vUv - uZoomCenter;
          float n = hash(gl_FragCoord.xy) * 0.6;
          for (int i = 1; i < 12; i++) {
            float s = 1.0 - uZoom * (float(i) + n) / 12.0 * 0.16;
            acc += tapCA(uZoomCenter + dir * s);
          }
          col = acc / 12.0;
        }
        col *= uExposure;
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, uSat);
        col = neutral(col);
        vec2 q = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
        col *= 1.0 - uVignette * smoothstep(0.3, 1.05, length(q) * 1.35);
        col += uLift * vec3(0.02, 0.03, 0.05);
        col = mix(col, uFlashCol, clamp(uFlash, 0.0, 1.0));
        col = mix(col, uFadeCol, clamp(uFade, 0.0, 1.0));
        col = toSRGB(col);
        float gr = hash(gl_FragCoord.xy * 0.73 + fract(uTime * 7.31) * 113.0) - 0.5;
        col += gr * uGrain * (1.0 - 0.5 * l);
        col += (hash(gl_FragCoord.yx + uTime) - 0.5) / 255.0;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 0.92);
  const quad = new FullScreenQuad(null);
  // copie simple quand la profondeur de champ est coupée (images 2D plein cadre)
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: null } },
    vertexShader: QUAD_VS,
    fragmentShader: /* glsl */ `uniform sampler2D tColor; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0); }`,
    depthTest: false,
    depthWrite: false,
  });
  let W = 4, H = 4;

  function setSize(w, h) {
    W = w;
    H = h;
    sceneRT.setSize(w, h);
    dofRT.setSize(w, h);
    bloom.setSize(w, h);
    dofMat.uniforms.uRes.value.set(w, h);
    finalMat.uniforms.uRes.value.set(w, h);
    fxShared.uRes.value.set(w, h);
  }

  /**
   * @param {object} p paramètres de la frame (mise au point, bloom, étalonnage)
   */
  function render(p) {
    // 1. scène principale
    renderer.shadowMap.needsUpdate = true;
    camera.layers.set(0);
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. profondeur de champ
    const d = dofMat.uniforms;
    d.tColor.value = sceneRT.texture;
    d.tDepth.value = sceneRT.depthTexture;
    d.uNear.value = camera.near;
    d.uFar.value = camera.far;
    d.uFocus.value = p.focus;
    d.uAperture.value = p.aperture;
    d.uMaxBlur.value = Math.max(0.0, (H / 1920) * (p.maxBlur ?? 22));
    if (p.aperture > 0) quad.material = dofMat;
    else {
      copyMat.uniforms.tColor.value = sceneRT.texture;
      quad.material = copyMat;
    }
    renderer.setRenderTarget(dofRT);
    quad.render(renderer);

    // 3. FX additifs (non floutés, testés contre la profondeur de la scène)
    fxShared.tSceneDepth.value = sceneRT.depthTexture;
    fxShared.uNear.value = camera.near;
    fxShared.uFar.value = camera.far;
    camera.layers.set(LAYER_FX);
    const ac = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(dofRT);
    renderer.render(scene, camera);
    renderer.autoClear = ac;
    camera.layers.set(0);

    // 4. bloom
    bloom.strength = p.bloom;
    bloom.radius = p.bloomRadius ?? 0.55;
    bloom.threshold = p.threshold ?? 0.92;
    bloom.render(renderer, null, dofRT, 0, false);

    // 5. étalonnage final
    const f = finalMat.uniforms;
    f.tColor.value = dofRT.texture;
    f.uExposure.value = p.exposure;
    f.uSat.value = p.sat ?? 1;
    f.uVignette.value = p.vignette ?? 0.55;
    f.uGrain.value = p.grain ?? 0.03;
    f.uTime.value = p.time;
    f.uFlash.value = p.flash ?? 0;
    f.uFade.value = p.fade ?? 0;
    f.uCA.value = p.ca ?? 0.02;
    f.uZoom.value = p.zoom ?? 0;
    if (p.zoomCenter) f.uZoomCenter.value.copy(p.zoomCenter);
    if (p.flashCol) f.uFlashCol.value.set(p.flashCol);
    quad.material = finalMat;
    renderer.setRenderTarget(null);
    quad.render(renderer);
  }

  return { render, setSize, sceneRT, bloom };
}
