import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Les tests touchent une vraie base Postgres partagée : on sérialise tout
    // dans UN seul process (singleFork). Sans cela, le `TRUNCATE` global du
    // beforeEach d'un fichier pouvait s'exécuter pendant un test d'un autre
    // fichier (contamination inter-fichiers → 404/403 intermittents).
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    sequence: { concurrent: false },
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/kizzo_test?schema=public',
      JWT_SECRET: 'test-secret',
      // Pas de RESEND_API_KEY -> le mailer simule les envois (aucun email réel).
      // Stripe : clés factices (le client Stripe est mocké, aucun appel réseau).
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_fake',
      STRIPE_PRICE_FAMILLE: 'price_famille',
      STRIPE_PRICE_FAMILLE_PLUS: 'price_famille_plus',
    },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
