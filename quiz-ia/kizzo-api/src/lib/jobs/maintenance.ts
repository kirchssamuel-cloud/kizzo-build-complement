import { PlanAbonnement } from '@prisma/client';
import prisma from '../../config/prisma';
import { logger } from '../../config/logger';

/**
 * Jobs de maintenance serveur (« cron »).
 *
 * Chaque job est une **fonction pure et idempotente** qui prend `now` en
 * paramètre (injectable pour les tests) et renvoie le nombre de lignes traitées.
 * Aucune dépendance externe : ce sont des opérations Prisma `updateMany` /
 * `deleteMany`, sûres à rejouer. Le planificateur (`scheduler.ts`) se contente
 * de les appeler périodiquement ; toute la logique testable vit ici.
 */

/** Fenêtre de verrouillage de compte après échecs de login (RG-01, cf. auth). */
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
/** Durée de validité d'un code (vérif email / reset mdp) — cf. email 1 h. */
export const CODE_TTL_MS = 60 * 60 * 1000; // 1 h
/** Rétention de l'historique de connexion (RGPD — minimisation). */
export const CONNEXION_RETENTION_DAYS = 365;
/** Rétention des notifications déjà lues. */
export const NOTIF_LUE_RETENTION_DAYS = 90;

/**
 * Réinitialise le compteur de tentatives et lève le verrou des comptes dont la
 * fenêtre de 15 min est écoulée. Le login tolère déjà l'accès après expiration,
 * mais ne remet jamais `tentativesEchouees` à 0 — ce job nettoie cet état pour
 * éviter qu'un compte reverrouille au premier échec suivant.
 */
export const unlockExpiredAccounts = async (now: Date = new Date()): Promise<number> => {
  const seuil = new Date(now.getTime() - LOGIN_LOCK_DURATION_MS);
  const res = await prisma.utilisateur.updateMany({
    where: { dateVerrouillage: { not: null, lt: seuil } },
    data: { tentativesEchouees: 0, dateVerrouillage: null },
  });
  return res.count;
};

/**
 * Efface les codes de vérification email / réinitialisation mot de passe expirés
 * (plus vieux que `CODE_TTL_MS`). Housekeeping : la validité est déjà contrôlée
 * à l'usage, mais on évite de garder des codes morts en base.
 */
export const purgeExpiredVerificationCodes = async (
  now: Date = new Date(),
): Promise<number> => {
  const seuil = new Date(now.getTime() - CODE_TTL_MS);
  const [emailCodes, resetCodes] = await Promise.all([
    prisma.utilisateur.updateMany({
      where: { codeVerificationEmail: { not: null }, dateCreationCodeVerif: { lt: seuil } },
      data: { codeVerificationEmail: null, dateCreationCodeVerif: null },
    }),
    prisma.utilisateur.updateMany({
      where: { codeReinitialisationMdp: { not: null }, dateCreationCodeReinit: { lt: seuil } },
      data: { codeReinitialisationMdp: null, dateCreationCodeReinit: null },
    }),
  ]);
  return emailCodes.count + resetCodes.count;
};

/** Supprime l'historique de connexion au-delà de la rétention RGPD. */
export const purgeOldConnectionHistory = async (
  now: Date = new Date(),
  retentionDays: number = CONNEXION_RETENTION_DAYS,
): Promise<number> => {
  const seuil = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const res = await prisma.historiqueConnexion.deleteMany({
    where: { dateConnexion: { lt: seuil } },
  });
  return res.count;
};

/** Supprime les notifications déjà lues au-delà de la rétention. */
export const purgeOldReadNotifications = async (
  now: Date = new Date(),
  retentionDays: number = NOTIF_LUE_RETENTION_DAYS,
): Promise<number> => {
  const seuil = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const res = await prisma.notification.deleteMany({
    where: { lue: true, dateCreation: { lt: seuil } },
  });
  return res.count;
};

/**
 * Filet de sécurité Stripe : repasse en plan gratuit les comptes payants dont la
 * période payée est échue (`abonnementFinPeriode < now`). En fonctionnement
 * normal le webhook s'en charge ; ce job rattrape un webhook manqué/perdu.
 * On ne touche jamais `stripeCustomerId` (réabonnement possible).
 */
export const reconcileExpiredSubscriptions = async (
  now: Date = new Date(),
): Promise<number> => {
  const res = await prisma.utilisateur.updateMany({
    where: {
      plan: { not: PlanAbonnement.gratuit },
      abonnementFinPeriode: { not: null, lt: now },
    },
    data: { plan: PlanAbonnement.gratuit, statutAbonnement: 'canceled' },
  });
  return res.count;
};

export type MaintenanceSummary = {
  comptesDeverrouilles: number;
  codesPurges: number;
  historiquePurge: number;
  notificationsPurgees: number;
  abonnementsReconcilies: number;
};

/** Exécute tous les jobs en séquence et renvoie un récapitulatif chiffré. */
export const runAllMaintenanceJobs = async (
  now: Date = new Date(),
): Promise<MaintenanceSummary> => {
  const summary: MaintenanceSummary = {
    comptesDeverrouilles: await unlockExpiredAccounts(now),
    codesPurges: await purgeExpiredVerificationCodes(now),
    historiquePurge: await purgeOldConnectionHistory(now),
    notificationsPurgees: await purgeOldReadNotifications(now),
    abonnementsReconcilies: await reconcileExpiredSubscriptions(now),
  };
  logger.info({ maintenance: summary }, 'Jobs de maintenance exécutés');
  return summary;
};
