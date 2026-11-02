import {AMBER, CX, CY, E, INK, PAPER, hash, lerp, mixHex, seg, spring} from './lib';

export const COLS = 8;
export const ROWS = 4;
export const CELL = 200;
export const TILE = 160;
export const PERSPECTIVE = 1800;
const DEEP = '#3a2412';

type Shape = {w: number; h: number; r: [number, number, number, number]};
const SQ: Shape = {w: 112, h: 112, r: [0, 0, 0, 0]};
const CI: Shape = {w: 132, h: 132, r: [66, 66, 66, 66]};
const HD: Shape = {w: 140, h: 70, r: [70, 70, 0, 0]};
const QD: Shape = {w: 120, h: 120, r: [120, 0, 0, 0]};
const PI: Shape = {w: 140, h: 56, r: [28, 28, 28, 28]};
const DT: Shape = {w: 44, h: 44, r: [22, 22, 22, 22]};
const SEQS: Shape[][] = [
  [CI, HD, QD],
  [SQ, CI, PI],
  [HD, QD, CI],
  [QD, SQ, DT],
];

export const tiles = Array.from({length: COLS * ROWS}, (_, k) => {
  const c = k % COLS;
  const r = Math.floor(k / COLS);
  return {k, c, r, x: CX + (c - (COLS - 1) / 2) * CELL, y: CY + (r - (ROWS - 1) / 2) * CELL, d: Math.hypot(c - 3.5, (r - 1.5) * 1.3)};
});

// Camera of the 3D world — also used by the particle scene to project block tops to screen space.
export const geoCam = (t: number) => ({
  zoom: seg(t, 4.0, 8.2, 1.04, 0.8, E.inOut),
  tiltX: seg(t, 5.9, 6.9, 0, 56, E.inOut),
  rotZ: seg(t, 4.0, 8.3, 7, -36, E.inOut),
});

const BEATS = [6.0, 6.5, 7.0, 7.5];
export const blockHeight = (t: number, k: number, c: number) => {
  let h = 0;
  let prev = 0;
  BEATS.forEach((tb, j) => {
    const target = 50 + 210 * hash(k * 13 + j * 7 + 1);
    h += (target - prev) * spring(t, tb + c * 0.025, 2.1, 0.5);
    prev = target;
  });
  return Math.max(0.6, h * (1 - seg(t, 7.92, 8.18, 0, 1, E.in)));
};

// Project a world point (relative to the stage, z up) to the screen exactly like the CSS 3D stage does.
export const project = (t: number, x: number, y: number, z: number) => {
  const {zoom, tiltX, rotZ} = geoCam(t);
  const a = (rotZ * Math.PI) / 180;
  const b = (tiltX * Math.PI) / 180;
  let px = x - CX;
  let py = y - CY;
  const rx = px * Math.cos(a) - py * Math.sin(a);
  const ry = px * Math.sin(a) + py * Math.cos(a);
  const y2 = ry * Math.cos(b) - z * Math.sin(b);
  const z2 = ry * Math.sin(b) + z * Math.cos(b);
  px = rx * zoom;
  py = y2 * zoom;
  const s = PERSPECTIVE / (PERSPECTIVE - z2 * zoom);
  return {x: CX + px * s, y: CY + py * s};
};

const mixShape = (a: Shape, b: Shape, p: number): Shape => ({
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  r: a.r.map((v, i) => Math.max(0, lerp(v, b.r[i], p))) as Shape['r'],
});

