import { StatutDemandeTemps } from '@prisma/client';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { sendPushToChild } from '../../lib/push';
import type { ListRequestsQuery, RespondRequestInput } from './unlock-requests.schema';

/** Liste les demandes de temps des enfants du parent (défaut : en attente). */
export const listRequests = async (parentId: string, query: ListRequestsQuery) => {
  const statut = query.statut ?? StatutDemandeTemps.en_attente;
  return prisma.demandeTemps.findMany({
    where: {
      statut,
      profilEnfant: { parentId },
      ...(query.childId ? { profilEnfantId: query.childId } : {}),
    },
    include: {
      profilEnfant: { select: { id: true, prenom: true, avatarId: true } },
    },
    orderBy: { dateCreation: 'desc' },
  });
};

/**
 * Réponse du parent à une demande de temps.
 * - Vérifie que la demande appartient bien à un enfant du parent.
 * - Refuse de re-traiter une demande déjà répondue.
 * - Si acceptée : crédite le temps (AjoutTempsEcran) et notifie l'enfant.
 */
export const respondRequest = async (
  parentId: string,
  demandeId: string,
  input: RespondRequestInput,
) => {
  const demande = await prisma.demandeTemps.findUnique({
    where: { id: demandeId },
    include: { profilEnfant: true },
  });
  if (!demande) throw new HttpError(404, 'Demande introuvable');
  if (demande.profilEnfant.parentId !== parentId) throw new HttpError(403, 'Accès refusé');
  if (demande.statut !== StatutDemandeTemps.en_attente) {
    throw new HttpError(409, 'Demande déjà traitée');
  }

  const profil = demande.profilEnfant;
  const minutes = input.minutes ?? demande.minutes;
  const nouveauStatut = input.accepter
    ? StatutDemandeTemps.acceptee
    : StatutDemandeTemps.refusee;

  const demandeMaj = await prisma.$transaction(async (tx) => {
    const maj = await tx.demandeTemps.update({
      where: { id: demandeId },
      data: {
        statut: nouveauStatut,
        reponseParent: input.reponse ?? null,
        dateReponse: new Date(),
      },
    });

    if (input.accepter) {
      await tx.ajoutTempsEcran.create({
        data: {
          profilEnfantId: profil.id,
          parentId,
          minutes,
          raison: input.reponse ?? 'Demande de temps acceptée',
        },
      });
    }

    // La table Notification est une FILE D'ENVOI push (statut/datePlanifiee/dateEnvoi) :
    // `profilEnfantId` cible l'enfant destinataire (le job FCM — Lot E — poussera vers
    // l'Appareil.tokenPush de cet enfant). `utilisateurId` n'est que la FK propriétaire
    // (le schéma n'a pas de Utilisateur enfant distinct ; le parent porte le compte).
    await tx.notification.create({
      data: {
        utilisateurId: parentId,
        profilEnfantId: profil.id,
        type: 'reponse_demande',
        niveau: 'info',
        titre: input.accepter
          ? `Demande acceptée — +${minutes} min`
          : 'Demande refusée',
        corps:
          input.reponse ??
          (input.accepter
            ? `${minutes} minutes accordées à ${profil.prenom}.`
            : `La demande de ${profil.prenom} a été refusée.`),
        donnees: { demandeId, accepter: input.accepter, minutes },
      },
    });

    return maj;
  });

  // Sur acceptation : push temps réel vers l'enfant (non bloquant). Effectué
  // après le commit de la transaction pour ne notifier qu'en cas de succès.
  if (input.accepter) {
    try {
      await sendPushToChild(profil.id, {
        titre: 'Temps accordé !',
        corps: `Tes parents t'ont accordé ${minutes} minutes.`,
        donnees: { action: 'tempsAccorde', minutes: String(minutes) },
      });
    } catch (err) {
      logger.error({ err, demandeId }, 'Échec envoi push temps accordé');
    }
  }

  return demandeMaj;
};
