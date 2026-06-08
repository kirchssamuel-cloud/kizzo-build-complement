# Matrice CDC ↔ maquettes ↔ code — point complet (2026-06-05)

> Objectif : relier chaque feature du cahier des charges (CDC V4.0) à son écran maquetté et
> à l'état réel du code livré par l'agence, pour savoir exactement quoi coder jusqu'à une app
> complète et soumissible aux stores.

## 0. Sources croisées
- **CDC** : `Appstronaute_Cahier des Charges Kizzo - Partie 1.pdf` (sections 0-12) + `Partie 2.pdf`
  (P01-P35 parent, E01-E30 enfant, A01-A08 back-office, §16 backend, §17 sécu, §18 RGPD, §19-22 QA/projet, Annexes A/B/C).
- **Maquettes Figma** : fichier `a9eSnDJdGmgOtpHvfVanaM`, page « 11/05 » (326 frames : app enfant + app parent + back-office + dark mode).
- **Code agence** : `~/Kizzo/kizzo-agence-readonly/` (4 sous-projets, 2 commits, gelé depuis ~29/04).
- **Build local** : `~/Kizzo/kizzo-claude-build/quiz-ia/kizzo-api/` (copie backend + lib `quiz-ai` LMS, déjà écrite).

## 1. ⚠️ Écart d'architecture majeur (à acter)
| | CDC V4.0 (§16-17) | Livré par l'agence |
|---|---|---|
| Auth | **Firebase Auth** (`Bearer {firebase_jwt_token}`) | JWT maison (`jsonwebtoken`/`jose`) + bcrypt |
| Base | **Firestore** (NoSQL temps réel) + règles de sécurité Firestore | **PostgreSQL** + Prisma |
| Serverless | **Cloud Functions / Cloud Run** | Express 5 monolithe |
| Push | **FCM** | Absent (champ token en BD, pas d'envoi) |

→ Fonctionnellement les endpoints se correspondent, mais la stack livrée **n'est pas celle du CDC**.
Ce n'est pas bloquant pour les stores (l'app marche), mais c'est une **non-conformité contractuelle**
à faire valoir auprès de l'agence. Pour le build, on **continue sur la stack livrée (Express/Prisma/PG)** :
re-platformer vers Firebase serait jeter 70 % du travail déjà payé.

## 2. Backend — endpoints CDC §16 vs code (`kizzo-api`)
| Domaine CDC | Endpoints | État livré |
|---|---|---|
| Auth | register, verify-email, reset-password, login, OAuth | ✅ **fonctionnel** |
| Parent profil | GET/PUT /parent/profile, DELETE /parent/account (RGPD cascade) | ❌ **absent** |
| Enfants | POST/GET/GET:id/PUT/DELETE children | ✅ fonctionnel (manque PUT/DELETE) |
| Appairage | pairing generate/validate/delete | ✅ fonctionnel |
| Règles | GET/PUT /rules/:childId | ⚠️ partiel (screen-time only) |
| Apps | GET /apps, PUT/DELETE /apps/:pkg | ❌ **absent** |
| Filtrage web | GET/PUT web-filter, blacklist/whitelist | ❌ **absent** |
| État appareil | PUT/GET /device-state (heartbeat) | ❌ **absent** |
| Quiz (LMS BFF) | generate-from-image/topic, GET, submit, feedback | 🟡 **stub** (généré en dur) → **lib `quiz-ai` prête, à brancher** |
| Résultats | POST /quiz/result, GET /quiz/history | ⚠️ partiel (tentative créée, pas d'historique) |
| Demandes temps | unlock-requests create/pending/respond | ❌ **stub** |
| Activité | activity/report, export-pdf | ❌ **absent** |
| Logs web | POST/GET web-logs | ❌ **absent** |
| Abonnement | GET /subscription, webhook Stripe | ❌ **absent** (plans en BD, 0 Stripe) |
| Admin | users, devices, security-events, pairing/reset, anomalies | ❌ **stub** |
| Jobs cron | purge logs/events, réconciliation Stripe, reset quotas, cleanup codes | ❌ **absent** |

## 3. App Parent (RN) — P01-P35 vs code (`kizzo-parent-app`)
- ✅ **Fonctionnel** : Welcome, Login, Signup, VerifyEmail, ForgotPwd, ResetPwd, Enfants (liste), AjoutEnfant, Appairage.
- ⚠️ **Partiel** : Onboarding, Dashboard, EnfantDetail, Réglages.
- ❌ **Stub / vide** : Rapports (P26-P31), Notifications (P32), + **manquants** : params filtrage web (P21-P23),
  gestion apps (P19-P20), abonnement/Stripe (P33), préférences notifs (P34), modifier PIN, RGPD (P35),
  blocage manuel (P12), accorder temps (P13), params horaire/fragmenté (P14-P15).

## 4. App Enfant (RN) — E01-E30 vs code (`kizzo-enfant-app`)
- ✅ **Fonctionnel** : Welcome, PairCode, Locked (lockscreen UI), Defis (liste), DefiPlay (quiz multipage).
- ⚠️ **Partiel** : Home (E03).
- ❌ **Stub / manquants** : Activity, Badges, Progression (E30), écrans par **type de question** (E10 QCM ok partiel,
  E11 VF, E12 FILL, E13 CALC, **E14 SORT drag&drop**, **E15 MATCH association**), feedback E16/E17, loader E18,
  résultat E19, demande temps E20-E23, pages erreur E24-E29.

## 5. ❌ Couche native Android — anti-contournement (le vrai trou)
Le PoC `kizzo-app-poc` n'expose que des **mocks JavaScript**. **Zéro Kotlin réel** :
VPN local + filtrage DNS, AccessibilityService, UsageStats, lockscreen overlay système, Device Admin,
BootReceiver, foreground service heartbeat, détection root/bypass (AC-01..14).
→ Ce sont précisément les **critères No-Go release** (§20.3). **Impossible en Expo managed sans config plugin natif.**
C'est le bloc le plus lourd et celui que l'agence devait livrer (L2/L3, deadlines 20 mai / 17 juin déjà dépassées côté natif).

> **Mapping AC-01..14** : voir `LOT_E_NATIF_ANTICONTOURNEMENT.md` §2 — table complète
> AC↔composant↔signal d'intégrité. **AC-05 à AC-13 = libellés vérifiés** (recopiés du
> `AntiBypassModule.kt` agence) ; AC-01..04 + AC-14 restent à recopier du CDC PDF §20.3.
> Le scaffolding `enforcement.ts` (façade TS) + `withKizzoEnforcement.js` (config plugin)
> + 9 stubs Kotlin sont prêts : il ne reste « que » l'implémentation Kotlin réelle.

