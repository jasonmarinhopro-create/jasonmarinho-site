// Facture électronique : « ta situation » (05/10/2026, idée validée par
// Jason). Règles vérifiées en octobre 2026, sources dans l'article d'aide
// content/help/contrats-paiements/emettre-facture.md :
// - réception des factures électroniques obligatoire depuis le 1/9/2026 ;
// - émission et e-reporting au 1/9/2027 pour les petites entreprises, dont
//   les loueurs qui facturent la TVA ou relèvent de la para-hôtellerie (au
//   moins 3 des 4 services : petit-déjeuner, ménage pendant le séjour, linge,
//   accueil), franchise de TVA comprise ;
// - location meublée sans services (exonérée, art. 261 D 4° CGI) louée à des
//   particuliers : la facture de l'app reste valable.
// Pas de règle inventée pour un client entreprise d'une location exonérée :
// on renvoie vers la plateforme ou un comptable.

export type TvaStatus = 'exonere' | 'franchise' | 'collecte' | 'nsp'

export interface EinvoicingAnswers {
  tva: TvaStatus
  /** Services proposés aux voyageurs, parmi les 4 de la para-hôtellerie */
  services: ServiceKey[]
  /** Loue aussi à des entreprises (déplacements pro, factures à une société) */
  clientsPros: boolean
}

export type ServiceKey = 'petit_dejeuner' | 'menage_sejour' | 'linge' | 'accueil'

export const SERVICES: Array<{ key: ServiceKey; label: string; hint: string }> = [
  { key: 'petit_dejeuner', label: 'Petit-déjeuner', hint: 'servi ou fourni chaque matin' },
  { key: 'menage_sejour', label: 'Ménage pendant le séjour', hint: 'pas seulement entre deux voyageurs' },
  { key: 'linge', label: 'Linge de maison', hint: 'draps et serviettes fournis' },
  { key: 'accueil', label: 'Accueil des voyageurs', hint: 'réception, même sans personnel dédié' },
]

export const RECEPTION_DATE = '2026-09-01'
export const EMISSION_DATE = '2027-09-01'

/** Devine le statut de TVA d'après la mention saisie dans Mon compte → Factures. */
export function guessTvaFromMention(mention: string | null | undefined): TvaStatus {
  const m = (mention ?? '').trim()
  if (!m) return 'nsp'
  if (/261\s*D/i.test(m)) return 'exonere'
  if (/293\s*B|L\.?\s*233-3|franchise/i.test(m)) return 'franchise'
  if (/non applicable|exon[ée]r/i.test(m)) return 'exonere'
  if (/\d+([,.]\d+)?\s*%|taux|tva\s+(due|collect)/i.test(m)) return 'collecte'
  return 'nsp'
}

export interface EinvoicingVerdict {
  key: 'concerne' | 'simple'
  title: string
  text: string
  steps: Array<{ when: string; what: string }>
  notes: string[]
  /** Jours restants avant le 1er septembre 2027 (0 si passé) */
  daysLeft: number
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10))
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10))
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

export function einvoicingVerdict(a: EinvoicingAnswers, today: string): EinvoicingVerdict {
  const nServices = new Set(a.services).size
  const paraHotel = nServices >= 3
  const daysLeft = daysBetween(today, EMISSION_DATE)
  const started = today >= EMISSION_DATE
  const notes: string[] = []
  const reception = {
    when: today >= RECEPTION_DATE ? 'Dès maintenant' : 'Le 1er septembre 2026',
    what: 'tu dois pouvoir recevoir les factures électroniques de tes prestataires (ménage, conciergerie, artisans). Un compte gratuit sur une plateforme agréée suffit.',
  }

  if (a.tva === 'collecte' || paraHotel) {
    if (paraHotel && a.tva === 'exonere') {
      notes.push(`Avec ${nServices} services sur 4, ta location relève de la para-hôtellerie : elle n'est plus exonérée de TVA (franchise jusqu'à 85 000 € de recettes). Vérifie la mention de TVA de tes factures dans Mon compte → Factures.`)
    }
    if (a.clientsPros) {
      notes.push('Tes clients entreprises recevront tes factures par la plateforme : c\'est la partie la plus visible du changement.')
    }
    return {
      key: 'concerne',
      title: started ? 'Tu es concerné depuis le 1er septembre 2027' : 'Tu es concerné au 1er septembre 2027',
      text: `${a.tva === 'collecte' ? 'Tu factures la TVA' : 'Ta location relève de la para-hôtellerie (au moins 3 services sur 4), même en franchise de TVA'} : tes factures aux entreprises devront passer par une plateforme agréée, et tes séjours vendus à des particuliers seront déclarés à l'administration par cette plateforme (e-reporting). La facture de l'app ne suffira plus.`,
      steps: [
        reception,
        { when: 'Avant l\'été 2027', what: 'fais déjà tes factures de séjour dans cet outil plutôt que dans l\'app : tu seras prêt le jour venu, sans changer d\'habitude à la dernière minute.' },
        { when: 'Le 1er septembre 2027', what: 'factures aux entreprises envoyées par la plateforme, ventes aux particuliers déclarées par elle. Plus de facture PDF faite à côté.' },
      ],
      notes,
      daysLeft,
    }
  }

  if (nServices === 2) {
    notes.push('Tu proposes 2 services sur 4 : un de plus et ta location passerait en para-hôtellerie. Tu serais alors concerné en 2027 (et soumis à la TVA au-delà de 85 000 € de recettes).')
  }
  if (a.tva === 'franchise') {
    notes.push('Tu as indiqué la franchise de TVA (art. 293 B) : elle vise la para-hôtellerie. Sans services, ta location est exonérée (art. 261 D 4° du CGI) : vérifie la mention de tes factures dans Mon compte → Factures.')
  }
  if (a.clientsPros) {
    notes.push('Tu loues aussi à des entreprises : pour ces factures-là, demande à ta plateforme ou à ton comptable si la facture électronique s\'applique à ton cas.')
  }
  return {
    key: 'simple',
    title: 'Rien ne change pour tes factures en 2027',
    text: 'Location meublée sans services, exonérée de TVA : la facture de l\'app reste valable pour tes voyageurs. Une seule chose à faire : pouvoir recevoir les factures de tes prestataires.',
    steps: [
      reception,
      { when: 'Pour chaque séjour', what: 'continue à faire tes factures dans l\'app : fiche du voyageur → Facture. Numérotation sans trou, caution jamais comptée.' },
    ],
    notes,
    daysLeft,
  }
}
