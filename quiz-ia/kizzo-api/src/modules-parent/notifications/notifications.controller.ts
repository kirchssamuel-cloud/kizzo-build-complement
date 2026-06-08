import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './notifications.service';
import type { UpdatePreferencesInput } from './notifications.schema';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.list(
    req.userId!,
    Number(req.query.page),
    Number(req.query.pageSize),
  );
  return res.json(data);
});

export const markRead = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = await service.markAsRead(req.userId!, req.params.id);
  return res.json({ notification: data });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.markAllAsRead(req.userId!);
  return res.json(data);
});

export const remove = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = await service.remove(req.userId!, req.params.id);
  return res.json(data);
});

/** GET /api/parent/notifications/preferences — préférences par type (P34). */
export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getPreferences(req.userId!);
  return res.json({ preferences: data });
});

/** PUT /api/parent/notifications/preferences — upsert des préférences. */
export const updatePreferences = asyncHandler(
  async (req: Request<unknown, unknown, UpdatePreferencesInput>, res: Response) => {
    const data = await service.updatePreferences(req.userId!, req.body);
    return res.json({ preferences: data });
  },
);
