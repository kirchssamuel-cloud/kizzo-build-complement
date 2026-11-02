# Save the Date — Shirel & Lyron
### Dossier de production v1 — à valider avant toute génération

---

## 0. Ce qui change par rapport au brief (coûts réels mesurés sur Higgsfield)

Tarifs Seedance 2.5 relevés par pré-calcul (aucun crédit dépensé) :

| Rendu | Crédits / seconde | 8 s de vidéo |
|---|---|---|
| Brouillon 480p (`draft`) | 3 | 24 cr (~1,20 €) |
| 720p | 7 | 56 cr (~2,80 €) |
| 1080p | 16 | 128 cr (~6,40 €) |
| Image clé (Nano Banana 2.1, 2K) | — | 2 cr (~0,10 €) |

*(base : 4 000 cr ≈ 200 €, soit ~0,05 €/crédit)*

**Conséquence : on peut viser le 1080p partout et garder une marge énorme.** Le brief prévoyait « un seul essai par plan ». C'est la vraie source de risque : en vidéo IA, un plan réussi du premier coup, c'est rare. La bonne méthode coûte moins cher et sécurise :

1. **Image clé d'abord** (~0,10 €) : on valide le cadrage, les visages et le décor sur une image fixe, jusqu'à ce qu'elle soit parfaite.
2. **Brouillon vidéo 480p** (~1,20 € pour 8 s) : on valide le mouvement et le jeu d'acteur.
3. **Finalisation 1080p** du seul brouillon validé : même mouvement, en haute définition.

| Poste | Estimation |
|---|---|
| Character sheets + ~40 images clés (itérations comprises) | ~100 cr |
| 14 brouillons (~91 s de rushes) | ~275 cr |
| Finalisation 1080p (91 s) | ~1 460 cr* |
| Marge retakes (+30 %) | ~550 cr |
| **Total** | **~2 400 cr ≈ 120 €** |

\* Le prix exact de la finalisation d'un brouillon est à confirmer sur le premier plan ; je le vérifierai avant de lancer. Même en 1080p avec retakes, on reste sous les 150 €. En 720p, le total tombe à ~60 €.

**Tout le texte à l'écran (מזל, « 770 » si besoin, timer FaceTime, carton final) est ajouté en post-production, jamais généré par l'IA.** Les modèles vidéo déforment l'hébreu et les chiffres : c'est le défaut n°1 qui trahit une vidéo IA amateur.

---

## 1. Les 7 points que je dois valider avec le client AVANT de générer

1. **Shomer negia.** Par défaut, **aucun contact physique** dans aucun plan : ni main dans la main, ni étreinte, ni bague passée au doigt. Lyron tend l'écrin, Shirel le prend elle-même. À confirmer avec eux : une erreur ici serait rédhibitoire pour un couple Habad.
2. **Le Rabbi n'apparaît jamais à l'image.** Au Ohel, on ne montre ni le Tsiyoun ni la tombe : seulement l'approche, l'écriture et le dépôt des lettres (mains, dos, lumière). C'est plus respectueux et plus élégant.
3. **Apparence et pudeur.** Shirel : jupe sous le genou, manches au-delà du coude, encolure fermée (cheveux non couverts avant le mariage). Lyron : kippa ou chapeau noir ? barbe ? tsitsit visibles ? → les photos le diront ; je verrouille la tenue dans le character sheet.
4. **D'où vient Lyron ?** Ville et synagogue du Goral, ville de départ de son vol. Il faut aussi savoir s'il a un rôle précis dans le Goral (assis parmi les participants, nom lu par un rabbin ?).
5. **Format.** Un save the date circule surtout sur **WhatsApp et Instagram, donc en vertical 9:16**. Le 16:9 est meilleur pour un écran ou un vidéoprojecteur. On ne peut pas recadrer proprement de l'un à l'autre : **il faut choisir avant de générer.** Ma recommandation : 9:16 si l'envoi se fait d'abord par WhatsApp.
6. **Musique.** Un morceau qu'ils aiment ? Un nigoun arrangé (piano/cordes) serait parfait et cohérent. Il faut une musique **sous licence** (Artlist, Musicbed, Epidemic) : je ne peux pas utiliser un titre commercial sans droits.
7. **Photos.** Au lieu de 3-4 photos, **8 à 12 photos de chacun** : visage de face, 3/4 gauche, 3/4 droit, profil, sourire, plan taille, lumière naturelle, sans lunettes de soleil ni filtre. Cela permet d'entraîner un **Soul ID** Higgsfield (~10 min), ce qui donne la meilleure ressemblance possible sur toutes les images clés. Il me faut aussi **l'accord écrit des deux** pour l'usage de leur image (protection pour toi).

