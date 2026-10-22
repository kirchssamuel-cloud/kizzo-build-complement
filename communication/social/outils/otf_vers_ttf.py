# Convertit une police OpenType à contours CFF (.otf) en TrueType (.ttf) avec fontTools.
# Chromium intègre les .otf CFF dans les PDF en glyphes Type 3 (moins nets) ; les .ttf passent en TrueType.
# usage : python3 otf_vers_ttf.py entree.otf sortie.ttf
import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

src, dst = sys.argv[1:3]
f = TTFont(src)
assert f.sfntVersion == 'OTTO' and 'CFF ' in f, 'police déjà en TrueType'
ordre = f.getGlyphOrder(); jeu = f.getGlyphSet()
glyf = newTable('glyf'); glyf.glyphOrder = ordre; glyf.glyphs = {}
for nom in ordre:
    stylo = TTGlyphPen(jeu)
    jeu[nom].draw(Cu2QuPen(stylo, 1.0, reverse_direction=True))
    glyf.glyphs[nom] = stylo.glyph()
f['loca'] = newTable('loca'); f['glyf'] = glyf
del f['CFF ']
if 'VORG' in f: del f['VORG']
glyf.compile(f)
for nom, g in glyf.glyphs.items():                     # approche gauche recalculée sur les nouveaux contours
    if hasattr(g, 'xMin'): f['hmtx'][nom] = (f['hmtx'][nom][0], g.xMin)
maxp = newTable('maxp'); maxp.tableVersion = 0x00010000
for k in ('maxZones',): setattr(maxp, k, 1)
for k in ('maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs', 'maxStackElements', 'maxSizeOfInstructions'):
    setattr(maxp, k, 0)
maxp.maxComponentElements = max(len(getattr(g, 'components', []) or []) for g in glyf.glyphs.values())
f['maxp'] = maxp
post = f['post']; post.formatType = 2.0; post.extraNames = []; post.mapping = {}; post.glyphOrder = ordre
f['head'].glyphDataFormat = 0
f.sfntVersion = '\x00\x01\x00\x00'
f.save(dst)
print('ok', dst)
