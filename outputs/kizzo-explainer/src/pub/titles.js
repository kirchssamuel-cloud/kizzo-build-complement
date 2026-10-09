// Habillage DOM de la pub : sous-titres karaoké (la majorité regarde sans le son),
// mots qui claquent pendant la bascule, « Fini les disputes. » barré, signature + appel à l'action.
import { T, VO, S, OUT } from './config.js';
import { VO_DUR } from './vo.js';
import { clamp, ease, seg, decay } from '../util.js';

const el = (cls, html = '') => {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
};

/** Groupes de mots courts (≤ 3 mots / ~18 caractères), pondérés ~ syllabes. */
function chunks(text) {
  const out = [];
  let cur = [];
  for (const w of text.split(' ')) {
    cur.push(w);
    if (cur.length >= 3 || cur.join(' ').length > 17 || /[.!?…,]$/.test(w)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  const syl = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouyàâéèêëîïôûùü]+/g) || []).length) + (/\d/.test(w) ? 1 : 0);
  return out.map((ws) => ({ words: ws, weight: ws.reduce((a, w) => a + syl(w) + (/[.!?…,]$/.test(w) ? 1.2 : 0), 0) }));
}

export function createTitles(root) {
  const show = (node, on) => (node.style.visibility = on ? 'visible' : 'hidden');

  // --- sous-titres
  const lines = VO.filter((v) => v.cap).map((v) => {
    const dur = VO_DUR[v.id];
    const cs = chunks(v.cap);
    const total = cs.reduce((a, c) => a + c.weight, 0);
    let acc = v.at;
    const items = cs.map((c) => {
      const d = (c.weight / total) * dur;
      const node = el(`cap ${v.pos}`);
      const ws = c.words.map((w, i) => {
        const s = document.createElement('span');
        s.className = 'cw' + (v.hl.includes(w) ? ' hl' : '');
        s.textContent = w;
        node.appendChild(s);
        if (i < c.words.length - 1) node.appendChild(document.createTextNode(' '));
        return s;
      });
      root.appendChild(node);
      const it = { node, ws, a: acc, b: acc + d };
      acc += d;
      return it;
    });
    items[items.length - 1].b += 0.25;
    return items;
  });

  // --- bascule : mots empilés
  const turn = el('turn');
  const words = T.turn.map((w) => {
    const d = el('tw2' + (w.hot ? ' hot' : ''), w.w);
    turn.appendChild(d);
    return { ...w, d };
  });
  root.appendChild(turn);

  // --- fin
  const fight = el('fight', `${T.outro.fight} <span class="strike">${T.outro.fightWord}<i></i></span>`);
  const strikeBar = fight.querySelector('i');
  root.appendChild(fight);
  const end = el('end', `<div class="wordmark">kizzo</div><div class="tagline"></div><div class="cta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5 12 15.5 17 10.5M5 20h14"/></svg><span>${T.outro.cta}</span></div>`);
  const tag = end.querySelector('.tagline');
  const tagWords = T.outro.tagline.split(' ').map((w, i, arr) => {
    const s = document.createElement('span');
    s.className = 'tg' + (i === arr.length - 1 ? ' accent' : '');
    s.textContent = w;
    tag.appendChild(s);
    if (i < arr.length - 1) tag.appendChild(document.createTextNode(' '));
    return s;
  });
  const word = end.querySelector('.wordmark');
  const cta = end.querySelector('.cta');
  root.appendChild(end);

  function update(t) {
    for (const items of lines) {
      for (const it of items) {
        const on = t >= it.a && t < it.b;
        show(it.node, on);
        if (!on) continue;
        const k = ease.outBack(seg(t, it.a, it.a + 0.2), 2);
        it.node.style.transform = `translate(-50%, 0) scale(${(0.85 + 0.15 * k).toFixed(3)})`;
        const n = it.ws.length;
        it.ws.forEach((w, i) => w.classList.toggle('on', t >= it.a + ((it.b - it.a) * i) / n - 0.02));
      }
    }
    // bascule
    {
      const on = t >= S.turn[0] && t < S.turn[1];
      turn.style.display = on ? 'flex' : 'none';
      if (on)
        words.forEach((w) => {
          const k = ease.outBack(seg(t, w.at, w.at + 0.28), 2.2);
          const vis = t >= w.at;
          w.d.style.visibility = vis ? 'visible' : 'hidden';
          const s = (w.hot ? 1.9 : 1.5) - (w.hot ? 0.9 : 0.5) * k;
          w.d.style.transform = `scale(${s.toFixed(3)})`;
          w.d.style.opacity = clamp(k * 1.5).toFixed(3);
          w.d.style.filter = k < 0.98 ? `blur(${((1 - k) * 10).toFixed(1)}px)` : 'none';
        });
    }
    // « Fini les disputes. »
    {
      const on = t >= OUT.fight && t < OUT.logo + 0.2;
      show(fight, on);
      if (on) {
        const k = ease.outBack(seg(t, OUT.fight, OUT.fight + 0.35), 1.8);
        const ko = ease.inCubic(seg(t, OUT.logo - 0.15, OUT.logo + 0.2));
        fight.style.opacity = (clamp(k * 1.5) * (1 - ko)).toFixed(3);
        fight.style.transform = `translate(-50%, -50%) scale(${(0.7 + 0.3 * k - ko * 0.2).toFixed(3)})`;
        strikeBar.style.transform = `scaleX(${ease.outExpo(seg(t, OUT.strike, OUT.strike + 0.35)).toFixed(3)})`;
      }
    }
    // signature
    {
      const vis = t >= OUT.word - 0.05;
      show(end, vis);
      if (vis) {
        const k = ease.outExpo(seg(t, OUT.word, OUT.word + 1.0));
        word.style.opacity = clamp(k * 1.4).toFixed(3);
        word.style.transform = `translate3d(0,${((1 - k) * 0.4).toFixed(3)}em,0) scale(${(1.1 - 0.1 * k).toFixed(3)})`;
        word.style.filter = k < 0.99 ? `blur(${((1 - k) * 10).toFixed(1)}px)` : 'none';
        word.style.backgroundPosition = `${(-40 + ease.inOutCubic(seg(t, OUT.word + 0.3, OUT.word + 1.5)) * 180).toFixed(1)}% 50%`;
        tagWords.forEach((w, i) => {
          const kk = ease.outCubic(seg(t, OUT.tagline + i * 0.08, OUT.tagline + 0.6 + i * 0.08));
          w.style.opacity = kk.toFixed(3);
          w.style.transform = `translate3d(0,${((1 - kk) * 0.5).toFixed(3)}em,0)`;
        });
        const ck = ease.outBack(seg(t, OUT.cta, OUT.cta + 0.5), 1.6);
        const beat = 1 + Math.max(0, Math.sin((t - OUT.cta - 0.6) * 5)) * 0.035 * clamp(t - OUT.cta - 0.6);
        cta.style.opacity = clamp(ck * 2).toFixed(3);
        cta.style.transform = `scale(${((0.6 + 0.4 * ck) * beat).toFixed(3)})`;
      }
    }
    void decay;
  }

  return { update };
}
