import { z } from 'zod';
import { Langue, Plateforme } from '@prisma/client';

/**
 * Enregistrement d'un token push (FCM Android / APNs iOS / Expo).
 * Le token identifie un appareil parent ; il est stocké dans `AppareilPush`
 * (token unique) et sert de destinataire aux notifications push.
 */
export const registerPushTokenSchema = z.object({
  token: z.string().trim().min(1).max(512),
  plateforme: z.nativeEnum(Plateforme),
  langue: z.nativeEnum(Langue).optional(),
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

/**
 * Désenregistrement par body (et non par param d'URL) : les tokens FCM/Expo
 * contiennent des caractères non URL-safe (`:`, `[`, `]`).
 */
export const unregisterPushTokenSchema = z.object({
  token: z.string().trim().min(1).max(512),
});
export type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenSchema>;
