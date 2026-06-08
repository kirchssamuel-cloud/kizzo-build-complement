# Lot C — Écrans contrôles parentaux (overlay app PARENT)

Overlay **additif** sur `kizzo-parent-app` de l'agence. Écrans qui branchent l'app parent
sur les nouveaux endpoints backend Lot C (`quiz-ia/kizzo-api/src/modules-parent/`).
Objectif : **relier app parent ↔ téléphone enfant** (filtrage, apps, rapports, demandes de
temps, préférences de notif, RGPD).

Une copie intégrée + typecheckée (tsc vert) existe dans `quiz-ia/parent-app-work/`.

## Fichiers ajoutés (additifs, aucun conflit)
- `src/types/controls.ts` — types (FiltreContenu, RegleApp, ProfilParent, RapportActivite,
  DemandeTemps, EtatAppareil, PreferenceNotification…)
- `src/services/api/controls.ts` — clients axios : `webFilterApi`, `appsApi`, `profileApi`,
  `activityApi`, `unlockRequestsApi`, `deviceStateApi`, `notifPrefsApi`, `rgpdApi`
- `src/hooks/controls.ts` — hooks react-query + `controlKeys` (clés additives, ne touche pas à `qk`)
- `src/screens/controls/WebFilterScreen.tsx` — **P21-23** filtrage web (niveau, SafeSearch, black/whitelist)
- `src/screens/controls/AppsScreen.tsx` — **P19-20** gestion des apps (autoriser/bloquer, limite, supprimer)
- `src/screens/controls/ActivityReportScreen.tsx` — **P26-31** rapport d'activité (écran/quiz/web, périodes 1/7/30 j)
- `src/screens/controls/AccountScreen.tsx` — **P35** profil parent + **export RGPD (JSON, Share)** + suppression compte RGPD (mot de passe + « SUPPRIMER »)
- `src/screens/controls/UnlockRequestsScreen.tsx` — **P13** demandes de temps enfant (accorder/refuser, +minutes)
- `src/screens/controls/NotificationPreferencesScreen.tsx` — **P34** préférences notif (12 types × push/email, Switch)

## Modifications reportées dans les fichiers existants (incluses ici)
1. `src/navigation/types.ts` — `AppStackParamList` enrichi :
   ```ts
   WebFilter: { childId: string };
   Apps: { childId: string };
   ActivityReport: { childId: string };
   Account: undefined;
   UnlockRequests: { childId?: string } | undefined;
   NotificationPreferences: undefined;
   ```
2. `src/navigation/AppStack.tsx` — importe + enregistre tous les `Stack.Screen` ci-dessus.
3. `src/screens/enfants/EnfantDetailScreen.tsx` — section **« Contrôles parentaux »** :
   4 cards d'entrée → `WebFilter`, `Apps`, `ActivityReport`, `UnlockRequests`
   (toutes passées avec `{ childId: route.params.id }`).
4. `src/screens/reglages/ReglagesScreen.tsx` — menu câblé :
   « Mon compte » / « Abonnement » / « Confidentialité (RGPD) » → `Account`,
   « Notifications » → `NotificationPreferences`.

## Endpoints consommés (backend Lot C)
- `GET/PUT /api/parent/web-filter/:childId`
- `GET/PUT /api/parent/apps/:childId`, `DELETE /api/parent/apps/:childId/:bundleId`
- `GET/PUT /api/parent/profile`, `DELETE /api/parent/account`
- `GET /api/parent/account/export` — **portabilité RGPD (JSON)**
- `GET /api/parent/activity/:childId/report?jours=7`
- `GET /api/parent/unlock-requests`, `POST /api/parent/unlock-requests/:demandeId/respond`
- `GET /api/parent/device-state/:childId` (état appareil) — alimenté par `PUT /api/device-state` (heartbeat enfant)
- `GET/PUT /api/parent/notifications/preferences`

Tokens Tailwind utilisés = système **courant** (`kz-ink`, `kz-ink-soft`, `kz-ink-muted`,
`kz-surface`, `kz-surface-soft`, `kz-cyan`, `kz-orange`, `kz-green`, `kz-red`, `kz-white`).
