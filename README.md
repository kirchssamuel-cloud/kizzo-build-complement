# Kizzo — Build complément (Claude)

> Dossier de travail **local** pour développer le complément de l'app Kizzo, en parallèle de l'agence AppStronaute.
> **Règle d'or : on ne pousse JAMAIS sur le repo agence.** On prépare des patches que Samuel intègre lui-même.

Dernière mise à jour : 2026-06-05 · Auteur : Claude (chef de projet build)

---

## 1. Où est quoi

| Dossier | Rôle | Écriture ? |
|---|---|---|
| `~/Kizzo/kizzo-agence-readonly/` | Clone du repo agence `AppStronaute-gestion/_Kizzo-X-AppStronaute_` | ❌ **lecture seule** |
| `~/Kizzo/kizzo-claude-build/` | Notre travail local (patches, code complément, docs) | ✅ |

Repo agence : dernier commit **2026-06-02** (`3 App enfant — socle & appairage`), auteur `unknown`, branche `main` uniquement, 2 commits seulement (POC + S3).

---

## 2. Ce que dit le brief VS l'état réel du code (vérifié le 2026-06-05)

Le brief (collé en début de session) date d'un état plus ancien. Vérification faite, **le code est notablement plus avancé que le brief ne le dit** côté backend. Écarts à connaître :

### ✅ Bonnes surprises (déjà fait, contrairement au brief)
- **Backend : tous les endpoints sont réellement implémentés** (pas des stubs `NotImplemented`). Vérifié en lisant le code (ex. `challenges.controller.ts` calcule un vrai score sur la DB) :
  - `screen-time` : GET/UPSERT règles, `add-time`, `usage` → **réel**
  - `notifications` : list, mark-read, mark-all-read, delete → **réel** (service + schema présents)
  - `challenges` (enfant) : list, start, submit avec scoring → **réel**
  - `requests` (demandes de temps) : POST → **réel**
  - `admin` : auth/me, users list+search, patch statut → **réel**
