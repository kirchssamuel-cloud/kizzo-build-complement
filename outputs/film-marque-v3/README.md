# Kizzo — film de marque v3 (29,5 s) : un autre film, toute la mécanique

La v3 n'est pas un remontage de la v2 (`../film-marque-v2/`) : nouvelle accroche, nouvelle structure, nouveaux plans. Elle raconte la mécanique dans l'ordre, une étape par plan, et chaque étape a son titre à l'écran. Le film se comprend donc aussi sans le son.

## La structure

| Temps | Étape | Ce qu'on voit | Le détail qui fait comprendre |
|---|---|---|---|
| 0:00 – 0:01,2 | Accroche | Plein cadre dans la tablette de l'enfant : des vidéos défilent sur un beat, « 1 VIDÉO. » « PUIS 10. » « PUIS 50… » | Image 1 : du mouvement, de la couleur et un texte qui claque |
| 0:01,2 – 0:04,4 | Le choc | Un cadenas s'écrase sur l'écran : « C'est l'heure du quiz ! ». L'enfant : « Hein ?! C'est bloqué ?! ». La caméra recule, l'écran rembobine jusqu'à « Salut Ben ! » | On montre la fin d'abord, et le spectateur veut savoir comment on en arrive là |
| 0:04,4 – 0:06,7 | ① Installez Kizzo sur sa tablette | Le téléphone du parent (VOUS) arrive à côté de la tablette (VOTRE ENFANT). Un lien les relie et, sur le téléphone, le statut de Ben passe de « Connexion… » à « En ligne » | Deux appareils, deux apps : le parent pilote celle de l'enfant |
| 0:06,7 – 0:09,7 | ② Scannez ses leçons | La page de cahier « Le cycle de l'eau » est photographiée avec l'app réelle, « Kizzo lit la leçon de Ben », puis trois « ? » volent vers la tablette : « 3 questions prêtes » | Les questions viennent de **sa** leçon |
| 0:09,7 – 0:12,6 | ③ Un quiz toutes les 20 min | Écran « Règles des quiz » de l'app réelle : « Quiz de déblocage » activé, le parent touche **20 min** puis **3** questions, et enregistre. La puce « 20 min » se détache, vole vers la tablette et devient son minuteur **20:00** | C'est le parent qui décide du rythme, et la règle se transporte sur l'écran de l'enfant |
| 0:12,6 – 0:15,2 | 20 minutes plus tard… | On entre dans la tablette. Les vidéos défilent de plus en plus vite, le minuteur fond jusqu'à 0:00 | Le temps passe, le quiz arrive |
| 0:15,2 – 0:16,6 | L'écran se bloque | Le cadenas de l'accroche revient : « C'est l'heure du quiz ! ». L'enfant essaie de passer d'un geste du doigt, le cadenas refuse : « Écran bloqué ». Titre : PAS DE RÉPONSE, PAS D'ÉCRAN. | Cette fois, on comprend pourquoi c'est bloqué |
| 0:16,6 – 0:20,4 | Le quiz | Trois questions sur le cycle de l'eau. Chaque bonne réponse remplit un des trois crans à côté du cadenas. À 3/3, le cadenas s'ouvre : « Bravo Ben ! 3/3 · écran débloqué », +20 MIN | Le déblocage est lié aux bonnes réponses |
| 0:20,4 – 0:22,7 | Le parent est prévenu | La vidéo repart (20:00). La notification se détache du téléphone : « Ben a débloqué son écran · Quiz « Le cycle de l'eau » : 3/3 » | Le parent sait ce que l'enfant a appris |
| 0:22,7 – 0:29,5 | Marque | Les deux lumières quittent les appareils et deviennent le logo. UN TEMPS D'ÉCRAN QUI COMPTE. DÉCOUVRIR KIZZO, kizzo.fr | Bleu = parent, orange = enfant, comme dans le logo |

Les écrans du téléphone reprennent l'app réelle : accueil, caméra, lecture de la leçon et « Règles des quiz ». L'app enfant est colorée, avec une énergie de jeu vidéo. Les vidéos de l'enfant sont des dessins animés génériques, sans aucune marque.

## Livrables

| Fichier | Usage |
|---|---|
| `kizzo-film-v3-FR-1080p.mp4` / `kizzo-film-v3-EN-1080p.mp4` | Masters 1920×1080, 30 i/s, son déjà baissé sous la voix |
| `kizzo-film-v3-FR-guide-voix-off.mp4` / `-EN-` | Vidéo guide pour enregistrer à l'image (qui parle, réplique, timecode) |
| `SCRIPT-VOIX-OFF.md` | Casting enfant + narrateur, 12 répliques timecodées, points de synchro, mixage |
| `voix-off-FR.srt` / `voix-off-EN.srt` | Sous-titres de la voix |
| `kizzo-sfx.wav` / `kizzo-sfx-stem.wav` | Habillage sonore baissé sous la voix / piste propre pour mixage |
| `kizzo-film.html` | Lecteur : film, chapitres, sous-titres synchronisés, script cliquable, FR/EN |

## Refaire un rendu

```bash
cd src
npm install playwright
python3 sfx.py && ffmpeg -i build/kizzo-sfx.wav -c:a aac -b:a 160k build/kizzo-sfx.m4a
python3 build.py
node render.mjs --lang fr --fps 30 --sub 3 --out build/frames-fr && ./encode.sh fr
python3 vo_export.py --guide
```

Minutage et voix off : `src/cues.json`. Tous les textes (titres, écrans du téléphone, app enfant, questions) : `src/strings.json`.
