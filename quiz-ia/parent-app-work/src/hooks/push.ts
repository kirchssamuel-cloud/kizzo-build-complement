import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { pushApi, type PlateformePush } from '~/services/api/push';

/** Plateforme courante (tablette non distinguée côté Expo → android/ios). */
const currentPlateforme = (): PlateformePush =>
  Platform.OS === 'ios' ? 'ios' : 'android';

/**
 * Récupère le token push natif (FCM Android / APNs iOS) et l'enregistre côté
 * backend (`POST /parent/push-tokens`). À appeler après login (P32/P34).
 *
 * On utilise `getDevicePushTokenAsync` (token natif brut) plutôt que le token
 * Expo : il ne nécessite pas de `projectId` EAS et correspond directement au
 * destinataire attendu par le dispatcher FCM serveur (firebase-admin).
 *
 * Retourne le token enregistré, ou `null` si la permission est refusée ou si le
 * push est indisponible (Expo Go iOS, émulateur sans Google Play services…).
 * Ne lève pas : un échec push ne doit jamais bloquer l'app.
 */
export async function registerPushToken(): Promise<string | null> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = String(deviceToken.data);
    if (!token) return null;

    await pushApi.register(token, currentPlateforme());
    return token;
  } catch {
    // Push indisponible (pas de services Google Play, Expo Go, etc.) — silencieux.
    return null;
  }
}

/** Enregistre le token push de cet appareil (mutation à déclencher post-login). */
export const useRegisterPushToken = () =>
  useMutation({ mutationFn: registerPushToken });

/** Désenregistre un token (déconnexion). */
export const useUnregisterPushToken = () =>
  useMutation({ mutationFn: (token: string) => pushApi.unregister(token) });
