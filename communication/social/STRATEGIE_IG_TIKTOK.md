# Kizzo — Stratégie Instagram + TikTok (v4, 22 octobre 2026)

Pour Instagram et TikTok, ce document remplace le plan de test à 3 posts par semaine (`../STRATEGIE_TEST_FORMATS.md`). Ce plan reste valable pour LinkedIn.

**Ce qui change en v4** :
- toutes les vidéos suivent la méthode de script d'un pro du contenu court, transmise par Samuel ;
- chaque publication a un CTA par mot-clé (ManyChat) ;
- on lance un test de 14 jours pour choisir les formats avant de produire en série.

Les autres documents du dossier :
- **la méthode de script**, à appliquer à chaque vidéo et à chaque carrousel : `METHODE_SCRIPT.md` ;
- **le test de 14 jours** (calendrier, indicateurs, règles de décision) : `PLANNING.md` ;
- **les scripts du test** : `SCRIPTS_TEST_14J.md` ;
- **les mots-clés et les messages automatiques** : `MANYCHAT.md` ;
- **les PDF gratuits** (contrat d'écran, méthode des 10 minutes, phrases anti-crise) : `lead_magnets/` ;
- **le journal de production** des vidéos déjà faites : `SCRIPTS_VIDEO.md` ;
- **les idées** : `BANQUE_IDEES.md` ;
- **les carrousels** : `carrousels/`.

## Règles du jeu
- **Tout pour le temps de visionnage.** Chaque vidéo suit les 5 blocs de la méthode : hook, pic d'intrigue, valeur, climax avec contrepied, CTA. Rien ne part sans avoir passé la grille de validation.
- **La valeur d'abord.** Chaque vidéo donne quelque chose d'utile dès ce soir, même sans Kizzo. Kizzo arrive ensuite comme la version automatique.
- **Un CTA par mot-clé** : « Commente MOT pour recevoir RESSOURCE ». Quatre mots-clés : CONTRAT, CRISE, MÉTHODE, BÊTA.
- **Le rythme** :
  - pendant le test, une vidéo par jour et 5 carrousels ;
  - ensuite, le rythme décidé au bilan final ;
  - chaque Reel part aussi sur la Page Facebook.
- **La cible** : les parents de 30 à 45 ans, jamais les ados directement.
- **Le ton** : Kizzo est un partenaire de dialogue, jamais un outil de surveillance punitive. On dit « on a tous ce problème, voilà une solution », jamais « les écrans, c'est mal ».
- **L'IA** :
  - chaque vidéo qui montre des personnages générés par IA porte l'étiquette IA (option de TikTok, étiquette IA d'Instagram) ;
  - **jamais de faux témoignage** : aucun personnage IA ne se présente comme un vrai utilisateur.
- **Rien d'inventé** : chiffres, études et histoires personnelles sont vrais et vérifiés avant publication.
- **Inspiration, pas copie** : on reprend les mécaniques qui marchent ailleurs, jamais le look ni les phrases d'un autre compte.

## Horaires
- **Vidéos : 20 h 45.** C'est l'heure où les enfants sont couchés et où les parents font défiler leur fil.
- **Carrousels : 12 h 30**, la pause déjeuner.
- Les horaires ne bougent pas pendant le test de 14 jours, pour que la comparaison des formats soit juste. On testera l'heure ensuite.

## Les formats testés
La grille hebdomadaire à 7 rubriques revient après le test, construite sur les formats gagnants.

