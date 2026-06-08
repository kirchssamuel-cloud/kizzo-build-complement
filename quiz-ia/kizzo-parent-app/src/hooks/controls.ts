import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activityApi,
  appsApi,
  deviceStateApi,
  notifPrefsApi,
  profileApi,
  unlockRequestsApi,
  webFilterApi,
  type DeleteAccountInput,
  type RespondRequestInput,
  type UpdatePreferencesInput,
  type UpdateProfileInput,
  type UpdateWebFilterInput,
  type UpsertAppRuleInput,
} from '~/services/api/controls';
import { devicesApi } from '~/services/api/devices';
import type { StatutDemandeTemps } from '~/types/controls';

// Clés de cache additives (ne touche pas à `qk` agence).
export const controlKeys = {
  webFilter: (childId: string) => ['web-filter', childId] as const,
  apps: (childId: string) => ['apps', childId] as const,
  profile: ['parent-profile'] as const,
  report: (childId: string, jours: number) => ['activity-report', childId, jours] as const,
  unlockRequests: (statut?: StatutDemandeTemps, childId?: string) =>
    ['unlock-requests', statut ?? 'en_attente', childId ?? 'all'] as const,
  deviceState: (childId: string) => ['device-state', childId] as const,
  notifPrefs: ['notif-prefs'] as const,
};

export const useWebFilter = (childId: string | undefined) =>
  useQuery({
    queryKey: childId ? controlKeys.webFilter(childId) : ['web-filter', 'noop'],
    queryFn: () => webFilterApi.get(childId!),
    enabled: !!childId,
  });

export const useUpdateWebFilter = (childId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWebFilterInput) => webFilterApi.update(childId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: controlKeys.webFilter(childId) }),
  });
};

export const useApps = (childId: string | undefined) =>
  useQuery({
    queryKey: childId ? controlKeys.apps(childId) : ['apps', 'noop'],
    queryFn: () => appsApi.list(childId!),
    enabled: !!childId,
  });

export const useUpsertApp = (childId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertAppRuleInput) => appsApi.upsert(childId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: controlKeys.apps(childId) }),
  });
};

export const useDeleteApp = (childId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bundleId: string) => appsApi.remove(childId, bundleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: controlKeys.apps(childId) }),
  });
};

export const useParentProfile = () =>
  useQuery({ queryKey: controlKeys.profile, queryFn: () => profileApi.get() });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: controlKeys.profile }),
  });
};

export const useDeleteAccount = () =>
  useMutation({ mutationFn: (input: DeleteAccountInput) => profileApi.deleteAccount(input) });

export const useActivityReport = (childId: string | undefined, jours = 7) =>
  useQuery({
    queryKey: childId ? controlKeys.report(childId, jours) : ['activity-report', 'noop'],
    queryFn: () => activityApi.report(childId!, jours),
    enabled: !!childId,
  });

// ── Demandes de temps (P13) ──────────────────────────────────────────────────
export const useUnlockRequests = (statut?: StatutDemandeTemps, childId?: string) =>
  useQuery({
    queryKey: controlKeys.unlockRequests(statut, childId),
    queryFn: () => unlockRequestsApi.list({ statut, childId }),
  });

export const useRespondUnlockRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ demandeId, input }: { demandeId: string; input: RespondRequestInput }) =>
      unlockRequestsApi.respond(demandeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unlock-requests'] }),
  });
};

// ── Verrouillage manuel (P12) ────────────────────────────────────────────────
// Pousse une commande `lockNow` à l'appareil enfant (file de notifications).
export const useLockDevice = () =>
  useMutation({
    mutationFn: ({ deviceId, message }: { deviceId: string; message?: string }) =>
      devicesApi.lock(deviceId, message),
  });

// ── État appareil ────────────────────────────────────────────────────────────
export const useDeviceState = (childId: string | undefined) =>
  useQuery({
    queryKey: childId ? controlKeys.deviceState(childId) : ['device-state', 'noop'],
    queryFn: () => deviceStateApi.list(childId!),
    enabled: !!childId,
  });

// ── Préférences de notification (P34) ────────────────────────────────────────
export const useNotifPrefs = () =>
  useQuery({ queryKey: controlKeys.notifPrefs, queryFn: () => notifPrefsApi.get() });

export const useUpdateNotifPrefs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => notifPrefsApi.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: controlKeys.notifPrefs }),
  });
};
