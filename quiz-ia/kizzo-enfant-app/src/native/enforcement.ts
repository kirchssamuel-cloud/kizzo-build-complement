/**
 * Façade TypeScript de la couche native d'application des règles (« enforcement »).
 *
 * ⚠️ SCAFFOLDING LOT E — la couche native Kotlin n'est PAS encore implémentée
 * (cf. `LOT_E_NATIF_ANTICONTOURNEMENT.md`). Ce module fournit :
 *   1. un contrat TypeScript stable que le reste de l'app enfant peut déjà
 *      consommer (points d'intégration figés) ;
 *   2. un repli no-op sûr quand le module natif `KizzoEnforcement` est absent
 *      (Expo Go, build sans le config plugin, iOS) → l'app ne crashe jamais.
 *
 * Quand le module Kotlin sera livré (via le config plugin `withKizzoEnforcement`),
 * `NativeModules.KizzoEnforcement` sera défini et ces appels deviendront réels.
 * Aucune logique de sécurité ne doit vivre ici : la façade ne fait que relayer.
 */
import { NativeModules, Platform } from 'react-native';

/** Permissions sensibles requises par l'enforcement (Android). */
export type EnforcementPermission =
  | 'accessibility' // AccessibilityService (détection app au 1er plan, blocage)
  | 'usageAccess' // PACKAGE_USAGE_STATS (temps d'écran par app)
  | 'overlay' // SYSTEM_ALERT_WINDOW (lockscreen overlay)
  | 'deviceAdmin' // DevicePolicyManager (anti-désinstallation, verrou)
  | 'vpn' // VpnService (filtrage DNS local)
  | 'ignoreBatteryOptimizations'; // survie du foreground service

export type PermissionStatus = 'granted' | 'denied' | 'unavailable';

/** Diagnostic d'intégrité remonté au backend (anti-contournement AC-01..14). */
export type IntegrityReport = {
  rooted: boolean; // root / Magisk détecté
  vpnActifTiers: boolean; // un VPN tiers court-circuite notre filtrage DNS
  accessibilityActif: boolean;
  deviceAdminActif: boolean;
  overlayAccorde: boolean;
  usageAccessAccorde: boolean;
  modeDeveloppeur: boolean; // ADB / dev options (bypass possible)
  modeAvion: boolean; // AC-10 : mode avion coupe le heartbeat / l'enforcement
  horodatage: string; // ISO
};

type NativeEnforcement = {
  isAvailable(): Promise<boolean>;
  getPermissionStatus(p: EnforcementPermission): Promise<PermissionStatus>;
  requestPermission(p: EnforcementPermission): Promise<PermissionStatus>;
  lockNow(message?: string): Promise<void>;
  unlock(): Promise<void>;
  setBlockedApps(bundleIds: string[]): Promise<void>;
  setDnsBlocklist(domains: string[]): Promise<void>;
  startHeartbeat(intervalSeconds: number): Promise<void>;
  stopHeartbeat(): Promise<void>;
  getIntegrityReport(): Promise<IntegrityReport>;
};

const native: NativeEnforcement | undefined = (
  NativeModules as { KizzoEnforcement?: NativeEnforcement }
).KizzoEnforcement;

/** Le module natif est-il réellement présent (build avec config plugin) ? */
export const enforcementNativeAvailable = (): boolean =>
  Platform.OS === 'android' && !!native;

// Repli no-op : sur iOS/Expo Go ou sans config plugin, on n'effondre rien.
const noopReport: IntegrityReport = {
  rooted: false,
  vpnActifTiers: false,
  accessibilityActif: false,
  deviceAdminActif: false,
  overlayAccorde: false,
  usageAccessAccorde: false,
  modeDeveloppeur: false,
  modeAvion: false,
  horodatage: new Date(0).toISOString(),
};

export const enforcement = {
  isAvailable: () => Promise.resolve(enforcementNativeAvailable()),

  getPermissionStatus: (p: EnforcementPermission): Promise<PermissionStatus> =>
    native ? native.getPermissionStatus(p) : Promise.resolve('unavailable'),

  requestPermission: (p: EnforcementPermission): Promise<PermissionStatus> =>
    native ? native.requestPermission(p) : Promise.resolve('unavailable'),

  /** Verrouille l'appareil enfant (overlay système). No-op si natif absent. */
  lockNow: (message?: string): Promise<void> =>
    native ? native.lockNow(message) : Promise.resolve(),

  unlock: (): Promise<void> => (native ? native.unlock() : Promise.resolve()),

  setBlockedApps: (bundleIds: string[]): Promise<void> =>
    native ? native.setBlockedApps(bundleIds) : Promise.resolve(),

  setDnsBlocklist: (domains: string[]): Promise<void> =>
    native ? native.setDnsBlocklist(domains) : Promise.resolve(),

  startHeartbeat: (intervalSeconds = 60): Promise<void> =>
    native ? native.startHeartbeat(intervalSeconds) : Promise.resolve(),

  stopHeartbeat: (): Promise<void> =>
    native ? native.stopHeartbeat() : Promise.resolve(),

  getIntegrityReport: (): Promise<IntegrityReport> =>
    native ? native.getIntegrityReport() : Promise.resolve(noopReport),
};
