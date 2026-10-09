# Kizzo — film de lancement (15 s)

Motion design 1920 × 1080, 60 fps, rendu **en temps réel dans le navigateur** (Three.js / WebGL 2).
Tout est fonction d'une horloge maître : lecture, scrub et export vidéo donnent exactement la même image au même instant.

| Fichier | Usage |
| --- | --- |
| `kizzo-launch-film.html` | Le film. Fichier autonome (three.js, polices, logo inclus) : double-clic, ça joue. |
| `kizzo-launch-film.mp4` | Export H.264 1080p60, prêt pour LinkedIn / site. |
| `src/` | Code source (scène 3D, UI parent/enfant, typo cinétique, logo). |
| `assets/` | Logo source + calques extraits au pixel (bleu, orange, wordmark). |
| `tools/` | Extraction du logo, build, captures QA, export MP4. |

## Lecture

`Espace` pause · `R` rejouer · `←` `→` ±0,5 s (`Maj` = image par image) · ajouter `?loop` à l'URL pour boucler.
Sur un GPU faible, le film baisse seul la résolution interne à 75 % pour garder la fluidité.

## Découpage

| Temps | Plan |
| --- | --- |
| 0,0 – 1,4 | Noir total. Le point orange du logo s'allume, anneaux de lumière qui se dessinent, formes du logo (cercles, traits arrondis). |
| 1,4 – 3,1 | **SCREEN TIME. REIMAGINED.** — l'orbe orange devient le point final. |
| 3,1 – 3,6 | Rush caméra à travers les anneaux, flash. |
| 3,6 – 6,5 | Smartphone 3D + traînées de lumière. Dashboard parent : limite quotidienne (3h → 2h), semaine, déblocage par quiz, notification « limite atteinte ». |
| 6,5 – 7,1 | Transition liquide vers l'app enfant (raccord sur l'anneau). |
| 7,1 – 10,0 | Trois cartes quiz qui sortent de l'écran, réponses qui s'enclenchent, anneau de progression. **LEARN. ANSWER. UNLOCK.** |
| 10,0 – 11,3 | Récompense : cadenas ouvert, **+15 MIN**, onde de choc, particules. |
| 11,7 – 12,5 | **MEET KIZZO.** |
| 12,5 – 15,0 | Le texte se dissout en particules qui forment le logo exact ; le point orange atterrit ; balayage lumineux ; plan final. |

## Respect de la marque

- Couleurs mesurées sur le fichier logo fourni : navy `#071B39`, bleu `#2BBBED`, orange `#FF7A1B`, blanc. Le reste n'est que des teintes/ombres de ces quatre couleurs.
- Le logo n'est pas redessiné : `tools/extract_logo_layers.py` sépare les trois éléments par démélange avec le fond navy (écart moyen < 2/255 avec l'original). Le plan final empile ces calques à l'identique.
- Typo : Outfit (titres) et Inter (UI), rayons 20 px sur les cartes.

## Modifier / ré-exporter

```bash
npm install
npx playwright install chromium   # une fois, pour snap/render
npm run build          # régénère kizzo-launch-film.html
npm run snap -- /tmp 4.6 9.8 15   # captures PNG à des instants donnés
npm run render         # ré-exporte le MP4 (Playwright + ffmpeg, ~10–20 min en CPU)
```

Le minutage complet est dans `src/timeline.js` (`T`), la mise en scène dans `src/director.js`.
