import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './screen-time.service';
import type { AddTimeInput, UpsertRuleInput } from './screen-time.schema';

export const list = asyncHandler(async (req: Request<{ childId: string }>, res: Response) => {
  const data = await service.listRules(req.userId!, req.params.childId);
  return res.json({ regles: data });
});

export const upsert = asyncHandler(
  async (req: Request<{ childId: string }, unknown, UpsertRuleInput>, res: Response) => {
    const data = await service.upsertRule(req.userId!, req.params.childId, req.body);
    return res.json({ regle: data });
  },
);

export const addTime = asyncHandler(
  async (req: Request<{ childId: string }, unknown, AddTimeInput>, res: Response) => {
    const data = await service.addTime(req.userId!, req.params.childId, req.body);
    return res.json({ ajout: data });
  },
);

export const usage = asyncHandler(async (req: Request<{ childId: string }>, res: Response) => {
  const data = await service.getUsageToday(req.userId!, req.params.childId);
  return res.json(data);
});
