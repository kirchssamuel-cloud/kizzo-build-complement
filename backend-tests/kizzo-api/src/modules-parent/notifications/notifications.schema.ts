import { z } from 'zod';

export const listNotifsQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
});
export type ListNotifsQuery = z.infer<typeof listNotifsQuerySchema>;

export const notifIdParamsSchema = z.object({ id: z.string().uuid() });
