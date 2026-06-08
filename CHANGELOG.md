# Changelog — Kizzo build complément (local)

## 2026-06-07 — CHANTIER 4 : guide de déploiement (DEPLOIEMENT.md)
> Documentation de mise en production (aucun code). Couvre tout le chemin
> critique store par store, chaque étape avec **action + lien officiel + temps
> estimé + dépendances**.
- **`DEPLOIEMENT.md`** (racine) — 10 sections : ordre recommandé & chemin
  critique ; domaine `api.kizzo.app` + backend prod (`prisma migrate deploy`,
  HTTPS) ; Resend (SPF/DKIM) ; Firebase/FCM (service account, APNs) ; Stripe Live
  (produits/prix, webhook signé) ; politique de confidentialité & RGPD/mineurs ;
  Apple App Store (Privacy Manifest, EAS, TestFlight) ; Google Play (Data Safety,
  Families, AAB) ; **table complète des variables d'env** (source `env.ts`) ;
  checklist go-live ; rappel des bloqueurs hors code (natif Lot E, intégrité
  appareil, actions manuelles).
- **`quiz-ia/kizzo-api/.env.example`** — complété pour refléter `env.ts` (ajout
  des blocs **Cerveau IA**, **Stripe**, **maintenance** qui manquaient).

## 2026-06-07 — CHANTIER 2 : back-office admin (security-events / devices / pairing-reset / anomalies)
> Complète le back-office (CDC §A) avec 4 modules **protégés admin** (route
> `authenticateToken([administrateur])` + garde contrôleur `ensureAdminScope`).
> Toutes les lectures sont des **vues d'agrégation** sur les sources réelles du
> schéma : pas de nouvelle table, pas de migration. **Aucun `tokenPush` n'est
> jamais exposé** en réponse API (règle sécurité non négociable).
- **`src/modules-admin/admin-scope.ts`** — garde `ensureAdminScope(req)` :
  rejette en 403 si `role != administrateur` (défense en profondeur, revérifiée
  au niveau contrôleur même si la route est déjà gardée).
- **`security-events/`** — `GET /api/admin/security-events` : flux reconstruit à
  partir de `HistoriqueConnexion` (`connexion`) + `Utilisateur.dateVerrouillage`
  (`compte_verrouille`). Filtres `utilisateurId` / `type` / `dateDebut` / `dateFin`,
  pagination. Les anomalies d'intégrité appareil (root/jailbreak) arriveront via
  l'`IntegrityReport` du heartbeat natif (Lot E) — documenté en commentaire.
- **`devices/`** — `GET /api/admin/devices` (filtres `statut` actif/inactif,
  `plateforme`, `parentId`, pagination), `GET /:id`, `PATCH /:id`
  (`desappairer` → coupe l'accès + purge `tokenPush`/code ; `suspendre` ;
  `reactiver`). Le `tokenPush` n'est **jamais sélectionné** vers la réponse : on
  expose seulement le booléen dérivé `tokenPushPresent`.
- **`pairing-reset/`** — `POST /api/admin/users/:id/reset-pairing` : désappaire
  **tous** les appareils des enfants du parent (`actif=false`, purge token + code).
  404 si l'utilisateur est introuvable.
- **`anomalies/`** — `GET /api/admin/anomalies` (filtres `type` / `niveau`,
  pagination) : agrège `heartbeat_absent` (silence > 24 h, critique > 72 h) +
  `compte_verrouille` (critique) + `echec_paiement` (statuts Stripe `past_due`/
  `unpaid`/`incomplete…`) + `integrite_vpn` (filtrage DNS coupé, niveau info).
  Limitation assumée : root/jailbreak indisponibles tant que l'`IntegrityReport`
  n'existe pas.
- **`src/routes/index.ts`** — 4 routers montés (`/admin/security-events`,
  `/admin/devices`, `/admin/anomalies`, + `pairing-reset` sous `/admin/users`).
