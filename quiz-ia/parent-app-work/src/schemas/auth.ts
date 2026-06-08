import { z } from 'zod';

const passwordRegexes = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  digit: /\d/,
  special: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]'`~;]/,
};

export const passwordSchema = z
  .string()
  .min(8, '8 caractères minimum')
  .regex(passwordRegexes.lower, 'Au moins une minuscule')
  .regex(passwordRegexes.upper, 'Au moins une majuscule')
  .regex(passwordRegexes.digit, 'Au moins un chiffre')
  .regex(passwordRegexes.special, 'Au moins un caractère spécial');

export const emailSchema = z
  .string()
  .min(1, "L'email est obligatoire")
  .email('Email invalide')
  .max(250);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginInput = z.infer<typeof loginSchema>;
export const signupSchema = z
  .object({
    prenom: z.string().min(1, 'Prénom requis').max(50),
    nom: z.string().min(1, 'Nom requis').max(50),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1),
    acceptCgu: z.literal(true, { message: 'Vous devez accepter les CGU' }),
    optInNewsletter: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof signupSchema>;
export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Code à 6 chiffres'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export const passwordResetSendCodeSchema = z.object({ email: emailSchema });
export type PasswordResetSendCodeInput = z.infer<typeof passwordResetSendCodeSchema>;
export const passwordResetUpdateSchema = z.object({
  email: emailSchema,
  code: z.string().length(6),
  password: passwordSchema,
});
export type PasswordResetUpdateInput = z.infer<typeof passwordResetUpdateSchema>;
export const passwordStrength = (raw: string): 0 | 1 | 2 | 3 | 4 => {
  if (!raw) return 0;
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (raw.length >= 8) score = (score + 1) as typeof score;
  if (passwordRegexes.lower.test(raw) && passwordRegexes.upper.test(raw)) {
    score = (score + 1) as typeof score;
  }
  if (passwordRegexes.digit.test(raw)) score = (score + 1) as typeof score;
  if (raw.length >= 12 && passwordRegexes.special.test(raw)) {
    score = (score + 1) as typeof score;
  }
  return score;
};
