# Déploiement Kizzo — Guide de mise en production

> Document de référence pour passer Kizzo de la recette au **live** (backend +
> app parent + app enfant). Chaque étape liste : **Action**, **Lien officiel**,
> **Temps estimé** et **Dépendances**.
>
> Stack réelle : backend **Node/Express + PostgreSQL + Prisma**, apps **React
> Native / Expo (managed)**, bundle id `com.appstronaute.kizzo`, emails
> **Resend**, push **Firebase FCM**, paiements **Stripe**, génération de quiz par
> le **Cerveau IA** (`92.222.197.147:8000`).
>
> Dernière mise à jour : 2026-06-07.

---

## 0. Vue d'ensemble & ordre recommandé

Le **chemin critique** (chaque maillon bloque les soumissions stores) :

```
Domaine api.kizzo.app + backend prod  ──┐
Resend (emails transactionnels)         │
Firebase / FCM (push)                   ├─▶  Builds EAS  ──▶  TestFlight / Internal testing  ──▶  Soumission stores
Stripe Live (abonnements)               │
Politique de confidentialité (URL)      ┘   (Data Safety + Privacy Manifest exigent cette URL)
```

| # | Étape | Bloque | Temps actif | Délai d'attente externe |
|---|---|---|---|---|
| 1 | Domaine + backend prod | tout | 0,5–1 j | propagation DNS ~ qq h |
| 2 | Resend (SMTP) | onboarding email | 1 h | vérif DNS ~ qq h |
| 3 | Firebase / FCM | push | 1–2 h | — |
| 4 | Stripe Live | abonnements | 2–3 h | validation compte Stripe 1–2 j |
| 5 | Politique de confidentialité | soumissions stores | 0,5 j | — |
| 6 | Apple App Store | release iOS | 1 j | **review 24–48 h** |
| 7 | Google Play | release Android | 1 j | **review qq h–7 j** |

> ⚠️ Les comptes développeur (Apple 99 $/an, Google 25 $ une fois) et la
> validation Stripe peuvent prendre **plusieurs jours** : à lancer **en premier**.

---

## 1. Domaine `api.kizzo.app` & backend production

**Action**
1. Acheter/configurer le domaine `kizzo.app` et créer un enregistrement DNS
   `A`/`CNAME` pour `api.kizzo.app` pointant vers le serveur backend (OVH ou
   autre hôte Node).
2. Provisionner un **PostgreSQL managé** (≥ 15) et récupérer son `DATABASE_URL`.
3. Déployer le backend (`quiz-ia/kizzo-api`) : `npm ci && npm run build`, puis
   appliquer les migrations **`npx prisma migrate deploy`** (jamais `migrate dev`
   en prod).
4. Renseigner **toutes** les variables d'env (cf. §8) — en particulier
   `JWT_SECRET` fort et unique, `CORS_ORIGIN` restreint aux apps.
