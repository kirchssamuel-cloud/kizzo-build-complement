# Pub Kizzo « Même les parents révisent » — Casting validé et prompts vidéo

Suite du script V2 (fichier 03). Les images sont dans `assets/`.

---

## 1. Assets générés

Les identifiants servent de référence dans les générations vidéo (champ « medias », rôle `image_references`).

| Asset | Fichier | Identifiant Higgsfield | Modèle | Statut |
|---|---|---|---|---|
| Claire | `assets/char_claire.jpg` | ce83c9d8-5631-4dfb-b710-56b377dbbe15 | Soul Cinema, retouche Seedream 5.0 Pro | Validée |
| Sam | `assets/char_sam.jpg` | 22a69b68-acb5-446f-bdb9-ff4427e424e3 | GPT Image 2.5, à partir du garçon déjà généré par Shmoulik (référence b636c324-8381-4371-b608-c9f6bec4377f) | Validé |
| Julie | `assets/char_julie.jpg` | 3d49a105-02a1-4f3c-ba29-b6a244146666 | Soul Cinema, retouche Seedream 5.0 Pro | Validée. Le panneau de dos garde la tête et les bras écartés, sans gêne pour la vidéo car le visage n'y apparaît pas |
| Shmoulik | — | — | Avatar à partir de ses photos | **À faire** |
| Salle à manger | `assets/loc_salle_a_manger.jpg` | 1e27ae7e-e328-4241-9342-4058f1ccf4ce | Soul Cinema | **À corriger** : supprimer les deux chaises du premier plan et éclaircir un peu (2,5 crédits) |
| Chambre de Sam | `assets/loc_chambre_sam.jpg` | 4c6e644d-1f83-4ea4-b409-91d1cf707c2b | Soul Cinema | Validée |
| Chambre de Julie | `assets/loc_chambre_julie.jpg` | beabd155-2eb2-46e5-a179-8bf81407a0d1 | Soul Cinema | Validée |
| Station spatiale | `assets/loc_station_spatiale.jpg` | fff51b17-7c24-4b9a-b040-2906518a816b | Soul Cinema | Validée |
| Rome | `assets/loc_rome.jpg` | 610c338e-28b2-4b1a-867a-28eb7a0107c6 | Soul Cinema | Validée |

Prompt de correction prévu pour la salle à manger (Seedream 5.0 Pro, mode édition) :

```
Edit this location still. Remove the two chairs in the foreground on the near side of the table, closest to the camera, and show the floor there instead. Keep everything else exactly the same: the table, the two chairs on the far side, one chair at each end, the kitchen, the lit oven with the dish inside, the window, the fridge with drawings, the pendant lamp. Make the dish visible in the oven look like a rectangular dish of lasagne with golden melted cheese. Raise the overall exposure slightly so faces will read well, keeping the warm evening mood. No people, no text.
```

---

## 2. Ce que coûte la vidéo

Prix relevés sur ton compte le 12 octobre 2026, pour 15 secondes en 16:9.

| Modèle | Qualité | Crédits pour 15 s | Usage |
|---|---|---|---|
| Seedance 2.0 Mini | 480p | 7,5 | Répétition : vérifier placement et timing |
| Seedance 2.0 Fast | 480p | 15 | Répétition plus fidèle |
| Seedance 2.5 | 480p ou brouillon | 45 | Vraies prises |
| Seedance 2.5 | 720p | 105 | Rendu final économique |
| Seedance 2.5 | 1080p | 180 | Rendu final |

**Budget à prévoir pour les 56 secondes** : environ 800 crédits pour un rendu final en 720p, et environ 1 050 en 1080p. Le calcul suppose deux répétitions et deux vraies prises par séquence. Le pack de 1 000 crédits couvre donc la pub.

---

## 3. Le protocole anti-gaspillage

