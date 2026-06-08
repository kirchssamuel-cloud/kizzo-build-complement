import { z } from 'zod';

/**
 * Corps du heartbeat envoyé par l'appareil enfant.
 * Tous les champs sont optionnels : un heartbeat « vide » met simplement à jour
 * `derniereSync`. L'identité de l'appareil passe par le header X-Kizzo-Appareil-Id.
 */
export const heartbeatSchema = z.object({
  versionApp: z.string().trim().min(1).max(40).optional(),
  versionOs: z.string().trim().min(1).max(40).optional(),
  modele: z.string().trim().min(1).max(80).optional(),
  tokenPush: z.string().trim().min(1).max(512).optional(),
  vpnActif: z.boolean().optional(),
  modeSupervise: z.boolean().optional(),
  permissionStore: z.boolean().optional(),
});
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

export const childIdParamsSchema = z.object({ childId: z.string().uuid() });
