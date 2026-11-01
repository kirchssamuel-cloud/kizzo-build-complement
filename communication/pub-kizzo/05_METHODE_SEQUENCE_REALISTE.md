# Méthode Higgsfield : une séquence réaliste, plan par plan (Seedream 5.0 Pro + Seedance 2.5)

Guide trouvé par Samuel sur Higgsfield et enregistré le 1er novembre 2026. Les gabarits de prompt sont gardés en anglais : c'est la langue dans laquelle les modèles comprennent le mieux, et ils se collent tels quels. Les leçons de notre pub (fichier 04) sont ajoutées à la fin, dont la seule chose que le guide n'explique pas : faire parler le personnage.

## Les 6 étapes du guide

### 1. Prévoir trois plans avant de générer
Un lieu, un événement simple, peu de personnages. Pour chaque scène, trois plans : un plan large qui pose le lieu, un plan moyen sur l'action, un gros plan sur la réaction. Un seul format pour toute la séquence (16:9 pour une pub, 9:16 pour les réseaux). Avant de générer, on écrit pour chaque personnage : le visage, les cheveux, la tenue, sa place dans le cadre ; et pour la scène : l'heure et la direction de la lumière. Le même personnage, le même manteau, le même sac et la même lumière doivent se retrouver sur les trois plans.

### 2. Créer une image crédible dans Seedream
Higgsfield Image, modèle Seedream 5.0 Pro, résolution 2K, le format choisi. Les fiches des personnages et des décors passent en références. Le gabarit, avec les crochets à remplacer :

```
A live-action cinematic still of [character] at [location], about to [simple action]. [Shot size], eye-level camera, natural perspective. Lit by [specific visible light source], with consistent shadows and restrained highlights. Natural skin texture, individual hair strands, believable fabric folds, and subtle environmental wear. [Weather and time of day]. Restrained color grading, realistic depth of field. Preserve the identity and wardrobe in the attached references. No text or beauty retouching.
```

