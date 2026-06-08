export const jourSemaineFr = (date: Date): string => {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return jours[date.getDay()] ?? 'lundi';
};

export const calculerAge = (dateNaissance: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - dateNaissance.getFullYear();
  const m = now.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateNaissance.getDate())) age--;
  return age;
};

export const bucketJour = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
