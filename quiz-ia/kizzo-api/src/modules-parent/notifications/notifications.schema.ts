import { z } from 'zod';
import { TypeNotification } from '@prisma/client';

export const listNotifsQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
});
export type ListNotifsQuery = z.infer<typeof listNotifsQuerySchema>;

export const notifIdParamsSchema = z.object({ id: z.string().uuid() });

/** Préférences de notification (P34) : un canal push/email par type. */
const TYPES = Object.values(TypeNotification) as [TypeNotification, ...TypeNotification[]];

export const updatePreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        type: z.enum(TYPES),
        canalPush: z.boolean(),
        canalEmail: z.boolean(),
      }),
    )
    .min(1)
    .max(TYPES.length),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
