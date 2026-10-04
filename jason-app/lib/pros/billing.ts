// Devis des pros de l'annuaire (photographes, équipes ménage), 04/10/2026.
// Décision de Jason : l'app fait les devis (la réforme de la facture
// électronique ne les concerne pas), les factures se font dans un outil
// agréé (Tiime, Indy, ou celui du pro). Règles pures, partagées par
// l'éditeur, la page publique et le serveur : montants, statuts affichés,
// mentions, chiffres de l'année. Faits vérifiés en octobre 2026 :
// - Entrepreneur individuel : nom et prénom suivis de « EI », SIREN/SIRET, adresse.
// - Franchise en base : « TVA non applicable, art. 293 B du CGI » jusqu'au
//   31/12/2026, puis « art. L. 233-3 du CIBS » (l'ancienne tolérée jusqu'au 30/06/2028).

export type ProKind = 'photographer' | 'cleaner'
export type DocKind = 'devis'
export type DocStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse'
export type VatMode = 'franchise' | 'tva'

export interface DocLine {
  label: string
  detail?: string | null
  qty: number
  unit: string
  unit_price: number
}

export interface BillingProfile {
  legal_name: string | null
  trade_name: string | null
  legal_form: 'EI' | 'societe'
  siret: string | null
  address: string | null
  email: string | null
  phone: string | null
  vat_mode: VatMode
  vat_number: string | null
  default_vat_rate: number
  quote_validity_days: number
  footer_note: string | null
  /** Le pro facture déjà dans son propre outil : on n'affiche plus nos partenaires */
  has_invoicing_tool: boolean
  invoicing_tool: string | null
}

export interface ProDocument {
  id: string
  kind: DocKind
  number: string | null
  status: DocStatus
  client_id: string | null
  client_name: string | null
  client_email: string | null
  client_address: string | null
  client_is_pro: boolean
  client_siren: string | null
  title: string | null
  issue_date: string | null
  service_date: string | null
  valid_until: string | null
  lines: DocLine[]
  vat_mode: VatMode
  vat_rate: number
  total_ht: number
  total_tva: number
  total_ttc: number
  notes: string | null
  seller: BillingProfile | null
  public_token: string
  sent_at: string | null
  accepted_at: string | null
  accepted_name: string | null
  refused_at: string | null
  created_at: string
  updated_at: string
}

export const EMPTY_PROFILE: BillingProfile = {
  legal_name: null, trade_name: null, legal_form: 'EI', siret: null, address: null,
  email: null, phone: null, vat_mode: 'franchise', vat_number: null, default_vat_rate: 20,
  quote_validity_days: 30, footer_note: null, has_invoicing_tool: false, invoicing_tool: null,
}


export const UNITS = ['forfait', 'heure', 'jour', 'photo', 'logement', 'lit', 'kg', 'km', 'unité'] as const

// ─── Montants ───────────────────────────────────────────────────────

export const round2 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100 + Number.EPSILON) / 100

export function lineAmount(l: Pick<DocLine, 'qty' | 'unit_price'>): number {
  return round2((Number(l.qty) || 0) * (Number(l.unit_price) || 0))
}

export function computeTotals(lines: DocLine[], vatMode: VatMode, vatRate: number) {
  const ht = round2(lines.reduce((s, l) => s + lineAmount(l), 0))
  const tva = vatMode === 'tva' ? round2(ht * (Number(vatRate) || 0) / 100) : 0
  return { total_ht: ht, total_tva: tva, total_ttc: round2(ht + tva) }
}

/** Nettoie les lignes saisies : sans libellé ni montant, elles disparaissent */
export function cleanLines(lines: DocLine[]): DocLine[] {
  return lines
    .map(l => ({
      label: String(l.label ?? '').trim().slice(0, 200),
      detail: l.detail ? String(l.detail).trim().slice(0, 500) || null : null,
      qty: round2(Number(l.qty) || 0),
      unit: UNITS.includes(l.unit as typeof UNITS[number]) ? l.unit : 'forfait',
      unit_price: round2(Number(l.unit_price) || 0),
    }))
    .filter(l => l.label || l.unit_price)
    .slice(0, 50)
}

