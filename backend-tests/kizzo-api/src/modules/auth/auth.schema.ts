import { z } from 'zod';
import { Langue, PlanAbonnement, RoleUtilisateur } from '@prisma/client';
import { PASSWORD_MIN_LENGTH } from '../../config/consts';

const passwordSchema = z
  .string({ required_error: 'Le mot de passe est obligatoire' })
  .min(PASSWORD_MIN_LENGTH, { message: `${PASSWORD_MIN_LENGTH} caractères minimum` })
  .refine((v) => /[a-z]/.test(v), {
    message: 'Le mot de passe doit contenir au moins une minuscule',
  })
  .refine((v) => /[A-Z]/.test(v), {
    message: 'Le mot de passe doit contenir au moins une majuscule',
  })
  .refine((v) => /\d/.test(v), {
    message: 'Le mot de passe doit contenir au moins un chiffre',
  })
  .refine((v) => /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]'`~;]/.test(v), {
    message: 'Le mot de passe doit contenir au moins un caractère spécial',
  });

const emailSchema = z
  .string({ required_error: "L'email est obligatoire" })
  .email({ message: "L'email est invalide" })
  .max(250, { message: '250 caractères maximum' });


export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Le mot de passe est obligatoire' }).min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(50),
  acceptCgu: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les CGU/CGV' }),
  }),
  optInNewsletter: z.boolean(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Code à 6 chiffres requis'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email: emailSchema });
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const passwordResetSendCodeSchema = z.object({ email: emailSchema });
export type PasswordResetSendCodeInput = z.infer<typeof passwordResetSendCodeSchema>;

export const passwordResetUpdateSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Code à 6 chiffres requis'),
  password: passwordSchema,
});
export type PasswordResetUpdateInput = z.infer<typeof passwordResetUpdateSchema>;

export const oauthGoogleSchema = z.object({
  idToken: z.string().min(20, 'idToken Google manquant'),
  acceptCgu: z.boolean().optional(),
});
export type OAuthGoogleInput = z.infer<typeof oauthGoogleSchema>;

export const oauthAppleSchema = z.object({
  identityToken: z.string().min(20, 'identityToken Apple manquant'),
  prenom: z.string().min(1).max(50).optional(),
  nom: z.string().min(1).max(50).optional(),
  acceptCgu: z.boolean().optional(),
});
export type OAuthAppleInput = z.infer<typeof oauthAppleSchema>;

export const pairChildSchema = z.object({
  codeAppairage: z.string().length(6, 'Code à 6 chiffres requis'),
  nomAppareil: z.string().min(1).max(100),
  plateforme: z.enum(['ios', 'android', 'tablette']),
  modele: z.string().max(100).optional(),
  versionOs: z.string().max(20).optional(),
  versionApp: z.string().max(20).optional(),
});
export type PairChildInput = z.infer<typeof pairChildSchema>;

export const ROLES_VALUES = [
  RoleUtilisateur.parent,
  RoleUtilisateur.enfant,
  RoleUtilisateur.administrateur,
] as const;

export const PLANS_VALUES = [
  PlanAbonnement.gratuit,
  PlanAbonnement.famille,
  PlanAbonnement.famille_plus,
] as const;

export const LANGUES_VALUES = [Langue.fr, Langue.en] as const;
