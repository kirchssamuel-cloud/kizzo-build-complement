import { Router } from 'express';
import prisma from '../../config/prisma';
import { asyncHandler } from '../../middleware/async-handler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),
);

router.get(
  '/db',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ status: 'ok', database: 'reachable' });
    } catch (err) {
      return res.status(503).json({
        status: 'error',
        database: 'unreachable',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }),
);

export default router;
