import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import * as authService from './auth.service';
import type {
  LoginInput,
  OAuthAppleInput,
  OAuthGoogleInput,
  PairChildInput,
  PasswordResetSendCodeInput,
  PasswordResetUpdateInput,
  ResendVerificationInput,
  SignupInput,
  VerifyEmailInput,
} from './auth.schema';

export const signup = asyncHandler(
  async (req: Request<unknown, unknown, SignupInput>, res: Response) => {
    const result = await authService.signupParent(req.body);
    return res.status(201).json({
      message: 'Compte créé. Vérifie ton email.',
      ...result,
    });
  },
);

export const login = asyncHandler(
  async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(result);
  },
);

export const verifyEmail = asyncHandler(
  async (req: Request<unknown, unknown, VerifyEmailInput>, res: Response) => {
    const result = await authService.verifyEmail(req.body);
    return res.json(result);
  },
);

export const resendVerification = asyncHandler(
  async (req: Request<unknown, unknown, ResendVerificationInput>, res: Response) => {
    const result = await authService.resendVerification(req.body.email);
    return res.json(result);
  },
);

export const sendPasswordResetCode = asyncHandler(
  async (req: Request<unknown, unknown, PasswordResetSendCodeInput>, res: Response) => {
    const result = await authService.sendPasswordResetCode(req.body);
    return res.json(result);
  },
);

export const updatePasswordWithCode = asyncHandler(
  async (req: Request<unknown, unknown, PasswordResetUpdateInput>, res: Response) => {
    const result = await authService.updatePasswordWithCode(req.body);
    return res.json(result);
  },
);

export const oauthGoogle = asyncHandler(
  async (req: Request<unknown, unknown, OAuthGoogleInput>, res: Response) => {
    const result = await authService.loginAvecGoogle(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(result);
  },
);

export const oauthApple = asyncHandler(
  async (req: Request<unknown, unknown, OAuthAppleInput>, res: Response) => {
    const result = await authService.loginAvecApple(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.json(result);
  },
);

export const pairChildDevice = asyncHandler(
  async (req: Request<unknown, unknown, PairChildInput>, res: Response) => {
    const result = await authService.pairChildDevice(req.body);
    return res.json(result);
  },
);

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.userId!);
  return res.json(result);
});
