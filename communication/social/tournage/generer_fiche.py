# Génère deux fiches de tournage (pages de téléphone 108 × 192 mm) depuis le texte des scripts du test de 14 jours :
# sources/fiche_tournage_1.html (l'essentiel : test, FC1 à FC3, plans de coupe) et fiche_tournage_2.html (la réserve : FC4 à FC7).
# usage : python3 generer_fiche.py   (puis ./construire.sh pour les PDF)
import html, pathlib, re

ICI = pathlib.Path(__file__).resolve().parent
E = lambda t: html.escape(typo(t))

REGLES = [
    "**Le téléphone à hauteur des yeux**, sur un trépied ou calé contre une pile de livres. La fenêtre **devant toi**, jamais dans ton dos. Nettoie l'objectif.",
    "**Vertical**, cadre serré : la tête et les épaules. Regarde l'objectif, pas ton écran.",
    "**Une pièce calme** : ni frigo ni télé, un canapé ou des rideaux pour couper l'écho. Le son compte autant que l'image.",
    "**Une page = un fichier.** Tu lis la page, tu lances l'enregistrement, tu respires une seconde, tu parles, tu respires, tu arrêtes.",
    "**Tu te trompes ?** Tu dis « je reprends » et tu refais la phrase, dans le même fichier. Garde tout : je choisis au montage.",
    "**Dis-le comme tu le dirais à un ami.** Pas de « salut », des phrases courtes, un vrai sourire sur le début et sur la fin.",
]

REGLAGES = [
    "**1080p, 30 images par seconde.** Pas de 4K : les fichiers seraient trop lourds pour être envoyés.",
    "**HDR vidéo coupé**, sinon les couleurs sortent délavées au montage. iPhone : Réglages, Appareil photo, Enregistrer une vidéo.",
    "**Mode avion et Ne pas déranger.** Une notification pendant une prise, et le son est perdu.",
    "**5 Go libres** sur le téléphone, et la batterie chargée.",
    "**Un second écran pour lire la fiche** (tablette, ordinateur), posé juste sous le téléphone qui filme. Ton regard reste près de l'objectif.",
]

REGLES_COUPES = [
    "**Téléphone fixe** (trépied ou pile de livres), vertical. Seules tes mains bougent.",
    "**Deux prises de 6 secondes** pour chaque plan. Garde le son : le cahier, le minuteur.",
    "**Jamais de visage d'enfant.**",
    "**Envoie-les dans l'ordre**, de P1 à P14.",
]

OBJETS = ["un trépied, ou une pile de livres", "un second écran pour lire la fiche", "un cahier d'écolier à grands carreaux",
          "un stylo et des post-it", "un surligneur", "un minuteur de cuisine", "une tablette", "le contrat d'écran imprimé (kizzo-contrat-ecran.pdf), et un aimant",
          "une horloge ou une montre", "une pile de cahiers et de livres", "une lampe branchée, pour la prise", "un second t-shirt, pour le lot 2"]

# (code, titre, ce qu'on filme, seulement pour la réserve ?)
COUPES = [
    ("P1", "Le cahier qu'on referme", "Un cahier ouvert sur une table. Une main le referme d'un coup sec. Gros plan, avec le bruit.", False),
    ("P2", "La question sur un post-it", "Une main écrit « Pourquoi ? » sur un post-it et le colle sur une page de cahier. Plan serré.", False),
    ("P3", "Le minuteur", "Un minuteur de cuisine : une main tourne le cadran, puis la sonnerie retentit. Gros plan, avec le son.", False),
    ("P4", "La tablette éteinte", "Une tablette éteinte posée sur une table. Une main la pousse doucement hors du cadre.", False),
    ("P5", "Le contrat sur le frigo", "Le contrat d'écran imprimé, tenu par un aimant sur le frigo. Plan fixe, ou très lent zoom avant.", False),
    ("P6", "La signature", "Une main signe le contrat au stylo. Vue de dessus.", False),
    ("P7", "L'horloge", "Une horloge ou une montre qui indique 20 h. Plan fixe.", True),
    ("P8", "La fenêtre le soir", "La fenêtre, vue de l'intérieur, à la tombée de la nuit. Plan fixe.", True),
    ("P9", "La pile de cahiers", "Une pile de cahiers et de livres. Une main en prend un.", False),
    ("P10", "Le surligneur barré", "Un surligneur passe sur une ligne de texte, puis un stylo la barre d'une croix. Plan serré.", False),
    ("P11", "La prise qu'on débranche", "Une main débranche une prise (une lampe, pas ta box). Gros plan.", False),
    ("P12", "Le téléphone retourné", "Un téléphone posé face contre la table. Une main le repousse. Vue de côté.", True),
    ("P13", "La leçon prise en photo", "Une tablette (ou un second téléphone) photographie une page de cahier. On voit l'écran de l'appareil photo. Vue de côté.", False),
    ("P14", "Les doigts qui comptent", "Une main compte sur ses doigts : 1, 2, 3. Plan serré, fond neutre.", False),
]

