// Sécurité voyageur : règles pures (testées) pour chercher un voyageur dans
// la base communautaire et lire le résultat. Partagées par la page Sécurité
// voyageur, Mes voyageurs, la fiche voyageur et l'alerte à l'ajout.
//
// Pourquoi : avant sept. 2026 la recherche comparait le texte tapé tel quel.
// Un « 06 12 34 56 78 » ne retrouvait jamais un signalement enregistré en
// « +33612345678 », et 3 lettres suffisaient pour lister tous les « mar… »
// de la base (trop large pour des données personnelles).
import { normalizeEmail, normalizePhone } from '@/lib/security/normalize-identifier'

export const POSITIVE_TYPES: readonly string[] = [
  'Voyageur exemplaire',
  'Logement laissé impeccable',
  'Communication excellente',
  'Respect total des règles',
  'Je recommande vivement',
]

const POSITIVE_SET = new Set<string>(POSITIVE_TYPES)
export const isPositive = (incidentType: string) => POSITIVE_SET.has(incidentType)

/** Motifs de signalement, groupés pour le menu déroulant */
export const INCIDENT_GROUPS: Array<{ label: string; types: string[] }> = [
  {
    label: 'Paiement et arnaques',
    types: [
      'Arnaque WERO / virement instantané (faux paiement)',
      'Virement direct sans contrat (hors plateforme)',
      'Arnaque au surpaiement / trop-perçu (chargeback)',
      'Demande de remboursement abusive (fausse cause)',
      'Faux dégât pour récupérer la caution',
      'Faux dégât avec photos générées par IA',
      'Impayé après séjour',
    ],
  },
  {
    label: 'Identité',
    types: [
      "Usurpation d'identité voyageur (faux profil)",
      'Phishing hôte (faux email Airbnb/Booking)',
      'Sous-location frauduleuse non déclarée',
      'Faux justificatifs (CNI, attestation, etc.)',
    ],
  },
  {
    label: 'Pendant le séjour',
    types: [
      'Fête non autorisée / EVG / EVJF camouflé',
      'Nuisances sonores répétées',
      'Présence de personnes non déclarées',
      'Dégradation volontaire du logement',
      "Vol d'objets / équipements",
      'Fumée / cannabis dans le logement',
      'Non-respect des règles de la maison',
      'Animaux non déclarés',
      'Squat post-séjour (refuse de partir après check-out)',
      "Réservation longue durée détournée en bail d'habitation",
    ],
  },
  {
    label: 'Avis et annulations',
    types: [
      'Avis négatif menaçant pour soutirer remboursement',
      'Faux avis négatif abusif',
      "Chantage à l'avis (1 étoile si pas de geste)",
      'Faux problème médical pour annulation gratuite',
      'Annulation last-minute répétée / no-show',
    ],
  },
  { label: 'Autre', types: ['Autre (préciser dans la description)'] },
]

export const ALL_INCIDENT_TYPES: string[] = INCIDENT_GROUPS.flatMap(g => g.types)

export type QueryKind ='email' | 'phone' | 'name'

export type ParsedQuery =
  | { ok: true; kind: QueryKind; values: string[]; label: string }
  | { ok: false; error: string }

