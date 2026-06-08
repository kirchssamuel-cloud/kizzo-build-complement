package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. Collecte du temps d'écran par app.
 *
 * Rôle : via UsageStatsManager (permission spéciale PACKAGE_USAGE_STATS,
 * accordée par l'utilisateur dans Réglages > Accès aux données d'utilisation),
 * agréger le temps passé par application pour :
 *  - alimenter le rapport d'activité parent (déjà côté backend : module activity) ;
 *  - déclencher le blocage quand le quota quotidien d'une RegleApp est atteint.
 *
 * Pas de service propre : interrogé périodiquement par HeartbeatForegroundService.
 *
 * Couvre : AC (mesure temps d'écran, application des quotas).
 */

// import android.app.usage.UsageStatsManager

class UsageStatsCollector {
  companion object {
    // fun usageSince(context: Context, sinceMillis: Long): Map<String, Long> {
    //   // TODO: queryUsageStats(INTERVAL_DAILY, since, now) → pkg -> totalTimeInForeground
    //   return emptyMap()
    // }
  }
}
