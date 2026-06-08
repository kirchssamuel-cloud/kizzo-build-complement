import { z } from 'zod';

export const generatePairingCodeSchema = z.object({
  profilEnfantId: z.string().uuid(),
});
export type GeneratePairingCodeInput = z.infer<typeof generatePairingCodeSchema>;

export const lockDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  message: z.string().max(200).optional(),
});
export type LockDeviceInput = z.infer<typeof lockDeviceSchema>;

export const deviceIdParamsSchema = z.object({ id: z.string().uuid() });