VIDEOS = [
    dict(
        code="FC1", titre="Marre d'être le méchant ?", jour="dimanche 25 octobre, 20 h 45", duree="40 s", mot="BÊTA",
        objets="Une tablette éteinte. Un cahier d'écolier (pour le hook B).", plans="P1, P2, P4, P11, P13",
        hooks=[
            ("A", "Marre d'être le méchant ? Celui qui dit « éteins ça », tous les soirs ?",
             "Une tablette éteinte dans une main, l'autre main levée comme un « stop »."),
            ("B", "J'ai 23 ans. Pas d'enfant. Et je construis une appli pour les parents. Je sais ce que tu te dis : « il n'y connaît rien. »",
             "Un cahier d'écolier à la main."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Et non, ce n'est pas toi le problème.", None, None),
                ("J'ai 23 ans, pas d'enfant. Mais j'avais une console dans ma chambre, et des parents qui criaient « éteins ça ».", None,
                 "À confirmer : tu ne dis cette phrase que si c'est vrai. Sinon, saute-la."),
            ]),
            ("Valeur", [
                ("Le problème, ce n'est pas l'écran. C'est la coupure.", None, None),
                ("L'écran s'arrête sans prévenir, et c'est la crise.", None, None),
                ("Ce qui marche : qu'il le gagne. Pas qu'on le lui arrache.", None, None),
                ("Ce soir, essaie : avant l'écran, trois questions sur sa leçon.", None, None),
            ]),
            ("Climax", [
                ("Alors on construit une appli où ce n'est plus toi qui dis non.", "Tu poses la tablette sur la table.", None),
                ("C'est sa leçon qui dit oui.", None, None),
                ("Tu prends sa leçon en photo. Le quiz arrive sur son écran. Bonne réponse : du temps d'écran.", None, None),
            ]),
            ("Appel à l'action", [
                ("On ouvre la bêta aux premières familles. Commente BÊTA, je t'envoie l'accès.", "Un vrai sourire. Tu montres la caméra du doigt à « Commente ».", None),
            ]),
        ],
    ),
    dict(
        code="FC2", titre="Arrête de limiter le temps d'écran", jour="jeudi 29 octobre, 20 h 45", duree="40 s", mot="CONTRAT",
        objets="Un minuteur de cuisine.", plans="P3, P5, P6, P9, P11",
        hooks=[
            ("A", "Arrête de limiter le temps d'écran de ton enfant.",
             "Le minuteur sonne dans ta main. Tu le poses d'un geste sec, hors du cadre, sur la dernière syllabe."),
            ("B", "Couper le Wi-Fi marche 30 secondes. Alors arrête de limiter son temps d'écran. Tout seul.",
             "Pas d'objet. Tu regardes l'objectif, l'air de celui qui sait."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Je sais, ça va en énerver certains.", None, None),
                ("Et non, je ne te dis pas de le laisser jouer six heures.", None, None),
                ("Je te dis d'arrêter de le limiter… tout seul.", None, None),
            ]),
            ("Valeur", [
                ("Un : écrivez la règle ensemble. Combien, quand. Avec des chiffres.", "Tu comptes sur tes doigts.", None),
                ("Deux : prévenez cinq minutes avant. Et laissez-le finir sa partie.", None, None),
                ("Trois : faites-lui gagner une partie de son temps. Devoirs faits, leçon sue.", None, None),
            ]),
            ("Climax", [
                ("Le temps d'écran ne crée pas la crise. C'est la façon dont il s'arrête.", None, None),
                ("Un minuteur, c'est toi contre lui. Un contrat, c'est vous deux contre l'écran.", "Tu poses le minuteur sur la table à « minuteur ».", None),
            ]),
            ("Appel à l'action", [
                ("J'ai fait un contrat d'écran à remplir avec lui. Commente CONTRAT, je te l'envoie.", "Un vrai sourire.", None),
            ]),
        ],
    ),
    dict(
        code="FC3", titre="Relire sa leçon : temps perdu", jour="lundi 2 novembre, 20 h 45", duree="45 s", mot="MÉTHODE",
        objets="Un cahier d'écolier à grands carreaux. Un surligneur (pour le hook B).", plans="P1, P2, P10, P14",
        hooks=[
            ("A", "Si ton enfant relit sa leçon pour l'apprendre, il perd son temps.",
             "Tu tiens le cahier ouvert. Tu le refermes d'un coup sec sur « temps » : le bruit est le premier son."),
            ("B", "Le surligneur n'aide presque pas à retenir. Relire non plus.",
             "Un surligneur dans la main, que tu reposes à « non plus »."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Et non, ce n'est pas une question de mémoire.", None, None),
                ("Deux chercheurs américains l'ont mesuré en 2006.", None, None),
                ("Et le résultat est presque injuste.", None, None),
            ]),
            ("Valeur", [
                ("Ce soir, fais ça.", None, None),
                ("Un : il lit sa leçon une fois. Tu fermes le cahier.", "Tu fermes le cahier.", None),
                ("Deux : tu lui poses cinq questions. Il répond de mémoire.", None, None),
                ("Trois : demain, trois questions. Sans relire avant.", None, None),
                ("La règle : il cherche dans sa tête avant de chercher dans le cahier.", "Tu te tapotes la tempe.", None),
            ]),
            ("Climax", [
                ("L'étude : un groupe relit quatre fois. L'autre lit une fois, et s'interroge trois fois.", "Je mets le graphique à l'écran au montage.", None),
                ("Cinq minutes après, ceux qui relisent gagnent.", None, None),
                ("Une semaine après, c'est l'inverse : 40 % contre 60 %.", None, None),
                ("Relire, ça marche… pendant cinq minutes.", "Petite pause avant « pendant cinq minutes ».", None),
            ]),
            ("Appel à l'action", [
                ("Les vingt questions qui marchent sur toutes les leçons ? Commente MÉTHODE.", "Un vrai sourire.", None),
            ]),
        ],
    ),
    dict(
        code="FC4", titre="Ne dis plus « plus que 5 minutes »", jour="en réserve, à partir du 31 octobre", duree="45 s", mot="CRISE",
        objets="Un minuteur de cuisine.", plans="P3, P4, P7, P11",
        hooks=[
            ("A", "Ne dis plus jamais « plus que 5 minutes ».",
             "Le minuteur dans une main. L'autre index secoue un « non », les yeux dans l'objectif."),
            ("B", "Tu as dit « plus que 5 minutes » quatre fois ce soir. Voilà ce que ton enfant en retient.",
             "Pas d'objet. Tu lèves quatre doigts, l'air fatigué."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Et non, ce n'est pas pour être sévère.", None, None),
                ("Ça prend dix secondes. Essaie ce soir.", None, None),
            ]),
            ("Valeur", [
                ("Un : « dans cinq minutes, on arrête. Tu mets le minuteur ? »", "Tu tournes le cadran du minuteur.", None),
                ("Il voit la fin arriver. Et c'est lui qui la déclenche.", None, None),
                ("Deux : « tu finis ta partie, et après on arrête. »", None, None),
                ("Couper au milieu, c'est perdre. Finir, c'est gagner.", None, None),
                ("Trois : « après l'écran, on fait quoi : ceci ou cela ? »", None, None),
                ("Il garde la main.", None, None),
            ]),
            ("Climax", [
                ("Le vrai problème, ce n'est pas « plus que 5 minutes ».", None, None),
                ("C'est la quatrième fois que tu dis oui.", "Petite pause avant « quatrième ».", None),
                ("Chaque fois, il retient une chose : négocier, ça marche.", None, None),
                ("Une seule annonce. Et on s'y tient.", None, None),
            ]),
            ("Appel à l'action", [
                ("J'ai mis les sept phrases dans un PDF. Commente CRISE, je te l'envoie.", "Un vrai sourire. Tu montres la caméra du doigt à « Commente ».", None),
            ]),
        ],
    ),
    dict(
        code="FC5", titre="« Tu la sais, ta leçon ? »", jour="en réserve, à partir du 31 octobre", duree="40 s", mot="MÉTHODE",
        objets="Un cahier d'écolier à grands carreaux.", plans="P1, P2, P10",
        hooks=[
            ("A", "Ne demande plus jamais à ton enfant : « tu la sais, ta leçon ? »",
             "Le cahier ouvert dans une main. Tu fais la tête du parent qui interroge, sourcils levés."),
            ("B", "Ton enfant te dit « oui, je la sais ». Il ne ment pas. Il se trompe.",
             "Pas d'objet. Tu hausses les épaules, les yeux dans l'objectif."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Il te répondra oui. Même quand il ne la sait pas.", None, None),
                ("Et ce n'est pas un mensonge.", None, None),
            ]),
            ("Valeur", [
                ("Demande plutôt : « explique-la-moi avec tes mots. »", None, None),
                ("Ou : « donne-moi un exemple. »", None, None),
                ("Ou : « si c'était toi le prof, tu mettrais quoi au contrôle ? »", None, None),
            ]),
            ("Climax", [
                ("Pourquoi ça marche ? Reconnaître une leçon, ce n'est pas la savoir.", None, None),
                ("Relire donne l'impression de savoir.", None, None),
                ("Expliquer, c'est aller la chercher dans sa tête.", "Tu te tapotes la tempe.", None),
            ]),
            ("Appel à l'action", [
                ("J'ai listé vingt questions qui marchent sur toutes les leçons. Commente MÉTHODE.", "Un vrai sourire.", None),
            ]),
        ],
    ),
    dict(
        code="FC6", titre="Ton contrat d'écran va échouer", jour="en réserve, à partir du 31 octobre", duree="40 s", mot="CONTRAT",
        objets="Le contrat d'écran imprimé.", plans="P5, P6, P8, P12",
        hooks=[
            ("A", "Ton contrat d'écran va échouer. Si tu fais l'une de ces trois erreurs.",
             "Tu tiens le contrat imprimé devant toi et tu secoues lentement la tête."),
            ("B", "Tu as fait un contrat d'écran. Au bout d'une semaine, plus personne n'en parle ?",
             "Le contrat est derrière toi, sur le frigo. Tu le regardes, puis l'objectif."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Et non, ce n'est pas parce que ton enfant triche.", None, None),
                ("Trois erreurs. On en fait tous au moins une.", None, None),
            ]),
            ("Valeur", [
                ("Un : l'écrire seul, et le présenter comme un ultimatum.", "Tu lèves un doigt.", None),
                ("Deux : le changer un soir de fatigue. « Bon, ce soir, ça va… »", "Tu imites la voix fatiguée.", None),
                ("Trois : oublier les engagements des parents.", None, None),
                ("Lui, il ne les oubliera pas.", None, None),
            ]),
            ("Climax", [
                ("Un contrat ne tient que s'il est tenu des deux côtés.", None, None),
                ("Y compris par toi.", None, None),
                ("Pas de téléphone à table ? Ça vaut pour toi aussi.", None, None),
            ]),
            ("Appel à l'action", [
                ("Notre modèle prévoit même ce que les parents s'engagent à faire. Commente CONTRAT.", "Un vrai sourire.", None),
            ]),
        ],
    ),
    dict(
        code="FC7", titre="Tout réviser la veille : ça marche… pour le contrôle", jour="en réserve, à partir du 31 octobre", duree="45 s", mot="MÉTHODE",
        objets="Un cahier d'écolier.", plans="P2, P7, P10, P14",
        hooks=[
            ("A", "Tout réviser la veille, ça marche. Pour le contrôle. Pas pour après.",
             "Le cahier ouvert devant toi. Tu le fermes sur « Pas pour après »."),
            ("B", "Pourquoi ton enfant oublie sa leçon une semaine après le contrôle ?",
             "Pas d'objet. Un air perplexe, les yeux dans l'objectif."),
        ],
        blocs=[
            ("Pic d'intrigue", [
                ("Et non, ce n'est pas sa mémoire.", None, None),
                ("C'est le calendrier.", None, None),
            ]),
            ("Valeur", [
                ("Aujourd'hui : cinq questions.", "Tu montres cinq doigts.", None),
                ("Demain : trois questions.", None, None),
                ("Dans trois jours : trois questions.", None, None),
                ("La veille du contrôle : seulement celles qu'il a ratées.", None, None),
            ]),
            ("Climax", [
                ("En 2013, des chercheurs ont comparé dix méthodes de révision.", None, None),
                ("Les deux plus utiles : se tester, et étaler ses révisions.", None, None),
                ("Relire ? Parmi les moins utiles.", "Petite pause avant « Parmi les moins utiles ».", None),
            ]),
            ("Appel à l'action", [
                ("Le calendrier et les vingt questions : commente MÉTHODE.", "Un vrai sourire.", None),
            ]),
        ],
    ),
]


