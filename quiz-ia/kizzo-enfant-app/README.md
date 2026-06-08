# Patch app enfant — Parcours Quiz IA (Lot B)

Overlay additif pour `kizzo-enfant-app`. À déposer dans le projet agence en
recopiant `src/` par-dessus l'existant (aucun fichier agence n'est supprimé ;
`navigation/types.ts` et `navigation/AppStack.tsx` sont remplacés par des
versions étendues, le reste est nouveau).

## Contenu

| Fichier | Rôle | CDC |
|---|---|---|
| `src/services/api/quiz.ts` | Client typé du BFF `/api/quiz` (génération thème/photo, get, submit, historique). Réponses masquées (pas de `reponse`/`explication`). | §16 |
| `src/hooks/quiz.ts` | Hooks react-query (génération, lecture, soumission, historique) + invalidation home/historique. | — |
| `src/components/quiz/QuestionRenderer.tsx` | Rend les 6 types : QCM4, VF, FILL(texte), CALC, SORT(tri), MATCH(association). Encode la réponse en chaîne (JSON pour tri/association). | E10-E15 |
| `src/screens/quiz/QuizStartScreen.tsx` | Lancement : matière + chapitre → génération thème, ou photo du devoir → génération photo. Loader pendant génération. | E09, E18 |
| `src/screens/quiz/QuizPlayScreen.tsx` | Lecteur multi-questions + barre de progression + écran résultat (temps gagné). | E10-E19 |
| `src/screens/quiz/QuizHistoryScreen.tsx` | Historique des tentatives de l'enfant. | E30 |
| `src/navigation/types.ts` | Ajoute `QuizStart`, `QuizPlay`, `QuizHistory`. | — |
| `src/navigation/AppStack.tsx` | Enregistre les 3 écrans quiz. | — |

## Dépendance à ajouter

La génération par photo utilise la caméra :

```bash
npx expo install expo-image-picker
```

(Toutes les autres dépendances sont déjà présentes : axios, @tanstack/react-query,
react-hook-form, dayjs, lucide-react-native, react-native-toast-message, etc.)

## Point d'entrée

Brancher le parcours depuis l'accueil — une ligne dans `src/screens/home/HomeScreen.tsx` :

```diff
- <Button variant="outline" onPress={() => navigation.navigate('Defis')}>
+ <Button variant="outline" onPress={() => navigation.navigate('QuizStart')}>
    Lancer un quiz
  </Button>
```

Et, au besoin, un accès à l'historique (`navigation.navigate('QuizHistory')`).

## Système de design

Écrans alignés sur le **système de tokens courant** (`kz-cyan`, `kz-orange`,
`kz-surface`, `kz-ink`, `kz-ink-soft`, `kz-green`…), celui de `HomeScreen`/`Button`.
⚠️ Les écrans `defis/` de l'agence utilisent des tokens obsolètes
(`kz-primary`, `kz-success`, `kz-muted`, `kz-card`…) **non définis** dans
`tailwind.config.js` : ils rendent sans couleur. À harmoniser séparément.

## Vérification

`tsc --noEmit` sur la copie de travail (deps installées + `expo-image-picker`).
Pas d'exécution runtime possible ici (Expo managed, pas de toolchain Android sur la machine).
