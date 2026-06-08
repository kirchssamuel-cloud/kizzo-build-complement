// Types Lot C — contrôles parentaux (filtrage web, apps, profil/RGPD, rapports).

export type NiveauFiltre = 'strict' | 'modere' | 'personnalise';

export type FiltreContenu = {
  profilEnfantId: string;
  niveau: NiveauFiltre;
  categoriesBloquees: string[];
  whitelistUrls: string[];
  blacklistUrls: string[];
  safeSearch: boolean;
};

export type CategorieApp =
  | 'jeux'
  | 'reseaux_sociaux'
  | 'education'
  | 'communication'
  | 'divertissement'
  | 'productivite'
  | 'systeme'
  | 'autres';

export type RegleApp = {
  id: string;
  profilEnfantId: string;
  bundleId: string;
  nomApp: string;
  categorie: CategorieApp;
  autorisee: boolean;
  limiteQuotidienne: number | null;
  plagesHoraires: unknown | null;
};

export type PlanAbonnement = 'gratuit' | 'famille' | 'famille_plus';

export type ProfilParent = {
  id: string;
  email: string;
  role: string;
  statut: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  avatarUrl: string | null;
  plan: PlanAbonnement;
  langue: 'fr' | 'en';
  emailVerifie: boolean;
  dateCreation: string;
};

export type UsageAppItem = {
  id: string;
  bundleId: string;
  nomApp: string;
  categorie: CategorieApp;
  dureeSeconds: number;
  jour: string;
};

export type VisiteWebItem = {
  id: string;
  domaine: string;
  nombreVisites: number;
  dureeSeconds: number;
  bloque: boolean;
  jour: string;
};

export type TentativeItem = {
  id: string;
  score: number;
  reussi: boolean;
  tempsCredite: number;
  dateTentative: string;
};

export type RapportActivite = {
  periode: { depuis: string; jours: number };
  ecran: { totalSeconds: number; apps: UsageAppItem[] };
  web: { totalVisites: number; visitesBloquees: number; domaines: VisiteWebItem[] };
  quiz: {
    total: number;
    reussis: number;
    scoreMoyen: number;
    tempsGagneSeconds: number;
    tentatives: TentativeItem[];
  };
};

// ── Horaires & quota (P14-P15) ───────────────────────────────────────────────
export type JourSemaine =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche';

export type RegleTempsEcran = {
  id: string;
  profilEnfantId: string;
  jourSemaine: JourSemaine;
  minutesMatin: number;
  minutesApresMidi: number;
  minutesSoir: number;
  modeNuitActif: boolean;
  modeNuitDebut: string; // HH:mm
  modeNuitFin: string; // HH:mm
};

export type UsageAujourdhui = {
  jour: string;
  totalSeconds: number;
  apps: UsageAppItem[];
};

// ── Demandes de temps (P13 / E20-E23) ───────────────────────────────────────
export type StatutDemandeTemps = 'en_attente' | 'acceptee' | 'refusee';

export type DemandeTemps = {
  id: string;
  profilEnfantId: string;
  minutes: number;
  message: string | null;
  statut: StatutDemandeTemps;
  reponseParent: string | null;
  dateReponse: string | null;
  dateCreation: string;
  profilEnfant?: { id: string; prenom: string; avatarId: number };
};

// ── État appareil (heartbeat) ────────────────────────────────────────────────
export type PlateformeAppareil = 'ios' | 'android' | 'tablette';

export type EtatAppareil = {
  id: string;
  profilEnfantId: string;
  nomAffichage: string;
  plateforme: PlateformeAppareil;
  modele: string | null;
  versionOs: string | null;
  versionApp: string | null;
  actif: boolean;
  derniereSync: string | null;
  dateAppairage: string;
  modeSupervise: boolean;
  vpnActif: boolean;
  permissionStore: boolean;
};

// ── Préférences de notification (P34) ────────────────────────────────────────
export type TypeNotification =
  | 'acces_bloque'
  | 'fin_quota'
  | 'defi_reussi'
  | 'defi_echoue'
  | 'appareil_hors_ligne'
  | 'appareil_appaire'
  | 'demande_temps'
  | 'reponse_demande'
  | 'badge_debloque'
  | 'resume_quotidien'
  | 'resume_hebdomadaire'
  | 'systeme';

export type PreferenceNotification = {
  type: TypeNotification;
  canalPush: boolean;
  canalEmail: boolean;
};

export type NiveauNotification = 'info' | 'succes' | 'alerte' | 'critique';

export type NotificationItem = {
  id: string;
  type: TypeNotification;
  niveau: NiveauNotification;
  titre: string;
  corps: string;
  lue: boolean;
  dateCreation: string;
  dateLecture: string | null;
};

export type NotificationsPage = {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
