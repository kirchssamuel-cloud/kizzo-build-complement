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

---

## 6. Tenues de la demande — description verrouillée (photos 1, 10, 19, 20)

Ces descriptions remplacent celles du script v3 pour les plans 6.2 à 6.6. Elles serviront aussi à générer la planche de tenue « demande ».

**Lyron**
```
Oversized long-sleeve white shirt in a light, slightly sheer crinkled cotton-gauze fabric with a fine vertical texture, relaxed open collar, dropped shoulders, buttoned cuffs with small dark buttons, worn untucked and loose. Very wide-leg, floor-length flowing trousers in a bronze-brown fabric with a small dark geometric diamond-lattice print, pooling slightly over the feet. Dark navy leather slide sandals with wide crossed straps on natural jute espadrille soles. Black rectangular sunglasses. The black woven kippah with white embroidered Hebrew lettering around the rim and a small white embroidered emblem on the side panel. No watch visible.
```

**Shirel**
```
Fitted white long-sleeve mini dress in a soft, slightly sheer jersey, high round crew neckline, fitted bodice, short A-line skirt at mid-thigh. Turquoise beaded short necklace. Stacked thin gold bangles and several gold rings on her right wrist and hand. Multiple colorful seed-bead anklets on her right ankle, a green beaded anklet with a small charm on her left ankle. Dark brown knotted-fabric thong sandals on chunky double-layer padded black platform soles, white pedicure. Long dark brown hair worn loose, moving in the sea breeze.
```

**Décor (photos 10 et 20)** : grande plage de sable doré de Da Nang, mer turquoise, une colline boisée à gauche, une rangée de palmiers et d'hôtels blancs flous au loin, ciel de fin d'après-midi chaud. L'arche et la table sont décrites en section 6 du script v3.

