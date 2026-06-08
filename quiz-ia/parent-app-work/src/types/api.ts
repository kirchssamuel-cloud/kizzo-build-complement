import type { NiveauScolaire } from './auth';

export type ProfilEnfant = {
  id: string;
  parentId: string;
  prenom: string;
  dateNaissance: string;
  niveauScolaire: NiveauScolaire;
  avatarId: number;
  couleurTheme: string;
  age?: number;
  appareils?: Appareil[];
};

export type Appareil = {
  id: string;
  profilEnfantId: string;
  nomAffichage: string;
  plateforme: 'ios' | 'android' | 'tablette';
  modele: string | null;
  versionOs: string | null;
  versionApp: string | null;
  actif: boolean;
  derniereSync: string | null;
};

export type PairingCode = {
  appareilId: string;
  code: string;
  expireDansMs: number;
};

export type RegleTempsEcran = {
  id: string;
  profilEnfantId: string;
  jourSemaine:
    | 'lundi'
    | 'mardi'
    | 'mercredi'
    | 'jeudi'
    | 'vendredi'
    | 'samedi'
    | 'dimanche';
  minutesMatin: number;
  minutesApresMidi: number;
  minutesSoir: number;
  modeNuitActif: boolean;
  modeNuitDebut: string;
  modeNuitFin: string;
};

export type Notification = {
  id: string;
  type: string;
  niveau: 'critique' | 'attention' | 'info';
  titre: string;
  corps: string;
  donnees: Record<string, unknown> | null;
  lue: boolean;
  dateCreation: string;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
