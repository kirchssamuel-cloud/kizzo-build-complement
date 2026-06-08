import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  CORS_ORIGIN: z.string().default('*'),
  PLATFORM_URL: z.string().url().default('http://localhost:3000'),
  APP_DEEP_LINK_PARENT: z.string().default('kizzo-parent://'),
  APP_DEEP_LINK_ENFANT: z.string().default('kizzo-enfant://'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgresql://postgres:postgres@localhost:5432/kizzo?schema=public'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default('change-me'),
  JWT_EXPIRES_IN: z.string().default('30d'),

  // Email — Resend
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Kizzo <no-reply@appstronaute.com>'),

  // OAuth — Google
  GOOGLE_CLIENT_ID_WEB: z.string().optional(),
  GOOGLE_CLIENT_ID_IOS: z.string().optional(),
  GOOGLE_CLIENT_ID_ANDROID: z.string().optional(),

  // OAuth — Apple
  APPLE_CLIENT_ID: z.string().default('com.appstronaute.kizzo'),

  // Notifications push
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
