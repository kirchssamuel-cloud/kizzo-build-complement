import { z } from 'zod';
import { Langue } from '@prisma/client';

export const updateProfileSchema = z
  .object({
    prenom: z.string().trim().min(1).max(60).optional(),
    nom: z.string().trim().min(1).max(60).optional(),
    telephone: z.string().trim().min(6).max(20).optional(),
    avatarUrl: z.string().trim().url().max(500).optional(),
    langue: z.enum([Langue.fr, Langue.en]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Aucune donnée à mettre à jour' });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1).optional(),
  confirmation: z.literal('SUPPRIMER'),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
