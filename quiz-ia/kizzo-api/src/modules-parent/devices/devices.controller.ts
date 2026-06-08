import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as devicesService from './devices.service';
import type { GeneratePairingCodeInput, LockDeviceInput } from './devices.schema';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await devicesService.listDevices(req.userId!);
  return res.json({ appareils: data });
});

export const generatePairing = asyncHandler(
  async (req: Request<unknown, unknown, GeneratePairingCodeInput>, res: Response) => {
    const data = await devicesService.generatePairingCode(req.userId!, req.body.profilEnfantId);
    return res.status(201).json(data);
  },
);

export const lock = asyncHandler(
  async (req: Request<unknown, unknown, LockDeviceInput>, res: Response) => {
    const data = await devicesService.lockDevice(
      req.userId!,
      req.body.deviceId,
      req.body.message,
    );
    return res.json(data);
  },
);

export const remove = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = await devicesService.unpairDevice(req.userId!, req.params.id);
  return res.json(data);
});
