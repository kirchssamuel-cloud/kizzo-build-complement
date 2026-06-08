# Kizzo API

Backend Express + Prisma pour les applications mobiles **Kizzo Parent** et **Kizzo Enfant** (contrôle parental éducatif Appstronaute).

## Stack

- Node.js 18+ · Express 5 · TypeScript
- Prisma 6 + PostgreSQL 15
- Zod (validation) · JWT (auth) · bcryptjs (mot de passe)
- Pino (logs) · Helmet, CORS, rate-limit (sécurité)
- Resend (email transactionnel) · jose / google-auth-library (OAuth)

## Démarrer

```bash
# 1) Postgres en local
docker compose up -d

# 2) Dépendances
npm install

# 3) DB
npm run prisma:migrate     # première migration
npm run prisma:seed        # comptes admin + parent démo

# 4) Dev
cp .env.example .env       # ajuste les secrets
npm run dev                # http://localhost:8000
```

## Structure des modules

```
src/
├── config/          # env, prisma, logger, mail, consts
├── lib/             # email-templates, oauth-verify
├── middleware/      # auth, error, validate, async-handler
├── utils/           # jwt, email, random, date
├── modules/         # transverse — auth, health
├── modules-parent/  # children, devices, screen-time, notifications
├── modules-enfant/  # home, challenges, requests
├── modules-admin/   # auth, users, …
└── routes/index.ts  # mount tree
```

Chaque module suit le pattern `controller / route / schema / service`.

## Convention API

- Préfixes : `/api/auth`, `/api/parent/*`, `/api/enfant/*`, `/api/admin/*`
- Auth : `Authorization: Bearer <jwt>`
- Réponses erreur : `{ message, errors?, details? }` (cf. `error.middleware.ts`)

## Comptes seed (`npm run prisma:seed`)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@appstronaute.com` | `AdminKizzo2025!` | administrateur |
| `parent@demo.kizzo` | `Demo1234!` | parent |
