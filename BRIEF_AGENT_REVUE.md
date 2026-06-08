# Brief — Audit technique du build complément Kizzo (à exécuter par un agent)

> **Pour l'agent qui reçoit ce fichier.** Tu joues le rôle d'un **CTO / lead dev**
> qui audite un ajout de code livré par un autre développeur. Ton job : **vérifier
> objectivement** que le travail compile, que les tests passent, et que ce qui est
> annoncé « fait » l'est réellement — puis rendre un verdict honnête et chiffré.
> Ne fais **aucune modification** du code pendant l'audit (lecture + exécution de
> tests seulement). Réponds en français.

---

## 0. Contexte en 4 lignes

- Projet : **Kizzo**, app Android de contrôle parental où l'enfant gagne du temps d'écran en réussissant des quiz générés par IA.
- Ce build est un **complément local** posé par-dessus la stack réellement livrée par l'agence (Express + PostgreSQL/Prisma + JWT), pas une réécriture.
- Tout est **en local** dans `~/Kizzo/kizzo-claude-build/`. **Rien n'a été poussé** sur le dépôt de l'agence (cloné en lecture seule).
- Document de référence rédigé par l'auteur du build : **`DOSSIER_REVUE_CTO.md`** (racine du dossier). Lis-le en premier, puis vérifie ses affirmations avec la procédure ci-dessous.
- **Dossiers à auditer (sous `quiz-ia/`)** : backend = `kizzo-api/` (contient les 179 tests) ; app parent = `parent-app-work/` ; app enfant = `enfant-app-work/`. ⚠️ `kizzo-parent-app/` et `kizzo-enfant-app/` sont des **copies overlay synchronisées** — audite les versions **`*-app-work`** (canoniques, buildables) pour éviter les doublons.

---

## 1. Ta mission (dans l'ordre)

1. Lire `DOSSIER_REVUE_CTO.md`, `CHANGELOG.md`, `MATRICE_CDC_CODE.md`, `LOT_E_NATIF_ANTICONTOURNEMENT.md`.
2. **Reproduire les preuves** (commandes §2 ci-dessous) — c'est le cœur de l'audit.
3. **Échantillonner le code** réellement écrit (pas juste les docs) : ouvrir 4-5 modules backend et vérifier qu'ils font ce qui est annoncé (§3).
4. Rendre un **verdict** structuré (§4).

---

## 2. Preuves à reproduire (ne modifie rien)

