import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { ensureAdminScope } from '../admin-scope';

/**
 * Événements de sécurité — **vue d'agrégation en lecture seule**.
 *
 * Il n'existe pas (encore) de table dédiée `SecurityEvent` : on reconstruit le
 * flux à partir des sources réelles du schéma :
 *   - `connexion` ← `HistoriqueConnexion` (connexions tracées) ;
 *   - `compte_verrouille` ← `Utilisateur.dateVerrouillage` (RG-01 : 5 échecs).
 *
 * Les anomalies d'intégrité appareil (root / jailbreak / VPN tiers) ne sont pas
 * encore persistées côté serveur : elles arriveront via l'`IntegrityReport` du
 * heartbeat natif (Lot E) et s'ajouteront ici comme nouveaux `type`.
 */

const TYPES = ['connexion', 'compte_verrouille'] as const;

const querySchema = z.object({
  utilisateurId: z.string().uuid().optional(),
  type: z.enum(TYPES).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

type SecurityEvent = {
  type: (typeof TYPES)[number];
  utilisateurId: string;
  date: Date;
  ip: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
};

const inRange = (date: Date, debut?: Date, fin?: Date): boolean => {
  if (debut && date < debut) return false;
  if (fin && date > fin) return false;
  return true;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  ensureAdminScope(req);
  const { utilisateurId, type, dateDebut, dateFin, page, pageSize } = querySchema.parse(req.query);

  const events: SecurityEvent[] = [];

  if (!type || type === 'connexion') {
    const connexions = await prisma.historiqueConnexion.findMany({
      where: {
        ...(utilisateurId ? { utilisateurId } : {}),
        ...(dateDebut || dateFin
          ? { dateConnexion: { ...(dateDebut ? { gte: dateDebut } : {}), ...(dateFin ? { lte: dateFin } : {}) } }
          : {}),
      },
      orderBy: { dateConnexion: 'desc' },
    });
    for (const c of connexions) {
      events.push({
        type: 'connexion',
        utilisateurId: c.utilisateurId,
        date: c.dateConnexion,
        ip: c.ip,
        userAgent: c.userAgent,
        details: {},
      });
    }
  }

  if (!type || type === 'compte_verrouille') {
    const verrouilles = await prisma.utilisateur.findMany({
      where: {
        dateVerrouillage: { not: null },
        ...(utilisateurId ? { id: utilisateurId } : {}),
      },
      select: { id: true, dateVerrouillage: true, tentativesEchouees: true, email: true },
    });
    for (const u of verrouilles) {
      const date = u.dateVerrouillage as Date;
      if (!inRange(date, dateDebut, dateFin)) continue;
      events.push({
        type: 'compte_verrouille',
        utilisateurId: u.id,
        date,
        ip: null,
        userAgent: null,
        details: { tentativesEchouees: u.tentativesEchouees, email: u.email },
      });
    }
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = events.length;
  const items = events.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
