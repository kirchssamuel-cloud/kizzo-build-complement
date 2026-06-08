import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { StatutCompte } from '@prisma/client';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
  q: z.string().optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, q } = listQuerySchema.parse(req.query);
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { prenom: { contains: q, mode: 'insensitive' as const } },
          { nom: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};
  const [total, items] = await Promise.all([
    prisma.utilisateur.count({ where }),
    prisma.utilisateur.findMany({
      where,
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true,
        statut: true,
        plan: true,
        dateCreation: true,
        derniereConnexion: true,
      },
    }),
  ]);
  return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

const updateStatutSchema = z.object({ statut: z.nativeEnum(StatutCompte) });

export const updateStatut = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const parsed = updateStatutSchema.parse(req.body);
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: req.params.id } });
  if (!utilisateur) throw new HttpError(404, 'Utilisateur introuvable');
  const updated = await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { statut: parsed.statut },
  });
  return res.json({ utilisateur: updated });
});
