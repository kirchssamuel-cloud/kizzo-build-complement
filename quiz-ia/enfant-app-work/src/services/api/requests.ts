import { api } from './client';

/**
 * Client de demande de temps supplémentaire côté enfant (CDC E20-E23).
 * Le backend (`POST /enfant/requests`) crée la `DemandeTemps` et notifie le
 * parent (notification `demande_temps`). Le parent accepte/refuse depuis son
 * écran « Demandes de temps » (P13), ce qui crédite le quota le cas échéant.
 */

/** Paliers de minutes acceptés par le backend (validation Zod serveur). */
export type DemandeMinutes = 15 | 30 | 60;

export type DemandeTemps = {
  id: string;
  profilEnfantId: string;
  minutes: number;
  message?: string | null;
  statut?: string;
};

export const requestsApi = {
  /** Crée une demande de temps ; le parent recevra une notification. */
  create: (
    profilEnfantId: string,
    minutes: DemandeMinutes,
    message?: string,
  ) =>
    api
      .post<{ demande: DemandeTemps }>('/enfant/requests', {
        profilEnfantId,
        minutes,
        message,
      })
      .then((r) => r.data.demande),
};
