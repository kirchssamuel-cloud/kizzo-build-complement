# Dossier de revue technique — Build complément Kizzo

> À l'attention d'un CTO / lead dev pour audit. Tout le travail est **local**
> (`~/Kizzo/kizzo-claude-build/`), **rien n'a été poussé** sur le dépôt de
> l'agence (cloné en lecture seule). Dernière mise à jour : 2026-06-06.

## 1. En une phrase

Le **backend (API)** et les **deux apps mobiles (parent + enfant)** ont été
complétés et **testés automatiquement** sur les fonctions métier : quiz IA,
contrôles parentaux, temps d'écran, notifications, RGPD et **paiement Stripe**.
La seule partie **non implémentée** (et volontairement signalée comme telle) est
la **couche native Android anti-contournement** — elle est *cadrée et préparée*
mais nécessite un développeur Android dédié.

**Chiffres :** ~13 500 lignes TypeScript écrites · 17 modules backend ·
**179 tests automatisés au vert** (18 fichiers, reproductibles) · TypeScript
sans erreur (`tsc`) sur les 3 projets.

---

## 2. Comment vérifier par vous-même (preuves objectives — 5 min)

> Ces commandes ne modifient rien. Elles prouvent que le code compile et que les
> tests passent. C'est la vérification qu'un CTO fera en premier.

### a) Lancer la suite de tests backend (le plus parlant)
```bash
cd ~/Kizzo/kizzo-claude-build/quiz-ia/kizzo-api
npm install                # 1re fois seulement
# nécessite un PostgreSQL local + une base de test (cf. §6)
npx prisma migrate deploy  # applique le schéma sur la base de test
npx vitest run             # -> doit afficher "Tests 179 passed (179)"
```

### b) Vérifier que le code TypeScript est sain (0 erreur)
```bash
# Backend
cd ~/Kizzo/kizzo-claude-build/quiz-ia/kizzo-api      && npx tsc --noEmit
# App parent
cd ~/Kizzo/kizzo-claude-build/quiz-ia/parent-app-work && npx tsc --noEmit
# App enfant
cd ~/Kizzo/kizzo-claude-build/quiz-ia/enfant-app-work && npx tsc --noEmit
# Les 3 doivent se terminer sans aucune erreur.
```

