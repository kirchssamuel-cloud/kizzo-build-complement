# Kizzo — Stratégie Instagram + TikTok (v3, 21 octobre 2026)

Pour Instagram et TikTok, ce document remplace le plan de test à 3 posts par semaine (`../STRATEGIE_TEST_FORMATS.md`). Ce plan reste valable pour LinkedIn.

Les autres documents du dossier :
- **Planning et kits de publication** : `PLANNING.md`.
- **Scripts vidéo** : `SCRIPTS_VIDEO.md`.
- **Idées** : `BANQUE_IDEES.md`.
- **Carrousels** : `carrousels/`.

## Règles du jeu
- **Rythme** : 1 à 2 publications par jour. Le même contenu part sur Instagram et TikTok (Reels, carrousels, et carrousels en mode photo sur TikTok).
- **Répartition** : 50 % découverte (portée, accroches fortes), 30 % valeur (pédagogie, conseils), 20 % conversion (bêta, démo). En plus, chaque carrousel se termine par l'appel à la bêta.
- **Cible** : parents de 30 à 45 ans, jamais les ados directement.
- **Ton** : Kizzo est un partenaire de dialogue, jamais un outil de surveillance punitive. On dit « on a tous ce problème, voilà une solution », jamais « les écrans c'est mal ».
- **Mention IA** : chaque vidéo qui montre des personnages générés par IA porte l'étiquette « contenu généré par IA » (option TikTok, étiquette IA d'Instagram).
- **Inspiration, pas copie** : on reprend les mécaniques qui marchent ailleurs (feuilleton, quiz, structure de récit), jamais le look ni les phrases d'un autre compte.

## Horaires
- **Créneau principal : 20h45.** C'est l'heure où les enfants sont couchés et où les parents scrollent.
- **Créneau secondaire : 12h30**, la pause déjeuner. Le samedi, 10h, parce que les parents ont le temps de lire.
- **À tester.** On compare la portée de 12h30 et de 20h45 sur deux semaines, puis on garde le meilleur créneau.

## La semaine type : 7 rubriques
Avoir une rubrique fixe par jour permet de publier tous les jours sans chercher l'idée à chaque fois, et donne aux abonnés des rendez-vous.

