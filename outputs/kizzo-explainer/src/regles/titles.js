// Typographie du film « Les règles du jeu » : titres à lignes décalées, étiquettes
// reliées aux objets 3D (callouts) et signature avec l'adresse du site.
import { T, S, TITLES } from './config.js';
import { clamp, ease, seg } from '../util.js';

function splitChars(el, text) {
  const chars = [];
  text.split(' ').forEach((w, wi, arr) => {
    const word = document.createElement('span');
    word.className = 'tw';
    for (const ch of w) {
      const s = document.createElement('span');
      s.className = 'tc';
      s.textContent = ch;
      word.appendChild(s);
      chars.push(s);
    }
    el.appendChild(word);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

function makeTitle(root, lines) {
  const el = document.createElement('div');
  el.className = 'title t-top';
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  el.appendChild(scrim);
  const rows = lines.map((line, i) => {
    const l = document.createElement('div');
    l.className = 'tl' + (i === lines.length - 1 ? ' accent' : '');
    const chars = splitChars(l, line);
    el.appendChild(l);
    return chars;
  });
  root.appendChild(el);
  return { el, rows, scrim };
}

function makeCallout(root, text) {
  const el = document.createElement('div');
  el.className = 'callout';
  el.innerHTML = '<i class="co-dot"></i><i class="co-line"></i><span class="co-label"></span>';
  el.querySelector('.co-label').textContent = text;
  root.appendChild(el);
  return { el, dot: el.children[0], line: el.children[1], label: el.children[2] };
}

export function createTitles(root) {
  const titles = [
    { ...TITLES.hook, lines: T.titles.hook },
    { ...TITLES.rules0, lines: T.titles.rules0 },
    { ...TITLES.freq, lines: T.titles.freq },
    { ...TITLES.rules, lines: T.titles.rules },
    { ...TITLES.kid, lines: T.titles.kid },
    { ...TITLES.reward, lines: T.titles.reward },
  ].map((d) => ({ ...d, ...makeTitle(root, d.lines) }));

  const callouts = [
    { key: 'unlock', text: T.callouts.unlock, win: [S.toggle.flip + 0.05, S.toggle.back - 0.05] },
    { key: 'freq', text: T.callouts.freq, win: [S.chips.tap + 0.15, S.chips.back - 0.05] },
    { key: 'perQuiz', text: T.callouts.perQuiz, win: [S.coins.steps[1] + 0.15, S.coins.back - 0.05] },
  ].map((d) => ({ ...d, ...makeCallout(root, d.text) }));

  // signature
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
  const url = document.createElement('div');
  url.className = 'url';
  url.textContent = T.url;
  sig.append(word, tag, url);
  root.appendChild(sig);

  function animTitle(it, t) {
    const [a, b] = it.win;
    const vis = t > a - 0.05 && t < b + 0.05;
    it.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    it.el.style.transform = `translate3d(-50%,0,0) scale(${1 + seg(t, a, b) * 0.035})`;
    it.scrim.style.opacity = (ease.outCubic(seg(t, a, a + 0.5)) * (1 - ease.inCubic(seg(t, b - 0.45, b - 0.05)))).toFixed(3);
    // chaque ligne peut avoir son propre départ (titre d'accroche en deux temps)
    it.rows.forEach((chars, li) => {
      const a0 = it.starts?.[li] ?? a + li * 0.12;
      chars.forEach((c, i) => {
        const kin = ease.outExpo(seg(t, a0 + i * 0.022, a0 + i * 0.022 + 0.7));
        const kout = ease.inCubic(seg(t, b - 0.4 + i * 0.006, b - 0.06 + i * 0.006));
        // entrée par la gauche (masque vertical) : différent du premier film
        const x = (1 - kin) * -0.5 + kout * 0.35;
        const sk = (1 - kin) * 14;
        const blur = (1 - kin) * 8 + kout * 7;
        c.style.opacity = (kin * (1 - kout)).toFixed(3);
        c.style.transform = `translate3d(${x.toFixed(3)}em,0,0) skewX(${(-sk).toFixed(1)}deg)`;
        c.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      });
    });
  }

  function animCallout(it, t, anchor) {
    const [a, b] = it.win;
    const vis = t > a && t < b && anchor;
    it.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    it.el.style.left = anchor.x + '%';
    it.el.style.top = anchor.y + '%';
    const kin = ease.outExpo(seg(t, a, a + 0.6));
    const kout = ease.inCubic(seg(t, b - 0.3, b));
    it.dot.style.transform = `translate(-50%,-50%) scale(${(ease.outBack(seg(t, a, a + 0.35)) * (1 - kout)).toFixed(3)})`;
    it.line.style.transform = `scaleY(${(clamp(kin * 1.4) * (1 - kout)).toFixed(3)})`;
    const lk = ease.outExpo(seg(t, a + 0.15, a + 0.75));
    it.label.style.opacity = (lk * (1 - kout)).toFixed(3);
    it.label.style.transform = `translate(-50%, ${((1 - lk) * 0.6).toFixed(3)}em)`;
    it.label.style.filter = lk < 0.99 ? `blur(${((1 - lk) * 6).toFixed(2)}px)` : 'none';
  }

  function animSig(t) {
    const a = S.wordmark;
    const vis = t > a - 0.05;
    sig.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    const k = ease.outExpo(seg(t, a, a + 1.1));
    word.style.opacity = clamp(k * 1.4).toFixed(3);
    word.style.transform = `translate3d(0,${((1 - k) * 0.45).toFixed(3)}em,0) scale(${(1.12 - 0.12 * k + seg(t, a, a + 3) * 0.03).toFixed(4)})`;
    word.style.letterSpacing = (0.16 - 0.2 * k).toFixed(3) + 'em';
    word.style.filter = k < 0.995 ? `blur(${((1 - k) * 12).toFixed(2)}px)` : 'none';
    word.style.backgroundPosition = `${(-40 + ease.inOutCubic(seg(t, a + 0.35, a + 1.6)) * 180).toFixed(1)}% 50%`;
    tagWords.forEach((w, i) => {
      const st = S.tagline + i * 0.09;
      const kk = ease.outCubic(seg(t, st, st + 0.7));
      w.style.opacity = kk.toFixed(3);
      w.style.transform = `translate3d(0,${((1 - kk) * 0.6).toFixed(3)}em,0)`;
      w.style.filter = kk < 0.99 ? `blur(${((1 - kk) * 6).toFixed(2)}px)` : 'none';
    });
    const uk = ease.outBack(seg(t, S.cta, S.cta + 0.6));
    url.style.opacity = clamp(uk).toFixed(3);
    url.style.transform = `scale(${(0.7 + 0.3 * uk).toFixed(3)})`;
  }

  return {
    update(t, anchors = {}) {
      for (const it of titles) animTitle(it, t);
      for (const it of callouts) animCallout(it, t, anchors[it.key]);
      animSig(t);
    },
  };
}
