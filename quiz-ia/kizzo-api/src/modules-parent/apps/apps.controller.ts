import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './apps.service';
import type { UpsertAppRuleInput } from './apps.schema';

export const list = asyncHandler(async (req: Request<{ childId: string }>, res: Response) => {
  const data = await service.listApps(req.userId!, req.params.childId);
  return res.json({ apps: data });
});

export const upsert = asyncHandler(
  async (req: Request<{ childId: string }, unknown, UpsertAppRuleInput>, res: Response) => {
    const data = await service.upsertApp(req.userId!, req.params.childId, req.body);
    return res.json({ app: data });
  },
);

export const remove = asyncHandler(
  async (req: Request<{ childId: string; bundleId: string }>, res: Response) => {
    await service.deleteApp(req.userId!, req.params.childId, req.params.bundleId);
    return res.json({ ok: true });
  },
);
