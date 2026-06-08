import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as service from './profile.service';
import type { DeleteAccountInput, UpdateProfileInput } from './profile.schema';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getProfile(req.userId!);
  return res.json({ profil: data });
});

export const update = asyncHandler(
  async (req: Request<unknown, unknown, UpdateProfileInput>, res: Response) => {
    const data = await service.updateProfile(req.userId!, req.body);
    return res.json({ profil: data });
  },
);

export const remove = asyncHandler(
  async (req: Request<unknown, unknown, DeleteAccountInput>, res: Response) => {
    await service.deleteAccount(req.userId!, req.body);
    return res.json({ ok: true });
  },
);

/** GET /api/parent/account/export — export RGPD (portabilité, art. 20). */
export const exportData = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.exportData(req.userId!);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="kizzo-export-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  return res.json(data);
});