### c) Lire l'historique détaillé du travail
- `CHANGELOG.md` — journal sprint par sprint (ce qui a été fait, dans l'ordre).
- `MATRICE_CDC_CODE.md` — correspondance cahier des charges ↔ maquettes ↔ code.
- `LOT_E_NATIF_ANTICONTOURNEMENT.md` — cadrage de la partie native restante.
- `README.md` — compréhension générale du projet.

---

## 3. Ce qui est FAIT et testé

### Backend / API (`quiz-ia/kizzo-api/`)
| Domaine | Module | Testé |
|---|---|---|
| Authentification (signup, login, vérif email, reset) | `auth` | ✅ |
| Profils enfants | `children` | ✅ |
| Quiz IA (génération thème + photo, correction serveur, historique) | `modules-enfant/quiz` | ✅ |
| Défis | `challenges` | ✅ |
| Demandes de temps (enfant→parent) | `unlock-requests` | ✅ |
| Filtrage web (+ SafeSearch forcé <12 ans) | `web-filter` | ✅ |
| Règles d'applications (autoriser/bloquer/quota) | `apps` | ✅ |
| Temps d'écran | `screen-time` | ✅ |
| État appareil (heartbeat) | `device-state` | ✅ |
| Rapports d'activité | `activity` | ✅ |
| Préférences de notification | `notifications` | ✅ |
| Profil parent + suppression compte (RGPD) + export données (RGPD) | `profile` | ✅ |
| **Paiement / abonnement Stripe (checkout + statut + webhook)** | `billing` | ✅ |

**Sécurité notable :** la clé de l'IA et les clés Stripe restent strictement
côté serveur (jamais envoyées au mobile) ; les bonnes réponses des quiz ne sont
jamais envoyées au téléphone (correction côté serveur) ; signature des webhooks
Stripe vérifiée ; isolation stricte des données entre parents (testée).

### App parent (`quiz-ia/parent-app-work/` + overlay `kizzo-parent-app/`)
Écrans branchés sur l'API : tableau de bord, détail enfant, **contrôles
parentaux** (filtrage web, apps, rapport d'activité), **demandes de temps**,
**préférences de notification**, **compte + export/suppression RGPD**,
**verrouillage manuel** du téléphone enfant, et **abonnement (offres Famille /
Famille+ via Stripe)**. TypeScript sans erreur.

### App enfant (`quiz-ia/kizzo-enfant-app/` + buildable `enfant-app-work/`)
Parcours quiz complet : lancement (par thème ou photo de devoir), lecteur des
**6 types de questions** (QCM, vrai/faux, texte, calcul, remise en ordre,
association), écran résultat « temps gagné », historique. TypeScript sans erreur.

---

## 4. Ce qui RESTE à faire (transparent)

| Élément | État | Qui / quoi |
|---|---|---|
| **Couche native Android anti-contournement** (bloquer apps, filtrer DNS, verrou système, anti-désinstallation, persistance, détection root) | 🟧 **Cadré + scaffolding, NON codé** | Dév. **Android (Kotlin)** + téléphones de test réels. **C'est le vrai bloqueur stores** (CDC §20.3). Voir `LOT_E_NATIF_ANTICONTOURNEMENT.md`. |
| Notifications push (FCM) | 🟧 tuyau prêt, 1 fonction à brancher | Backend complet : enregistrement des tokens parent (`POST /parent/push-tokens`, isolation testée), dispatcher serveur-only `lib/push.ts` (no-op sûr tant que `FCM_SERVICE_ACCOUNT_JSON` absent), client app parent (`getDevicePushTokenAsync` + hook). **Reste = brancher l'envoi réel firebase-admin** (`deliver()`) + projet Firebase. |
| Verrou ↔ quiz (façade enforcement) | ✅ câblé côté JS | `LockedScreen` appelle `enforcement.lockNow/unlock` (repli no-op) — prêt à recevoir le natif. |
| Build APK installable | 🟧 procédure prête | `quiz-ia/BUILD_APK.md` — reste une connexion manuelle (compte Expo). |
| Clés Stripe « live » + price IDs réels | ⬜ config déploiement | À renseigner par Samuel le jour de la mise en production. |

> **Important pour la discussion avec l'agence :** la couche native est
> précisément ce que l'agence devait livrer (lots natifs, déjà en retard). Le
> backend qui la pilote (commandes de verrouillage, filtres, quotas, heartbeat)
> est **déjà en place et testé** — il ne reste « que » le maillon Android natif,
> dont le périmètre est désormais documenté brique par brique.

---

## 5. Écart d'architecture à connaître (à dire au CTO)

Le cahier des charges demandait **Firebase / Firestore / FCM**. L'agence a en
réalité livré une autre stack : **API Express + PostgreSQL/Prisma + JWT**. Mon
travail s'appuie sur la stack **réellement livrée** (re-platformer vers Firebase
= jeter une grande partie du travail payé). C'est un point de non-conformité
contractuelle à faire valoir auprès de l'agence — pas un défaut de mon ajout.

---

## 6. Pré-requis pour rejouer les tests (environnement)
- Node.js + npm
- PostgreSQL local, avec une base de test. Variable attendue :
  `TEST_DATABASE_URL` (défaut : `postgresql://postgres:postgres@localhost:5432/kizzo_test`).
- `npx prisma migrate deploy` pour créer les tables avant `npx vitest run`.

---

## 7. Périmètre / garde-fous respectés
- ✅ Tout en local, **aucun push** sur le dépôt de l'agence.
- ✅ Dépôt agence cloné **en lecture seule** (jamais modifié).
- ✅ Clés sensibles (IA, Stripe) **côté serveur uniquement**.
- ✅ Le « Cerveau IA » (LMS) est **consommé**, pas réécrit.
- ✅ Dossier `backend-tests/` d'origine **gelé** (non modifié).
