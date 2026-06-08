import { z } from 'zod';

export const pairSchema = z.object({
  codeAppairage: z
    .string()
    .length(6, 'Code à 6 chiffres')
    .regex(/^\d{6}$/, 'Chiffres uniquement'),
  nomAppareil: z.string().min(1).max(100),
  plateforme: z.enum(['ios', 'android', 'tablette']),
  modele: z.string().max(100).optional(),
  versionOs: z.string().max(20).optional(),
  versionApp: z.string().max(20).optional(),
});
export type PairInput = z.infer<typeof pairSchema>;