| Jour | Rubrique | Format | Pilier | Pourquoi |
|---|---|---|---|---|
| Lundi 20h45 | **Le quiz des parents** | Reel de 8 à 10 s | Découverte | Le parent joue 3 s (rétention) et répond en commentaire (algorithme). Ça montre le produit sans le dire. |
| Mardi 12h30 | **Le carrousel Cahier** | 8 visuels, qui s'ouvrent sur un quiz | Valeur | Un carrousel s'enregistre et s'envoie : c'est ce qui fait sortir un post de sa communauté. |
| Mercredi 20h45 | **La Famille Pépin** | Épisode de 30 à 40 s, avec cliffhanger | Découverte | Le mercredi est le jour des écrans. Le feuilleton crée un rendez-vous. Pilote d'abord, voir `SCRIPTS_VIDEO.md`. |
| Jeudi 20h45 | **POV du soir** | Reel de 6 à 8 s, une phrase de parent | Découverte | Le format le plus partageable (« c'est nous »), produit en 20 minutes. |
| Vendredi 20h45 | **Kizzo, comment ça marche** | Narration et images, 25 à 35 s | Conversion | Transformer l'attention de la semaine en inscriptions à la bêta. |
| Samedi 10h | **Le carrousel du week-end** | Repères, idées reçues, FAQ | Valeur | Le samedi matin, on lit. |
| Dimanche 20h45 | **Les coulisses** | Samuel face caméra, 30 à 45 s | Découverte | Un fondateur de 23 ans qui construit une app pour les parents, c'est une histoire. On suit des personnes, pas des logos. |

Quand on publie un deuxième post dans la journée, à 12h30, on recycle un contenu existant : un extrait de la pub, un carrousel décliné en Reel ou un quiz bonus.

## Style visuel « Le Cahier » (le nôtre)
Les carrousels et les couvertures de Reels partagent un même système. Comme la grille du profil reste cohérente, on reconnaît Kizzo d'un coup d'œil.
- **Fond** : papier crème à grands carreaux Seyès, avec des lignes bleu ciel reprises du bleu du logo et une marge orange à la place de la marge rouge des cahiers. C'est l'école française, que tous les parents reconnaissent, et c'est le cahier que le parent scanne dans Kizzo.
- **Chaque carrousel s'ouvre sur une question.** Le quiz, c'est le cœur de l'app, et c'est notre signature.
- **Barre de progression de quiz** en haut (un segment par visuel), étiquette de rubrique en orange.
- **Titres** : Outfit 800 bleu nuit, en casse normale. Les mots clés sont en orange, soulignés d'un coup de stylo.
- **Éléments de jeu** :
  - cartes-réponses A, B et C ;
  - bonne réponse en vert, coche ;
  - mauvaise réponse barrée ;
  - sticker « +5 min » ;
  - anneau de temps d'écran.
- **Cartes** : blanches, coins arrondis de 20 px, ombre douce.
- **Annotations manuscrites orange** (police Caveat), comme la correction d'un prof : une seule par carrousel au maximum. C'est le seul écart à la charte Outfit et Inter, **à valider par Samuel**.
- **Bas de page** : logo Kizzo, plus le bouton flèche orange pour inviter à swiper.
- **Formats** :
  - Instagram en 4:5 (1080 × 1350) ;
  - TikTok en 9:16 (1080 × 1920). Le contenu reste dans la zone utile : rien dans le quart du bas, où TikTok affiche la légende.
- **Outil** : `outils/carrousel_cahier.py` génère les deux formats depuis un fichier `spec.json`, avec un seul script pour garantir que tout reste identique d'un carrousel à l'autre.

## Mise en place du compte (une fois)
- **Nom du profil Instagram** (le nom est indexé par la recherche Instagram) : « Kizzo · Écrans & devoirs ».
- **Bio** (moins de 150 caractères) :
  > L'écran, ça se gagne 📚
  > Tu scannes sa leçon, Kizzo en fait un quiz sur son écran. Chaque bonne réponse débloque du temps d'écran.
  > Bêta ouverte 👇
- **Lien** : vers kizzo.fr, avec une balise de suivi (`?utm_source=instagram&utm_medium=bio`, et `utm_source=tiktok` sur TikTok) pour savoir d'où viennent les inscriptions.
- **Stories à la une** : « Kizzo ? », « Comment ça marche », « Bêta », « Conseils », « Coulisses ». Les couvertures suivent le style Cahier ; je les produis.
- **3 posts épinglés** :
  - le carrousel « Comment finir la bataille des écrans sans crier ? » ;
  - la pub ;
  - l'appel à la bêta.
- **Grille** : on alterne carrousel (clair) et vidéo. Toutes les couvertures de Reels ont le titre au même endroit et dans la même typo.
- **TikTok** : compte Business, pour les statistiques détaillées et le lien. Attention, en compte Business on ne peut utiliser que la bibliothèque musicale commerciale de TikTok.

## Ce qu'on retient des comptes et vidéos d'inspiration
- **STR8UP** : la discipline du système (un gabarit, une couleur d'accent, des éléments toujours au même endroit), le fondateur à l'image, le produit montré en situation réelle. On garde la discipline, pas leur look : notre style, c'est « Le Cahier ».
- **Joe's Pasta** :
  - un récit problème → pourquoi → solution → résultat en 30 s ;
  - une narration chaleureuse ;
  - des personnages cohérents qui ne parlent jamais, donc aucun souci de synchro labiale.

  Ça devient notre rubrique « Comment ça marche ».
- **Fruit IA** :
  - le feuilleton, un conflit par épisode ;
  - le cliffhanger « partie 2 », que les gens vont chercher dans la barre de recherche TikTok ;
  - les sous-titres mot à mot.

  Ça devient « La Famille Pépin », avec notre look, notre conflit (les écrans) et de l'humour plutôt que du drame.

## Indicateurs et décisions
| Indicateur | Objectif | Seuil d'échec |
|---|---|---|
| Taux d'accroche (spectateurs encore là à 3 s) | ≥ 40 % TikTok, ≥ 30 % Instagram | < 18 % TikTok, < 15 % Instagram : on refait le format entièrement, on ne le retouche pas |
| Taux de rétention (à 15 s, ou fin de vidéo pour les formats courts) | à fixer après les 10 premiers posts | — |
| Carrousels : enregistrements et envois rapportés à la portée | > 2 % | < 0,5 % : on change d'angle |
| Partages et enregistrements des vidéos rapportés aux vues | > 1 % | — |
| Clics sur le lien en bio, inscriptions à la bêta (balise de suivi) | suivis à chaque post | — |

Relevé à J+2 de chaque post (courbe de rétention et statistiques), consigné dans `../SUIVI_PUBLICATIONS.csv`. Bilan hebdomadaire le lundi : quelles rubriques on garde, lesquelles on refait.

## Leçons déjà apprises
- **Séries IA avec dialogue.** Écartées au départ, puis rouvertes par Samuel le 21 octobre pour un pilote encadré, la Famille Pépin :
  - un seul décor ;
  - des voix faites à part ;
  - un critère d'arrêt sur l'accroche ;
  - pas d'épisode 2 tant que l'épisode 1 n'a pas passé les seuils.
- **Les captures d'écran de l'app** ne suffisent jamais seules. Il faut :
  - des plans courts de 0,5 à 2 s ;
  - des légendes de 1 à 3 mots posées sur l'image ;
  - des inserts serrés sur un détail.
- **Les plans d'illustration IA** (mains et objets, ou personnages qui ne parlent pas) sont l'usage le plus sûr.
- **Ne jamais calquer un compte d'inspiration.** Le premier carrousel reprenait la mise en page et les formulations de STR8UP, et a été refait. On transpose une mécanique, on ne recopie ni le look ni le texte.

## Crédits Higgsfield
Avant toute génération, on présente le concept plan par plan avec son coût exact en crédits, et on attend le feu vert de Samuel. Aucune génération « pour voir ».

Coûts unitaires vérifiés :
- image `gpt_image_2_5` : 0,25 crédit ;
- plan Kling 3.0 standard de 5 s, en 9:16 et sans son : 7,5 crédits.
