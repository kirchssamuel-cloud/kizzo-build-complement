import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import prisma from './config/prisma';
import {
  startMaintenanceScheduler,
  stopMaintenanceScheduler,
} from './lib/jobs/scheduler';

const server = createServer(app);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connecté');
  } catch (err) {
    logger.error({ err }, 'Échec de connexion à la base de données');
    process.exit(1);
  }

  server.listen(env.PORT, () => {
    logger.info(`Kizzo API en écoute sur http://localhost:${env.PORT}`);
    // Démarré après le listen pour ne pas concurrencer le boot, et jamais
    // au simple import (les tests importent `app`, pas `server`).
    startMaintenanceScheduler();
  });
};

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Signal reçu — arrêt en cours');
  stopMaintenanceScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Serveur arrêté proprement');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

export default server;