**Contrôle à faire après génération** : imprimé losange du pantalon (pas de rayures, pas d'uni), semelles jute des sandales, transparence légère de la chemise, robe à manches longues **courte**, platform des sandales de Shirel, bracelets de cheville.

---

## 7. Journal de production

| Étape | Résultat | Crédits |
|---|---|---|
| Upload des 15 références | OK (après ouverture réseau de `upload.higgsfield.ai`) | 0 |
| Character sheets v1 | Rejetés en porte B : yeux de Shirel trop marron, mâchoire trop carrée, grille non conforme ; kippa de Lyron trop petite, lettres déformées | 6 |
| Character sheets v2 | Porte B passée : yeux noisette-vert, visage adouci, panneau sourire ajouté ; kippa en dôme, ressemblance forte. Reste : quelques lettres de la kippa imparfaites (correction prévue en post), grille de Lyron à 7 vignettes au lieu de 5 (sans impact) | 6 |
| 7 planches de tenue | 6 passées en porte B au premier essai. T3 refaite : la robe blanche était trop transparente, sous-vêtements visibles, inadapté pour une vidéo familiale religieuse ; version opaque, tous les détails conservés | 24 |
| **Total dépensé** | | **36 cr (~1,80 €)** |

Job IDs (pour réutilisation comme références) : Shirel v2 `3a64aa3c-6fec-40e3-b64d-cdc8c158ae8f` · Lyron v2 `0593f82b-883a-45b7-bcb6-7ef5d4b3f734`
Planches : T1 `cff1a83c-16f2-4070-8286-701e1f8b0532` · T2 `c16fc665-78db-4d91-b6dc-7c7943ce1174` · T3 `e0bd67ec-9f1e-4565-a33f-a3bd55f2ae90` · T4 `4d22cf0d-e386-46fb-8180-1622bd4b1e8a` · T5 `ba74f245-678b-49b9-8537-aba10325a66b` · T6 `313581d7-aae4-4d6f-bac4-edecebb08622` · T7 `ab1c55f8-0afc-4220-a382-d5bbad8a68c6`

---

## 8. Planches de tenue — prompts (porte A passée, en attente de feu vert)

**Réglages communs :** `nano_banana_2_1` · 4K · 16:9 · ~3 cr chacune · références : **sheet validé** (job ID) + références de tenue quand elles existent.

**Gabarit commun** (début de chaque prompt) :
> Wardrobe reference board, 16:9, pure white seamless studio background, soft diffused even studio lighting. Exactly four panels: LEFT: full-body front view standing straight, head to feet visible. CENTER-LEFT: full-body back view, head to feet visible. RIGHT COLUMN: two stacked detail close-ups (top: upper body and accessories; bottom: shoes and lower legs). The person is exactly the same person as in the character reference sheet: identical face, hair, skin, freckles and proportions. Visible real skin and fabric texture, unretouched photography. Single subject only, no other people, no props, no text, no watermark.

Puis, pour chaque planche :

| # | Planche | Références | Description de la tenue |
|---|---|---|---|
| **T1** | Shirel · Départ de Paris (1.1, 1.3) | sheet Shirel | Long camel double-faced wool coat worn open, cream chunky ribbed turtleneck sweater, long dark chocolate-brown pleated midi skirt below the knee, brown leather knee-high boots, small gold hoops and her layered gold necklaces, hair loose. |
| **T2** | Shirel · Ohel + 770 (2.1, 2.2, 3.x) | sheet Shirel | **Fitted black long-sleeve midi dress below the knee, tailored single-breasted black wool blazer worn over it, black leather knee-high boots with a low block heel**, thin layered gold necklaces, small earrings, hair loose. *(Tenue imposée par le client.)* |
| **T3** | Shirel · Demande (6.x) | sheet Shirel + photos 1, 20 | Fitted white long-sleeve mini dress in soft slightly sheer jersey, high round crew neckline, short A-line skirt at mid-thigh; turquoise beaded short necklace; stacked thin gold bangles and gold rings on the right hand; colorful seed-bead anklets on the right ankle, green beaded anklet with a small charm on the left ankle; dark brown knotted-fabric thong sandals on chunky double-layer padded black platform soles; white pedicure. |
| **T4** | Shirel · Israël (7.1, 8.1) | sheet Shirel | **Long white fitted maxi dress, close to the body, floor-length**, long sleeves, elegant matte crepe fabric, delicate gold jewelry, the pear-diamond engagement ring on her left ring finger, flat white sandals, hair loose and glossy. |
| **T5** | Lyron · Ohel + 770 (2.3, 2.4, 3.x) | sheet Lyron + kippa | **Black matte quilted puffer jacket (doudoune), black joggers, Asics sneakers in silver-white with grey details, white tzitzit strings hanging at the hips, the black kippah with white embroidered lettering.** *(Tenue imposée par le client.)* |
| **T6** | Lyron · Demande (6.x) | sheet Lyron + photos 1, 19, 20 + kippa | Oversized long-sleeve white shirt in light slightly sheer crinkled cotton-gauze with fine vertical texture, relaxed open collar, buttoned cuffs with small dark buttons, untucked; very wide-leg floor-length bronze-brown trousers with a small dark geometric diamond-lattice print; dark navy leather slide sandals with wide crossed straps on natural jute espadrille soles; black rectangular sunglasses; the black kippah with white embroidered lettering and a small white emblem on the side. |
| **T7** | Lyron · Israël (7.1, 8.1) | sheet Lyron + kippa | **Oversized white shirt with white tzitzit worn underneath (strings visible at the hips), oversized white linen trousers, camel leather sandals, the black kippah with white lettering embroidered all around.** *(Tenue imposée par le client.)* |

**Contrôle après génération (porte B) :** visage identique au sheet, longueur des robes (T2 et T4 longues, T3 courte), imprimé du pantalon T6, semelles jute, tsitsit visibles (T5, T7), kippa en dôme avec lettres blanches, bague poire (T4).

Le pull Kith (plan 6.1, une seule apparition) n'a pas de planche : il est décrit directement dans le prompt du plan, avec la photo officielle Kith en référence.

**Coût : 7 × 3 = 21 cr (~1 €)**, plus d'éventuelles corrections.
