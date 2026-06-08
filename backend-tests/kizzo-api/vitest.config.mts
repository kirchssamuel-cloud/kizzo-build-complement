import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Les tests touchent une vraie base Postgres partagée : on évite les courses.
    fileParallelism: false,
    sequence: { concurrent: false },
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/kizzo_test?schema=public',
      JWT_SECRET: 'test-secret',
      // Pas de RESEND_API_KEY -> le mailer simule les envois (aucun email réel).
    },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
