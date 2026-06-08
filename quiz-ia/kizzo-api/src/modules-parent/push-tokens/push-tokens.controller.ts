import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './push-tokens.service';
import type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
} from './push-tokens.schema';

/** POST /api/parent/push-tokens — enregistre/rafraîchit un token push. */
export const register = asyncHandler(
  async (req: Request<unknown, unknown, RegisterPushTokenInput>, res: Response) => {
    const appareilPush = await service.registerToken(req.userId!, req.body);
    return res.status(201).json({ appareilPush });
  },
);

/** GET /api/parent/push-tokens — liste les tokens du parent. */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await service.listTokens(req.userId!);
  return res.json({ tokens });
});

/** POST /api/parent/push-tokens/unregister — désenregistre (idempotent). */
export const unregister = asyncHandler(
  async (req: Request<unknown, unknown, UnregisterPushTokenInput>, res: Response) => {
    const result = await service.unregisterToken(req.userId!, req.body.token);
    return res.json(result);
  },
);
