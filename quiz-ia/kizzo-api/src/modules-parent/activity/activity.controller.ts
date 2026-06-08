import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './activity.service';

export const report = asyncHandler(
  async (req: Request<{ childId: string }>, res: Response) => {
    const jours = Number(req.query.jours ?? 7);
    const data = await service.getReport(req.userId!, req.params.childId, jours);
    return res.json(data);
  },
);