def typo(t):
    """espaces insécables de la typographie française : « mot », mot : mot ? mot ! 40 %"""
    t = t.replace('« ', '« ').replace(' »', ' »')
    return re.sub(r' ([:;?!%])', ' \\1', t)


def gras(t):
    """**texte** -> <b>texte</b>, le reste échappé"""
    out, parts = [], t.split('**')
    for i, p in enumerate(parts):
        out.append(('<b>%s</b>' if i % 2 else '%s') % E(p))
    return ''.join(out)


def liste(items):
    return '<ul class="regles">%s</ul>' % ''.join('<li>%s</li>' % gras(r) for r in items)


def page(contenu, gauche, droite=''):
    return ('<section class="page"><div class="haut"><span>%s</span><span>%s</span></div>%s</section>\n'
            % (E(gauche), E(droite), contenu))


def ligne(n, texte, geste, alerte):
    cls = 'ligne verifier' if alerte else 'ligne'
    a = '<span class="alerte">%s</span>' % E(alerte) if alerte else ''
    g = '<span class="geste">%s</span>' % E(geste) if geste else ''
    texte = texte.replace('« ', '“').replace(' »', '”')   # les citations de la phrase sont dans des guillemets : “ ”
    return '<div class="%s"><span class="n">%d</span>%s«&nbsp;%s&nbsp;»%s</div>' % (cls, n, a, E(texte), g)


