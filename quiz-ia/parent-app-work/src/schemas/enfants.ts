import { z } from "zod";
import type { NiveauScolaire } from "~/types/auth";

const NIVEAUX: NiveauScolaire[] = [
  "maternelle",
  "cp",
  "ce1",
  "ce2",
  "cm1",
  "cm2",
  "sixieme",
  "cinquieme",
  "quatrieme",
  "troisieme",
  "seconde",
  "premiere",
  "terminale",
];

export const createChildSchema = z.object({
  prenom: z.string().min(1, "Prénom requis").max(30),
  dateNaissance: z.date(),
  niveauScolaire: z.enum(NIVEAUX as [NiveauScolaire, ...NiveauScolaire[]]),
  avatarId: z.number().int().min(0).max(19),
  couleurTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur HEX requise"),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;
