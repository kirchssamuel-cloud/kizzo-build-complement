import { z } from 'zod';
import { NiveauFiltre } from '@prisma/client';

const NIVEAUX_VALUES = [
  NiveauFiltre.strict,
  NiveauFiltre.modere,
  NiveauFiltre.personnalise,
] as const;

const urlEntry = z.string().trim().min(1).max(255);

export const updateWebFilterSchema = z.object({
  niveau: z.enum(NIVEAUX_VALUES),
  categoriesBloquees: z.array(z.string().trim().min(1).max(60)).max(100).optional(),
  whitelistUrls: z.array(urlEntry).max(500).optional(),
  blacklistUrls: z.array(urlEntry).max(500).optional(),
  safeSearch: z.boolean().optional(),
});
export type UpdateWebFilterInput = z.infer<typeof updateWebFilterSchema>;

export const childIdParamsSchema = z.object({ childId: z.string().uuid() });
