package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. Foreground service « heartbeat ».
 *
 * Rôle (anti-contournement) :
 *  - Service persistant (notification permanente) qui garde l'enforcement vivant
 *    et envoie un battement régulier au backend (PUT /api/device-state déjà livré)
 *    avec l'état d'intégrité (IntegrityChecker) + usage (UsageStatsCollector).
 *  - Si le backend ne reçoit plus de heartbeat → le parent est alerté (appareil
 *    potentiellement contourné / éteint).
 *  - Applique les quotas (lock si dépassé) à chaque tick.
 *
 * Manifest : FOREGROUND_SERVICE(+_SPECIAL_USE), type specialUse (déclaré par
 * withKizzoEnforcement). Intervalle lu via meta-data com.kizzo.HEARTBEAT_SECONDS.
 * Demander REQUEST_IGNORE_BATTERY_OPTIMIZATIONS pour éviter le kill par Doze.
 *
 * Couvre : AC (survie/persistance, télémétrie d'intégrité, application quotas).
 */

// import android.app.Service
// import android.content.Context
// import android.content.Intent

class HeartbeatForegroundService /* : Service() */ {
  companion object {
    // fun start(context: Context, intervalSeconds: Int) { /* startForegroundService */ }
    // fun stop(context: Context) { /* stopService */ }
  }
  // override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
  //   // TODO: startForeground(notif) ; planifier tick (Handler/WorkManager) :
  //   //   1) IntegrityChecker.report() + usage → POST device-state
  //   //   2) appliquer quotas / commandes en attente (lock/unlock)
  //   return 0 // START_STICKY
  // }
}