La règle : décrire des détails physiques (la source de lumière visible, la texture de la peau, les plis du tissu, l'usure du décor) plutôt qu'empiler des mots comme « ultra-réaliste ». On génère quelques variantes et on garde celle dont l'anatomie, la lumière et la composition tiennent.

### 3. Corriger les détails, puis décliner les angles
On inspecte les yeux, les dents, les mains, les bords des objets, les reflets, la géométrie du fond. On renvoie l'image en référence et on demande **une seule correction à la fois** :

```
Correct [specific defect] in the attached image. Preserve the character's identity, clothing, pose, framing, lighting, and all unaffected details.
```

L'image approuvée devient la référence des autres plans : on ne change que le cadrage, en rappelant que le casting, la tenue, le lieu, la météo et la direction de la lumière ne bougent pas. Une image par plan, jamais un collage à animer. On compare les trois images côte à côte avant de continuer.

### 4. Animer un plan à la fois dans Seedance
Seedance 2.5, l'image approuvée en référence. **D'abord un test de mouvement : 5 secondes, même format, 720p.**

```
Use the attached image as the visual reference for this single continuous shot. [Character] performs [one simple action] with natural timing, subtle breathing, and believable weight shifts. The camera [one slow movement, or stays locked]. Preserve the face, clothing, scene layout, and light direction. [One environmental movement]. No cuts, sudden zooms, new objects, or exaggerated expressions. Audio: [quiet ambience and one matching sound], no dialogue or music.
```

Un mouvement retenu, un seul mouvement de caméra (ou aucun), un seul mouvement dans le décor (la pluie, un rideau). **Pas de dialogue dans ce premier test**, pour juger le réalisme physique séparément.

### 5. Vérifier le mouvement avant de monter en résolution
À vitesse normale, puis image par image sur les moments douteux : pieds qui glissent, visage qui change, objets qui plient, textures qui scintillent, ombres qui bougent seules. Un plan qui échoue se simplifie (action ou caméra) avant d'être relancé. Un défaut visible se corrige dans l'image de départ, pas dans la vidéo. Quand la direction tient, on génère en 1080p et on revérifie : **la résolution ne répare ni une dérive d'identité ni un mouvement cassé.**

### 6. Monter et finir le son
Plan large, puis moyen, puis gros plan, dans le logiciel de montage. On coupe les débuts et les fins instables, on raccorde l'exposition et la couleur, on garde le sens des regards, et on pose **une seule ambiance sonore continue** avec les bruits de la scène calés (pas, portes, objets). Export en MP4, visionnage complet une dernière fois : visages, mouvements, coupures de son, compression. On recommence le cycle pour chaque nouvelle scène, avec ses propres références.

---

## Ce que le guide ne dit pas : faire parler le personnage

Le guide sort volontairement le dialogue de l'étape 4 (« no dialogue or music ») : il s'ajoute après, une fois que le plan muet tient. Ce qu'on a appris sur la pub (fichier 04, G2 bis à G2 quater) :

1. **La voix et les lèvres sont générées ensemble, par Seedance, à partir d'une réplique minutée dans le prompt.** C'est ce qui donne la synchronisation la plus naturelle : le modèle « joue » la phrase, il n'anime pas une bouche sur un son posé après. Dans le prompt, la réplique est datée et décrite comme du son direct :
   ```
   She says at 10.7–12.6s: "Mes lasagnes !"
   SOUND — close, dry French dialogue, lip-synced, each line once at its stated time. No music, no narrator, no captions.
   ```
2. **Des répliques courtes.** Seedance déforme les phrases longues en français : un ou deux mots passent toujours, une phrase de 5 à 8 mots passe souvent, au-delà c'est la loterie. Une seule réplique longue par plan, placée vers la fin, et environ 5 syllabes par seconde.
3. **Une bouche visible et éclairée.** Le plan qui parle est un plan moyen ou un gros plan, à hauteur d'yeux, la lumière sur le visage. En plan large, on ne lit pas les lèvres et le défaut saute aux yeux.
4. **Une personne parle à la fois**, à quelqu'un de présent dans le plan ou qui l'entend. Les autres écoutent, bouche fermée.
5. **Une seule voix par personnage, d'un plan à l'autre.** La voix retenue au casting (Seed Audio, déduite du portrait) sert de référence audio à toutes ses répliques suivantes ; sinon elle change à chaque génération.
6. **Pour une vraie personne, sa vraie voix.** La voix clonée de Shmoulik sonnait faux ; un vocal enregistré au téléphone, nettoyé (débruitage, égalisation, compression, légère acoustique de pièce), a donné un meilleur résultat en référence audio. Et quand les lèvres restaient fausses, on a remplacé la bouche au montage et fait passer la réplique en voix off avec le texte à l'écran.
7. **Le montage fait le reste.** Les voix définitives peuvent être posées au montage sur l'audio généré (qui sert alors de guide pour les lèvres et les bruitages) ; les écrans sont générés en couleur unie puis incrustés.

Quand un plan parlé ne tient pas après deux essais : on le coupe sur celui qui écoute (champ-contrechamp), et la réplique passe hors champ. C'est ce que fait le cinéma, et personne ne le remarque.

---

## Ce que ça change pour la prochaine vidéo Kizzo

Notre pub a été faite autrement : des séquences de 15 s générées d'un bloc, chacune en prolongement de la précédente, une seule prise en 1080p. Ça garantit le raccord, mais un plan raté coûte toute la séquence. Le guide anime **un plan à la fois** depuis une image validée : plus de contrôle, plus de générations. Pour la prochaine vidéo, on combine :

1. **Le découpage du guide** : trois plans par scène, une image Seedream validée par plan, corrigée défaut par défaut. Nos fiches (Claire, Sam, Julie, Shmoulik, les décors) servent de références d'identité.
2. **Le test avant le rendu**, à l'économie : Seedance 2.0 Mini en 480p (0,5 crédit par seconde) pour vérifier le placement et le timing ; Seedance 2.5 en 720p (7 crédits par seconde) seulement pour les plans à risque, visages et dialogues ; puis Seedance 2.5 en 1080p (12 crédits par seconde) pour le rendu.
3. **Le prolongement reste pour les raccords dans le mouvement** (le match cut sur le tap, le volet), où deux générations séparées ne se raccorderaient pas.
4. **Le dialogue après le mouvement**, avec les 7 règles ci-dessus.

**Le budget, pour une vidéo de 45 à 60 s** : environ 12 plans de 4 à 5 s. Rendu 1080p : 550 à 720 crédits. Tests 720p sur 4 plans à risque : environ 140. Images Seedream, voix, et une reprise sur quatre : environ 200. **Compter 900 à 1 100 crédits.** Au 30 octobre, le compte en avait 84 : il faut recharger avant de lancer quoi que ce soit. Comme toujours, aucune génération sans le concept, le coût exact et le feu vert de Samuel.
