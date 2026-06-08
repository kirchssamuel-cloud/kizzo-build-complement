import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './notifications.service';
import type { ListNotifsQuery } from './notifications.schema';

export const list = asyncHandler(
  async (req: Request<unknown, unknown, unknown, ListNotifsQuery>, res: Response) => {
    const data = await service.list(req.userId!, req.query.page, req.query.pageSize);
    return res.json(data);
  },
);

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
