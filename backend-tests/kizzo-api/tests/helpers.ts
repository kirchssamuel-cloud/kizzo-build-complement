import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

export const api = () => request(app);

export const validPassword = 'Test1234!';

type SignupOverrides = Partial<{
  email: string;
  password: string;
  prenom: string;
  nom: string;
  optInNewsletter: boolean;
}>;

export function signupPayload(overrides: SignupOverrides = {}) {
  return {
    email: overrides.email ?? `parent${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`,
    password: overrides.password ?? validPassword,
    prenom: overrides.prenom ?? 'Jean',
    nom: overrides.nom ?? 'Dupont',
    acceptCgu: true as const,
    optInNewsletter: overrides.optInNewsletter ?? false,
  };
}

/**
 * Crée un parent, vérifie son email (en lisant le code en base) et le connecte.
 * Retourne le token JWT + l'utilisateur + l'email/mot de passe utilisés.
 */
export async function createVerifiedParent(overrides: SignupOverrides = {}) {
  const payload = signupPayload(overrides);
  const signupRes = await api().post('/api/auth/signup').send(payload);
  if (signupRes.status !== 201) {
    throw new Error(`Signup a échoué: ${signupRes.status} ${JSON.stringify(signupRes.body)}`);
  }

  const user = await prisma.utilisateur.findUniqueOrThrow({
    where: { email: payload.email.toLowerCase() },
  });
  await prisma.utilisateur.update({
    where: { id: user.id },
    data: { emailVerifie: true, codeVerificationEmail: null, dateCreationCodeVerif: null },
  });

  const loginRes = await api()
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });
  if (loginRes.status !== 200) {
    throw new Error(`Login a échoué: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }

  return {
    token: loginRes.body.token as string,
    userId: user.id,
    email: payload.email,
    password: payload.password,
  };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
