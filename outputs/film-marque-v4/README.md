# Kizzo — film de marque v4 : vertical 9:16, design inspiré d'Apple

Même histoire que la v3 (`../film-marque-v3/`), même voix off, même minutage (29,5 s). Le format et le design changent :

- **9:16 (1080 × 1920)** pour Reels, TikTok, Shorts, Stories et le fil LinkedIn mobile. Le titre est en haut de l'image, les appareils en dessous, et rien d'important ne touche les bords.
- **Un design de film produit** :
  - fond noir et une seule couleur d'accent, l'orange de Kizzo ;
  - titres en Inter Display gras, interlettrage serré, en phrases (pas en majuscules), sur deux tons : la première ligne en blanc, la suite en gris ;
  - des appareils sobres : téléphone à bord titane, tablette en aluminium gris sidéral, bordures fines, léger reflet sur la vitre.
- **Moins enfantin** :
  - l'app enfant passe en interface sombre et posée, dans le langage visuel d'un système : flou, un symbole, une phrase, un bouton ;
  - les vidéos sont des plans cinématographiques (aurore, océan, ville de nuit, dunes, dégradé abstrait) au lieu de dessins animés ;
  - plus de confettis : le déblocage est une coche qui se dessine dans un cercle orange, avec « Écran débloqué ».
- **Les écrans du parent restent ceux de l'app réelle** : accueil, caméra, lecture de la leçon, « Règles des quiz ».

## La structure

| Temps | Titre à l'écran | Ce qu'on voit |
|---|---|---|
| 0:00 – 0:01,2 | 1 vidéo. / Puis 10. / Puis 50. | La tablette de l'enfant plein cadre, les vidéos défilent sur un beat ; chaque nouvelle ligne arrive en blanc, les précédentes passent en gris |
| 0:01,2 – 0:02,3 | Écran bloqué. | Le cadenas s'abat sur l'écran : « C'est l'heure du quiz. » |
| 0:02,4 – 0:04,3 | Et si ses vidéos / lui faisaient réviser / ses leçons ? | La caméra recule, l'écran rembobine jusqu'à l'accueil de Ben |
| 0:04,4 – 0:06,5 | Étape 1 · Installez Kizzo / sur sa tablette. | Le téléphone (Vous) arrive à côté de la tablette (Votre enfant), un fil de lumière les relie |
| 0:06,6 – 0:09,6 | Étape 2 · Scannez ses leçons. / Kizzo en fait des quiz. | La leçon est photographiée, les 3 questions partent vers la tablette |
| 0:09,7 – 0:12,6 | Étape 3 · Un quiz toutes / les 20 minutes. | « Règles des quiz » : le parent choisit 20 min et 3 questions. La puce « 20 min » s'envole et devient le minuteur de la tablette |
| 0:13,3 – 0:15,2 | 20 minutes / plus tard. | Le flux défile de plus en plus vite, l'anneau du minuteur se vide |
| 0:15,4 – 0:18,2 | Pas de réponse, / pas d'écran. | Le cadenas, l'enfant essaie de passer, « Écran bloqué » |
| 0:18,3 – 0:20,6 | 3 bonnes réponses. / C'est reparti. | Le quiz se remplit en trois segments, coche orange, « Écran débloqué », +20 min, la vidéo repart |
| 0:21,4 – 0:22,7 | Vous suivez / ses progrès. | La notification « Ben a débloqué son écran · 3/3 » se détache du téléphone |
| 0:22,7 – 0:29,5 | Un temps d'écran qui compte. | Les deux lumières deviennent le logo, Découvrir Kizzo, kizzo.fr |

## Livrables

| Fichier | Usage |
|---|---|
| `kizzo-film-v4-FR-9x16.mp4` / `kizzo-film-v4-EN-9x16.mp4` | Masters 1080 × 1920, 30 i/s, son déjà baissé sous la voix |
| `kizzo-film-v4-FR-guide-voix-off.mp4` / `-EN-` | Vidéo guide pour enregistrer à l'image |
| `SCRIPT-VOIX-OFF.md` | Script (identique à la v3), casting, points de synchro, mixage |
| `voix-off-FR.srt` / `voix-off-EN.srt` | Sous-titres |
| `kizzo-sfx.wav` / `kizzo-sfx-stem.wav` | Habillage sonore baissé sous la voix / piste propre |
| `kizzo-film.html` | Lecteur vertical : film, chapitres, sous-titres synchronisés, FR/EN |

## Refaire un rendu

```bash
cd src
npm install playwright
python3 sfx.py && ffmpeg -i build/kizzo-sfx.wav -c:a aac -b:a 160k build/kizzo-sfx.m4a
python3 build.py
node render.mjs --lang fr --fps 30 --sub 8 --out build/frames-fr && ./encode.sh fr
python3 vo_export.py --guide
```

Polices : Inter et Inter Display (SIL OFL) pour le film, Outfit pour les écrans de l'app, Patrick Hand pour la leçon manuscrite.