1. **Aucune vidéo avant que toutes les références de la séquence soient validées.** Une mauvaise référence gâche toutes les prises.
2. **Répétition en Seedance 2.0 Mini 480p.** C'est six fois moins cher. On vérifie seulement que chacun est à sa place, que les répliques tombent au bon moment et que les transitions se font. La qualité ne compte pas à ce stade.
3. **Vraie prise en Seedance 2.5 brouillon 480p.** L'option brouillon permet ensuite de passer **la même prise** en 1080p dans les sept jours, sans relancer le hasard. On ne paie le haut de gamme que pour une prise déjà réussie.
4. **Un seul changement à la fois** entre deux prises. Sinon on ne sait pas ce qui a corrigé ou cassé le résultat.
5. **On ne relance pas une séquence pour un plan raté** si le montage peut le couper ou le cacher.
6. **Relecture avant chaque lancement**, avec la liste ci-dessous.

**Liste de contrôle avant de lancer :**
- La durée réglée dans Higgsfield correspond à la dernière seconde du prompt.
- Les timecodes se suivent sans trou ni chevauchement.
- Chaque réplique tient dans sa fenêtre, à environ 5 syllabes par seconde en français.
- Les places sont rappelées : Sam à gauche, Julie à droite, Claire au bout gauche, Shmoulik au bout droit.
- Aucun écran visible, aucune musique, aucun sous-titre.
- Les références sont jointes dans l'ordre annoncé en tête du prompt.

---

## 4. Les prompts vidéo

Réglages communs : modèle Seedance 2.5, mode `omni_reference`, format 16:9, audio activé. La voix de Kizzo n'est **jamais** générée : elle sera ajoutée au montage, donc les prompts laissent un silence à sa place.

Le bloc Shmoulik reste à compléter quand sa fiche sera validée.

### Bloc CAST commun (à coller dans G2, G3 et G4)

```
CAST — use these same people throughout the clip; match faces, hair and clothes exactly to the reference sheets.
Claire: 40, fair skin, light-brown eyes, chestnut hair in a loose messy bun with a few loose strands, small gold studs. Mustard-yellow apron over a navy crew-neck sweater with sleeves pushed up, mid-blue jeans, white sneakers. Always holds one plain wooden spoon in her right hand. Stern and tired at first, then delighted and competitive.
Sam: 10, fair skin with a light natural flush, warm brown eyes, soft features, light chestnut-brown medium-length tousled wavy hair with lighter sun-kissed strands. Forest-green hoodie, black over-ear gaming headset around his neck, charcoal joggers, black sneakers. Bored, then amazed.
Julie: 8, fair skin, green-hazel eyes, golden-blonde hair in two braids with a short fringe. Raspberry-pink sweatshirt under mid-blue denim dungarees, white sneakers. Sly, quick, deadpan.
Shmoulik: [À COMPLÉTER APRÈS VALIDATION DE SA FICHE — âge, peau, yeux, cheveux, barbe, tenue]. Relaxed presenter, deadpan humour, often looks straight into the lens. The family never sees him and never looks at him.

TABLET — one unbranded tablet in a vivid orange matte silicone kids' case with a carry handle on the top edge. Its screen always faces the person holding it; only the orange back faces the camera. Never show its screen. Never duplicate it.
SEATING — around every table, as seen from the establishing camera on the empty near side: Sam far side LEFT, Julie far side RIGHT, Claire at the LEFT end, Shmoulik at the RIGHT end. Change camera positions, never seats.
```

### G1 — L'appel et le verdict (13 s)

Références, dans cet ordre : Claire, Sam, Julie, salle à manger corrigée, chambre de Sam, chambre de Julie.

