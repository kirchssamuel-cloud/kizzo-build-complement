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

  // Cerveau IA — générateur de quiz (Kizzo LMS). La clé reste TOUJOURS côté
  // serveur : elle ne doit jamais être exposée aux apps mobiles.
  QUIZ_AI_BASE_URL: z.string().url().default('http://92.222.197.147:8000'),
  QUIZ_AI_API_KEY: z.string().optional(),
  QUIZ_AI_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),

  // Stripe — abonnement (RG-17, P33). Clés strictement côté serveur.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Price IDs Stripe par plan payant.
  STRIPE_PRICE_FAMILLE: z.string().optional(),
  STRIPE_PRICE_FAMILLE_PLUS: z.string().optional(),
  // URLs de retour du checkout (deep links app).
  STRIPE_SUCCESS_URL: z.string().default('kizzo-parent://abonnement/succes'),
  STRIPE_CANCEL_URL: z.string().default('kizzo-parent://abonnement/annule'),

  // Jobs de maintenance (purge logs, déverrouillage, réconciliation abonnements).
  // Désactivable en prod si on préfère un cron externe (k8s/systemd). 'false' = off.
  MAINTENANCE_JOBS_ENABLED: z.string().default('true'),
  // Intervalle entre deux passes du planificateur interne (défaut 24 h).
  MAINTENANCE_INTERVAL_MS: z.coerce.number().int().positive().default(86_400_000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
