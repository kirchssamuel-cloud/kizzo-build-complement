export type ProfilEnfantPaired = {
  id: string;
  prenom: string;
  avatarId: number;
  couleurTheme: string;
  niveauScolaire: string;
};

export type SessionEnfant = {
  token: string;
  appareilId: string;
  profilEnfant: ProfilEnfantPaired;
};

export type HomeState = {
  profilEnfant: ProfilEnfantPaired;
  tempsUtiliseSeconds: number;
  nombreBadges: number;
  nombreDefisAujourdhui: number;
};
