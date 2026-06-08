import { z } from 'zod';
import { CategorieApp } from '@prisma/client';

const CATEGORIES_VALUES = [
  CategorieApp.jeux,
  CategorieApp.reseaux_sociaux,
  CategorieApp.education,
  CategorieApp.communication,
  CategorieApp.divertissement,
  CategorieApp.productivite,
  CategorieApp.systeme,
  CategorieApp.autres,
] as const;

export const upsertAppRuleSchema = z.object({
  bundleId: z.string().trim().min(1).max(200),
  nomApp: z.string().trim().min(1).max(120),
  categorie: z.enum(CATEGORIES_VALUES).optional(),
  autorisee: z.boolean().optional(),
  limiteQuotidienne: z.number().int().min(0).max(1440).nullable().optional(),
  plagesHoraires: z.unknown().optional(),
});
export type UpsertAppRuleInput = z.infer<typeof upsertAppRuleSchema>;

export const childIdParamsSchema = z.object({ childId: z.string().uuid() });

export const appRuleParamsSchema = z.object({
  childId: z.string().uuid(),
  bundleId: z.string().trim().min(1).max(200),
});
