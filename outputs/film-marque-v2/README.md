# Kizzo — film de marque v2 (30 s, pensé pour une voix off)

Ce qui change par rapport à la v1 (`../film-marque/`) :

- **Le scan de la leçon est montré pour de vrai.** Le parent ouvre Kizzo (« Créer un quiz avec une photo »), cadre la page dans la caméra (« Page 1 »), puis « Kizzo lit la leçon de Ben ». Trois questions partent du téléphone et atterrissent sur la tablette de l'enfant. La caméra plonge alors dans cet écran pour le quiz.
- **Les écrans du téléphone reprennent l'app réelle** : accueil parent, caméra avec coins orange et ligne de scan, écran d'analyse avec pourcentage et checklist. La leçon est une vraie page de cahier manuscrite, « Le cycle de l'eau », et les trois questions portent dessus (soleil, nuage, pluie).
- **Les textes à l'écran sont réduits aux mots clés**, puisque c'est le narrateur qui raconte. « LEARN. ANSWER. UNLOCK. » devient une barre de progression **SCAN · QUIZ · +15 MIN**. « LESS SCROLLING. MORE LEARNING. » passe dans la voix.
- La durée passe de 25,5 s à **30 s**, le format pub standard, pour laisser respirer la voix.

## Livrables

| Fichier | Usage |
|---|---|
| `kizzo-film-v2-FR-1080p.mp4` | Master français, 1920×1080, 30 i/s, habillage sonore déjà baissé sous la voix |
| `kizzo-film-v2-EN-1080p.mp4` | Master anglais |
| `kizzo-film-v2-FR-guide-voix-off.mp4` | Vidéo guide pour le narrateur : le film, la réplique en cours et le timecode sous l'image |
| `kizzo-film-v2-EN-guide-voix-off.mp4` | Idem en anglais |
| `SCRIPT-VOIX-OFF.md` | Script complet : casting, intentions, timecodes, prononciation, mixage |
| `voix-off-FR.srt`, `voix-off-EN.srt` | Sous-titres calés sur la voix off (réseaux sociaux) |
| `kizzo-sfx.wav` / `kizzo-sfx-stem.wav` | Piste sonore baissée sous la voix / piste propre pour mixage pro |
| `kizzo-film.html` | Lecteur : film, sous-titres de la voix off synchronisés, script cliquable, FR/EN |
| `kizzo-film-v2-poster.png` | Dernière image (logo + CTA) |

## Minutage

| Temps | Acte |
|---|---|
| 0:00 – 0:05,6 | Accroche : explosion, 3-2-1-0, gel. « CHAQUE SOIR, LA MÊME BATAILLE. » |
| 0:05,7 – 0:09,9 | Problème : la boucle infinie, arrêt net, puis le geste du parent |
| 0:09,9 – 0:14,9 | Scan : la leçon, l'app du parent, les 3 questions qui volent vers la tablette, la plongée |
| 0:14,9 – 0:19,0 | Quiz : 3 questions, 3 ✓, l'anneau se ferme |
| 0:19,0 – 0:24,0 | Récompense : +15 MINUTES, ▶ 15:00, parent et enfant ensemble |
| 0:24,0 – 0:30,0 | Marque : slogan, logo, DÉCOUVRIR KIZZO, kizzo.fr |

## Refaire un rendu

```bash
cd src
npm install playwright
python3 sfx.py && ffmpeg -i build/kizzo-sfx.wav -c:a aac -b:a 160k build/kizzo-sfx.m4a
python3 build.py
node render.mjs --lang fr --fps 30 --sub 3 --out build/frames-fr && ./encode.sh fr
python3 vo_export.py --guide        # sous-titres + vidéos guides
```

Textes : `src/strings.json` (y compris le texte de la leçon et les écrans de l'app). Minutage et voix off : `src/cues.json`. Police manuscrite : Patrick Hand (SIL OFL).
