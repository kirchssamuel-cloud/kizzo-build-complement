# Vidéo explicative Kizzo (30 s)

Animation de 30 secondes qui montre comment marche Kizzo : Léo atteint sa limite d'écran, il répond à un quiz de 3 questions sur sa leçon du jour et débloque 15 minutes. En parallèle, le parent règle les limites puis suit la progression en direct.

| Fichier | Usage |
|---|---|
| `index.html` | La vidéo jouable dans n'importe quel navigateur, sans dépendance. Lecteur avec chapitres, son, voix off optionnelle et plein écran. |
| `kizzo-explainer.mp4` | Export 1920×1080, 30 i/s, H.264 + AAC. Prêt pour LinkedIn, le site ou une présentation. |
| `render.mjs` | Régénère le MP4 à partir de `index.html` après une modification. |

## Storyboard

| Temps | Scène | Message à l'écran |
|---|---|---|
| 0:00 | Léo joue sur son téléphone, le compteur d'écran du jour défile | « Screen time today » |
| 0:04 | La limite tombe : écran verrouillé, Léo râle, le parent insiste | « Daily limit reached » |
| 0:08 | Le téléphone devient Kizzo : « Earn 15 more minutes » | Logo + « The smart parental-control app that connects screen time with learning » |
| 0:11 | Le parent règle la limite (2 h), active les quiz et choisit +15 min | **Manage screen time** |
| 0:15 | Quiz sur la leçon du jour (le cycle de l'eau), 3 bonnes réponses ; le tableau de bord parent suit en direct | **Learn something new** |
| 0:22 | Confettis, +15 min, notification côté parent, le jeu reprend avec 15:00 | **Earn extra screen time** |
| 0:25 | Logo et signature | **Screen time earned through learning** |

## Modifier la vidéo

Tout est piloté par une seule timeline : chaque élément est une fonction du temps (0 à 30 s). On peut donc avancer, reculer et exporter image par image sans décalage.

- **Narration et sous-titres** : tableau `CUES` dans `index.html` (temps de début, de fin, texte).
- **Textes des écrans** : directement dans le HTML (écrans `#pRules`, `#pDash` côté parent, `#kOffer`, `#kQuiz`, `#kReward` côté enfant).
- **Timing des animations** : section « Storyboard » du script, une ligne `T(...)` ou `inn(...)` par mouvement.
- **Son** : musique et bruitages sont générés par le navigateur (fonction `buildEvents`), calés sur la même timeline.

## Réexporter le MP4

```bash
cd explainer-video
npm i -D playwright && npx playwright install chromium   # une seule fois
node render.mjs                                          # crée kizzo-explainer.mp4
```

Il faut aussi `ffmpeg` (`brew install ffmpeg` sur Mac, `winget install ffmpeg` sur Windows). Compter 3 à 5 minutes.

## À savoir

- **Logo** : repris du `LogoMark` des apps (carré dégradé orange, wordmark KIZZO, barre cyan) avec un « K » au centre. À remplacer par le logo définitif s'il diffère (`#inMark`, `#enMark`, `#pdNotif .mk`).
- **Voix off** : le bouton « Voice-over » utilise la voix de synthèse de l'appareil, donc le rendu varie selon Mac, Windows ou téléphone. Elle n'est pas dans le MP4. Pour une vraie voix, le script minuté est dans le lecteur (« Narration script ») et dans `CUES`.
- **Langue** : tout est en anglais. Une version française demande seulement de traduire `CUES` et les textes du HTML.
- **Sur kizzo.fr** : le plus simple est d'héberger le MP4 et de l'afficher avec une balise `<video>`. La page `index.html` peut aussi être intégrée telle quelle.
