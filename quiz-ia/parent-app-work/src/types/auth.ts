export type RoleUtilisateur = 'parent' | 'enfant' | 'administrateur';
export type StatutCompte = 'actif' | 'suspendu' | 'supprime';
export type PlanAbonnement = 'gratuit' | 'famille' | 'famille_plus';
export type Langue = 'fr' | 'en';

export type NiveauScolaire =
  | 'maternelle'
  | 'cp'
  | 'ce1'
  | 'ce2'
  | 'cm1'
  | 'cm2'
  | 'sixieme'
  | 'cinquieme'
  | 'quatrieme'
  | 'troisieme'
  | 'seconde'
  | 'premiere'
  | 'terminale';

export type ProfilEnfantSummary = {
  id: string;
  prenom: string;
  avatarId: number;
  couleurTheme: string;
  niveauScolaire: NiveauScolaire;
  dateNaissance: string;
};

export type Utilisateur = {
  id: string;
  email: string;
  role: RoleUtilisateur;
  prenom: string | null;
  nom: string | null;
  avatarUrl: string | null;
  plan: PlanAbonnement;
  langue: Langue;
  statut: StatutCompte;
  emailVerifie: boolean;
  profilsEnfants?: ProfilEnfantSummary[];
};

export type AuthSession = { token: string; utilisateur: Utilisateur };
