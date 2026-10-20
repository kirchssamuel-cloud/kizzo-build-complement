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
| 2 planches sourire | Porte B passée avec 2 réserves : dents de Shirel un peu trop blanches (à corriger dans les prompts) ; 4e vignette de Lyron écartée (clin d'œil involontaire) | 6 |
| Scène 1 : 6 images clés | 2 validées du premier coup (1.4, 1.5). Corrigées : 1.1 (regard caméra), 1.2a (guillemets parasites autour de « Lyron »), 1.2b (bouche ouverte = parole), 1.3 (2 valises, amies en pantalon, visage d'amie net : 2 passes) | 33 |
| Test en mouvement 1.4 (brouillon 480p, 5 s) | **Validé** : visage stable du début à la fin, vrai sourire qui s'ouvre (yeux qui se plissent, dents), kippa en dôme stable, tsitsit et montre présents, billet posé dans la valise, aucune parole, aucun regard caméra. Le pipeline image clé → Seedance est validé | 15 |
| Goral : 2 nouvelles images clés (plan large, main dans la boîte) | Validées du premier coup. Vigilance pour la vidéo : le rabbin a la bouche entrouverte, à garder silencieux dans le prompt | 6 |
| Goral v2 (adultes devant le rabbin, boulettes) + plan large v3 | Retours de Samuel appliqués, mais « filtre bizarre » relevé par Samuel : retouches en chaîne qui cumulent teinte chaude, contraste et netteté. Plan large v3 écarté (boîte) | 15 |
| Goral v4 : chapeau + couleurs neutres (4 images depuis les références d'origine, sans chaîne) | Porte B passée : chapeau noir retourné, boulettes, papier froissé « Lyron » lisible sans guillemets, assemblée adulte devant le rabbin, visage de Lyron conforme au sheet, couleurs naturelles. Plan large corrigé 1 fois : chapeau tenu à la verticale (les boulettes tomberaient) → tenu à plat comme un bol ; climatiseur retiré. Réserves : micro-texte illisible sur l'enveloppe (flou en vidéo, nettoyage en post si besoin) ; rabbin bouche légèrement entrouverte → « silent, mouth closed » dans le prompt vidéo | 15 |
| Scène 1 v5 « documentaire » : 7 images clés (remarque de Samuel : rendu pas assez réaliste) | Porte B : rendu nettement plus réel (lumière dispo, décor vivant, peau réelle). Corrections : papier « Lyron » bloqué par un faux positif du filtre → relancé ; 1.3 visage de Shirel trop éloigné du sheet (pas de taches de rousseur) → retouche inefficace → régénéré en plan rapproché, conforme ; 1.2a rabbin bouche ouverte + regards caméra → corrigé 1 fois | 30 |
| Brouillons vidéo scène 1 en 2 générations multi-plans (au lieu d'1 par plan) | A Shirel 5 s (1.1 → 1.3 → 1.5) `d1b107fd-aa17-4f49-8bff-2e78a4584948` · B Lyron 8 s (1.2a → b → c → d → 1.4) `c837a6ed-50c3-4c00-a916-877b5dbbdbbe` | 39 |
| Finalisation 1080p des 2 brouillons (validée par Samuel) | Conforme aux brouillons, mêmes coupes. A `299cceae-1a92-4e2e-88d7-371581963f93` · B `c3224931-ed28-4efe-96fa-d7f60c5e1004`. Montage 10 s : `scene1-1080p.mp4` (glance caméra de Shirel coupé au montage) ; rushes dans `rushes/` | 160–208 |
| Plan avion régénéré seul (720p, 4 s) | Décollage visible ; reflet d'objectif sur la dérive, pas un logo. Monté en v4 (12 s) | 28 |
| Sheets v3 (retours de Shirel : nouvelle photo pour elle ; Lyron plus mince, plus de cheveux) | Shirel `a52b22ef-4ea2-4803-8d1a-c5cc50aa9955` : cheveux longs ondulés caramel conformes, visage proche de la photo. Lyron `49dc0cfa-c025-4e15-a1fb-9e274d3641cf` : nettement plus mince ✓, mais les golfes restent visibles (cheveux pas assez) ; tsitsit ajoutés par l'IA alors que non demandés | 6 |
| Sheet Lyron v3b (correction validée par Samuel) | `cdb3db5e-e37b-4337-ae33-ee1222a64512` : tsitsit retirés ✓ ; golfes un peu comblés de face, mais toujours visibles de 3/4 et de profil | 3 |
| Sheet Shirel v3b « réaliste » (demande de Samuel : ça se voyait que c'était de l'IA) | `da688b2a-951a-4108-a7b6-d6e8cca2e108`, régénéré depuis sa photo (pas en chaîne) : fond papier gris, lumière de fenêtre, peau réelle, cheveux naturels avec frisottis et mèches folles, reflets discrets | 3 |
| Références v3 : 7 tenues + 2 planches sourire avec les nouveaux visages (style photo réelle, fond papier gris) | Toutes passées en porte B. Tenues conformes (T3 opaque, T6 imprimé losanges + jute, T7 SANS tsitsit, T5 avec tsitsit car New York, bague poire sur T4). Réserves : Lyron T5/T6 — les golfes réapparaissent un peu en gros plan (la planche d'origine tire vers l'ancien visage) → dans les prompts, toujours donner sheet v3b + planche sourire v3 et préciser « full dense hairline » ; vignette 3 de la planche sourire de Lyron : un œil un peu plus fermé, à éviter | 27 |
| Sheet Lyron v3c (Samuel : « il a encore pas de cheveux ») | `57396152-b3b6-4066-9266-05a17c57ee76`. Cause des échecs précédents : toutes les références montraient ses golfes. Correctif : visage recadré SOUS les sourcils (`0e2f1b8d-4b94-467f-baf1-acba0ba425a0`) + implantation décrite par écrit. Résultat : implantation basse et droite, tempes pleines sur toutes les vues ✓ | 3 |
| Sheet Lyron v4 d'après ses vraies photos (Samuel : v3c « pas du tout réaliste », regarder les vraies photos ; nouvelle photo réelle `f546c92d-daa2-4b2d-907c-ec0ab365a694`) | `7519d1e5-dd30-40f9-9861-97c767e5fea4` : très réaliste et reconnaissable, cheveux et kippa fidèles à la réalité. Défaut : les 2 vignettes du bas recopient la photo envoyée (pas de vrai profil) | 3 |
| Sheet Lyron v4b (golfes adoucis, vrai profil) — **VALIDÉ par Samuel** | `619af3ea-85ad-43a3-83e7-0760e588e65f` | 3 |
| Tenue Shirel scène 1 « jogging beige » | `041d0678-fbae-4f6d-9010-ea6fd267de44` — écartée (Samuel préfère le style sport-chic noir de ses photos d'inspiration) | 3 |
| Références v4 : Shirel T1 noir + Lyron T5, T6, T7, L1 (t-shirt) et planche sourire, depuis le sheet v4b | T1 `8308e0cc-02db-4317-a802-38fb8689d10e` · T5 `c174778e-d810-475b-9d0a-58cac5ae2a5e` · T6 `62877f13-97c5-421d-bfc7-daea3fcb3af7` · T7 `40d6d585-908e-4879-a5e9-67193ddbfc36` · L1 `6e7186aa-c8e3-4350-866c-759eb209c23f` · Sourires Lyron `31d708e0-3636-42c1-8aa3-e66644fccc9b` (en cours). Tenues conformes. Samuel : « plus tu génères, moins les visages ressemblent » → règle anti-dérive dans la bible | 18 |
| **Sheet de référence Lyron DÉFINITIF choisi par Samuel : `7519d1e5-dd30-40f9-9861-97c767e5fea4`** (v4, d'après ses vraies photos). Planche test L1 (t-shirt + jean) depuis ce sheet + 2 vraies photos uniquement | `0c9fc2a6-3684-4ffb-bc07-22f9a305c6e0` : comparaison côte à côte → visage identique au sheet ✓ | 3 |
| Références v5 Lyron (méthode anti-dérive : sheet `7519d1e5…` + 2 vraies photos + tenues recadrées sans tête) | T5 `db13a2f8-eae8-41b3-8ffc-75db13a188b2` · T6 `c9ee84e0-f33e-442f-ae8c-f311686a47b7` · T7 `c7bb5a35-651f-4002-a9a9-ece257937bff` · Sourires `4fa7710c-ef32-4a7e-a1eb-40c91fa0ad4e`. Comparaison côte à côte : même visage que le sheet sur les 3 tenues ✓. Sourires : vignettes 1, 2 et 4 bonnes ; vignette 3 (rire de 3/4) un œil plus fermé → à éviter | 12 |
| Sheet Lyron : ajout du profil par montage (v4 + 3/4 et profil du v4b) → `47cb751b-7007-4bf4-a6a7-ebbef581ed25` | Sans génération | 0 |
| Planche test Shirel T1 (ensemble noir) depuis sheet `da688b2a…` + vraie photo | `accd5f3b-32e9-49da-91eb-f68daf953b4c` : visage identique au sheet ✓ ; petit logo « N » sur les baskets (à ignorer ou flouter) | 3 |
| Shirel T1 sans sac (demande de Samuel) | 1er essai échoué côté Higgsfield (remboursé) ; 2e : `e38c01ef-40d5-47a2-afbc-776a7ba2cd00` ✓ sans sac, sans logo, visage = sheet. T2/T3/T4/sourires d'hier conservés après comparaison (même visage que le sheet) → 12 cr économisés | 3 |
| Scène 1 v5 : 6 images clés (prompts de la version validée, nouveaux visages/tenues) | 1.1 `0ac3314d-d3c1-417a-8cbe-2295ef138c9c` · 1.2a `2574696a-7b07-40b0-8500-31df49febc47` · 1.2d `074eedac-a8ac-43d9-a82d-89414ee16c10` (1er essai échoué, remboursé ; relancé avec gros plan kippa `c0115fde…`) · 1.3 `0173a11b-954c-4717-9e1f-63b7352676a1` · 1.3b `f74d9561-bafa-49a5-9b8d-74d505f99d91` · 1.4 `889beb73-fe1f-47e4-83f0-34db3d0e3c28`. Kippa : nettement mieux sur 1.2d mais 1-2 lettres imparfaites ; 1.2a et 1.4 faites sans le gros plan kippa (lettres approximatives). 1.3 : cheveux un peu plus courts que le sheet | 18 |
| 1.2a refait à neuf (Samuel : « filtre bizarre » — cause : retouche d'une image déjà retouchée, violation de la règle A2) + 1.4 refait avec le gros plan kippa | 1.2a `d5479c71-3b77-41e6-962b-00e45304498a` : couleurs naturelles, kippa lisible (« אדוננו »), rabbin bouche fermée ✓ · 1.4 `96d693e0-702e-456c-aa5e-295987dcb765` : kippa lisible (« יחי אדוננו »), visage conforme ✓ | 6 |
| Test 1.4 (kippa à la bonne taille + golfes atténués) | `3cd4f51c-23c8-4aa9-836a-ad3ebaba5017` : kippa nettement plus petite, proche du sheet, lettres lisibles ; golfes à peine visibles ✓. Décor encore sale (ancien prompt) → image de test seulement | 3 |
| 3 plans Lyron finaux (petite kippa, golfes atténués, chambre propre) | 1.4 `56e1eebd-23ac-4e88-ac2a-21fbcec6dd52` ✓ chambre propre, petite kippa lisible, golfes à peine visibles · 1.2d `23cc3797-0a4e-444f-91b5-5f775c1773d6` : petite kippa ✓ mais golfes encore assez visibles · 1.2a `26f389e7-333a-40ce-9a0c-11ce4915eb91` : ÉCHEC, la retouche n'a pas réduit la kippa (identique à avant) | 9 |
| Retouches ciblées par masque (inpainting) | 1.2d `d9cf4b73-d1b9-4f51-9fbf-b2f77e5257a4` : tempes nettement plus garnies ✓, reste identique (légère teinte plus chaude) · 1.2a `c60ac9c1-9efc-4f77-9347-ffa4364e3a26` : kippa à peine réduite (changement minime) | 6 |
| Vidéos 720p scène 1 v5 (Samuel : « je préfère la version 1 largement ») | Shirel `8b130048-867d-4936-ae39-42773065e9e9` · Lyron `4e5d8db4-69dd-4684-ac3f-8ab267329613`. Analyse : lumière trop froide, 720p moins net, valise trop large, Shirel presque face caméra → gardées comme brouillons de référence | 91 |
| 2 images clés refaites (chaleur + cadrage) | 1.4 `006a0b81-2452-44f0-9331-c8555659928b` plan rapproché, lampe chaude, chambre propre, petite kippa ✓ · 1.3 `b0ca30ec-4bce-4d3d-a072-053ba1156d07` lumière dorée, regard vers l'amie ✓. Décision Samuel : main + papier « Lyron » repris de la v1 1080p au montage | 6 |
| 1.3 refait avec un sourire doux (Samuel : pas de grand rire, on ne connaît pas son vrai rire) | `bed90f25-c1ce-476c-a381-6bb5e6b98004` : sourire doux comme sur sa photo, regard vers l'amie, lumière dorée ✓ | 3 |
| Vidéos 1080p scène 1 v5 (prompts passés à la checklist) | Shirel `643f77a6-d427-46ff-9f97-7cc59178bc7a` (5 s) · Lyron `e894c8c7-e709-4cf1-96ab-a50baf00e8ec` (6 s). Montage 11,67 s livré. Défauts relevés : salle de la réaction différente du plan large, billet 0,5 s seulement, pas de plan d'ouverture sur Paris | 176 |
| 2 images clés (demande de Samuel) | Toits de Paris à l'aube `ecdbe0f6-7f79-4560-a4a1-658cede9901b` ✓ · Réaction dans la même salle que le plan large `456d4131-f199-4b09-bc01-67234ab2ef0e` ✓ (murs en pierre, bibliothèques, lustres, même foule, petite kippa) | 6 |
| 2 vidéos 1080p de 4 s (ouverture Paris + réaction) | Paris `5691cee7-420b-48e6-ab25-665dc66ecdb2` · Réaction `abd1e9af-8c8f-4cf7-b5dc-98c0cdfa8873`. Le billet est retiré du montage | 128 |
| Séquence 2 · planche T2 Shirel v6 (blazer cintré) | `5fba4790-25ba-4809-963b-e29d2bdd3abf` — finalement retenue par Samuel (« il était bien, on dirait juste pas que c'est noir ») → teinte bleu marine corrigée en noir pur en local, sans génération | 3 |
| Séquence 2 · planche T2 Shirel v7 (vrai blazer : croisé, 6 boutons dorés métalliques, revers en pointe, coupe longue) | `b097245a-45e8-4d48-a336-a86dbb25b3be` · visage = sheet ✓ — écartée (Samuel préfère la v6) | 3 |
| Séquence 2 · image test 2.7 (Lyron au taxi jaune devant l'Ohel) | `5613b3bb-3f45-4281-9fe3-1cf396f33619` : façade fidèle (auvent, marches, muret, haies sous la neige), taxi jaune, visage = sheet, petite kippa, golfes discrets, tsitsit ✓ | 3 |
| Séquence 2 · 8 images clés | 2.0 `464d4cd7-e4c0-4e31-951d-815d4b6fc561` (1er essai `ec48de16` échoué côté Higgsfield) ✓ · 2.1 `1dbacdde-2784-485f-8678-36343def83ae` (cadrage différent de 2.4, petit pupitre au lieu de la longue table) · 2.2 `0ee26223-2081-44eb-ac2a-d827ac753cfa` ✓ · 2.3 `fd5ad7e0-8e0a-400a-a548-4419d1be0dfc` ✓ · 2.4 `d819a60c-2ae2-47db-b75e-0d4848a8114f` ✓ · 2.5 `19b8b42f-babc-4dec-b89e-4df9a8de74f9` ✗ Shirel nette et du côté des hommes, pas derrière le rideau de chaînettes · 2.6 `38a2f515-b883-4fec-8d25-44dcc42f7dfc` ✓ · 2.8 `68f6d225-1a99-4735-b2e9-c7e9c768b544` ✓ | 24 |
| Séquence 2 · 5 corrections (retours de Samuel) | 2.0a JFK (nouveau) `074545c3-53c2-49e6-8e53-a98bf8cf6768` ✓ · 2.0 Shirel monte le vrai escalier `ef5b17e7-3e3f-438a-af1a-a9ad01d6a7fa` ✓ (plaque murale à flouter au montage) · 2.3 Lyron monte le vrai escalier `de4bed14-752e-416c-bceb-158ebfc86133` ✓ · 2.2 Ohel avec les deux stèles `4b130a77-0ad4-4bd2-8a84-53cf12847199` ✓ (inscriptions à adoucir au montage) · 2.5 Lyron + Shirel derrière le rideau de chaînettes, stèles floues `86b3349d-3333-4483-848f-98c56a554b29` ✓ | 15 |
| Séquence 2 · 3 corrections (retours de Samuel) | 2.0 valise retirée par retouche ciblée (masque) `540b0a78-8b8c-4058-b73d-200f72c42e7a` ✓ main vide · 2.2 Shirel DEVANT le muret (plus dans l'enceinte), vue de 3/4 dos, stèles au fond `7b1e6102-9838-46a7-bf84-ac72d7abef15` ✓ · 2.5 Lyron devant le muret, rideau de chaînettes, Shirel côté femmes `94507209-cb93-40ac-a96b-f17318cc6df6` ✓ | 9 |
| Séquence 2 · 3 corrections (retours de Samuel) | 2.5 Lyron seul au muret, miroir de 2.2 `1f1bb7d1-f40c-4d8e-ac85-787a991c5992` ✓ · 2.6 Lyron de dos au taxi, Shirel reconnaissable `7717b149-7464-4987-b6d8-1a9d78b4b5e8` ✗ Shirel en double (une 2e femme en haut des marches) · 2.7 gros plan Lyron qui sourit en la regardant `ff17ff52-ac48-481f-ae34-ca6e90e06b6b` ✓ | 9 |
| **Total dépensé** | | **1 039 cr** |

**Références Shirel définitives (v5) :** sheet `da688b2a-951a-4108-a7b6-d6e8cca2e108` · photo réelle `5fc6f1cb-77f2-4008-902c-b8287a3862b6` · T1 voyage `e38c01ef-40d5-47a2-afbc-776a7ba2cd00` · T2 `0b9e3e4a-60aa-4238-befb-4832e5befcdf` · T3 `d951d6b5-89e3-4e50-8d18-107bcc6e47a5` · T4 `b8c2ecc2-d75c-4051-a160-1134c45960b7` · Sourires `39c2ea5a-757e-43e5-a729-688fda2fb476`.

**Références Lyron définitives (v5) :** sheet `7519d1e5-dd30-40f9-9861-97c767e5fea4` · L1 t-shirt `0c9fc2a6-3684-4ffb-bc07-22f9a305c6e0` · T5 `db13a2f8-eae8-41b3-8ffc-75db13a188b2` · T6 `c9ee84e0-f33e-442f-ae8c-f311686a47b7` · T7 `c7bb5a35-651f-4002-a9a9-ece257937bff` · Sourires `4fa7710c-ef32-4a7e-a1eb-40c91fa0ad4e`. Toutes les autres versions de Lyron sont dépassées.

Références v3 retenues : Sheet Shirel `da688b2a-951a-4108-a7b6-d6e8cca2e108` · Sheet Lyron `cdb3db5e-e37b-4337-ae33-ee1222a64512` · T1 `b5a37e57-b8e9-4f75-95ae-8ea99d1ea823` · T2 `0b9e3e4a-60aa-4238-befb-4832e5befcdf` · T3 `d951d6b5-89e3-4e50-8d18-107bcc6e47a5` · T4 `b8c2ecc2-d75c-4051-a160-1134c45960b7` · T5 `e523ee94-7f92-45f0-8f7e-bbc55f666d2b` · T6 `6fd4bbc4-94a1-40e9-9ed0-aef1640dde0b` · T7 `63f9c04c-49c1-4862-935f-21b1111828c2` · Sourires Shirel `39c2ea5a-757e-43e5-a729-688fda2fb476` · Sourires Lyron `3e410da5-d666-4c7c-a053-c29f05f095cb` · Photo de référence Shirel `5fc6f1cb-77f2-4008-902c-b8287a3862b6`. **Toutes les références v2 sont dépassées.**

Scène 1 v5 retenue : 1.1 `7aec71c4-07a5-4350-b04f-9daa6121bf9b` · 1.2a `7cb29bfe-410e-4c16-a6c3-81d380ecd02f` · 1.2b `988b7d2e-064b-4163-b051-f5b5cab5e607` · 1.2c `964cb851-ef38-421c-a19d-f68a6765d415` · 1.2d `21b054db-d211-45d7-bed2-1155a3e09973` · 1.3 `ec046ea6-f689-485b-b031-e400d127aee7` · 1.4 `2e282d56-2f14-42d1-83f3-4cc6b126bd57` · 1.5 `83635212-5452-4b9b-b6a5-879eb6d5228c` (inchangé). Toutes les versions précédentes de la scène 1 sont dépassées.

Goral retenu (v4) : 1.2a plan large `0ee87be9-aedb-483f-99c2-11aebd9e84e8` · 1.2b main dans le chapeau `219ec3e0-3cde-4220-b669-f37222838ff7` · 1.2c papier « Lyron » `f74a2044-0031-49ab-9d4a-a09450a21b0c` · 1.2d réaction `ca2ae380-1512-4797-bddd-697c81dd233b`. Toutes les versions précédentes du Goral sont dépassées.

Images clés scène 1 retenues : 1.1 `1ba5c7a2-c664-49c0-ab72-fd1c6fab6293` · 1.2a `f2610722-9751-434a-9696-599968d94dc2` · 1.2b `dce9bfaf-52d2-42a5-b4f1-311e3b8a74a2` · 1.3 `4af9cc7a-8bc6-49c4-88f5-054763e8693e` · 1.4 `764578d8-6900-4794-a786-d04cc404c362` · 1.5 `83635212-5452-4b9b-b6a5-879eb6d5228c`

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

---

## 9. Règles transverses pour tous les plans à deux (demande de Samuel)

**Proportions** (mesurées sur les photos 1 et 20) — bloc obligatoire dans chaque prompt où ils sont ensemble :
```
Height and build difference must match reality: he is about 20-25 cm taller than her; when both stand flat-footed, the top of her head reaches his mouth level; on tiptoe she barely reaches his chin. His shoulders are much broader and his frame much heavier than hers; she is slim with a small frame.
```
Références de proportions : photos 1 et 20 (`1a472817…`, `e0a6ee58…`). Contrôle en porte B sur chaque image clé à deux.

**Sourires** : sur tout plan où l'un d'eux sourit, ajouter en références la planche sourire et la photo réelle correspondante. Les grands sourires de Shirel sont cadrés de 3/4 ou de profil (les seuls angles documentés par ses vraies photos). Le sourire naît dans le plan (les yeux d'abord, puis la bouche), il n'est jamais plaqué.

Références sourire : Shirel `df24eeb2…` (bouche fermée 3/4), `57a3fdde…` (bouche fermée face), `85e1cb68…` (grand sourire 3/4), `96199618…` (rire de profil) · Lyron `d935a069…` (bouche fermée face), `d1027aca…` (grand sourire face).