```
A 13-second live-action family comedy commercial, 16:9, photoreal. Weekday evening in a French family home: a mother calls her two children to do their homework, each is absorbed in a screen and doesn't hear, so she summons them to the dining table and confiscates the tablet. All dialogue is spoken in natural French.

REFERENCES — Image 1: Claire's character sheet. Image 2: Sam's character sheet. Image 3: Julie's character sheet. Image 4: the dining room with the open kitchen. Image 5: Sam's bedroom. Image 6: Julie's bedroom. Match faces, hair, clothes and rooms exactly to these references.

CAST
Claire: 40, fair skin, light-brown eyes, chestnut hair in a loose messy bun with a few loose strands, small gold studs. Mustard-yellow apron over a navy crew-neck sweater with sleeves pushed up, mid-blue jeans, white sneakers. Always holds one plain wooden spoon in her right hand. Stern, tired, dry.
Sam: 10, fair skin with a light natural flush, warm brown eyes, soft features, light chestnut-brown medium-length tousled wavy hair with lighter sun-kissed strands. Forest-green hoodie, black over-ear gaming headset, charcoal joggers, black sneakers. Absorbed, then sulky.
Julie: 8, fair skin, green-hazel eyes, golden-blonde hair in two braids with a short fringe. Raspberry-pink sweatshirt under mid-blue denim dungarees, white sneakers. Playful, then disgusted.

PROPS — TABLET: one unbranded tablet in a vivid orange matte silicone kids' case with a carry handle on the top edge; its screen always faces the person holding it, only the orange back faces the camera, never show its screen. CONTROLLER: one black game controller, only in Sam's room. WOODEN SPOON: one plain wooden spoon, always in Claire's right hand.

DINING ROOM — as Image 4: a long light-oak table; the open kitchen directly behind the far side of the table with a lit built-in oven holding a dish of lasagne; a tall window at the left; a white fridge with children's drawings at the right; a warm pendant lamp above the table. Two chairs side by side on the far side of the table, one chair at each end, nothing on the near side.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich natural colour, crisp focus. Warm tungsten light at home; cool blue monitor light in Sam's room; warm fairy lights in Julie's room. Physically plausible camera moves. No visible CGI, no film grain.

SHOTS
0.0–2.5s: Medium shot, 35mm, in the kitchen. Claire stirs a pot of tomato sauce on the hob with the wooden spoon, the lit oven with the lasagne beside her. At 0.6s she turns her head toward the hallway off-screen left and calls loudly at 0.7–2.2s: "Sam ! Julie ! Les devoirs !"
2.5–3.7s: Hard cut to Sam's bedroom as Image 5, dark, lit by the blue monitor. Medium three-quarter side shot: Sam in the gaming chair, the headset ON his ears, the controller in both hands, thumbs mashing, eyes locked on the monitor. He does not react. The monitor shows only an abstract colour blur, no readable interface.
3.7–4.9s: Hard cut to Julie's bedroom as Image 6. Julie lies on her stomach on the bed, small white earbuds in, holding the orange tablet with its screen toward her face, giggling silently, feet kicking in the air. She does not react.
4.9–6.5s: Hard cut back to the kitchen, same framing as the first shot. Claire stops stirring, slowly narrows her eyes, jaw set, the spoon still in her right hand, and says low and icy at 5.1–6.3s: "Salle à manger. Tout de suite."
6.5–8.5s: Hard cut to a locked 24mm establishing wide from the empty near side of the dining table, as Image 4. Sam sits on the far side LEFT and Julie on the far side RIGHT, both facing the camera with guilty faces; Sam's headset is now around his neck; Julie holds the orange tablet. The kitchen and the lit oven are behind them. Claire stands at the LEFT end of the table, the spoon in her right hand pointed at them. At 7.3s she leans in and takes the tablet from Julie with her left hand. No dialogue.
8.5–10.5s: Medium shot, 35mm, on Claire standing at the left end of the table, the window behind her. She holds the tablet flat against her chest, orange back to camera, spoon raised, and says firmly at 8.7–10.2s: "Deux heures d'écran. C'est fini."
10.5–13.0s: Low two-shot, 35mm, at table height, on Sam and Julie side by side, the kitchen softly blurred behind them. At 10.7s Sam drops his forehead onto the table while Julie rolls her eyes up, disgusted. Together at 10.9–11.5s: "Quoi ?!" Hold on their defeated faces until 13.0s.

SOUND — close, dry, natural French dialogue, lip-synced, each line spoken once at its stated time. Kitchen: sauce simmering, extractor hum. Sam's room: muffled game sounds leaking from the headset. Julie's room: faint tinny game music from the earbuds. Dining room: quiet room tone and one soft thud of Sam's forehead on the table. No background music, no narrator, no captions, no subtitles, no watermarks.

CONTINUITY — same faces, hair and clothes in every shot. Claire's spoon always in her right hand. One orange tablet, screen never visible. Seats fixed: Sam far side left, Julie far side right, Claire standing at the left end. The oven stays lit with the lasagne; no smoke yet.
```

