import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { logger } from '../config/logger';

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateResource =
  (schemas: RequestSchemas | ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const isSingleSchema = typeof (schemas as ZodTypeAny)?.parse === 'function';
    const toValidate: RequestSchemas = isSingleSchema
      ? { body: schemas as ZodTypeAny }
      : (schemas as RequestSchemas);

    const messages: string[] = [];

    if (toValidate.body) {
      try {
        req.body = toValidate.body.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          messages.push(...err.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
        } else {
          messages.push('Body invalide');
        }
      }
    }

    if (toValidate.query) {
      try {
        const data = toValidate.query.parse(req.query);
        Object.assign(req.query, data);
      } catch (err) {
        if (err instanceof ZodError) {
          messages.push(...err.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
        } else {
          messages.push('Query invalide');
        }
      }
    }

    if (toValidate.params) {
      try {
        const data = toValidate.params.parse(req.params);
        Object.assign(req.params, data);
      } catch (err) {
        if (err instanceof ZodError) {
          messages.push(...err.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
        } else {
          messages.push('Params invalides');
        }
      }
    }

    if (messages.length > 0) {
      logger.debug({ method: req.method, path: req.path, errors: messages }, 'Validation failed');
      return res.status(400).json({
        message: 'Une erreur est survenue lors de la validation des données',
        errors: messages,
      });
    }

    next();
  };
