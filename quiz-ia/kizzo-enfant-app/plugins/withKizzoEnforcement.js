/**
 * Config plugin Expo — couche native d'enforcement Kizzo (anti-contournement).
 *
 * ⚠️ SCAFFOLDING LOT E. Ce plugin déclare, au moment du `expo prebuild`, tout ce
 * que la couche Kotlin exige côté projet Android natif :
 *   - permissions sensibles (AndroidManifest)
 *   - déclaration des services / receivers (Accessibility, VPN, DeviceAdmin,
 *     Boot, foreground heartbeat)
 *   - méta-données + fichier de politique device-admin
 *
 * Il NE compile rien : il prépare le terrain. Le code Kotlin réel vit dans
 * `modules/kizzo-enforcement/android/...` et devra être branché comme module
 * Expo natif (ou copié dans le projet prébuild) — cf. LOT_E_NATIF_ANTICONTOURNEMENT.md.
 *
 * Tant que ce plugin n'est pas ajouté à `app.json > expo.plugins`, l'app reste
 * un build Expo managé classique et la façade `src/native/enforcement.ts`
 * retombe sur son repli no-op.
 *
 * Usage (à activer seulement quand la toolchain Android + le code Kotlin sont prêts) :
 *   "plugins": [ ["./plugins/withKizzoEnforcement", { "heartbeatSeconds": 60 }] ]
 */
const {
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

/** Permissions exigées par l'enforcement. Justification Play Store à fournir. */
const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.SYSTEM_ALERT_WINDOW', // lockscreen overlay
  'android.permission.PACKAGE_USAGE_STATS', // temps d'écran (special access)
  'android.permission.QUERY_ALL_PACKAGES', // lister apps à bloquer (justif Play)
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  // NB : BIND_VPN_SERVICE n'est PAS un uses-permission de l'app — c'est la
  // permission système portée par le <service> VpnService (cf. addComponents).
  // Le consentement VPN se gère au runtime via VpnService.prepare().
];

const PKG = 'com.appstronaute.kizzo.enforcement';

/** Ajoute les permissions au manifest. */
function addPermissions(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest['uses-permission'] = manifest['uses-permission'] || [];
  const existing = new Set(
    manifest['uses-permission'].map((p) => p.$['android:name']),
  );
  for (const name of PERMISSIONS) {
    if (!existing.has(name)) {
      manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
  }
  return androidManifest;
}

/** Déclare services + receivers de l'enforcement dans <application>. */
function addComponents(androidManifest, props) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  app.service = app.service || [];
  app.receiver = app.receiver || [];

  // 1. AccessibilityService — détection app au premier plan + blocage.
  app.service.push({
    $: {
      'android:name': `${PKG}.KizzoAccessibilityService`,
      'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android:exported': 'false',
    },
    'intent-filter': [
      { action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] },
    ],
    'meta-data': [
      {
        $: {
          'android:name': 'android.accessibilityservice',
          'android:resource': '@xml/kizzo_accessibility_config',
        },
      },
    ],
  });

  // 2. VpnService — filtrage DNS local (blocage domaines).
  app.service.push({
    $: {
      'android:name': `${PKG}.KizzoVpnDnsService`,
      'android:permission': 'android.permission.BIND_VPN_SERVICE',
      'android:exported': 'false',
    },
    'intent-filter': [{ action: [{ $: { 'android:name': 'android.net.VpnService' } }] }],
  });

  // 3. Foreground service heartbeat (survie + remontée d'intégrité).
  // Android 14+ : un FGS de type specialUse exige la <property> ci-dessous + une
  // justification dans la Play Console.
  app.service.push({
    $: {
      'android:name': `${PKG}.HeartbeatForegroundService`,
      'android:foregroundServiceType': 'specialUse',
      'android:exported': 'false',
    },
    property: [
      {
        $: {
          'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value': 'parental_control_enforcement',
        },
      },
    ],
  });

  // 4. DeviceAdminReceiver — anti-désinstallation / verrou.
  app.receiver.push({
    $: {
      'android:name': `${PKG}.KizzoDeviceAdminReceiver`,
      'android:permission': 'android.permission.BIND_DEVICE_ADMIN',
      'android:exported': 'true',
    },
    'meta-data': [
      {
        $: {
          'android:name': 'android.app.device_admin',
          'android:resource': '@xml/kizzo_device_admin',
        },
      },
    ],
    'intent-filter': [
      { action: [{ $: { 'android:name': 'android.app.action.DEVICE_ADMIN_ENABLED' } }] },
    ],
  });

  // 5. BootReceiver — relance l'enforcement au redémarrage.
  app.receiver.push({
    $: {
      'android:name': `${PKG}.BootReceiver`,
      'android:exported': 'true',
      'android:enabled': 'true',
    },
    'intent-filter': [
      {
        action: [
          { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
          { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
        ],
      },
    ],
  });

  // Heartbeat configurable (lu par le service natif via meta-data).
  app['meta-data'] = app['meta-data'] || [];
  app['meta-data'].push({
    $: {
      'android:name': 'com.kizzo.HEARTBEAT_SECONDS',
      'android:value': String(props.heartbeatSeconds ?? 60),
    },
  });

  return androidManifest;
}

/**
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {{ heartbeatSeconds?: number }} props
 */
module.exports = function withKizzoEnforcement(config, props = {}) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = addPermissions(cfg.modResults);
    cfg.modResults = addComponents(cfg.modResults, props);
    return cfg;
  });
};
