import request from 'supertest';
import jwt from 'jsonwebtoken';
import { RoleUtilisateur } from '@prisma/client';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { env } from '../src/config/env';

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

/**
 * Crée un administrateur (pas d'endpoint de signup admin) et signe un JWT
 * directement, comme le ferait un provisioning back-office.
 */
export async function createAdmin() {
  const email = `admin${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;
  const user = await prisma.utilisateur.create({
    data: {
      email,
      role: RoleUtilisateur.administrateur,
      statut: 'actif',
      emailVerifie: true,
      prenom: 'Admin',
      nom: 'Root',
    },
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: RoleUtilisateur.administrateur },
    env.JWT_SECRET,
  );
  return { token, userId: user.id, email };
}
