# Pub Kizzo « L'écran se mérite » — Bible de production

Référence analysée : « How To Prompt Like a Director Using Opus 5.5 + Seedance 2.5 (Full Workflow) », Higgsfield AI, 17 min.
Source des prompts originaux : page « Delivery ad » publiée par Higgsfield (lien dans la description YouTube).
Les prompts prêts à copier pour Kizzo sont dans `02_PROMPTS_HIGGSFIELD.md`.

---

## 1. Ce que fait la vidéo, étape par étape

La pub de référence (« Higgos », livraison de repas) suit trois amis affamés. Chaque tap sur un téléphone les transporte dans un pays différent (Venise, Mexique, Japon), puis un packshot de 4 secondes conclut sur la marque. Le réalisme vient moins du modèle que de la méthode : **on construit d'abord des assets figés, puis on écrit les scènes comme un réalisateur, à la demi-seconde près.**

| Chapitre | Ce qu'il fait | Outil | Pourquoi ça marche |
|---|---|---|---|
| 0:45 Mise en place | Crée un projet dans Cinema Studio avec trois dossiers : personnages, lieux, accessoires | Higgsfield Cinema Studio | Chaque asset approuvé devient une référence réutilisable (@char_mika, @loc_flat2…) |
| 1:00 Casting | Une fiche personnage par acteur : 3 panneaux 16:9 (portrait de face, tenue de face cou coupé, tenue de dos), fond gris neutre, lumière plate | Soul Cinema, puis retouche Seedream 5.0 Pro | Le visage n'apparaît qu'une fois, la tenue est lisible : le modèle vidéo ne mélange pas les identités |
| 3:15 Décors | Lieux vides en vue trois-quarts 16:9, construits **autour de l'action** : nombre exact de sièges, plats déjà posés, repères visuels | Soul Cinema, puis retouche Seedream | Un décor qui a 2 chaises pour 3 personnages casse toutes les prises suivantes |
| 6:34 Accessoires | Fiches multi-vues de l'objet fil rouge (le téléphone rouge), du packaging, du chat | Seedream 5.0 Pro | Un objet récurrent identique d'un plan à l'autre = continuité |
| 7:15 Écriture | Claude écrit les prompts vidéo avec un « skill » dédié (higgsfield-timed-prompts) | Claude (Opus 5.5) | Structure fixe : CAST, PROPS, LIEUX, LOOK, PLANS minutés, SON, CONTINUITÉ |
| 8:49 Génération | Scènes de 18, 19 et 4 secondes générées d'un bloc | Seedance 2.5 | Plusieurs plans dans une seule génération = même lumière, mêmes visages |
| 9:17 Problème : les persos changent de place | Plan large d'ouverture obligatoire + un repère derrière chaque personnage (étagère, fenêtre, lampe) | Prompt | « Alex a le chat » ne dit pas où il est assis. « Lampe rouge derrière Alex » le dit |
| 10:44 Transitions | Match cut sur le tap : même taille de visage, même pose, même objectif, même mouvement de caméra de part et d'autre de la coupe. Et volet par le premier plan : le dos d'un perso traverse l'écran et révèle le nouveau lieu | Prompt | L'œil suit le mouvement, le changement de décor paraît naturel |
| 13:28 Plans complexes | Carte de placement vue de dessus (blocking map) avec coordonnées en % et silhouettes colorées, jointe comme référence | Seedream + Claude | Sépare le « qui est où » du « à quoi ils ressemblent » |
| 15:13 Packshot 4 s | Produit net en premier, une seule mise au point vers le gag final, voix off dès la 1re image | Seedance 2.5 | Le produit est lu avant tout le reste |
| 16:20 Coût | Environ 2 100 crédits pour la pub complète, d'après les échanges sous la vidéo | — | Les commentateurs conseillent de tester en 480p avant le rendu final |