## 6. Ce que JE peux coder (build local, sans natif)
1. **Backend BFF LMS** : brancher `quiz-ai` sur de vrais endpoints (generate/topic+photo, get, submit, feedback, history). ← *en cours*
2. **Backend endpoints manquants** : web-filter, apps, device-state, unlock-requests, notifications, activity, subscription+webhook Stripe, admin, profile/account RGPD, jobs cron.
3. **App Parent** : écrans partiels/manquants (filtrage, apps, rapports, notifs, abonnement, RGPD, blocage/temps).
4. **App Enfant** : écrans quiz par type (E10-E18), résultat E19, demande temps E20-E23, erreurs, progression, badges.
5. **Tests** : Vitest backend (déjà 30 verts) + extension sur les nouveaux endpoints.

## 7. Ce que je NE peux PAS livrer seul (à cadrer avec l'agence)
- Toute la **couche native Kotlin** (VPN/DNS, accessibilité, lockscreen système, device admin, heartbeat, anti-bypass) = No-Go stores.
- Le **re-platforming Firebase** (si on veut la conformité stricte au CDC).
- L'**eject Expo / config plugin** + matrice d'appareils physiques (§20.2) pour le QA anti-contournement manuel.

## 8. Séquence de build retenue
**Lot A (backend BFF LMS) ✅** → **Lot B (écrans quiz enfant E09-E19, E30) ✅** → **Lot C (écrans parent manquants)** →
**Lot D (Stripe/abonnement + RGPD)** → **Lot E (config plugin natif = nécessite toolchain Android, à part)**.
Tests à chaque lot. Aucun push sur le repo agence : tout reste en patch local.

### Avancement
- **Lot A ✅** (`quiz-ia/kizzo-api/`) : module Quiz BFF (génération thème/photo, get, submit+correction serveur, feedback LMS non bloquant, historique). 7 tests Vitest verts (37 au total).
- **Lot B ✅** (`quiz-ia/kizzo-enfant-app/`) : parcours quiz IA — client+hooks, renderer 6 types (dont SORT/MATCH), écrans lancement/lecteur/résultat/historique, navigation. `tsc --noEmit` vert. Dép. à ajouter : `expo-image-picker`.
- **Lot C ✅ (terminé)** :
  - Backend `quiz-ia/kizzo-api/src/modules-parent/` : **web-filter**, **apps**, **profile** (GET/PUT + DELETE RGPD), **activity**, **device-state** (heartbeat + tokenPush), **unlock-requests** (P13), **notifications** (préférences P34).
  - App parent (`parent-app-work/` tsc-vert + overlay `kizzo-parent-app/`) : **WebFilter (P21-23)**, **Apps (P19-20)**, **ActivityReport (P26-31)**, **Account+RGPD (P35)**, **UnlockRequests (P13)**, **NotificationPreferences (P34)**, **blocage manuel P12** ; boutons d'entrée câblés (EnfantDetail/Réglages).
- **Lot D ✅ (terminé)** : **Stripe** abonnement (P33) + webhook signé (clé secrète serveur-only) + **export RGPD** (art.20). Config réelle (clés live + price IDs) = action déploiement Samuel.
- **FCM / push ✅ (tuyau prêt)** : backend `push-tokens` (register/unregister `AppareilPush`, isolation parent testée) + dispatcher serveur-only `lib/push.ts` (no-op tant que `FCM_SERVICE_ACCOUNT_JSON` absent) ; client app parent `services/api/push.ts` + hook `registerPushToken` (token natif via `getDevicePushTokenAsync`). **Reste = brancher l'envoi réel firebase-admin** (1 fonction `deliver`) + projet Firebase (Samuel).
- **Enforcement (Lot E façade) ✅ câblé** : `LockedScreen` appelle `enforcement.lockNow/unlock` (repli no-op sûr) — l'UX verrou↔quiz est branchée côté JS, prête à recevoir le natif.
- **Total tests backend : 111 Vitest verts (12 fichiers), tsc vert sur les 3 projets.**
- **Lot E (Kotlin réel) — bloqué (agence)** : couche native anti-contournement = No-Go stores §20.3, nécessite prebuild/config plugin + toolchain Android (non installée, Mac) + appareils physiques. Scaffolding + table AC-01..14 prêts (cf. `LOT_E_NATIF_ANTICONTOURNEMENT.md`).
