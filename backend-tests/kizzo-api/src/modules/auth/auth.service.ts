import bcrypt from 'bcryptjs';
import {
  Plateforme,
  Prisma,
  ProviderOAuth,
  RoleUtilisateur,
  StatutCompte,
  type Utilisateur,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { mail } from '../../config/mail';
import {
  BCRYPT_ROUNDS,
  DEVICE_PAIRING_CODE_TTL_MS,
  EMAIL_VERIFICATION_TTL_MS,
  LOGIN_LOCK_DURATION_MS,
  LOGIN_MAX_FAILED_ATTEMPTS,
  PASSWORD_RESET_CODE_TTL_MS,
} from '../../config/consts';
import { generateNumericCode } from '../../utils/random';
import { normalizeEmail } from '../../utils/email';
import {
  getPasswordResetEmail,
  getSignupVerificationEmail,
} from '../../lib/email-templates';
import { verifyAppleIdToken, verifyGoogleIdToken } from '../../lib/oauth-verify';
import { signJwt } from '../../utils/jwt';
import { HttpError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import type {
  LoginInput,
  OAuthAppleInput,
  OAuthGoogleInput,
  PairChildInput,
  PasswordResetSendCodeInput,
  PasswordResetUpdateInput,
  SetupProfilInputType,
  SignupInput,
  VerifyEmailInput,
} from './auth.schema';

type SetupProfilPlaceholder = Record<string, unknown>;
export type { SetupProfilPlaceholder as SetupProfilInputType };

const hashPassword = (raw: string) => bcrypt.hash(raw, BCRYPT_ROUNDS);

const sanitizeUser = (u: Utilisateur) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  prenom: u.prenom,
  nom: u.nom,
  avatarUrl: u.avatarUrl,
  plan: u.plan,
  langue: u.langue,
  statut: u.statut,
  emailVerifie: u.emailVerifie,
});

const buildAuthResponse = (utilisateur: Utilisateur) => {
  const token = signJwt({
    userId: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
  });
  return { token, utilisateur: sanitizeUser(utilisateur) };
};

const recordLogin = async (
  utilisateurId: string,
  context: { ip?: string; userAgent?: string },
) => {
  await prisma.$transaction([
    prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        derniereConnexion: new Date(),
        tentativesEchouees: 0,
        dateVerrouillage: null,
      },
    }),
    prisma.historiqueConnexion.create({
      data: { utilisateurId, ip: context.ip, userAgent: context.userAgent },
    }),
  ]);
};

export const signupParent = async (input: SignupInput) => {
  const email = normalizeEmail(input.email);

  const existing = await prisma.utilisateur.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Cette adresse email est déjà utilisée');
  }

  const motDePasse = await hashPassword(input.password);
  const codeVerification = generateNumericCode();

  const utilisateur = await prisma.utilisateur.create({
    data: {
      email,
      motDePasse,
      role: RoleUtilisateur.parent,
      statut: StatutCompte.actif,
      prenom: input.prenom,
      nom: input.nom,
      codeVerificationEmail: codeVerification,
      dateCreationCodeVerif: new Date(),
    },
  });

  const verificationEmail = getSignupVerificationEmail(codeVerification);
  mail
    .sendMail({
      to: email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html,
    })
    .catch((err) => logger.error({ err, email }, 'Échec envoi email vérification'));

  return buildAuthResponse(utilisateur);
};

export const verifyEmail = async (input: VerifyEmailInput) => {
  const email = normalizeEmail(input.email);

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur || !utilisateur.codeVerificationEmail) {
    throw new HttpError(400, 'Code invalide ou expiré');
  }

  const expired =
    !utilisateur.dateCreationCodeVerif ||
    Date.now() - utilisateur.dateCreationCodeVerif.getTime() > EMAIL_VERIFICATION_TTL_MS;

  if (expired || utilisateur.codeVerificationEmail !== input.code) {
    throw new HttpError(400, 'Code invalide ou expiré');
  }

  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: {
      emailVerifie: true,
      codeVerificationEmail: null,
      dateCreationCodeVerif: null,
    },
  });

  return { message: 'Email vérifié avec succès' };
};

export const resendVerification = async (rawEmail: string) => {
  const email = normalizeEmail(rawEmail);
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

  if (!utilisateur || utilisateur.emailVerifie) {
    return { message: "Si l'email existe et n'est pas vérifié, un code a été envoyé." };
  }

  const code = generateNumericCode();
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { codeVerificationEmail: code, dateCreationCodeVerif: new Date() },
  });

  const verificationEmail = getSignupVerificationEmail(code);
  await mail.sendMail({
    to: email,
    subject: verificationEmail.subject,
    text: verificationEmail.text,
    html: verificationEmail.html,
  });

  return { message: "Si l'email existe et n'est pas vérifié, un code a été envoyé." };
};

