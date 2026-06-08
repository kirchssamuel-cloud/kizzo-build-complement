import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import { HttpError } from '../../middleware/error.middleware';
import * as service from './device-state.service';
import type { HeartbeatInput } from './device-state.schema';

/** PUT /api/device-state — heartbeat envoyé par l'appareil enfant. */
export const heartbeat = asyncHandler(
  async (req: Request<unknown, unknown, HeartbeatInput>, res: Response) => {
    const appareilId = req.headers['x-kizzo-appareil-id'];
    if (!appareilId || typeof appareilId !== 'string') {
      throw new HttpError(400, 'Header X-Kizzo-Appareil-Id manquant');
    }
    const data = await service.heartbeat(req.userId!, appareilId, req.body);
    return res.json({ appareil: data });
  },
);

/** GET /api/parent/device-state/:childId — état des appareils vu par le parent. */
export const getStates = asyncHandler(
  async (req: Request<{ childId: string }>, res: Response) => {
    const data = await service.getDeviceStates(req.userId!, req.params.childId);
    return res.json({ appareils: data });
  },
);
