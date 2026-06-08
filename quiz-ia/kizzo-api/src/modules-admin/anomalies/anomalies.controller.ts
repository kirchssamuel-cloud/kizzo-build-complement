import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { ensureAdminScope } from '../admin-scope';

/**
 * Anomalies — **vue d'agrégation en lecture seule** sur les sources réelles.
 *
 * Faute de table `IntegrityReport` (root / jailbreak / VPN tiers ne sont pas
 * encore remontés par le heartbeat natif — Lot E), on reconstruit les anomalies
 * détectables aujourd'hui :
 *   - `heartbeat_absent`  ← `Appareil.actif` + `derniereSync` (silence > 24h) ;
 *   - `compte_verrouille` ← `Utilisateur.dateVerrouillage` (RG-01) ;
 *   - `echec_paiement`    ← `Utilisateur.statutAbonnement` (statuts Stripe KO) ;
 *   - `integrite_vpn`     ← `Appareil.vpnActif` (filtrage DNS coupé).
 *
 * Les types `root` / `jailbreak` s'ajouteront ici quand l'`IntegrityReport`
 * existera.
 */

const TYPES = ['heartbeat_absent', 'compte_verrouille', 'echec_paiement', 'integrite_vpn'] as const;
const NIVEAUX = ['info', 'avertissement', 'critique'] as const;

const STRIPE_STATUTS_KO = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'];

const HEURE = 60 * 60 * 1000;

const querySchema = z.object({
  type: z.enum(TYPES).optional(),
  niveau: z.enum(NIVEAUX).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

type Anomaly = {
  type: (typeof TYPES)[number];
  niveau: (typeof NIVEAUX)[number];
  utilisateurId: string | null;
  appareilId: string | null;
  date: Date;
  details: Record<string, unknown>;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  ensureAdminScope(req);
  const { type, niveau, page, pageSize } = querySchema.parse(req.query);

  const now = Date.now();
  const anomalies: Anomaly[] = [];

  if (!type || type === 'heartbeat_absent' || type === 'integrite_vpn') {
    const appareils = await prisma.appareil.findMany({
      where: { actif: true },
      select: {
        id: true,
        nomAffichage: true,
        derniereSync: true,
        dateAppairage: true,
        vpnActif: true,
        profilEnfant: { select: { parentId: true, prenom: true } },
      },
    });

    for (const a of appareils) {
      if (!type || type === 'heartbeat_absent') {
        const ref = a.derniereSync ?? a.dateAppairage;
        const silence = now - ref.getTime();
        if (silence > 24 * HEURE) {
          anomalies.push({
            type: 'heartbeat_absent',
            niveau: silence > 72 * HEURE ? 'critique' : 'avertissement',
            utilisateurId: a.profilEnfant.parentId,
            appareilId: a.id,
            date: ref,
            details: {
              nomAffichage: a.nomAffichage,
              enfant: a.profilEnfant.prenom,
              heuresSilence: Math.floor(silence / HEURE),
            },
          });
        }
      }
      if ((!type || type === 'integrite_vpn') && !a.vpnActif) {
        anomalies.push({
          type: 'integrite_vpn',
          niveau: 'info',
          utilisateurId: a.profilEnfant.parentId,
          appareilId: a.id,
          date: a.derniereSync ?? a.dateAppairage,
          details: { nomAffichage: a.nomAffichage, enfant: a.profilEnfant.prenom },
        });
      }
    }
  }

  if (!type || type === 'compte_verrouille') {
    const verrouilles = await prisma.utilisateur.findMany({
      where: { dateVerrouillage: { not: null } },
      select: { id: true, email: true, dateVerrouillage: true, tentativesEchouees: true },
    });
    for (const u of verrouilles) {
      anomalies.push({
        type: 'compte_verrouille',
        niveau: 'critique',
        utilisateurId: u.id,
        appareilId: null,
        date: u.dateVerrouillage as Date,
        details: { email: u.email, tentativesEchouees: u.tentativesEchouees },
      });
    }
  }

  if (!type || type === 'echec_paiement') {
    const impayes = await prisma.utilisateur.findMany({
      where: { statutAbonnement: { in: STRIPE_STATUTS_KO } },
      select: {
        id: true,
        email: true,
        statutAbonnement: true,
        abonnementFinPeriode: true,
        dateMiseAJour: true,
      },
    });
    for (const u of impayes) {
      anomalies.push({
        type: 'echec_paiement',
        niveau: u.statutAbonnement === 'past_due' ? 'avertissement' : 'critique',
        utilisateurId: u.id,
        appareilId: null,
        date: u.abonnementFinPeriode ?? u.dateMiseAJour,
        details: { email: u.email, statutAbonnement: u.statutAbonnement },
      });
    }
  }

  const filtered = niveau ? anomalies.filter((a) => a.niveau === niveau) : anomalies;
  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
