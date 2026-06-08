import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../middleware/auth.middleware';

export const signJwt = (payload: JwtPayload, options?: SignOptions) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    ...options,
  });

export const verifyJwt = (token: string) => jwt.verify(token, env.JWT_SECRET) as JwtPayload;
