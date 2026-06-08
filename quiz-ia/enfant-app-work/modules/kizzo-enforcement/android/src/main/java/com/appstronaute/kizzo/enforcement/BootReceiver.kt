package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. BroadcastReceiver BOOT_COMPLETED.
 *
 * Rôle (anti-contournement) : relancer l'enforcement après un redémarrage
 * (un enfant qui reboote ne doit pas échapper au contrôle) :
 *  - redémarrer HeartbeatForegroundService ;
 *  - re-monter le VPN DNS si le filtrage était actif ;
 *  - ré-appliquer un éventuel verrou en cours.
 *
 * Manifest : RECEIVE_BOOT_COMPLETED + intent-filter BOOT_COMPLETED (déclaré par
 * withKizzoEnforcement). Sur Android récents, démarrer un foreground service
 * depuis le boot exige un type/permission appropriés.
 *
 * Couvre : AC (persistance au reboot).
 */

// import android.content.BroadcastReceiver
// import android.content.Context
// import android.content.Intent

class BootReceiver /* : BroadcastReceiver() */ {
  // override fun onReceive(context: Context, intent: Intent) {
  //   if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
  //     // TODO: HeartbeatForegroundService.start(context, heartbeatSeconds)
  //     // TODO: restaurer l'état d'enforcement persisté
  //   }
  // }
}