Point important : **la pub finale est un montage des meilleurs moments de plusieurs prises.** La scène 1 a été générée pour 18 s, il en a gardé 14. Il montre aussi ses prises ratées : c'est normal d'itérer.

Dernière étape : la version verticale. Il ne recadre pas le 16:9 (on perdrait l'action sur les côtés), il l'étend en haut et en bas avec l'outil Reframe de Higgsfield.

---

## 2. Les 7 règles à appliquer pour Kizzo

1. **Rien ne se génère en vidéo tant que les assets ne sont pas validés.** Personnages, décors, tablette : on approuve chaque image avant d'écrire une scène.
2. **Un plan large d'ouverture par lieu**, avec un repère fixe derrière chaque personnage.
3. **Un objet fil rouge** : la tablette orange Kizzo. Elle passe de main en main et déclenche chaque transition.
4. **L'écran n'est jamais visible.** L'IA déforme les interfaces. Les vrais écrans de l'app seront incrustés au montage. C'est la règle la plus importante pour nous, car notre produit est une interface.
5. **Timecodes au dixième de seconde** pour chaque réplique et chaque geste. Répliques courtes.
6. **Transitions par le mouvement** : match cut sur le tap, volet par le dos d'un personnage.
7. **On teste en 480p**, on garde les meilleures prises, on ne monte en qualité que sur les prises retenues.

---

## 3. Le concept

**Idée** : dans la pub de référence, chaque tap fait voyager vers un plat. Chez Kizzo, **chaque bonne réponse fait voyager vers ce qu'on vient d'apprendre.** Le quiz n'est plus une corvée avant l'écran, c'est déjà l'aventure.

**Pourquoi ce concept** : il montre le produit sans montrer l'interface, il transforme le conflit écran en moment drôle, et la chute retourne la situation sur le parent. C'est notre message central : l'écran se mérite, et c'est le moment d'apprendre.

**Titre de travail** : « Jupiter ».
**Durée** : master de 50 s environ (site, YouTube, LinkedIn), version courte de 25 s en 9:16 (Instagram, TikTok).
**Ton** : comédie familiale, complice, jamais moralisatrice. Les enfants ne sont pas punis, le parent n'est pas le méchant.

### Le casting

| Personnage | Âge | Signes distinctifs (à ne jamais changer) | Jeu |
|---|---|---|---|
| Sarah, la mère | 38 ans | Cheveux châtains ondulés aux épaules, gilet bleu marine en grosse maille, t-shirt blanc, jean clair, chaussettes beiges | Calme, un peu fatiguée, humour sec |
| Nina, la fille | 9 ans | Cheveux bouclés en deux macarons avec chouchous orange, haut rayé vert et crème, salopette en jean | Vive, sûre d'elle, malicieuse |
| Tom, le fils | 7 ans | Cheveux courts bouclés, sweat à capuche rouge uni, jogging bleu marine | Impatient, théâtral, drôle |

Pourquoi ces choix : trois silhouettes reconnaissables même de loin (bleu marine, vert rayé, rouge). Le bleu marine et l'orange reprennent la charte Kizzo. Pas de motif imprimé ni de texte sur les vêtements, car l'IA les déforme d'un plan à l'autre.

### Les décors

| Lieu | Rôle | Placement (identique dans les trois lieux) |
|---|---|---|
| Salon haussmannien, dimanche pluvieux | Le conflit, puis le retour au calme | Sarah à gauche dans un fauteuil cognac, Nina au centre sur un canapé en velours vert sauge, Tom à droite sur un gros coussin de sol bleu marine |
| Module d'observation d'une station spatiale | Récompense de la 1re bonne réponse (Jupiter) | Même placement, sur des sièges blancs. Jupiter dans le hublot derrière Nina |
| Plateau de Gizeh au coucher du soleil | Récompense de la 2e bonne réponse (l'Égypte) | Même placement, sur trois blocs de calcaire |

Repères fixes dans le salon : bibliothèque derrière Sarah, fenêtres sous la pluie derrière Nina, monstera et lampe globe orange derrière Tom.

### Les accessoires

- **La tablette** : coque silicone orange #F97316 avec poignée de transport, sans marque. Écran toujours tourné vers le personnage.
- **La clémentine** : posée à côté de Nina sur le canapé, elle flotte dans l'espace, puis Nina la récupère en Égypte. C'est le gag visuel qui relie les trois mondes.

---

## 4. Le script

### Scène 1 — Salon vers l'espace (17 s)

| Temps | Image | Son |
|---|---|---|
| 0,0–1,5 | Plan large fixe du salon. La pluie sur les vitres. Tom affalé sur son coussin, Nina avec la tablette sur les genoux, Sarah qui lit | Pluie, silence |
| 1,5–4,0 | Sarah ferme son livre | SARAH : « Allez, on éteint les écrans. » |
| 4,0–6,0 | Contre-plongée sur Tom qui se renverse en arrière, mains sur le visage | TOM : « Nooon… » |
| 6,0–12,3 | Lent travelling avant sur Nina. Elle lève un doigt, lit la question à voix haute, réfléchit, répond et tape l'écran | NINA : « Attends, j'ai Kizzo ! » « Quelle est la plus grande planète du système solaire ? » … « Jupiter ! » |
| 12,3–17,0 | **Match cut sur le tap** : même cadre, même mouvement, Nina est dans la station spatiale. Jupiter remplit le hublot. La clémentine s'élève et flotte. La caméra recule et révèle Sarah et Tom, bouche bée | NINA (chuchoté) : « Wouah… » Bourdonnement de la station |

### Scène 2 — Espace vers l'Égypte, retour au salon (17 s)

| Temps | Image | Son |
|---|---|---|
| 0,0–1,5 | Plan large de la station, tout le monde à sa place, la clémentine flotte | Bourdonnement |
| 1,5–3,0 | La main de Tom entre dans le champ et prend la tablette. Panoramique filé vers lui | TOM : « À moi ! » |
| 3,0–7,2 | Tom lit lentement, le doigt sur l'écran, puis répond et tape | TOM : « Les pyramides… c'est dans quel pays ? » … « En Égypte ! » |
| 7,2–10,0 | **Match cut sur le tap** : Tom est assis sur un bloc de calcaire, les pyramides derrière lui, le vent dans les cheveux. La caméra recule : Nina rattrape la clémentine, Sarah se protège du soleil | Vent chaud, sable |
| 10,0–13,5 | **Volet** : la caméra passe derrière Sarah, son dos bleu marine traverse l'écran et révèle le salon. Tout le monde est revenu à sa place | Retour de la pluie |
| 13,5–17,0 | Plan à hauteur de table, les trois visibles. Tom brandit la tablette, Nina lève les bras, Sarah hausse un sourcil, impressionnée | TOM : « Vingt minutes débloquées ! » NINA : « Ouais ! » |

### Scène 3 — La chute (9 s)

| Temps | Image | Son |
|---|---|---|
| 0,0–2,0 | Sarah se penche vers les enfants | SARAH : « Et moi, j'ai droit à combien ? » |
| 2,0–5,0 | Tom, malicieux, tablette en main | TOM : « Réponds d'abord. La capitale de l'Australie ? » |
| 5,0–6,5 | Sarah, très sûre d'elle | SARAH : « Sydney ! » |
| 6,5–9,0 | Les deux enfants, impassibles, en chœur. Mise au point sur Sarah qui se fige, puis éclate de rire | NINA et TOM : « Canberra. » |

### Scène 4 — Packshot (5 s) + carton final (3 s, au montage)

| Temps | Image | Son |
|---|---|---|
| 0,0–5,0 | Gros plan sur le dos orange de la tablette tenue par les deux enfants côte à côte sur le canapé, visages éclairés, souriants. La caméra recule : Sarah lit avec un thé, la pluie dehors, le calme | VOIX OFF : « Kizzo. L'écran se mérite. » |
| Carton | Fond bleu marine #0F172A, logo Kizzo, vrais écrans de l'app, « Bêta ouverte sur kizzo.fr », mention « Vidéo générée par IA » | — |

**Version courte 25 s (9:16)** : scène 1 jusqu'au « Wouah », la question et le match cut de Tom vers l'Égypte, la ligne « Vingt minutes débloquées ! », la chute « Canberra », puis le carton. Ajouter la question en texte à l'écran (typo Outfit, carte orange) pour les vues sans son.

---

## 5. Le plan de production

| Étape | Livrable | Outil | Validation avant de continuer |
|---|---|---|---|
| 1. Projet | Projet « Pub Kizzo Jupiter » avec dossiers personnages, lieux, accessoires | Cinema Studio | — |
| 2. Casting | 3 fiches personnages (prompts C1 à C3) | Soul Cinema, retouche Seedream 5.0 Pro | Visage identique sur la fiche, tenue complète, mains normales, pas de texte |
| 3. Décors | 3 lieux vides (prompts L1 à L3) | Soul Cinema, retouche Seedream | Exactement 3 places, repères visibles, lumière juste |
| 4. Accessoires | Fiche tablette (prompt P1) | Seedream 5.0 Pro | Coque orange, poignée, aucun logo |
| 5. Carte de placement | Vue de dessus (prompt B1), optionnelle | Seedream 5.0 Pro | À utiliser seulement si les persos changent de place |
| 6. Tests | Scènes 1 à 4 (prompts S1 à S4) en 480p, 3 à 5 prises chacune | Seedance 2.5 | Places fixes, visages stables, répliques dans le bon timing |
| 7. Rendu | Prises retenues en haute définition | Seedance 2.5 / upscale | — |
| 8. Voix off | « Kizzo. L'écran se mérite. » | Enregistrée à part (voix humaine ou génération audio) | Diction, ton chaleureux |
| 9. Montage | Master 16:9, carton final avec vrais écrans de l'app | CapCut, Premiere ou DaVinci | Musique et sous-titres ajoutés ici |
| 10. Vertical | Version 9:16 | Reframe Higgsfield (extension, pas de recadrage) | L'action reste entière |

Avec les assets dans Higgsfield, les références se citent avec @ dans le prompt vidéo (par exemple @char_nina). Les prompts du fichier 02 sont aussi écrits pour fonctionner en texte seul.

---

## 6. Les risques identifiés et comment les gérer

- **Enfants générés par IA.** Certains modèles refusent ou dégradent les visages d'enfants. Tester le casting de Nina et Tom en premier, avant tout le reste.
- **Dialogues en français.** La synchronisation labiale est meilleure en anglais. Garder des répliques très courtes. Si une réplique sort mal, la remplacer au montage par un plan où le personnage est de dos ou hors champ.
- **Transparence IA.** Depuis août 2026, l'AI Act européen impose d'indiquer qu'un contenu réaliste est généré par IA. TikTok et Instagram exigent aussi l'étiquette « contenu IA ». Mettre la mention sur le carton final et activer l'étiquette à la publication. C'est aussi une question de confiance avec les parents, notre cible. À faire valider par un juriste avant diffusion payante.
- **Publicité avec des enfants.** La pub vise les parents, pas les enfants. Les enfants ne poussent pas le parent à acheter, ils montrent le produit en usage. Rester sur cette ligne, conforme aux recommandations de l'ARPP sur l'enfant.
- **Promesse produit.** « Vingt minutes débloquées » doit correspondre à une fonctionnalité réelle de l'app. À valider avec Samuel et l'agence avant tournage.

---

## 7. Budget

L'auteur de la vidéo de référence annonce environ 2 100 crédits pour une pub de 40 s, d'après les échanges en commentaires. Notre pub fait un peu plus de 50 s, avec moins de décors et moins de figurants. Prévoir le même ordre de grandeur, et le diviser par deux en testant systématiquement en 480p.
