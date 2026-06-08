package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. Pont React Native ↔ couche native d'enforcement.
 *
 * Expose à JS (`NativeModules.KizzoEnforcement`, cf. src/native/enforcement.ts)
 * les commandes d'application des règles. Aucune logique réelle ici : chaque
 * méthode délègue aux composants natifs (Accessibility / Vpn / DeviceAdmin /
 * Overlay / Heartbeat / Integrity), à implémenter.
 *
 * Cible : module Expo natif (expo-modules-core `Module`) OU module RN classique.
 * Choix retenu = Expo Modules (le projet est Expo) → adapter la signature au
 * runtime Expo lors de l'implémentation. Le code ci-dessous est volontairement
 * un squelette commenté : il NE compile pas tel quel (dépendances natives à
 * brancher) et sert de contrat + checklist d'implémentation.
 *
 * Contrat JS (doit rester synchronisé avec src/native/enforcement.ts) :
 *   isAvailable(): Boolean
 *   getPermissionStatus(p): "granted" | "denied" | "unavailable"
 *   requestPermission(p): même type
 *   lockNow(message?), unlock()
 *   setBlockedApps(bundleIds: List<String>)
 *   setDnsBlocklist(domains: List<String>)
 *   startHeartbeat(intervalSeconds: Int), stopHeartbeat()
 *   getIntegrityReport(): IntegrityReport (JSON)
 */

// import expo.modules.kotlin.modules.Module
// import expo.modules.kotlin.modules.ModuleDefinition

class KizzoEnforcementModule {
  // TODO(Lot E) : étendre expo.modules.kotlin.modules.Module et déclarer
  // les AsyncFunction(...) ci-dessous dans definition().
  //
  // override fun definition() = ModuleDefinition {
  //   Name("KizzoEnforcement")
  //   AsyncFunction("isAvailable") { true }
  //   AsyncFunction("getPermissionStatus") { p: String -> PermissionGate.status(appContext, p) }
  //   AsyncFunction("requestPermission") { p: String -> PermissionGate.request(appContext, p) }
  //   AsyncFunction("lockNow") { message: String? -> LockscreenOverlay.show(appContext, message) }
  //   AsyncFunction("unlock") { LockscreenOverlay.hide(appContext) }
  //   AsyncFunction("setBlockedApps") { ids: List<String> -> AppBlockStore.set(appContext, ids) }
  //   AsyncFunction("setDnsBlocklist") { domains: List<String> -> KizzoVpnDnsService.setBlocklist(appContext, domains) }
  //   AsyncFunction("startHeartbeat") { seconds: Int -> HeartbeatForegroundService.start(appContext, seconds) }
  //   AsyncFunction("stopHeartbeat") { HeartbeatForegroundService.stop(appContext) }
  //   AsyncFunction("getIntegrityReport") { IntegrityChecker.report(appContext).toMap() }
  // }
}