def pages_corps(v):
    """les phrases de la vidéo, bloc par bloc, réparties en pages (une page = un fichier à tourner)"""
    groupes = []   # (nom du bloc, lignes de la page)
    for nom, lignes in v['blocs']:
        courant, budget = [], 0
        for texte, geste, alerte in lignes:
            cout = len(texte) + (60 if alerte else 0) + (35 if geste else 0)
            if courant and budget + cout > 360:
                groupes.append((nom, courant))
                courant, budget = [], 0
            courant.append((texte, geste, alerte))
            budget += cout
        groupes.append((nom, courant))
    return groupes


def pages_video(v):
    """le plan, les deux hooks, puis le corps"""
    groupes = pages_corps(v)
    nb = sum(len(g[1]) for g in groupes)
    pages = [page(
        '<h1>%s</h1>'
        '<div class="fiche">'
        '<div><b>Publication</b><span>%s</span></div>'
        '<div><b>Durée</b><span>%s</span></div>'
        '<div><b>Mot-clé</b><span>%s</span></div>'
        '<div><b>À prévoir</b><span>%s</span></div>'
        '<div><b>Plans de coupe</b><span>%s</span></div>'
        '<div><b>À tourner</b><span>%d fichiers : 2 hooks + %d pages</span></div>'
        '</div>' % (E(v['titre']), E(v['jour']), E(v['duree']), E(v['mot']), E(v['objets']), E(v['plans']), 2 + len(groupes), len(groupes)),
        v['code'], 'Le plan')]
    for lettre, texte, scene in v['hooks']:
        pages.append(page(
            '<span class="badge">HOOK %s</span><div class="hook">%s</div>'
            '<div class="scene"><b>Le geste :</b> %s</div>' % (lettre, E(texte), E(scene)),
            v['code'], 'Hook %s' % lettre))
    n = 0
    for nom, lignes in groupes:
        corps = ['<div class="bloc">%s</div>' % E(nom)]
        for texte, geste, alerte in lignes:
            n += 1
            corps.append(ligne(n, texte, geste, alerte))
        pages.append(page(''.join(corps), v['code'], 'Le corps'))
    return pages


