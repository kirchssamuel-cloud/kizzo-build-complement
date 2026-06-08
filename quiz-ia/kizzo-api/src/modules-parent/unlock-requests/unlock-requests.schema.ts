import { z } from 'zod';
import { StatutDemandeTemps } from '@prisma/client';

const STATUTS = [
  StatutDemandeTemps.en_attente,
  StatutDemandeTemps.acceptee,
  StatutDemandeTemps.refusee,
] as const;

/** Filtres de liste : statut (défaut en_attente) + childId optionnel. */
export const listRequestsQuerySchema = z.object({
  statut: z.enum(STATUTS).optional(),
  childId: z.string().uuid().optional(),
});
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;

export const demandeIdParamsSchema = z.object({ demandeId: z.string().uuid() });

/**
 * Réponse du parent à une demande de temps.
 * `minutes` permet d'accorder un montant différent de celui demandé (sinon
 * on reprend les minutes de la demande). Ignoré si `accepter = false`.
 */
export const respondRequestSchema = z.object({
  accepter: z.boolean(),
  reponse: z.string().trim().max(200).optional(),
  minutes: z
    .number()
    .int()
    .refine((v) => [15, 30, 60].includes(v), { message: 'Minutes doit être 15, 30 ou 60' })
    .optional(),
});
export type RespondRequestInput = z.infer<typeof respondRequestSchema>;
