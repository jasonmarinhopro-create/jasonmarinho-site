// Mode admin (affichage propre à l'appareil, cf. Sidebar.tsx) : gardé en
// localStorage pour la barre latérale ET dans un cookie lu par l'Accueil,
// qui envoie alors directement sur la Vue d'ensemble côté serveur. Ce n'est
// pas un droit : le rôle admin est revérifié à chaque page /dashboard/admin.
export const ADMIN_MODE_COOKIE = 'jm-admin-mode'

export function writeAdminModeCookie(on: boolean) {
  try {
    document.cookie = on
      ? `${ADMIN_MODE_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
      : `${ADMIN_MODE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`
  } catch { /* ignore */ }
}