- **`tests/helpers.ts`** — nouveau `createAdmin()` (provisionne un admin en base
  + signe un JWT, faute d'endpoint de signup admin).
- **20 tests Vitest** (`tests/admin-security.test.ts`) : 401 sans token, 403
  parent non-admin sur chaque module, lectures, filtres (type/plateforme/niveau),
  **non-exposition de `tokenPush`** (liste + détail), `desappairer` qui purge le
  token, 404 sur id/utilisateur inconnu, 400 sur type/action invalides.
- **Vérifs** : `tsc --noEmit` **vert**. Tests verts (en série — la base Postgres
  partagée impose **un seul run vitest à la fois**, cf. avertissement CHANTIER 3).

## 2026-06-07 — CHANTIER 3 : jobs cron de maintenance (planificateur interne)
> Item « Jobs cron » du reste-à-faire (purge logs, déverrouillage comptes,
> réconciliation Stripe). Aucune dépendance externe ni credential : opérations
> Prisma `updateMany`/`deleteMany` idempotentes, planifiées par un `setInterval`
> interne désactivable (`MAINTENANCE_JOBS_ENABLED=false`) pour confier le cron à
> k8s/systemd en prod.
- **`src/lib/jobs/maintenance.ts`** — 5 fonctions pures et idempotentes prenant
  `now: Date` (injectable pour les tests) :
  - `unlockExpiredAccounts` : remet `tentativesEchouees=0` + lève `dateVerrouillage`
    des comptes dont la fenêtre de 15 min (RG-01) est écoulée.
  - `purgeExpiredVerificationCodes` : efface codes email/reset > 1 h (housekeeping).
  - `purgeOldConnectionHistory` : supprime l'historique de connexion > 365 j (RGPD).
  - `purgeOldReadNotifications` : supprime les notifications **lues** > 90 j.
  - `reconcileExpiredSubscriptions` : filet Stripe — repasse en `gratuit` les
    comptes payants dont `abonnementFinPeriode < now` (webhook manqué). **Garde
    `stripeCustomerId`** (réabonnement possible).
  - `runAllMaintenanceJobs` : orchestre les 5 + log Pino d'un récapitulatif chiffré.
- **`src/lib/jobs/scheduler.ts`** — `startMaintenanceScheduler()` / `stop…()`.
  `setInterval` `unref()` gardé par `MAINTENANCE_JOBS_ENABLED !== 'false'` **et**
  `NODE_ENV !== 'test'`. Idempotent (no-op si déjà démarré), 1er passage différé
  5 s, échec d'un passage logué sans faire tomber le serveur.
- **`src/server.ts`** — démarrage **après** `server.listen` (jamais à l'import :
  les tests importent `app`, pas `server`), arrêt propre au shutdown SIGINT/SIGTERM.
- **`src/config/env.ts`** — `MAINTENANCE_JOBS_ENABLED` (défaut `'true'`),
  `MAINTENANCE_INTERVAL_MS` (défaut 24 h).
- **13 tests Vitest** (`tests/maintenance-jobs.test.ts`) : pour chaque job un cas
  « traite » + un cas « ne touche pas » (compte non verrouillé, code récent,
  branche email/reset indépendante, payant valide, payant sans date de fin, déjà
  gratuit) ; `runAll` prouve l'orchestration (déverrouillage réellement compté).
  Assertions par **id** (pas sur compteurs absolus) pour rester robustes sur la
  base partagée sérialisée.
- **Validation sous-agent QA** : verdict OK, 0 bug critique ; scheduler confirmé
  non démarrable en test (importé seulement par `server.ts`) ; 4 trous de tests
  signalés → tous comblés.
- **Vérifs** : `tsc --noEmit` **vert** (backend) ; suite **179 tests verts
  (18 fichiers)** en exécution série (`singleFork`). ⚠️ Ne **jamais** lancer deux
  `vitest run` en parallèle : ils partagent la même base Postgres de test et se
  corrompent mutuellement (vu une fois : 20 faux échecs d'isolation/verrouillage,
  disparus au run série unique).

## 2026-06-07 — CHANTIER 1 : envoi FCM réel (firebase-admin branché)
> Le tuyau push existait (enregistrement des tokens + dispatcher no-op). On branche
> l'**envoi réel** via firebase-admin et on câble les 3 points métier. Décision (avec
> Samuel) : on **n'introduit pas** `src/lib/fcm.ts` — on implémente `deliver()` dans le
> `src/lib/push.ts` déjà livré, et on **garde** la variable `FCM_SERVICE_ACCOUNT_JSON`.
- **`src/lib/push.ts` — envoi réel.** Singleton firebase-admin (`initializeApp` lazy depuis
  `FCM_SERVICE_ACCOUNT_JSON`, app nommée `kizzo-fcm`). `deliver()` : sépare les **tokens FCM
  bruts** des **tokens Expo** (`ExponentPushToken[...]`), envoie via `messaging().sendEachForMulticast`
  (FCM) ou l'API Expo Push (`exp.host`), **purge les tokens invalides** (`UNREGISTERED` /
  `invalid-registration-token` / `invalid-argument` côté FCM, `DeviceNotRegistered` côté Expo) des
  **deux** tables (`AppareilPush` *et* `Appareil.tokenPush`). No-op sûr conservé si la var d'env est
  absente.
- **Nouveau `sendPushToChild(profilEnfantId, payload)`** : cible les appareils **enfants**
  (`Appareil.tokenPush`, `actif`, non null) — l'enfant n'a pas de compte `Utilisateur`, son jeton vit
  sur l'appareil. Pas de gate préférences (push opérationnels toujours délivrés).
- **Gate préférences sur `sendPushToUser`** : `payload.type` → lecture de `PreferenceNotification`
  (clé `utilisateurId_type`) ; si `canalPush=false` → `skipped:'pref_off'`, aucun envoi.
- **3 branchements métier (non bloquants, try/catch + log Pino) :**
  - `devices.service.lockDevice` → `sendPushToChild` (lockNow) vers l'appareil enfant.
  - `unlock-requests.service.respondRequest` (acceptation, **après commit** de la transaction) →
    `sendPushToChild` « Tes parents t'ont accordé X minutes ».
  - `requests.controller.create` (enfant) → `sendPushToUser(parentId, type:'demande_temps')`
    « {prénom} demande du temps ».
