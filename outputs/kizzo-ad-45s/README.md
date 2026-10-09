# Kizzo — publicité 45 s (9:16)

Publicité verticale 1080 × 1920, 30 i/s, exactement 45 s, pour Reels / TikTok / Shorts.
Deux briques assemblées par une timeline unique :

- **Plans personnages 3D** (Ben, 10 ans, sweat orange ; Léa, gilet cyan) générés avec Higgsfield : une image de référence pour fixer les personnages, 5 images clés, puis 5 plans animés (Kling 3.0 Turbo, 1080 × 1920).
- **Motion design en code** (Three.js) : téléphone 3D affichant les **vraies captures** de l'app, feuille de cours physique, scan, particules, cartes quiz, cadran du rythme, textes en français et logo exact.

| Fichier | Rôle |
| --- | --- |
| `kizzo-pub-45s.html` | Lecteur de la pub (double-clic). Lecture/pause, rejouer, barre de temps, saut par séquence (1–7), bouton « Zones sûres » (touche G). |
| `kizzo-pub-45s-animatique.mp4` | Rendu complet actuel. Les 5 plans personnages y sont remplacés par des cartons « PLAN PERSONNAGES 3D » (voir état ci-dessous). |
| `assets/clips/clips.json` | Identifiants Higgsfield des 5 plans générés et de l'image de référence. Les liens de téléchargement contiennent l'identifiant de ton compte : ils restent hors du repo, dans `assets/clips/clips.local.json` (non versionné). |
| `assets/screens/` | Les 5 captures réelles de l'app, utilisées sans modification. |
| `src/` | `cues.js` (minutage), `director.js` (mise en scène), `scene.js` (3D), `overlay.js` (textes, logo, CTA), `graphics.js`, `lesson.js`, `clips.js`. |
| `tools/` | `fetch_clips.mjs` (récupère les plans), `build.mjs`, `snap.mjs` (captures QA), `render.mjs` (export MP4). |

## État et étape restante

Les 5 plans personnages sont générés et visibles dans ton espace Higgsfield. Ils ne sont pas encore montés dans le MP4 : la politique réseau de l'environnement cloud bloque `d8j0ntlcm91z4.cloudfront.net`, le CDN où Higgsfield sert les fichiers.

Pour finaliser, deux options :

1. **Autoriser le domaine** dans les réglages réseau de l'environnement (Allowed domains), puis me demander de finaliser. Je récupère les plans, je les vérifie image par image, je recale les points d'ancrage (`POI` dans `src/cues.js`) et j'exporte le MP4 final.
2. **Sur ton ordinateur** : renseigne les 5 liens (bibliothèque Higgsfield, identifiants dans `clips.json`) dans `assets/clips/clips.local.json`, puis :
   ```bash
   npm install && npx playwright install chromium
   node tools/fetch_clips.mjs     # télécharge les 5 plans et extrait les images
   npm run build && npm run render
   ```

## Découpage (timecodes)

