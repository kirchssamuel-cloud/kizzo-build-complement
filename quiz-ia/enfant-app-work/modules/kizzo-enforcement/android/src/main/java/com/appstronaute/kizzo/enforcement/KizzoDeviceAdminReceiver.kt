package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. DeviceAdminReceiver.
 *
 * Rôle (anti-contournement) :
 *  - Empêcher la désinstallation de Kizzo et la désactivation de l'admin sans
 *    le code parent (onDisableRequested → écran de confirmation/contre-mesure).
 *  - Verrouiller l'écran à la demande (lockNow « dur » via DevicePolicyManager).
 *  - Idéalement : déployé en « device owner » (kiosque) pour les appareils
 *    dédiés enfant → bien plus robuste que l'admin simple.
 *
 * Manifest : BIND_DEVICE_ADMIN + meta-data @xml/kizzo_device_admin (déclaré par
 * withKizzoEnforcement). Le fichier kizzo_device_admin.xml liste les policies
 * (force-lock, watch-login, disable-camera optionnel…).
 *
 * Couvre : AC (anti-désinstallation, verrou matériel, persistance).
 */

// import android.app.admin.DeviceAdminReceiver
// import android.content.Context
// import android.content.Intent

class KizzoDeviceAdminReceiver /* : DeviceAdminReceiver() */ {
  // override fun onDisableRequested(context: Context, intent: Intent): CharSequence =
  //   "Désactiver Kizzo nécessite le code parent." // + déclencher contre-mesure
  // override fun onEnabled(context: Context, intent: Intent) { /* log + heartbeat */ }
}