### G2 — Le gel d'image et Shmoulik (10 s)

Références, dans cet ordre : Claire, Sam, Julie, Shmoulik, salle à manger corrigée.

```
A 10-second live-action family comedy commercial, 16:9, photoreal, in the same dining room. Time freezes; a presenter walks into the frozen scene, talks to camera about Kizzo, snaps his fingers, and time resumes as the family's tablet receives a notification. All dialogue is spoken in natural French.

REFERENCES — Image 1: Claire. Image 2: Sam. Image 3: Julie. Image 4: Shmoulik. Image 5: the dining room with the open kitchen. Match faces, hair, clothes and the room exactly.

[COLLER LE BLOC CAST COMMUN]

DINING ROOM — as Image 5: long light-oak table, the open kitchen with a lit oven holding a dish of lasagne directly behind the far side, a tall window at the left, a white fridge with drawings at the right, warm pendant lamp.

LOOK — clean modern digital cinema, 24–35mm lenses, warm tungsten evening light, natural skin texture, crisp focus. No visible CGI.

SHOTS
0.0–1.5s: Locked 24mm wide from the empty near side of the table. The whole family is completely frozen like a paused video: Sam with his forehead on the table on the far side left, Julie on the far side right with her eyes rolled up, Claire standing at the left end holding the tablet against her chest, spoon raised. No blinking, no breathing, hair and fabric perfectly still. Shmoulik walks in from frame right, the only thing that moves, and stops beside the right end of the table by 1.5s, facing the camera.
1.5–5.5s: Medium shot, 35mm, on Shmoulik at the right end of the table, the frozen family soft in the background at the left. He looks straight into the lens, relaxed, deadpan, and says at 1.7–3.4s: "Bloquer les écrans ? Ça marche jamais." Short beat. At 3.8–5.3s: "Il suffit d'installer Kizzo."
5.5–7.0s: Same framing. He raises his phone in an orange case and turns its screen toward the camera at 5.6s; the screen shows only a plain uniform bright green, nothing else. At 6.6s he snaps the fingers of his free hand.
7.0–10.0s: Back to the locked 24mm wide. On the snap everyone unfreezes at once: Sam lifts his head, Julie's eyes come down, Claire's arm relaxes. At 7.4s the tablet vibrates in Claire's hands with a short notification ding. She turns it toward herself, reads, eyebrows raised, intrigued, and at 8.6s hands it across the table to Sam. Shmoulik stays at the right end, hands in his pockets, a small satisfied smile. The family never looks at him. No dialogue.

SOUND — at 0.0s the room tone cuts to total silence while the family is frozen; Shmoulik's footsteps and voice are the only sounds. Close, dry French dialogue, lip-synced, each line once. One finger snap at 6.6s, room tone returns instantly, one soft notification ding at 7.4s. No music, no narrator, no captions, no watermarks.

CONTINUITY — seats fixed: Sam far side left, Julie far side right, Claire standing at the left end, Shmoulik at the right end. One orange tablet, its screen never visible. The phone screen shows only plain green. Same faces and clothes.
```

### G3 — Les deux voyages (17 s)

