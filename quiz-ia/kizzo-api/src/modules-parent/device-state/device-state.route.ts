import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { heartbeat, getStates } from './device-state.controller';
import { childIdParamsSchema, heartbeatSchema } from './device-state.schema';

/**
 * Heartbeat appareil enfant — monté sur /api/device-state.
 * Le token enfant porte l'id du parent (cf. pairChildDevice) ; on accepte
 * aussi le rôle parent pour les outils de diagnostic.
 */
export const heartbeatRouter = Router();
heartbeatRouter.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));
heartbeatRouter.put('/', validateResource({ body: heartbeatSchema }), heartbeat);

/** Lecture parent — montée sur /api/parent/device-state. */
export const parentDeviceStateRouter = Router();
parentDeviceStateRouter.use(authenticateToken([RoleUtilisateur.parent]));
parentDeviceStateRouter.get(
  '/:childId',
  validateResource({ params: childIdParamsSchema }),
  getStates,
);
