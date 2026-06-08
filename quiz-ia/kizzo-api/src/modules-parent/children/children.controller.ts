import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as childrenService from './children.service';
import type { CreateChildInput, UpdateChildInput } from './children.schema';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await childrenService.listChildren(req.userId!);
  return res.json({ enfants: data });
});

export const create = asyncHandler(
  async (req: Request<unknown, unknown, CreateChildInput>, res: Response) => {
    const data = await childrenService.createChild(req.userId!, req.body);
    return res.status(201).json({ enfant: data });
  },
);

export const get = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = await childrenService.getChild(req.userId!, req.params.id);
  return res.json({ enfant: data });
});

export const update = asyncHandler(
  async (req: Request<{ id: string }, unknown, UpdateChildInput>, res: Response) => {
    const data = await childrenService.updateChild(req.userId!, req.params.id, req.body);
    return res.json({ enfant: data });
  },
);

export const remove = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await childrenService.deleteChild(req.userId!, req.params.id);
  return res.json(result);
});

export const stats = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = await childrenService.getChildStats(req.userId!, req.params.id);
  return res.json({ stats: data });
});
