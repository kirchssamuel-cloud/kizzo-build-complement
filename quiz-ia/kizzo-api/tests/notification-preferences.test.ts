import { describe, expect, it } from 'vitest';
import { api, authHeader, createVerifiedParent } from './helpers';

const PREFS = '/api/parent/notifications/preferences';

describe('Préférences de notification (P34)', () => {
  it('refuse sans token (401)', async () => {
    const res = await api().get(PREFS);
    expect(res.status).toBe(401);
  });

  it('retourne la liste exhaustive des types avec défauts (push on, email off)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().get(PREFS).set(authHeader(token));
    expect(res.status).toBe(200);
    // 12 types dans l'enum TypeNotification.
    expect(res.body.preferences.length).toBeGreaterThanOrEqual(10);
    for (const p of res.body.preferences) {
      expect(p.canalPush).toBe(true);
      expect(p.canalEmail).toBe(false);
      expect(typeof p.type).toBe('string');
    }
  });

  it('upsert des préférences puis les relit', async () => {
    const { token } = await createVerifiedParent();
    const put = await api()
      .put(PREFS)
      .set(authHeader(token))
      .send({
        preferences: [
          { type: 'defi_reussi', canalPush: false, canalEmail: true },
          { type: 'resume_hebdomadaire', canalPush: true, canalEmail: true },
        ],
      });
    expect(put.status).toBe(200);

    const get = await api().get(PREFS).set(authHeader(token));
    const defi = get.body.preferences.find((p: { type: string }) => p.type === 'defi_reussi');
    const resume = get.body.preferences.find(
      (p: { type: string }) => p.type === 'resume_hebdomadaire',
    );
    expect(defi).toMatchObject({ canalPush: false, canalEmail: true });
    expect(resume).toMatchObject({ canalPush: true, canalEmail: true });
    // Les types non modifiés gardent les défauts.
    const autre = get.body.preferences.find((p: { type: string }) => p.type === 'systeme');
    expect(autre).toMatchObject({ canalPush: true, canalEmail: false });
  });

  it('idempotent : un second upsert écrase sans doublon', async () => {
    const { token } = await createVerifiedParent();
    await api()
      .put(PREFS)
      .set(authHeader(token))
      .send({ preferences: [{ type: 'defi_reussi', canalPush: true, canalEmail: false }] });
    const second = await api()
      .put(PREFS)
      .set(authHeader(token))
      .send({ preferences: [{ type: 'defi_reussi', canalPush: false, canalEmail: false }] });
    expect(second.status).toBe(200);
    const defi = second.body.preferences.find(
      (p: { type: string }) => p.type === 'defi_reussi',
    );
    expect(defi.canalPush).toBe(false);
  });

  it('isole les préférences entre parents', async () => {
    const parentA = await createVerifiedParent();
    await api()
      .put(PREFS)
      .set(authHeader(parentA.token))
      .send({ preferences: [{ type: 'defi_reussi', canalPush: false, canalEmail: false }] });

    const parentB = await createVerifiedParent();
    const get = await api().get(PREFS).set(authHeader(parentB.token));
    const defi = get.body.preferences.find((p: { type: string }) => p.type === 'defi_reussi');
    // Parent B garde les défauts (push on).
    expect(defi.canalPush).toBe(true);
  });

  it('rejette un type inconnu (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api()
      .put(PREFS)
      .set(authHeader(token))
      .send({ preferences: [{ type: 'type_bidon', canalPush: true, canalEmail: false }] });
    expect(res.status).toBe(400);
  });

  it('rejette un tableau vide (400)', async () => {
    const { token } = await createVerifiedParent();
    const res = await api().put(PREFS).set(authHeader(token)).send({ preferences: [] });
    expect(res.status).toBe(400);
  });
});
