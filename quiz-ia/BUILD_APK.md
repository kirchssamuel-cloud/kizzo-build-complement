# Obtenir un APK Kizzo testable (app enfant) — EAS Build

Chemin le plus rapide vers une vraie app installable sur un téléphone Android,
**sans installer le SDK Android lourd** (le build se fait dans le cloud Expo).

Projet prêt : `~/Kizzo/kizzo-claude-build/quiz-ia/enfant-app-work/`
(copie agence + parcours quiz Lot B + deps installées + `eas.json` configuré + `tsc` vert).

## Étapes (3 commandes, ~10-15 min de build cloud)

1. **Créer un compte Expo (gratuit)** si pas déjà fait :
   👉 https://expo.dev/signup

2. **Se connecter** en terminal (c'est toi qui saisis l'identifiant/mdp) :
   ```bash
   cd ~/Kizzo/kizzo-claude-build/quiz-ia/enfant-app-work
   eas login
   ```

3. **Lancer le build APK** (profil `preview` = APK autonome, sans serveur de dev) :
   ```bash
   eas build --platform android --profile preview
   ```
   - La 1ʳᵉ fois, EAS propose de créer le projet et de générer un keystore : répondre **oui** (il gère tout).
   - À la fin, EAS affiche un **lien de téléchargement de l'APK** + un QR code.
   - Sur le téléphone Android : ouvrir le lien, télécharger, installer (autoriser « sources inconnues »).

## ⚠️ Important pour tester en vrai (login, quiz…)

L'app pointe pour l'instant vers `http://localhost:8000/api` (dans `app.json` → `extra.API_URL`).
Sur un téléphone, « localhost » = le téléphone lui-même, donc **le backend ne sera pas joignable**.

Pour un test bout-en-bout (création de compte, appairage, génération de quiz), il faut
**un backend joignable publiquement**. Deux options :
- **Rapide / test** : exposer le backend local via un tunnel (ex. `npx ngrok http 8000`) et mettre l'URL https du tunnel dans `extra.API_URL`.
- **Propre** : déployer `kizzo-api` sur un serveur (à cadrer — ce sera nécessaire de toute façon).

Sans ça, l'APK se lance et on peut naviguer dans l'UI, mais les appels réseau échoueront.

## Build de l'app PARENT

Même procédure dans le dossier de l'app parent une fois le Lot C intégré
(il faudra y copier un `eas.json` identique). On le fera quand le Lot C sera prêt.
