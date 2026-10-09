# Kizzo — film de marque v3 (31 s) : toute la mécanique, sans ambiguïté

La v2 (`../film-marque-v2/`) montrait le scan d'une leçon puis un quiz. Le spectateur ne comprenait pas encore qui installe quoi, quand le quiz apparaît, ni que l'écran reste bloqué tant que l'enfant n'a pas répondu. La v3 raconte la mécanique dans l'ordre, une étape par plan, chacune avec son titre à l'écran. Elle se comprend donc aussi sans le son.

## La structure

| Temps | Étape | Ce qu'on voit | Le détail qui fait comprendre |
|---|---|---|---|
| 0:00 – 0:03,3 | Accroche | « ENCORE 5 MINUTES ! », minuteur 0:03 → 0:00, tout se fige | La phrase que tous les parents entendent, dès l'image 1 |
| 0:03,3 – 0:05,6 | Le problème | CHAQUE SOIR, LA MÊME BATAILLE. Le parent (bleu) et l'enfant (orange) tirent sur une corde, qui casse | Bleu = parent et orange = enfant, comme dans le logo |
| 0:05,6 – 0:08,1 | ① Installez Kizzo sur sa tablette | Les deux lumières deviennent le téléphone (VOUS) et la tablette (VOTRE ENFANT). Un lien les relie, et sur le téléphone le statut de Ben passe de « Connexion… » à « En ligne » | Deux appareils, deux apps : le parent pilote celle de l'enfant |
| 0:08,1 – 0:11,2 | ② Scannez ses leçons | La page de cahier « Le cycle de l'eau » est photographiée avec l'app réelle, « Kizzo lit la leçon de Ben », puis trois « ? » volent vers la tablette : « 3 questions prêtes » | Les questions viennent de **sa** leçon |
| 0:11,2 – 0:14,1 | ③ Un quiz toutes les 20 min | Écran « Règles des quiz » de l'app réelle : « Quiz de déblocage » activé, le parent touche **20 min** puis **3** questions, et enregistre. La puce « 20 min » se détache, vole vers la tablette et devient son minuteur **20:00** | C'est le parent qui décide du rythme, et la règle se transporte sur l'écran de l'enfant |
| 0:14,1 – 0:16,7 | 20 minutes plus tard… | On entre dans la tablette. Les vidéos défilent de plus en plus vite, le minuteur fond jusqu'à 0:03, 0:02, 0:01, comme dans l'accroche | Le compte à rebours de l'accroche trouve sa réponse |
| 0:16,7 – 0:18,1 | L'écran se bloque | La vidéo se fige et se floute, un cadenas tombe : « C'est l'heure du quiz ! ». L'enfant essaie de passer d'un geste du doigt, le cadenas refuse : « Écran bloqué ». Titre : PAS DE RÉPONSE, PAS D'ÉCRAN. | On voit l'enfant essayer et ne pas pouvoir |
| 0:18,1 – 0:21,9 | Le quiz | Trois questions sur le cycle de l'eau. Chaque bonne réponse remplit un des trois crans à côté du cadenas. À 3/3, le cadenas s'ouvre : « Bravo Ben ! 3/3 · écran débloqué », +20 MIN | Le déblocage est lié aux bonnes réponses |
| 0:21,9 – 0:24,2 | Le parent est prévenu | La vidéo repart (20:00). Sur le téléphone : « Ben a débloqué son écran · Quiz « Le cycle de l'eau » : 3/3 » | Le parent sait ce que l'enfant a appris |
| 0:24,2 – 0:31,0 | Marque | Les deux lumières quittent les appareils et deviennent le logo. UN TEMPS D'ÉCRAN QUI COMPTE. DÉCOUVRIR KIZZO, kizzo.fr | La boucle se referme sur le logo parent/enfant |

Les écrans du téléphone reprennent l'app réelle : accueil, caméra, lecture de la leçon et « Règles des quiz ». L'app enfant est colorée, avec une énergie de jeu vidéo. Les vidéos de l'enfant sont des dessins animés génériques, sans aucune marque.

## Livrables

| Fichier | Usage |
|---|---|
| `kizzo-film-v3-FR-1080p.mp4` / `kizzo-film-v3-EN-1080p.mp4` | Masters 1920×1080, 30 i/s, son déjà baissé sous la voix |
| `kizzo-film-v3-FR-guide-voix-off.mp4` / `-EN-` | Vidéo guide pour enregistrer à l'image (qui parle, réplique, timecode) |
| `SCRIPT-VOIX-OFF.md` | Casting enfant + narrateur, 13 répliques timecodées, points de synchro, mixage |
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