export const login = async (input: LoginInput, context: { ip?: string; userAgent?: string }) => {
  const email = normalizeEmail(input.email);

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur || !utilisateur.motDePasse) {
    throw new HttpError(401, 'Email ou mot de passe invalide');
  }

  if (
    utilisateur.dateVerrouillage &&
    Date.now() - utilisateur.dateVerrouillage.getTime() < LOGIN_LOCK_DURATION_MS
  ) {
    throw new HttpError(
      403,
      'Compte verrouillé après trop de tentatives. Réessayez dans 15 minutes.',
    );
  }

  const ok = await bcrypt.compare(input.password, utilisateur.motDePasse);
  if (!ok) {
    const nextFailed = utilisateur.tentativesEchouees + 1;
    const shouldLock = nextFailed >= LOGIN_MAX_FAILED_ATTEMPTS;
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        tentativesEchouees: nextFailed,
        dateVerrouillage: shouldLock ? new Date() : null,
      },
    });
    if (shouldLock) {
      throw new HttpError(403, 'Compte verrouillé après 5 tentatives. Réessayez dans 15 minutes.');
    }
    throw new HttpError(401, 'Email ou mot de passe invalide');
  }

  if (utilisateur.statut === StatutCompte.suspendu) {
    throw new HttpError(403, 'Votre compte est suspendu. Veuillez contacter le support.');
  }
  if (utilisateur.statut === StatutCompte.supprime) {
    throw new HttpError(403, 'Compte supprimé.');
  }

  if (!utilisateur.emailVerifie) {
    const code = generateNumericCode();
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { codeVerificationEmail: code, dateCreationCodeVerif: new Date() },
    });
    const verificationEmail = getSignupVerificationEmail(code);
    mail
      .sendMail({
        to: utilisateur.email,
        subject: verificationEmail.subject,
        text: verificationEmail.text,
        html: verificationEmail.html,
      })
      .catch((err) => logger.error({ err, email: utilisateur.email }, 'Échec renvoi code vérif'));

    throw new HttpError(403, 'Veuillez vérifier votre email avant de vous connecter.', {
      code: 'EMAIL_NOT_VERIFIED',
      email: utilisateur.email,
    });
  }

  await recordLogin(utilisateur.id, context);
  return buildAuthResponse(utilisateur);
};

export const sendPasswordResetCode = async (input: PasswordResetSendCodeInput) => {
  const email = normalizeEmail(input.email);
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

  if (!utilisateur) {
    return { message: 'Si cet email existe, un code a été envoyé' };
  }

  const code = generateNumericCode();
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: {
      codeReinitialisationMdp: code,
      dateCreationCodeReinit: new Date(),
    },
  });

  const resetEmail = getPasswordResetEmail(code);
  await mail.sendMail({
    to: email,
    subject: resetEmail.subject,
    text: resetEmail.text,
    html: resetEmail.html,
  });

  return { message: 'Si cet email existe, un code a été envoyé' };
};

export const updatePasswordWithCode = async (input: PasswordResetUpdateInput) => {
  const email = normalizeEmail(input.email);
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

  if (!utilisateur || !utilisateur.codeReinitialisationMdp) {
    throw new HttpError(400, 'Code invalide ou expiré');
  }

  const expired =
    !utilisateur.dateCreationCodeReinit ||
    Date.now() - utilisateur.dateCreationCodeReinit.getTime() > PASSWORD_RESET_CODE_TTL_MS;

  if (expired || utilisateur.codeReinitialisationMdp !== input.code) {
    throw new HttpError(400, 'Code invalide ou expiré');
  }

  const motDePasse = await hashPassword(input.password);
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: {
      motDePasse,
      codeReinitialisationMdp: null,
      dateCreationCodeReinit: null,
      tentativesEchouees: 0,
      dateVerrouillage: null,
    },
  });

  return { message: 'Mot de passe mis à jour avec succès' };
};

