import { z } from 'zod';

export const childIdParamsSchema = z.object({ childId: z.string().uuid() });

export const reportQuerySchema = z.object({
  jours: z.coerce.number().int().min(1).max(90).default(7),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;