Références, dans cet ordre : Claire, Sam, Julie, Shmoulik, salle à manger corrigée, station spatiale, Rome.

```
A 17-second live-action family comedy commercial, 16:9, photoreal. A boy answers a quiz question on the family tablet and his tap transports the whole family to a space station facing Jupiter; then his sister answers and her tap transports everyone to a terrace facing the Colosseum in Rome. All dialogue is spoken in natural French. No voice ever comes from the tablet.

REFERENCES — Image 1: Claire. Image 2: Sam. Image 3: Julie. Image 4: Shmoulik. Image 5: the dining room. Image 6: the space station lounge. Image 7: the Rome terrace. Match faces, hair, clothes and places exactly.

[COLLER LE BLOC CAST COMMUN]

DINING ROOM — as Image 5, warm evening light, everyone in their seats.
SPACE STATION — as Image 6: a long white table with four white padded seats, a huge round window directly behind the far side filled with Jupiter, cool white LED light and Jupiter's amber glow. Normal gravity for people; only the wooden spoon floats.
ROME — as Image 7: a table with a red-and-white checked tablecloth and four plates of spaghetti, dark-green bistro chairs, the Colosseum behind the far side, hard warm sunlight, deep blue sky.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich colour, crisp focus. Physically plausible camera moves. No visible CGI.

SHOTS
0.0–4.0s: Medium close-up, 35mm, slow push-in, on Sam seated on the far side left of the dining table, holding the orange tablet in both hands, screen toward him. A soft chime at 0.2s. He listens silently from 0.3s to 2.6s, thinks with his eyes up from 2.6s, then says confidently at 3.2–3.8s: "Jupiter !" He taps the screen with his right index finger at exactly 4.0s.
4.0–8.0s: Hard match cut on the tap to the space station. Match Sam's pose, face size, frame position, lens and push-in speed across the cut; only location, light and sound change. Jupiter fills the window behind him. At 4.6–5.3s he whispers: "Wouah…" From 5.5s the camera pulls back to a wide from the empty near side of the table: Julie seated far side right, Claire seated at the left end, Shmoulik seated at the right end, everyone staring at Jupiter, mouths open. At 6.5s the wooden spoon slips out of Claire's hand and floats slowly upward, turning in the air.
8.0–11.5s: Medium two-shot, 35mm, on Sam and Julie on the far side, Jupiter behind them. At 8.2s Julie takes the tablet from Sam and says at 8.2–8.7s: "À moi !" She holds it screen toward herself. A soft chime at 8.9s. She listens silently from 9.0s to 10.6s, then says at 10.7–11.2s: "Rome !" She taps the screen at exactly 11.5s.
11.5–17.0s: Hard match cut on the tap to the Rome terrace. Match Julie's pose, face size, frame position and lens across the cut; only location, light and sound change. Same seats around the checked-tablecloth table, the Colosseum behind the far side. At 12.3s the wooden spoon drops from above into Claire's open right hand. From 12.5s the camera pulls back to the wide from the empty near side. Claire looks around, amazed and delighted, and says at 14.6–16.2s: "Mais c'est génial, ce truc !" Hold until 17.0s.

SOUND — close, dry French dialogue, lip-synced, each line once at its stated time. Two soft app chimes at 0.2s and 8.9s, and no voice from the tablet. Dining room: quiet room tone. Space: low station hum and a soft airy whoosh on the cut. Rome: lively street ambience, distant chatter, a passing scooter. No music, no narrator, no captions, no watermarks.

CONTINUITY — the same four people keep the same seats in all three places: Sam far side left, Julie far side right, Claire left end, Shmoulik right end. One orange tablet travels Sam to Julie, screen never visible. One wooden spoon: in Claire's hand at home, floating in space, back in her hand in Rome. No furniture follows them between places.
```

### G4 — Le tour de Claire, le retour et la signature (16 s)

Références, dans cet ordre : Claire, Sam, Julie, Shmoulik, Rome, salle à manger corrigée.

