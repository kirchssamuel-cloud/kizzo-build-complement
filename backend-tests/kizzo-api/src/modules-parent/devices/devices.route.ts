import { Router } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateResource } from '../../middleware/validate.resource';
import { generatePairing, list, lock, remove } from './devices.controller';
import {
  deviceIdParamsSchema,
  generatePairingCodeSchema,
  lockDeviceSchema,
} from './devices.schema';

const router = Router();
router.use(authenticateToken([RoleUtilisateur.parent]));

router.get('/', list);
router.post('/pair-code', validateResource(generatePairingCodeSchema), generatePairing);
router.post('/lock', validateResource(lockDeviceSchema), lock);
router.delete('/:id', validateResource({ params: deviceIdParamsSchema }), remove);

export default router;
