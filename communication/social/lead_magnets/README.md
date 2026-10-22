# Les ressources gratuites (lead magnets)

Ce sont les PDF que le parent reçoit en message privé quand il commente le mot-clé (voir `../MANYCHAT.md`). Chacun retire une douleur précise, comme le demande la méthode de script (`../METHODE_SCRIPT.md`, bloc 5).

| Mot-clé | Fichier | Contenu | Pages |
|---|---|---|---|
| CONTRAT | `kizzo-contrat-ecran.pdf` | Le contrat d'écran à remplir et à signer en famille, et son mode d'emploi | 2 |
| MÉTHODE | `kizzo-methode-10-minutes.pdf` | Pourquoi relire ne marche pas (sources vérifiées), la méthode en 3 étapes, les 20 questions qui marchent sur toutes les leçons | 3 |
| CRISE | `kizzo-phrases-anti-crise.pdf` | 7 phrases pour arrêter l'écran sans crise, les 3 à éviter, la routine de fin d'écran | 2 |

**Sources citées dans la méthode** :
- Roediger et Karpicke, *Psychological Science*, 2006 ;
- Dunlosky et al., *Psychological Science in the Public Interest*, 2013.

Les chiffres ont été vérifiés le 22 octobre 2026.

## Modifier un PDF
1. Changer le texte dans `sources/*.html`. La charte commune est dans `sources/kizzo_pdf.css` : Outfit et Inter, orange #F97316, bleu nuit #0F172A, coins de 20 px, bandeau « Le Cahier ».
2. Lancer `./construire.sh` (Chromium sans interface). Avec un dossier en argument, le script exporte aussi chaque page en PNG pour relecture.

Les polices sont dans `../outils/polices/statiques/` : Outfit (version officielle) et Inter (converti en TrueType par `../outils/otf_vers_ttf.py`, puis réduit aux caractères latins). Les deux sont sous licence OFL. Grâce à ces versions statiques, le texte des PDF reste net et sélectionnable.
