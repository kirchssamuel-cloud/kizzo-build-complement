import type { Request, Response } from 'express';
import { TypeBadge } from '@prisma/client';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';

/**
 * Catalogue des badges (CDC E30). Libellés/descriptions côté serveur pour rester
 * la source de vérité ; l'app n'a qu'à afficher `catalogue` + `acquis`.
 * L'ordre du tableau définit l'ordre d'affichage.
 */
const CATALOGUE: Array<{ type: TypeBadge; titre: string; description: string }> = [
  { type: TypeBadge.lecteur, titre: 'Lecteur', description: 'Réussir 5 quiz de français.' },
  { type: TypeBadge.defis_champion, titre: 'Champion', description: 'Réussir 20 défis.' },
  { type: TypeBadge.precis, titre: 'Précis', description: 'Obtenir 100 % à un quiz.' },
  { type: TypeBadge.ponctuel, titre: 'Ponctuel', description: 'Faire un quiz 5 jours d’affilée.' },
  { type: TypeBadge.curieux, titre: 'Curieux', description: 'Essayer toutes les matières.' },
  { type: TypeBadge.matinal, titre: 'Matinal', description: 'Réussir un quiz avant 9h.' },
  { type: TypeBadge.marathon, titre: 'Marathon', description: 'Faire 3 quiz dans la journée.' },
  { type: TypeBadge.artistique, titre: 'Artiste', description: 'Réussir 5 quiz d’arts.' },
  { type: TypeBadge.scientifique, titre: 'Scientifique', description: 'Réussir 5 quiz de sciences.' },
];

/**
 * Résout le profil enfant à partir du header `X-Kizzo-Appareil-Id` et vérifie
 * que l'appareil appartient bien au parent authentifié (même schéma que /home).
 */
async function resolveProfil(req: Request) {
  const appareilId = req.headers['x-kizzo-appareil-id'];
  if (!appareilId || typeof appareilId !== 'string') {
    throw new HttpError(400, 'Header X-Kizzo-Appareil-Id manquant');
  }
  const appareil = await prisma.appareil.findUnique({
    where: { id: appareilId },
    include: { profilEnfant: true },
  });
  if (!appareil) throw new HttpError(404, 'Appareil introuvable');
  if (appareil.profilEnfant.parentId !== req.userId) {
    throw new HttpError(403, 'Accès refusé');
  }
  return appareil.profilEnfant;
}

/**
 * GET /enfant/badges
 * Retourne le catalogue complet annoté du statut d'obtention + date, pour que
 * l'écran Badges affiche les badges acquis ET ceux encore à débloquer.
 */
export const listBadges = asyncHandler(async (req: Request, res: Response) => {
  const profil = await resolveProfil(req);

  const obtenus = await prisma.badge.findMany({
    where: { profilEnfantId: profil.id },
    orderBy: { dateObtention: 'asc' },
  });
  const dateParType = new Map<TypeBadge, Date>();
  for (const b of obtenus) {
    if (!dateParType.has(b.typeBadge)) dateParType.set(b.typeBadge, b.dateObtention);
  }

  const badges = CATALOGUE.map((c) => ({
    type: c.type,
    titre: c.titre,
    description: c.description,
    acquis: dateParType.has(c.type),
    dateObtention: dateParType.get(c.type) ?? null,
  }));

  return res.json({ badges, nombreAcquis: dateParType.size, total: CATALOGUE.length });
});