// 4–8 s — amber flood on the drop, a grid of shapes morphing on the beat, then the plane tilts into lit 3D blocks.
export const Geo: React.FC<{t: number}> = ({t}) => {
  const flood = seg(t, 4.0, 4.36, 0, 1180, E.out);
  const ring = seg(t, 4.0, 4.5, 0, 1, E.out);
  const {zoom, tiltX, rotZ} = geoCam(t);

  // Impact shake on the drop: damped oscillation, gone within half a second.
  const tau = t - 4.0;
  const shake = tau > 0 ? 14 * Math.exp(-9 * tau) * Math.sin(tau * 70) : 0;

  // Light orbits the stage; side faces are shaded with a real Lambert term.
  const az = (seg(t, 5.9, 8.2, 215, 320, E.inOut) * Math.PI) / 180;
  const el = (38 * Math.PI) / 180;
  const L = {x: Math.cos(el) * Math.cos(az), y: Math.cos(el) * Math.sin(az)};
  const shade = (nx: number, ny: number) => mixHex(DEEP, AMBER, 0.25 + 0.75 * Math.max(0, nx * L.x + ny * L.y));

  const spot = seg(t, 5.9, 7.0, 0, 1, E.inOut);
  const out = seg(t, 7.95, 8.35, 0, 1, E.in);
  const rIn = lerp(3200, 0, spot);
  const rMid = lerp(3300, 520, spot) * (1 - out);
  const rOut = lerp(3400, 1500, spot) * (1 - out) + 1;
  const floorBg = `radial-gradient(circle at 50% 50%, ${AMBER} ${rIn}px, #7a4b1c ${rMid}px, ${INK} ${rOut}px)`;

  return (
    <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        clipPath: t < 4.37 ? `circle(${flood}px at 50% 50%)` : undefined,
        perspective: PERSPECTIVE,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `translate(${shake}px, ${shake * 0.6}px) scale(${zoom}) rotateX(${tiltX}deg) rotateZ(${rotZ}deg)`,
        }}
      >
        <div style={{position: 'absolute', left: -2040, top: -2460, width: 6000, height: 6000, background: floorBg}} />

        {tiles.map(({k, c, r, x, y, d}) => {
          const seq = SEQS[(c + 2 * r) % 4];
          const m1 = spring(t, 5.0 + d * 0.03, 2.4, 0.6);
          const m2 = spring(t, 5.5 + d * 0.03, 2.4, 0.6);
          const s = mixShape(mixShape(seq[0], seq[1], m1), seq[2], m2);
          const pop = spring(t, 4.12 + d * 0.035, 2.6, 0.5);
          const rot = ((c + r) % 2 === 0 ? 1 : -1) * 90 * (m1 + m2);
          const h = blockHeight(t, k, c);
          const faces = [
            {key: 'f', w: TILE, h, tr: `translate3d(0px, ${TILE}px, ${h}px) rotateX(-90deg)`, bg: shade(0, 1)},
            {key: 'b', w: TILE, h, tr: `rotateX(90deg)`, bg: shade(0, -1)},
            {key: 'l', w: h, h: TILE, tr: `rotateY(-90deg)`, bg: shade(-1, 0)},
            {key: 'r', w: h, h: TILE, tr: `translate3d(${TILE}px, 0px, ${h}px) rotateY(90deg)`, bg: shade(1, 0)},
          ];
          const lift = seg(t, 5.9, 6.4, 0, 1, E.out);
          return (
            <div key={k} style={{position: 'absolute', left: x - TILE / 2, top: y - TILE / 2, width: TILE, height: TILE, transformStyle: 'preserve-3d'}}>
              {lift > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(8,6,4,0.55)',
                    filter: 'blur(14px)',
                    transform: `translate3d(${-L.x * h * 0.7}px, ${-L.y * h * 0.7}px, 0.3px) scale(${1 + h / 900})`,
                    opacity: lift * (1 - out),
                  }}
                />
              ) : null}
              {lift > 0
                ? faces.map((f) => (
                    <div
                      key={f.key}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: f.w,
                        height: f.h,
                        transformOrigin: '0 0',
                        transform: f.tr,
                        background: f.bg,
                        backfaceVisibility: 'hidden',
                      }}
                    />
                  ))
                : null}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translateZ(${h}px)`,
                  background: lift > 0 ? mixHex('#f0b768', AMBER, 1 - lift * 0.6) : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div
                  style={{
                    width: s.w,
                    height: s.h,
                    borderRadius: `${s.r[0]}px ${s.r[1]}px ${s.r[2]}px ${s.r[3]}px`,
                    background: INK,
                    transform: `scale(${pop}) rotate(${rot}deg)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {ring < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: CX - flood * 1.04,
            top: CY - flood * 1.04,
            width: flood * 2.08,
            height: flood * 2.08,
            borderRadius: '50%',
            border: `${4 * (1 - ring)}px solid ${PAPER}`,
            opacity: 1 - ring,
            boxSizing: 'border-box',
          }}
        />
      ) : null}
    </>
  );
};
