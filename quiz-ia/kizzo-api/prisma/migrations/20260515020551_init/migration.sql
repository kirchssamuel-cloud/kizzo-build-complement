-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('parent', 'enfant', 'administrateur');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('actif', 'suspendu', 'supprime');

-- CreateEnum
CREATE TYPE "PlanAbonnement" AS ENUM ('gratuit', 'famille', 'famille_plus');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('fr', 'en');

-- CreateEnum
CREATE TYPE "ProviderOAuth" AS ENUM ('email', 'google', 'apple');

-- CreateEnum
CREATE TYPE "NiveauScolaire" AS ENUM ('maternelle', 'cp', 'ce1', 'ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale');

-- CreateEnum
CREATE TYPE "Plateforme" AS ENUM ('ios', 'android', 'tablette');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');

-- CreateEnum
CREATE TYPE "Matiere" AS ENUM ('maths', 'francais', 'histoire_geo', 'sciences', 'anglais', 'autres');

-- CreateEnum
CREATE TYPE "StatutDefi" AS ENUM ('brouillon', 'en_revision', 'publie', 'archive');

-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('qcm', 'vrai_faux', 'texte', 'calcul');

-- CreateEnum
CREATE TYPE "NiveauFiltre" AS ENUM ('strict', 'modere', 'personnalise');

-- CreateEnum
CREATE TYPE "CategorieApp" AS ENUM ('jeux', 'reseaux_sociaux', 'education', 'communication', 'divertissement', 'productivite', 'systeme', 'autres');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('acces_bloque', 'fin_quota', 'defi_reussi', 'defi_echoue', 'appareil_hors_ligne', 'appareil_appaire', 'demande_temps', 'reponse_demande', 'badge_debloque', 'resume_quotidien', 'resume_hebdomadaire', 'systeme');

-- CreateEnum
CREATE TYPE "NiveauNotification" AS ENUM ('critique', 'attention', 'info');

-- CreateEnum
CREATE TYPE "StatutEnvoi" AS ENUM ('en_attente', 'envoye', 'delivre', 'echec');

-- CreateEnum
CREATE TYPE "StatutDemandeTemps" AS ENUM ('en_attente', 'acceptee', 'refusee');

-- CreateEnum
CREATE TYPE "TypeBadge" AS ENUM ('lecteur', 'defis_champion', 'precis', 'ponctuel', 'curieux', 'matinal', 'marathon', 'artistique', 'scientifique');

-- CreateEnum
CREATE TYPE "TypeContenuIa" AS ENUM ('app', 'video', 'livre', 'defi');