- **21 modèles Prisma** déjà en place (couvre temps d'écran, défis, filtres, apps, badges, recommandations IA…).
- `docker-compose.yml` (Postgres 15) + `.env.example` présents.

### ⚠️ Vrais manques confirmés (le cœur du travail restant)
1. **Verrouillage natif Android NON intégré.** `kizzo-enfant-app/` est un projet **Expo managed** : il n'a **aucun dossier `android/`**. Les 15 fichiers Kotlin du PoC (`kizzo-app-poc/`) ne sont donc pas "à copier dans un android/ existant" comme le dit le brief — il faut d'abord générer le projet natif. **Décision d'archi à valider (voir §4).**
2. **Génération de quiz par IA (Cerveau IA / Jonathan) NON branchée au backend.** Le backend sert des défis **statiques stockés en DB** (`Defi`/`QuestionDefi`). L'appel à l'IA n'existe que dans le PoC (`QuizService.kt` → `http://92.222.197.147:8000/quiz/generate/topic`). → S7 réellement à faire.
3. **Aucun push FCM.** Aucun code Firebase/FCM dans le backend. `POST /parent/devices/lock` ne crée qu'une notif en DB → pas de notification réelle envoyée à l'enfant. → S8 à faire.
4. **0 test partout.** Ni Vitest (backend), ni Jest (apps). Le brief impose "pas de code sans test" → priorité transverse.
5. **Stripe / abonnements** : absent (S10).
6. **Petits branchements UI manquants** : bouton notif `count={0}` hardcodé (parent), quota `60 min` hardcodé + `LastQuizCard`/`EvolutionCard` factices (enfant), boutons Lock/+15min sans handler.

---

## 3. Architecture réelle (deux backends distincts !)

```
┌─────────────────┐        ┌──────────────────────────────┐
│ kizzo-parent-app│───────▶│ Backend Kizzo (Node/Express)   │
│ kizzo-enfant-app│        │ kizzo.seclin-app.site/api      │  ← auth, enfants, quotas,
└─────────────────┘        │ (recette agence, OVH)          │     défis DB, notifs, admin
                           └──────────────────────────────┘
                                       (pas de lien IA)
┌─────────────────┐        ┌──────────────────────────────┐
│ PoC Kotlin natif│───────▶│ Cerveau IA (Jonathan/Studio    │
│ QuizService.kt  │        │ Makers) 92.222.197.147:8000    │  ← génère les quiz par IA
└─────────────────┘        │ POST /quiz/generate/topic      │
                           └──────────────────────────────┘
```

→ **Constat clé** : la génération IA et le backend Kizzo ne sont pas connectés. Aujourd'hui le backend = quiz figés en DB ; l'IA = uniquement testée depuis le PoC en HTTP brut. L'unification (le backend Kizzo proxy le Cerveau IA) est le vrai chantier S7.

### Stack confirmée
- **Backend** : Node ≥18.18, Express 5.1, Prisma 6.17 + Postgres 15, Zod, JWT, bcryptjs, Resend. Scripts : `dev`, `build`, `test` (vitest), `prisma:migrate`, `prisma:seed`.
- **Apps** : RN 0.81.5, React 19.1, Expo SDK 54, TanStack Query 5, Zustand + secure-store, axios, NativeWind. Fonts Outfit / Plus Jakarta Sans / Space Grotesk.
- **PoC natif** : Kotlin, **classic ReactPackage** (PAS TurboModules), 15 fichiers / ~2830 LOC, 8 NativeModules exposés via `KizzoPackage.kt`.

### Identités à migrer avant stores
- Package PoC : `com.kizzoapp.app` · Apps : `com.appstronaute.kizzo.parent` / `.enfant` (au nom de l'agence).
- API : `kizzo.seclin-app.site` (recette agence) → cible `api.kizzo.app`.
- Email `no-reply@appstronaute.com` → `no-reply@kizzo.app`.

---

## 4. 🚨 Décisions d'archi à valider avec Samuel (avant de coder le S4)

1. **Comment intégrer le natif dans Expo managed ? → ✅ DÉCIDÉ (2026-06-05) : Option A, config plugin Expo.**
   - **Option A — `expo prebuild` + config plugin** (✅ RETENUE) : on génère `android/` via prebuild, et on injecte les modules Kotlin + permissions via un **config plugin** versionné. Avantage : reproductible, survit aux régénérations, propre pour un handoff agence. Inconvénient : écrire le plugin (coût ponctuel).
   - Option B — prebuild puis édition manuelle du `android/` : rejetée (sort du mode managed, modifs écrasées au prochain prebuild).
   - Option C — bare workflow complet : rejetée (trop intrusif pour le workflow agence).

2. **Sécurité du Cerveau IA** : `QuizService.kt` contient une **clé API en clair** (`kz_70eda…`) et appelle une **IP HTTP non chiffrée**. À ne jamais reproduire dans nos patches : l'appel IA doit passer par le backend Kizzo (proxy + clé côté serveur).

3. **Stripe** : Subscriptions vs Billing Portal (S10, plus tard).

---

## 5. Plan d'attaque (révisé selon l'état réel)

Priorité = ce qui manque vraiment, pas ce que le brief croyait manquant.

| # | Chantier | Pourquoi | Statut |
|---|---|---|---|
| 1 | **Filet de tests** (Vitest backend sur endpoints existants) | "pas de code sans test" + sécuriser l'existant avant d'y toucher | à faire |
| 2 | **S4 — Intégration verrouillage natif** (prebuild + config plugin + bridge JS depuis `LockedScreen.tsx`) | cœur produit, vrai manque | bloqué par décision §4.1 |
| 3 | **Branchements UI rapides** (Lock/+15min, count notifs, quota dynamique) | gains visibles immédiats, faible risque | à faire |
| 4 | **S7 — Backend proxy Cerveau IA** (`/enfant/challenges/start` appelle l'IA au lieu de la DB statique) | unifier les 2 backends | à faire |
| 5 | **S8 — FCM push** (lock temps réel parent→enfant) | actuellement notif DB seulement | à faire |
| 6 | S10 Stripe, S9 rapports, S11 gamification | monétisation + finition | plus tard |

**Prochaine action proposée** : commencer par (1) le filet de tests backend + (3) les branchements UI rapides (sans risque, sans dépendre d'une décision), pendant que Samuel tranche la décision §4.1 sur le natif.

---

## 6. Conventions de ce dossier
- `CHANGELOG.md` : journal daté de tout ce qui est produit ici.
- Patches préparés sous forme de dossiers `sprint-X-*/` + instructions d'intégration.
- Chaque livrable testé avant d'être annoncé "terminé".