/** Lettres (accents compris), espaces, apostrophes et tirets seulement */
function cleanName(raw: string): string {
  return raw.normalize('NFC').replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Formes possibles d'un même numéro, pour retrouver un signalement quelle que
 * soit la façon dont il a été saisi : +33612345678, 0612345678, 33612345678.
 */
export function phoneVariants(raw: string): string[] {
  const n = normalizePhone(raw)
  if (!n) return []
  const out = new Set<string>([n])
  const digits = n.replace(/\D/g, '')
  out.add(digits)
  if (n.startsWith('+33') && digits.length === 11) out.add(`0${digits.slice(2)}`)
  return Array.from(out)
}

/** Lit ce que l'hôte a tapé : e-mail, téléphone ou prénom + nom. */
export function parseQuery(raw: string): ParsedQuery {
  const q = (raw ?? '').trim()
  if (!q) return { ok: false, error: 'Tape un e-mail, un téléphone ou un prénom et un nom.' }

  if (q.includes('@')) {
    const email = normalizeEmail(q)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Cet e-mail n'a pas l'air complet." }
    return { ok: true, kind: 'email', values: [email], label: email }
  }

  // Un numéro : chiffres, espaces, points, tirets, parenthèses, + au début
  if (/^\+?[\d\s.()/-]+$/.test(q)) {
    const digits = q.replace(/\D/g, '')
    if (digits.length < 8) return { ok: false, error: 'Numéro trop court : tape le numéro en entier.' }
    return { ok: true, kind: 'phone', values: phoneVariants(q), label: normalizePhone(q) }
  }

  const name = cleanName(q)
  const words = name.split(' ').filter(w => w.replace(/['-]/g, '').length >= 2)
  if (words.length < 2) {
    return { ok: false, error: 'Pour un nom, écris le prénom et le nom (ex. : Marie Dupont).' }
  }
  const values = new Set([name.toLowerCase()])
  // « Dupont Marie » retrouve aussi « Marie Dupont »
  if (words.length === 2) values.add(`${words[1]} ${words[0]}`.toLowerCase())
  return { ok: true, kind: 'name', values: Array.from(values), label: name }
}

/** Identifiants d'un voyageur de l'app, pour le croiser avec la base. */
export function voyageurIdentifiers(v: { email?: string | null; telephone?: string | null }): string[] {
  const out = new Set<string>()
  const email = normalizeEmail(v.email ?? '')
  if (email) out.add(email)
  for (const p of phoneVariants(v.telephone ?? '')) out.add(p)
  // Anciennes saisies non normalisées
  if (v.telephone?.trim()) out.add(v.telephone.trim())
  return Array.from(out)
}

/**
 * Identifiants à enregistrer avec un signalement : le principal (e-mail, sinon
 * téléphone, sinon nom) et les autres, pour qu'une recherche par téléphone
 * retrouve aussi un signalement fait avec e-mail + téléphone.
 */
export function reportIdentifiers(input: { email?: string; phone?: string; full_name?: string }): {
  identifier: string
  identifier_type: QueryKind
  extra: string[]
  name: string | null
} | null {
  const email = normalizeEmail(input.email ?? '')
  const phone = normalizePhone(input.phone ?? '')
  const name = cleanName(input.full_name ?? '')
  const extra: string[] = []
  if (email) {
    if (phone) extra.push(phone)
    return { identifier: email, identifier_type: 'email', extra, name: name || null }
  }
  if (phone) return { identifier: phone, identifier_type: 'phone', extra, name: name || null }
  if (name) return { identifier: name, identifier_type: 'name', extra, name }
  return null
}

export type Verdict = 'aucun' | 'positif' | 'vigilance' | 'risque' | 'eleve'

/** Lecture du résultat : jamais un « risque » sur un seul avis positif. */
export function verdictOf(negatives: number, positives: number): Verdict {
  if (negatives === 0) return positives > 0 ? 'positif' : 'aucun'
  if (negatives === 1) return 'vigilance'
  if (negatives <= 3) return 'risque'
  return 'eleve'
}

/** Filtre PostgREST `or` qui cherche toutes les formes d'un identifiant. */
export function orFilter(values: string[], kind: QueryKind, withExtra: boolean): string {
  const quoted = values.map(v => `"${v.replace(/["\\]/g, '')}"`).join(',')
  const parts = [`identifier.in.(${quoted})`]
  if (withExtra && kind !== 'name') parts.push(`extra_identifiers.ov.{${quoted}}`)
  if (kind === 'name') {
    // Correspondance exacte (sans jokers), insensible à la casse
    for (const v of values) {
      const safe = v.replace(/[%_\\,"()]/g, '')
      parts.push(`identifier.ilike."${safe}"`, `name.ilike."${safe}"`)
    }
  }
  return parts.join(',')
}
