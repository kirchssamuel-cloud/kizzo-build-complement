// Typographie cinétique (DOM, ultra nette) pilotée image par image par la timeline.
import { T, TL } from './config.js';
import { clamp, ease, seg } from './util.js';

function splitChars(el, text, cls = '') {
  const words = text.split(' ');
  const chars = [];
  words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'tw';
    for (const ch of w) {
      const s = document.createElement('span');
      s.className = 'tc ' + cls;
      s.textContent = ch;
      word.appendChild(s);
      chars.push(s);
    }
    el.appendChild(word);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

function makeTitle(root, lines, cls) {
  const el = document.createElement('div');
  el.className = 'title ' + cls;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  el.appendChild(scrim);
  const chars = [];
  lines.forEach((line, i) => {
    const l = document.createElement('div');
    l.className = 'tl' + (i === lines.length - 1 ? ' accent' : '');
    chars.push(...splitChars(l, line));
    el.appendChild(l);
  });
  root.appendChild(el);
  return { el, chars, scrim };
}

export function createTitles(root) {
  const items = [];

  // Titres principaux (haut de cadre)
  const defs = [
    { lines: T.t1, win: TL.title1, cls: 't-top' },
    { lines: T.t2, win: TL.title2, cls: 't-top' },
    { lines: T.t3, win: TL.title3, cls: 't-top' },
    { lines: T.t4, win: TL.title4, cls: 't-top' },
  ];
  for (const d of defs) items.push({ kind: 'title', ...d, ...makeTitle(root, d.lines, d.cls) });

  // "+15" : ligne d'impact sous le chiffre 3D
  const burst = document.createElement('div');
  burst.className = 'burst';
  const burstChars = splitChars(burst, T.burst);
  const bar = document.createElement('div');
  bar.className = 'burst-bar';
  burst.appendChild(bar);
  root.appendChild(burst);
  items.push({ kind: 'burst', el: burst, chars: burstChars, bar, win: TL.burstText });

  // Signature finale
  const sig = document.createElement('div');
  sig.className = 'sig';
  const word = document.createElement('div');
  word.className = 'wordmark';
  word.textContent = 'kizzo';
  const tag = document.createElement('div');
  tag.className = 'tagline';
  const tagWords = T.tagline.split(' ').map((w, i, arr) => {
    const s = document.createElement('span');
    s.className = 'tg' + (i === arr.length - 1 ? ' accent' : '');
    s.textContent = w;
    tag.appendChild(s);
    if (i < arr.length - 1) tag.appendChild(document.createTextNode(' '));
    return s;
  });
  sig.append(word, tag);
  root.appendChild(sig);

  function animTitle(it, t) {
    const [a, b] = it.win;
    const vis = t > a - 0.05 && t < b + 0.05;
    it.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    const life = seg(t, a, b);
    it.el.style.transform = `translate3d(-50%,0,0) scale(${1 + life * 0.045})`;
    it.scrim.style.opacity = (ease.outCubic(seg(t, a, a + 0.5)) * (1 - ease.inCubic(seg(t, b - 0.45, b - 0.05)))).toFixed(3);
    const n = it.chars.length;
    it.chars.forEach((c, i) => {
      const kin = ease.outExpo(seg(t, a + i * 0.024, a + i * 0.024 + 0.75));
      const kout = ease.inCubic(seg(t, b - 0.42 + i * 0.008, b - 0.06 + i * 0.008));
      const o = kin * (1 - kout);
      const y = (1 - kin) * 0.62 - kout * 0.35;
      const rx = (1 - kin) * -82 + kout * 40;
      const blur = (1 - kin) * 9 + kout * 7;
      c.style.opacity = o.toFixed(3);
      c.style.transform = `translate3d(0,${y.toFixed(3)}em,0) rotateX(${rx.toFixed(1)}deg)`;
      c.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    });
    void n;
  }

  function animBurst(it, t, anchor) {
    const [a, b] = it.win;
    const vis = t > a - 0.05 && t < b + 0.05;
    it.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    if (anchor) {
      it.el.style.left = anchor.x + '%';
      it.el.style.top = anchor.y + '%';
    }
    const n = it.chars.length;
    const life = seg(t, a, b);
    const track = 0.55 - ease.outExpo(seg(t, a, a + 0.9)) * 0.4 + life * 0.04;
    it.el.style.letterSpacing = track.toFixed(3) + 'em';
    it.chars.forEach((c, i) => {
      const fromCenter = Math.abs(i - (n - 1) / 2) / n;
      const st = a + fromCenter * 0.28;
      const kin = ease.outExpo(seg(t, st, st + 0.5));
      const kout = ease.inCubic(seg(t, b - 0.4 + fromCenter * 0.1, b - 0.05 + fromCenter * 0.1));
      const s = 1 + (1 - kin) * 1.6 + kout * 0.4;
      c.style.opacity = (kin * (1 - kout)).toFixed(3);
      c.style.transform = `scale(${s.toFixed(3)}) translate3d(0,${(-kout * 0.4).toFixed(3)}em,0)`;
      const blur = (1 - kin) * 14 + kout * 10;
      c.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    });
    const bk = ease.outExpo(seg(t, a + 0.25, a + 1.0)) * (1 - ease.inCubic(seg(t, b - 0.4, b - 0.05)));
    it.bar.style.transform = `translateX(-50%) scaleX(${bk.toFixed(3)})`;
  }

  function animSig(t, anchor) {
    const a = TL.wordmark;
    const vis = t > a - 0.05;
    sig.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    if (anchor) {
      sig.style.left = anchor.x + '%';
      sig.style.top = anchor.y + '%';
    }
    const k = ease.outExpo(seg(t, a, a + 1.1));
    word.style.opacity = clamp(k * 1.4).toFixed(3);
    word.style.transform = `translate3d(0,${((1 - k) * 0.45).toFixed(3)}em,0) scale(${(1.12 - 0.12 * k + seg(t, a, 30) * 0.03).toFixed(4)})`;
    word.style.letterSpacing = (0.16 - 0.2 * k).toFixed(3) + 'em';
    word.style.filter = k < 0.995 ? `blur(${((1 - k) * 12).toFixed(2)}px)` : 'none';
    // reflet lumineux qui traverse le mot
    const sweep = -40 + ease.inOutCubic(seg(t, a + 0.35, a + 1.6)) * 180;
    word.style.backgroundPosition = `${sweep.toFixed(1)}% 50%`;
    tagWords.forEach((w, i) => {
      const st = TL.tagline + i * 0.09;
      const kk = ease.outCubic(seg(t, st, st + 0.7));
      w.style.opacity = kk.toFixed(3);
      w.style.transform = `translate3d(0,${((1 - kk) * 0.6).toFixed(3)}em,0)`;
      w.style.filter = kk < 0.99 ? `blur(${((1 - kk) * 6).toFixed(2)}px)` : 'none';
    });
  }

  return {
    update(t, anchors = {}) {
      for (const it of items) {
        if (it.kind === 'title') animTitle(it, t);
        else if (it.kind === 'burst') animBurst(it, t, anchors.burst);
      }
      animSig(t, anchors.sig);
    },
  };
}
