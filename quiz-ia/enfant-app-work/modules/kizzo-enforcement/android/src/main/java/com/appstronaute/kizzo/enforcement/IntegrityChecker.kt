package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. Détection de contournement (root / bypass).
 *
 * Rôle (anti-contournement) : produire l'IntegrityReport (cf. façade JS
 * src/native/enforcement.ts) consommé par le heartbeat et remonté au parent :
 *  - root / Magisk (su, build tags test-keys, chemins connus) ;
 *  - VPN tiers actif (court-circuite notre filtrage DNS) ;
 *  - mode développeur / ADB activé (bypass possible) ;
 *  - permissions critiques révoquées (accessibilité, overlay, usage, device admin) ;
 *  - (optionnel) Play Integrity API pour une attestation serveur forte.
 *
 * Aucune permission spéciale obligatoire (lectures système). Mappe les 14 points
 * AC-01..14 du CDC §20.3 — la correspondance exacte reste À CONFIRMER vs le CDC
 * (cf. doc, tableau AC).
 */

// import android.content.Context

data class IntegrityReport(
  val rooted: Boolean,
  val vpnActifTiers: Boolean,
  val accessibilityActif: Boolean,
  val deviceAdminActif: Boolean,
  val overlayAccorde: Boolean,
  val usageAccessAccorde: Boolean,
  val modeDeveloppeur: Boolean,
  val horodatage: String,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "rooted" to rooted,
    "vpnActifTiers" to vpnActifTiers,
    "accessibilityActif" to accessibilityActif,
    "deviceAdminActif" to deviceAdminActif,
    "overlayAccorde" to overlayAccorde,
    "usageAccessAccorde" to usageAccessAccorde,
    "modeDeveloppeur" to modeDeveloppeur,
    "horodatage" to horodatage,
  )
}

class IntegrityChecker {
  companion object {
    // fun report(context: Context): IntegrityReport { /* TODO: collecter chaque signal */ }
  }
}
