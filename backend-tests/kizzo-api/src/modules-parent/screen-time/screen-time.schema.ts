import { z } from 'zod';
import { JourSemaine } from '@prisma/client';

const JOURS_VALUES = [
  JourSemaine.lundi,
  JourSemaine.mardi,
  JourSemaine.mercredi,
  JourSemaine.jeudi,
  JourSemaine.vendredi,
  JourSemaine.samedi,
  JourSemaine.dimanche,
] as const;

const HEURE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const upsertRuleSchema = z.object({
  jourSemaine: z.enum(JOURS_VALUES),
  minutesMatin: z.number().int().min(0).max(360),
  minutesApresMidi: z.number().int().min(0).max(360),
  minutesSoir: z.number().int().min(0).max(240),
  modeNuitActif: z.boolean(),
  modeNuitDebut: z.string().regex(HEURE_REGEX, 'Format HH:mm'),
  modeNuitFin: z.string().regex(HEURE_REGEX, 'Format HH:mm'),
});
export type UpsertRuleInput = z.infer<typeof upsertRuleSchema>;

export const addTimeSchema = z.object({
  minutes: z.number().int().min(1).max(360),
  raison: z.string().max(200).optional(),
});
export type AddTimeInput = z.infer<typeof addTimeSchema>;

export const childIdParamsSchema = z.object({ childId: z.string().uuid() });
