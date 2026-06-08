# Patch — Filet de tests backend (Vitest)

Premier filet de tests d'intégration pour `kizzo-api`, à intégrer dans le repo agence.
**30 tests** qui tapent une vraie base Postgres (pas de mock) et couvrent les flux livrés.

## Ce que ça couvre
- **Auth** (15) : signup, doublon email, validation mot de passe/CGU, login (vérifié / non vérifié / mauvais mdp / verrouillage 5 échecs), vérification email, reset mot de passe, `/me` (token valide / absent / invalide), non-fuite du hash de mot de passe.
- **Enfants** (7) : CRUD complet + **isolation des données entre parents** (un parent ne voit pas l'enfant d'un autre).
- **Défis** (6) : liste des défis publiés uniquement, récupération avec questions, scoring quiz (réussite/échec + temps crédité), 404.
- **Health / 404** (2).

## Fichiers ajoutés (= le patch)
```
vitest.config.mts          # config Vitest (.mts car le projet est CommonJS)
tests/setup.ts             # truncate des tables avant chaque test (isolation)
tests/helpers.ts           # supertest + factory parent vérifié
tests/health.test.ts
tests/auth.test.ts
tests/children.test.ts
tests/challenges.test.ts
```
Dépendances dev ajoutées : `supertest`, `@types/supertest` (vitest était déjà présent).

## Pré-requis pour lancer
1. Une base Postgres de test (jamais la base de dev/prod — les tables sont **vidées** avant chaque test).
2. Variable `TEST_DATABASE_URL` (sinon défaut `postgresql://postgres:postgres@localhost:5432/kizzo_test?schema=public`).

```bash
# Postgres local (macOS, Homebrew) :
brew install postgresql@15 && brew services start postgresql@15
createdb kizzo_test
# Appliquer le schéma :
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kizzo_test?schema=public" npx prisma migrate deploy
# Lancer les tests :
npm test
```

## Notes d'intégration
- La config est en `.mts` car `kizzo-api` n'a pas `"type": "module"`. Si l'agence passe le projet en ESM, renommer en `.ts`.
- Le mailer (Resend) **simule** l'envoi quand `RESEND_API_KEY` est absent → aucun email réel pendant les tests.
- Les tests lisent les codes (vérif email / reset) directement en base, car ils ne sont pas renvoyés dans les réponses HTTP (bon comportement de sécurité).
- Recommandation CI : ajouter un service Postgres + `prisma migrate deploy` avant `npm test`.
