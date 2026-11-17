// Suivi d'activité d'un pro pour l'admin (17/11/2026, demande de Jason : voir
// comment chaque pro gère ses demandes). Seulement des données de
// fonctionnement : date, origine (fiche ou Trouver un pro) et statut des
// demandes, nombre et statut des clients du carnet. Jamais le nom, l'e-mail,
// le téléphone ni le message de l'hôte, ni les notes du pro : la politique de
// confidentialité promet que Jason ne lit pas le contenu (partie 6).

export interface SuiviContact { created_at: string; status: string | null; source_url: string | null }
export interface SuiviClient { statut: string | null }

export const STATUTS_DEMANDE = [
  ['nouvelle', 'Pas encore traitée'],
  ['repondue', 'Répondue'],
  ['devis_envoye', 'Devis envoyé'],
  ['gagnee', 'Client gagné'],
  ['perdue', 'Perdue'],
] as const

export type StatutDemande = typeof STATUTS_DEMANDE[number][0]

export interface SuiviActivite {
  total: number
  derniers30: number
  directes: number
  trouverUnPro: number
  parStatut: Record<StatutDemande, number>
  /** Part des demandes que le pro a fait avancer (statut autre que « nouvelle »), en % ; null sans demande */
  tauxTraite: number | null
  /** Demandes encore « nouvelle » et la plus ancienne d'entre elles, en jours */
  enAttente: number
  plusVieilleAttenteJours: number | null
  derniere: string | null
  /** 6 derniers mois, du plus ancien au plus récent (clé AAAA-MM, fuseau Paris) */
  parMois: { mois: string; n: number }[]
  clients: number
  clientsParStatut: { statut: string; n: number }[]
}

const JOUR = 86_400_000

function moisParis(d: Date): string {
  const p = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit' }).formatToParts(d)
  return `${p.find(x => x.type === 'year')!.value}-${p.find(x => x.type === 'month')!.value}`
}

export function estTrouverUnPro(source: string | null): boolean {
  if (!source) return false
  return /^(https?:\/\/[^/]+)?\/trouver-un-pro(\b|[/?#]|$)/.test(source)
}

export function buildSuivi(contacts: SuiviContact[], clients: SuiviClient[], now: Date): SuiviActivite {
  const parStatut = Object.fromEntries(STATUTS_DEMANDE.map(([k]) => [k, 0])) as Record<StatutDemande, number>
  let derniers30 = 0, trouverUnPro = 0, enAttente = 0
  let plusVieille: number | null = null
  let derniere: string | null = null
  const mois = new Map<string, number>()
  const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15))
  for (let i = 5; i >= 0; i--) mois.set(moisParis(new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 15))), 0)

  for (const c of contacts) {
    const t = new Date(c.created_at)
    if (Number.isNaN(t.getTime())) continue
    const st = (STATUTS_DEMANDE.some(([k]) => k === c.status) ? c.status : 'nouvelle') as StatutDemande
    parStatut[st]++
    if (now.getTime() - t.getTime() <= 30 * JOUR) derniers30++
    if (estTrouverUnPro(c.source_url)) trouverUnPro++
    if (st === 'nouvelle') {
      enAttente++
      const j = Math.max(0, Math.floor((now.getTime() - t.getTime()) / JOUR))
      if (plusVieille === null || j > plusVieille) plusVieille = j
    }
    if (!derniere || t.toISOString() > derniere) derniere = t.toISOString()
    const m = moisParis(t)
    if (mois.has(m)) mois.set(m, mois.get(m)! + 1)
  }

  const total = Object.values(parStatut).reduce((a, b) => a + b, 0)
  const cs = new Map<string, number>()
  for (const c of clients) {
    const k = (c.statut || 'sans statut').trim() || 'sans statut'
    cs.set(k, (cs.get(k) ?? 0) + 1)
  }
  return {
    total,
    derniers30,
    directes: total - trouverUnPro,
    trouverUnPro,
    parStatut,
    tauxTraite: total ? Math.round(((total - parStatut.nouvelle) / total) * 100) : null,
    enAttente,
    plusVieilleAttenteJours: plusVieille,
    derniere,
    parMois: [...mois].map(([m, n]) => ({ mois: m, n })),
    clients: clients.length,
    clientsParStatut: [...cs].map(([statut, n]) => ({ statut, n })).sort((a, b) => b.n - a.n),
  }
}