-- CreateEnum
CREATE TYPE "StatutRecommandation" AS ENUM ('suggeree', 'acceptee', 'refusee', 'signalee');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'parent',
    "statut" "StatutCompte" NOT NULL DEFAULT 'actif',
    "prenom" TEXT,
    "nom" TEXT,
    "telephone" TEXT,
    "avatarUrl" TEXT,
    "plan" "PlanAbonnement" NOT NULL DEFAULT 'gratuit',
    "langue" "Langue" NOT NULL DEFAULT 'fr',
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "codeVerificationEmail" TEXT,
    "dateCreationCodeVerif" TIMESTAMP(3),
    "codeReinitialisationMdp" TEXT,
    "dateCreationCodeReinit" TIMESTAMP(3),
    "tentativesEchouees" INTEGER NOT NULL DEFAULT 0,
    "dateVerrouillage" TIMESTAMP(3),
    "derniereConnexion" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,
    "dateSuppression" TIMESTAMP(3),

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteOAuth" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "provider" "ProviderOAuth" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "emailFournisseur" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompteOAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueConnexion" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "dateConnexion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueConnexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilAdmin" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "twoFactorActif" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "droits" JSONB,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilEnfant" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "niveauScolaire" "NiveauScolaire" NOT NULL,
    "avatarId" INTEGER NOT NULL DEFAULT 0,
    "couleurTheme" TEXT NOT NULL DEFAULT '#4C6971',
    "pinEnfant" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilEnfant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appareil" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "nomAffichage" TEXT NOT NULL,
    "plateforme" "Plateforme" NOT NULL,
    "modele" TEXT,
    "versionOs" TEXT,
    "versionApp" TEXT,
    "tokenPush" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereSync" TIMESTAMP(3),
    "dateAppairage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codeAppairage" TEXT,
    "dateCodeAppairage" TIMESTAMP(3),
    "modeSupervise" BOOLEAN NOT NULL DEFAULT false,
    "vpnActif" BOOLEAN NOT NULL DEFAULT false,
    "permissionStore" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Appareil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegleTempsEcran" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "jourSemaine" "JourSemaine" NOT NULL,
    "minutesMatin" INTEGER NOT NULL DEFAULT 0,
    "minutesApresMidi" INTEGER NOT NULL DEFAULT 0,
    "minutesSoir" INTEGER NOT NULL DEFAULT 0,
    "modeNuitActif" BOOLEAN NOT NULL DEFAULT true,
    "modeNuitDebut" TEXT NOT NULL DEFAULT '21:00',
    "modeNuitFin" TEXT NOT NULL DEFAULT '07:00',
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegleTempsEcran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjoutTempsEcran" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "raison" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjoutTempsEcran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defi" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "matiere" "Matiere" NOT NULL,
    "niveauxScolaires" "NiveauScolaire"[],
    "difficulte" INTEGER NOT NULL DEFAULT 1,
    "nombreQuestions" INTEGER NOT NULL DEFAULT 5,
    "seuilReussite" INTEGER NOT NULL DEFAULT 70,
    "tempsRecompense" INTEGER NOT NULL DEFAULT 15,
    "statut" "StatutDefi" NOT NULL DEFAULT 'brouillon',
    "createParId" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionDefi" (
    "id" TEXT NOT NULL,
    "defiId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "enonce" TEXT NOT NULL,
    "type" "TypeQuestion" NOT NULL DEFAULT 'qcm',
    "options" JSONB,
    "reponse" TEXT NOT NULL,
    "explication" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "QuestionDefi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeDefi" (
    "id" TEXT NOT NULL,
    "defiId" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reussi" BOOLEAN NOT NULL,
    "tempsCredite" INTEGER NOT NULL DEFAULT 0,
    "reponses" JSONB,
    "dureeSeconds" INTEGER,
    "dateTentative" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativeDefi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiltreContenu" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "niveau" "NiveauFiltre" NOT NULL DEFAULT 'modere',
    "categoriesBloquees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whitelistUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklistUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safeSearch" BOOLEAN NOT NULL DEFAULT true,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiltreContenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegleApp" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "nomApp" TEXT NOT NULL,
    "categorie" "CategorieApp" NOT NULL DEFAULT 'autres',
    "autorisee" BOOLEAN NOT NULL DEFAULT true,
    "limiteQuotidienne" INTEGER,
    "plagesHoraires" JSONB,

    CONSTRAINT "RegleApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageApp" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "nomApp" TEXT NOT NULL,
    "categorie" "CategorieApp" NOT NULL DEFAULT 'autres',
    "dureeSeconds" INTEGER NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisiteWeb" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "nombreVisites" INTEGER NOT NULL DEFAULT 1,
    "dureeSeconds" INTEGER NOT NULL DEFAULT 0,
    "derniereVisite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloque" BOOLEAN NOT NULL DEFAULT false,
    "jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisiteWeb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "profilEnfantId" TEXT,
    "type" "TypeNotification" NOT NULL,
    "niveau" "NiveauNotification" NOT NULL DEFAULT 'info',
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "donnees" JSONB,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "dateLecture" TIMESTAMP(3),
    "statut" "StatutEnvoi" NOT NULL DEFAULT 'en_attente',
    "datePlanifiee" TIMESTAMP(3),
    "dateEnvoi" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceNotification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "canalPush" BOOLEAN NOT NULL DEFAULT true,
    "canalEmail" BOOLEAN NOT NULL DEFAULT false,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppareilPush" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "plateforme" "Plateforme" NOT NULL,
    "langue" "Langue",
    "derniereUtilisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppareilPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeTemps" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "message" TEXT,
    "statut" "StatutDemandeTemps" NOT NULL DEFAULT 'en_attente',
    "reponseParent" TEXT,
    "dateReponse" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeTemps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "typeBadge" "TypeBadge" NOT NULL,
    "dateObtention" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommandationIa" (
    "id" TEXT NOT NULL,
    "profilEnfantId" TEXT NOT NULL,
    "typeContenu" "TypeContenuIa" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "urlContenu" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "statut" "StatutRecommandation" NOT NULL DEFAULT 'suggeree',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommandationIa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "Utilisateur_role_idx" ON "Utilisateur"("role");

-- CreateIndex
CREATE INDEX "Utilisateur_statut_idx" ON "Utilisateur"("statut");

-- CreateIndex
CREATE INDEX "CompteOAuth_utilisateurId_idx" ON "CompteOAuth"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteOAuth_provider_providerUserId_key" ON "CompteOAuth"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "HistoriqueConnexion_utilisateurId_idx" ON "HistoriqueConnexion"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilAdmin_utilisateurId_key" ON "ProfilAdmin"("utilisateurId");

-- CreateIndex
CREATE INDEX "ProfilEnfant_parentId_idx" ON "ProfilEnfant"("parentId");

-- CreateIndex
CREATE INDEX "Appareil_profilEnfantId_idx" ON "Appareil"("profilEnfantId");

-- CreateIndex
CREATE UNIQUE INDEX "Appareil_codeAppairage_key" ON "Appareil"("codeAppairage");

-- CreateIndex
CREATE INDEX "RegleTempsEcran_profilEnfantId_idx" ON "RegleTempsEcran"("profilEnfantId");

-- CreateIndex
CREATE UNIQUE INDEX "RegleTempsEcran_profilEnfantId_jourSemaine_key" ON "RegleTempsEcran"("profilEnfantId", "jourSemaine");

-- CreateIndex
CREATE INDEX "AjoutTempsEcran_profilEnfantId_dateAjout_idx" ON "AjoutTempsEcran"("profilEnfantId", "dateAjout");

-- CreateIndex
CREATE INDEX "Defi_statut_idx" ON "Defi"("statut");

-- CreateIndex
CREATE INDEX "Defi_matiere_idx" ON "Defi"("matiere");

-- CreateIndex
CREATE INDEX "QuestionDefi_defiId_idx" ON "QuestionDefi"("defiId");

-- CreateIndex
CREATE INDEX "TentativeDefi_profilEnfantId_dateTentative_idx" ON "TentativeDefi"("profilEnfantId", "dateTentative");

-- CreateIndex
CREATE INDEX "TentativeDefi_defiId_idx" ON "TentativeDefi"("defiId");

-- CreateIndex
CREATE UNIQUE INDEX "FiltreContenu_profilEnfantId_key" ON "FiltreContenu"("profilEnfantId");

-- CreateIndex
CREATE INDEX "RegleApp_profilEnfantId_idx" ON "RegleApp"("profilEnfantId");

-- CreateIndex
CREATE UNIQUE INDEX "RegleApp_profilEnfantId_bundleId_key" ON "RegleApp"("profilEnfantId", "bundleId");

-- CreateIndex
CREATE INDEX "UsageApp_profilEnfantId_jour_idx" ON "UsageApp"("profilEnfantId", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "UsageApp_profilEnfantId_bundleId_jour_key" ON "UsageApp"("profilEnfantId", "bundleId", "jour");

-- CreateIndex
CREATE INDEX "VisiteWeb_profilEnfantId_jour_idx" ON "VisiteWeb"("profilEnfantId", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "VisiteWeb_profilEnfantId_domaine_jour_key" ON "VisiteWeb"("profilEnfantId", "domaine", "jour");

-- CreateIndex
CREATE INDEX "Notification_utilisateurId_dateCreation_idx" ON "Notification"("utilisateurId", "dateCreation");

-- CreateIndex
CREATE INDEX "Notification_profilEnfantId_idx" ON "Notification"("profilEnfantId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceNotification_utilisateurId_type_key" ON "PreferenceNotification"("utilisateurId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AppareilPush_token_key" ON "AppareilPush"("token");

-- CreateIndex
CREATE INDEX "AppareilPush_utilisateurId_idx" ON "AppareilPush"("utilisateurId");

-- CreateIndex
CREATE INDEX "DemandeTemps_profilEnfantId_statut_idx" ON "DemandeTemps"("profilEnfantId", "statut");

-- CreateIndex
CREATE INDEX "Badge_profilEnfantId_idx" ON "Badge"("profilEnfantId");

-- CreateIndex
CREATE INDEX "RecommandationIa_profilEnfantId_statut_idx" ON "RecommandationIa"("profilEnfantId", "statut");

-- AddForeignKey
ALTER TABLE "CompteOAuth" ADD CONSTRAINT "CompteOAuth_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueConnexion" ADD CONSTRAINT "HistoriqueConnexion_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilAdmin" ADD CONSTRAINT "ProfilAdmin_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilEnfant" ADD CONSTRAINT "ProfilEnfant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appareil" ADD CONSTRAINT "Appareil_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegleTempsEcran" ADD CONSTRAINT "RegleTempsEcran_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDefi" ADD CONSTRAINT "QuestionDefi_defiId_fkey" FOREIGN KEY ("defiId") REFERENCES "Defi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeDefi" ADD CONSTRAINT "TentativeDefi_defiId_fkey" FOREIGN KEY ("defiId") REFERENCES "Defi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativeDefi" ADD CONSTRAINT "TentativeDefi_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiltreContenu" ADD CONSTRAINT "FiltreContenu_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageApp" ADD CONSTRAINT "UsageApp_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisiteWeb" ADD CONSTRAINT "VisiteWeb_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceNotification" ADD CONSTRAINT "PreferenceNotification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppareilPush" ADD CONSTRAINT "AppareilPush_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeTemps" ADD CONSTRAINT "DemandeTemps_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommandationIa" ADD CONSTRAINT "RecommandationIa_profilEnfantId_fkey" FOREIGN KEY ("profilEnfantId") REFERENCES "ProfilEnfant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
