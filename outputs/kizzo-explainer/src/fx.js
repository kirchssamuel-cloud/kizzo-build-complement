// Effets : gerbes d'étincelles, confettis 3D, anneau de progression lumineux,
// traînées de lumière, cône holographique. Tout est analytique en fonction du temps.
import * as THREE from 'three';
import { fxMaterial, setFX } from './materials.js';
import { rng, clamp, TAU } from './util.js';

// ---------------------------------------------------------------------------
// Gerbe d'étincelles (déclenchée à un instant précis)

export function createBurst({ count = 90, seed = 1, speed = 2.2, life = 1.1, size = 9, colors = ['#FFFFFF', '#F97316', '#3DB5DA'], spread = 1, up = 0.4, drag = 2.6, gravity = 1.2 } = {}) {
  const r = rng(seed);
  const dir = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);
  const col = new Float32Array(count * 3);
  const c = colors.map((h) => new THREE.Color(h));
  for (let i = 0; i < count; i++) {
    const th = r() * TAU, ph = Math.acos(2 * r() - 1);
    let x = Math.sin(ph) * Math.cos(th), y = Math.sin(ph) * Math.sin(th) + up, z = Math.cos(ph) * spread;
    const l = Math.hypot(x, y, z);
    dir.set([x / l, y / l, z / l], i * 3);
    data.set([speed * (0.35 + r() * 0.85), life * (0.55 + r() * 0.6), size * (0.4 + r()), r()], i * 4);
    const cc = c[(r() * c.length) | 0];
    col.set([cc.r, cc.g, cc.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  const mat = fxMaterial({
    uniforms: { uAge: { value: -1 }, uDrag: { value: drag }, uGrav: { value: gravity }, uPx: { value: 1 }, uIntensity: { value: 2.2 } },
    vertex: /* glsl */ `
      attribute vec3 aDir; attribute vec4 aData; attribute vec3 aCol;
      uniform float uAge; uniform float uDrag; uniform float uGrav; uniform float uPx;
      varying vec3 vCol; varying float vA; varying float vViewZ;
      void main() {
        float age = uAge;
        float life = aData.y;
        float k = clamp(age / life, 0.0, 1.0);
        vec3 p = aDir * aData.x * (1.0 - exp(-uDrag * age)) / uDrag;
        p.y -= 0.5 * uGrav * age * age;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vViewZ = mv.z;
        gl_Position = projectionMatrix * mv;
        float tw = 0.7 + 0.3 * sin(age * 40.0 + aData.w * 60.0);
        vA = (age < 0.0 || age > life) ? 0.0 : pow(1.0 - k, 1.6) * tw;
        gl_PointSize = aData.z * (1.0 - k * 0.6) * uPx * (4.0 / max(0.5, -mv.z));
        vCol = aCol;
      }
    `,
    fragment: /* glsl */ `
      uniform float uIntensity;
      varying vec3 vCol; varying float vA; varying float vViewZ;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = pow(max(1.0 - r, 0.0), 2.2) * vA * fxDepthFade(vViewZ, 0.2);
        if (a < 0.002) discard;
        gl_FragColor = vec4((vCol + 0.35) * a * uIntensity, 1.0);
      }
    `,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  setFX(pts);
  return {
    object: pts,
    set(age) {
      mat.uniforms.uAge.value = age;
      pts.visible = age > -0.01 && age < life * 1.2;
    },
    mat,
  };
}

// ---------------------------------------------------------------------------
// Confettis 3D (instanciés, éclairés, avec ombres)

export function createConfetti(count = 150, seed = 9) {
  const geo = new THREE.PlaneGeometry(0.055, 0.1);
  const mat = new THREE.MeshPhysicalMaterial({ side: THREE.DoubleSide, roughness: 0.35, metalness: 0.25, clearcoat: 0.6 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = false;
  const palette = ['#F97316', '#3DB5DA', '#FFFFFF', '#FAB43B', '#7FD3EC', '#FF9D5C'].map((h) => new THREE.Color(h));
  const r = rng(seed);
  const P = [];
  for (let i = 0; i < count; i++) {
    const th = r() * TAU;
    const el = 0.15 + r() * 1.1;
    const sp = 2.2 + r() * 3.2;
    P.push({
      v: new THREE.Vector3(Math.cos(th) * Math.cos(el) * sp, Math.sin(el) * sp * 0.9 + 0.8, Math.sin(th) * Math.cos(el) * sp * 0.55 + 0.6),
      axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      spin: 6 + r() * 12,
      phase: r() * TAU,
      scale: 0.7 + r() * 0.7,
      flutter: 0.5 + r(),
    });
    mesh.setColorAt(i, palette[(r() * palette.length) | 0]);
  }
  mesh.instanceColor.needsUpdate = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const drag = 1.6, grav = 2.4;
  function set(age, origin) {
    mesh.visible = age > 0 && age < 4.5;
    if (!mesh.visible) return;
    for (let i = 0; i < count; i++) {
      const o = P[i];
      const f = (1 - Math.exp(-drag * age)) / drag;
      p.copy(o.v).multiplyScalar(f).add(origin);
      // vitesse terminale + flottement
      p.y -= grav * (age - f) * 0.55;
      p.x += Math.sin(age * 3 * o.flutter + o.phase) * 0.08 * Math.min(1, age);
      q.setFromAxisAngle(o.axis, o.phase + age * o.spin);
      const fade = clamp((4.2 - age) / 1.2);
      s.setScalar(o.scale * fade * clamp(age * 8));
      m4.compose(p, q, s);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { object: mesh, set };
}

// ---------------------------------------------------------------------------
// Anneau de progression (piste chromée + remplissage émissif segmenté)

export function createProgressRing(radius = 1.1) {
  const group = new THREE.Group();
  const track = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.012, 16, 256),
    new THREE.MeshPhysicalMaterial({ color: '#C9D3E0', metalness: 1, roughness: 0.18, envMapIntensity: 1.4 })
  );
  group.add(track);
  const fillMat = new THREE.ShaderMaterial({
    uniforms: {
      uFill: { value: 0 },
      uIntensity: { value: 3.0 },
      uFlash: { value: 0 },
      uA: { value: new THREE.Color('#3DB5DA') },
      uB: { value: new THREE.Color('#F97316') },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main() {
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFill, uIntensity, uFlash, uTime; uniform vec3 uA, uB;
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main() {
        // angle depuis le haut, sens horaire
        float a = atan(vP.x, vP.y);
        float u = fract(a / 6.28318 + 1.0);
        if (u > uFill) discard;
        float seg = fract(u * 3.0);
        float gap = 0.012;
        if (uFill < 0.999 && (seg < gap || seg > 1.0 - gap)) discard;
        vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, u));
        float head = exp(-pow((uFill - u) * 40.0, 2.0)) * (uFill < 0.999 ? 1.0 : 0.0);
        float fres = 0.6 + 0.4 * pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
        float shimmer = 0.85 + 0.15 * sin(u * 60.0 - uTime * 6.0);
        vec3 c = col * uIntensity * fres * shimmer + vec3(1.0, 0.95, 0.9) * head * 6.0 + col * uFlash * 6.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const fill = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.026, 16, 256), fillMat);
  group.add(fill);
  // graduations
  const tickGeo = new THREE.BoxGeometry(0.008, 0.05, 0.008);
  const tickMat = new THREE.MeshPhysicalMaterial({ color: '#E2E8F0', metalness: 1, roughness: 0.3 });
  const ticks = new THREE.InstancedMesh(tickGeo, tickMat, 60);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const rr = radius + 0.075;
    m.makeRotationZ(-a);
    m.setPosition(Math.sin(a) * rr, Math.cos(a) * rr, 0);
    if (i % 5) m.scale(new THREE.Vector3(1, 0.5, 1));
    ticks.setMatrixAt(i, m);
  }
  group.add(ticks);
  return { group, fillMat, track, ticks };
}

// ---------------------------------------------------------------------------
// Traînée lumineuse le long d'une courbe

export function createTrail(curve, { color = '#3DB5DA', color2 = '#FFFFFF', radius = 0.011, tail = 0.35 } = {}) {
  const geo = new THREE.TubeGeometry(curve, 220, radius, 10, false);
  const mat = fxMaterial({
    uniforms: {
      uHead: { value: -1 },
      uTail: { value: tail },
      uPersist: { value: 0 },
      uIntensity: { value: 3.2 },
      uA: { value: new THREE.Color(color) },
      uB: { value: new THREE.Color(color2) },
      uFlow: { value: 0 },
    },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewZ = mv.z; vV = -mv.xyz; vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment: /* glsl */ `
      uniform float uHead, uTail, uPersist, uIntensity, uFlow; uniform vec3 uA, uB;
      varying vec2 vUv; varying float vViewZ; varying vec3 vN; varying vec3 vV;
      void main() {
        float u = vUv.x;
        float body = smoothstep(uHead - uTail, uHead, u) * step(u, uHead);
        float headGlow = exp(-pow((uHead - u) * 55.0, 2.0));
        float pulses = pow(0.5 + 0.5 * sin((u * 9.0 - uFlow) * 6.28318), 8.0);
        float persist = uPersist * (0.22 + 0.8 * pulses) * step(u, uHead);
        float core = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
        vec3 col = mix(uA, uB, headGlow * 0.8);
        float a = (body * 0.9 + headGlow * 2.5 + persist) * (0.35 + 0.65 * core);
        a *= fxDepthFade(vViewZ, 0.15);
        gl_FragColor = vec4(col * a * uIntensity, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  setFX(mesh);
  return { mesh, mat, curve };
}

// ---------------------------------------------------------------------------
// Cône holographique (le téléphone "projette" le quiz)

export function createHoloCone() {
  const geo = new THREE.CylinderGeometry(1.05, 0.34, 2.2, 64, 1, true);
  geo.translate(0, 1.1, 0);
  const mat = fxMaterial({
    uniforms: { uIntensity: { value: 0 }, uColor: { value: new THREE.Color('#5FC6E6') }, uT: { value: 0 } },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewZ = mv.z; vV = -mv.xyz; vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment: /* glsl */ `
      uniform float uIntensity, uT; uniform vec3 uColor;
      varying vec2 vUv; varying float vViewZ; varying vec3 vN; varying vec3 vV;
      void main() {
        float facing = abs(dot(normalize(vN), normalize(vV)));
        float edge = pow(1.0 - facing, 1.5) * 0.6 + pow(facing, 3.0) * 0.25;
        float h = vUv.y;
        float fall = pow(1.0 - h, 1.3);
        float lines = 0.75 + 0.25 * smoothstep(0.4, 0.5, fract(h * 26.0 - uT * 1.2));
        float a = edge * fall * lines * uIntensity * fxDepthFade(vViewZ, 0.3);
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  setFX(mesh);
  return { mesh, mat };
}
