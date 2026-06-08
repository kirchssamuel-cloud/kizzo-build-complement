import { Router } from 'express';
import authRouter from '../modules/auth/auth.route';
import healthRouter from '../modules/health/health.route';
import childrenRouter from '../modules-parent/children/children.route';
import devicesRouter from '../modules-parent/devices/devices.route';
import screenTimeRouter from '../modules-parent/screen-time/screen-time.route';
import webFilterRouter from '../modules-parent/web-filter/web-filter.route';
import appsRouter from '../modules-parent/apps/apps.route';
import profileRouter from '../modules-parent/profile/profile.route';
import activityRouter from '../modules-parent/activity/activity.route';
import {
  heartbeatRouter,
  parentDeviceStateRouter,
} from '../modules-parent/device-state/device-state.route';
import unlockRequestsRouter from '../modules-parent/unlock-requests/unlock-requests.route';
import notifsParentRouter from '../modules-parent/notifications/notifications.route';
import pushTokensRouter from '../modules-parent/push-tokens/push-tokens.route';
import billingRouter, {
  billingWebhookRouter,
} from '../modules-parent/billing/billing.route';
import homeEnfantRouter from '../modules-enfant/home/home.route';
import challengesRouter from '../modules-enfant/challenges/challenges.route';
import quizRouter from '../modules-enfant/quiz/quiz.route';
import requestsRouter from '../modules-enfant/requests/requests.route';
import badgesRouter from '../modules-enfant/badges/badges.route';
import adminAuthRouter from '../modules-admin/auth/admin-auth.route';
import adminUsersRouter from '../modules-admin/users/users.route';
import adminSecurityEventsRouter from '../modules-admin/security-events/security-events.route';
import adminDevicesRouter from '../modules-admin/devices/devices.route';
import adminPairingResetRouter from '../modules-admin/pairing-reset/pairing-reset.route';
import adminAnomaliesRouter from '../modules-admin/anomalies/anomalies.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/parent/children', childrenRouter);
router.use('/parent/devices', devicesRouter);
router.use('/parent/screen-time', screenTimeRouter);
router.use('/parent/web-filter', webFilterRouter);
router.use('/parent/apps', appsRouter);
router.use('/parent', profileRouter);
router.use('/parent/activity', activityRouter);
router.use('/parent/device-state', parentDeviceStateRouter);
router.use('/device-state', heartbeatRouter);
router.use('/parent/unlock-requests', unlockRequestsRouter);
router.use('/parent/notifications', notifsParentRouter);
router.use('/parent/push-tokens', pushTokensRouter);
router.use('/parent/billing', billingRouter);
router.use('/billing/webhook', billingWebhookRouter);
router.use('/enfant/home', homeEnfantRouter);
router.use('/enfant/challenges', challengesRouter);
router.use('/quiz', quizRouter);
router.use('/enfant/requests', requestsRouter);
router.use('/enfant/badges', badgesRouter);
router.use('/admin/auth', adminAuthRouter);
router.use('/admin/users', adminUsersRouter);
router.use('/admin/users', adminPairingResetRouter);
router.use('/admin/security-events', adminSecurityEventsRouter);
router.use('/admin/devices', adminDevicesRouter);
router.use('/admin/anomalies', adminAnomaliesRouter);

export default router;
