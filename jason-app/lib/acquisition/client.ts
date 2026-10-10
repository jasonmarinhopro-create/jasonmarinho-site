// Provenance côté navigateur, sur la page d'inscription de l'app (10/10/2026).
// Les liens du site ajoutent acq_* (nav.js) ; un lien suivi qui mène
// directement ici apporte utm_* ; sinon on garde le site d'origine. Gardée le
// temps de l'onglet (le choix du profil recharge la page sans ces paramètres).
import { acquisitionFromParams, cleanAcquisition, type Acquisition } from './rules'

const KEY = 'jm_acq'

export function captureAcquisition(params: { get(name: string): string | null } | null): void {
  try {
    const fromUrl = params ? acquisitionFromParams(params) : null
    const stored = sessionStorage.getItem(KEY)
    if (fromUrl) {
      // Un lien avec campagne remplace une provenance sans campagne
      const prev = stored ? cleanAcquisition(JSON.parse(stored)) : null
      if (!prev || (fromUrl.campaign && !prev.campaign) || (fromUrl.source && !prev.source)) {
        sessionStorage.setItem(KEY, JSON.stringify({ ...fromUrl, at: fromUrl.at ?? new Date().toISOString() }))
      }
      return
    }
    if (stored) return
    let ref = ''
    try { ref = document.referrer ? new URL(document.referrer).hostname : '' } catch { ref = '' }
    sessionStorage.setItem(KEY, JSON.stringify({ ref, landing: window.location.pathname, at: new Date().toISOString() }))
  } catch { /* stockage refusé : pas de provenance */ }
}

export function storedAcquisition(): Acquisition | null {
  try { return cleanAcquisition(JSON.parse(sessionStorage.getItem(KEY) || 'null')) } catch { return null }
}

/** Paramètres acq_* à ajouter à un lien vers le site (inscription des pros, autre origine) */
export function acquisitionParams(): string {
  const a = storedAcquisition()
  if (!a) return ''
  const q = new URLSearchParams()
  const pairs: Array<[string, string | undefined]> = [['acq_s', a.source], ['acq_m', a.medium], ['acq_c', a.campaign], ['acq_r', a.ref], ['acq_l', a.landing], ['acq_t', a.at ?? new Date().toISOString()]]
  for (const [k, v] of pairs) if (v) q.set(k, v)
  return q.toString()
}
