import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks (hoistés au-dessus des imports) ─────────────────────────────────────
// On configure FCM (via env) ET on mocke firebase-admin entièrement : aucun
// appel réseau réel, on contrôle la réponse de sendEachForMulticast par test.
const { sendEachForMulticast } = vi.hoisted(() => ({
  sendEachForMulticast: vi.fn(),
}));

vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(() => ({ name: 'kizzo-fcm' })),
    credential: { cert: vi.fn(() => ({})) },
    messaging: vi.fn(() => ({ sendEachForMulticast })),
  },
}));

vi.mock('../src/config/env', async (orig) => {
  const actual = (await orig()) as { env: Record<string, unknown> };
  return { env: { ...actual.env, FCM_SERVICE_ACCOUNT_JSON: '{"project_id":"kizzo-test"}' } };
});

import { api, authHeader, createVerifiedParent } from './helpers';
import prisma from '../src/config/prisma';
import { pushConfigured, sendPushToUser } from '../src/lib/push';

async function createChild(token: string) {
  const res = await api()
    .post('/api/parent/children')
    .set(authHeader(token))
    .send({
      prenom: 'Lina',
      dateNaissance: '2016-05-01',
      niveauScolaire: 'cm1',
      avatarId: 2,
      couleurTheme: '#4C6971',
    });
  if (res.status !== 201) {
    throw new Error(`Création enfant échouée: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.enfant.id as string;
}

function deviceWithToken(profilEnfantId: string, tokenPush: string) {
  return prisma.appareil.create({
    data: {
      profilEnfantId,
      nomAffichage: 'Téléphone enfant',
      plateforme: 'android',
      actif: true,
      tokenPush,
    },
  });
}

beforeEach(() => {
  sendEachForMulticast.mockReset();
  sendEachForMulticast.mockImplementation(async ({ tokens }: { tokens: string[] }) => ({
    successCount: tokens.length,
    failureCount: 0,
    responses: tokens.map(() => ({ success: true, messageId: 'm' })),
  }));
});

describe('Envoi push FCM réel — deliver()', () => {
  it('FCM est considéré configuré (mock env)', () => {
    expect(pushConfigured()).toBe(true);
  });

  it('skip no_tokens quand le destinataire n\'a aucun token (zéro réseau)', async () => {
    const { userId } = await createVerifiedParent();
    const res = await sendPushToUser(userId, { titre: 'Coucou', corps: 'Test' });
    expect(res).toMatchObject({ destinataires: 0, envoyes: 0, skipped: 'no_tokens' });
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('envoie aux tokens FCM du parent et compte les succès', async () => {
    const { userId } = await createVerifiedParent();
    await prisma.appareilPush.createMany({
      data: [
        { utilisateurId: userId, token: 'fcm-1', plateforme: 'android' },
        { utilisateurId: userId, token: 'fcm-2', plateforme: 'android' },
      ],
    });

    const res = await sendPushToUser(userId, { titre: 'Coucou', corps: 'Test' });
    expect(res.destinataires).toBe(2);
    expect(res.envoyes).toBe(2);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0][0].tokens).toEqual(
      expect.arrayContaining(['fcm-1', 'fcm-2']),
    );
  });

  it('purge le token invalide (UNREGISTERED) et n\'envoie qu\'aux valides', async () => {
    const { userId } = await createVerifiedParent();
    await prisma.appareilPush.createMany({
      data: [
        { utilisateurId: userId, token: 'good', plateforme: 'android' },
        { utilisateurId: userId, token: 'dead', plateforme: 'android' },
      ],
    });
    sendEachForMulticast.mockImplementation(async ({ tokens }: { tokens: string[] }) => ({
      successCount: tokens.filter((t) => t !== 'dead').length,
      failureCount: tokens.filter((t) => t === 'dead').length,
      responses: tokens.map((t) =>
        t === 'dead'
          ? { success: false, error: { code: 'messaging/registration-token-not-registered' } }
          : { success: true, messageId: 'm' },
      ),
    }));

    const res = await sendPushToUser(userId, { titre: 'Coucou', corps: 'Test' });
    expect(res.envoyes).toBe(1);
    const restants = await prisma.appareilPush.findMany({ where: { utilisateurId: userId } });
    expect(restants.map((r) => r.token)).toEqual(['good']);
  });

  it('route les tokens Expo vers l\'API Expo (pas firebase-admin)', async () => {
    const { userId } = await createVerifiedParent();
    await prisma.appareilPush.create({
      data: { utilisateurId: userId, token: 'ExponentPushToken[abc123]', plateforme: 'android' },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    } as unknown as Response);

    const res = await sendPushToUser(userId, { titre: 'Coucou', corps: 'Test' });
    expect(res.envoyes).toBe(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(sendEachForMulticast).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('Branchements métier — push temps réel', () => {
  it('demande de temps refusée si préférence push off (skip, zéro envoi)', async () => {
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await prisma.appareilPush.create({
      data: { utilisateurId: parent.userId, token: 'fcm-parent', plateforme: 'android' },
    });
    await prisma.preferenceNotification.create({
      data: { utilisateurId: parent.userId, type: 'demande_temps', canalPush: false },
    });

    const res = await api()
      .post('/api/enfant/requests')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: childId, minutes: 30 });
    expect(res.status).toBe(201);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('lock → push lockNow vers l\'appareil enfant', async () => {
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    const device = await deviceWithToken(childId, 'fcm-child-lock');

    const res = await api()
      .post('/api/parent/devices/lock')
      .set(authHeader(parent.token))
      .send({ deviceId: device.id });
    expect(res.status).toBe(200);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0][0].tokens).toContain('fcm-child-lock');
  });

  it('réponse acceptée → push "temps accordé" vers l\'enfant', async () => {
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await deviceWithToken(childId, 'fcm-child-time');
    // Parent sans token push : la création de demande ne déclenche aucun envoi.
    const demandeRes = await api()
      .post('/api/enfant/requests')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: childId, minutes: 15 });
    const demandeId = demandeRes.body.demande.id as string;
    sendEachForMulticast.mockClear();

    const res = await api()
      .post(`/api/parent/unlock-requests/${demandeId}/respond`)
      .set(authHeader(parent.token))
      .send({ accepter: true });
    expect(res.status).toBe(200);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0][0].tokens).toContain('fcm-child-time');
  });

  it('demande de temps → push vers le parent (préférence par défaut: on)', async () => {
    const parent = await createVerifiedParent();
    const childId = await createChild(parent.token);
    await prisma.appareilPush.create({
      data: { utilisateurId: parent.userId, token: 'fcm-parent-demande', plateforme: 'android' },
    });

    const res = await api()
      .post('/api/enfant/requests')
      .set(authHeader(parent.token))
      .send({ profilEnfantId: childId, minutes: 60 });
    expect(res.status).toBe(201);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0][0].tokens).toContain('fcm-parent-demande');
  });
});
