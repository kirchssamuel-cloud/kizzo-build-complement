import { Router } from 'express';
import authRouter from '../modules/auth/auth.route';
import healthRouter from '../modules/health/health.route';
import childrenRouter from '../modules-parent/children/children.route';
import devicesRouter from '../modules-parent/devices/devices.route';
import screenTimeRouter from '../modules-parent/screen-time/screen-time.route';
import notifsParentRouter from '../modules-parent/notifications/notifications.route';
import homeEnfantRouter from '../modules-enfant/home/home.route';
import challengesRouter from '../modules-enfant/challenges/challenges.route';
import requestsRouter from '../modules-enfant/requests/requests.route';
import adminAuthRouter from '../modules-admin/auth/admin-auth.route';
import adminUsersRouter from '../modules-admin/users/users.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/parent/children', childrenRouter);
router.use('/parent/devices', devicesRouter);
router.use('/parent/screen-time', screenTimeRouter);
router.use('/parent/notifications', notifsParentRouter);
router.use('/enfant/home', homeEnfantRouter);
router.use('/enfant/challenges', challengesRouter);
router.use('/enfant/requests', requestsRouter);
router.use('/admin/auth', adminAuthRouter);
router.use('/admin/users', adminUsersRouter);

export default router;