| Temps | Séquence | Image | Texte à l'écran |
| --- | --- | --- | --- |
| 0:00–0:06 | Hook | C1 Ben réclame la tablette (gros plan), coupe fouettée vers C2 : il boude et se laisse tomber sur le coussin, Léa soupire, ralenti comique | « Encore une dispute pour la tablette ? » |
| 0:06–0:12 | Découverte | Traits cyan et orange nés de la tablette, ouverture circulaire sur C3 (Léa découvre l'app). Logo exact sur carte navy, qui plonge dans le téléphone. Le téléphone s'allume sur le vrai tableau de bord (« Bonjour Léa », Ben, CM2) | « Et si le temps d'écran aidait aussi à apprendre ? » |
| 0:12–0:19 | Photo de la leçon | Tap sur « Créer un quiz avec une photo », écran « Photographier une leçon », tap sur « Ouvrir l'appareil photo », vrai écran caméra. La caméra descend sur la feuille « Le cycle de l'eau » posée sur le bureau : soulignés cyan, balayage orange, l'encre s'envole en points et en « ? » vers le téléphone | « Une photo de la leçon. » |
| 0:19–0:27 | Le quiz | Vrais écrans « Kizzo lit la leçon de Ben » puis « Questions générées » (zoom sur la question 1). Les cartes-questions sortent de l'écran, la première traverse l'objectif vers C4 : Ben réfléchit, tape et sourit. La carte illustrative s'anime : coche, cercle cyan, particules orange | « La leçon devient un quiz. » puis « Réviser, régulièrement. » |
| 0:27–0:33 | Le rythme | Vrai tableau de bord, zoom sur « Quiz automatiques · Un quiz toutes les 30 min, 5 questions ». Cadran d'horloge derrière le téléphone, aiguille de lumière cyan, impulsions orange à chaque quart | « Un rythme adapté à votre famille. » |
| 0:33–0:39 | Bénéfice | Une carte révision ouvre sur C5 : Ben montre son quiz à Léa, câlin, travelling arrière. Rubans cyan et orange en orbite douce | « Moins de conflits. Plus de sens. » |
| 0:39–0:45 | Signature | Flou vers le dégradé de l'app, arc cyan protecteur, le point orange se pose. Logo exact sur carte navy, accroche et CTA tenus plus de 3 s | « Le temps d'écran qui fait grandir. » · bouton « Découvrez Kizzo » |

## Voix off proposée (≈ 95 mots)

| Temps | Texte |
| --- | --- |
| 0:01 | « Tous les soirs, la même négociation… » |
| 0:06 | « Et si ce temps d'écran servait aussi à apprendre ? » |
| 0:12 | « Avec Kizzo, prenez simplement la leçon en photo. » |
| 0:19 | « Kizzo en tire des questions, que vous relisez avant de les envoyer. Ben révise… et il est fier de lui. » |
| 0:27 | « Vous choisissez le rythme des quiz : par exemple, toutes les 30 minutes. » |
| 0:33 | « Moins de conflits, plus de sens. » |
| 0:39 | « Kizzo. Le temps d'écran qui fait grandir. » |

## Direction sonore (à ajouter au montage, la voix au premier plan)

- **0:00–0:06** : pizzicato léger, petite tension comique. « Pouf » de coussin vers 0:05, soupir discret.
- **0:05,7** : whoosh doux sur les traits, puis ouverture harmonique (nappe) à 0:06. « Pop » du logo à 0:09, petit carillon d'allumage à 0:10,3.
- **0:11,8 et 0:13,3** : clics de tap feutrés. Montée douce du scan de 0:14,6 à 0:16,7, papier et scintillement quand l'encre s'envole (0:16,3).
- **0:22,3** : whoosh de la carte qui traverse l'objectif. Tap à 0:24,85, puis « ding » chaleureux de bonne réponse (marimba) et scintillement.
- **0:27,6–0:31,8** : tic-tac très doux et 4 notes de marimba sur les impulsions orange.
- **0:33–0:39** : la musique s'ouvre, chaleureuse. À 0:39,5, une signature sonore de 2 ou 3 notes, puis un petit « pop » du CTA à 0:41,3.

## Respect de la marque et du produit

- **Logo** : jamais redessiné. Ce sont les calques extraits au pixel du fichier fourni, posés sur leur navy d'origine (le wordmark est blanc).
- **Interfaces** : les 5 captures sont affichées telles quelles dans le téléphone. Seuls des effets extérieurs sont ajoutés : transitions de masque, zooms, onde de tap. Aucun écran n'est inventé.
- **Cartes quiz flottantes** : éléments illustratifs (ombre, typographie de motion design). Elles reprennent le texte des vraies questions générées, sans se faire passer pour l'interface.
- **Fréquence** : « toutes les 30 min, 5 questions » vient de la capture du tableau de bord.
- **Écrans des appareils dans les plans IA** : demandés masqués ou lumineux sans interface. À vérifier au montage.
- **Textes** : français avec apostrophes typographiques et espace fine avant « ? ». Les accents de couleur reprennent les teintes du logo, assombries pour la lisibilité.
