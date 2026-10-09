# Kizzo — film explicatif 3D (37,5 s, 9:16, français)

Animation motion design 3D temps réel (Three.js / WebGL) qui explique Kizzo, au format vertical 1080 × 1920, 60 fps, avec sound design synthétisé. La v2 est en français, reprend les vraies interfaces des apps Kizzo et ajoute la scène du **scan de leçon** : le parent photographie la leçon de l'enfant, Kizzo en génère un quiz, et le parent choisit la fréquence des quiz (toutes les 10, 15, 20 ou 30 min).

| Livrable | Usage |
|---|---|
| `kizzo-explainer-fr.html` | **Le film interactif.** Un seul fichier autonome (Three.js, polices et code embarqués) : double-clic, ça marche hors-ligne sur Mac et Windows. |
| `kizzo-explainer-fr-1080x1920-60fps.mp4` | Export vidéo H.264 + AAC (−14 LUFS), prêt pour LinkedIn / Reels / TikTok. |
| `kizzo-explainer-fr-poster.png` | Image finale (logo) en 1080 × 1920, pour la miniature. |
| `v1-en/` | Version 1 (anglais, 30 s, sans scène de scan), archivée. |

## Lecture

Ouvrir `kizzo-explainer-fr.html` dans Chrome, Edge, Safari ou Firefox → **Lancer avec le son**.

- `Espace` lecture/pause · `R` rejouer · `M` couper le son · `←` `→` ±1 s · barre de progression cliquable / glissable · bouton plein écran.
- La résolution s'adapte automatiquement à la carte graphique pour tenir 60 fps (rendu interne jusqu'à 1080 × 1920).

Paramètres d'URL (à ajouter après `.html`) :

| Paramètre | Effet |
|---|---|
| `?lang=en` | Textes en anglais (français par défaut). |
| `?autoplay=1` | Démarre seul (son coupé, règle des navigateurs). |
| `?loop=1` | Boucle infinie (écran de salon, stand). |
| `?t=17.3` | Démarre à un instant précis. |
| `?quality=low\|medium\|high` | Force la qualité (sinon automatique). |

## Découpage (timeline)

| Temps | Plan | Ce qu'on voit |
|---|---|---|
| 0 – 4,9 s | **A · Le temps d'écran** | Ben joue sur son téléphone, une tablette flotte. « Quiz dans 0:00 » → onde de choc, l'écran gèle, écran de verrouillage Kizzo. Titre **« Le temps d'écran, en plus malin »**. Travelling avant dans l'écran → flash. |
| 4,9 – 12,4 s | **Scan · Le parent crée le quiz** | Téléphone parent au-dessus du cahier de Ben. « Photographier une leçon » → viseur « Page 1 » et balayage laser de la page → « Kizzo lit la leçon de Ben » (%, étapes) pendant que des lignes de la leçon s'envolent → « Questions générées » (Le cycle de l'eau) → « Quiz automatiques » : sélecteur 3D 10 / **15** / 20 / 30 min, planning de l'après-midi recalculé, « Envoyer à Ben ». Titres **« Photographiez ses leçons »** puis **« Un quiz toutes les 15 minutes »**. |
| 12,4 – 16,5 s | **B · Le quiz arrive** | L'accueil enfant (« Salut Ben », carte « Nouveau quiz ! », évolution, dernier quiz) sort du téléphone en calques 3D, icônes holographiques en orbite. Titre **« Il apprend pour débloquer »**. Tap sur « Lancer le quiz ». |
| 16,5 – 23,5 s | **C · Le quiz** | Hologramme au-dessus du téléphone : les 3 questions générées depuis la leçon (soleil 3D, nuage qui pleut, réponse à compléter), tuiles de réponses, doigt + onde de toucher, anneau de progression en 3 segments. |
| 23,5 – 27,9 s | **D · La récompense** | « +15 » extrudé en 3D, rayons, confettis, **« MINUTES DÉBLOQUÉES »**. Écran « Bravo ! » avec +15 min. Titre **« +15 minutes gagnées »**. |
| 27,9 – 32,9 s | **E · Le parent** | Tableau de bord « Bonjour Léa » (temps restant, quiz automatiques, créer un quiz avec une photo, statistiques). Trois règles (quiz toutes les 15 min, limite 2 h, coucher 20 h 30) rejoignent le téléphone de Ben par des traînées de lumière. Titre **« Vous fixez les règles »**. |
| 32,9 – 37,5 s | **F · Signature** | Le logo Kizzo extrudé s'assemble, balayage de brillance, rayons. **« kizzo »** + **« Le temps d'écran se gagne en apprenant »**. |

## Interfaces reprises des vraies apps

- **App parent (claire)** : d'après les captures « Bonjour Léa », « Photographier une leçon », viseur « Page 1 », « Kizzo lit la leçon de Ben » et « Questions générées » (dégradé ciel → pêche, boutons orange, cartes blanches).
- **App enfant (sombre)** : d'après le code de l'app enfant (`HomeScreen`, `LockedScreen`, `QuizPlayScreen`) : navy `#152A4A → #0A1526`, cyan `#3DB4D9`, boutons arrondis avec halo.

## Charte appliquée

Orange signature `#F97316`, navy `#0F172A`, cyan du logo `#3DB5DA` · Outfit / Plus Jakarta Sans (titres et interfaces), Space Grotesk (chiffres), Caveat (écriture du cahier) · rayons généreux sur toutes les cartes UI. Le logo 3D est extrudé depuis le tracé vectoriel du logo fourni.

## Technique (pour l'équipe / l'agence)

- **Rendu** : Three.js r170, matériaux PBR (titane, verre, clearcoat), environnement studio pré-filtré, ombres douces VSM.
- **Post-production maison** : MSAA → profondeur de champ bokeh → FX additifs non floutés avec test de profondeur → bloom → tone mapping Khronos PBR Neutral, aberration chromatique, zoom-blur, vignette, grain.
- **Déterminisme** : chaque image est une fonction pure du temps `t` → scrub instantané, boucle parfaite, export image par image identique au temps réel. La scène de scan est insérée dans la timeline par un remappage du temps (`SCAN0`, `SCAN_DUR` dans `src/config.js`).
- **Interfaces** : dessinées en Canvas 2D (`src/ui-kizzo.js`) puis plaquées sur les écrans 3D, une fois les polices chargées.
- **Son** : 100 % Web Audio, même partition en temps réel et en rendu hors-ligne pour l'export.

## Modifier / reconstruire

```bash
cd outputs/kizzo-explainer
npm install
npm run build            # -> kizzo-explainer-fr.html
npm run export           # -> dist/kizzo-explainer-1080x1920-60fps.mp4 (≈ 2 h 30 sans GPU, reprenable)
```

- Textes (FR/EN), couleurs et timing : `src/config.js`.
- Interfaces : `src/ui-kizzo.js` · scène du scan : `src/scan.js` · mise en scène et caméras : `src/story.js` · son : `src/audio.js`.
- Aperçus rapides : `node tools/snap.mjs <dossier> 960 6.2 10.9 19.9` (images fixes aux instants donnés).