| Code | Format | Durée | Ce qu'il apporte | Production |
|---|---|---|---|---|
| FC | Face caméra, Samuel | 30 à 45 s | L'authenticité : un fondateur de 23 ans qui construit une app pour les parents | Tournage au téléphone, 0 crédit |
| NA | Narration avec images | 25 à 35 s | Montrer Kizzo en action, sans dialogue à synchroniser | Plans existants, voix off de Samuel, 0 crédit |
| FI | Fiction IA « Les Clémentine » | 30 à 45 s | Le feuilleton : un rendez-vous, une « partie 2 » qu'on va chercher | Kling 3.0 Omni, sur feu vert |
| QZ | Quiz des parents | 10 à 15 s | Le parent joue 3 s et répond en commentaire | Plans de la pub ou animation, 0 crédit |
| PV | POV et humour | 6 à 10 s | Le « c'est nous » qu'on partage | Plans existants, 0 crédit |
| CA | Carrousel « Le Cahier » | 8 visuels | Ce qu'on enregistre et qu'on renvoie | 0 crédit |

## Style visuel « Le Cahier » (le nôtre)
Les carrousels, les couvertures de Reels et les PDF gratuits partagent un même système. La grille du profil reste cohérente : on reconnaît Kizzo d'un coup d'œil.
- **Fond** : papier crème à grands carreaux Seyès, avec des lignes bleu ciel reprises du bleu du logo et une marge orange à la place de la marge rouge des cahiers. C'est l'école française, que tous les parents reconnaissent, et c'est le cahier que le parent scanne dans Kizzo.
- **Chaque carrousel s'ouvre sur une question.** Le quiz, c'est le cœur de l'app, et c'est notre signature.
- **Barre de progression de quiz** en haut (un segment par visuel), étiquette de rubrique en orange.
- **Titres** : Outfit 800 bleu nuit, en casse normale. Les mots clés sont en orange, soulignés d'un coup de stylo.
- **Éléments de jeu** :
  - cartes-réponses A, B et C ;
  - bonne réponse en vert, avec une coche ;
  - mauvaise réponse barrée ;
  - sticker « +5 min » ;
  - anneau de temps d'écran.
- **Cartes** : blanches, coins arrondis de 20 px, ombre douce.
- **Annotations manuscrites orange** (police Caveat), comme la correction d'un prof : une seule par carrousel au maximum. C'est le seul écart à la charte Outfit et Inter, **à valider par Samuel**.
- **Bas de page** : logo Kizzo, plus le bouton flèche orange pour inviter à faire défiler.
- **Formats** :
  - Instagram en 4:5 (1080 × 1350) ;
  - TikTok en 9:16 (1080 × 1920). Le contenu reste dans la zone utile : rien dans le quart du bas, où TikTok affiche la légende.
- **Outils** :
  - `outils/carrousel_cahier.py` génère les deux formats depuis un fichier `spec.json` ;
  - `lead_magnets/construire.sh` génère les PDF.

## Mise en place du compte (une fois)
- **Nom du profil Instagram** (il est indexé par la recherche Instagram) : « Kizzo · Écrans & devoirs ».
- **Bio** (moins de 150 caractères) :
  > L'écran, ça se gagne 📚
  > Tu scannes sa leçon, Kizzo en fait un quiz sur son écran. Chaque bonne réponse débloque du temps d'écran.
  > Bêta ouverte 👇
- **Lien** : vers kizzo.fr, avec une balise de suivi (`?utm_source=instagram&utm_medium=bio`, et `utm_source=tiktok` sur TikTok), pour savoir d'où viennent les inscriptions.
- **Messages automatiques** : ManyChat sur Instagram et Facebook ; réponse par mot-clé de TikTok (voir `MANYCHAT.md`).
- **Stories à la une** : « Kizzo ? », « Comment ça marche », « Bêta », « Conseils », « Coulisses ». Les couvertures suivent le style Cahier ; je les produis.
- **3 posts épinglés** :
  - le carrousel « Comment finir la bataille des écrans sans crier ? » ;
  - la meilleure vidéo de la semaine 1 ;
  - la vidéo face caméra de Samuel (« J'ai 23 ans, pas d'enfant… »).
