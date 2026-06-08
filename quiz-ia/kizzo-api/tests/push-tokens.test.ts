import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';
import { pushConfigured, sendPushToUser } from '../src/lib/push';

const BASE = '/api/parent/push-tokens';
const tk = () => `ExponentPushToken[${Date.now()}${Math.floor(Math.random() * 1e6)}]`;

describe('Tokens push parent (FCM)', () => {
  it('refuse sans token JWT (401)', async () => {
    const res = await api().post(BASE).send({ token: tk(), plateforme: 'android' });
    expect(res.status).toBe(401);
  });

  it('enregistre un token (201) et le renvoie sans fuiter l’id interne', async () => {
    const { token } = await createVerifiedParent();
    const pushToken = tk();
    const res = await api()
      .post(BASE)
      .set(authHeader(token))
      .send({ token: pushToken, plateforme: 'android', langue: 'fr' });
    expect(res.status).toBe(201);
    expect(res.body.appareilPush).toMatchObject({
      token: pushToken,
      plateforme: 'android',
      langue: 'fr',
    });
    expect(res.body.appareilPush.id).toBeUndefined();
  });

  it('upsert : ré-enregistrer le même token ne crée pas de doublon', async () => {
    const { token } = await createVerifiedParent();
    const pushToken = tk();
    await api()
      .post(BASE)
      .set(authHeader(token))
      .send({ token: pushToken, plateforme: 'android' });
    // Même token, plateforme différente → mise à jour.
    const second = await api()
      .post(BASE)
      .set(authHeader(token))
      .send({ token: pushToken, plateforme: 'tablette' });
    expect(second.status).toBe(201);

    const list = await api().get(BASE).set(authHeader(token));
    expect(list.status).toBe(200);
    expect(list.body.tokens).toHaveLength(1);
    expect(list.body.tokens[0].plateforme).toBe('tablette');
  });

  it('gère plusieurs appareils pour un même parent', async () => {
    const { token } = await createVerifiedParent();
    await api().post(BASE).set(authHeader(token)).send({ token: tk(), plateforme: 'android' });
    await api().post(BASE).set(authHeader(token)).send({ token: tk(), plateforme: 'ios' });
    const list = await api().get(BASE).set(authHeader(token));
    expect(list.body.tokens).toHaveLength(2);
  });

  it('désenregistre un token (idempotent)', async () => {
    const { token } = await createVerifiedParent();
    const pushToken = tk();
    await api().post(BASE).set(authHeader(token)).send({ token: pushToken, plateforme: 'android' });

    const del1 = await api()
      .post(`${BASE}/unregister`)
      .set(authHeader(token))
      .send({ token: pushToken });
    expect(del1.status).toBe(200);
    expect(del1.body.supprime).toBe(1);

    // Second appel : rien à supprimer (idempotent).
    const del2 = await api()
      .post(`${BASE}/unregister`)
      .set(authHeader(token))
      .send({ token: pushToken });
    expect(del2.body.supprime).toBe(0);

    const list = await api().get(BASE).set(authHeader(token));
    expect(list.body.tokens).toHaveLength(0);
  });

  it('isole les tokens entre parents (B ne peut pas supprimer le token de A)', async () => {
    const parentA = await createVerifiedParent();
    const pushToken = tk();
    await api()
      .post(BASE)
      .set(authHeader(parentA.token))
      .send({ token: pushToken, plateforme: 'android' });

    const parentB = await createVerifiedParent();
    const del = await api()
      .post(`${BASE}/unregister`)
      .set(authHeader(parentB.token))
      .send({ token: pushToken });
    expect(del.body.supprime).toBe(0);

    // A conserve bien son token.
    const listA = await api().get(BASE).set(authHeader(parentA.token));
    expect(listA.body.tokens).toHaveLength(1);
  });

  it('rejette une plateforme inconnue (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .post(BASE)
      .set(authHeader(token))
      .send({ token: tk(), plateforme: 'windows' });
    expect(res.status).toBe(400);
  });

  it('rejette un token vide (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .post(BASE)
      .set(authHeader(token))
      .send({ token: '', plateforme: 'android' });
    expect(res.status).toBe(400);
  });
});

describe('Dispatcher push (lib/push) — repli no-op sans FCM', () => {
  it('pushConfigured() est faux en environnement de test', () => {
    expect(pushConfigured()).toBe(false);
  });

  it('sendPushToUser ne fait rien et signale not_configured (zéro réseau)', async () => {
    const { userId } = await createVerifiedParent();
    const res = await sendPushToUser(userId, { titre: 'Test', corps: 'Coucou' });
    expect(res).toMatchObject({ destinataires: 0, envoyes: 0, skipped: 'not_configured' });
  });
});
