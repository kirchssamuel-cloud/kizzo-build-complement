# Motion design demo — Remotion

Vidéo de démonstration générique (catalogue) : 1920×1080, 30 i/s, 28 s, MP4 H.264.
Rendu final : `../outputs/motion-design-demo.mp4`.

## Structure

| Temps | Scène | Ce qui se passe |
|---|---|---|
| 0–4 s | `Opening` | Accroche lettre par lettre (masques + défloutage), le point final ambre gonfle et devient un volet plein écran |
| 4–10 s | `Geometry` | Ouverture en iris, cercles / orbites / champ de points en onde, caméra parallaxe sur 4 profondeurs |
| 10–18 s | `Stats` | La ligne d'horizon devient la ligne de base ; 3 compteurs (vrais chiffres de la vidéo) + ticks, barres, anneau |
| 18–24 s | `Interface` | La ligne se replie en cadre d'appareil ; app générique animée en 3D, cartes flottantes en profondeur |
| 24–28 s | `Closing` | Volet en bandes décalées, signature typographique, fondu propre |

Toutes les courbes sont des `cubic-bezier` (voir `src/theme.ts`, objet `E`) — aucun easing linéaire.
Polices : Fraunces (display, axes opsz/SOFT/WONK) et Inter, licence SIL OFL, embarquées dans `public/fonts`.

## Commandes

```bash
npm install
npm run studio   # aperçu interactif
npm run render   # export MP4 vers ../outputs/
```
