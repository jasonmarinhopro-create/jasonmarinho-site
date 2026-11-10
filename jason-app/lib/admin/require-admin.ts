// Garde des pages admin (10/11/2026). Avant, chaque page admin refaisait
// getUser() (aller-retour vers le serveur d'authentification Supabase, 4 à
// 8 s mesurés quand la base est chargée) puis relisait profiles.role, alors
// que le layout venait de lire la session et le profil. getProfile est
// partagé avec le layout (React cache) et vérifie le jeton par sa signature
// (getClaims, clés asymétriques) : même sécurité, zéro appel en plus.
import 'server-only'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'

export async function requireAdmin() {
  const me = await getProfile()
  if (!me) redirect('/auth/login')
  if (me.role !== 'admin') redirect('/dashboard')
  return me
}
