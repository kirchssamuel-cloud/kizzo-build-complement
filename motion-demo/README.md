# Motion design — Remotion

Deux films générés à 100 % par du code (React + TypeScript, Remotion) :

| Composition | Fichier | Format |
|---|---|---|
| `Reel` / `ReelHFR` | `../outputs/showreel-motion-design.mp4` | 1920×1080, 60 i/s, 16 s, son inclus |
| `Showreel` (v1) | `../outputs/motion-design-demo.mp4` | 1920×1080, 30 i/s, 28 s |

## Showreel (v2) — 32 temps à 120 BPM, un seul plan continu

| Temps | Technique | Passage de relais |
|---|---|---|
| 0–2 s | Étincelle, flare anamorphique, typo variable (graisse animée), reflet lumineux | Plongée caméra à travers le « O » |
| 2–4 s | Typo cinétique : un mot par temps, découpe en lamelles cisaillées | Le dernier mot est avalé par le drop |
| 4–6 s | Flood ambre (0,35 s), grille de formes qui morphent sur le temps (ressorts) | Le plan bascule en 3D |
| 6–8 s | Blocs 3D CSS, éclairage Lambert sur lumière orbitale, ombres portées, spot | Les blocs éclatent |
| 8–10 s | 2 600 particules sans état (spirale → anneau), traînées de mouvement | L'anneau se condense |
| 10–12 s | Métaballes liquides (goo), typo déformée par turbulence | Fusion en une goutte |
| 12–14 s | Lentille de masque : monde inversé à l'intérieur, contours à l'extérieur, ondes de choc | La lentille se referme en point |
| 14–16 s | Signature « Chaque image compte. » | — |

- Tout est fonction du temps en secondes (`src/reel/lib.ts`) : le film se rend à n'importe quelle cadence.
- Easing : `cubic-bezier` + ressorts amortis en forme fermée. Zoom interpolé en espace log.
- Flou de mouvement : rendu à 240 i/s puis fusion de 3 sous-images (`tmix`) → 60 i/s.
- Son : synthétisé en Python (`audio/make_audio.py`), calé sur la grille de temps, normalisé à −14 LUFS. Aucun sample, aucune licence tierce.
- Polices : Fraunces et Inter (SIL OFL), embarquées dans `public/fonts`.

## Commandes

```bash
npm install
npx remotion studio                       # aperçu interactif
python3 audio/make_audio.py audio/raw.wav # bande-son (numpy + scipy)
ffmpeg -i audio/raw.wav -af loudnorm=I=-14:TP=-1 audio/reel-audio.wav
npx remotion render src/index.ts ReelHFR out/reel-240.mp4 --codec=h264 --crf=8
ffmpeg -i out/reel-240.mp4 -i audio/reel-audio.wav \
  -vf "tmix=frames=3,fps=60" -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart ../outputs/showreel-motion-design.mp4
```
