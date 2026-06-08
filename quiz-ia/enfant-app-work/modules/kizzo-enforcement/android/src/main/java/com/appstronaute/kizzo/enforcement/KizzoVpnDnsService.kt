package com.appstronaute.kizzo.enforcement

/*
 * ⚠️ SCAFFOLDING LOT E — STUB. VpnService = filtrage DNS local.
 *
 * Rôle (anti-contournement) :
 *  - Monter un VPN local « loopback » (pas de serveur distant) qui intercepte
 *    les requêtes DNS et bloque les domaines de la blocklist (FiltreContenu :
 *    catégories bloquées + blacklist + SafeSearch forcé <12 ans).
 *  - Forcer SafeSearch (réécriture DNS google/bing/youtube vers les variantes
 *    restreintes) côté résolution.
 *
 * Manifest : déclaré par withKizzoEnforcement (BIND_VPN_SERVICE).
 * Consentement : VpnService.prepare() exige une autorisation utilisateur unique.
 *
 * ⚠️ Limite connue : un VPN tiers actif OU le DNS-over-HTTPS du navigateur
 * (DoH, ex. Chrome) court-circuite ce filtrage → c'est le risque #1 identifié
 * (cf. project_kizzo_mobile_app). Mitigation : détecter VPN tiers / DoH via
 * IntegrityChecker + politique « 1 seul VPN » via DeviceAdmin/managed config.
 *
 * Couvre : AC (filtrage web, SafeSearch, blocage domaines).
 */

// import android.net.VpnService
// import android.content.Intent

class KizzoVpnDnsService /* : VpnService() */ {
  companion object {
    // fun setBlocklist(context: Context, domains: List<String>) { /* persiste + reconfigure le tunnel */ }
  }
  // override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
  //   // TODO: établir l'interface tun, boucle de lecture des paquets, parse DNS,
  //   //       drop/redirect selon blocklist + SafeSearch. START_STICKY.
  //   return 0
  // }
}