- **Grille** : on alterne carrousel (clair) et vidéo. Toutes les couvertures de Reels ont le titre au même endroit et dans la même typo.
- **TikTok** :
  - compte Entreprise, pour les statistiques détaillées, le lien et les messages automatiques ;
  - attention, un compte Entreprise ne peut utiliser que la bibliothèque musicale commerciale de TikTok ;
  - le lien en bio n'apparaît qu'avec 1 000 abonnés ou un compte Entreprise vérifié.

## Ce qu'on retient des inspirations
- **La méthode de script du pro** (transmise par Samuel le 22 octobre) : c'est la référence pour toutes nos vidéos. Voir `METHODE_SCRIPT.md`.
- **STR8UP** : la discipline du système (un gabarit, une couleur d'accent, des éléments toujours au même endroit), le fondateur à l'image, le produit montré en situation réelle. On garde la discipline, pas leur look : notre style, c'est « Le Cahier ».
- **Joe's Pasta** :
  - un récit problème → pourquoi → solution → résultat en 30 s ;
  - une narration chaleureuse ;
  - des personnages cohérents qui ne parlent jamais, donc aucun souci de synchro labiale.

  Ça devient notre format « Narration avec images ».
- **Les vidéos de fruits IA** :
  - le look hyperréaliste ;
  - le drame et les émotions fortes dès la première seconde ;
  - le feuilleton et la « partie 2 » ;
  - les voix jouées dans la scène.

  Ça devient « Les Clémentine » : toute la famille en clémentines, notre conflit (les écrans, les devoirs) et une chute drôle.

## Indicateurs et décisions
Ils sont dans `PLANNING.md` :
- le taux de skip et la rétention à 3 s ;
- le pourcentage moyen regardé ;
- les commentaires avec mot-clé pour 1 000 vues ;
- les partages et enregistrements ;
- les e-mails de la bêta ;
- la lecture de la courbe de rétention bloc par bloc ;
- les bilans du jour 7 et du jour 14.

## Leçons déjà apprises
- **Pas de hook, pas de vidéo.** La première version de la vidéo « Comment ça marche » et l'épisode 1 de la Famille Pépin n'en avaient pas. Samuel : « ya pas de hook ». D'où la méthode, et un hook visuel dans les 3 premières secondes.
- **Ne pas donner la réponse trop tôt.** La v3 de « Comment ça marche » expliquait tout dès la 4e seconde. La v4 (NA1) garde l'explication pour le dernier quart.
- **Les voix posées par-dessus la vidéo ne marchent pas** pour la fiction. Elles sont générées avec la vidéo (voix natives).
- **Le look mignon et les fruits mélangés ont été rejetés** : la famille est 100 % clémentine, hyperréaliste. L'ancien épisode de la Famille Pépin est abandonné.
- **Le produit, tel qu'il est** : c'est le parent qui prend la leçon en photo ; le quiz arrive sur l'écran de l'enfant.
- **Les captures d'écran de l'app** ne suffisent jamais seules. Il faut :
  - des plans courts de 0,5 à 2 s ;
  - des légendes de 1 à 3 mots posées sur l'image ;
  - des inserts serrés sur un détail.
- **Ne jamais calquer un compte d'inspiration.** Le premier carrousel reprenait la mise en page et les formulations de STR8UP, et a été refait. On transpose une mécanique, on ne recopie ni le look ni le texte.

## Crédits Higgsfield
Avant toute génération, on présente le concept plan par plan avec son coût exact en crédits, et on attend le feu vert de Samuel. Aucune génération « pour voir ».

Coûts unitaires vérifiés :
- image `gpt_image_2_5` : 0,25 crédit (qualité basse) à 2,75 crédits (haute, 2k) ;
- plan Kling 3.0 standard de 5 s, en 9:16 et sans son : 7,5 crédits ;
- plan Kling 3.0 pro de 5 s avec le son : 12,5 crédits ;
- scène Kling 3.0 Omni de 15 s, pro, avec le son et jusqu'à 7 images de référence : 30 crédits ;
- scène Seedance 2.0 de 15 s, rapide, en 720p avec le son : 37,5 crédits.
