// Connexion avec Google : le bouton n'apparaît que si le fournisseur Google est
// activé dans Supabase (Authentication > Providers). Lu dans les réglages
// publics d'Auth, gardé 10 minutes. En cas d'erreur : pas de bouton.
export async function googleActif(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return false
    const json = await res.json() as { external?: Record<string, boolean> }
    return json.external?.google === true
  } catch {
    return false
  }
}

/** Cookie posé juste avant le départ vers Google : profil choisi, lettre, provenance. */
export const COOKIE_INSCRIPTION = 'jm_inscription'
