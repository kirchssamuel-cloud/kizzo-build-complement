# Lot E — Couche native Android anti-contournement (cadrage + scaffolding)

> **Statut : SCAFFOLDING uniquement.** Ce lot prépare la structure, les contrats
> et la documentation. **Aucun code natif n'est compilé** : la toolchain Android
> (Android Studio / SDK / NDK / JDK) n'est pas installée sur la machine de build,
> et cette couche exige un `expo prebuild` (eject managé → projet natif). C'est
> le bloc **No-Go stores** du CDC §20.3 — le plus lourd, et celui que l'agence
> devait livrer (L2/L3).
>
> Mis à jour : run autonome 2026-06-05.

## 0. Ce qui est livré ici (et ce qui ne l'est pas)

**Livré (scaffolding, prêt à brancher) :**
- `quiz-ia/enfant-app-work/src/native/enforcement.ts` — **façade TypeScript** typée + **repli no-op** (l'app reste fonctionnelle sans le natif ; tsc vert). Contrat figé que le reste de l'app consomme déjà.
- `quiz-ia/enfant-app-work/plugins/withKizzoEnforcement.js` — **config plugin Expo** : injecte permissions + services + receivers dans l'AndroidManifest au `prebuild`.
- `quiz-ia/enfant-app-work/modules/kizzo-enforcement/android/.../*.kt` — **8 stubs Kotlin** commentés (contrat + checklist d'implémentation, ne compilent pas tels quels).

**NON livré (nécessite toolchain Android + agence) :**
- L'implémentation réelle du Kotlin, le `prebuild`, le branchement Expo Modules, les ressources XML (`kizzo_accessibility_config.xml`, `kizzo_device_admin.xml`), le QA sur appareils physiques.

## 1. Composants natifs (8) — rôle, API Android, couverture

| Composant (Kotlin) | API Android | Permission / manifest | Rôle anti-contournement |
|---|---|---|---|
| `KizzoAccessibilityService` | `AccessibilityService` | `BIND_ACCESSIBILITY_SERVICE` + `@xml/kizzo_accessibility_config` | Détecte l'app au 1er plan → bloque app non autorisée / hors quota ; contre l'accès aux réglages sensibles |
| `KizzoVpnDnsService` | `VpnService` (tunnel loopback) | `BIND_VPN_SERVICE` | Filtrage **DNS local** : blocklist domaines + SafeSearch forcé (<12 ans) |
| `UsageStatsCollector` | `UsageStatsManager` | `PACKAGE_USAGE_STATS` (special access) | Mesure le temps d'écran par app → quotas + rapport parent |
| `LockscreenOverlay` | `WindowManager` `TYPE_APPLICATION_OVERLAY` | `SYSTEM_ALERT_WINDOW` | Écran de verrouillage non esquivable (regagner du temps via quiz) |
| `KizzoDeviceAdminReceiver` | `DevicePolicyManager` | `BIND_DEVICE_ADMIN` + `@xml/kizzo_device_admin` | Anti-désinstallation, verrou matériel, persistance (idéal : device owner / kiosque) |
| `BootReceiver` | `BroadcastReceiver` | `RECEIVE_BOOT_COMPLETED` | Relance l'enforcement après reboot |
| `HeartbeatForegroundService` | `Service` foreground | `FOREGROUND_SERVICE(_SPECIAL_USE)`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Survit en tâche de fond, envoie le battement + intégrité au backend (`PUT /api/device-state` déjà livré), applique les quotas |
| `IntegrityChecker` | lectures système / Play Integrity | — | Détecte root/Magisk, VPN tiers, mode dev, permissions révoquées → `IntegrityReport` |

Pont JS↔natif : `KizzoEnforcementModule.kt` (Expo Module `KizzoEnforcement`), contrat synchronisé avec `enforcement.ts`.

## 2. Correspondance AC-01..14 (CDC §20.3)

Les 14 critères anti-contournement « AC-01..14 » du CDC §20.3. **AC-05 à AC-13
sont des libellés VÉRIFIÉS** : ils sont recopiés du code natif réel de l'agence
(`kizzo-app-poc/.../AntiBypassModule.kt`, méthode `runFullSecurityScan()` — codes
émis dans les events). **AC-01 à AC-04 et AC-14 ne figurent pas dans ce code** :
leur libellé exact reste à recopier du CDC PDF (`Partie 2`, §20.3), non disponible
sur la machine de build — la colonne « hypothèse » est indicative, **à confirmer**.

| AC | Libellé / contrôle | Source | Composant Lot E responsable | Signal `IntegrityReport` |
|---|---|---|---|---|
| AC-01 | *Blocage app non autorisée* (hypothèse) | ⚠️ à confirmer CDC | `KizzoAccessibilityService` (+ `LockscreenOverlay`) | `accessibilityActif` |
| AC-02 | *Quota temps d'écran* (hypothèse) | ⚠️ à confirmer CDC | `UsageStatsCollector` + `HeartbeatForegroundService` | `usageAccessAccorde` |
| AC-03 | *Filtrage web / SafeSearch* (hypothèse) | ⚠️ à confirmer CDC | `KizzoVpnDnsService` | — (DNS local) |
| AC-04 | *Anti-désinstallation* (hypothèse) | ⚠️ à confirmer CDC | `KizzoDeviceAdminReceiver` (Device Owner idéal) | `deviceAdminActif` |
| **AC-05** | **VPN Kizzo non actif** (« VPN not running ») | ✅ code agence | `KizzoVpnDnsService` | *(vpn actif)* |
| **AC-06** | **VPN tiers détecté** (court-circuite le filtrage) | ✅ code agence | `IntegrityChecker` | `vpnActifTiers` |
| **AC-07** | **Service d'accessibilité désactivé** | ✅ code agence | `KizzoAccessibilityService` | `accessibilityActif` |
| **AC-08** | **Permission overlay révoquée** | ✅ code agence | `LockscreenOverlay` | `overlayAccorde` |
| **AC-09** | **Accès aux stats d'usage révoqué** | ✅ code agence | `UsageStatsCollector` | `usageAccessAccorde` |
| **AC-10** | **Mode avion activé** (coupe le heartbeat) | ✅ code agence | `IntegrityChecker` | `modeAvion` |
| **AC-11** | **Mode développeur activé** (ADB / bypass) | ✅ code agence | `IntegrityChecker` | `modeDeveloppeur` |
| **AC-12** | **Root / Magisk détecté** | ✅ code agence | `IntegrityChecker` | `rooted` |
| **AC-13** | **Service de premier plan arrêté** (anti-kill) | ✅ code agence | `HeartbeatForegroundService` | *(heartbeat reçu)* |
| AC-14 | *Persistance après reboot* (hypothèse) | ⚠️ à confirmer CDC | `BootReceiver` + `HeartbeatForegroundService` | *(heartbeat reçu après reboot)* |

> **Note** : `IntegrityReport` (façade `enforcement.ts`) couvre désormais AC-06,
> 07, 08, 09, **10** (`modeAvion`), 11, 12. Le natif devra simplement renseigner
> `modeAvion` et le remonter dans le heartbeat `PUT /api/device-state` (le champ
> existe déjà côté contrat TS, repli no-op `false`).
>
> **Action CDC restante** : ouvrir le CDC §20.3 (PDF Partie 2) et **recopier mot
> pour mot AC-01 à AC-04 et AC-14** pour figer leur libellé exact (les hypothèses
> ci-dessus s'appuient sur les catégories anti-contournement du §20.2/§20.3, mais
> ne remplacent pas le texte contractuel).

## 3. Conformité Google Play (risque de rejet — à arbitrer AVANT dev)

Ces API sont **sous surveillance renforcée** de Google. Un mauvais cadrage =
rejet ou suspension :
- **AccessibilityService** : usage « contrôle parental » à déclarer et justifier (politique Accessibility API). Risque élevé sans déclaration adéquate.
- **VpnService** : politique « VpnService » — usage filtrage local OK si transparent (pas d'exfiltration), à documenter.
- **PACKAGE_USAGE_STATS / QUERY_ALL_PACKAGES** : justification « core functionality » obligatoire dans la console.
- **Device Admin** : déprécié pour beaucoup d'usages → privilégier **Device Owner** (provisioning, appareils dédiés enfant) ou **managed configurations**.
- **DoH / VPN tiers (risque #1)** : le DNS-over-HTTPS du navigateur et un VPN tiers **court-circuitent** le filtrage. Mitigation : politique « 1 seul VPN », blocage DoH connus, alerte parent via `IntegrityReport`. À assumer comme limite produit.

**Note d'implémentation — permissions « special access » (pas de dialogue runtime classique)** : `PACKAGE_USAGE_STATS`, `SYSTEM_ALERT_WINDOW`, l'activation de l'AccessibilityService et du Device Admin ne s'accordent **pas** via `requestPermissions` standard. Le `requestPermission(...)` natif devra router l'utilisateur vers l'écran Réglages adéquat : `Settings.ACTION_USAGE_ACCESS_SETTINGS`, `ACTION_MANAGE_OVERLAY_PERMISSION`, `ACTION_ACCESSIBILITY_SETTINGS`, `DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN`. Le VPN se confirme via `VpnService.prepare()`.

## 4. Matrice de QA appareils physiques (CDC §20.2)

Le QA anti-contournement **ne peut pas se faire en émulateur seul**. Prévoir :
- ≥ 3 constructeurs (Samsung One UI, Xiaomi MIUI, stock/Pixel) — les surcouches tuent les services de fond différemment.
- ≥ 2 versions Android (la plus basse supportée + la plus récente).
- Scénarios : reboot, kill app, révocation permission, activation VPN tiers, mode avion, changement d'heure, désinstallation forcée, mode sans échec.

## 5. Étapes d'intégration (quand toolchain + agence prêtes)

1. Installer la toolchain : JDK 17, Android SDK/Platform-Tools, Android Studio.
2. `expo prebuild -p android` (génère `android/`). ⚠️ quitte le managed workflow.
3. Brancher `modules/kizzo-enforcement` comme **Expo Module local** (autolinking) ou copier les sources dans le projet prébuild.
4. Ajouter à `app.json > expo.plugins` : `["./plugins/withKizzoEnforcement", { "heartbeatSeconds": 60 }]`.
5. Créer les ressources XML manquantes (`res/xml/kizzo_accessibility_config.xml`, `res/xml/kizzo_device_admin.xml`).
6. Implémenter chaque stub Kotlin (cf. TODO dans les fichiers) + tests instrumentés.
7. QA matrice §4 → cocher AC-01..14 → seulement alors lever le No-Go §20.3.

## 6. Lien avec le backend (déjà livré)

La couche native **consomme des endpoints déjà construits** côté `kizzo-api` — rien à refaire serveur :
- `PUT /api/device-state` — heartbeat + état d'intégrité.
- `GET /api/parent/web-filter/:childId` — blocklist/SafeSearch → `setDnsBlocklist`.
- `GET /api/parent/apps/:childId` — règles d'app → `setBlockedApps`.
- `POST /api/parent/devices/lock` — commande `lockNow` (push).
- `GET /api/parent/unlock-requests` / `respond` — temps accordé.

Le natif est donc le **dernier maillon manquant**, pas un nouveau système : toute
la logique métier (quotas, filtres, abonnement, quiz) est déjà en place et testée
(101 tests Vitest verts).

## 7. Recommandation

C'est un livrable **agence** (compétence Kotlin natif + appareils de test + cadrage
Play). Le scaffolding ci-dessus fige le contrat et réduit l'ambiguïté pour le devis :
8 composants identifiés, manifest pré-câblé, façade JS prête. À chiffrer composant
par composant contre les 14 AC du CDC.
