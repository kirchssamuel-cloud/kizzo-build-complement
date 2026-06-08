import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './unlock-requests.service';
import type { ListRequestsQuery, RespondRequestInput } from './unlock-requests.schema';

/** GET /api/parent/unlock-requests?statut=&childId= (query validée par le middleware). */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const demandes = await service.listRequests(req.userId!, req.query as ListRequestsQuery);
  return res.json({ demandes });
});

/** POST /api/parent/unlock-requests/:demandeId/respond */
export const respond = asyncHandler(
  async (req: Request<{ demandeId: string }, unknown, RespondRequestInput>, res: Response) => {
    const demande = await service.respondRequest(req.userId!, req.params.demandeId, req.body);
    return res.json({ demande });
  },
);
