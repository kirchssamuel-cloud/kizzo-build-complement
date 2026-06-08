import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { env } from '../config/env';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Conflit : ressource déjà existante',
        details: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Ressource introuvable' });
    }
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return res.status(500).json({
    message: env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
  });
};
