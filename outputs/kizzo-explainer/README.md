# Kizzo — film explicatif 3D (30 s, 9:16)

Animation motion design 3D temps réel (Three.js / WebGL) qui explique Kizzo en 30 secondes, au format vertical 1080 × 1920, 60 fps, avec sound design synthétisé.

| Livrable | Usage |
|---|---|
| `kizzo-explainer.html` | **Le film interactif.** Un seul fichier autonome (Three.js, polices Outfit/Inter et code embarqués) : double-clic, ça marche hors-ligne sur Mac et Windows. |
| `kizzo-explainer-1080x1920-60fps.mp4` | Export vidéo H.264 + AAC (−14 LUFS), prêt pour LinkedIn / Reels / TikTok. |
| `kizzo-explainer-poster.png` | Image finale (logo) en 1080 × 1920, pour la miniature. |

## Lecture

Ouvrir `kizzo-explainer.html` dans Chrome, Edge, Safari ou Firefox → **Play with sound**.

- `Espace` lecture/pause · `R` rejouer · `M` couper le son · `←` `→` ±1 s · barre de progression cliquable / glissable · bouton plein écran.
- La résolution s'adapte automatiquement à la carte graphique pour tenir 60 fps (rendu interne jusqu'à 1080 × 1920).

Paramètres d'URL (à ajouter après `.html`) :

| Paramètre | Effet |
|---|---|
| `?lang=fr` | Version française (titres, interfaces, quiz). Anglais par défaut, comme le brief. |
| `?autoplay=1` | Démarre seul (son coupé, règle des navigateurs). |
| `?loop=1` | Boucle infinie (écran de salon, stand). |
| `?t=17.3` | Démarre à un instant précis. |
| `?quality=low\|medium\|high` | Force la qualité (sinon automatique). |

Exemple : `kizzo-explainer.html?lang=fr&loop=1`

## Découpage (timeline)

| Temps | Plan | Ce qu'on voit |
|---|---|---|
| 0 – 4,9 s | **A · Le temps d'écran** | Plan large : un enfant (dans le langage du logo, tête orange) joue sur son téléphone, une tablette flotte. Le compte à rebours tombe à 0:00 → onde de choc, l'écran gèle (désaturation + givre), cadenas. Titre **« Screen Time, Smarter »**. Travelling avant dans l'écran, le logo Kizzo s'y allume → flash. |
| 4,9 – 9,0 s | **B · Kizzo apparaît** | L'app enfant sort du téléphone en calques 3D (en-tête, carte « 0 min left », quête +15 min, matières, bouton), icônes holographiques en orbite. Titre **« Learn to Unlock »**. Tap sur « Start quiz ». |
| 9,0 – 16,0 s | **C · Le quiz** | Le téléphone se couche et projette un hologramme. 3 cartes 3D (calcul, planète rouge en 3D, vocabulaire), tuiles de réponses, doigt + onde de toucher, sélection verte, étincelles, anneau de progression lumineux en 3 segments. La dernière réponse se verrouille dans la carte. |
| 16,0 – 20,4 s | **D · La récompense** | L'anneau se complète, explosion : « +15 » extrudé en 3D (Outfit ExtraBold, flancs métal), rayons volumétriques, confettis 3D, **« MINUTES UNLOCKED »**. Le +15 plonge dans le téléphone : 15:00 débloquées. Titre **« +15 Minutes Earned »**. |
| 20,4 – 25,4 s | **E · Le parent** | Téléphone parent (dashboard sombre) : limite quotidienne, planning, barres d'usage 3D, apprentissage. Trois règles en sortent et rejoignent le téléphone de l'enfant par des traînées de lumière ; bascule de mise au point. Titre **« You Set the Rules »**. |
| 25,4 – 30 s | **F · Signature** | Les pièces du logo Kizzo (tracé officiel extrudé) s'assemblent, verrouillage lumineux, balayage de brillance, rayons, particules. **« kizzo »** + **« Screen time earned through learning »**. |

## Charte appliquée

Orange signature `#F97316`, navy `#0F172A`, cyan du logo `#3DB5DA` · Outfit (titres) / Inter (texte) · rayon 20 px sur toutes les cartes UI. Le logo 3D est extrudé depuis le tracé vectoriel du logo fourni (`assets/kizzo-logo-reference.jpg` → `tools/trace_logo.py`).

## Technique (pour l'équipe / l'agence)

- **Rendu** : Three.js r170, matériaux PBR (titane, verre, clearcoat, sheen), environnement studio pré-filtré pour les reflets, ombres douces VSM, reflets « softbox » sur les écrans.
- **Post-production maison** : MSAA → profondeur de champ bokeh (mise au point animée, rack focus) → FX additifs non floutés avec test de profondeur manuel (particules, traînées, halos, ondes) → bloom → tone mapping Khronos PBR Neutral (fidèle aux couleurs de marque), aberration chromatique, zoom-blur de transition, vignette, grain.
- **Occlusion** : ombres de contact sous chaque calque UI + ombres portées douces (pas de SSAO plein écran, trop coûteux pour du 60 fps sur portable).
- **Déterminisme** : chaque image est une fonction pure du temps `t` → scrub instantané, boucle parfaite, export image par image identique au temps réel.
- **Son** : 100 % Web Audio (nappes, impacts, risers, plucks, clics), même partition en temps réel et en rendu hors-ligne pour l'export.

## Modifier / reconstruire

```bash
cd outputs/kizzo-explainer
npm install
npm run build            # -> kizzo-explainer.html
npm run export           # -> dist/kizzo-explainer-1080x1920-60fps.mp4 (≈ 2 h sans GPU, reprenable)
```

- Textes (EN/FR), couleurs et timing : `src/config.js`.
- Interfaces des écrans : `src/ui-canvas.js` · mise en scène et caméras : `src/story.js` · son : `src/audio.js`.
- Aperçus rapides : `node tools/snap.mjs <dossier> 960 3.0 12.6 17.3` (images fixes aux instants donnés).
