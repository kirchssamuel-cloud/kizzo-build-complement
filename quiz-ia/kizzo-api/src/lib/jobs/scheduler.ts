import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { runAllMaintenanceJobs } from './maintenance';

/**
 * Planificateur interne « cron » des jobs de maintenance.
 *
 * Volontairement minimaliste : un `setInterval` qui rejoue `runAllMaintenanceJobs`
 * à intervalle régulier. Les jobs étant idempotents (cf. `maintenance.ts`), un
 * double passage est sans danger. On préfère ça à une dépendance lourde
 * (node-cron, bullmq…) tant qu'il n'y a qu'une poignée de tâches périodiques.
 *
 * En production on peut désactiver ce planificateur interne
 * (`MAINTENANCE_JOBS_ENABLED=false`) pour confier le déclenchement à un cron
 * externe (k8s CronJob, systemd timer) qui appellerait directement
 * `runAllMaintenanceJobs`.
 */

let timer: NodeJS.Timeout | null = null;

/** Indique si le planificateur doit tourner dans cet environnement. */
const shouldRun = (): boolean =>
  env.MAINTENANCE_JOBS_ENABLED !== 'false' && env.NODE_ENV !== 'test';

/**
 * Démarre le planificateur. No-op si déjà démarré, désactivé, ou en test.
 * Lance un premier passage immédiat puis répète toutes les
 * `MAINTENANCE_INTERVAL_MS`. Renvoie `true` si le planificateur a démarré.
 */
export const startMaintenanceScheduler = (): boolean => {
  if (!shouldRun()) {
    logger.info('Planificateur de maintenance désactivé (env)');
    return false;
  }
  if (timer) return true; // déjà démarré — idempotent

  const runSafely = async () => {
    try {
      await runAllMaintenanceJobs();
    } catch (err) {
      // Un échec d'un passage ne doit jamais faire tomber le serveur :
      // on log et on retentera au prochain intervalle.
      logger.error({ err }, 'Échec d\'un passage des jobs de maintenance');
    }
  };

  // Premier passage légèrement différé pour ne pas concurrencer le boot.
  setTimeout(runSafely, 5_000).unref();

  timer = setInterval(runSafely, env.MAINTENANCE_INTERVAL_MS);
  timer.unref(); // ne maintient pas le process en vie à lui seul
  logger.info(
    { intervalMs: env.MAINTENANCE_INTERVAL_MS },
    'Planificateur de maintenance démarré',
  );
  return true;
};

/** Arrête le planificateur (utile pour un shutdown propre / les tests). */
export const stopMaintenanceScheduler = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Planificateur de maintenance arrêté');
  }
};
