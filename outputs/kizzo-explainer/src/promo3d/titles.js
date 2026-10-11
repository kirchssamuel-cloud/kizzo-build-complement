// Habillage DOM de la promo 3D : nom, signature et bouton « Télécharger Kizzo » (texte net).
import { E, T } from './config.js';
import { clamp, ease, seg, springT } from '../util.js';

const el = (cls, html = '') => {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
};

export function createTitles(root) {
  const end = el(
    'p3-end',
    `<div class="p3-word">kizzo</div><div class="p3-tag">${T.tagline}</div>
     <div class="p3-cta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5 12 15.5 17 10.5M5 20h14"/></svg><span>${T.cta}</span></div>`
  );
  root.appendChild(end);
  const word = end.querySelector('.p3-word');
  const tag = end.querySelector('.p3-tag');
  const cta = end.querySelector('.p3-cta');
  const sp = (dt, s, d) => Math.min(1.05, Math.max(0, springT(dt, { stiffness: s, damping: d })));

  function update(t) {
    const on = t >= E.word - 0.05;
    end.style.display = on ? 'block' : 'none';
    if (!on) return;
    const kw = sp(t - E.word, 300, 26);
    word.style.opacity = clamp(kw * 1.6).toFixed(3);
    word.style.transform = `translate3d(0,${((1 - kw) * 0.35).toFixed(3)}em,0) scale(${(1.25 - 0.25 * kw).toFixed(3)})`;
    const kt = ease.outCubic(seg(t, E.word + 0.25, E.word + 0.75));
    tag.style.opacity = kt.toFixed(3);
    tag.style.transform = `translate3d(0,${((1 - kt) * 0.6).toFixed(3)}em,0)`;
    const kc = sp(t - E.cta, 320, 24);
    const press = t >= E.tapCta ? 1 - 0.07 * Math.max(0, Math.sin(clamp((t - E.tapCta) / 0.22) * Math.PI)) : 1;
    const beat = 1 + 0.03 * Math.max(0, Math.sin((t - E.cta) * Math.PI * 2)) * clamp(t - E.cta - 0.4);
    cta.style.opacity = clamp(kc * 2).toFixed(3);
    cta.style.transform = `scale(${((0.6 + 0.4 * kc) * press * beat).toFixed(3)})`;
  }
  return { update };
}
