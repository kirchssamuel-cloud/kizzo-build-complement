import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import {
  login,
  me,
  oauthApple,
  oauthGoogle,
  pairChildDevice,
  resendVerification,
  sendPasswordResetCode,
  signup,
  updatePasswordWithCode,
  verifyEmail,
} from './auth.controller';
import {
  loginSchema,
  oauthAppleSchema,
  oauthGoogleSchema,
  pairChildSchema,
  passwordResetSendCodeSchema,
  passwordResetUpdateSchema,
  resendVerificationSchema,
  signupSchema,
  verifyEmailSchema,
} from './auth.schema';

const router = Router();

// ── Inscription / connexion parent ─────────────────────────────────────────
router.post('/signup', validateResource(signupSchema), signup);
router.post('/login', validateResource(loginSchema), login);

// ── OAuth (Google, Apple) ──────────────────────────────────────────────────
router.post('/oauth/google', validateResource(oauthGoogleSchema), oauthGoogle);
router.post('/oauth/apple', validateResource(oauthAppleSchema), oauthApple);

// ── Vérification email ─────────────────────────────────────────────────────
router.post('/verify-email', validateResource(verifyEmailSchema), verifyEmail);
router.post(
  '/verify-email/resend',
  validateResource(resendVerificationSchema),
  resendVerification,
);

// ── Réinitialisation mot de passe ──────────────────────────────────────────
router.post(
  '/password-reset/send-code',
  validateResource(passwordResetSendCodeSchema),
  sendPasswordResetCode,
);
router.post(
  '/password-reset/update-password',
  validateResource(passwordResetUpdateSchema),
  updatePasswordWithCode,
);

// ── Appairage app enfant (via code) — P17 ──────────────────────────────────
router.post('/pair-child', validateResource(pairChildSchema), pairChildDevice);

// ── Profil utilisateur courant ─────────────────────────────────────────────
router.get('/me', authenticateToken(), me);

export default router;
