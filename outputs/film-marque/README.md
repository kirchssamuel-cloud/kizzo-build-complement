# Kizzo — film de marque (25,5 s)

Film publicitaire motion design, 1920 × 1080, 16:9, 30 i/s. Version anglaise (texte du brief) et version française.

## Livrables

| Fichier | Usage |
|---|---|
| `kizzo-film-EN-1080p.mp4` | Film final, textes anglais, avec habillage sonore discret |
| `kizzo-film-FR-1080p.mp4` | Même film, textes français |
| `kizzo-sfx.wav` | Piste sonore seule (48 kHz, stéréo), pour le mixage avec la voix off |
| `kizzo-film.html` | Lecteur interactif autonome : lecture, chapitres, bascule EN/FR, son on/off |
| `kizzo-film-poster.png` | Dernière image (logo + CTA), pour vignette ou miniature |

Aucune voix et aucune musique ne sont intégrées. Tout se comprend sans le son.

## Le film, acte par acte

Le fil rouge : le rond orange du logo est l'enfant, la forme bleue est le parent. Le film raconte comment ils passent de la tension à l'harmonie, et finissent par former le logo.

| Temps | Acte | Ce qu'on voit |
|---|---|---|
| 0:00 – 0:05 | Accroche | Un point orange explose en univers d'écrans, compte à rebours 3-2-1-0, tout se fige, l'anneau se referme. L'enfant pousse contre la limite. « EVERY DAY, THE SAME BATTLE. » : l'enfant et le parent tirent sur la même corde. |
| 0:05 – 0:09 | Problème | Une boucle infinie de contenus aspire le point orange, qui s'épuise. Le compteur « SCREEN TIME » s'emballe. Arrêt net. |
| 0:09 – 0:15 | Recadrage | Un geste bleu (le bras du logo) recueille l'enfant. Le chaos s'aligne : « LESS SCROLLING. MORE LEARNING. » Trois questions sur la leçon du jour, trois ✓, l'anneau se ferme : « LEARN. ANSWER. UNLOCK. » |
| 0:15 – 0:19 | Récompense | Les trois réponses deviennent un mécanisme d'horloge : un quart de cadran s'allume, « +15 MINUTES EARNED. » Le temps d'écran repart (▶ 15:00). |
| 0:19 – 0:25,5 | Marque | Parent et enfant tournent ensemble, puis se posent exactement à leur place dans le logo. « MAKE SCREEN TIME COUNT. » puis « DISCOVER KIZZO → » et kizzo.fr. |

## Repères pour la voix off

Laisser libres l'impact du gel (0:02,0) et le silence de l'arrêt (0:08,45 – 0:08,85) : ce sont les deux respirations du film.

| Repère | Temps |
|---|---|
| Gel « zéro » | 0:02,00 |
| EVERY DAY, / THE SAME BATTLE. | 0:03,42 / 0:03,72 |
| Arrêt de la boucle | 0:08,45 |
| MORE LEARNING. | 0:10,35 |
| Réponses 1 / 2 / 3 | 0:12,35 / 0:13,15 / 0:13,95 |
| Anneau fermé, UNLOCK. | 0:14,50 |
| +15 MINUTES EARNED. | 0:17,25 |
| MAKE SCREEN TIME COUNT. | 0:19,85 |
| Logo complet | 0:22,30 |
| DISCOVER KIZZO | 0:22,45 → fin 0:25,5 |

## Identité visuelle

Couleurs relevées directement sur le logo fourni : navy `#071B39`, bleu `#2BBBED`, orange `#FF7A1B`, blanc. Le logo final est tracé en vectoriel à partir du fichier fourni (aucune déformation) et rendu après les effets de lumière, pour garder ses couleurs exactes. Typographie : Outfit (licence SIL OFL).

## Refaire un rendu

Le film est un programme : chaque image est calculée à partir du temps, donc le navigateur et le MP4 montrent exactement la même chose. Sources dans `src/`.

```bash
cd src
npm install playwright          # une fois (Chromium piloté pour le rendu)
python3 sfx.py                  # piste sonore -> build/kizzo-sfx.wav
ffmpeg -i build/kizzo-sfx.wav -c:a aac -b:a 160k build/kizzo-sfx.m4a
python3 build.py                # lecteur -> ../kizzo-film.html
node render.mjs --lang en --fps 30 --sub 3 --out build/frames-en   # 766 images PNG, flou de mouvement
./encode.sh en                  # MP4
```

Les textes (EN/FR) sont dans `src/strings.json`, le minutage dans `src/cues.json`. Le logo est retracé depuis `src/logo-source.jpg` par `src/logo_trace.py`.
