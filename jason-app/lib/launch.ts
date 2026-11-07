// Arrivée dans l'app après la connexion (07/11/2026, Jason : « un double saut,
// le logo disparaît et réapparaît »). Avant : connexion, puis /ouverture
// (écran au logo), puis /dashboard (second écran), puis, en mode admin, une
// redirection vers /dashboard/admin (troisième chargement). Désormais un seul
// chargement, directement vers la bonne page : le cookie court « jm-launch »
// fait afficher l'écran de chargement tout de suite, puis il s'efface en
// fondu sur la page (app/dashboard/layout.tsx).
import { ADMIN_MODE_COOKIE } from './admin-mode'

/** Page d'arrivée selon les cookies de l'appareil (mode admin resté actif) */
export function launchTarget(cookieHeader: string, search = ''): string {
  const admin = cookieHeader.split(/;\s*/).includes(`${ADMIN_MODE_COOKIE}=1`)
  return admin ? '/dashboard/admin' : `/dashboard${search}`
}

export function goToApp() {
  try { document.cookie = 'jm-launch=1; Path=/; Max-Age=20; SameSite=Lax; Secure' } catch { /* ignore */ }
  window.location.assign(launchTarget(document.cookie))
}