- **9 tests Vitest** (`tests/push-delivery.test.ts`, firebase-admin + env mockés, **zéro réseau**) :
  FCM configuré, skip no_tokens, envoi FCM + comptage succès, **purge token UNREGISTERED**, routage
  **Expo**, **pref_off** (demande refusée d'envoi), intégration **lock→enfant**, **accept→enfant**,
  **demande→parent**.
- **Vérifs** : `tsc --noEmit` **vert** (backend) ; suite **146 tests verts (16 fichiers)** (137 + 9).
  Aucun token push exposé en réponse API. Dépendance ajoutée : `firebase-admin@^13.10.0`. Aucune
  nouvelle var d'env (`FCM_SERVICE_ACCOUNT_JSON` déjà dans `.env.example` + `config/env.ts`).

## 2026-06-07 (nuit) — Durcissement : couverture de tests des endpoints fraîchement câblés
> Les écrans Horaires & quota (P14-P15) et Notifications (P33) consomment des endpoints backend
> qui n'avaient **aucun test dédié**. On comble ce trou avant transmission, suivant le workflow
> implémenter → tester → faire valider par sous-agent → corriger les manques.
- **`tests/screen-time.test.ts` (10 tests, P14-P15)** : 401 sans token ; liste vide ; upsert + relecture ; upsert idempotent par (enfant, jour) — pas de doublon ; rejet heure mal formée (400) ; crédit add-time ; usage du jour (totalSeconds + apps) ; **isolation 403 sur GET, PUT, add-time ET usage** ; **404 enfant inexistant (UUID valide)**.
- **`tests/notifications-list.test.ts` (10 tests, P33)** : 401 ; validation pagination (400 si `page=0`) ; page vide ; pagination correcte (total/pageSize/totalPages) ; marquer une notif lue ; tout marquer lu ; supprimer ; **isolation 403 sur read ET delete** ; 404 inexistante. Seed via Prisma direct (pas d'endpoint public de création — notifications produites côté serveur).
- **Revue sous-agent QA** : a relevé 2 manques sécurité réels (404 enfant non testé ; 403 d'isolation seulement sur le GET screen-time) → **corrigés** dans la foulée (ajout des cas PUT/add-time/usage + 404 + delete notif). Manques mineurs (tri non asserté, bornes pagination) jugés non bloquants.
- **Vérifs** : suite backend **137 tests au vert (15 fichiers)**, sérialisée, reproductible.
- **Lot E natif — vérification du scaffolding (sans builder).** Audit : façade JS no-op, 8 stubs Kotlin, **config plugin `withKizzoEnforcement.js`** (manifest généré au prebuild : permissions + services VPN/Accessibility/foreground + receivers DeviceAdmin/Boot) et doc AC-01..14 sont en place et cohérents. Décision assumée : ne pas créer de manifest statique ni de wiring Expo (laissé à l'étape prebuild côté dév Android, pour ne pas casser un futur build). Seule retouche, **TS uniquement** : ajout de `modeAvion: boolean` à `IntegrityReport` (2 copies) → **AC-10** désormais couvert par le contrat ; doc §2 mise à jour ; `tsc` enfant vert.

## 2026-06-07 — Comblement des derniers manques non-natifs (badges, horaires, notifs, feedback quiz)
> Suite directe de l'audit : on traite tout ce qui restait faisable **sans** la couche Kotlin
> native, pour que le dossier transmis à l'agence ne contienne plus que du natif.
- **Badges enfant (E30) — endpoint réel + écran branché.**
  - Backend : nouveau module `modules-enfant/badges` (`badges.controller.ts` + `badges.route.ts`), monté sur `GET /api/enfant/badges`. Renvoie le **catalogue serveur de 9 badges** annoté `acquis`/`dateObtention` (source de vérité côté backend, chaque type compté une seule fois). Auth `[enfant, parent]` + header `X-Kizzo-Appareil-Id` (mêmes gardes 400/404/403 que `/home`). Aucune fuite d'id interne.
  - App enfant : `services/api/badges.ts` + `hooks/badges.ts` + `BadgesScreen.tsx` câblé sur les vraies données (était une liste statique de 6 placeholders).
  - **6 tests** `tests/badges.test.ts` (401 sans token, 400 sans header, catalogue complet, badge acquis + date, dédoublonnage par type, isolation 403).
- **Quiz enfant — feedback par question E16/E17/E19 (dans la contrainte anti-triche).**
  - Backend `quiz.service.ts` : `submitQuiz` renvoie désormais `resultats[]` (`{questionId, ordre, estCorrecte}`) — **sans jamais exposer la bonne réponse**. Couvert par 2 nouvelles assertions dans `tests/quiz.test.ts`.
  - App enfant `QuizPlayScreen.tsx` : récap visuel ✓/✗ par question sur l'écran Résultat + **gestion d'erreur générique E24-E29** (Alert si l'envoi échoue, l'enfant peut réessayer).
- **App parent — écran Horaires & quota (P14-P15).** `ScreenTimeScreen.tsx` (steppers matin/après-midi/soir par jour, mode nuit + plage horaire) câblé sur l'endpoint backend existant `GET/PUT /parent/screen-time/:childId` via `screenTimeApi` + hooks `useScreenTimeRules/Usage/UpsertRule`. Ajouté à `AppStack` + entrée dans `EnfantDetail`.
- **App parent — Notifications réelles (P33).** `NotificationsScreen.tsx` branché sur `GET /parent/notifications` (liste paginée, marquer lu / tout lu / supprimer) via `notificationsApi` + hooks — était une coquille statique.
- **Vérifs** : suite backend **117 tests au vert (13 fichiers)** ; `tsc --noEmit` vert sur app parent **et** app enfant ; revue qualité par un sous-agent relecteur (anti-triche OK, contrats front/back conformes, conventions respectées) — 2 points soulevés, le point réel (gestion d'erreur submit) corrigé, l'autre (garde `profilEnfant` null) écarté car la relation Prisma est non-nullable.

## 2026-06-07 — Audit câblage écrans/boutons + corrections de navigation (bugs critiques)
> Audit complet par 2 sous-agents (lecture seule) du câblage navigation des 2 apps, avant
> transmission à l'agence. Constat : les écrans sont codés et de bonne qualité, mais plusieurs
> étaient **inaccessibles** (orphelins) à cause de bugs de navigation. Corrigés ici.
- **App PARENT — bug critique navigation (`parent-app-work/src/navigation/AppTabs.tsx`).**
  - Les 4 onglets principaux (Dashboard, Enfants, Activités, Réglages) étaient tous câblés sur un `EmptyScreen` vide → **après connexion l'app était inutilisable** et les 12 écrans du stack (EnfantDetail, WebFilter, Apps, ActivityReport, UnlockRequests, Account, Abonnement, NotificationPreferences…) étaient inatteignables. **Corrigé** : câblage des 4 vrais composants (déjà importés), suppression de `EmptyScreen` + imports morts.
  - `DashboardScreen.tsx` : boutons « +15 min » → `UnlockRequests{childId}`, « Bloquer » → `EnfantDetail`, « Voir tout » → onglet Activités (étaient inertes).
  - `RapportsScreen.tsx` (onglet « Activités ») : remplacé le placeholder « bientôt disponible » par la **liste réelle des enfants** → accès au rapport d'activité par enfant (`ActivityReport`).
- **App ENFANT — bug critique : parcours quiz IA débranché.**
  - `HomeScreen.tsx` : « Lancer un quiz » pointait vers l'ancien écran `Defis` (rendu dégradé) → **re-câblé vers `QuizStart`** (parcours IA E09-E19, 6 types). Ajout de points d'entrée vers **Badges**, **Historique** (`QuizHistory`) et **Mon activité** (`Activity`) qui étaient orphelins.
  - `LockedScreen.tsx` : « Faire un quiz » → `QuizStart` (au lieu de `Defis`). Bouton mort **« Demander du temps »** désormais fonctionnel : nouveau service `services/api/requests.ts` → `POST /enfant/requests` (E20-E23, paliers 15/30/60 min, notifie le parent), avec confirmation et état `isPending`.
- **Vérifs** : `tsc --noEmit` vert sur app parent + app enfant après corrections ; suite backend inchangée (aucune modif serveur, seulement consommation d'un endpoint existant).
- **Reste honnêtement signalé (non corrigé ici)** : écrans CDC parent P14-P15 (planification horaire / quota fragmenté) + définition du quota quotidien = **absents** ; NotificationsScreen parent = coquille statique ; boutons mineurs sans action (Google login, Sécurité PIN/biométrie, Aide & support) ; côté enfant : feedback par question E16/E17, écrans d'erreur dédiés E24-E29, déverrouillage par code parental (dépend du verrou natif), SORT en sélection numérotée (pas drag&drop), Badges en données statiques. Détail dans le rapport de revue.

## 2026-06-07 — Run autonome (suite) : enforcement câblé + FCM + matrice AC
> Objectif : maximiser ce qui est faisable sans toolchain Android/Firebase, pour que le dossier
> soit prêt à transmettre à l'agence et qu'il ne leur reste que la couche Kotlin native.
- **Chantier 1 — Façade enforcement câblée dans l'écran verrouillé enfant.**
  - `enfant-app-work/src/screens/home/LockedScreen.tsx` : `useFocusEffect` → `enforcement.lockNow(message)` à l'affichage du verrou, `enforcement.unlock()` à la sortie (quiz lancé / temps regagné / code parental). Message d'overlay système contextualisé selon `raison` (quota / nuit / parent). **Repli no-op sûr** conservé (l'UI RN reste l'écran de secours sans natif). Une seule copie de `LockedScreen` dans le repo (pas d'overlay à mirrorer). **`tsc --noEmit` vert** (app enfant).
- **Chantier 2 — Scaffolding notifications push (FCM), tuyau complet sans Firebase.**
  - **Backend** — nouveau module `quiz-ia/kizzo-api/src/modules-parent/push-tokens/` : `POST /api/parent/push-tokens` (upsert `AppareilPush` sur token unique, réaffecte au parent courant), `GET /api/parent/push-tokens` (liste), `POST /api/parent/push-tokens/unregister` (idempotent, **scoping strict `utilisateurId`** — un parent ne peut pas supprimer le token d'un autre). Désenregistrement par **body** (et non param d'URL) car les tokens FCM/Expo contiennent `:` `[` `]`. Réponses sans `id`/`utilisateurId` (pas de fuite).
  - **Dispatcher serveur-only** `src/lib/push.ts` : `sendPushToUser(userId, payload)` + `pushConfigured()`. **No-op sûr** (zéro réseau) tant que `FCM_SERVICE_ACCOUNT_JSON` est absent → retourne `skipped: 'not_configured'`. Reste à brancher = **une seule fonction `deliver`** (firebase-admin `sendEachForMulticast`) + le projet Firebase. Credentials FCM **strictement serveur**.
  - **Client app parent** (`parent-app-work/` + overlay `kizzo-parent-app/`) : `services/api/push.ts` (`pushApi.list/register/unregister`) + `hooks/push.ts` (`registerPushToken` via `Notifications.getDevicePushTokenAsync` — token natif brut, **pas besoin de projectId EAS** ; échec silencieux non bloquant ; `useRegisterPushToken`/`useUnregisterPushToken`).
  - **10 tests Vitest verts** (`tests/push-tokens.test.ts`) : 401, register 201 sans fuite d'id, upsert sans doublon, multi-appareils, unregister idempotent, **isolation inter-parents**, plateforme inconnue 400, token vide 400, dispatcher `not_configured` (zéro réseau). **Total suite : 111 tests verts** (12 fichiers), `tsc --noEmit` vert sur backend + app parent.
  - **Validé par sous-agent revue backend/sécurité** (verdict **OK avec réserves, 0 bloquant**) : isolation OK, aucun credential côté client, no-op sûr, choix POST/unregister justifié. Réserve traitée : nettoyage du placeholder `deliver`. Réserves restantes (non bloquantes, dépendent de l'envoi réel) : purge des tokens dormants + gestion `UNREGISTERED` → à faire au branchement firebase-admin.
- **Chantier 4 — Matrice CDC + critères AC-01..14 (anti-contournement §20.3).**
  - **Source autoritative trouvée** : les libellés **AC-05 à AC-13** ne sont plus « à deviner » — ils sont **recopiés du code natif réel de l'agence** (`kizzo-agence-readonly/kizzo-app-poc/.../AntiBypassModule.kt`, `runFullSecurityScan()`) : AC-05 VPN non actif, AC-06 VPN tiers, AC-07 accessibilité off, AC-08 overlay révoqué, AC-09 usage stats révoqué, AC-10 mode avion, AC-11 mode dev, AC-12 root, AC-13 service premier plan arrêté.
  - `LOT_E_NATIF_ANTICONTOURNEMENT.md` §2 : table AC-01..14 complète (AC↔libellé↔source↔composant Lot E↔signal `IntegrityReport`). **AC-01..04 + AC-14** non présents dans le code agence → marqués **« à recopier du CDC PDF §20.3 »** (PDF absent de la machine de build) avec hypothèses explicitement indicatives. Note : ajouter `modeAvion` à `IntegrityReport` pour couvrir AC-10.
  - `MATRICE_CDC_CODE.md` : §5 pointe vers la table AC vérifiée ; §8 « Avancement » remis à jour (Lot C ✅, Lot D ✅, FCM tuyau ✅, enforcement câblé ✅, 111 tests, Lot E Kotlin réel = agence).

## 2026-06-05 — Run autonome 24h
- **Sprint 8 — Lot E : scaffolding couche native Android anti-contournement (No-Go stores §20.3, SANS build).**
  - ⚠️ **Scaffolding uniquement** : la toolchain Android est absente et cette couche exige un `expo prebuild` (sortie du managed). Aucun Kotlin compilé — on fige le **contrat + structure + cadrage** pour réduire l'ambiguïté du devis agence. Tout en local (`enfant-app-work/` + overlay `kizzo-enfant-app/`).
  - **Façade TS** `src/native/enforcement.ts` : contrat typé (`lockNow`/`unlock`/`setBlockedApps`/`setDnsBlocklist`/`startHeartbeat`/`stopHeartbeat`/`getPermissionStatus`/`requestPermission`/`getIntegrityReport`) + **repli no-op sûr** quand le module natif est absent (iOS/Expo Go/sans plugin) → l'app ne crashe jamais. **tsc vert.**
  - **Config plugin Expo** `plugins/withKizzoEnforcement.js` (syntaxe `node --check` OK) : injecte au prebuild les permissions + déclare les 8 composants dans l'AndroidManifest (AccessibilityService, VpnService, foreground specialUse, DeviceAdminReceiver, BootReceiver, overlay, usage stats).
  - **8 stubs Kotlin** (+ bridge `KizzoEnforcementModule`) `modules/kizzo-enforcement/android/.../*.kt` : `KizzoAccessibilityService` (blocage app 1er plan), `KizzoVpnDnsService` (filtrage DNS local + SafeSearch), `UsageStatsCollector` (temps d'écran), `LockscreenOverlay` (verrou), `KizzoDeviceAdminReceiver` (anti-désinstallation), `BootReceiver` (persistance reboot), `HeartbeatForegroundService` (survie + télémétrie), `IntegrityChecker` (root/VPN tiers/mode dev). Chaque stub = contrat + checklist d'implémentation commentée.
  - **Doc maître** `LOT_E_NATIF_ANTICONTOURNEMENT.md` : tableau composant↔API Android↔manifest↔couverture, mapping AC-01..14 (à recouper mot pour mot avec le CDC §20.3), **conformité Play** (politiques Accessibility/VPN, Device Admin déprécié→Device Owner, `QUERY_ALL_PACKAGES`/`PACKAGE_USAGE_STATS` justif), **risque #1 DoH/VPN tiers** assumé, matrice QA appareils physiques §20.2, étapes d'intégration, et lien explicite avec le backend **déjà livré** (device-state, web-filter, apps, lock, unlock-requests) → le natif est le **dernier maillon**, pas un nouveau système.
  - **Validé par sous-agent revue Android** (verdict **OK**, contrats JS↔Kotlin synchronisés, API toutes correctes) ; **3 corrections appliquées** : retrait du faux `uses-permission BIND_VPN_SERVICE` (permission du `<service>`, pas de l'app), ajout `<property PROPERTY_SPECIAL_USE_FGS_SUBTYPE>` (exigé Android 14+ pour le FGS specialUse), note d'implémentation sur les « special access » (routage Réglages : usage access / overlay / accessibility / device admin / VpnService.prepare). Mirroir overlay fait (9 .kt + façade + plugin).
- **Sprint 7 — Durcissement : fiabilisation de la suite de tests (flaky inter-fichiers).**
  - **Diagnostic empirique** : 3 runs de la suite complète → échecs *intermittents et différents* (`device-state.test.ts > liste les appareils` au run 1 ; `unlock-requests.test.ts > isole entre parents` au run 3), tous du type « donnée fraîchement créée renvoie 404/403 » (échec anormalement rapide ~26 ms = donnée tronquée *pendant* le test). Cause racine : le `TRUNCATE … CASCADE` du `beforeEach` global (`tests/setup.ts`) d'un fichier pouvait s'exécuter pendant un test d'un *autre* fichier — `fileParallelism: false` ne suffisait pas à sérialiser les workers sur la base Postgres partagée.
  - **Correctif** : `vitest.config.mts` → `pool: 'forks'` + `poolOptions: { forks: { singleFork: true } }` : tous les fichiers de test s'exécutent dans **un seul process, strictement en série** → plus aucun `TRUNCATE` concurrent.
  - **Validation** : suite complète relancée **5 fois de suite → 11 fichiers / 101 tests verts à chaque run** (0 flaky). Dette test #22 close.
- **Sprint 6 — Lot D : abonnement Stripe (backend + app parent, P33).**
  - **Backend** — nouveau module `quiz-ia/kizzo-api/src/modules-parent/billing/` (schema Zod + service + controller + 2 routers) + `src/lib/stripe.ts` (singleton `getStripe`, **clé secrète serveur only**, 503 si non configuré). Dépendance `stripe@22.2.0`.
    - `POST /api/parent/billing/checkout` (auth parent) : crée/réutilise le client Stripe du parent (persiste `stripeCustomerId`), ouvre une **Checkout Session** `mode: 'subscription'` (plan → priceId via `STRIPE_PRICE_FAMILLE`/`_PLUS`, 503 si tarif absent), métadonnées `{utilisateurId, plan}` propagées à l'abonnement. Renvoie `{url, sessionId}`. Plan `gratuit` refusé (Zod 400).
    - `GET /api/parent/billing/status` (auth parent) : `{plan, statut, finPeriode, actif}`.
    - `POST /api/billing/webhook` (**sans auth**, signature vérifiée) : `checkout.session.completed` → applique le plan acheté + `statutAbonnement=active` + `stripeSubscriptionId` ; `customer.subscription.updated/.deleted` → resynchronise plan/statut/fin de période depuis l'objet Stripe (retour `gratuit` si statut inactif : canceled/unpaid/incomplete_expired/past_due) ; événements non gérés ignorés (200). Idempotent (relit l'état Stripe). Client Stripe inconnu → ignoré sans crash.
    - **Sécurité webhook** : `rawBody` capturé via `express.json({ verify })` (signature calculée sur le corps brut, pas le JSON re-sérialisé) ; signature vérifiée **avant** tout traitement ; 400 sans en-tête `stripe-signature` ou signature invalide ; aucun secret renvoyé en réponse.
    - **Schéma** : 4 champs ajoutés à `Utilisateur` (`stripeCustomerId @unique`, `stripeSubscriptionId`, `statutAbonnement`, `abonnementFinPeriode`) — migration `20260605140000_add_stripe_billing` appliquée à `kizzo_test`.
    - **Astuce TS réutilisable** : stripe@22 (CJS) n'expose pas `Stripe.Event/Subscription/Checkout.Session` via l'import par défaut → types dérivés par *indexed access* sur l'instance (`ReturnType<StripeInstance['webhooks']['constructEvent']>` + `Extract<…,{type:'…'}>['data']['object']`), 100 % type-safe.
    - **12 tests Vitest verts** (`tests/billing.test.ts`, client Stripe entièrement mocké via `vi.hoisted`+`vi.mock`, zéro appel réseau) : 401, checkout crée+persiste le client, réutilise un client existant + bon priceId, plan invalide 400, status `gratuit` par défaut, webhook 400 sans signature, 400 signature invalide, `checkout.session.completed`→famille, `subscription.updated`(active)→famille_plus+finPeriode, `subscription.deleted`→gratuit, type non géré ignoré, client inconnu ignoré. **Total suite : 101 tests verts** (11 fichiers), `tsc --noEmit` **vert**.
    - **Validé par sous-agent test/debug** (verdict **OK**, 0 bloquant) : signature vérifiée avant traitement ✅, rawBody utilisé ✅, client inconnu sans crash ✅, secrets jamais exposés ✅, mapping plan↔priceId symétrique ✅. ⚠️ Constat hors périmètre : `device-state.test.ts` échoue parfois en suite complète (flaky inter-fichiers : isolation/parallélisme de la DB de test) mais passe 10/10 en isolation — à durcir séparément (à corriger lors du sprint durcissement).
  - **App parent (P33)** — overlay `quiz-ia/kizzo-parent-app/` (+ copie tsc-verte `parent-app-work/`) : `services/api/billing.ts` (`billingApi.status/checkout`), `hooks/billing.ts` (`useBillingStatus`, `useCheckout`), écran **`AbonnementScreen.tsx`** (plan actuel + date de renouvellement, 2 offres Famille/Famille+ avec atouts, bouton → `Linking.openURL` de la page Stripe hébergée — **aucune saisie carte dans l'app**). Navigation : route `Abonnement` enregistrée (`types.ts`+`AppStack.tsx`) et entrée « Abonnement » des Réglages re-pointée vers ce nouvel écran (était un placeholder vers `Account`). **`tsc --noEmit` vert.**
- **Sprint 5 — App parent : branchement UI des nouveaux backends (P13/P34/P35 + navigation).** Overlay `quiz-ia/kizzo-parent-app/` (+ copie intégrée tsc-verte `quiz-ia/parent-app-work/`).
  - `types/controls.ts` + `services/api/controls.ts` + `hooks/controls.ts` étendus : `unlockRequestsApi` (list/respond), `deviceStateApi` (list), `notifPrefsApi` (get/update), `rgpdApi` (export) ; hooks react-query `useUnlockRequests`, `useRespondUnlockRequest`, `useDeviceState`, `useNotifPrefs`, `useUpdateNotifPrefs` (+ `controlKeys` additives).
  - **2 nouveaux écrans** : `UnlockRequestsScreen.tsx` (**P13** — liste des demandes de temps en attente, accorder/refuser, +minutes accordées via Toast) et `NotificationPreferencesScreen.tsx` (**P34** — 12 types × canaux push/email en `Switch`, enregistrement groupé).
  - `AccountScreen.tsx` enrichi (**P35**) : bouton **« Exporter mes données (JSON) »** → `rgpdApi.export()` partagé via l'API `Share` de React Native (portabilité RGPD), en plus de la suppression de compte déjà livrée.
  - **Points d'entrée câblés** : `EnfantDetailScreen` reçoit une section **« Contrôles parentaux »** (4 cards → `WebFilter`/`Apps`/`ActivityReport`/`UnlockRequests`, toutes avec `{ childId }`) ; `ReglagesScreen` route son menu (« Mon compte »/« Abonnement »/« Confidentialité (RGPD) » → `Account`, « Notifications » → `NotificationPreferences`).
  - **Verrouillage manuel (P12)** : hook `useLockDevice` (consomme `devicesApi.lock` → `POST /api/parent/devices/lock`, déjà livré agence) ; le bouton « Verrouiller maintenant » d'`EnfantDetailScreen` envoie la commande `lockNow` au 1ᵉʳ appareil (Toast succès/erreur, désactivé sans appareil appairé) ; « + 15 minutes » redirige vers les demandes de temps de l'enfant.
  - Navigation étendue : `AppStackParamList` + `AppStack.tsx` enregistrent `UnlockRequests` et `NotificationPreferences`. **`tsc --noEmit` vert** sur `parent-app-work/`. README overlay mis à jour. (Pas d'exécution runtime : Expo managed, pas de toolchain Android sur la machine.)
- **Sprint 4 — Backend préférences de notification (P34).** Extension du module `notifications/`.
  - `GET /api/parent/notifications/preferences` : liste exhaustive des 12 types `TypeNotification` avec valeurs par défaut (push on / email off) pour les types non encore configurés. `PUT .../preferences` : upsert par type (`$transaction` d'upserts sur la clé `utilisateurId_type`). Routes déclarées avant `/:id` pour éviter le conflit de params.
  - **7 tests Vitest verts** (`tests/notification-preferences.test.ts`) : 401, défauts exhaustifs, upsert+relecture (+ types non modifiés conservent défauts), idempotence (écrasement sans doublon), isolation inter-parents, type inconnu 400, tableau vide 400. **Total suite : 89 tests verts**, tsc vert.
- **Sprint 3 — Backend export RGPD (portabilité, art. 20 / CDC §18).** Ajout au module `profile/` : `GET /api/parent/account/export`.
  - `exportData(parentId)` : instantané structuré (`format: kizzo-export-v1`) = profil parent (PII + préférences notifs) + tous les enfants avec leurs données liées (appareils sans tokenPush, règles temps, filtre, tentatives défis, usages apps, visites web, badges, demandes temps, recommandations IA). **PIN enfant et mot de passe parent jamais exposés.** En-tête `Content-Disposition: attachment`. Isolation stricte par `parentId`.
  - **4 tests Vitest verts** (`tests/rgpd-export.test.ts`) : 401, export profil+2 enfants + en-tête download, masquage PIN/mdp, isolation inter-parents. **Total suite : 82 tests verts**, tsc vert. (Complète la suppression de compte RGPD déjà livrée → droits effacement + portabilité couverts.)
- **Sprint 2 — Backend `unlock-requests` (demandes de temps, côté parent).** Nouveau module `quiz-ia/kizzo-api/src/modules-parent/unlock-requests/`. Pendant parent du `DemandeTemps` que l'enfant crée déjà (P13 / E20-E23).
  - `GET /api/parent/unlock-requests?statut=&childId=` : liste les demandes des enfants du parent (défaut `en_attente`), avec `profilEnfant` (prénom/avatar). Filtre statut + childId, isolation par `profilEnfant.parentId`.
  - `POST /api/parent/unlock-requests/:demandeId/respond` : accepter/refuser. Sur acceptation → crédite le temps (`AjoutTempsEcran`, minutes ré-ajustables) + notifie (file push `reponse_demande`, `profilEnfantId`=enfant). `$transaction` atomique (statut + crédit + notif). 409 si déjà traitée, 403 inter-parents, 404 inconnue.
  - **14 tests Vitest verts** (`tests/unlock-requests.test.ts`) : 401, liste, isolation (liste + `?childId`), filtre `?statut`, accept (statut + **crédit AjoutTempsEcran vérifié en base**), refus (0 crédit + message), minutes ré-ajustées, double-traitement 409, 403 inter-parents, 404, minutes invalides 400. **Total suite : 78 tests verts**, tsc vert.
  - **Validé par sous-agent test/debug** (VALIDÉ, 0 bloquant). Corrigés : validation query via `validateResource`, tests crédit réel + isolation `?childId` ajoutés, commentaire clarifiant que `Notification` = file d'envoi push ciblant l'enfant via `profilEnfantId`.
- **Sprint 1 — Backend `device-state` (heartbeat appareil enfant).** Nouveau module `quiz-ia/kizzo-api/src/modules-parent/device-state/` (schema + service + controller + 2 routers).
  - `PUT /api/device-state` : heartbeat envoyé par l'appareil enfant (auth `[enfant, parent]`, appareil via header `X-Kizzo-Appareil-Id`, ownership `appareil.profilEnfant.parentId === req.userId`). Met à jour `derniereSync`+`actif` et, en partiel, `versionApp/versionOs/modele/tokenPush/vpnActif/modeSupervise/permissionStore`. Heartbeat vide accepté.
  - `GET /api/parent/device-state/:childId` : lecture parent de l'état des appareils (auth `[parent]`, `ensureOwnership`). **`tokenPush` jamais exposé** (select restreint `publicDevice`).
  - **10 tests Vitest verts** (`tests/device-state.test.ts`) : 401, 400 sans header, update+masquage tokenPush, heartbeat vide, 404 appareil inconnu, isolation inter-parents 403 (heartbeat + lecture), liste à jour, childId non-uuid 400. **Total suite : 64 tests verts**, tsc vert.
  - **Validé par sous-agent test/debug** (verdict VALIDÉ, 0 bloquant ; 2 points mineurs de couverture corrigés).

## 2026-06-05
- **Phase 0 — Compréhension du projet.**
  - Clone lecture seule du repo agence dans `~/Kizzo/kizzo-agence-readonly/` (dernier commit 2026-06-02, S3).
  - Exploration exhaustive des 4 dossiers (api, parent-app, enfant-app, app-poc).
  - Vérification croisée brief vs code réel : backend bien plus avancé que le brief (tous endpoints réels, 0 stub `NotImplemented`).
  - Manques réels confirmés : verrouillage natif non intégré (enfant-app = Expo managed sans dossier `android/`), génération IA non branchée au backend, aucun FCM, 0 test.
  - Rédaction de `README.md` (compréhension + plan d'attaque révisé + décisions d'archi à valider).
- **Décision archi S4** : intégration du verrouillage natif via **config plugin Expo** (retenu vs édition manuelle / bare).
- **Backend — filet de tests Vitest (item #1 du plan).**
  - Copie de travail de `kizzo-api` dans `backend-tests/kizzo-api/` (= base du patch).
  - Postgres 15 installé en local (Homebrew) + base `kizzo_test` + `prisma migrate deploy`.
  - Ajout config Vitest + setup d'isolation + helpers supertest.
  - **30 tests d'intégration verts** (auth 15, enfants 7 dont isolation inter-parents, défis 6, health/404 2) contre une vraie base Postgres.
  - Doc d'intégration : `backend-tests/README.md`.
- **Lot A — Module Quiz IA (BFF) branché sur le Cerveau IA (LMS).** Nouveau dossier `quiz-ia/kizzo-api/`.
  - Le backend joue le rôle de **BFF** : l'app n'appelle jamais le LMS directement. La clé `QUIZ_AI_API_KEY` reste strictement côté serveur (injectée via `X-API-Key`), jamais exposée au mobile.
  - `src/lib/quiz-ai/mappings.ts` : réconciliation des nomenclatures LMS ↔ enums Prisma (matières, niveaux CE2→3e, 6 types de questions QCM4/VF/FILL/CALC/SORT/MATCH). Refus 400 hors couverture LMS (ex. `terminale`).
  - Module `modules-enfant/quiz/` : génération depuis thème (`POST /api/quiz/generate/topic`) et depuis photo de devoir (`POST /api/quiz/generate/photo`, upload mémoire multer 2 Mo, JPEG/PNG/WebP), récupération (`GET /api/quiz/:quizId`), soumission + correction serveur (`POST /api/quiz/:quizId/submit`), historique (`GET /api/quiz/history/:childId`).
  - **Sécurité** : la vue client masque toujours `reponse` et `explication` — la correction est exclusivement côté serveur.
  - Quiz persisté en `Defi` (sourceIa, quizIaId pour le lien feedback LMS). À la soumission : scoring, crédit temps (30 min si réussi), création `TentativeDefi`, puis relai du feedback au LMS **non bloquant** (échec LMS = l'enfant garde son résultat).
  - **7 tests d'intégration verts** (client LMS mocké, mappings réels) : 401 sans token, génération+persistance+masquage, refus niveau hors LMS, scoring/crédit/feedback, feedback LMS en échec non bloquant, historique, 404. **Total suite : 37 tests verts.**
- **Lot B — Parcours Quiz IA dans l'app enfant (E09-E19, E30).** Overlay additif `quiz-ia/kizzo-enfant-app/` (à recopier dans le projet agence).
  - `services/api/quiz.ts` + `hooks/quiz.ts` : client typé du BFF `/api/quiz` (génération thème/photo, get, submit, historique) + hooks react-query. L'app ne touche jamais le LMS directement.
  - `components/quiz/QuestionRenderer.tsx` : rend les **6 types** de questions — QCM4, VF, FILL (texte), CALC (numérique), SORT (remise en ordre par tap numéroté), MATCH (association gauche/droite). Réponse encodée en chaîne (JSON pour tri/association, conforme au scoring backend).
  - `screens/quiz/QuizStartScreen` (E09/E18 : matière + chapitre → génération, ou photo de devoir via `expo-image-picker`, loader animé), `QuizPlayScreen` (E10-E19 : progression + soumission + écran résultat « temps gagné »), `QuizHistoryScreen` (E30).
  - Navigation étendue (`QuizStart`/`QuizPlay`/`QuizHistory`) ; écrans alignés sur le **système de tokens courant** (`kz-cyan`/`kz-surface`/`kz-ink`…).
  - ⚠️ Constat : les écrans `defis/` livrés par l'agence utilisent des tokens Tailwind **non définis** (`kz-primary`, `kz-success`, `kz-muted`, `kz-card`…) → rendu sans couleur, à harmoniser.
  - **Vérif** : `tsc --noEmit` **vert** sur copie de travail (deps + `expo-image-picker` installés). Pas d'exécution runtime (Expo managed, pas de toolchain Android sur la machine).
  - Dép. à ajouter côté app : `npx expo install expo-image-picker`. Point d'entrée : repointer le bouton « Lancer un quiz » de `HomeScreen` vers `QuizStart` (1 ligne, cf. `quiz-ia/kizzo-enfant-app/README.md`).
- **Toolchain APK (EAS Build cloud).** `eas.json` + `app.json` (plugin `expo-image-picker`) configurés sur `quiz-ia/enfant-app-work/` (copie buildable, tsc vert). Procédure en 3 commandes dans `quiz-ia/BUILD_APK.md` — reste à faire par Samuel : `eas login` + `eas build -p android --profile preview` (saisie identifiants Expo = action manuelle). ⚠️ `extra.API_URL` = `localhost` à remplacer par un tunnel/URL publique pour tester login/quiz sur téléphone.
- **Lot C — Contrôles parentaux (backend + app parent).**
  - **Backend** (`quiz-ia/kizzo-api/src/modules-parent/`), 4 modules sur le pattern screen-time (schema Zod + service avec `ensureOwnership` + controller + route, montés dans `routes/index.ts`) :
    - `web-filter/` : `GET/PUT /api/parent/web-filter/:childId` (FiltreContenu : niveau strict/modéré/personnalisé, SafeSearch **forcé < 12 ans** CDC §17, black/whitelist).
    - `apps/` : `GET/PUT /api/parent/apps/:childId`, `DELETE …/:bundleId` (RegleApp : autoriser/bloquer, limite quotidienne, catégorie).
    - `profile/` : `GET/PUT /api/parent/profile` + `DELETE /api/parent/account` — **RGPD** (vérif mot de passe, suppression cascade des enfants + anonymisation PII, statut `supprime`).
    - `activity/` : `GET /api/parent/activity/:childId/report?jours=` (agrège UsageApp + VisiteWeb + TentativeDefi : temps écran, quiz réussis/score moyen/temps gagné, visites & sites bloqués).
  - **17 nouveaux tests Vitest verts** (`tests/parent-controls.test.ts`) : 401, défauts, upsert/relecture, SafeSearch forcé, isolation inter-parents, CRUD apps, 404, profil, refus màj vide, RGPD (mauvais mdp 401 / confirmation 400 / suppression + blocage reconnexion), rapport vide, bornes. **Total suite : 54 tests verts.** `tsc --noEmit` **vert** (corrigé 2 dettes agence : import mort `auth.service`, generic query `notifications`).
  - **App parent** — overlay additif `quiz-ia/kizzo-parent-app/` (+ copie intégrée tsc-verte `quiz-ia/parent-app-work/`) : `types/controls.ts`, `services/api/controls.ts`, `hooks/controls.ts` (+`controlKeys`), et 4 écrans `screens/controls/` — `WebFilterScreen` (P21-23), `AppsScreen` (P19-20), `ActivityReportScreen` (P26-31), `AccountScreen` (P35 + RGPD). Navigation étendue (4 routes), tokens **courants**. Correctif partagé : prop `withDivider?` ajoutée à `SubScreenHeader` (débloque le tsc de 3 écrans agence). Points d'entrée à brancher : cf. `quiz-ia/kizzo-parent-app/README.md`.
