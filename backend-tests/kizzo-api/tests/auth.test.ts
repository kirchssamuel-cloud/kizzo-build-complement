import { describe, expect, it } from 'vitest';
import prisma from '../src/config/prisma';
import { api, authHeader, createVerifiedParent, signupPayload, validPassword } from './helpers';

describe('POST /api/auth/signup', () => {
  it('crée un compte parent et renvoie un token (201)', async () => {
    const payload = signupPayload();
    const res = await api().post('/api/auth/signup').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.utilisateur).toMatchObject({
      email: payload.email.toLowerCase(),
      role: 'parent',
      emailVerifie: false,
    });
    // Le hash du mot de passe ne doit jamais fuiter dans la réponse.
    expect(JSON.stringify(res.body)).not.toContain(payload.password);
    expect(res.body.utilisateur.motDePasse).toBeUndefined();
  });

  it('refuse un email déjà utilisé (409)', async () => {
    const payload = signupPayload();
    await api().post('/api/auth/signup').send(payload);
    const res = await api().post('/api/auth/signup').send(payload);
    expect(res.status).toBe(409);
  });

  it('refuse un mot de passe trop faible (400)', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send(signupPayload({ password: 'faible' }));
    expect(res.status).toBe(400);
  });

  it('refuse si les CGU ne sont pas acceptées (400)', async () => {
    const payload = { ...signupPayload(), acceptCgu: false };
    const res = await api().post('/api/auth/signup').send(payload);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('bloque la connexion tant que l\'email n\'est pas vérifié (403 EMAIL_NOT_VERIFIED)', async () => {
    const payload = signupPayload();
    await api().post('/api/auth/signup').send(payload);

    const res = await api()
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(403);
  });

  it('connecte un parent vérifié et renvoie un token (200)', async () => {
    const { token } = await createVerifiedParent();
    expect(token).toBeTypeOf('string');
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    const { email } = await createVerifiedParent();
    const res = await api()
      .post('/api/auth/login')
      .send({ email, password: 'MauvaisMdp1!' });
    expect(res.status).toBe(401);
  });

  it('verrouille le compte après 5 échecs (403)', async () => {
    const { email } = await createVerifiedParent();
    for (let i = 0; i < 4; i++) {
      const r = await api().post('/api/auth/login').send({ email, password: 'Wrong123!' });
      expect(r.status).toBe(401);
    }
    const locked = await api().post('/api/auth/login').send({ email, password: 'Wrong123!' });
    expect(locked.status).toBe(403);
    // Même le bon mot de passe est refusé pendant le verrouillage.
    const stillLocked = await api()
      .post('/api/auth/login')
      .send({ email, password: validPassword });
    expect(stillLocked.status).toBe(403);
  });
});

describe('Flow vérification email', () => {
  it('vérifie l\'email avec le bon code puis autorise la connexion', async () => {
    const payload = signupPayload();
    await api().post('/api/auth/signup').send(payload);

    const user = await prisma.utilisateur.findUniqueOrThrow({
      where: { email: payload.email.toLowerCase() },
    });
    expect(user.codeVerificationEmail).toMatch(/^\d{6}$/);

    const verifyRes = await api()
      .post('/api/auth/verify-email')
      .send({ email: payload.email, code: user.codeVerificationEmail });
    expect(verifyRes.status).toBe(200);

    const loginRes = await api()
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTypeOf('string');
  });

  it('refuse un mauvais code (400)', async () => {
    const payload = signupPayload();
    await api().post('/api/auth/signup').send(payload);
    const res = await api()
      .post('/api/auth/verify-email')
      .send({ email: payload.email, code: '000000' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('renvoie le profil avec un token valide (200)', async () => {
    const { token, email } = await createVerifiedParent();
    const res = await api().get('/api/auth/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.utilisateur.email).toBe(email.toLowerCase());
    expect(Array.isArray(res.body.utilisateur.profilsEnfants)).toBe(true);
  });

  it('refuse sans token (401)', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('refuse un token invalide (401)', async () => {
    const res = await api().get('/api/auth/me').set(authHeader('jeton.bidon.invalide'));
    expect(res.status).toBe(401);
  });
});

describe('Flow réinitialisation mot de passe', () => {
  it('permet de changer le mot de passe avec le code et de se reconnecter', async () => {
    const { email } = await createVerifiedParent();

    const sendRes = await api().post('/api/auth/password-reset/send-code').send({ email });
    expect(sendRes.status).toBe(200);

    const user = await prisma.utilisateur.findUniqueOrThrow({
      where: { email: email.toLowerCase() },
    });
    expect(user.codeReinitialisationMdp).toMatch(/^\d{6}$/);

    const newPassword = 'Nouveau123!';
    const updateRes = await api()
      .post('/api/auth/password-reset/update-password')
      .send({ email, code: user.codeReinitialisationMdp, password: newPassword });
    expect(updateRes.status).toBe(200);

    const loginRes = await api().post('/api/auth/login').send({ email, password: newPassword });
    expect(loginRes.status).toBe(200);
  });

  it('ne révèle pas si l\'email existe (200 générique)', async () => {
    const res = await api()
      .post('/api/auth/password-reset/send-code')
      .send({ email: 'inconnu@example.com' });
    expect(res.status).toBe(200);
  });
});
