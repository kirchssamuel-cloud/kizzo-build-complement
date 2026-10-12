// Habillage du « Crash test » : HUD de caméra rapide (viseur, REC, cadence, timecode),
// phrases qui interpellent le spectateur (compteur en direct), étiquette « 1 image avant
// l'impact » qui suit la pointe, arrêt sur image (« Il ne va rien se passer. »), puis
// sous-titres du motion design (un mot ou groupe par temps).
import { T, DROP, FREEZE, START } from './config.js';
import { clamp, ease, seg } from '../util.js';

const el = (cls, html = '') => {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
};
const fr1 = (x) => x.toFixed(1).replace('.', ',');
/** Mot qui se précise (flou -> net) en montant légèrement. */
function reveal(node, k) {
  node.style.opacity = clamp(k * 1.3).toFixed(3);
  node.style.transform = `translate3d(0,${((1 - k) * 0.45).toFixed(3)}em,0)`;
  node.style.filter = k < 0.98 ? `blur(${((1 - k) * 8).toFixed(1)}px)` : 'none';
}
/** Découpe une ligne en mots ; « *texte » = accent orange, « # » = compteur. */
function words(parent, parts) {
  const out = [];
  for (const part of parts) {
    const accent = part.startsWith('*');
    const text = accent ? part.slice(1) : part;
    if (text === '#') {
      const s = document.createElement('span');
      s.className = 'w num';
      parent.appendChild(s);
      out.push(s);
      continue;
    }
    text.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) return parent.appendChild(document.createTextNode(' '));
      const s = document.createElement('span');
      s.className = 'w' + (accent ? ' accent' : '');
      s.textContent = w;
      parent.appendChild(s);
      out.push(s);
    });
  }
  return out;
}

export function createTitles(root) {
  // ---------------------------------------------------------------- HUD
  const hud = el(
    'hud',
    `<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
     <div class="hud-title"><b>${T.hud.title}</b><span>${T.hud.sub}</span></div>
     <div class="hud-rec"><i></i><span>REC</span></div>
     <div class="hud-fps"><span>${T.hud.fps}</span><span class="slow">${T.hud.slow}</span></div>
     <div class="hud-tc"></div>`
  );
  root.appendChild(hud);
  const tc = hud.querySelector('.hud-tc');
  const rec = hud.querySelector('.hud-rec i');
  const recLabel = hud.querySelector('.hud-rec span');
  const recBox = hud.querySelector('.hud-rec');
  const htitle = hud.querySelector('.hud-title');
  const slow = hud.querySelector('.slow');

  // ---------------------------------------------------------------- phrases
  const lines = T.lines.map((l) => {
    const node = el('line' + (l.small ? ' small' : '') + (l.big ? ' big' : ''));
    const a = el('la');
    const aw = words(a, [l.a]);
    node.appendChild(a);
    let bw = [];
    if (l.b) {
      const b = el('lb');
      bw = words(b, l.b);
      node.appendChild(b);
    }
    root.appendChild(node);
    return { ...l, node, aw, bw, num: node.querySelector('.num') };
  });

  // ---------------------------------------------------------------- étiquette d'impact
  const lab = el('impact', `<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="pill">${T.impactLabel}</div>`);
  root.appendChild(lab);

  // ---------------------------------------------------------------- sous-titres du motion design
  const caps = T.caps.map((c) => {
    const node = el('mcap');
    const groups = c.words.map(([txt, at]) => {
      const g = el('g');
      const ws = words(g, txt.split(/(?=\*)/));
      node.appendChild(g);
      return { at, g, ws };
    });
    root.appendChild(node);
    return { ...c, node, groups };
  });

  function update(t, anchors = {}) {
    // HUD
    // variante promo : pas d'habillage d'accroche (l'accroche est la vidéo filmée)
    const hudOn = t < DROP && START === 0;
    hud.style.display = hudOn ? 'block' : 'none';
    if (hudOn) {
      const f = Math.floor(Math.min(t, FREEZE) * 1000); // images de la caméra rapide (arrêtées au gel)
      const s = Math.floor(f / 1000);
      tc.textContent = `00:00:${String(s).padStart(2, '0')}:${String(f % 1000).padStart(3, '0')}  ·  IMG ${String(f).padStart(5, '0')}`;
      const frozen = t >= FREEZE;
      rec.style.opacity = frozen || Math.sin(t * 6) > -0.2 ? '1' : '0.15';
      recBox.classList.toggle('paused', frozen);
      recLabel.textContent = frozen ? T.hud.pause : 'REC';
      const k = ease.outCubic(seg(t, 0.05, 0.6));
      htitle.style.opacity = k.toFixed(3);
      // le titre se range dans le coin quand le ralenti commence
      const sm = ease.inOutCubic(seg(t, 1.85, 2.25));
      htitle.style.transform = `translate3d(${((1 - k) * -1).toFixed(3)}em,0,0) scale(${(1 - 0.38 * sm).toFixed(3)})`;
      slow.style.opacity = t > 1.6 && t < FREEZE ? (Math.sin(t * 9) > -0.6 ? '1' : '0.3') : '0';
    }
    // phrases (compteur en direct)
    for (const l of lines) {
      const on = t >= l.at && t < l.until && START === 0;
      l.node.style.display = on ? 'block' : 'none';
      if (!on) continue;
      const all = [...l.aw, ...l.bw];
      all.forEach((w, i) => reveal(w, ease.outCubic(seg(t, l.at + i * 0.07, l.at + i * 0.07 + 0.35))));
      if (l.num) l.num.textContent = fr1(Math.max(t, l.at));
      // sortie : la phrase se dissout juste avant la suivante / l'impact
      const out = seg(t, l.until - 0.18, l.until);
      l.node.style.opacity = (1 - out).toFixed(3);
    }
    // étiquette « 1 image avant l'impact » accrochée à la pointe
    const labOn = START === 0 && t >= 10.6 && t < DROP && anchors.tip;
    lab.style.display = labOn ? 'block' : 'none';
    if (labOn) {
      const k = ease.outBack(seg(t, 10.6, 10.95), 1.4);
      lab.style.left = (anchors.tip.x * 100).toFixed(3) + '%';
      lab.style.top = (anchors.tip.y * 100).toFixed(3) + '%';
      lab.style.transform = `translate(-50%,-50%) scale(${(1.6 - 0.6 * k).toFixed(3)})`;
      lab.style.opacity = clamp(k * 1.5).toFixed(3);
    }
    // sous-titres du motion design
    for (const c of caps) {
      const on = t >= c.at && t < c.until;
      c.node.style.display = on ? 'block' : 'none';
      if (!on) continue;
      for (const g of c.groups) g.ws.forEach((w, i) => reveal(w, ease.outCubic(seg(t, g.at + i * 0.045, g.at + i * 0.045 + 0.28))));
      const out = seg(t, c.until - 0.12, c.until);
      c.node.style.opacity = (1 - out).toFixed(3);
    }
  }

  return { update };
}