### a) Suite de tests backend — la preuve la plus parlante
```bash
cd ~/Kizzo/kizzo-claude-build/quiz-ia/kizzo-api
npm install                # 1re fois seulement
# Pré-requis : un PostgreSQL local + une base de test.
# Variable attendue : TEST_DATABASE_URL
#   (défaut : postgresql://postgres:postgres@localhost:5432/kizzo_test)
npx prisma migrate deploy  # applique le schéma sur la base de test
npx vitest run             # ATTENDU : "Tests 179 passed (179)" — 18 fichiers
```
> Annonce de l'auteur : **179 tests verts (18 fichiers)**, suite sérialisée pour
> l'isolation DB (`pool:'forks'` + `singleFork:true` dans `vitest.config.mts`).
> Vérifie ce chiffre. Si tu obtiens autre chose, c'est un signal — note-le.
>
> ⚠️ **Ne lance qu'UNE seule suite à la fois.** La suite tourne contre une **vraie
> base Postgres partagée** ; deux `vitest run` simultanés se corrompent mutuellement
> (faux échecs d'isolation/verrouillage). Toujours en série.
>
> **Flake connu (non bloquant)** : un flake transitoire a été observé une fois
> (`children.test.ts` → `createVerifiedParent` recevant un `404` sur `POST /login`).
> Ce n'est **pas** un bug : le handler `login` ne renvoie jamais 404 par conception
> (401/403 uniquement), c'est le fallback Express d'une requête transitoire. Le
> fichier passe 7/7 en isolation (`npx vitest run tests/children.test.ts`). Si tu
> vois 178/179 une fois, relance — ce n'est pas une régression de logique.

### b) TypeScript sain — 0 erreur sur les 3 projets
```bash
cd ~/Kizzo/kizzo-claude-build/quiz-ia/kizzo-api       && npx tsc --noEmit
cd ~/Kizzo/kizzo-claude-build/quiz-ia/parent-app-work && npx tsc --noEmit
cd ~/Kizzo/kizzo-claude-build/quiz-ia/enfant-app-work && npx tsc --noEmit
# ATTENDU : les 3 se terminent sans aucune erreur.
```

---

## 3. Contrôles de fond (au-delà des docs)

Ouvre et lis réellement ces fichiers pour vérifier que le code tient ses promesses :

| À vérifier | Où regarder | Ce qui doit être vrai |
|---|---|---|
| Correction quiz **côté serveur** (les bonnes réponses ne partent jamais au mobile) | `quiz-ia/kizzo-api/src/modules-enfant/quiz/` | Le `submit` corrige sur le serveur ; la génération ne renvoie pas les réponses au client |
| Clé IA **serveur-only** | `quiz-ia/kizzo-api/` (client LMS) | La clé est injectée côté serveur, jamais exposée ; l'app ne touche pas le LMS (http://92.222.197.147:8000) directement |
| Stripe **clés secrètes serveur-only** + webhook signé | `quiz-ia/kizzo-api/src/modules-parent/billing/` + `lib/stripe.ts` | Signature webhook vérifiée sur le rawBody **avant** traitement ; aucune saisie carte in-app (UI ouvre l'URL Stripe hébergée) |
| **Isolation des données** entre parents | tests `*.test.ts` des modules parent | Un parent ne peut pas lire/écrire les données d'un autre (cas testés) |
| RGPD : suppression compte (cascade) + export | `modules-parent/profile/` + endpoint export | Suppression anonymise/cascade ; export masque PIN/mdp/tokenPush |
| **Horaires & quota** (P14-P15) | `modules-parent/screen-time/` + `tests/screen-time.test.ts` (10 tests) | Upsert idempotent par (enfant, jour) ; validation HH:mm (400) ; isolation 403 sur GET/PUT/add-time/usage ; 404 enfant inexistant |
| **Liste notifications** (P33) | `modules-parent/notifications/` + `tests/notifications-list.test.ts` (10 tests) | Pagination (total/pageSize/totalPages) ; lu / tout-lu / suppression ; isolation 403 read+delete ; 404 |
| **Badges enfant** (E30) | `modules-enfant/badges/` + `tests/badges.test.ts` (6 tests) | Catalogue serveur 9 badges annoté acquis/date ; header `X-Kizzo-Appareil-Id` ; dédoublonnage ; isolation 403 ; aucun id interne fuité |
| **Back-office admin** (sécurité) | `modules-admin/` (security-events, devices, pairing-reset, anomalies) + `tests/admin-security.test.ts` (20 tests) | Réservé aux admins (403 parent) ; events de sécu paginés ; détail appareil sans tokenPush ; désappairage purge le token ; anomalies (heartbeat absent, paiement échoué, compte verrouillé) |
| **Jobs cron de maintenance** | `quiz-ia/kizzo-api/src/lib/jobs/` + `tests/maintenance-jobs.test.ts` (13 tests) | 5 jobs idempotents (`now` injectable) : déverrouillage 15 min, purge codes 1 h, purge historique 365 j (RGPD), purge notifs lues 90 j, réconciliation Stripe (payant échu→gratuit en **gardant** stripeCustomerId). Scheduler `setInterval` jamais démarré en test/à l'import |
| Couche native Android | `LOT_E_NATIF_ANTICONTOURNEMENT.md` + `enfant-app-work/modules/kizzo-enforcement/` | **Honnêteté à confirmer** : c'est du **scaffolding non compilé** (stubs Kotlin + façade TS no-op + config plugin manifest). Annoncé comme NON fait — vérifie que ce n'est pas survendu. |

---

## 4. Ce qui est annoncé comme NON fait (à ne pas compter comme défaut caché)

L'auteur le signale explicitement — ton rôle est de confirmer que c'est bien isolé et documenté, pas dissimulé :
- **Couche native Android anti-contournement** (Kotlin) : cadrée + scaffoldée, **pas codée**. C'est le vrai bloqueur stores (CDC §20.3) et c'était le livrable de l'agence.
- **Notifications push (FCM)** : backend prêt à recevoir les tokens, intégration Firebase à brancher.
- **Build APK installable** : procédure prête (`BUILD_APK.md`), reste une étape manuelle (compte Expo).
- **Clés Stripe « live » + price IDs réels** : config de déploiement, à renseigner le jour de la mise en prod.

---

## 5. Écart d'architecture à connaître

Le cahier des charges demandait **Firebase / Firestore / FCM**. L'agence a en réalité livré **Express + PostgreSQL/Prisma + JWT**. Le build s'appuie sur la stack **réellement livrée** (re-platformer vers Firebase reviendrait à jeter une grande partie du travail déjà payé). C'est un point de **non-conformité contractuelle de l'agence**, pas un défaut de cet ajout.

---

## 6. Format de verdict attendu (rends ça)

1. **Les preuves passent-elles ?** (tests : X/179 ; tsc : OK/KO sur les 3 projets) — copie les sorties clés.
2. **Le code fait-il ce qu'il annonce ?** (verdict sur les 6 contrôles de fond du §3).
3. **Y a-t-il du survente ou du caché ?** (quelque chose annoncé « fait » qui ne l'est pas, ou l'inverse).
4. **Qualité générale** (structure, sécurité, tests pertinents ou cosmétiques).
5. **Verdict en 1 phrase** : est-ce un travail crédible et défendable face à l'agence, oui/non, et pourquoi.

---

## 7. Garde-fous (à respecter pendant l'audit)
- **Lecture seule sur le code** : n'édite rien, ne pousse rien.
- Ne touche pas au dossier `backend-tests/` (gelé d'origine).
- Ne crée aucun compte, n'entre aucune clé/identifiant.
- Si un pré-requis manque (PostgreSQL, base de test), signale-le au lieu de contourner.