def pages_coupes():
    """l'intro, puis quatre plans par page"""
    pages = [page(
        '<h1>Les <em>plans de coupe</em></h1>'
        '<p style="margin-top:3mm;color:#475569">Des images de 6 secondes que je glisse par-dessus ta voix, pour changer d\'image toutes les 2 à 3 secondes.</p>'
        + liste(REGLES_COUPES) +
        '<div class="carte"><b>Ceux marqués « réserve »</b> ne servent qu\'aux vidéos du second PDF. Si le temps manque, saute-les.</div>',
        'Les plans de coupe', 'P1 à P14')]
    cartes = ['<div class="plan%s"><span class="code">%s</span><b>%s</b><p>%s</p>%s</div>'
              % (' reserve' if reserve else '', code, E(titre), E(texte), '<i>Réserve</i>' if reserve else '')
              for code, titre, texte, reserve in COUPES]
    for i in range(0, len(cartes), 4):
        lot = COUPES[i:i + 4]
        pages.append(page(''.join(cartes[i:i + 4]), 'Les plans de coupe', '%s à %s' % (lot[0][0], lot[-1][0])))
    return pages


def document(nom, titre, pages):
    doc = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>%s</title>'
           '<link rel="stylesheet" href="tournage.css"></head><body>\n%s</body></html>\n' % (titre, ''.join(pages)))
    (ICI / 'sources' / nom).write_text(doc)
    print(nom, ':', len(pages), 'pages')


