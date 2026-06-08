-- Intégration du générateur de quiz « Cerveau IA » (Kizzo LMS)

-- AlterEnum : nouveaux types de questions issus du Cerveau IA (SORT / MATCH)
ALTER TYPE "TypeQuestion" ADD VALUE IF NOT EXISTS 'tri';
ALTER TYPE "TypeQuestion" ADD VALUE IF NOT EXISTS 'association';

-- AlterTable : champs des défis personnels générés par IA
ALTER TABLE "Defi" ADD COLUMN     "profilEnfantId" TEXT,
ADD COLUMN     "sourceIa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quizIaId" TEXT;

-- CreateIndex
CREATE INDEX "Defi_profilEnfantId_idx" ON "Defi"("profilEnfantId");
