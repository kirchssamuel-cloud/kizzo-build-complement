import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/async-handler';
import prisma from '../../config/prisma';
import { HttpError } from '../../middleware/error.middleware';
import { StatutDefi } from '@prisma/client';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const defis = await prisma.defi.findMany({
    where: { statut: StatutDefi.publie },
    orderBy: { dateCreation: 'desc' },
    select: {
      id: true,
      titre: true,
      description: true,
      matiere: true,
      difficulte: true,
      nombreQuestions: true,
      tempsRecompense: true,
    },
  });
  return res.json({ defis });
});

export const start = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const defi = await prisma.defi.findUnique({
    where: { id: req.params.id },
    include: { questions: { orderBy: { ordre: 'asc' } } },
  });
  if (!defi || defi.statut !== StatutDefi.publie) {
    throw new HttpError(404, 'Défi introuvable');
  }
  return res.json({ defi });
});

const submitSchema = z.object({
  reponses: z.array(z.object({ questionId: z.string().uuid(), reponse: z.string() })),
  dureeSeconds: z.number().int().min(0).optional(),
  profilEnfantId: z.string().uuid(),
});

export const submit = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const parsed = submitSchema.parse(req.body);
  const defi = await prisma.defi.findUnique({
    where: { id: req.params.id },
    include: { questions: true },
  });
  if (!defi) throw new HttpError(404, 'Défi introuvable');

  let correct = 0;
  for (const q of defi.questions) {
    const r = parsed.reponses.find((x) => x.questionId === q.id);
    if (r && r.reponse.trim().toLowerCase() === q.reponse.trim().toLowerCase()) correct++;
  }
  const score = Math.round((correct / Math.max(defi.questions.length, 1)) * 100);
  const reussi = score >= defi.seuilReussite;
  const tempsCredite = reussi ? defi.tempsRecompense : 0;

  const tentative = await prisma.tentativeDefi.create({
    data: {
      defiId: defi.id,
      profilEnfantId: parsed.profilEnfantId,
      score,
      reussi,
      tempsCredite,
      dureeSeconds: parsed.dureeSeconds,
      reponses: parsed.reponses,
    },
  });

  return res.json({ tentative, score, reussi, tempsCredite });
});