# --- lot 1 : l'essentiel
lot1 = [
    page('<h1>Le <em>tournage</em></h1>'
         '<p style="margin-top:3mm;color:#475569">3 vidéos et 14 plans de coupe : environ 1 h 15. Tu filmes avec un téléphone et tu lis cette fiche sur un second écran, posé juste sous l\'objectif.</p>'
         '<ul class="ordre">'
         '<li>1. Le test de 20 secondes<span>5 min. Tu me l\'envoies avant de continuer.</span></li>'
         '<li>2. FC1, FC2, FC3<span>Les 3 vidéos du test : 40 min. Hooks A et B, puis le corps.</span></li>'
         '<li>3. Les 14 plans de coupe<span>25 min. Les images que je glisse par-dessus ta voix.</span></li>'
         '<li>4. Les 4 vidéos en réserve<span>1 h, dans l\'autre PDF, si tu as encore l\'énergie.</span></li>'
         '</ul>',
         'Avant de tourner', 'Lot 1 sur 2'),
    page('<h1>À <em>sortir</em> avant</h1>'
         '<p style="margin-top:3mm;color:#475569">Tout sur la table avant la première prise : on ne cherche rien entre deux fichiers.</p>'
         '<ul class="coches">%s</ul>' % ''.join('<li>%s</li>' % E(o) for o in OBJETS),
         'Avant de tourner', 'La liste'),
    page('<h1>Image et <em>son</em></h1>' + liste(REGLES), 'Avant de tourner', 'Les 6 règles'),
    page('<h1>Les <em>réglages</em> du téléphone</h1>' + liste(REGLAGES), 'Avant de tourner', '1 minute'),
    page('<h1>D\'abord, un test de <em>20 secondes</em></h1>'
         '<p style="margin-top:3mm;color:#475569">Tu n\'as qu\'une fenêtre de tournage. Vingt secondes pour être sûr qu\'elle sert.</p>'
         + liste(['**Filme la page « Hook A » de FC1**, puis la première phrase du corps : « Et non, ce n\'est pas toi le problème. »',
                  '**Envoie-moi ce fichier tel quel**, en pièce jointe dans la conversation. Pas par WhatsApp : il écrase la qualité.',
                  '**Je vérifie** la lumière, le cadre, le son, et que le fichier arrive entier.']) +
         '<div class="carte"><b>Pourquoi :</b> découvrir après le tournage que le son résonne, ou que la vidéo ne passe pas, serait trop tard.</div>',
         'Avant de tourner', 'Le test'),
]
for v in VIDEOS[:3]:
    lot1 += pages_video(v)
