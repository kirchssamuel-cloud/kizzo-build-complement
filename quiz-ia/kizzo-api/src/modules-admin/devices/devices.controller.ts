import type { Request, Response } from 'express';
import { z } from 'zod';
import { Plateforme } from '@prisma/client';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { ensureAdminScope } from '../admin-scope';

/**
 * Vue parc d'appareils côté back-office.
 *
 * Le `tokenPush` n'est JAMAIS sélectionné : il ne doit pas quitter le serveur
 * (cf. règle sécurité — tokens push jamais exposés en réponse API). On expose
 * en revanche `tokenPushPresent` (booléen dérivé) pour le diagnostic.
 */

const deviceSelect = {
  id: true,
  profilEnfantId: true,
  nomAffichage: true,
  plateforme: true,
  modele: true,
  versionOs: true,
  versionApp: true,
  actif: true,
  derniereSync: true,
  dateAppairage: true,
  modeSupervise: true,
  vpnActif: true,
  permissionStore: true,
  profilEnfant: {
    select: { id: true, prenom: true, parentId: true },
  },
} as const;

const listQuerySchema = z.object({
  statut: z.enum(['actif', 'inactif']).optional(),
  plateforme: z.nativeEnum(Plateforme).optional(),
  parentId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  ensureAdminScope(req);
  const { statut, plateforme, parentId, page, pageSize } = listQuerySchema.parse(req.query);

  const where = {
    ...(statut ? { actif: statut === 'actif' } : {}),
    ...(plateforme ? { plateforme } : {}),
    ...(parentId ? { profilEnfant: { parentId } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.appareil.count({ where }),
    prisma.appareil.findMany({
      where,
      orderBy: { dateAppairage: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { ...deviceSelect, tokenPush: true },
    }),
  ]);

  const items = rows.map(({ tokenPush, ...d }) => ({ ...d, tokenPushPresent: tokenPush != null }));
  return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const detail = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  ensureAdminScope(req);
  const row = await prisma.appareil.findUnique({
    where: { id: req.params.id },
    select: { ...deviceSelect, tokenPush: true },
  });
  if (!row) throw new HttpError(404, 'Appareil introuvable');
  const { tokenPush, ...d } = row;
  return res.json({ appareil: { ...d, tokenPushPresent: tokenPush != null } });
});

const patchSchema = z.object({
  action: z.enum(['desappairer', 'suspendre', 'reactiver']),
});

export const update = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  ensureAdminScope(req);
  const { action } = patchSchema.parse(req.body);

  const existing = await prisma.appareil.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'Appareil introuvable');

  const data =
    action === 'desappairer'
      ? { actif: false, tokenPush: null, codeAppairage: null, dateCodeAppairage: null }
      : action === 'suspendre'
        ? { actif: false }
        : { actif: true };

  const updated = await prisma.appareil.update({
    where: { id: existing.id },
    data,
    select: { ...deviceSelect, tokenPush: true },
  });
  const { tokenPush, ...d } = updated;
  return res.json({ appareil: { ...d, tokenPushPresent: tokenPush != null } });
});
