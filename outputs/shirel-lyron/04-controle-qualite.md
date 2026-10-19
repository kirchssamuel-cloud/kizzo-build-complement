# Save the Date — Shirel & Lyron
### Contrôle qualité : méthode + revue des character sheets (v2)

---

## 1. La méthode — chaque livrable passe 3 portes avant de t'arriver

| Porte | Ce que je vérifie | Si ça ne passe pas |
|---|---|---|
| **A. Avant génération** : relecture du prompt | Les 12 points de la grille ci-dessous, un par un | Je réécris le prompt. Rien ne part |
| **B. Après génération** : contrôle image par image | Ressemblance (yeux, nez, sourcils, barbe, ligne des cheveux), mains (5 doigts), texte (kippa, Mazal), tenue, décor, lumière | Je corrige et je régénère. Tu ne vois pas les versions ratées |
| **C. Ta validation** | Je te présente le résultat, les points faibles éventuels et le coût dépensé | On ne passe pas à l'étape suivante sans ton OK |

**Grille de relecture d'un prompt (porte A) :**
1. L'identité est décrite précisément (traits physiques, pas des adjectifs flous)
2. Les références sont les bonnes photos, sans déformation (pas de fisheye, pas d'autre visage dans le cadre)
3. La tenue est complète de la tête aux pieds, conforme au script ou aux photos
4. Les accessoires réels sont présents (montre, colliers, piercings, kippa)
5. Le décor est fidèle au lieu réel (770, Ohel, plage de la photo 10)
6. La lumière est cohérente avec la scène et avec les plans voisins (raccord)
7. L'action est minutée seconde par seconde et faisable en une seule prise
8. Le mouvement de caméra est unique, simple et motivé
9. Les interdits sont listés (texte parasite, doigts en trop, autres visages nets)
10. Le respect religieux est vérifié (Ohel, kippa, tsitsit)
11. La durée et la résolution sont conformes au budget
12. Le raccord avec le plan précédent et le plan suivant est prévu

---

## 2. Revue des character sheets v1 → défauts trouvés

| # | Défaut dans ma v1 | Correction v2 |
|---|---|---|
| 1 | Références non triées : certaines photos sont en **fisheye** (12, 16), ce qui déforme le visage (nez agrandi, joues étirées) | Je les **exclus** des références d'identité |
| 2 | La photo 1 (couple enlacé) et la photo 11 (bout de visage de Shirel) mélangent deux personnes : risque de **fusion des visages** | Photo 11 recadrée et masquée. Photo 1 réservée à la tenue de la demande, jamais à l'identité |
| 3 | Photos de Shirel en maillot ou allongée (5, 8, 13) : angles extrêmes | Exclues. Je garde les 5 plus fiables : face, 3/4, profil, plan nuit, plan rue |
| 4 | Description du visage trop générique | Traits précisés : forme du visage, nez, sourcils, grain de beauté, taches de rousseur, implantation des cheveux, barbe |
| 5 | Aucune indication de **taille relative** : dans les plans à deux, Lyron serait trop petit ou trop grand | Ajouté : Lyron ~1,80 m, carrure solide ; Shirel ~1,63 m, silhouette fine ; le haut de sa tête arrive au niveau de son menton (d'après la photo 1) |
| 6 | La montre était décrite vaguement | Précisé : montre chronographe acier, cadran blanc, compteurs noirs (photo 11) |
| 7 | La v1 était prévue en 2K | Passage en **4K** (3 cr au lieu de 2) : le visage dans la grille gagne en définition, et la référence sera plus fidèle pour Seedance |
| 8 | Aucun **test en mouvement** prévu avant la production | Ajouté : **un test de 4 s en brouillon 480p** (~12 cr) pour vérifier que le visage tient en mouvement avant de lancer les 21 plans |

---

## 3. Références retenues (préparées, recadrées, pas encore envoyées)

| Shirel | Lyron | Objets |
|---|---|---|
| `shirel-front` (photo 2) · `shirel-front-night` (6) · `shirel-34` (7) · `shirel-street` (14) · `shirel-profile` (15) | `lyron-front-cafe` (3) · `lyron-front-selfie` (4) · `lyron-34` (11, recadrée et masquée) · `lyron-profile-kippa` (9) · `kippa` (18) | `bague` (17) · `deco-demande` (10) · `tenue-demande-couple` (1) |

---

## 4. Prompts v2

**Réglages :** `nano_banana_2_1` · 4K · 16:9 · 1 image · ~3 cr chacun

### Shirel
```
Professional character reference sheet, 16:9, pure white seamless studio background, soft diffused even studio lighting. LEFT THIRD: one full-body shot of the woman standing upright facing camera, neutral relaxed pose, arms at her sides, entire body from head to feet visible, not cropped. RIGHT TWO THIRDS: a clean 2x2 grid of head-and-shoulders portraits of the same woman: top-left front view, top-right three-quarter view turned to her left, bottom-left three-quarter view turned to her right, bottom-right strict side profile. IDENTITY: she is exactly the woman in the reference photos, same face and same proportions, faithful likeness, not idealized. Woman in her mid-twenties, about 1.63 m, slim natural figure. Olive skin with a warm sun-tan and many natural freckles scattered across her nose, cheeks and chest, a few small moles on her cheek. Oval face with defined cheekbones and a softly defined jaw. Straight nose with a defined bridge. Natural medium-full lips, rosy-nude. Thick, dark, well-groomed eyebrows with a soft high arch. Almond-shaped light hazel-brown eyes with green flecks, natural catchlights. Very dark brown hair, long past the shoulder blades, parted exactly in the middle, sleek at the roots with soft loose waves at the ends. Several small gold and diamond earrings and huggies along both ears, two thin layered gold necklaces with tiny diamond pendants, white French-tip almond nails, a white clover bracelet on her wrist. WARDROBE (neutral reference outfit): plain fitted black long-sleeve crew-neck top, black straight midi skirt, simple black ankle boots, no bag. REALISM: visible fine skin texture and pores, natural subtle asymmetry, light natural makeup, no beauty filter, no airbrushing, no plastic skin, no glossy highlights. Unretouched high-end photography, sharp focus. Single subject only, exactly one person repeated in each panel, no other people, no props, no text, no watermark, no frame borders, no extra fingers.
```

### Lyron
```
Professional character reference sheet, 16:9, pure white seamless studio background, soft diffused even studio lighting. LEFT THIRD: one full-body shot of the man standing upright facing camera, neutral relaxed pose, arms at his sides, entire body from head to feet visible, not cropped. RIGHT TWO THIRDS: a clean 2x2 grid of head-and-shoulders portraits of the same man: top-left front view, top-right three-quarter view turned to his left, bottom-left three-quarter view turned to his right, bottom-right strict side profile. IDENTITY: he is exactly the man in the reference photos, same face and same proportions, faithful likeness, not idealized. Man in his late twenties, about 1.80 m, solid stocky build with broad shoulders and a slightly full midsection. Light olive warm skin. Long oval face with a high forehead and a clearly receding hairline at the temples, short dark brown hair, slightly longer on top and swept back, short faded sides. Dark, thick, fairly straight eyebrows. Dark brown slightly deep-set eyes. Prominent straight nose with a slightly wide tip. Full lips. Ears slightly protruding. Short neatly trimmed dark beard, denser on the chin, connected to a short mustache, lighter on the upper cheeks. HEADWEAR: he wears the exact kippah from the reference photo: a black woven-fabric kippah, slightly domed, with white-silver embroidered Hebrew lettering running all the way around the rim; the lettering must be clean and crisp, matching the reference exactly. WARDROBE (neutral reference outfit): oversized plain white crew-neck t-shirt, white tzitzit strings hanging at both hips, loose black trousers, white sneakers, a steel chronograph watch with a white dial and black sub-dials on his left wrist. REALISM: visible fine skin texture and pores, natural subtle asymmetry, no beauty filter, no airbrushing, no plastic skin. Unretouched high-end photography, sharp focus. Single subject only, exactly one person repeated in each panel, no other people, no props, no text other than the kippah embroidery, no watermark, no frame borders, no extra fingers.
```

---

## 5. Points de contrôle après génération (porte B)

**Shirel** : taches de rousseur visibles, arche des sourcils, raie au milieu, couleur des yeux (pas trop verts, pas trop sombres), nez (pas affiné par l'IA), mâchoire (pas arrondie en visage de poupée).
**Lyron** : ligne des cheveux dégarnie aux tempes (l'IA a tendance à « rajeunir » les cheveux), forme de la barbe, nez, oreilles, carrure (pas amincie par l'IA), kippa : tissu noir mat, lettres blanches nettes.

Si un point échoue, je corrige le prompt avant de te montrer quoi que ce soit.
