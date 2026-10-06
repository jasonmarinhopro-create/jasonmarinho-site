// Fiches pros rattachées à un compte admin (06/10/2026) : la fiche de
// démonstration de Jason (« Camille Sénéchal ») était présentée comme une
// vraie photographe sur l'annuaire et la page Lyon. Les fiches d'un compte
// admin servent aux essais : jamais publiées par les builds du site.
export async function adminOwnedIds({ supabaseUrl, serviceKey, table }) {
  if (!supabaseUrl || !serviceKey) return new Set()
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' }
  try {
    const admins = await (await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&role=eq.admin`, { headers })).json()
    const ids = (Array.isArray(admins) ? admins : []).map(a => a.id).filter(Boolean)
    if (!ids.length) return new Set()
    const rows = await (await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&user_id=in.(${ids.join(',')})`, { headers })).json()
    return new Set((Array.isArray(rows) ? rows : []).map(r => r.id))
  } catch {
    return new Set()
  }
}
