# Carrousels Kizzo — style « Le Cahier »

Un dossier par carrousel. Chaque dossier contient :
- `spec.json` : le texte du carrousel ;
- `insta_4x5/` : les visuels Instagram, en 1080 × 1350 ;
- `tiktok_9x16/` : les visuels TikTok, en 1080 × 1920 ;
- `apercu.jpg` : la planche contact.

## Faire un nouveau carrousel
1. Copier un `spec.json` existant dans un nouveau dossier et changer les textes.
2. Lancer le script depuis `communication/social/outils/` :
   ```
   python3 carrousel_cahier.py polices assets/kizzo_logo.png ../carrousels/NOUVEAU/insta_4x5 ../carrousels/NOUVEAU/spec.json 45
   python3 carrousel_cahier.py polices assets/kizzo_logo.png ../carrousels/NOUVEAU/tiktok_9x16 ../carrousels/NOUVEAU/spec.json 916
   ```

## Types de visuels (`type` dans `spec.json`)
| Type | Contenu |
|---|---|
| `quiz` | Question et cartes-réponses A, B, C (la couverture) |
| `reveal` | Réponses corrigées : `bad` est barré avec une croix, `good` est en vert avec une coche, et on peut ajouter une note en dessous |
| `notebook` | Page de cahier scannée, avec viseur et « Matière détectée » |
| `quizcard` | Carte de quiz façon appli, avec le sticker « +5 min » |
| `ring` | Anneau de temps d'écran débloqué |
| `check` | Liste cochée, avec titre et sous-titre |
| `cta` | Bouton orange et actions « envoyer » et « enregistrer » |

Les champs communs à tous les types :
- `label` : l'étiquette orange en haut ;
- `title` : `**mots**` met les mots en orange soulignés, `\n` force un retour à la ligne ;
- `text` : un paragraphe sous le titre ;
- `hint` : le texte à côté de la flèche en bas.
