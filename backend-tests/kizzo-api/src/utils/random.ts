import crypto from 'crypto';

export const generateNumericCode = (length = 6): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

export const generateUrlSafeToken = (bytes = 32): string =>
  crypto.randomBytes(bytes).toString('base64url');

export const sha256Hex = (input: string): string =>
  crypto.createHash('sha256').update(input).digest('hex');
