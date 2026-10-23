# Génère sources/fiche_tournage.html (pages de téléphone 108 × 192 mm) depuis le texte des scripts du test de 14 jours.
# usage : python3 generer_fiche.py   (puis ./construire.sh pour le PDF)
import html, pathlib, re

ICI = pathlib.Path(__file__).resolve().parent
E = lambda t: html.escape(typo(t))

REGLES = [
    "**Le téléphone à hauteur des yeux**, la fenêtre **devant toi** (jamais dans ton dos). Nettoie l'objectif.",
    "**Vertical**, cadre serré : la tête et les épaules. Regarde l'objectif, pas ton écran.",
    "**La première image, c'est déjà la première phrase.** Pas de « salut », pas de silence avant de parler.",
    "**Une prise par phrase.** Tu te trompes ? Tu reprends la phrase, pas tout. Les silences se coupent au montage.",
    "**Dis-le comme tu le dirais à un ami.** Phrases courtes, un vrai sourire sur le début et sur la fin.",
    "**Garde les prises ratées aussi.** Je choisis au montage.",
]

VIDEOS = [
    dict(
        code="FC1", titre="Marre d'être le méchant ?", jour="dimanche 25 octobre", duree="40 s", mot="BÊTA",
        objets="Une tablette éteinte. Un cahier d'écolier (pour le hook B).",
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
        code="FC2", titre="Arrête de limiter le temps d'écran", jour="jeudi 29 octobre", duree="40 s", mot="CONTRAT",
        objets="Un minuteur de cuisine.",
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
        code="FC3", titre="Relire sa leçon : temps perdu", jour="lundi 2 novembre", duree="45 s", mot="MÉTHODE",
        objets="Un cahier d'écolier à grands carreaux.",
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
]


def typo(t):
    """espaces insécables de la typographie française : « mot », mot : mot ? mot ! 40 %"""
    t = t.replace('« ', '«\u00a0').replace(' »', '\u00a0»')
    return re.sub(r' ([:;?!%])', '\u00a0\\1', t)


def gras(t):
    """**texte** -> <b>texte</b>, le reste échappé"""
    out, parts = [], t.split('**')
    for i, p in enumerate(parts):
        out.append(('<b>%s</b>' if i % 2 else '%s') % E(p))
    return ''.join(out)


def page(contenu, gauche, droite=''):
    return ('<section class="page"><div class="haut"><span>%s</span><span>%s</span></div>%s</section>\n'
            % (E(gauche), E(droite), contenu))


def ligne(n, texte, geste, alerte):
    cls = 'ligne verifier' if alerte else 'ligne'
    a = '<span class="alerte">%s</span>' % E(alerte) if alerte else ''
    g = '<span class="geste">%s</span>' % E(geste) if geste else ''
    return '<div class="%s"><span class="n">%d</span>%s«&nbsp;%s&nbsp;»%s</div>' % (cls, n, a, E(texte), g)


pages = []

# --- page 1 : avant de tourner
pages.append(page(
    '<h1>Tournage de <em>samedi matin</em></h1>'
    '<p style="margin-top:3mm;color:#475569">3 vidéos, environ 45 minutes. Lis chaque page sur ton téléphone, posé contre un mur ou une pile de livres.</p>'
    '<ul class="regles">%s</ul>' % ''.join('<li>%s</li>' % gras(r) for r in REGLES),
    'Avant de tourner', 'Samedi 24 oct.'))

# --- page 2 : l'ordre
pages.append(page(
    '<h1>Dans quel <em>ordre</em> ?</h1>'
    '<p style="margin-top:3mm;color:#475569">Pour chaque vidéo : deux débuts (A et B), puis le même corps. Le montage garde A. B sert au test de hook du 6 novembre : tu ne retournes rien.</p>'
    '<ul class="ordre">'
    '<li>1. Les 3 vidéos, dans l\'ordre FC1, FC2, FC3<span>Les objets sont rangés par vidéo.</span></li>'
    '<li>2. Pour chacune : le hook A, puis le hook B<span>Même cadre, même lumière. Deux prises chacun, si tu veux.</span></li>'
    '<li>3. Puis le corps, phrase par phrase<span>Une prise par phrase. Je les recolle.</span></li>'
    '</ul>'
    '<div class="carte"><b>Ce que je fais ensuite :</b> montage, textes à l\'écran, stickers, sous-titres. Toi, tu ajoutes la musique si tu veux.</div>',
    'Avant de tourner', 'Samedi 24 oct.'))

for v in VIDEOS:
    nb = sum(len(b[1]) for b in v['blocs'])
    pages.append(page(
        '<h1>%s</h1>'
        '<div class="fiche">'
        '<div><b>Publication</b><span>%s, 20 h 45</span></div>'
        '<div><b>Durée</b><span>%s</span></div>'
        '<div><b>Mot-clé</b><span>%s</span></div>'
        '<div><b>À prévoir</b><span>%s</span></div>'
        '<div><b>À tourner</b><span>2 hooks + %d phrases</span></div>'
        '</div>' % (E(v['titre']), E(v['jour']), E(v['duree']), E(v['mot']), E(v['objets']), nb),
        v['code'], 'Le plan'))
    for lettre, texte, scene in v['hooks']:
        pages.append(page(
            '<span class="badge">HOOK %s</span><div class="hook">%s</div>'
            '<div class="scene"><b>Le geste :</b> %s</div>' % (lettre, E(texte), E(scene)),
            v['code'], 'Hook %s' % lettre))
    n = 0
    buf, titre_bloc, budget = [], None, 0
    def vider():
        global buf, budget
        if buf:
            pages.append(page(''.join(buf), v['code'], 'Le corps'))
        buf, budget = [], 0
    for nom, lignes in v['blocs']:
        vider()
        for texte, geste, alerte in lignes:
            cout = len(texte) + (60 if alerte else 0) + (35 if geste else 0)
            if buf and budget + cout > 360:
                vider()
            if not buf:
                buf.append('<div class="bloc">%s</div>' % E(nom))
            n += 1
            buf.append(ligne(n, texte, geste, alerte))
            budget += cout
    vider()

pages.append(page(
    '<h1>Après le <em>tournage</em></h1>'
    '<ul class="regles">'
    '<li><b>Envoie-moi les vidéos telles quelles</b> : sans montage, sans filtre, dans l\'ordre du tournage.</li>'
    '<li><b>Dis-moi quelles lignes « à confirmer »</b> tu as dites, et lesquelles tu as sautées.</li>'
    '<li><b>Je te rends les 3 vidéos montées</b> avant leur publication : FC1 dimanche 25 à 20 h 45.</li>'
    '</ul>'
    '<div class="carte"><b>Rappel :</b> rien n\'est publié sans ton accord. Tes vidéos restent chez moi, hors du dépôt de code.</div>',
    'Après', 'Samedi 24 oct.'))

doc = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche de tournage Kizzo · FC1 FC2 FC3</title>'
       '<link rel="stylesheet" href="tournage.css"></head><body>\n%s</body></html>\n' % ''.join(pages))
(ICI / 'sources' / 'fiche_tournage.html').write_text(doc)
print(len(pages), 'pages')
