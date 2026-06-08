import { z } from 'zod';
import { NiveauScolaire } from '@prisma/client';

const NIVEAUX_VALUES = [
  NiveauScolaire.maternelle,
  NiveauScolaire.cp,
  NiveauScolaire.ce1,
  NiveauScolaire.ce2,
  NiveauScolaire.cm1,
  NiveauScolaire.cm2,
  NiveauScolaire.sixieme,
  NiveauScolaire.cinquieme,
  NiveauScolaire.quatrieme,
  NiveauScolaire.troisieme,
  NiveauScolaire.seconde,
  NiveauScolaire.premiere,
  NiveauScolaire.terminale,
] as const;

export const createChildSchema = z.object({
  prenom: z.string().min(1).max(30),
  dateNaissance: z.coerce.date(),
  niveauScolaire: z.enum(NIVEAUX_VALUES),
  avatarId: z.number().int().min(0).max(19),
  couleurTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur HEX requise (#RRGGBB)'),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.partial();
export type UpdateChildInput = z.infer<typeof updateChildSchema>;

export const childIdParamsSchema = z.object({
  id: z.string().uuid(),
});
