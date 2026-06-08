import admin from 'firebase-admin';
import type { TypeNotification } from '@prisma/client';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { logger } from '../config/logger';

/**
 * Dispatcher de notifications push — **serveur-only**.
 *
 * Centralise l'envoi des push vers :
 *   - les appareils **parents** (table `AppareilPush`, clé `utilisateurId`) via
 *     `sendPushToUser` ;
 *   - les appareils **enfants** (table `Appareil.tokenPush`, clé `profilEnfantId`)
 *     via `sendPushToChild` — l'enfant n'a pas de compte `Utilisateur` distinct,
 *     son jeton vit donc directement sur l'appareil.
 *
 * Les credentials FCM restent STRICTEMENT côté serveur (`FCM_SERVICE_ACCOUNT_JSON`)
 * — jamais exposés au mobile. Tant que cette variable est absente, tout est un
 * **no-op sûr** (zéro réseau, on journalise et on retourne `skipped`).
 */

export type PushPayload = {
  titre: string;
  corps: string;
  /** Données arbitraires transmises à l'app (deep link, ids…). Valeurs string (contrainte FCM). */
  donnees?: Record<string, string>;
  /**
   * Type de notification — sert à respecter les préférences du destinataire
   * (`PreferenceNotification.canalPush`). Uniquement pertinent pour un parent
   * (`sendPushToUser`) ; les enfants n'ont pas de préférences.
   */
  type?: TypeNotification;
};

export type PushResult = {
  /** Nombre de tokens auxquels le push a été envoyé. */
  destinataires: number;
  /** Nombre d'envois réussis. */
  envoyes: number;
  /** Raison si rien n'a été envoyé (diagnostic). */
  skipped?: 'not_configured' | 'no_tokens' | 'pref_off';
};

/** FCM est-il configuré (credentials présents côté serveur) ? */
export const pushConfigured = (): boolean => !!env.FCM_SERVICE_ACCOUNT_JSON;

// ── FCM (firebase-admin) ──────────────────────────────────────────────────────

const EXPO_PREFIX = 'ExponentPushToken[';
const EXPO_API = 'https://exp.host/--/api/v2/push/send';

/** Codes d'erreur FCM signalant un token définitivement invalide → à purger. */
const FCM_PURGE_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

let firebaseApp: admin.app.App | null = null;

/** Initialise (une fois) firebase-admin depuis le service account et renvoie le client messaging. */
const getMessaging = (): admin.messaging.Messaging => {
  if (!firebaseApp) {
    const creds = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON as string);
    firebaseApp = admin.initializeApp(
      { credential: admin.credential.cert(creds) },
      'kizzo-fcm',
    );
  }
  return admin.messaging(firebaseApp);
};

/** Supprime/neutralise les tokens devenus invalides, des deux tables. */
const purgeTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  await prisma.appareilPush.deleteMany({ where: { token: { in: tokens } } });
  await prisma.appareil.updateMany({
    where: { tokenPush: { in: tokens } },
    data: { tokenPush: null },
  });
};

/** Envoi via l'API Expo Push (tokens `ExponentPushToken[...]`). */
const deliverExpo = async (
  tokens: string[],
  payload: PushPayload,
  invalides: string[],
): Promise<number> => {
  const messages = tokens.map((to) => ({
    to,
    title: payload.titre,
    body: payload.corps,
    ...(payload.donnees ? { data: payload.donnees } : {}),
  }));

  const res = await fetch(EXPO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    logger.warn({ status: res.status }, 'Échec envoi push Expo');
    return 0;
  }

  const json = (await res.json()) as {
    data?: Array<{ status: string; details?: { error?: string } }>;
  };
  const tickets = json.data ?? [];
  let ok = 0;
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'ok') {
      ok += 1;
    } else if (ticket.details?.error === 'DeviceNotRegistered') {
      invalides.push(tokens[i] as string);
    }
  });
  return ok;
};

