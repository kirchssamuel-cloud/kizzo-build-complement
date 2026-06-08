import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env';
import { HttpError } from '../middleware/error.middleware';

type GoogleProfile = {
  sub: string;
  email?: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
};

const googleClient = new OAuth2Client();

const acceptedGoogleAudiences = [
  env.GOOGLE_CLIENT_ID_WEB,
  env.GOOGLE_CLIENT_ID_IOS,
  env.GOOGLE_CLIENT_ID_ANDROID,
].filter((v): v is string => !!v);

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  if (acceptedGoogleAudiences.length === 0) {
    throw new HttpError(500, 'Google OAuth non configuré côté serveur');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: acceptedGoogleAudiences,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new HttpError(401, 'Token Google invalide');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    givenName: payload.given_name,
    familyName: payload.family_name,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Apple
// ─────────────────────────────────────────────────────────────────────────────

const APPLE_ISSUER = 'https://appleid.apple.com';
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

type AppleProfile = {
  sub: string;
  email?: string;
  emailVerified: boolean;
};

export const verifyAppleIdToken = async (identityToken: string): Promise<AppleProfile> => {
  try {
    const { payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: APPLE_ISSUER,
      audience: env.APPLE_CLIENT_ID,
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) throw new HttpError(401, 'Token Apple sans sub');

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const emailVerifiedRaw = payload['email_verified'];
    const emailVerified = emailVerifiedRaw === true || emailVerifiedRaw === 'true';

    return { sub, email, emailVerified };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, 'Token Apple invalide');
  }
};