export function eur(n: number): string {
  return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// ─── Dates ──────────────────────────────────────────────────────────

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function frDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// ─── Statut affiché ─────────────────────────────────────────────────

export type DisplayStatus = 'brouillon' | 'en_attente' | 'expire' | 'accepte' | 'refuse'

export function displayStatus(d: Pick<ProDocument, 'status' | 'valid_until'>, today: string): DisplayStatus {
  if (d.status === 'brouillon') return 'brouillon'
  if (d.status === 'accepte') return 'accepte'
  if (d.status === 'refuse') return 'refuse'
  return d.valid_until && d.valid_until < today ? 'expire' : 'en_attente'
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  brouillon: 'Brouillon', en_attente: 'En attente', expire: 'Expiré', accepte: 'Accepté', refuse: 'Refusé',
}

// ─── Mentions ───────────────────────────────────────────────────────

/** Nom du vendeur tel qu'il doit apparaître (« Prénom Nom EI ») */
export function sellerDisplayName(p: Pick<BillingProfile, 'legal_name' | 'legal_form'>): string {
  const name = (p.legal_name ?? '').trim()
  if (!name) return ''
  return p.legal_form === 'EI' && !/\b(EI|entrepreneur individuel)\b/i.test(name) ? `${name} EI` : name
}

export function vatMention(vatMode: VatMode, issueDate: string): string | null {
  if (vatMode !== 'franchise') return null
  return issueDate >= '2027-01-01'
    ? 'TVA non applicable, art. L. 233-3 du CIBS'
    : 'TVA non applicable, art. 293 B du CGI'
}

/** Ce qu'il manque aux infos du pro pour finaliser un document */
export function missingProfileFields(p: BillingProfile | null): string[] {
  const out: string[] = []
  if (!p?.legal_name?.trim()) out.push('ton nom (ou raison sociale)')
  if (!p?.siret || p.siret.replace(/\s/g, '').length < 9) out.push('ton numéro SIRET')
  if (!p?.address?.trim()) out.push('ton adresse')
  return out
}

/** Ce qu'il manque au document pour être finalisé */
export function missingDocFields(d: Pick<ProDocument, 'client_name' | 'lines'>): string[] {
  const out: string[] = []
  if (!d.client_name?.trim()) out.push('le nom du client')
  if (!cleanLines(d.lines).length) out.push('au moins une prestation')
  return out
}

/** Mentions de bas de devis, dans l'ordre d'affichage */
export function legalMentions(d: Pick<ProDocument, 'vat_mode' | 'issue_date' | 'valid_until'>, seller: BillingProfile | null): string[] {
  const issue = d.issue_date ?? new Date().toISOString().slice(0, 10)
  const out: string[] = []
  const vat = vatMention(d.vat_mode, issue)
  if (vat) out.push(vat)
  if (d.valid_until) out.push(`Devis valable jusqu'au ${frDate(d.valid_until)}. Pour l'accepter : en ligne, ou signé avec la mention « Bon pour accord ».`)
  if (seller?.footer_note?.trim()) out.push(seller.footer_note.trim())
  return out
}

// ─── Suggestions de prestations par métier ──────────────────────────

export const SUGGESTIONS: Record<ProKind, Array<{ label: string; unit: string; detail?: string }>> = {
  photographer: [
    { label: 'Shooting photo du logement', unit: 'forfait', detail: 'Prise de vue, sélection et retouche des photos' },
    { label: 'Photos supplémentaires', unit: 'photo' },
    { label: 'Photos aériennes (drone)', unit: 'forfait' },
    { label: 'Visite virtuelle 360°', unit: 'forfait' },
    { label: 'Vidéo courte pour les réseaux', unit: 'forfait' },
    { label: 'Frais de déplacement', unit: 'km' },
  ],
  cleaner: [
    { label: 'Ménage de fin de séjour', unit: 'logement', detail: 'Ménage complet entre deux voyageurs' },
    { label: 'Gestion du linge', unit: 'lit', detail: 'Lavage, séchage et mise en place des draps et serviettes' },
    { label: 'Réassort des consommables', unit: 'forfait' },
    { label: 'Ménage de fond', unit: 'heure' },
    { label: 'Accueil des voyageurs et remise des clés', unit: 'forfait' },
    { label: 'Frais de déplacement', unit: 'km' },
  ],
}

/** Prestations déjà chiffrées (les plus récentes d'abord), sans doublon de libellé */
export function recentLines(docs: Pick<ProDocument, 'lines' | 'created_at'>[], max = 6): DocLine[] {
  const seen = new Set<string>()
  const out: DocLine[] = []
  for (const d of [...docs].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    for (const l of d.lines ?? []) {
      const key = l.label?.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(l)
      if (out.length >= max) return out
    }
  }
  return out
}

// ─── Chiffres de l'année ────────────────────────────────────────────

export interface YearStats {
  envoyes: number
  acceptes: number
  montantAccepte: number
  enAttente: number
  montantEnAttente: number
  /** Taux d'acceptation des devis envoyés cette année (acceptés / envoyés, hors en attente) */
  tauxAcceptation: number | null
}

export function yearStats(docs: Pick<ProDocument, 'status' | 'total_ttc' | 'issue_date' | 'valid_until'>[], today: string): YearStats {
  const year = today.slice(0, 4)
  const s: YearStats = { envoyes: 0, acceptes: 0, montantAccepte: 0, enAttente: 0, montantEnAttente: 0, tauxAcceptation: null }
  let decides = 0
  for (const d of docs) {
    const st = displayStatus(d, today)
    if (st === 'en_attente') { s.enAttente++; s.montantEnAttente += d.total_ttc }
    if (!(d.issue_date ?? '').startsWith(year) || st === 'brouillon') continue
    s.envoyes++
    if (st === 'accepte') { s.acceptes++; s.montantAccepte += d.total_ttc }
    if (st === 'accepte' || st === 'refuse' || st === 'expire') decides++
  }
  s.montantAccepte = round2(s.montantAccepte)
  s.montantEnAttente = round2(s.montantEnAttente)
  s.tauxAcceptation = decides ? Math.round(s.acceptes / decides * 100) : null
  return s
}
