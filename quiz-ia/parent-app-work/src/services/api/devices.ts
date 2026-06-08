import { api } from './client';
import type { Appareil, PairingCode } from '~/types/api';

export const devicesApi = {
  list: () =>
    api.get<{ appareils: Appareil[] }>('/parent/devices').then((r) => r.data.appareils),

  generatePairingCode: (profilEnfantId: string) =>
    api
      .post<PairingCode>('/parent/devices/pair-code', { profilEnfantId })
      .then((r) => r.data),

  lock: (deviceId: string, message?: string) =>
    api
      .post<{ message: string }>('/parent/devices/lock', { deviceId, message })
      .then((r) => r.data),

  unpair: (id: string) =>
    api.delete<{ message: string }>(`/parent/devices/${id}`).then((r) => r.data),
};
