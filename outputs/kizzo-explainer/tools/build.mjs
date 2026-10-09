// Build : un seul fichier HTML autonome (Three.js + code + polices embarqués),
// lisible hors-ligne par double-clic. Produit aussi une variante "artifact".
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { LOGO } from '../src/logo-shape.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);

const fonts = [
  ['Outfit', 500, 'outfit'],
  ['Outfit', 600, 'outfit'],
  ['Outfit', 700, 'outfit'],
  ['Outfit', 800, 'outfit'],
  // polices réelles des apps Kizzo (Plus Jakarta Sans pour le texte, Space Grotesk pour les chiffres)
  ['Plus Jakarta Sans', 500, 'plus-jakarta-sans'],
  ['Plus Jakarta Sans', 600, 'plus-jakarta-sans'],
  ['Plus Jakarta Sans', 700, 'plus-jakarta-sans'],
  ['Plus Jakarta Sans', 800, 'plus-jakarta-sans'],
  ['Space Grotesk', 700, 'space-grotesk'],
  // écriture manuscrite pour la page de cahier scannée
  ['Caveat', 600, 'caveat'],
  ['Caveat', 700, 'caveat'],
];
const fontCss = fonts
  .map(([fam, w, pkg]) => {
    const file = r(`node_modules/@fontsource/${pkg}/files/${pkg}-latin-${w}-normal.woff2`);
    const b64 = fs.readFileSync(file).toString('base64');
    return `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
  })
  .join('\n');

const P = (x, y) => `${x.toFixed(4)} ${(-y).toFixed(4)}`;
const logoSvg =
  `<path fill="#3DB5DA" d="M${LOGO.body.map(([x, y]) => P(x, y)).join('L')}Z"/>` +
  `<circle fill="#3DB5DA" cx="${LOGO.head.c[0]}" cy="${-LOGO.head.c[1]}" r="${LOGO.head.r}"/>` +
  `<circle fill="#F97316" cx="${LOGO.child.c[0]}" cy="${-LOGO.child.c[1]}" r="${LOGO.child.r}"/>`;

const strip = (s) =>
  s
    .replace(/<!--HEAD_START-->[\s\S]*?<!--HEAD_END-->\n?/, '')
    .replace(/<!--HEAD_CLOSE-->[\s\S]*?<!--BODY_OPEN-->\n?/, '')
    .replace(/<!--BODY_CLOSE-->[\s\S]*?<!--DOC_END-->\n?/, '');
const clean = (s) => s.replace(/<!--(HEAD_START|HEAD_END|HEAD_CLOSE|BODY_OPEN|BODY_CLOSE|DOC_END)-->/g, '');
const kb = (f) => (fs.statSync(r(f)).size / 1024).toFixed(0) + ' Ko';

// Films : même lecteur, mêmes polices ; mise en scène, titre et CSS propres à chacun.
const FILMS = {
  explainer: {
    entry: 'src/main.js',
    out: 'kizzo-explainer-fr.html',
    title: 'Kizzo Film Explicatif',
    description: "Kizzo — film explicatif 3D (1080×1920, 60 fps) : le parent scanne les leçons, l'enfant gagne son temps d'écran en apprenant.",
    aria: 'Kizzo — film explicatif 3D',
  },
  regles: {
    entry: 'src/regles/main.js',
    out: 'kizzo-regles-fr.html',
    title: 'Kizzo Règles du Jeu',
    description: "Kizzo — film 3D carré (1080×1080, 60 fps) : les parents règlent les quiz, l'enfant gagne son temps d'écran en apprenant.",
    aria: 'Kizzo — les règles du jeu, film 3D',
    css: 'src/regles/film.css',
  },
  pub: {
    entry: 'src/pub/main.js',
    out: 'kizzo-pub-fr.html',
    title: 'Kizzo Pub 23h47',
    description: "Kizzo — pub 9:16 (1080×1920, 60 fps) au format natif réseaux : la dispute du soir autour du téléphone, puis la solution Kizzo. Voix off et sous-titres.",
    aria: 'Kizzo — publicité vidéo 9:16',
    css: 'src/pub/film.css',
  },
};

const only = process.argv[2];
const tpl = fs.readFileSync(r('src/index.html'), 'utf8');
fs.mkdirSync(r('dist'), { recursive: true });
for (const [id, film] of Object.entries(FILMS)) {
  if (only && only !== id) continue;
  const result = await esbuild.build({
    entryPoints: [r(film.entry)],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    write: false,
    legalComments: 'none',
    alias: { 'three/addons': 'three/examples/jsm' },
    loader: { '.mp3': 'base64' },
    logLevel: 'warning',
  });
  const app = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = tpl
    .replace(/<title>[^<]*<\/title>/, () => `<title>${film.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, (_, a) => a + film.description)
    .replace(/aria-label="Kizzo — film explicatif 3D"/, () => `aria-label="${film.aria}"`)
    .replace('/*FONTS*/', () => fontCss)
    .replace('/*FILM_CSS*/', () => (film.css ? fs.readFileSync(r(film.css), 'utf8') : ''))
    .replace('<!--LOGO_SVG-->', () => logoSvg)
    .replace('/*APP*/', () => app);
  // livrable principal (versionné) + copies de travail pour les scripts d'aperçu / d'export
  fs.writeFileSync(r(film.out), clean(html));
  fs.writeFileSync(r(`dist/kizzo-${id}.html`), clean(html));
  fs.writeFileSync(r(`dist/kizzo-${id}.artifact.html`), strip(html));
  console.log(`✓ ${film.out}`, kb(film.out), `· dist/kizzo-${id}.artifact.html`, kb(`dist/kizzo-${id}.artifact.html`));
}