lot1 += pages_coupes()
lot1.append(page(
    '<h1>Après le <em>tournage</em></h1>'
    + liste(['**Envoie les fichiers de FC1 dès qu\'ils sont tournés.** Je commence le montage pendant que tu continues : FC1 sort dimanche 25 à 20 h 45.',
             '**Envoie-les tels quels** : sans montage, sans filtre, dans l\'ordre du tournage, par paquets de 10. Pas par WhatsApp.',
             '**Dis-moi quelles lignes « à confirmer »** tu as dites, et lesquelles tu as sautées.',
             '**Je te rends chaque vidéo montée** la veille de sa publication, à 18 h.']) +
    '<div class="carte"><b>Rappel :</b> rien n\'est publié sans ton accord. Tes vidéos restent chez moi, hors du dépôt de code.</div>',
    'Après', 'Lot 1 sur 2'))
document('fiche_tournage_1.html', 'Fiche de tournage Kizzo · lot 1 · FC1 FC2 FC3', lot1)

# --- lot 2 : la réserve
lot2 = [
    page('<h1>La <em>réserve</em></h1>'
         '<p style="margin-top:3mm;color:#475569">4 vidéos, environ 1 h. À tourner dans la foulée du lot 1, tant que le décor et la lumière sont en place. Elles sortent à partir du bilan du 31 octobre, si la semaine 1 le justifie.</p>'
         '<ul class="ordre">'
         '<li>1. Change de haut<span>Un autre t-shirt, pour que les vidéos ne se ressemblent pas toutes.</span></li>'
         '<li>2. FC4, FC5, FC6, FC7<span>Même cadre, mêmes réglages. Hooks A et B, puis le corps.</span></li>'
         '<li>3. Les plans de coupe sont déjà faits<span>P1 à P14, dans le premier PDF.</span></li>'
         '</ul>'
         '<div class="carte"><b>Rappel :</b> une page = un fichier. Tu te trompes ? Tu dis « je reprends » et tu refais la phrase.</div>',
         'Avant de tourner', 'Lot 2 sur 2'),
]
for v in VIDEOS[3:]:
    lot2 += pages_video(v)
lot2.append(page(
    '<h1>Après le <em>tournage</em></h1>'
    + liste(['**Envoie les fichiers tels quels**, dans l\'ordre du tournage, par paquets de 10. Pas par WhatsApp.',
             '**Dis-moi quelles lignes** tu as sautées, s\'il y en a.',
             '**Je monte ces vidéos au fil de l\'eau** et je te les propose quand le bilan du 31 octobre le demande.']) +
    '<div class="carte"><b>Rappel :</b> rien n\'est publié sans ton accord. Tes vidéos restent chez moi, hors du dépôt de code.</div>',
    'Après', 'Lot 2 sur 2'))
document('fiche_tournage_2.html', 'Fiche de tournage Kizzo · lot 2 · FC4 FC5 FC6 FC7', lot2)