Petites infos utiles : l'année de la rencontre (Youd Chevat 5786 = février 2026 ?), le lieu de la demande au Vietnam si c'est un vrai souvenir (Hội An ? baie d'Hạ Long ?), et la ville en Israël (ou « ISRAËL » seulement, comme dans le brief).

---

## 2. Architecture du film — 62 s, 6 actes, 14 plans

Fil rouge visuel : **deux lignes qui se rejoignent.** Les actes 1 et 2 sont montés en parallèle (elle / lui), tantôt en alternance, tantôt en écran partagé. À partir du 770, ils partagent toujours le même cadre.

Palette : actes 1-2 froids (bleu d'hiver, lumière de février) → le 770 se réchauffe (soleil bas doré) → Vietnam chaud et luxuriant → Israël en lumière dorée de fin de journée. La lumière raconte l'histoire.

| Timecode | Acte | Plan | Durée générée | Utilisé au montage |
|---|---|---|---|---|
| 0:00–0:04 | 1 | 1A — Shirel, Paris, valise | 6 s | 4 s |
| 0:04–0:09 | 1 | 1B — Lyron, le Goral | 7 s | 5 s |
| 0:09–0:13 | 1 | 1C + 1D — hublots (écran partagé) | 5 s + 5 s | 4 s |
| 0:13–0:15 | 1→2 | Transition graphique : deux trajets vers New York | post | 2 s |
| 0:15–0:19 | 2 | 2A — Shirel marche vers le Ohel dans la neige | 7 s | 4 s |
| 0:19–0:23 | 2 | 2B — Lyron écrit sa lettre | 7 s | 4 s |
| 0:23–0:25 | 2 | 2C — Insert : מזל sur les deux lettres | 5 s + post | 2 s |
| 0:25–0:31 | 3 | 3A — 770 : les regards se croisent | 8 s | 6 s |
| 0:31–0:35 | 3 | 3B — Première conversation | 6 s | 4 s |
| 0:35–0:42 | 4 | 4A + 4B — FaceTime (habillage graphique + timer) | 6 s + 6 s | 7 s |
| 0:42–0:46 | 5 | 5A — Vietnam, baie d'Hạ Long | 7 s | 4 s |
| 0:46–0:52 | 5 | 5B — La demande, Hội An aux lanternes | 8 s | 6 s |
| 0:52–0:56 | 6 | 6A — Israël, la houppa prête au coucher du soleil | 8 s | 4 s + fond du carton |
| 0:56–1:02 | 6 | Carton SAVE THE DATE (post) | — | 6 s |

**91 s générées pour 62 s utilisées** : les marges permettent de choisir le meilleur moment de chaque plan et de régler les transitions au montage.

---

## 3. Script seconde par seconde + transitions

### ACTE 1 — Deux destins, un voyage (0:00–0:15)

**0:00–0:04 · 1A — Paris, aube.** Noir, première note de musique. Ouverture sur la fenêtre d'un appartement haussmannien, toits de Paris au petit matin. Shirel referme sa valise, prend passeport et carte d'embarquement, jette un dernier regard par la fenêtre et sourit, pleine d'espoir. Lent travelling avant. Lumière bleue de l'aube, lampe chaude à l'intérieur.
→ *Transition :* le zip de la valise qui se ferme (mouvement horizontal) raccorde avec la main du rabbin qui plonge dans la boîte du Goral (1B).

**0:04–0:09 · 1B — La synagogue, le Goral.** Salle d'étude, bancs en bois, étagères de livres. Un rabbin plonge la main dans une boîte et déplie un papier. Lyron est assis parmi des jeunes hommes. Le nom est lu, une seconde de silence, puis il réalise : les amis l'applaudissent, lui tapent sur l'épaule, il pose la main sur le cœur, incrédule et ému. Caméra à l'épaule douce, légers panoramiques. Lumière chaude de lustres.
→ *Transition :* coupe sur le rire de Lyron, puis la lumière blanche d'un hublot.

**0:09–0:13 · 1C + 1D — Deux hublots.** Écran partagé vertical : à gauche Shirel, à droite Lyron, chacun contre son hublot, au-dessus des nuages, lumière dorée. Ils regardent dehors, pensifs, sans savoir. Les deux plans sont tournés **en miroir** (elle regarde vers la droite, lui vers la gauche), de sorte qu'ils semblent se faire face sans le savoir.

**0:13–0:15 · Transition graphique (post).** Fond de nuages. Deux fines lignes dorées partent de Paris et de la ville de Lyron et convergent vers New York. Texte discret : *New York — Youd Chevat*.

### ACTE 2 — Le Ohel du Rabbi (0:15–0:25)

**0:15–0:19 · 2A — Shirel, neige de février.** Queens, après-midi d'hiver, fine neige. Shirel en manteau long et écharpe marche vers l'entrée du Ohel, une lettre pliée serrée contre elle. La caméra la suit de dos puis de 3/4. Flocons au premier plan, souffle visible dans l'air froid, recueillement.
→ *Transition :* les flocons au premier plan glissent vers le plan suivant (fondu sur le mouvement des flocons).

**0:19–0:23 · 2B — Lyron écrit.** Intérieur chaud du bâtiment d'accueil, longues tables, d'autres visiteurs flous en arrière-plan. Lyron, concentré, écrit à la main. Gros plan sur la main et le stylo, puis remontée vers son visage, les yeux fermés une seconde.

**0:23–0:25 · 2C — L'insert מזל.** Plan macro généré : une feuille manuscrite, la plume qui termine un mot. Le mot **מזל** est incrusté en post, à l'encre, avec un léger éclat doré. Écran partagé : la lettre de Shirel à gauche, celle de Lyron à droite, **le même mot au même endroit**, qui s'illumine en même temps. C'est le moment « frisson » du film.
→ *Transition :* les deux feuilles se plient, et le pli raccorde avec la façade du 770 (lignes verticales).

### ACTE 3 — La rencontre au 770 (0:25–0:35)

**0:25–0:31 · 3A — Devant le 770.** Eastern Parkway, Brooklyn, fin d'après-midi d'hiver, soleil bas doré, neige fondue sur le trottoir. La façade néogothique de brique rouge avec ses trois pignons. Plan large : Shirel sort, Lyron arrive en sens inverse, ils se croisent, s'arrêtent. Un regard, un sourire timide. La caméra se rapproche lentement (travelling avant). Les passants sont flous. **Distance respectueuse entre eux.**
⚠ Le « 770 » de la façade : je le vérifie sur l'image clé. S'il est déformé, je le corrige en post (incrustation suivie).

**0:31–0:35 · 3B — La première conversation.** Plan à deux, cadré à la taille, longue focale, fond flou doré. Ils parlent, elle rit, il baisse les yeux en souriant, la buée de leur souffle dans la lumière. Tout se joue dans les regards.
→ *Transition :* la lumière chaude se fond dans la lueur d'un écran de téléphone.

### ACTE 4 — L'amour à distance (0:35–0:42)

**0:35–0:42 · 4A + 4B — FaceTime.** Deux plans générés au format portrait, cadrés comme un selfie : Shirel la nuit sur son lit à Paris, guirlande lumineuse floue derrière elle ; Lyron la nuit, lampe de bureau. Chacun parle à son téléphone, rit, se cache le visage, rit encore.
Habillage en post : deux téléphones côte à côte, chacun affichant l'autre, avec **un timer d'appel qui s'emballe : 0:12 → 1:47:03 → 3:52:41**. Le fond passe du jour à la nuit et une horloge défile. On comprend les appels de 4 h sans un mot.

### ACTE 5 — Le Vietnam (0:42–0:52)

**0:42–0:46 · 5A — Baie d'Hạ Long, août.** Coucher de soleil, jonque en bois, pitons calcaires dans la brume dorée. Tous les deux à la proue, le vent dans les cheveux de Shirel, ils rient. Drone en recul latéral lent pour révéler l'immensité.

**0:46–0:52 · 5B — La demande.** Hội An à la nuit bleue, des centaines de lanternes en soie colorées, reflets sur la rivière. Lyron ouvre un écrin face à Shirel. Elle porte les mains à sa bouche, ses yeux se remplissent de larmes, elle hoche la tête : oui. Il rit de soulagement. Lent travelling circulaire. **Pas de contact :** elle prend l'écrin elle-même.
→ *Transition :* l'éclat de la bague (flare) devient le soleil d'Israël.

### ACTE 6 — Israël (0:52–1:02)

**0:52–0:56 · 6A — La houppa.** Israël, heure dorée, collines de Judée ou vue lointaine sur les remparts de Jérusalem. Une houppa blanche dressée sous des oliviers, voilages qui flottent, rangées de chaises, fleurs blanches, guirlandes allumées. **Aucun personnage**, ou bien eux deux de dos, côte à côte, à distance, face à la houppa. Lent travelling avant vers la houppa.

**0:56–1:02 · Carton final (post).** Sur la fin de 6A, ralentie et assombrie :

> SAVE THE DATE
> **Shirel & Lyron**
> 29.06.2027
> ISRAËL
> *Merci Rabbi*

Typographie : un serif élégant pour les prénoms, des capitales espacées pour le reste. Apparition mot à mot, la date en dernier. La musique se résout sur la dernière image.

---

## 4. Prompts Seedance 2.5

**Réglages communs :** `model: seedance_2_5` · `mode: omni_reference` · `generate_audio: false` (la musique est ajoutée au montage) · `draft: true` pour la validation, puis finalisation 1080p · `aspect_ratio` selon la décision du point 1.5.
**Médias de chaque plan :** `start_image` = l'image clé validée du plan ; `image_references` = character sheet de Shirel et/ou de Lyron.
Les prompts sont en anglais (Seedance comprend mieux l'anglais). Le **bloc de style commun** est ajouté à la fin de chaque prompt :

> **[STYLE]** Photorealistic live-action footage, shot on ARRI Alexa 35 with Cooke anamorphic lenses, natural skin texture with pores and subtle imperfections, true-to-life faces matching the reference identity exactly, soft film grain, gentle halation on highlights, shallow depth of field, cinematic color grade, 24fps natural motion blur. Modest clothing: the woman wears a skirt below the knee, sleeves past the elbows and a closed neckline. No physical contact between the man and the woman. No on-screen text, no logos, no subtitles, no watermark. Faces stay consistent and undistorted for the whole shot.

---

**1A — Shirel, Paris (6 s)**
```
Medium-wide shot inside a Parisian Haussmann apartment at dawn. The young woman from @image1 stands by a tall open French window overlooking Paris zinc rooftops and chimneys, soft blue dawn light outside, a warm table lamp glowing inside. 0-2s: she zips a small burgundy suitcase closed on the bed in one smooth motion. 2-4s: she picks up her passport with a boarding pass tucked inside and holds it to her chest. 4-6s: she turns her head toward the window, a quiet hopeful smile, the morning light catching her face. Camera: slow steady push-in on a dolly, eye level, 40mm. Mood: anticipation, tenderness, a new chapter beginning. [STYLE]
```

**1B — Lyron, the Goral (7 s)**
```
Warm interior of a traditional synagogue study hall in the evening, wooden benches, walls of leather-bound Hebrew books, brass chandeliers. About fifteen young men sit and stand around a table where an older rabbi with a grey beard draws a folded slip of paper from a wooden box. The young man from @image1 sits among them in the front row. 0-2s: the rabbi unfolds the slip and reads it, the room holds its breath. 2-4s: the young man freezes, eyes widening as he realizes his name was drawn. 4-7s: his friends burst into joyful applause and pat his shoulders, he laughs in disbelief and places his right hand on his heart, deeply moved. Camera: gentle handheld, slow push from a medium shot to a medium close-up on him, 50mm. Warm tungsten light, documentary realism, genuine joy. [STYLE]
```

**1C — Shirel, airplane window (5 s)**
```
Close-up of the young woman from @image1 seated by an airplane window, looking out to the right of frame at a sea of clouds lit by golden late-afternoon sun. Warm sunlight slides slowly across her face as the plane banks gently. 0-3s: she watches the clouds, lost in thought. 3-5s: a soft, hopeful smile appears. Camera: static, framed from inside the cabin, slight natural vibration, 85mm, cabin softly out of focus. Mood: quiet destiny, unaware. [STYLE]
```

**1D — Lyron, airplane window (5 s)**
```
Close-up of the young man from @image1 seated by an airplane window, looking out to the left of frame at a sea of clouds lit by golden late-afternoon sun, mirror composition of a matching shot. Warm sunlight slides slowly across his face. 0-3s: he gazes out, pensive. 3-5s: he exhales and smiles to himself, grateful. Camera: static, from inside the cabin, slight natural vibration, 85mm, shallow depth of field. Mood: quiet destiny, unaware. [STYLE]
```

**2A — Shirel, toward the Ohel (7 s)**
```
Winter afternoon in a quiet cemetery area in Queens, New York, light snow falling, bare trees, grey-blue February light, a low stone and brick entrance building ahead with a few visitors in dark coats. The young woman from @image1 in a long camel wool coat and cream scarf walks slowly toward the entrance, holding a folded handwritten letter against her chest with both hands. 0-3s: camera follows behind her at shoulder height. 3-7s: camera arcs gently to her three-quarter profile, her breath visible in the cold air, eyes lowered in reflection. Snowflakes drift in the foreground, out of focus. Mood: reverent, intimate, prayerful. Do not show any grave or tombstone. [STYLE]
```

**2B — Lyron writes his letter (7 s)**
```
Warm interior of a visitors' room with long wooden tables, other visitors softly blurred in the background writing quietly, snow visible through a window. The young man from @image1 sits writing a personal letter by hand on white paper with a black pen. 0-3s: extreme close-up of his hand writing flowing Hebrew-style cursive, letters unreadable and soft. 3-5s: camera tilts up slowly to his face, focused and sincere. 5-7s: he pauses, closes his eyes for a second, then folds the letter carefully. Camera: slow tilt and push, 65mm macro to medium close-up. Soft window light mixed with warm lamps. Mood: sincerity, hope. [STYLE]
```

**2C — Insert: the letter (5 s)** *(le mot מזל est incrusté en post)*
```
Extreme macro close-up of a sheet of white paper on a wooden table, soft warm side light. A black ink fountain pen finishes writing a short word in the center of the page, the ink still wet and glistening. The handwriting is soft and illegible, slightly out of focus around the edges. 0-3s: the pen lifts away. 3-5s: the camera drifts slowly over the wet ink. Very shallow depth of field, paper fibers visible. No readable text. [STYLE]
```

**3A — 770, the meeting (8 s)** *(image clé obligatoire pour valider la façade)*
```
Wide shot of 770 Eastern Parkway in Crown Heights, Brooklyn: the iconic three-gabled red-brick Gothic Revival facade, late winter afternoon, low golden sun, patches of melting snow on the sidewalk, a few passers-by softly blurred. 0-3s: the young woman from @image1 walks out along the sidewalk from the left while the young man from @image2 walks in from the right. 3-5s: they nearly pass each other, then both slow down and stop about one and a half meters apart. 5-8s: their eyes meet, a shy surprised smile, she tucks her hair behind her ear, he smiles back. Camera: slow push-in from wide to medium-wide, 35mm, golden backlight with soft flare. Mood: destiny, the first second of a love story. They do not touch. [STYLE]
```

**3B — First conversation (6 s)**
```
Medium two-shot on the sidewalk of Eastern Parkway at golden hour, telephoto 85mm compression, warm blurred red-brick background with soft bokeh. The young woman from @image1 and the young man from @image2 stand facing each other at a respectful distance, talking for the first time. 0-2s: he says something, she laughs naturally and looks down. 2-4s: she answers, animated, he listens with a growing smile. 4-6s: a shared laugh, their breath visible in the cold golden air. Camera: very slow lateral slide. Mood: warmth, ease, instant connection. They do not touch. [STYLE]
```

**4A — Shirel FaceTime (6 s, portrait)**
```
Vertical selfie-style framing as if seen through a front phone camera during a video call. Night, the young woman from @image1 lies on her side on a bed in a cozy Paris bedroom, warm fairy lights softly blurred behind her, her face lit by the cool glow of the phone screen. 0-2s: she listens and smiles. 2-4s: she bursts out laughing and covers her face with one hand. 4-6s: she peeks back at the screen, tender and sleepy. Slight natural handheld phone movement. [STYLE]
```

**4B — Lyron FaceTime (6 s, portrait)**
```
Vertical selfie-style framing as if seen through a front phone camera during a video call. Night, the young man from @image1 sits at a desk in a small room, a warm desk lamp behind him, books on a shelf, his face lit by the phone screen glow. 0-2s: he talks animatedly with his hands. 2-4s: he laughs and leans back in his chair. 4-6s: he leans closer to the screen with a tender smile. Slight natural handheld phone movement. [STYLE]
```

**5A — Hạ Long Bay (7 s)**
```
Aerial drone shot at sunset over Ha Long Bay, Vietnam in August: emerald water, towering limestone karsts fading into golden haze, a traditional wooden junk boat with rust-colored sails gliding slowly. 0-3s: drone approaches the bow where the young woman from @image1 and the young man from @image2 stand side by side, a little apart, leaning on the railing. 3-7s: drone slowly arcs sideways and pulls back to reveal the vast bay, the wind moving her hair and dress, both laughing and pointing at the horizon. Warm golden light, humid summer atmosphere. They do not touch. [STYLE]
```

**5B — The proposal, Hội An (8 s)**
```
Blue-hour evening in Hoi An ancient town, Vietnam: hundreds of glowing silk lanterns in red, amber and gold hanging over a narrow riverside street, reflections shimmering on the Thu Bon river. The young man from @image2 stands facing the young woman from @image1 at a respectful distance. 0-2s: he opens a small velvet ring box toward her, a diamond ring catching the lantern light. 2-5s: she brings both hands to her mouth, eyes filling with tears of joy. 5-8s: she nods yes again and again, laughing and crying, and takes the box from his hands without touching his fingers; he laughs with relief, hand on his heart. Camera: slow 90-degree orbit around them, 50mm, lantern bokeh everywhere. Mood: overwhelming joy, the emotional peak. No kiss, no hug. [STYLE]
```

**6A — Israel, the chuppah (8 s)**
```
Golden hour in the Judean hills of Israel, a distant view of Jerusalem stone in warm light. An elegant wedding chuppah of white flowing fabric and white roses stands under ancient olive trees, rows of empty white chairs, warm string lights beginning to glow, the fabric moving gently in the evening breeze. 0-8s: slow, steady dolly push-in toward the chuppah, the sun setting softly behind it with a warm lens flare. No people. Mood: promise, serenity, the future. Leave calm negative space in the upper third for a title. [STYLE]
```

---

## 5. Character sheets — méthode (une seule fois, réutilisés partout)

1. Tu me transmets 8 à 12 photos de chacun. Je les upload sur Higgsfield.
2. **Soul ID** de chacun (si le client accepte) : c'est l'identité la plus fidèle pour les images clés.
3. **Character sheet 16:9** par personne : face, 3/4 gauche, 3/4 droit, profil, plan pied **dans la tenue du film**. Un seul passage, validé par toi.
4. Chaque image clé de plan = Soul ID + sheet + description du décor. Validation image par image, puis animation Seedance avec `start_image` (l'image clé) + `image_references` (les sheets).

**Aucun visage définitif n'est généré avant la validation des sheets.**

---

## 6. Planning

| Étape | Qui | Durée |
|---|---|---|
| Réponses aux 7 points + photos | Client → toi → moi | — |
| Character sheets + validation | Moi → toi | ½ journée |
| 14 images clés + validation | Moi → toi | ½ journée |
| 14 brouillons 480p + validation | Moi → toi | 1 journée |
| Finalisation 1080p + retakes | Moi | ½ journée |
| Montage, étalonnage, titres, musique, transitions | Moi | 1 journée |
| V1 au client → retours → V2 | Toi / client | 2-3 jours |