```
A 16-second live-action family comedy commercial, 16:9, photoreal. In Rome the mother insists on trying the quiz, answers wrong, and the whole family is snapped back home where her lasagne is burning; the presenter delivers the final line to camera. All dialogue is spoken in natural French. No voice ever comes from the tablet.

REFERENCES — Image 1: Claire. Image 2: Sam. Image 3: Julie. Image 4: Shmoulik. Image 5: the Rome terrace. Image 6: the dining room. Match faces, hair, clothes and places exactly.

[COLLER LE BLOC CAST COMMUN]

ROME — as Image 5: checked-tablecloth table with spaghetti, dark-green bistro chairs, the Colosseum behind the far side, hard warm sunlight.
DINING ROOM — as Image 6: long light-oak table, the open kitchen with the built-in oven directly behind the far side, warm evening light.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich colour, crisp focus. No visible CGI.

SHOTS
0.0–3.0s: Wide from the empty near side of the Rome table. Claire, at the left end, reaches over and takes the tablet from Julie with her left hand, thrilled, and says at 0.3–1.4s: "À moi, à moi !" From 1.6s Sam and Julie get up and lean in behind Claire's shoulders to watch.
3.0–6.0s: Medium close-up, 35mm, on Claire holding the tablet screen toward herself, the kids' curious faces over her shoulders, the Colosseum softly behind. A soft chime at 3.1s. She listens silently from 3.2s to 4.6s, then answers instantly and very sure of herself at 4.7–5.6s: "Cinquante-quatre !" She taps the screen at exactly 5.8s.
6.0–7.0s: Same framing. A short error buzzer at 6.0s. Sam and Julie wince at the same time.
7.0–9.0s: Hard match cut to the dining room, same framing, same poses: Claire holding the tablet, the kids leaning behind her shoulders, warm evening light now. Sam and Julie say together, deadpan, at 7.4–8.2s: "Cinquante-six."
9.0–12.0s: Wide from the empty near side of the dining table. Thick grey smoke pours from the oven door behind the table. At 9.3s a smoke alarm beeps loudly. Claire spins toward the kitchen and cries at 9.6–10.6s: "Mes lasagnes !" She rushes to the oven, spoon in hand. Shmoulik stands at the right end of the table.
12.0–16.0s: Medium close-up, 35mm, on Shmoulik at the right end of the table, sharp, looking into the lens. Behind him, softly out of focus: Claire opening the smoking oven and waving the spoon, the kids laughing. He says at 12.2–13.9s: "Avec Kizzo, l'écran se mérite." At 14.0s he glances over his shoulder at Claire, turns back to the lens, and says at 14.5–15.6s: "Même pour les parents." Hold until 16.0s.

SOUND — close, dry French dialogue, lip-synced, each line once at its stated time. One soft app chime at 3.1s, one short error buzzer at 6.0s, no voice from the tablet. Rome street ambience until the cut; at home, quiet room tone, then a loud smoke alarm from 9.3s, lowered under Shmoulik's lines. No music, no narrator, no captions, no watermarks.

CONTINUITY — one orange tablet, screen never visible. One wooden spoon, in Claire's right hand. Same faces and clothes. Shmoulik at the right end of the table; the family never looks at him.
```

---

## 5. Ordre de marche

1. **Crédits** : recharger environ 1 000 crédits.
2. **Shmoulik** : envoyer 10 à 20 photos sur Higgsfield, puis créer sa fiche et compléter le bloc CAST.
3. **Salle à manger** : lancer la correction prévue au point 1.
4. **G1** : répétition en Seedance 2.0 Mini 480p, puis brouillon Seedance 2.5, puis passage en 1080p de la meilleure prise. G1 ne dépend pas de Shmoulik, on peut la lancer en premier.
5. **G2, G3, G4** : même méthode, dans l'ordre.
6. **Montage** : voix de Kizzo, incrustation des écrans réels, carton final, version 9:16.
