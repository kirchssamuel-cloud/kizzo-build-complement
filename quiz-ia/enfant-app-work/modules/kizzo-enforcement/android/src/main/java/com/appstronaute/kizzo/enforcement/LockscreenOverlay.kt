package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. Verrouillage par overlay système.
 *
 * Rôle : afficher un overlay plein écran non esquivable (TYPE_APPLICATION_OVERLAY,
 * permission SYSTEM_ALERT_WINDOW) qui couvre toute app non autorisée et présente
 * l'écran « Kizzo verrouillé » (parcours quiz pour regagner du temps).
 *
 * Déclenché par : commande parent `lockNow` (push/heartbeat), quota atteint,
 * détection app interdite par l'AccessibilityService.
 *
 * Manifest : SYSTEM_ALERT_WINDOW (déclaré par withKizzoEnforcement).
 *
 * Couvre : AC (blocage effectif, écran de verrouillage P-enfant Locked).
 */

// import android.view.WindowManager
// import android.content.Context

class LockscreenOverlay {
  companion object {
    // fun show(context: Context, message: String?) { /* WindowManager.addView(overlay) */ }
    // fun hide(context: Context) { /* WindowManager.removeView(overlay) */ }
  }
}
