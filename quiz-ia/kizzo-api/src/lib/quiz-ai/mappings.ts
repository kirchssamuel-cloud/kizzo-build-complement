/**
 * Réconciliation des nomenclatures entre le Cerveau IA (Kizzo LMS) et le modèle
 * Prisma du backend Kizzo. Le service IA et le backend ont été conçus
 * séparément : matières, niveaux et types de questions ne portent pas les mêmes
 * libellés. Ces helpers font le pont dans les deux sens.
 */
import { Matiere, NiveauScolaire, Prisma, TypeQuestion } from '@prisma/client';
import { HttpError } from '../../middleware/error.middleware';
import type { AiQuestion, AiQuestionType } from './types';

// ---------------------------------------------------------------------------
// Matières
// ---------------------------------------------------------------------------

/** Matière IA → enum backend. Le backend regroupe histoire+géo, et range
 *  physique sous sciences (pas d'enum dédié). */
const AI_MATIERE_TO_BACKEND: Record<string, Matiere> = {
  mathematiques: Matiere.maths,
  francais: Matiere.francais,
  histoire: Matiere.histoire_geo,
  geographie: Matiere.histoire_geo,
  sciences: Matiere.sciences,
  physique: Matiere.sciences,
  anglais: Matiere.anglais,
};

/** Enum backend → matière IA (pour les requêtes de génération). `autres` n'a
 *  pas d'équivalent IA ; `histoire_geo` est résolu vers `histoire` par défaut. */
const BACKEND_MATIERE_TO_AI: Record<Matiere, string | null> = {
  [Matiere.maths]: 'mathematiques',
  [Matiere.francais]: 'francais',
  [Matiere.histoire_geo]: 'histoire',
  [Matiere.sciences]: 'sciences',
  [Matiere.anglais]: 'anglais',
  [Matiere.autres]: null,
};

export function aiMatiereToBackend(matiere: string): Matiere {
  return AI_MATIERE_TO_BACKEND[matiere.toLowerCase()] ?? Matiere.autres;
}

export function backendMatiereToAi(matiere: Matiere): string {
  const ai = BACKEND_MATIERE_TO_AI[matiere];
  if (!ai) {
    throw new HttpError(400, `La matière « ${matiere} » n'est pas supportée par le générateur IA.`);
  }
  return ai;
}

// ---------------------------------------------------------------------------
// Niveaux scolaires
// ---------------------------------------------------------------------------

const AI_NIVEAU_TO_BACKEND: Record<string, NiveauScolaire> = {
  CE2: NiveauScolaire.ce2,
  CM1: NiveauScolaire.cm1,
  CM2: NiveauScolaire.cm2,
  '6e': NiveauScolaire.sixieme,
  '5e': NiveauScolaire.cinquieme,
  '4e': NiveauScolaire.quatrieme,
  '3e': NiveauScolaire.troisieme,
};

const BACKEND_NIVEAU_TO_AI: Partial<Record<NiveauScolaire, string>> = {
  [NiveauScolaire.ce2]: 'CE2',
  [NiveauScolaire.cm1]: 'CM1',
  [NiveauScolaire.cm2]: 'CM2',
  [NiveauScolaire.sixieme]: '6e',
  [NiveauScolaire.cinquieme]: '5e',
  [NiveauScolaire.quatrieme]: '4e',
  [NiveauScolaire.troisieme]: '3e',
};

export function aiNiveauToBackend(niveau: string): NiveauScolaire | null {
  return AI_NIVEAU_TO_BACKEND[niveau] ?? null;
}

export function backendNiveauToAi(niveau: NiveauScolaire): string {
  const ai = BACKEND_NIVEAU_TO_AI[niveau];
  if (!ai) {
    throw new HttpError(
      400,
      `Le niveau « ${niveau} » n'est pas couvert par le générateur IA (CE2 → 3e uniquement).`,
    );
  }
  return ai;
}

// ---------------------------------------------------------------------------
// Types de questions
// ---------------------------------------------------------------------------

const AI_TYPE_TO_BACKEND: Record<AiQuestionType, TypeQuestion> = {
  QCM4: TypeQuestion.qcm,
  VF: TypeQuestion.vrai_faux,
  FILL: TypeQuestion.texte,
  CALC: TypeQuestion.calcul,
  SORT: TypeQuestion.tri,
  MATCH: TypeQuestion.association,
};

export function aiTypeToBackend(type: AiQuestionType): TypeQuestion {
  return AI_TYPE_TO_BACKEND[type] ?? TypeQuestion.texte;
}

// ---------------------------------------------------------------------------
// Normalisation d'une question IA → forme `QuestionDefi` (create input)
// ---------------------------------------------------------------------------

export interface NormalizedQuestion {
  ordre: number;
  enonce: string;
  type: TypeQuestion;
  options: Prisma.InputJsonValue | undefined;
  reponse: string;
  explication: string | null;
}

/**
 * Convertit une question IA en ligne `QuestionDefi`. La réponse attendue est
 * toujours stockée sous forme de chaîne :
 *  - QCM4/VF : le `label` correct (« A », « vrai »…) ;
 *  - FILL/CALC : la réponse texte ;
 *  - SORT/MATCH : le tableau attendu sérialisé en JSON (réinterprété au scoring).
 */
export function normalizeAiQuestion(q: AiQuestion, ordre: number): NormalizedQuestion {
  const type = aiTypeToBackend(q.type);
  const explication = q.explanation ?? null;

  let options: Prisma.InputJsonValue | undefined;
  let reponse: string;

  switch (q.type) {
    case 'QCM4':
    case 'VF':
      options = (q.options ?? []) as unknown as Prisma.InputJsonValue;
      reponse = String(q.correct_answer ?? '');
      break;
    case 'SORT':
      options = { items: q.items ?? [] } as unknown as Prisma.InputJsonValue;
      reponse = JSON.stringify(q.correct_answer ?? []);
      break;
    case 'MATCH':
      options = { pairs: q.pairs ?? [] } as unknown as Prisma.InputJsonValue;
      reponse = JSON.stringify(q.correct_answer ?? []);
      break;
    case 'FILL':
    case 'CALC':
    default:
      options = undefined;
      reponse = String(q.correct_answer ?? '');
      break;
  }

  return { ordre, enonce: q.question, type, options, reponse, explication };
}
