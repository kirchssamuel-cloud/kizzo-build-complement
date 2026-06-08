import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './web-filter.service';
import type { UpdateWebFilterInput } from './web-filter.schema';

export const get = asyncHandler(async (req: Request<{ childId: string }>, res: Response) => {
  const data = await service.getFilter(req.userId!, req.params.childId);
  return res.json({ filtre: data });
});

export const update = asyncHandler(
  async (req: Request<{ childId: string }, unknown, UpdateWebFilterInput>, res: Response) => {
    const data = await service.updateFilter(req.userId!, req.params.childId, req.body);
    return res.json({ filtre: data });
  },
);
