// Arrivée dans l'app après la connexion ou au lancement (07/11/2026, Jason :
// « un double saut, le logo disparaît et réapparaît »). Avant : connexion,
// puis /ouverture (écran au logo), puis /dashboard (second écran), puis, en
// mode admin, une redirection vers /dashboard/admin (troisième chargement).
// Désormais directement vers la bonne page : le cookie court « jm-launch »
// fait afficher l'écran de chargement tout de suite, puis il s'efface en
// fondu sur la page (app/dashboard/layout.tsx).
//
// 20/11/2026 (Jason : « le logo, une seconde la page devient blanche, le logo
// revient, puis il me connecte ») : le passage se faisait par un rechargement
// complet du document (location.replace / assign). Entre les deux documents,
// le navigateur (surtout Safari et l'app installée sur iPhone) affiche une
// page blanche le temps que le nouveau document arrive et charge ses styles.
// Le passage se fait maintenant par la navigation interne de Next (même
// document) : l'écran au logo reste affiché, puis celui du dashboard prend le
// relais sans blanc. Repli sur un rechargement complet si Next ne répond pas.
import { ADMIN_MODE_COOKIE } from './admin-mode'

export const LAUNCH_COOKIE = 'jm-launch'

/** Page d'arrivée selon les cookies de l'appareil (mode admin resté actif) */
export function launchTarget(cookieHeader: string, search = ''): string {
  const admin = cookieHeader.split(/;\s*/).includes(`${ADMIN_MODE_COOKIE}=1`)
  return admin ? '/dashboard/admin' : `/dashboard${search}`
}

export function markLaunch() {
  try { document.cookie = `${LAUNCH_COOKIE}=1; Path=/; Max-Age=20; SameSite=Lax; Secure` } catch { /* ignore */ }
}

/**
 * Va dans l'app. Avec le routeur de Next : navigation interne (pas de page
 * blanche). Sans : rechargement complet, comme avant.
 */
export function goToApp(router?: { replace: (href: string) => void }, search = '') {
  markLaunch()
  const target = launchTarget(document.cookie, search)
  if (!router) { window.location.assign(target); return }
  try { router.replace(target) } catch { window.location.assign(target) }
}
