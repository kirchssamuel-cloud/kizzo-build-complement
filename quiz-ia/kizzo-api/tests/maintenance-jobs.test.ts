import { describe, expect, it } from 'vitest';
import prisma from '../src/config/prisma';
import {
  CONNEXION_RETENTION_DAYS,
  LOGIN_LOCK_DURATION_MS,
  NOTIF_LUE_RETENTION_DAYS,
  purgeExpiredVerificationCodes,
  purgeOldConnectionHistory,
  purgeOldReadNotifications,
  reconcileExpiredSubscriptions,
  runAllMaintenanceJobs,
  unlockExpiredAccounts,
} from '../src/lib/jobs/maintenance';

/**
 * Tests des jobs de maintenance (cron interne).
 *
 * Les jobs sont des `updateMany`/`deleteMany` globaux : pour rester robustes
 * malgré la base partagée et sérialisée, on n'asserte pas sur les compteurs
 * absolus mais sur l'**état des enregistrements précis** qu'on a semés
 * (vérifiés par id), plus `count >= 1` quand on veut prouver qu'au moins notre
 * ligne a été traitée.
 */

const uniqueEmail = (tag: string) =>
  `maint-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/** Crée un utilisateur minimal (email unique) avec overrides arbitraires. */
async function createUser(data: Record<string, unknown> = {}) {
  return prisma.utilisateur.create({
    data: { email: uniqueEmail('user'), ...data },
  });
}

describe('Jobs de maintenance', () => {
  describe('unlockExpiredAccounts', () => {
    it('déverrouille un compte dont la fenêtre de 15 min est écoulée', async () => {
      const now = new Date();
      const vieux = new Date(now.getTime() - LOGIN_LOCK_DURATION_MS - 60_000);
      const locked = await createUser({ tentativesEchouees: 5, dateVerrouillage: vieux });

      const count = await unlockExpiredAccounts(now);
      expect(count).toBeGreaterThanOrEqual(1);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: locked.id } });
      expect(after.tentativesEchouees).toBe(0);
      expect(after.dateVerrouillage).toBeNull();
    });

    it('ne touche pas un compte verrouillé récemment (dans la fenêtre)', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 60_000); // 1 min → encore verrouillé
      const locked = await createUser({ tentativesEchouees: 5, dateVerrouillage: recent });

      await unlockExpiredAccounts(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: locked.id } });
      expect(after.tentativesEchouees).toBe(5);
      expect(after.dateVerrouillage).not.toBeNull();
    });

    it('ne touche pas un compte non verrouillé (dateVerrouillage null)', async () => {
      const now = new Date();
      // tentativesEchouees > 0 mais jamais verrouillé : ne doit PAS être remis à 0
      // par ce job (seul le déverrouillage réinitialise le compteur).
      const u = await createUser({ tentativesEchouees: 3, dateVerrouillage: null });

      await unlockExpiredAccounts(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.tentativesEchouees).toBe(3);
      expect(after.dateVerrouillage).toBeNull();
    });
  });

  describe('purgeExpiredVerificationCodes', () => {
    it('efface les codes (email + reset) plus vieux que le TTL', async () => {
      const now = new Date();
      const vieux = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 h
      const u = await createUser({
        codeVerificationEmail: '123456',
        dateCreationCodeVerif: vieux,
        codeReinitialisationMdp: '654321',
        dateCreationCodeReinit: vieux,
      });

      const count = await purgeExpiredVerificationCodes(now);
      expect(count).toBeGreaterThanOrEqual(1);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.codeVerificationEmail).toBeNull();
      expect(after.dateCreationCodeVerif).toBeNull();
      expect(after.codeReinitialisationMdp).toBeNull();
      expect(after.dateCreationCodeReinit).toBeNull();
    });

    it('conserve un code récent (dans le TTL)', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 5 * 60 * 1000); // 5 min
      const u = await createUser({
        codeVerificationEmail: '999999',
        dateCreationCodeVerif: recent,
      });

      await purgeExpiredVerificationCodes(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.codeVerificationEmail).toBe('999999');
    });

    it('purge indépendamment chaque branche (email vieux, reset récent)', async () => {
      const now = new Date();
      const vieux = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 h
      const recent = new Date(now.getTime() - 5 * 60 * 1000); // 5 min
      const u = await createUser({
        codeVerificationEmail: 'EMAILX',
        dateCreationCodeVerif: vieux, // expiré → effacé
        codeReinitialisationMdp: 'RESETX',
        dateCreationCodeReinit: recent, // récent → conservé
      });

      await purgeExpiredVerificationCodes(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.codeVerificationEmail).toBeNull();
      expect(after.dateCreationCodeVerif).toBeNull();
      expect(after.codeReinitialisationMdp).toBe('RESETX');
      expect(after.dateCreationCodeReinit).not.toBeNull();
    });
  });

  describe('purgeOldConnectionHistory', () => {
    it('supprime les connexions au-delà de la rétention', async () => {
      const now = new Date();
      const u = await createUser();
      const vieux = new Date(
        now.getTime() - (CONNEXION_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000,
      );
      const ancienne = await prisma.historiqueConnexion.create({
        data: { utilisateurId: u.id, dateConnexion: vieux },
      });
      const recente = await prisma.historiqueConnexion.create({
        data: { utilisateurId: u.id, dateConnexion: now },
      });

      const count = await purgeOldConnectionHistory(now);
      expect(count).toBeGreaterThanOrEqual(1);

      const ancienneAfter = await prisma.historiqueConnexion.findUnique({
        where: { id: ancienne.id },
      });
      const recenteAfter = await prisma.historiqueConnexion.findUnique({
        where: { id: recente.id },
      });
      expect(ancienneAfter).toBeNull();
      expect(recenteAfter).not.toBeNull();
    });
  });

  describe('purgeOldReadNotifications', () => {
    it('supprime uniquement les notifications lues anciennes', async () => {
      const now = new Date();
      const u = await createUser();
      const vieux = new Date(
        now.getTime() - (NOTIF_LUE_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000,
      );
      const base = { utilisateurId: u.id, type: 'systeme' as const, titre: 't', corps: 'c' };

      const lueVieille = await prisma.notification.create({
        data: { ...base, lue: true, dateCreation: vieux },
      });
      const nonLueVieille = await prisma.notification.create({
        data: { ...base, lue: false, dateCreation: vieux },
      });
      const lueRecente = await prisma.notification.create({
        data: { ...base, lue: true, dateCreation: now },
      });

      const count = await purgeOldReadNotifications(now);
      expect(count).toBeGreaterThanOrEqual(1);

      expect(
        await prisma.notification.findUnique({ where: { id: lueVieille.id } }),
      ).toBeNull();
      expect(
        await prisma.notification.findUnique({ where: { id: nonLueVieille.id } }),
      ).not.toBeNull();
      expect(
        await prisma.notification.findUnique({ where: { id: lueRecente.id } }),
      ).not.toBeNull();
    });
  });

  describe('reconcileExpiredSubscriptions', () => {
    it('repasse en gratuit un abonnement payant échu', async () => {
      const now = new Date();
      const passe = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const u = await createUser({
        plan: 'famille',
        statutAbonnement: 'active',
        abonnementFinPeriode: passe,
        stripeCustomerId: `cus_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      });

      const count = await reconcileExpiredSubscriptions(now);
      expect(count).toBeGreaterThanOrEqual(1);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.plan).toBe('gratuit');
      expect(after.statutAbonnement).toBe('canceled');
      // Le customerId reste pour permettre un réabonnement.
      expect(after.stripeCustomerId).not.toBeNull();
    });

    it('ne touche pas un abonnement payant encore valide', async () => {
      const now = new Date();
      const futur = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const u = await createUser({
        plan: 'famille_plus',
        statutAbonnement: 'active',
        abonnementFinPeriode: futur,
      });

      await reconcileExpiredSubscriptions(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.plan).toBe('famille_plus');
      expect(after.statutAbonnement).toBe('active');
    });

    it('ne touche pas un compte déjà gratuit', async () => {
      const now = new Date();
      const u = await createUser({ plan: 'gratuit' });

      await reconcileExpiredSubscriptions(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.plan).toBe('gratuit');
    });

    it('ne touche pas un payant sans date de fin de période (null)', async () => {
      const now = new Date();
      // Cas limite : plan payant mais abonnementFinPeriode null (ex. abonnement
      // tout juste créé, webhook pas encore passé) → le `not: null` doit l'exclure.
      const u = await createUser({
        plan: 'famille',
        statutAbonnement: 'active',
        abonnementFinPeriode: null,
      });

      await reconcileExpiredSubscriptions(now);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: u.id } });
      expect(after.plan).toBe('famille');
      expect(after.statutAbonnement).toBe('active');
    });
  });

  describe('runAllMaintenanceJobs', () => {
    it('orchestre les 5 jobs et reflète un effet réel dans le récapitulatif', async () => {
      const now = new Date();
      // On sème un compte verrouillé expiré : runAll doit le déverrouiller et
      // le compter, prouvant que l'orchestration appelle bien chaque job.
      const vieux = new Date(now.getTime() - LOGIN_LOCK_DURATION_MS - 60_000);
      const locked = await createUser({ tentativesEchouees: 5, dateVerrouillage: vieux });

      const summary = await runAllMaintenanceJobs(now);

      expect(summary).toEqual(
        expect.objectContaining({
          comptesDeverrouilles: expect.any(Number),
          codesPurges: expect.any(Number),
          historiquePurge: expect.any(Number),
          notificationsPurgees: expect.any(Number),
          abonnementsReconcilies: expect.any(Number),
        }),
      );
      expect(summary.comptesDeverrouilles).toBeGreaterThanOrEqual(1);

      const after = await prisma.utilisateur.findUniqueOrThrow({ where: { id: locked.id } });
      expect(after.dateVerrouillage).toBeNull();
    });
  });
});