5. Mettre le backend derrière **HTTPS/TLS** (reverse proxy Nginx/Caddy ou
   terminaison TLS de l'hébergeur). Certificat **Let's Encrypt** suffisant.
6. Vérifier `GET https://api.kizzo.app/api/health` → `200`.

**Lien officiel**
- Prisma deploy en prod : <https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing>
- Let's Encrypt / Certbot : <https://certbot.eff.org/>

**Temps estimé** : 0,5 à 1 jour (hors propagation DNS).

**Dépendances** : domaine acheté ; serveur Node accessible ; base Postgres
managée. Bloque **toutes** les autres étapes (les stores refusent une app qui
tape une URL non‑HTTPS, et les builds doivent pointer vers l'URL prod).

---

## 2. Emails transactionnels — Resend (SMTP)

**Action**
1. Créer un compte Resend, ajouter et **vérifier le domaine d'envoi** (idéalement
   `kizzo.app`, sinon conserver `appstronaute.com` comme aujourd'hui).
2. Publier les enregistrements DNS fournis (**SPF**, **DKIM**, et `DMARC`
   recommandé) pour éviter le spam.
3. Générer une **API key** → variable `RESEND_API_KEY`.
4. Aligner `EMAIL_FROM` sur un expéditeur du domaine vérifié.
5. Tester un signup réel → réception du code de vérification à 6 chiffres.

> Sans `RESEND_API_KEY`, le backend **simule** les envois (log seulement) : les
> codes de vérification email ne partent pas → onboarding bloqué en prod.

**Lien officiel**
- Vérification domaine : <https://resend.com/docs/dashboard/domains/introduction>
- API keys : <https://resend.com/docs/dashboard/api-keys/introduction>

**Temps estimé** : 1 h actif + propagation DNS (qq h).

**Dépendances** : accès DNS du domaine d'envoi.

---

## 3. Notifications push — Firebase / FCM

**Action**
1. Créer (ou réutiliser) un projet **Firebase** pour Kizzo.
2. Ajouter les apps **Android** (`com.appstronaute.kizzo`) et **iOS**
   (même bundle id) au projet.
3. Pour iOS : créer une **clé d'authentification APNs** (.p8) dans l'Apple
   Developer portal et la charger dans Firebase (Cloud Messaging).
4. Générer un **compte de service** (Project settings → Service accounts →
   *Generate new private key*) → coller le JSON **minifié sur une seule ligne**
   dans `FCM_SERVICE_ACCOUNT_JSON` (côté serveur uniquement).
5. Côté apps Expo : configurer le plugin de notifications et récupérer les tokens
   (FCM Android / APNs via Expo). Le backend route déjà tokens FCM bruts **et**
   tokens Expo (`ExponentPushToken[...]`).
6. Tester : verrouillage d'appareil parent → push reçu sur l'appareil enfant.

**Lien officiel**
- Service account FCM : <https://firebase.google.com/docs/cloud-messaging/auth-server>
- Expo Push / FCM & APNs : <https://docs.expo.dev/push-notifications/fcm-credentials/>
- Clé APNs : <https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server/establishing-a-token-based-connection-to-apns>

**Temps estimé** : 1 à 2 h.

**Dépendances** : compte Apple Developer (pour la clé APNs) ; bundle id figé.

---

## 4. Paiements — Stripe Live (abonnements)

**Action**
1. Activer le **compte Stripe** (informations légales société → validation
   Stripe, peut prendre 1–2 j).
2. Créer les **produits & prix** des deux plans payants → renseigner
   `STRIPE_PRICE_FAMILLE` et `STRIPE_PRICE_FAMILLE_PLUS` (price IDs **live**).
3. Récupérer la **clé secrète live** → `STRIPE_SECRET_KEY` (`sk_live_…`).
4. Configurer le **webhook** vers `https://api.kizzo.app/api/billing/webhook`,
   sélectionner les événements abonnement (`checkout.session.completed`,
   `customer.subscription.updated/deleted`, `invoice.payment_failed`, …) →
   `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
5. Vérifier `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` (deep links app).
6. Tester un abonnement de bout en bout en mode live (carte réelle ou test
   contrôlé) → plan utilisateur mis à jour via webhook.

> Toutes les clés Stripe restent **strictement côté serveur**. Le job cron
> `reconcileExpiredSubscriptions` sert de filet si un webhook est manqué.

**Lien officiel**
- Passage en live : <https://stripe.com/docs/keys>
- Webhooks : <https://stripe.com/docs/webhooks>
- Création de produits/prix : <https://stripe.com/docs/products-prices/how-products-and-prices-work>

**Temps estimé** : 2 à 3 h actif + validation compte 1–2 j.

**Dépendances** : backend prod en HTTPS (pour le webhook) ; entité légale pour
l'activation.

---

## 5. Politique de confidentialité & conformité légale

**Action**
1. Rédiger et **héberger une politique de confidentialité** à une URL publique
   stable (ex. `https://kizzo.app/confidentialite`). **Obligatoire** pour les deux
   stores et exigée par Data Safety / Privacy Manifest.
2. Kizzo traitant des **données d'enfants**, prévoir une section conforme
   **RGPD + protection des mineurs** (base légale = consentement parental,
   minimisation, droits d'accès/suppression — l'export RGPD parent existe déjà).
3. Préparer une page de **support / contact** (exigée par Apple).
4. Si sous‑traitants (Resend, Stripe, Firebase, Cerveau IA) : tenir le registre
   et les **DPA** correspondants.

**Lien officiel**
- Apple — exigences confidentialité : <https://developer.apple.com/app-store/app-privacy-details/>
- Google — politique données utilisateur : <https://support.google.com/googleplay/android-developer/answer/10144311>
- CNIL — applications mobiles : <https://www.cnil.fr/fr/applications-mobiles>

**Temps estimé** : 0,5 jour (hors validation juridique).

**Dépendances** : liste à jour des données collectées et des sous‑traitants.

---

## 6. Apple — App Store Connect (app parent + app enfant iOS)

**Action**
1. Souscrire l'**Apple Developer Program** (99 $/an).
2. Créer les **App IDs / bundles** et les fiches App Store Connect (parent et
   enfant si deux apps distinctes).
3. Activer **Sign in with Apple** (déjà attendu par le backend, `APPLE_CLIENT_ID`).
4. Renseigner **App Privacy** (questionnaire) + fournir un **Privacy Manifest**
   (`PrivacyInfo.xcprivacy`) déclarant données collectées et API à raison d'usage.
5. **Builder via EAS** (`eas build -p ios --profile production`) et **soumettre**
   (`eas submit -p ios`) ou via Transporter/Xcode.
6. Tester en **TestFlight**, puis soumettre à la **review**.
7. Renseigner la classification d'âge et, l'app visant des enfants, vérifier les
   règles **Kids Category** d'Apple si on candidate à cette catégorie.

**Lien officiel**
- App Store Connect : <https://appstoreconnect.apple.com/>
- Privacy Manifest : <https://developer.apple.com/documentation/bundleresources/privacy-manifest-files>
- EAS Build/Submit : <https://docs.expo.dev/build/introduction/> · <https://docs.expo.dev/submit/introduction/>
- Sign in with Apple : <https://developer.apple.com/sign-in-with-apple/>

**Temps estimé** : ~1 jour de prépa + **review 24–48 h**.

**Dépendances** : §1 (URL prod HTTPS), §5 (politique de confidentialité), §3
(APNs), bundle id figé.

---

## 7. Google Play Console (app parent + app enfant Android)

**Action**
1. Créer un compte **Google Play Developer** (25 $ une fois).
2. Créer les fiches d'app, activer le **Play App Signing**.
3. Remplir le formulaire **Data Safety** (cohérent avec la politique de
   confidentialité) et la section **Families / contenu pour enfants** si ciblage
   mineurs (déclaration *Designed for Families* + conformité **Play Families
   Policy**).
4. **Builder via EAS** (`eas build -p android --profile production`, AAB) et
   **soumettre** (`eas submit -p android`).
5. Tester en **Internal testing**, puis promouvoir en production.

**Lien officiel**
- Play Console : <https://play.google.com/console/>
- Data Safety : <https://support.google.com/googleplay/android-developer/answer/10787469>
- Families Policy : <https://support.google.com/googleplay/android-developer/answer/9893335>
- EAS Submit (Android) : <https://docs.expo.dev/submit/android/>

**Temps estimé** : ~1 jour de prépa + **review qq h à 7 j**.

**Dépendances** : §1 (URL prod), §5 (politique de confidentialité), §3 (FCM),
package name figé.

---

## 8. Récapitulatif des variables d'environnement (backend prod)

> Source de vérité : `quiz-ia/kizzo-api/src/config/env.ts`. À mettre dans le
> `.env` de prod (et compléter `.env.example`, aujourd'hui incomplet sur Stripe
> et maintenance).

| Variable | Obligatoire prod | Rôle |
|---|---|---|
| `NODE_ENV` | ✅ (`production`) | Mode d'exécution |
| `PORT` | ✅ | Port d'écoute (défaut 8000) |
| `CORS_ORIGIN` | ✅ | **Restreindre** aux origines des apps (pas `*`) |
| `PLATFORM_URL` | ✅ | URL plateforme (liens emails) |
| `APP_DEEP_LINK_PARENT` / `APP_DEEP_LINK_ENFANT` | ✅ | Deep links apps |
| `DATABASE_URL` | ✅ | Postgres managé prod |
| `JWT_SECRET` | ✅ | **Secret fort unique** (ne pas réutiliser la recette) |
| `JWT_EXPIRES_IN` | ⬜ | Durée de vie token (défaut 30 j) |
| `RESEND_API_KEY` | ✅ | Envoi emails (sinon simulés) — cf. §2 |
| `EMAIL_FROM` | ✅ | Expéditeur (domaine vérifié) |
| `GOOGLE_CLIENT_ID_WEB/IOS/ANDROID` | ⬜* | OAuth Google (si login Google activé) |
| `APPLE_CLIENT_ID` | ✅ | Sign in with Apple |
| `FCM_SERVICE_ACCOUNT_JSON` | ✅ | Push FCM (JSON minifié) — cf. §3 |
| `QUIZ_AI_BASE_URL` | ✅ | Cerveau IA (génération quiz) |
| `QUIZ_AI_API_KEY` | ⬜* | Clé IA (si l'API la requiert) — **jamais côté app** |
| `QUIZ_AI_TIMEOUT_MS` | ⬜ | Timeout appel IA (défaut 10 s) |
| `STRIPE_SECRET_KEY` | ✅ | Clé live `sk_live_…` — cf. §4 |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Signature webhook `whsec_…` |
| `STRIPE_PRICE_FAMILLE` / `STRIPE_PRICE_FAMILLE_PLUS` | ✅ | Price IDs live |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | ⬜ | Deep links retour checkout |
| `MAINTENANCE_JOBS_ENABLED` | ⬜ | `false` pour déléguer le cron à k8s/systemd |
| `MAINTENANCE_INTERVAL_MS` | ⬜ | Intervalle planificateur (défaut 24 h) |

\* Obligatoire seulement si la fonctionnalité correspondante est activée.

---

## 9. Checklist go-live (ordre conseillé)

- [ ] Comptes lancés tôt : Apple Developer, Google Play, activation Stripe.
- [ ] Domaine `api.kizzo.app` + HTTPS + `GET /api/health` → 200.
- [ ] `prisma migrate deploy` appliqué sur la base prod.
- [ ] Toutes les variables d'env prod renseignées (§8), `JWT_SECRET` régénéré.
- [ ] Resend : domaine vérifié (SPF/DKIM), signup réel reçoit le code.
- [ ] Firebase/FCM : service account en place, push de test reçu sur l'enfant.
- [ ] Stripe live : produits/prix, webhook signé, abonnement test OK.
- [ ] Politique de confidentialité publiée (URL stable) + page support.
- [ ] App Store : Privacy Manifest + App Privacy remplis, build EAS, TestFlight OK.
- [ ] Play : Data Safety + Families remplis, AAB EAS, Internal testing OK.
- [ ] Apps pointent vers `https://api.kizzo.app` (et non la recette).
- [ ] Soumissions envoyées en review (iOS puis Android).

---

## 10. Bloqueurs hors périmètre code (rappel)

- **Couche native Android anti‑contournement (Lot E)** : non buildable sans
  toolchain Android / génération du projet natif (l'app enfant est en Expo
  managed). Cf. `LOT_E_NATIF_ANTICONTOURNEMENT.md`.
- **Détection d'intégrité appareil** (root/jailbreak/VPN tiers) : pas encore
  persistée côté serveur (pas de modèle `IntegrityReport`) — le back‑office
  `anomalies` la complétera quand le heartbeat natif la remontera.
- **QA sur appareils réels**, **comptes stores** et **clés live** : actions
  manuelles de Samuel, non automatisables.