/**
 * Envoi réel vers le fournisseur push. Sépare les tokens FCM bruts des tokens
 * Expo, envoie via le bon canal, purge les tokens invalides, et renvoie le
 * nombre d'envois réussis.
 */
const deliver = async (tokens: string[], payload: PushPayload): Promise<number> => {
  const expo = tokens.filter((t) => t.startsWith(EXPO_PREFIX));
  const fcm = tokens.filter((t) => !t.startsWith(EXPO_PREFIX));
  const invalides: string[] = [];
  let envoyes = 0;

  if (fcm.length > 0) {
    const resp = await getMessaging().sendEachForMulticast({
      tokens: fcm,
      notification: { title: payload.titre, body: payload.corps },
      ...(payload.donnees ? { data: payload.donnees } : {}),
    });
    envoyes += resp.successCount;
    resp.responses.forEach((r, i) => {
      if (!r.success && r.error && FCM_PURGE_CODES.has(r.error.code)) {
        invalides.push(fcm[i] as string);
      }
    });
  }

  if (expo.length > 0) {
    envoyes += await deliverExpo(expo, payload, invalides);
  }

  await purgeTokens(invalides);
  return envoyes;
};

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Envoie une notification push à tous les appareils d'un **parent**.
 * No-op sûr si FCM non configuré, si la préférence push du type est désactivée,
 * ou si le parent n'a aucun token.
 */
export const sendPushToUser = async (
  userId: string,
  payload: PushPayload,
): Promise<PushResult> => {
  if (!pushConfigured()) {
    logger.debug(
      { userId, titre: payload.titre },
      'Push non configuré (FCM_SERVICE_ACCOUNT_JSON absent) — envoi ignoré',
    );
    return { destinataires: 0, envoyes: 0, skipped: 'not_configured' };
  }

  if (payload.type) {
    const pref = await prisma.preferenceNotification.findUnique({
      where: { utilisateurId_type: { utilisateurId: userId, type: payload.type } },
    });
    if (pref && !pref.canalPush) {
      return { destinataires: 0, envoyes: 0, skipped: 'pref_off' };
    }
  }

  const appareils = await prisma.appareilPush.findMany({
    where: { utilisateurId: userId },
    select: { token: true },
  });
  const tokens = appareils.map((a) => a.token);
  if (tokens.length === 0) {
    return { destinataires: 0, envoyes: 0, skipped: 'no_tokens' };
  }

  const envoyes = await deliver(tokens, payload);
  return { destinataires: tokens.length, envoyes };
};

/**
 * Envoie une notification push aux appareils **enfants** d'un profil
 * (`Appareil.tokenPush`). L'enfant n'ayant pas de compte `Utilisateur`, aucune
 * préférence `PreferenceNotification` ne s'applique : ces push (verrouillage,
 * temps accordé) sont opérationnels et toujours délivrés.
 * No-op sûr si FCM non configuré ou si l'enfant n'a aucun appareil avec token.
 */
export const sendPushToChild = async (
  profilEnfantId: string,
  payload: PushPayload,
): Promise<PushResult> => {
  if (!pushConfigured()) {
    logger.debug(
      { profilEnfantId, titre: payload.titre },
      'Push non configuré (FCM_SERVICE_ACCOUNT_JSON absent) — envoi ignoré',
    );
    return { destinataires: 0, envoyes: 0, skipped: 'not_configured' };
  }

  const appareils = await prisma.appareil.findMany({
    where: { profilEnfantId, actif: true, tokenPush: { not: null } },
    select: { tokenPush: true },
  });
  const tokens = appareils
    .map((a) => a.tokenPush)
    .filter((t): t is string => !!t);
  if (tokens.length === 0) {
    return { destinataires: 0, envoyes: 0, skipped: 'no_tokens' };
  }

  const envoyes = await deliver(tokens, payload);
  return { destinataires: tokens.length, envoyes };
};
