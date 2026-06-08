import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RoleUtilisateur, StatutCompte } from '@prisma/client';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { HttpError } from './error.middleware';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    utilisateur?: {
      id: string;
      email: string;
      role: RoleUtilisateur;
      statut: StatutCompte;
      emailVerifie: boolean;
      prenom: string | null;
      nom: string | null;
      avatarUrl: string | null;
      langue: 'fr' | 'en';
      plan: 'gratuit' | 'famille' | 'famille_plus';
    };
  }
}

export type JwtPayload = {
  userId: string;
  email: string;
  role: RoleUtilisateur;
};

/**
 * Authentifie l'utilisateur via JWT (header `Authorization: Bearer <token>`).
 * Si `allowedRoles` est fourni, vérifie aussi que le rôle est autorisé.
 */
export const authenticateToken =
  (allowedRoles?: RoleUtilisateur[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new HttpError(401, "Token d'authentification manquant");
      }

      const token = authHeader.slice('Bearer '.length).trim();
      if (!token) throw new HttpError(401, "Token d'authentification manquant");

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          throw new HttpError(401, "Token d'accès expiré");
        }
        throw new HttpError(401, "Token d'accès invalide");
      }

      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          statut: true,
          emailVerifie: true,
          prenom: true,
          nom: true,
          avatarUrl: true,
          langue: true,
          plan: true,
        },
      });

      if (!utilisateur) throw new HttpError(401, 'Utilisateur introuvable');

      if (utilisateur.statut === StatutCompte.suspendu) {
        throw new HttpError(403, 'Votre compte est suspendu. Veuillez contacter le support.');
      }
      if (utilisateur.statut === StatutCompte.supprime) {
        throw new HttpError(403, 'Compte supprimé.');
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(utilisateur.role)) {
        throw new HttpError(403, 'Accès refusé : permissions insuffisantes');
      }

      req.userId = utilisateur.id;
      req.utilisateur = utilisateur;
      next();
    } catch (err) {
      next(err);
    }
  };

/** Vérifie que l'email a été validé. */
export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.utilisateur) return next(new HttpError(401, 'Non authentifié'));
  if (!req.utilisateur.emailVerifie) {
    return next(new HttpError(403, 'Veuillez vérifier votre email avant de continuer.'));
  }
  next();
};
