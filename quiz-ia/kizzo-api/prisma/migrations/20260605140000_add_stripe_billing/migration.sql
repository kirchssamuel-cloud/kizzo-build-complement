-- Abonnement Stripe (P33 / RG-17) : champs ajoutés au modèle Utilisateur.
ALTER TABLE "Utilisateur"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "statutAbonnement" TEXT,
  ADD COLUMN "abonnementFinPeriode" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_stripeCustomerId_key" ON "Utilisateur"("stripeCustomerId");
