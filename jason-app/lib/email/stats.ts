// Page Admin > Prospection > E-mails de la plateforme (20/11/2026) : mise en
// forme des chiffres de email_stats() (migration 196). Pur, testé (stats.test.ts).
import { EMAIL_CATEGORIES, isEmailCategory, type EmailAudience, type EmailCategory } from './tracking'

export interface RawEmailStats {
  par_categorie: Array<{ categorie: string; envoyes: number; remis: number; rejetes: number; spam: number; retardes: number }>
  par_jour: Array<{ jour: string; envoyes: number }>
  rejets: Array<{ le: string; categorie: string; type: string; destinataire: string | null; raison: string | null }>
  clics: Array<{ categorie: string; bouton: string; clics: number }>
  dernier_evenement: string | null
}

export interface CategoryLine {
  categorie: EmailCategory
  label: string
  envoyes: number
  remis: number
  rejetes: number
  spam: number
  clics: number
  /** Clics pour 100 e-mails envoyés (null : pas suivi ou rien d'envoyé) */
  tauxClic: number | null
  topBouton: { bouton: string; clics: number } | null
}

export interface EmailDashboard {
  total: { envoyes: number; remis: number; rejetes: number; spam: number; clics: number; tauxRemise: number | null }
  groupes: Array<{ audience: EmailAudience; label: string; lignes: CategoryLine[] }>
  jours: Array<{ jour: string; envoyes: number }>
  rejets: RawEmailStats['rejets']
  alertes: string[]
}

const AUDIENCES: Array<{ audience: EmailAudience; label: string }> = [
  { audience: 'membres', label: 'Hôtes et membres' },
  { audience: 'pros', label: 'Pros de l’annuaire' },
  { audience: 'voyageurs', label: 'Voyageurs (au nom de l’hôte)' },
  { audience: 'toi', label: 'Pour toi' },
]

/** Catégories dont les boutons sont comptés (voir le paramètre `track` de buildEmail) */
export const TRACKED: ReadonlySet<EmailCategory> = new Set(['bilan-pro', 'bienvenue-pro', 'demande-pro', 'demande-hote', 'paiement-hote', 'entre-hotes', 'checkin', 'contrat-hote', 'acces-membre'])

/** Les N derniers jours (heure de Paris), du plus ancien au plus récent, à 0 quand rien n'est parti */
export function lastDays(today: string, n: number, rows: Array<{ jour: string; envoyes: number }>): Array<{ jour: string; envoyes: number }> {
  const byDay = new Map(rows.map(r => [r.jour.slice(0, 10), r.envoyes]))
  const out: Array<{ jour: string; envoyes: number }> = []
  const t = Date.parse(`${today}T12:00:00Z`)
  for (let i = n - 1; i >= 0; i--) {
    const jour = new Date(t - i * 86_400_000).toISOString().slice(0, 10)
    out.push({ jour, envoyes: byDay.get(jour) ?? 0 })
  }
  return out
}

export function buildEmailDashboard(raw: RawEmailStats, o: { today: string; jours: number; webhookConfigured: boolean; now?: number }): EmailDashboard {
  const lines = new Map<EmailCategory, CategoryLine>()
  const line = (c: EmailCategory): CategoryLine => {
    let l = lines.get(c)
    if (!l) {
      l = { categorie: c, label: EMAIL_CATEGORIES[c].label, envoyes: 0, remis: 0, rejetes: 0, spam: 0, clics: 0, tauxClic: null, topBouton: null }
      lines.set(c, l)
    }
    return l
  }
  for (const r of raw.par_categorie ?? []) {
    const l = line(isEmailCategory(r.categorie) ? r.categorie : 'autre')
    l.envoyes += r.envoyes; l.remis += r.remis; l.rejetes += r.rejetes; l.spam += r.spam
  }
  for (const c of raw.clics ?? []) {
    if (!isEmailCategory(c.categorie)) continue
    const l = line(c.categorie)
    l.clics += c.clics
    if (!l.topBouton || c.clics > l.topBouton.clics) l.topBouton = { bouton: c.bouton, clics: c.clics }
  }
  for (const l of lines.values()) {
    l.tauxClic = TRACKED.has(l.categorie) && l.envoyes > 0 ? Math.round((l.clics / l.envoyes) * 100) : null
  }
  const all = [...lines.values()]
  const sum = (k: 'envoyes' | 'remis' | 'rejetes' | 'spam' | 'clics') => all.reduce((t, l) => t + l[k], 0)
  const total = { envoyes: sum('envoyes'), remis: sum('remis'), rejetes: sum('rejetes'), spam: sum('spam'), clics: sum('clics'), tauxRemise: null as number | null }
  const settled = total.remis + total.rejetes
  total.tauxRemise = settled > 0 ? Math.round((total.remis / settled) * 1000) / 10 : null

  const alertes: string[] = []
  if (!o.webhookConfigured) alertes.push('Le suivi n’est pas encore branché : Resend doit envoyer ses événements à l’app (voir plus bas).')
  else if (!raw.dernier_evenement) alertes.push('Branché, mais aucun événement reçu pour l’instant : il apparaîtra au prochain e-mail envoyé.')
  else if ((o.now ?? Date.now()) - Date.parse(raw.dernier_evenement) > 3 * 86_400_000) alertes.push('Aucun événement depuis plus de 3 jours : vérifie le webhook dans Resend.')
  if (total.spam > 0) alertes.push(`${total.spam} e-mail${total.spam > 1 ? 's signalés' : ' signalé'} comme spam sur la période.`)
  if (settled >= 20 && total.tauxRemise !== null && total.tauxRemise < 97) alertes.push(`Taux de remise de ${String(total.tauxRemise).replace('.', ',')} % : au-dessous de 97 %, les messageries commencent à se méfier.`)

  return {
    total,
    groupes: AUDIENCES.map(a => ({ ...a, lignes: all.filter(l => EMAIL_CATEGORIES[l.categorie].audience === a.audience).sort((x, y) => y.envoyes - x.envoyes) })).filter(g => g.lignes.length),
    jours: lastDays(o.today, o.jours, raw.par_jour ?? []),
    rejets: raw.rejets ?? [],
    alertes,
  }
}
