# Pub Kizzo « Même les parents révisent » — Casting validé et prompts vidéo

Suite du script V2 (fichier 03). Les images sont dans `assets/`.

---

## 1. Assets générés

Les identifiants servent de référence dans les générations vidéo (champ « medias », rôle `image_references`).

| Asset | Fichier | Identifiant Higgsfield | Modèle | Statut |
|---|---|---|---|---|
| Claire | `assets/char_claire.jpg` | ce83c9d8-5631-4dfb-b710-56b377dbbe15 | Soul Cinema, retouche Seedream 5.0 Pro | Validée |
| Sam | `assets/char_sam.jpg` | 22a69b68-acb5-446f-bdb9-ff4427e424e3 | GPT Image 2.5, à partir du garçon déjà généré par Shmoulik (référence b636c324-8381-4371-b608-c9f6bec4377f) | Validé |
| Julie | `assets/char_julie.jpg` | d3cd97c9-1748-4d39-8f4a-dada32a78bbd | GPT Image 2.5, à partir du portrait de la première version | Validée (refaite : mains et posture corrigées) |
| Shmoulik | Non versée au repo (données personnelles) | e81c9a30-5f6a-45d4-bb19-a20fd6a716be | GPT Image 2.5, à partir de 5 photos de Shmoulik | Validée (variante 1 : t-shirt blanc, pantalon bleu, baskets façon B33) |
| Salle à manger | `assets/loc_salle_a_manger.jpg` | 57918861-dbb7-4634-8126-bb04212714ee | GPT Image 2.5 | Validée (refaite : chaises entières, caméra à hauteur d'adulte, four derrière les enfants) |
| Chambre de Sam | `assets/loc_chambre_sam.jpg` | 4c6e644d-1f83-4ea4-b409-91d1cf707c2b | Soul Cinema | Validée |
| Chambre de Julie | `assets/loc_chambre_julie.jpg` | beabd155-2eb2-46e5-a179-8bf81407a0d1 | Soul Cinema | Validée |
| Vaisseau spatial | `assets/loc_vaisseau_spatial.jpg` | 0306111d-9417-435e-a1e3-195be415d5ce | GPT Image 2.5 | Validé (remplace la station spatiale : Jupiter entière et lisible, cockpit à quatre sièges sur deux rangs) |
| Rome | `assets/loc_rome.jpg` | 610c338e-28b2-4b1a-867a-28eb7a0107c6 | Soul Cinema | Validée |

Prompt de correction prévu pour la salle à manger (Seedream 5.0 Pro, mode édition) :

```
Edit this location still. Remove the two chairs in the foreground on the near side of the table, closest to the camera, and show the floor there instead. Keep everything else exactly the same: the table, the two chairs on the far side, one chair at each end, the kitchen, the lit oven with the dish inside, the window, the fridge with drawings, the pendant lamp. Make the dish visible in the oven look like a rectangular dish of lasagne with golden melted cheese. Raise the overall exposure slightly so faces will read well, keeping the warm evening mood. No people, no text.
```

---

## 1 bis. Casting des voix

Généré avec Seed Audio 1.0. Les voix de Claire, Sam et Julie sont déduites de leur portrait. Pour Kizzo, ce sont deux voix prêtes à l'emploi. La voix retenue sert ensuite de référence pour toutes les répliques du personnage, ce qui la garde identique d'une séquence à l'autre.

| Personnage | Proposition A | Proposition B | Choix |
|---|---|---|---|
| Claire | 28bcf88a-b72c-447c-a2f5-c9d9a45a73de | 0241efbf-8c31-40fd-a3a3-3d1d83bd9b9a | **B** |
| Sam | b449101c-9137-4b87-ada6-5ec0ee523b3b | 2c60d077-246a-4023-b06d-fcf99289356f | **B** |
| Julie | ab49b13f-2e07-4bf9-8a63-8d1cd335a301 | 92de5169-0431-4c75-9900-6919cc8a083e | **A** |
| Kizzo | — | — | **Abandonné** : pas de voix, questions en texte à l'écran |
| Shmoulik | Sa vraie voix, à enregistrer dans Higgsfield | — | À faire |

## 2. Ce que coûte la vidéo

Prix relevés sur ton compte le 12 octobre 2026.

| Modèle | Qualité | Crédits par seconde | Usage |
|---|---|---|---|
| Seedance 2.0 Mini | 480p | 0,5 | Répétition, en option |
| Seedance 2.0 | 720p | 4,5 | Rendu économique |
| Seedance 2.0 | 1080p | 9 | Non retenu |
| **Seedance 2.5** | **1080p** | **12** | **Rendu retenu : le plus réaliste** |

**Budget de la pub** : 55 secondes en Seedance 2.5 1080p, soit environ 660 crédits pour une prise par séquence.

## 3. Le protocole : une seule prise par séquence

1. **Aucune vidéo avant que toutes les références de la séquence soient validées.**
2. **Chaque séquence prolonge la précédente** (mode `video_extension` de Seedance 2.5), pour un raccord parfait. **Une seule prise par séquence, en 1080p.** Le prompt doit donc être juste du premier coup. On ne lance une séquence que lorsque toutes ses références sont prêtes.
3. **Option en cas de doute** : une répétition en Seedance 2.0 Mini 480p coûte 7,5 crédits pour 15 secondes. Elle vérifie le placement et le timing avant de dépenser 180 crédits.
4. **On ne relance pas une séquence pour un plan raté** si le montage peut le couper ou le cacher.
5. **Les voix sont remplacées au montage.** Seedance génère l'audio pour caler les lèvres et les bruitages, puis on pose les voix définitives de chaque personnage.

**Liste de contrôle avant de lancer :**
- La durée réglée correspond à la dernière seconde du prompt, et ne dépasse pas 15 secondes.
- Les timecodes se suivent sans trou ni chevauchement.
- Chaque réplique tient dans sa fenêtre, à environ 5 syllabes par seconde en français.
- Chaque réplique est adressée à quelqu'un de présent ou qui l'entend. Personne ne parle seul.
- Les places sont rappelées.
- Aucun écran visible, aucune musique, aucun sous-titre.
- Les références sont jointes dans l'ordre annoncé en tête du prompt.

## 4. Les prompts vidéo

Réglages communs : modèle Seedance 2.5, mode `omni_reference`, résolution 1080p, format 16:9, audio activé, 15 secondes maximum par séquence. Les références passent avec le rôle `image_references`. Kizzo n'a pas de voix : ses questions apparaissent en texte à l'écran au montage, avec un son de notification. Les personnages les lisent en silence avant de répondre.

Le bloc Shmoulik est complété à partir de sa fiche validée.

### Bloc CAST commun (à coller dans G2, G3 et G4)

```
CAST — use these same people throughout the clip; match faces, hair and clothes exactly to the reference sheets.
Claire: 40, fair skin, light-brown eyes, chestnut hair in a loose messy bun with a few loose strands, small gold studs. Mustard-yellow apron over a navy crew-neck sweater with sleeves pushed up, mid-blue jeans, white sneakers. Always holds one plain wooden spoon in her right hand. Stern and tired at first, then delighted and competitive.
Sam: 10, fair skin with a light natural flush, warm brown eyes, soft features, light chestnut-brown medium-length tousled wavy hair with lighter sun-kissed strands. Forest-green hoodie, black over-ear gaming headset around his neck, charcoal joggers, black sneakers. Bored, then amazed.
Julie: 8, fair skin, green-hazel eyes, golden-blonde hair in two braids with a short fringe. Raspberry-pink sweatshirt under mid-blue denim dungarees, white sneakers. Sly, quick, deadpan.
Shmoulik: mid-twenties man, fair skin with a warm tone, short light-brown hair with strawberry-blond highlights swept to the side, light green-grey eyes, short light-brown stubble beard and moustache, athletic slim build. Plain classic white crew-neck T-shirt, dark navy-blue straight-leg trousers, chunky white and light-grey technical sneakers with no visible logo. No jacket. Relaxed presenter, deadpan humour, often looks straight into the lens. The family never sees him and never looks at him.

TABLET — one unbranded tablet in a vivid orange matte silicone kids' case with a carry handle on the top edge. Its screen always faces the person holding it; only the orange back faces the camera. Never show its screen. Never duplicate it.
SEATING — around every table, as seen from the establishing camera on the empty near side: Sam far side LEFT, Julie far side RIGHT, Claire at the LEFT end, Shmoulik at the RIGHT end. In the spaceship: Sam in the front-left pilot seat, Julie in the front-right pilot seat, Claire in the back-left seat, Shmoulik in the back-right seat. Change camera positions, never seats.
```

### G1 — L'appel, le Wi-Fi et le verdict (15 s)

Références, dans cet ordre : Claire, Sam, Julie, salle à manger, chambre de Sam, chambre de Julie.

```
A 15-second live-action family comedy commercial, 16:9, photoreal. Weekday evening in a French family home: a mother calls her two children to do their homework; each is absorbed in a screen and doesn't hear; she unplugs the internet box, the children shout from their rooms, and we find them sulking at the dining table while she confiscates the tablet. All dialogue is spoken in natural French.

REFERENCES — Image 1: Claire's character sheet. Image 2: Sam's character sheet. Image 3: Julie's character sheet. Image 4: the dining room with the open kitchen. Image 5: Sam's bedroom. Image 6: Julie's bedroom. Match faces, hair, clothes and rooms exactly to these references.

CAST
Claire: 40, fair skin, light-brown eyes, chestnut hair in a loose messy bun with a few loose strands, small gold studs. Mustard-yellow apron over a navy crew-neck sweater with sleeves pushed up, mid-blue jeans, white sneakers. Always holds one plain wooden spoon in her right hand. Stern, tired, dry.
Sam: 10, fair skin with a light natural flush, warm brown eyes, soft features, light chestnut-brown medium-length tousled wavy hair with lighter sun-kissed strands. Forest-green hoodie, black over-ear gaming headset, charcoal joggers, black sneakers. Absorbed, then outraged, then sulky.
Julie: 8, fair skin, green-hazel eyes, golden-blonde hair in two braids with a short fringe. Raspberry-pink sweatshirt under mid-blue denim dungarees, white sneakers. Playful, then outraged, then disgusted.

PROPS — TABLET: one unbranded tablet in a vivid orange matte silicone kids' case with a carry handle on the top edge; its screen always faces the person holding it, only the orange back faces the camera, never show its screen. CONTROLLER: one black game controller; Sam plays with it in his room and still clutches it in both hands at the dining table. WOODEN SPOON: one plain wooden spoon, always in Claire's right hand. INTERNET BOX: one small white internet router with a row of glowing green lights, on the kitchen shelf next to the fridge, its power cable plugged into a wall socket.

DINING ROOM — as Image 4: a long light-oak table with slim legs; the open kitchen directly behind the far side of the table with a lit built-in oven holding a dish of lasagne; a tall window at the left; a white fridge with children's drawings at the right; a warm pendant lamp above the table. Two chairs side by side on the far side of the table, one chair at each end, nothing on the near side.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich natural colour, crisp focus. Warm tungsten light at home; cool blue monitor light in Sam's room; warm fairy lights in Julie's room. Physically plausible camera moves. No visible CGI, no film grain.

SHOTS
0.0–2.3s: Medium shot, 35mm, in the kitchen. Claire stirs a pot of tomato sauce on the hob with the wooden spoon, the lit oven with the lasagne beside her. At 0.4s she turns her head toward the hallway off-screen left and calls loudly at 0.5–2.0s: "Sam ! Julie ! Les devoirs !"
2.3–3.3s: Hard cut to Sam's bedroom as Image 5, dark, lit by the blue monitor. Medium three-quarter side shot: Sam in the gaming chair, the headset ON his ears, the controller in both hands, thumbs mashing, eyes locked on the monitor. He does not react. The monitor shows only an abstract colour blur, no readable interface.
3.3–4.3s: Hard cut to Julie's bedroom as Image 6. Julie lies on her stomach on the bed, small white earbuds in, holding the orange tablet with its screen toward her face, giggling silently, feet kicking in the air. She does not react.
4.3–6.0s: Hard cut back to the kitchen. Claire closes her eyes for a beat and sighs, then turns to the small white internet box with glowing green lights on the shelf next to the fridge. With her left hand she pulls its power cable out of the wall socket at 5.4s; all its green lights go dark instantly. Her right hand still holds the wooden spoon. She says nothing.
6.0–6.8s: Hard cut to Sam's bedroom, closer framing on Sam in his gaming chair: the image on the monitor freezes. He rips the headset off his ears and shouts at 6.2–6.6s: "Hé !"
6.8–7.6s: Hard cut to Julie's bedroom: Julie sits bolt upright on the bed, staring at her tablet, screen toward her, orange back to camera, and shouts at 7.0–7.5s: "Maman !"
7.6–9.6s: Hard cut to a locked 24mm establishing wide from the empty near side of the dining table, as Image 4. Sam sits on the far side LEFT and Julie on the far side RIGHT, both facing the camera, sulking; Sam's headset is around his neck and he clutches his game controller; Julie holds the orange tablet. The kitchen and the lit oven are behind them. Claire stands at the LEFT end of the table, the spoon in her right hand pointed at them. At 8.4s she leans in and takes the tablet from Julie with her left hand. Nobody speaks in this shot: total silence from all three, only room tone.
9.6–11.8s: Medium shot, 35mm, on Claire standing at the left end of the table, the window behind her. From the first frame of this shot the wooden spoon is clearly visible, raised in her right hand, while her left hand holds the tablet flat against her chest, orange back to camera. Looking down at the children, she says firmly at 9.8–11.3s: "Deux heures d'écran. C'est fini."
11.8–15.0s: Low two-shot, 35mm, at table height, on Sam and Julie side by side, the kitchen softly blurred behind them. At 12.0s Sam drops his forehead onto the table while Julie rolls her eyes up, disgusted. Together at 12.2–12.8s: "Quoi ?!" Then nobody speaks; hold on their defeated faces until 15.0s.

SOUND — close, dry, natural French dialogue, lip-synced, each line spoken once at its stated time. Kitchen: sauce simmering, extractor hum, one soft electrical click when the plug comes out at 5.4s. Sam's room: muffled game sounds leaking from the headset, which stop abruptly at 6.0s. Julie's room: faint tinny game music from the earbuds, which stops at 6.8s. Dining room: quiet room tone and one soft thud of Sam's forehead on the table. No background music, no narrator, no captions, no subtitles, no watermarks.

CONTINUITY — same faces, hair and clothes in every shot. Claire's spoon always visible in her right hand. One orange tablet, screen never visible. No dialogue other than the five quoted lines. Seats fixed: Sam far side left, Julie far side right, Claire standing at the left end. The oven stays lit with the lasagne; no smoke yet.
```

### G2 quater — Shmoulik muet : refus de la tête, téléphone, claquement (12 s)

Mode **prolongement** : Seedance 2.5, `video_extension`, sens `forward`, 12 secondes, 1080p, 144 crédits. Vidéo de référence : G1 retenue (e5886007-2197-4861-958a-ce22dfaeb45b). Image de référence : fiche de Shmoulik (e81c9a30-5f6a-45d4-bb19-a20fd6a716be). Pas de référence audio.

Shmoulik ne parle jamais. Ses répliques sont ajoutées au montage, en texte animé mot par mot sur la moitié gauche de l'image, et lues par la voix off ElevenLabs. Ses gestes sont calés sur cette voix off : « Bloquer les écrans… » (2,0–3,0 s) → regard caméra entendu ; « ça marche jamais. » (3,3–4,6 s) → refus de la tête ; « Il suffit d'installer Kizzo. » (5,2–6,9 s) → il lève le téléphone ; puis claquement de l'autre main à 7,6 s.

```
Continue the reference video seamlessly from its very last frame: same dining room, same people, same clothes, same light, same seats. A 12-second extension of a live-action family comedy commercial, 16:9, photoreal. Time freezes; a silent presenter steps into the frozen scene, reacts to camera without saying a word, shakes his head, shows his phone, snaps his fingers, and time resumes as the family's tablet receives a notification.

NEW CHARACTER — Shmoulik, as in the reference image: mid-twenties man, fair skin with a warm tone, short light-brown hair with strawberry-blond highlights swept to the side, light green-grey eyes, short light-brown stubble beard and moustache, athletic slim build. Plain classic white crew-neck T-shirt, dark navy-blue straight-leg trousers, chunky white and light-grey technical sneakers with no visible logo. The family never sees him and never looks at him.

SHMOULIK NEVER SPEAKS — his mouth stays closed during the whole clip: lips together, no talking, no mouthing words, no lip movement. He acts only with his eyes, eyebrows, head and hands, like a silent comedy actor.

SEATS — Sam on the far side LEFT, Julie on the far side RIGHT, Claire standing at the LEFT end of the table holding the orange tablet in her left hand and the wooden spoon in her right hand, Shmoulik standing at the RIGHT end. The open kitchen with the lit oven and the lasagne stays behind the children.

SHOTS — four locked-off shots joined by clean cuts, no camera movement.
0.0–1.6s: Same framing as the last frame of the reference video. The image freezes: Sam with his forehead on the table, Julie with her eyes rolled up, completely still like a paused video, no blinking, no breathing. Shmoulik walks into frame from the right, further back near the kitchen counter, so his whole body including his head stays visible in frame, and stops behind Julie's chair, looking into the lens.
1.6–8.0s: Cut to a medium shot, 35mm, eye level, locked off, of Shmoulik from the waist up, his whole head and some space above it in frame. He stands in the RIGHT half of the image; the LEFT half of the image shows only the frozen family, soft and out of focus, with no hands, no phone and no object in front of them (this space is kept clear for titles added later).
  1.6–3.0s: He looks straight into the lens with a knowing, slightly amused look, one eyebrow raised, mouth closed.
  3.0–4.6s: He slowly and clearly shakes his head "no" three times, left-right-left-right-left-right, lips pressed together in a small ironic pout, as if to say "that never works".
  4.6–5.2s: He stops, looks back into the lens and gives a small confident smile, mouth closed.
  5.2–7.4s: With his LEFT hand he raises an ordinary black smartphone with no case and holds it up beside his face on the RIGHT side of the image, screen facing the lens, perfectly still from 5.6s to 7.4s. The screen shows only a plain uniform dark navy-blue colour with a soft glow, nothing else, no text. He never touches the screen. His other hand stays down.
  7.4–8.0s: Still holding the phone up in his left hand, he raises his RIGHT hand to shoulder height and snaps his fingers once at 7.6s.
8.0–12.0s: Cut to a wide shot from the near side of the table showing the whole family and Shmoulik. On the snap everyone unfreezes at once: Sam lifts his head, Julie's eyes come down. At 8.3s the orange tablet in Claire's left hand lights up with one soft notification ding; she looks at it, eyebrows raised, glances at the children, hesitates, then holds the tablet out across the table to Sam and says at 9.6–11.0s: "Bon… vas-y." Sam sits up and takes it at 11.4s. Shmoulik stays at the right end of the table, hands in his pockets, a small satisfied smile, mouth closed. Nobody in the family looks at him.

SOUND — while frozen, the room is almost silent: only Shmoulik's footsteps and the rustle of his clothes. Nobody speaks before 9.6s. The only spoken words in the whole clip are Claire's "Bon… vas-y." Shmoulik never makes a sound with his mouth. One finger snap at 7.6s, the normal room tone returns instantly, one soft notification ding at 8.3s. No music, no narrator, no voice-over, no captions, no watermarks.

CONTINUITY — same faces, clothes, room and light as the reference video. One orange tablet, its screen never visible to the camera. The phone screen shows only plain dark navy blue. Claire holds her wooden spoon in every shot.
```

### G2 ter — Le gel d'image et Shmoulik, voix inventée par l'IA (12 s)

Mode **prolongement** : Seedance 2.5, `video_extension`, sens `forward`, 12 secondes, 1080p, 144 crédits. Vidéo de référence : G1 retenue (e5886007-2197-4861-958a-ce22dfaeb45b). Image de référence : fiche de Shmoulik (e81c9a30-5f6a-45d4-bb19-a20fd6a716be). **Aucune référence audio** : Seedance invente la voix et l'anime en même temps que les lèvres. C'est ce qui donne la synchronisation la plus naturelle.

Changements par rapport à G2 bis : plus de référence audio ; une voix décrite en texte (jeune Parisien, décontracté, conversationnel) ; plus de mouvement de caméra pendant le gel, remplacé par quatre plans fixes nets, ce que Seedance respecte mieux ; Shmoulik cadré en entier dès son entrée ; aucune autre réplique que les trois prévues ; la cuillère de Claire verrouillée.

```
Continue the reference video seamlessly from its very last frame: same dining room, same people, same clothes, same light, same seats. A 12-second extension of a live-action family comedy commercial, 16:9, photoreal. Time freezes; a presenter steps into the frozen scene, talks to camera about Kizzo, snaps his fingers, and time resumes as the family's tablet receives a notification. All dialogue is in natural everyday spoken French.

NEW CHARACTER — Shmoulik, as in the reference image: mid-twenties man, fair skin with a warm tone, short light-brown hair with strawberry-blond highlights swept to the side, light green-grey eyes, short light-brown stubble beard and moustache, athletic slim build. Plain classic white crew-neck T-shirt, dark navy-blue straight-leg trousers, chunky white and light-grey technical sneakers with no visible logo. The family never sees him and never looks at him.

SHMOULIK'S VOICE — a young Parisian man in his mid-twenties: warm, medium-low, slightly husky voice, relaxed and friendly, a real person chatting with a friend, like a natural YouTube creator, not an actor, not an announcer, not a voice-over. Casual conversational rhythm with natural micro-pauses, a real breath before each line, a smile in the voice, a light ironic tone on the first line. Spoken live in the room, close to the camera, with the room's natural acoustics. Perfect lip sync, natural jaw and cheek movement, natural blinking.

SEATS — Sam on the far side LEFT, Julie on the far side RIGHT, Claire standing at the LEFT end of the table holding the orange tablet in her left hand and the wooden spoon in her right hand, Shmoulik standing at the RIGHT end. The open kitchen with the lit oven and the lasagne stays behind the children.

SHOTS — four locked-off shots joined by clean cuts, no camera movement.
0.0–1.6s: Same framing as the last frame of the reference video. The image freezes: Sam with his forehead on the table, Julie with her eyes rolled up, completely still like a paused video, no blinking, no breathing. Shmoulik walks into frame from the right behind the children, fully visible from head to knees, and stops beside Julie's chair, looking into the lens.
1.6–6.8s: Cut to a medium shot, 35mm, eye level, of Shmoulik from the waist up, his whole head and some space above it in frame, standing at the right end of the table, the frozen family soft in the background at the left. He looks into the lens, half-smiles, and says at 2.0–4.4s: "Bloquer les écrans, ça marche jamais." with a small shrug. A breath. At 5.0–6.5s, leaning in slightly: "Il suffit d'installer Kizzo."
6.8–8.4s: Same medium shot. He raises an ordinary black smartphone with no case in his right hand and holds its screen flat toward the lens, beside his face, from 6.9s; the screen shows only a plain uniform dark navy-blue colour with a soft glow, nothing else. He does not touch the screen and says nothing. At 8.0s he snaps the fingers of his left hand.
8.4–12.0s: Cut to a wide shot from the near side of the table showing the whole family and Shmoulik. On the snap everyone unfreezes at once: Sam lifts his head, Julie's eyes come down. At 8.7s the orange tablet in Claire's left hand lights up with one soft notification ding; she looks at it, eyebrows raised, glances at the children, hesitates, then holds the tablet out across the table to Sam and says at 9.9–11.3s: "Bon… vas-y." Sam sits up and takes it at 11.6s. Shmoulik stays at the right end of the table, hands in his pockets, a small satisfied smile. Nobody in the family looks at him.

SOUND — while frozen, the room is almost silent; only Shmoulik's footsteps and voice. Exactly three spoken lines in the whole clip: his two lines and Claire's "Bon… vas-y." Nobody else speaks, no other words, no mumbling. One finger snap at 8.0s, the normal room tone returns instantly, one soft notification ding at 8.7s. No music, no narrator, no captions, no watermarks.

CONTINUITY — same faces, clothes, room and light as the reference video. One orange tablet, its screen never visible to the camera. The phone screen shows only plain dark navy blue. Claire holds her wooden spoon in every shot.
```

### G2 bis — Le gel d'image et Shmoulik, avec sa vraie voix (12 s)

Régénération de G2. Mode **prolongement** : Seedance 2.5, `video_extension`, sens `forward`, 12 secondes, 1080p, 144 crédits. Vidéo de référence : G1 retenue (e5886007-2197-4861-958a-ce22dfaeb45b). Image de référence : fiche de Shmoulik (e81c9a30-5f6a-45d4-bb19-a20fd6a716be). Référence audio : **le vocal réel de Shmoulik, nettoyé** (`voix_shmoulik_reference.wav`, media e53e10b7-ba44-4f5c-9513-2afc94abc409). Plus de voix clonée.

Changements par rapport à G2 : la réplique 1 devient « Moi, bloquer les écrans ? Ça marche jamais. », la voix vient du vrai vocal, le jeu est explicitement naturel, et le téléphone est un modèle noir sans coque, sans geste sur l'écran.

```
Continue the reference video seamlessly from its very last frame: same dining room, same people, same clothes, same light, same seats. A 12-second extension of a live-action family comedy commercial, 16:9, photoreal. Time freezes; a presenter walks into the frozen scene, talks to camera about Kizzo, snaps his fingers, and time resumes as the family's tablet receives a notification. All dialogue is spoken in natural French.

NEW CHARACTER — Shmoulik, as in the reference image: mid-twenties man, fair skin with a warm tone, short light-brown hair with strawberry-blond highlights swept to the side, light green-grey eyes, short light-brown stubble beard and moustache, athletic slim build. Plain classic white crew-neck T-shirt, dark navy-blue straight-leg trousers, chunky white and light-grey technical sneakers with no visible logo. The family never sees him and never looks at him.

SHMOULIK'S VOICE AND PERFORMANCE — The reference audio is a real recording of Shmoulik's own voice saying his two lines. Reproduce exactly his voice: same timbre, same pitch, same French accent, same words. But perform the lines like a real person talking casually to a friend on camera, not like a voice-over: relaxed natural rhythm, tiny hesitations and breaths, a slight smile in the voice, varied intonation, a knowing deadpan tone. Never robotic, never announcer-like, never flat. His voice sounds like it is recorded live in this dining room by the camera microphone, with the room's natural acoustics, at the same distance as the camera. His lips, jaw, breathing and facial expressions match every syllable perfectly. Claire keeps her own female voice from the reference video; only Shmoulik uses the reference voice.

SEATS — Sam on the far side LEFT, Julie on the far side RIGHT, Claire standing at the LEFT end of the table holding the orange tablet and her wooden spoon, Shmoulik standing at the RIGHT end. The open kitchen with the lit oven and the lasagne stays behind the children.

SHOTS
0.0–2.0s: The image freezes exactly on the last frame of the reference video: Sam with his forehead on the table, Julie with her eyes rolled up. The family is completely frozen like a paused video: no blinking, no breathing, hair and fabric perfectly still. Only the camera moves: it slowly pulls back and rises from the low two-shot to a wide shot from the empty near side of the table, revealing Claire frozen standing at the left end of the table, the orange tablet held against her chest, the wooden spoon raised in her right hand. During the pull-back, Shmoulik walks in from frame right, the only person who moves, and stops beside the right end of the table at 2.0s, facing the camera.
2.0–6.8s: Medium shot, 35mm, on Shmoulik at the right end of the table, the frozen family soft in the background at the left. He looks straight into the lens with a relaxed, amused half-smile and says naturally at 2.1–4.7s: "Moi, bloquer les écrans ? Ça marche jamais." with a small shrug and a tiny pause after "écrans". A natural breath. Then at 5.1–6.6s, leaning in slightly, confident: "Il suffit d'installer Kizzo."
6.8–8.4s: Same framing. He raises an ordinary black smartphone with no case and holds its screen toward the camera from 6.9s; the screen shows only a plain uniform dark navy-blue colour with a soft glow, nothing else, no text. He does not touch the screen. At 8.0s he snaps the fingers of his free hand.
8.4–12.0s: Back to the wide shot. On the snap everyone unfreezes at once: Sam lifts his head, Julie's eyes come down. At 8.7s the orange tablet in Claire's hands lights up with one soft notification ding; she turns its screen toward herself, reads, eyebrows raised, glances at the children, hesitates, then holds the tablet out across the table to Sam and says at 9.9–11.5s: "Bon… vas-y." Sam sits up and takes it at 11.7s. Shmoulik stays at the right end of the table, hands in his pockets, a small satisfied smile. Nobody in the family looks at him.

SOUND — while frozen, the room tone drops to a very quiet hush; Shmoulik's footsteps and voice are the only clear sounds, recorded in the same room acoustics as the rest of the film. Each line is spoken once at its stated time. One finger snap at 8.0s, the normal room tone returns instantly, one soft notification ding at 8.7s. No music, no narrator, no captions, no watermarks.

CONTINUITY — same faces, clothes, room and light as the reference video. One orange tablet, its screen never visible to the camera. The phone screen shows only plain dark navy blue. Claire keeps her wooden spoon.
```

### G2 — Le gel d'image et Shmoulik (12 s)

Mode **prolongement** : Seedance 2.5, mode `video_extension`, sens `forward`, 12 secondes, 1080p. La vidéo de référence est la prise retenue de la séquence 1 (e5886007-2197-4861-958a-ce22dfaeb45b). Image de référence : la fiche de Shmoulik (e81c9a30-5f6a-45d4-bb19-a20fd6a716be). Références audio : ses deux répliques générées avec sa voix (17940602-6a1c-4762-990c-6c9ac260b09f, version B de la réplique 1, et 55b97157-3dfa-4dad-9ff1-c5ab69ef3db2). Coût : 144 crédits.

L'écran du téléphone est généré en bleu nuit uni. L'écran Kizzo (`assets/ecran_telephone_kizzo.jpg`) est incrusté au montage, sur un fond de la même couleur.

```
Continue the reference video seamlessly from its very last frame: same dining room, same people, same clothes, same light, same seats. A 12-second extension of a live-action family comedy commercial, 16:9, photoreal. Time freezes; a presenter walks into the frozen scene, talks to camera about Kizzo, snaps his fingers, and time resumes as the family's tablet receives a notification. All dialogue is spoken in natural French.

NEW CHARACTER — Shmoulik, as in the reference image: mid-twenties man, fair skin with a warm tone, short light-brown hair with strawberry-blond highlights swept to the side, light green-grey eyes, short light-brown stubble beard and moustache, athletic slim build. Plain classic white crew-neck T-shirt, dark navy-blue straight-leg trousers, chunky white and light-grey technical sneakers with no visible logo. Relaxed presenter, deadpan humour, looks straight into the lens. His voice is exactly the male voice of the reference audio clips; only Shmoulik uses that voice. Claire keeps her own female voice from the reference video. The family never sees him and never looks at him.

SEATS — Sam on the far side LEFT, Julie on the far side RIGHT, Claire standing at the LEFT end of the table holding the orange tablet and her wooden spoon, Shmoulik standing at the RIGHT end. The open kitchen with the lit oven and the lasagne stays behind the children.

SHOTS
0.0–2.0s: The image freezes exactly on the last frame of the reference video: Sam with his forehead on the table, Julie with her eyes rolled up. The family is completely frozen like a paused video: no blinking, no breathing, hair and fabric perfectly still. Only the camera moves: it slowly pulls back and rises from the low two-shot to a wide shot from the empty near side of the table, revealing Claire frozen standing at the left end of the table, the orange tablet held against her chest, the wooden spoon raised in her right hand. During the pull-back, Shmoulik walks in from frame right, the only person who moves, and stops beside the right end of the table at 2.0s, facing the camera.
2.0–6.9s: Medium shot, 35mm, on Shmoulik at the right end of the table, the frozen family soft in the background at the left. He looks straight into the lens, relaxed and deadpan, and says at 2.0–5.3s: "Bloquer les écrans ? Ça marche jamais." Short beat. At 5.5–6.8s: "Il suffit d'installer Kizzo."
6.9–8.4s: Same framing. He raises an ordinary black smartphone with no case and holds its screen toward the camera from 7.0s; the screen shows only a plain uniform dark navy-blue colour with a soft glow, nothing else, no text. He does not touch the screen. At 8.0s he snaps the fingers of his free hand.
8.4–12.0s: Back to the wide shot. On the snap everyone unfreezes at once: Sam lifts his head, Julie's eyes come down. At 8.7s the orange tablet in Claire's hands lights up with one soft notification ding; she turns its screen toward herself, reads, eyebrows raised, glances at the children, hesitates, then holds the tablet out across the table to Sam and says at 9.9–11.5s: "Bon… vas-y." Sam sits up and takes it at 11.7s. Shmoulik stays at the right end of the table, hands in his pockets, a small satisfied smile. Nobody in the family looks at him.

SOUND — while frozen, the room tone cuts to total silence; Shmoulik's footsteps and voice are the only sounds. Close, dry French dialogue, lip-synced, each line once at its stated time. One finger snap at 8.0s, room tone returns instantly, one soft notification ding at 8.7s. No music, no narrator, no captions, no watermarks.

CONTINUITY — same faces, clothes, room and light as the reference video. One orange tablet, its screen never visible to the camera. The phone screen shows only plain dark navy blue. Claire keeps her wooden spoon.
```

### G3 v2 — Les deux voyages, en prolongement de la G2 retenue (15 s)

Mode **prolongement** : Seedance 2.5, `video_extension`, sens `forward`, 15 secondes. Vidéo de référence : la G2 retenue, brute de génération (16f11e2d-7228-4cdd-a064-0c9a475e0840) ; sa dernière image est un plan large sans Shmoulik qui parle, donc le raccord fonctionne avec la version muette. Images de référence, dans cet ordre : vaisseau spatial (0306111d-9417-435e-a1e3-195be415d5ce), Rome (610c338e-28b2-4b1a-867a-28eb7a0107c6), Shmoulik (e81c9a30-5f6a-45d4-bb19-a20fd6a716be). Coût : 180 crédits en 1080p, 105 en 720p.

Leçons de G2 bis et G2 ter appliquées : des plans fixes ou des mouvements très simples, des répliques d'un ou deux mots (Seedance déforme les phrases longues en français), Shmoulik ne parle pas, et une seule réplique longue, celle de Claire, placée à la fin.

```
Continue the reference video seamlessly from its very last frame: same dining room, same family, same clothes, same light, same seats; Sam has just taken the orange tablet from Claire. A 15-second extension of a live-action family comedy commercial, 16:9, photoreal. Sam answers a quiz on the tablet and his tap transports the whole family into the cockpit of a spaceship facing Jupiter; then Julie answers and her tap transports everyone to a terrace facing the Colosseum in Rome. All dialogue is in natural spoken French. No voice ever comes from the tablet.

REFERENCES — Image 1: the spaceship cockpit. Image 2: the Rome terrace. Image 3: Shmoulik (white T-shirt, navy trousers, white and light-grey sneakers, no logo). Faces and clothes of Claire, Sam and Julie stay exactly as in the reference video.

SPACESHIP — as Image 1: the cockpit of a sleek white passenger spaceship, a huge curved windscreen showing Jupiter as a complete round globe in black starry space. Four white seats in two rows facing the windscreen: Sam front-left, Julie front-right, Claire back-left, Shmoulik back-right. Abstract glowing displays, no text. Cool white light plus Jupiter's warm amber glow.
ROME — as Image 2: a table with a red-and-white checked tablecloth and four plates of spaghetti, dark-green bistro chairs, the Colosseum behind, hard warm sunlight, deep blue sky. Sam far side left, Julie far side right, Claire left end, Shmoulik right end.

SHOTS — simple shots joined by clean cuts.
0.0–3.0s: Medium close-up, 35mm, locked off, on Sam seated at the dining table holding the orange tablet in both hands, screen toward him. A soft chime at 0.2s. He reads silently, thinks with his eyes up, then says at 2.0–2.6s: "Jupiter !" He taps the screen with his right index finger at 3.0s.
3.0–7.0s: Hard match cut on the tap: same framing on Sam, now sitting in the front-left seat of the spaceship cockpit, Jupiter's amber glow on his face. At 3.6–4.2s he looks up past the camera and whispers: "Wouah…" At 4.6s cut to a wide shot from behind the back row: the four family members in their seats facing the huge windscreen filled by Jupiter, all leaning forward, amazed. Claire's wooden spoon floats slowly upward between the seats.
7.0–10.5s: Medium two-shot, 35mm, locked off, from the dashboard on Sam and Julie in the front seats. Julie takes the tablet from Sam and says at 7.2–7.7s: "À moi !" A soft chime at 7.9s. She reads silently, then says at 9.4–9.9s: "Rome !" She taps the screen at 10.5s.
10.5–15.0s: Hard match cut on the tap: same framing on Julie, now sitting at the Rome terrace table in hard sunlight. At 11.2s cut to a wide shot of the whole table with the Colosseum behind; the wooden spoon drops from above into Claire's open hand. Claire looks around, delighted, and says at 12.6–14.2s: "Mais c'est génial, ce truc !" Shmoulik, at the right end of the table, smiles at the camera. Hold until 15.0s.

SOUND — close natural French dialogue, lip-synced, exactly five spoken lines: "Jupiter !", "Wouah…", "À moi !", "Rome !", "Mais c'est génial, ce truc !". Nobody else speaks; Shmoulik never speaks. Two soft app chimes at 0.2s and 7.9s. Dining room: quiet room tone. Spaceship: low engine hum and an airy whoosh on the cut. Rome: street ambience, distant chatter, a passing scooter. No music, no narrator, no captions, no watermarks.

CONTINUITY — same four people, same clothes in all places. One orange tablet, its screen never visible to the camera. No furniture follows them between places.
```

### G3 — Les deux voyages (15 s)

Références, dans cet ordre : Claire, Sam, Julie, Shmoulik, salle à manger corrigée, vaisseau spatial, Rome.

```
A 15-second live-action family comedy commercial, 16:9, photoreal. A boy answers a quiz question on the family tablet and his tap transports the whole family into the cockpit of a spaceship facing Jupiter; then his sister answers and her tap transports everyone to a terrace facing the Colosseum in Rome. All dialogue is spoken in natural French. No voice ever comes from the tablet.

REFERENCES — Image 1: Claire. Image 2: Sam. Image 3: Julie. Image 4: Shmoulik. Image 5: the dining room. Image 6: the spaceship cockpit. Image 7: the Rome terrace. Match faces, hair, clothes and places exactly.

[COLLER LE BLOC CAST COMMUN]

DINING ROOM — as Image 5, warm evening light, everyone in their seats.
SPACESHIP — as Image 6: the cockpit of a sleek white passenger spaceship. A huge curved windscreen shows Jupiter as a complete round globe in black starry space, with two tiny moons. Four white padded seats in two rows, all facing the windscreen: Sam in the front-left pilot seat, Julie in the front-right pilot seat, Claire in the back-left seat, Shmoulik in the back-right seat. A low curved dashboard with abstract glowing displays and no text. Cool white interior light and Jupiter's warm amber glow. Normal gravity for people; only the wooden spoon floats.
ROME — as Image 7: a table with a red-and-white checked tablecloth and four plates of spaghetti, dark-green bistro chairs, the Colosseum behind the far side, hard warm sunlight, deep blue sky.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich colour, crisp focus. Physically plausible camera moves. No visible CGI.

SHOTS
0.0–3.3s: Medium close-up, 35mm, slow push-in, on Sam seated on the far side left of the dining table, holding the orange tablet in both hands, screen toward him. A soft chime at 0.2s. He reads the question silently on the screen from 0.3s to 2.0s, thinks with his eyes up from 2.0s, then says confidently at 2.4–3.0s: "Jupiter !" He taps the screen with his right index finger at exactly 3.3s.
3.3–7.3s: Hard match cut on the tap into the spaceship cockpit. The camera is now at the dashboard looking back at Sam, who sits in the front-left pilot seat in the same pose; match his face size, frame position, lens and push-in speed across the cut. Only location, light and sound change; Jupiter's warm amber light falls on his face and the white seat. At 3.8–4.5s he looks up past the camera and whispers: "Wouah…" From 4.7s the camera rises and arcs smoothly over the seats to end behind the back row, revealing the whole cockpit with Jupiter filling the windscreen: Julie in the front-right pilot seat, Claire in the back-left seat, Shmoulik in the back-right seat, everyone leaning toward the windscreen, staring at Jupiter. At 5.8s the wooden spoon slips out of Claire's hand and floats slowly upward between the seats, turning in the air.
7.3–10.3s: Medium two-shot, 35mm, from the dashboard looking back at Sam and Julie in the two front pilot seats, their faces lit by Jupiter's amber glow, Claire and Shmoulik soft in the back row. At 7.4s Julie takes the tablet from Sam and says at 7.4–7.9s: "À moi !" She holds it screen toward herself. A soft chime at 8.0s. She reads the question silently on the screen from 8.1s to 9.4s, then says at 9.5–10.0s: "Rome !" She taps the screen at exactly 10.3s.
10.3–15.0s: Hard match cut on the tap to the Rome terrace. Match Julie's pose, face size, frame position and lens across the cut; only location, light and sound change. Same seats around the checked-tablecloth table, the Colosseum behind the far side. At 10.9s the wooden spoon drops from above into Claire's open right hand. From 11.1s the camera pulls back to the wide from the empty near side. Claire looks around, amazed and delighted, and says at 12.8–14.4s: "Mais c'est génial, ce truc !" Hold until 15.0s.

SOUND — close, dry French dialogue, lip-synced, each line once at its stated time. Two soft app chimes at 0.2s and 8.0s, and no voice from the tablet. Dining room: quiet room tone. Spaceship: low engine hum, soft cockpit beeps and an airy whoosh on the cut. Rome: lively street ambience, distant chatter, a passing scooter. No music, no narrator, no captions, no watermarks.

CONTINUITY — the same four people keep the same relative positions in all three places: at the tables Sam far side left, Julie far side right, Claire left end, Shmoulik right end; in the spaceship Sam front-left, Julie front-right, Claire back-left, Shmoulik back-right. One orange tablet travels Sam to Julie, screen never visible. One wooden spoon: in Claire's hand at home, floating in space, back in her hand in Rome. No furniture follows them between places.
```

### G4 — Le tour de Claire, le retour et la signature (15 s)

Références, dans cet ordre : Claire, Sam, Julie, Shmoulik, Rome, salle à manger corrigée.

```
A 15-second live-action family comedy commercial, 16:9, photoreal. In Rome the mother insists on trying the quiz, answers wrong, and the whole family is snapped back home where her lasagne is burning; the presenter delivers the final line to camera. All dialogue is spoken in natural French. No voice ever comes from the tablet.

REFERENCES — Image 1: Claire. Image 2: Sam. Image 3: Julie. Image 4: Shmoulik. Image 5: the Rome terrace. Image 6: the dining room. Match faces, hair, clothes and places exactly.

[COLLER LE BLOC CAST COMMUN]

ROME — as Image 5: checked-tablecloth table with spaghetti, dark-green bistro chairs, the Colosseum behind the far side, hard warm sunlight.
DINING ROOM — as Image 6: long light-oak table, the open kitchen with the built-in oven directly behind the far side, warm evening light.

LOOK — clean modern digital cinema, 24–35mm lenses, natural skin texture, rich colour, crisp focus. No visible CGI.

SHOTS
0.0–2.5s: Wide from the empty near side of the Rome table. Claire, at the left end, reaches over and takes the tablet from Julie with her left hand, thrilled, and says at 0.2–1.2s: "À moi, à moi !" From 1.3s Sam and Julie get up and lean in behind Claire's shoulders to watch.
2.5–5.3s: Medium close-up, 35mm, on Claire holding the tablet screen toward herself, the kids' curious faces over her shoulders, the Colosseum softly behind. A soft chime at 2.6s. She reads the question silently on the screen from 2.7s to 4.0s, then answers instantly and very sure of herself at 4.1–5.0s: "Cinquante-quatre !" She taps the screen at exactly 5.2s.
5.3–6.0s: Same framing. A short error buzzer at 5.3s. Sam and Julie wince at the same time.
6.0–7.8s: Hard match cut to the dining room, same framing, same poses: Claire holding the tablet, the kids leaning behind her shoulders, warm evening light now. Sam and Julie say together, deadpan, at 6.3–7.1s: "Cinquante-six."
7.8–10.6s: Wide from the empty near side of the dining table. Thick grey smoke pours from the oven door behind the table. At 8.0s a smoke alarm beeps loudly. Claire spins toward the kitchen and cries at 8.3–9.3s: "Mes lasagnes !" She rushes to the oven, spoon in hand. Shmoulik stands at the right end of the table.
10.6–15.0s: Medium close-up, 35mm, on Shmoulik at the right end of the table, sharp, looking into the lens. Behind him, softly out of focus: Claire opening the smoking oven and waving the spoon, the kids laughing. He says at 10.7–12.6s: "Avec Kizzo, l'écran se mérite." At 12.7s he glances over his shoulder at Claire, turns back to the lens, and says at 13.0–14.2s: "Même pour les parents." Hold until 15.0s.

SOUND — close, dry French dialogue, lip-synced, each line once at its stated time. One soft app chime at 2.6s, one short error buzzer at 5.3s, no voice from the tablet. Rome street ambience until the cut; at home, quiet room tone, then a loud smoke alarm from 8.0s, lowered under Shmoulik's lines. No music, no narrator, no captions, no watermarks.

CONTINUITY — one orange tablet, screen never visible. One wooden spoon, in Claire's right hand. Same faces and clothes. Shmoulik at the right end of the table; the family never looks at him.
```

---

## 4 bis. Prises réalisées

| Séquence | Modèle | Identifiant | Statut |
|---|---|---|---|
| G1 | Seedance 2.0 1080p | adc89d35-462e-4611-bd8d-4f144798976b | Prise lancée par erreur de modèle. Correcte mais box invisible et décor différent |
| G1 | **Seedance 2.5 1080p** | **e5886007-2197-4861-958a-ce22dfaeb45b** | **Retenue** : box visible, décor respecté, cohérence des visages |
| G2 | Seedance 2.5 1080p, prolongement de G1 | 16f11e2d-7228-4cdd-a064-0c9a475e0840 | **Retenue** après post-production : écran Kizzo incrusté par suivi de l'écran bleu, voix générée remplacée par la vraie voix de Shmoulik nettoyée (débruitage, égalisation, compression, légère acoustique de pièce) et calée sur ses lèvres |

## 4 ter. Leçons de la séquence 2

- **La voix clonée ne suffit pas** pour un personnage réel : sa vraie voix, même enregistrée au téléphone, sonne mieux une fois nettoyée.
- **Les écrans se règlent au montage** : on génère un écran d'une couleur unie et saturée, puis on y incruste l'image exacte en suivant ses contours. Le rendu est net et fidèle.
- **Le prolongement de séquence garantit le raccord** : on repart toujours de la dernière image de la prise précédente.
- **Montage v5 des séquences 1 et 2 (26,5 s), version en cours.**
  - La réaction des enfants respire 0,9 s après le « Quoi ?! ».
  - Rembobinage dans le même plan, sur les quatre « Attends » (14,3 → 15,76 s) : l'image ralentit jusqu'à l'arrêt sur Julie, bouche ouverte (image de 12,8 s).
  - Pause, puis « Bloquer les écrans ?! » 0,06 s après.
  - Coupe franche sur le plan taille de Shmoulik (G2 à partir de 2,66 s), toujours en pause, puis lecture au claquement de doigts. Il n'y a plus d'avance rapide ni de retour sur Claire.
- **Montage v4 des séquences 1 et 2 (29,3 s) : le narrateur prend la télécommande.**
  - Rembobinage (13,45 → 15,0 s) : pendant « Attends, attends, attends, attends… », l'image remonte jusqu'à Claire qui annonce l'interdiction, avec flou, aberration chromatique, bande de défilement et un son de cassette qui recule.
  - Pause sur Claire (image de 9,7 s), avec un coup de zoom et une icône de lecteur vidéo, sur « Bloquer les écrans ?! ».
  - Avance rapide jusqu'aux enfants figés, puis la séquence 2 démarre, toujours en pause : « Ça marche jamais. », puis « Il suffit de télécharger Kizzo ! », avec seulement l'icône Kizzo et le nom, et « Regardez… ». Lecture au claquement de doigts.
  - Plus de désaturation, plus de fiche appli ni de flèche. Pas encore de musique.
- **Montage v3 des séquences 1 et 2 (30,4 s).** La fin de la séquence 1 passe au ralenti et se fige à 15,8 s. Le gel est prolongé de 2,6 s sur l'image figée, avec un bouton pause en verre dépoli qui devient un badge « PAUSE » en haut à gauche, puis « LECTURE » au claquement de doigts (26,3 s). Pendant le gel, l'image est légèrement désaturée.
  - Habillage réaliste : Inter Display, entrées en ressort avec flou de mouvement, surlignage orange sur « JAMAIS », une fiche appli Kizzo en verre dépoli dont le bouton « Télécharger » se change en anneau de progression puis en « Installé », et une flèche dessinée vers le téléphone.
  - Son : ralenti façon bande magnétique, quasi-silence pendant le gel, sons d'interface discrets. Pas de musique en attendant les morceaux choisis par Shmoulik.
- **G2 quater (job a3f98ef3, 144 crédits) retenue.** Shmoulik garde la bouche fermée tout du long (vérifié image par image), secoue la tête de 3,6 à 5,0 s, lève le téléphone à droite de 5,7 à 8,1 s, puis claque des doigts. L'écran Kizzo est incrusté sur le téléphone.
- **Montage des séquences 1 et 2 (27 s).**
  - Voix off : enregistrée par Shmoulik sur ElevenLabs. « Bloquer les écrans ?! » démarre juste après le « Quoi ?! » de Julie (13,5 s). « Ça marche jamais. » arrive avec Shmoulik, « Il suffit de télécharger Kizzo ! » est calé pour que « Kizzo » tombe quand le téléphone apparaît (20,9 s), et « Regardez… » précède le claquement de doigts.
  - Habillage : style autocollant de jeu vidéo (Outfit 900, contour et ombre bleu nuit, rebond en 4 images), « JAMAIS » dans une pastille orange, le logo Kizzo dans une pastille, et une flèche « REGARDEZ ! » vers le téléphone.
  - Musique en trois parties : une comédie sournoise pour la séquence 1, un coup sec au gel de l'image suivi d'une nappe de suspense qui monte, puis une pop lumineuse qui démarre sur « Kizzo ».
  - Mixage final à -14 LUFS, le niveau standard des réseaux sociaux.
- **Séquence 2 retenue : première G2 retravaillée au montage, sans Higgsfield.** On remplace la bouche de Shmoulik pendant ses répliques (repérage des points du visage, puis greffe d'une bouche fermée prise dans ses moments silencieux), donc il ne parle plus. Ses répliques s'affichent mot par mot en motion design à gauche de l'image (Outfit, blanc, mots-clés en orange #F97316, dégradé navy pour la lisibilité). Une voix off ElevenLabs les lit (« Bloquer les écrans… ça marche jamais. Il suffit d'installer Kizzo. »), et « Kizzo. » tombe quand il montre le téléphone. On garde l'ambiance d'origine, le claquement, la notification et Claire.
- **G2 ter (job 77113c57, 144 crédits)** : voix inventée par Seedance, sans référence audio. Voix et lèvres sont générées ensemble, sans effet de doublage. Les quatre plans fixes sont respectés, il n'y a que les trois répliques prévues, et la notification tombe à 8,4 s. L'écran Kizzo est incrusté de 6,9 à 8,1 s ; le seuil de teinte a été resserré pour ne pas confondre l'écran avec la fenêtre bleue derrière.
- **G2 bis (job d8872569, 144 crédits) rejetée** : même avec le vrai vocal en référence audio, Seedance ne reproduit pas la voix de Shmoulik. La hauteur concorde, mais pas le timbre. Le recul de caméra demandé n'a pas été respecté non plus. Conclusion : une personne réelle qui parle face caméra se filme en vrai. L'IA sert à la famille, aux décors et aux voyages.

## 5. Ordre de marche

1. **Voix** : casting d'une voix par personnage, puis génération de toutes les répliques avec ces voix.
2. **Shmoulik** : photos sur Higgsfield, fiche personnage, bloc CAST complété, enregistrement de sa voix.
3. **G1** en Seedance 2.5 1080p. Elle ne dépend pas de Shmoulik.
4. **G2, G3, G4**, dans l'ordre, une prise chacune.
5. **Montage** : voix définitives, synchronisation labiale des gros plans, questions de Kizzo en texte à l'écran, incrustation des écrans réels, carton final, version 9:16.

## 8. Voix off narrateur (ElevenLabs, voix « Père Noël » de Shmoulik)

Une génération par ligne, avec la même voix et les mêmes réglages. On écrit « Kidzo » pour la prononciation ; à l'écran, on garde « Kizzo ».

| # | Moment | Texte |
|---|---|---|
| 1 | Ouverture, avant que Claire appelle les enfants | `[warmly] Dix-neuf heures. L'heure des devoirs… [amused] en théorie.` |
| 2 | Gel de l'image, pause | `[amused] Attends, attends, attends, attends… Bloquer les écrans ?!` |
| 3 | Shmoulik arrive | `[scoffs] Ça marche jamais.` |
| 4 | Il lève le téléphone | `[excited] Il suffit de télécharger Kidzo ! [warmly] Regardez…` |
| 5 | Séquence 3, Sam lit la question | `[curious] Une question… une bonne réponse…` |
| 6 | Arrivée dans le vaisseau | `[excited] et c'est parti pour l'aventure !` |
| 7 | Séquence 4, Claire répond 54 | `[amused] Cinquante-six, Claire. Cinquante-six.` |
| 8 | Retour à la maison, fumée du four | `[sniffs] Ça sent le brûlé…` |
| 9 | Signature finale sur le logo | `[warmly] Avec Kidzo, pour débloquer ton temps d'écran, il suffit d'apprendre tes leçons… [amused] et pour certains… d'apprendre à cuisiner.` |
