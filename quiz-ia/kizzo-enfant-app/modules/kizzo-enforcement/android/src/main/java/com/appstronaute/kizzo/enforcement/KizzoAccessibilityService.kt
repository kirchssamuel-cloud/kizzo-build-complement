package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. AccessibilityService.
 *
 * Rôle (anti-contournement) :
 *  - Détecter l'app au premier plan (TYPE_WINDOW_STATE_CHANGED) pour bloquer
 *    en temps réel une app non autorisée (RegleApp.autorisee=false) ou hors
 *    quota → ramener l'utilisateur à l'écran de verrouillage Kizzo.
 *  - Détecter les tentatives d'accès aux Réglages Android sensibles
 *    (désactivation accessibilité / device admin / désinstallation) et
 *    contrer (overlay + log incident).
 *
 * Manifest : déclaré par withKizzoEnforcement (BIND_ACCESSIBILITY_SERVICE +
 * meta-data @xml/kizzo_accessibility_config).
 *
 * ⚠️ Play Store : l'usage d'AccessibilityService pour le contrôle parental doit
 * être justifié dans la Data Safety + politique « Accessibility API » de Google,
 * sinon rejet. À cadrer (cf. doc §Conformité Play).
 *
 * Couvre : AC (détection app 1er plan, anti-désactivation réglages).
 */

// import android.accessibilityservice.AccessibilityService
// import android.view.accessibility.AccessibilityEvent

class KizzoAccessibilityService /* : AccessibilityService() */ {
  // override fun onAccessibilityEvent(event: AccessibilityEvent?) {
  //   val pkg = event?.packageName?.toString() ?: return
  //   // TODO: si pkg ∈ blocklist courante OU quota dépassé → LockscreenOverlay.show()
  //   // TODO: si pkg == "com.android.settings" et écran sensible → contrer
  // }
  // override fun onInterrupt() {}
}
