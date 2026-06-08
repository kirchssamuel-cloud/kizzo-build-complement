import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { sendPushToUser } from '../../lib/push';

const createDemandeSchema = z.object({
  profilEnfantId: z.string().uuid(),
  minutes: z.number().int().refine((v) => [15, 30, 60].includes(v), {
    message: 'Minutes doit être 15, 30 ou 60',
  }),
  message: z.string().max(200).optional(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createDemandeSchema.parse(req.body);
  const profil = await prisma.profilEnfant.findUnique({
    where: { id: parsed.profilEnfantId },
  });
  if (!profil) throw new HttpError(404, 'Profil enfant introuvable');

  const demande = await prisma.demandeTemps.create({
    data: {
      profilEnfantId: parsed.profilEnfantId,
      minutes: parsed.minutes,
      message: parsed.message,
    },
  });

  await prisma.notification.create({
    data: {
      utilisateurId: profil.parentId,
      profilEnfantId: profil.id,
      type: 'demande_temps',
      niveau: 'attention',
      titre: `${profil.prenom} demande du temps`,
      corps: parsed.message ?? `Demande de ${parsed.minutes} minutes supplémentaires.`,
      donnees: { demandeId: demande.id },
    },
  });

  // Push temps réel vers le parent (respecte la préférence `demande_temps`).
  // Non bloquant : un échec d'envoi ne doit pas faire échouer la demande.
  try {
    await sendPushToUser(profil.parentId, {
      titre: `${profil.prenom} demande du temps`,
      corps: parsed.message ?? `Demande de ${parsed.minutes} minutes supplémentaires.`,
      donnees: {
        action: 'demandeTemps',
        demandeId: demande.id,
        minutes: String(parsed.minutes),
      },
      type: 'demande_temps',
    });
  } catch (err) {
    logger.error({ err, demandeId: demande.id }, 'Échec envoi push demande de temps');
  }

  return res.status(201).json({ demande });
});