const upsertOauthUser = async (params: {
  provider: ProviderOAuth;
  providerUserId: string;
  email: string | undefined;
  emailVerifie: boolean;
  prenom?: string;
  nom?: string;
}) => {
  const email = params.email ? normalizeEmail(params.email) : undefined;

  const existingLink = await prisma.compteOAuth.findUnique({
    where: {
      provider_providerUserId: {
        provider: params.provider,
        providerUserId: params.providerUserId,
      },
    },
    include: { utilisateur: true },
  });
  if (existingLink) return existingLink.utilisateur;

  if (email) {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.compteOAuth.create({
        data: {
          utilisateurId: existingUser.id,
          provider: params.provider,
          providerUserId: params.providerUserId,
          emailFournisseur: email,
        },
      });
      return existingUser;
    }
  }

  const fallbackEmail = email ?? `${params.provider}_${params.providerUserId}@oauth.kizzo.local`;

  return prisma.utilisateur.create({
    data: {
      email: fallbackEmail,
      motDePasse: null,
      role: RoleUtilisateur.parent,
      statut: StatutCompte.actif,
      emailVerifie: params.emailVerifie,
      prenom: params.prenom,
      nom: params.nom,
      comptesOAuth: {
        create: {
          provider: params.provider,
          providerUserId: params.providerUserId,
          emailFournisseur: email,
        },
      },
    },
  });
};

export const loginAvecGoogle = async (
  input: OAuthGoogleInput,
  context: { ip?: string; userAgent?: string },
) => {
  const profile = await verifyGoogleIdToken(input.idToken);

  const utilisateur = await upsertOauthUser({
    provider: ProviderOAuth.google,
    providerUserId: profile.sub,
    email: profile.email,
    emailVerifie: profile.emailVerified,
    prenom: profile.givenName,
    nom: profile.familyName,
  });

  if (utilisateur.statut === StatutCompte.suspendu) {
    throw new HttpError(403, 'Votre compte est suspendu. Veuillez contacter le support.');
  }

  await recordLogin(utilisateur.id, context);
  return buildAuthResponse(utilisateur);
};

export const loginAvecApple = async (
  input: OAuthAppleInput,
  context: { ip?: string; userAgent?: string },
) => {
  const profile = await verifyAppleIdToken(input.identityToken);

  const utilisateur = await upsertOauthUser({
    provider: ProviderOAuth.apple,
    providerUserId: profile.sub,
    email: profile.email,
    emailVerifie: profile.emailVerified,
    prenom: input.prenom,
    nom: input.nom,
  });

  if (utilisateur.statut === StatutCompte.suspendu) {
    throw new HttpError(403, 'Votre compte est suspendu. Veuillez contacter le support.');
  }

  await recordLogin(utilisateur.id, context);
  return buildAuthResponse(utilisateur);
};

export const pairChildDevice = async (input: PairChildInput) => {
  const appareil = await prisma.appareil.findFirst({
    where: { codeAppairage: input.codeAppairage },
    include: { profilEnfant: { include: { parent: true } } },
  });
  if (!appareil) {
    throw new HttpError(404, 'Code invalide ou expiré');
  }
  const expired =
    !appareil.dateCodeAppairage ||
    Date.now() - appareil.dateCodeAppairage.getTime() > DEVICE_PAIRING_CODE_TTL_MS;
  if (expired) {
    throw new HttpError(400, "Code d'appairage expiré");
  }

  const appareilMisAJour = await prisma.appareil.update({
    where: { id: appareil.id },
    data: {
      nomAffichage: input.nomAppareil,
      plateforme: input.plateforme as Plateforme,
      modele: input.modele,
      versionOs: input.versionOs,
      versionApp: input.versionApp,
      codeAppairage: null,
      dateCodeAppairage: null,
      actif: true,
      derniereSync: new Date(),
    },
  });

  const token = signJwt({
    userId: appareil.profilEnfant.parentId,
    email: `enfant.${appareil.profilEnfantId}@kizzo.local`,
    role: RoleUtilisateur.enfant,
  });

  return {
    token,
    appareilId: appareilMisAJour.id,
    profilEnfant: {
      id: appareil.profilEnfant.id,
      prenom: appareil.profilEnfant.prenom,
      avatarId: appareil.profilEnfant.avatarId,
      couleurTheme: appareil.profilEnfant.couleurTheme,
      niveauScolaire: appareil.profilEnfant.niveauScolaire,
    },
  };
};

export const getMe = async (userId: string) => {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: userId },
    include: {
      profilsEnfants: {
        select: {
          id: true,
          prenom: true,
          avatarId: true,
          couleurTheme: true,
          niveauScolaire: true,
          dateNaissance: true,
        },
      },
    },
  });
  if (!utilisateur) throw new HttpError(404, 'Utilisateur introuvable');
  return { utilisateur: { ...sanitizeUser(utilisateur), profilsEnfants: utilisateur.profilsEnfants } };
};

void Prisma;
