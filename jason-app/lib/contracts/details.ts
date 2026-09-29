// Mentions du contrat de location saisonnière ajoutées le 29/09/2026 après
// des retours d'hôtes (« pas assez détaillé ») : état descriptif des lieux,
// prix détaillé, régime des sommes versées d'avance, caution, annulation par
// le bailleur, rétractation, pièce d'identité à l'arrivée, assurance.
//
// Faits vérifiés (sept. 2026) :
// - Code du tourisme L324-2 : contrat écrit avec le prix ET un état
//   descriptif des lieux.
// - Code de la consommation L214-1 : sauf stipulation contraire, les sommes
//   versées d'avance sont des arrhes (chaque partie peut se dédire : le
//   locataire perd les arrhes, le bailleur rend le double, C. civ. 1590).
// - Code de la consommation L221-28 12° : pas de droit de rétractation pour
//   un hébergement fourni à une date déterminée.
// - CNIL : un loueur peut demander à VOIR une pièce d'identité, pas en garder
//   une copie ; fiche individuelle de police pour les étrangers (CESEDA
//   R814-1 à R814-3, conservée 6 mois).
// Règles propres au droit français : affichées seulement pour un logement en
// France. Au Portugal, le modèle AL existant (lib/contract-templates.ts) reste
// la base et seuls les éléments neutres (état descriptif, prix, caution,
// assurance, identité) s'ajoutent.

export type Lang = 'fr' | 'pt' | 'en'
export type RegimeAvance = 'arrhes' | 'acompte'

export interface EtatDescriptif {
  type_logement?: string | null
  surface_m?: number | null
  nb_chambres?: number | null
  nb_lits?: number | null
  nb_sdb?: number | null
  equipements?: string[]
  classement_etoiles?: number | null
  /** Numéro d'enregistrement (France) ou numéro AL (Portugal) */
  numero?: string | null
}

/** Instantané enregistré sur le contrat à sa création (contracts.details) */
export interface ContractDetails {
  etat?: EtatDescriptif
  /** Frais de ménage compris dans le prix total */
  frais_menage?: number | null
  /** Taxe de séjour pour tout le séjour */
  taxe_sejour?: number | null
  taxe_sejour_mode?: 'incluse' | 'en_sus'
  /** Eau, électricité, chauffage, internet compris */
  charges_incluses?: boolean
  regime?: RegimeAvance
  delai_caution_jours?: number
}

/** Réglages du contrat propres à un logement (logements.contrat_options) */
export interface ContratOptions {
  regime?: RegimeAvance
  delai_caution_jours?: number
  charges_incluses?: boolean
}

export const DEFAULT_OPTIONS: Required<ContratOptions> = { regime: 'arrhes', delai_caution_jours: 7, charges_incluses: true }

export function contratOptions(raw: unknown): Required<ContratOptions> {
  const o = (raw && typeof raw === 'object' ? raw : {}) as ContratOptions
  const delai = Number(o.delai_caution_jours)
  return {
    regime: o.regime === 'acompte' ? 'acompte' : 'arrhes',
    delai_caution_jours: Number.isFinite(delai) && delai >= 1 && delai <= 60 ? Math.round(delai) : DEFAULT_OPTIONS.delai_caution_jours,
    charges_incluses: o.charges_incluses !== false,
  }
}

export interface LogementForContract {
  type_logement?: string | null
  surface_m2?: number | null
  nb_chambres?: number | null
  nb_lits?: number | null
  nb_sdb?: number | null
  equipements?: string[] | null
  classement_etoiles?: number | null
  numero_enregistrement?: string | null
  numero_al?: string | null
  pays?: string | null
}

/** État descriptif repris de la fiche logement (valeurs vides retirées) */
export function buildEtatDescriptif(l: LogementForContract): EtatDescriptif {
  const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : null)
  const numero = (l.pays === 'PT' ? l.numero_al : l.numero_enregistrement)?.trim() || null
  return {
    type_logement: l.type_logement || null,
    surface_m: num(l.surface_m2),
    nb_chambres: num(l.nb_chambres),
    nb_lits: num(l.nb_lits),
    nb_sdb: num(l.nb_sdb),
    equipements: (l.equipements ?? []).filter(Boolean),
    classement_etoiles: num(l.classement_etoiles),
    numero,
  }
}

const TYPE_LABELS: Record<string, Record<Lang, string>> = {
  gite: { fr: 'Gîte', pt: 'Casa de campo (gîte)', en: 'Holiday cottage (gîte)' },
  'chambres-hotes': { fr: "Chambre d'hôtes", pt: 'Quarto de hóspedes', en: 'Bed and breakfast room' },
  appartement: { fr: 'Appartement', pt: 'Apartamento', en: 'Apartment' },
  studio: { fr: 'Studio', pt: 'Estúdio', en: 'Studio' },
  maison: { fr: 'Maison', pt: 'Moradia', en: 'House' },
  villa: { fr: 'Villa', pt: 'Vivenda', en: 'Villa' },
  autre: { fr: 'Logement', pt: 'Alojamento', en: 'Accommodation' },
}

export const EQUIPEMENT_LABELS: Record<string, Record<Lang, string>> = {
  wifi: { fr: 'Wi-Fi', pt: 'Wi-Fi', en: 'Wi-Fi' },
  parking: { fr: 'Parking', pt: 'Estacionamento', en: 'Parking' },
  piscine: { fr: 'Piscine', pt: 'Piscina', en: 'Swimming pool' },
  climatisation: { fr: 'Climatisation', pt: 'Ar condicionado', en: 'Air conditioning' },
  chauffage: { fr: 'Chauffage', pt: 'Aquecimento', en: 'Heating' },
  'lave-linge': { fr: 'Lave-linge', pt: 'Máquina de lavar roupa', en: 'Washing machine' },
  'lave-vaisselle': { fr: 'Lave-vaisselle', pt: 'Máquina de lavar loiça', en: 'Dishwasher' },
  tv: { fr: 'Télévision', pt: 'Televisão', en: 'TV' },
  jardin: { fr: 'Jardin', pt: 'Jardim', en: 'Garden' },
  terrasse: { fr: 'Terrasse', pt: 'Terraço', en: 'Terrace' },
  balcon: { fr: 'Balcon', pt: 'Varanda', en: 'Balcony' },
  pmr: { fr: 'Accès PMR', pt: 'Acesso para mobilidade reduzida', en: 'Wheelchair access' },
  ascenseur: { fr: 'Ascenseur', pt: 'Elevador', en: 'Lift' },
  cheminee: { fr: 'Cheminée', pt: 'Lareira', en: 'Fireplace' },
  spa: { fr: 'Spa / jacuzzi', pt: 'Spa / jacuzzi', en: 'Spa / hot tub' },
}

export const EXTRA_UI: Record<Lang, {
  articleWord: string
  etatTitle: string
  type: string; surface: string; chambres: string; lits: string; sdb: string; classement: string; nonClasse: string; etoiles: (n: number) => string
  equipements: string; numero: string; numeroMissing: string
  prixHebergement: string; dontMenage: string; taxeIncluse: string; taxeEnSus: string; chargesIncluses: string; chargesNonIncluses: string
  arrhesLabel: (pct: number) => string; acompteLabel: (pct: number) => string
  cautionTitle: string; cautionText: (montant: string, jours: number) => string; noCaution: string
  arriveeTitle: string
  bailleurCancelTitle: string
  assuranceTitle: string; assuranceText: string
  clausesTitle: string
}> = {
  fr: {
    articleWord: 'Article',
    etatTitle: 'État descriptif du logement',
    type: 'Type', surface: 'Surface', chambres: 'Chambres', lits: 'Couchages', sdb: "Salles d'eau", classement: 'Classement', nonClasse: 'Non classé', etoiles: n => `${n} étoile${n > 1 ? 's' : ''} (meublé de tourisme classé)`,
    equipements: 'Équipements', numero: "Numéro d'enregistrement", numeroMissing: 'non communiqué',
    prixHebergement: 'Prix total du séjour', dontMenage: 'dont frais de ménage', taxeIncluse: 'dont taxe de séjour', taxeEnSus: 'Taxe de séjour, à régler en plus du prix', chargesIncluses: 'Charges comprises : eau, électricité, chauffage et internet.', chargesNonIncluses: 'Charges (eau, électricité, chauffage) non comprises : selon le relevé ou les conditions indiquées au règlement intérieur.',
    arrhesLabel: pct => `Arrhes (${pct} %)`, acompteLabel: pct => `Acompte (${pct} %)`,
    cautionTitle: 'Dépôt de garantie',
    cautionText: (m, j) => `Un dépôt de garantie de ${m} est demandé pour couvrir les dégradations, objets manquants ou le ménage non effectué constatés au départ. Il n'est pas encaissé comme un loyer. Il est restitué au plus tard ${j} jours après le départ, déduction faite des sommes dues, qui sont justifiées au locataire (photos, factures ou devis).`,
    noCaution: 'Aucun dépôt de garantie n’est demandé.',
    arriveeTitle: 'Arrivée et identité',
    bailleurCancelTitle: 'Annulation par le bailleur',
    assuranceTitle: 'Assurance',
    assuranceText: 'Le locataire est responsable des dommages qu’il cause pendant le séjour. Il lui est recommandé de vérifier que son assurance habitation ou une assurance villégiature couvre sa responsabilité civile pendant la location.',
    clausesTitle: 'Clauses particulières',
  },
  pt: {
    articleWord: 'Artigo',
    etatTitle: 'Descrição do alojamento',
    type: 'Tipo', surface: 'Área', chambres: 'Quartos', lits: 'Camas', sdb: 'Casas de banho', classement: 'Classificação', nonClasse: 'Sem classificação', etoiles: n => `${n} estrela${n > 1 ? 's' : ''}`,
    equipements: 'Equipamentos', numero: 'Número de registo', numeroMissing: 'não indicado',
    prixHebergement: 'Preço total da estadia', dontMenage: 'incluindo taxa de limpeza', taxeIncluse: 'incluindo taxa turística', taxeEnSus: 'Taxa turística, a pagar além do preço', chargesIncluses: 'Despesas incluídas: água, eletricidade, aquecimento e internet.', chargesNonIncluses: 'Despesas (água, eletricidade, aquecimento) não incluídas: conforme leitura ou condições do regulamento interno.',
    arrhesLabel: pct => `Sinal (${pct} %)`, acompteLabel: pct => `Adiantamento (${pct} %)`,
    cautionTitle: 'Caução',
    cautionText: (m, j) => `É pedida uma caução de ${m} para cobrir danos, objetos em falta ou limpeza não efetuada verificados à saída. Não é cobrada como renda. É devolvida no prazo máximo de ${j} dias após a partida, deduzidos os montantes devidos, justificados ao hóspede (fotografias, faturas ou orçamentos).`,
    noCaution: 'Não é pedida caução.',
    arriveeTitle: 'Chegada e identificação',
    bailleurCancelTitle: 'Cancelamento pelo senhorio',
    assuranceTitle: 'Seguro',
    assuranceText: 'O hóspede é responsável pelos danos que causar durante a estadia. Recomenda-se que verifique se o seu seguro cobre a responsabilidade civil durante o arrendamento.',
    clausesTitle: 'Cláusulas particulares',
  },
  en: {
    articleWord: 'Article',
    etatTitle: 'Description of the property',
    type: 'Type', surface: 'Floor area', chambres: 'Bedrooms', lits: 'Beds', sdb: 'Bathrooms', classement: 'Official rating', nonClasse: 'Not rated', etoiles: n => `${n} star${n > 1 ? 's' : ''} (rated furnished tourist accommodation)`,
    equipements: 'Amenities', numero: 'Registration number', numeroMissing: 'not provided',
    prixHebergement: 'Total price of the stay', dontMenage: 'including cleaning fee', taxeIncluse: 'including tourist tax', taxeEnSus: 'Tourist tax, payable in addition to the price', chargesIncluses: 'Utilities included: water, electricity, heating and internet.', chargesNonIncluses: 'Utilities (water, electricity, heating) not included: as metered or as set out in the house rules.',
    arrhesLabel: pct => `Deposit (arrhes, ${pct}%)`, acompteLabel: pct => `Down payment (acompte, ${pct}%)`,
    cautionTitle: 'Security deposit',
    cautionText: (m, j) => `A security deposit of ${m} is requested to cover damage, missing items or cleaning not done, as found on departure. It is not taken as rent. It is returned within ${j} days of departure at the latest, minus any sums due, which are justified to the guest (photos, invoices or quotes).`,
    noCaution: 'No security deposit is requested.',
    arriveeTitle: 'Arrival and identity',
    bailleurCancelTitle: 'Cancellation by the landlord',
    assuranceTitle: 'Insurance',
    assuranceText: 'The guest is liable for any damage caused during the stay and is advised to check that their home or holiday insurance covers their civil liability during the rental.',
    clausesTitle: 'Special terms',
  },
}

/** Lignes de l'état descriptif, dans la langue du contrat (champs vides omis) */
export function etatDescriptifLines(etat: EtatDescriptif | undefined, lang: Lang, pays: string): Array<{ label: string; value: string }> {
  if (!etat) return []
  const t = EXTRA_UI[lang]
  const out: Array<{ label: string; value: string }> = []
  if (etat.type_logement) out.push({ label: t.type, value: TYPE_LABELS[etat.type_logement]?.[lang] ?? etat.type_logement })
  if (etat.surface_m) out.push({ label: t.surface, value: `${etat.surface_m} m²` })
  if (etat.nb_chambres) out.push({ label: t.chambres, value: String(etat.nb_chambres) })
  if (etat.nb_lits) out.push({ label: t.lits, value: String(etat.nb_lits) })
  if (etat.nb_sdb) out.push({ label: t.sdb, value: String(etat.nb_sdb) })
  if (pays === 'FR') out.push({ label: t.classement, value: etat.classement_etoiles ? t.etoiles(etat.classement_etoiles) : t.nonClasse })
  const eq = (etat.equipements ?? []).map(k => EQUIPEMENT_LABELS[k]?.[lang] ?? k)
  if (eq.length) out.push({ label: t.equipements, value: eq.join(', ') })
  return out
}

/** Régime des sommes versées d'avance (droit français seulement) */
export function regimeText(regime: RegimeAvance, lang: Lang, pays: string): string | null {
  if (pays !== 'FR') return null
  if (regime === 'acompte') {
    return {
      fr: "Les sommes versées à la réservation sont un acompte : la réservation est ferme pour les deux parties. En cas d'annulation, le locataire reste en principe redevable du prix convenu, sous réserve des conditions d'annulation ci-dessous.",
      pt: 'Os montantes pagos na reserva constituem um adiantamento (acompte, direito francês): a reserva é firme para ambas as partes. Em caso de cancelamento, o hóspede continua em princípio obrigado ao preço acordado, sem prejuízo das condições de cancelamento abaixo.',
      en: 'The sums paid on booking are a down payment (acompte, French law): the booking is firm for both parties. If the guest cancels, they remain in principle liable for the agreed price, subject to the cancellation terms below.',
    }[lang]
  }
  return {
    fr: "Les sommes versées à la réservation sont des arrhes (article L214-1 du Code de la consommation) : le locataire qui renonce au séjour les perd, le bailleur qui annule en rend le double (article 1590 du Code civil), sauf conditions d'annulation plus favorables au locataire ci-dessous.",
    pt: 'Os montantes pagos na reserva constituem arras (arrhes, art. L214-1 do Código do Consumo francês): o hóspede que desiste perde-as, o senhorio que cancela devolve o dobro (art. 1590 do Código Civil francês), salvo condições de cancelamento mais favoráveis ao hóspede indicadas abaixo.',
    en: 'The sums paid on booking are a deposit (arrhes, Art. L214-1 of the French Consumer Code): a guest who withdraws forfeits it, a landlord who cancels repays twice the amount (Art. 1590 of the French Civil Code), unless the cancellation terms below are more favourable to the guest.',
  }[lang]
}

/** Annulation par le bailleur (+ absence de rétractation en droit français) */
export function bailleurCancelText(regime: RegimeAvance, lang: Lang, pays: string): string {
  const refund = {
    fr: "Si le bailleur annule la location, il rembourse au locataire l'intégralité des sommes reçues dans les 14 jours",
    pt: 'Se o senhorio cancelar o arrendamento, reembolsa ao hóspede a totalidade dos montantes recebidos no prazo de 14 dias',
    en: 'If the landlord cancels the rental, they refund the guest all sums received within 14 days',
  }[lang]
  const extra = pays !== 'FR' ? '.'
    : regime === 'arrhes'
      ? { fr: ", et lui verse en plus une somme égale aux arrhes (article 1590 du Code civil).", pt: ', e paga-lhe ainda um montante igual às arras (art. 1590 do Código Civil francês).', en: ', and pays them an additional amount equal to the deposit (Art. 1590 of the French Civil Code).' }[lang]
      : { fr: ", sans préjudice des dommages et intérêts que le locataire pourrait réclamer.", pt: ', sem prejuízo da indemnização que o hóspede possa reclamar.', en: ', without prejudice to any damages the guest may claim.' }[lang]
  const retract = pays === 'FR'
    ? ' ' + {
      fr: "Conformément à l'article L221-28 12° du Code de la consommation, le locataire ne dispose pas d'un droit de rétractation pour cette location à dates déterminées.",
      pt: 'Nos termos do art. L221-28 12° do Código do Consumo francês, o hóspede não dispõe de direito de livre resolução para este arrendamento em datas determinadas.',
      en: 'Under Art. L221-28 12° of the French Consumer Code, the guest has no right of withdrawal for this rental on fixed dates.',
    }[lang]
    : ''
  const force = ' ' + {
    fr: "Un événement de force majeure (article 1218 du Code civil) empêchant l'une des parties d'exécuter le contrat entraîne le remboursement des sommes versées, sans autre indemnité.",
    pt: 'Um caso de força maior que impeça uma das partes de cumprir o contrato implica o reembolso dos montantes pagos, sem outra indemnização.',
    en: 'A force majeure event preventing either party from performing the contract leads to the refund of sums paid, with no other compensation.',
  }[lang]
  return refund + extra + retract + force
}

/** Pièce d'identité et déclaration à l'arrivée */
export function arriveeText(lang: Lang, pays: string): string {
  if (pays === 'PT') {
    return {
      fr: "À son arrivée, le locataire présente une pièce d'identité en cours de validité pour chaque voyageur majeur. Les données nécessaires à la déclaration SIBA sont relevées, sans conservation de copie au-delà de ce qu'exige la loi.",
      pt: 'À chegada, o hóspede apresenta um documento de identificação válido de cada hóspede adulto. Os dados necessários à comunicação SIBA são registados, sem conservação de cópia além do exigido por lei.',
      en: 'On arrival, the guest shows a valid identity document for each adult guest. The data required for the SIBA declaration is recorded, with no copy kept beyond what the law requires.',
    }[lang]
  }
  return {
    fr: "À son arrivée, le locataire présente une pièce d'identité en cours de validité (carte d'identité ou passeport). Le bailleur la vérifie sans en conserver de copie. Les voyageurs de nationalité étrangère remplissent et signent une fiche individuelle de police (articles R814-1 à R814-3 du CESEDA), conservée six mois.",
    pt: 'À chegada, o hóspede apresenta um documento de identificação válido (cartão de cidadão ou passaporte). O senhorio verifica-o sem conservar cópia. Os hóspedes de nacionalidade estrangeira preenchem e assinam uma ficha individual de polícia (art. R814-1 a R814-3 do CESEDA francês), conservada durante seis meses.',
    en: 'On arrival, the guest shows a valid identity document (ID card or passport). The landlord checks it without keeping a copy. Guests of foreign nationality fill in and sign an individual police form (Art. R814-1 to R814-3 of the French CESEDA), kept for six months.',
  }[lang]
}

/** Répartit le prix total : hébergement, dont ménage, taxe incluse ou en sus */
export function priceLines(total: number, d: ContractDetails, lang: Lang, fmt: (n: number) => string): Array<{ label: string; value: string; sub?: boolean }> {
  const t = EXTRA_UI[lang]
  const lines: Array<{ label: string; value: string; sub?: boolean }> = [{ label: t.prixHebergement, value: fmt(total) }]
  if (d.frais_menage && d.frais_menage > 0) lines.push({ label: t.dontMenage, value: fmt(d.frais_menage), sub: true })
  if (d.taxe_sejour && d.taxe_sejour > 0) {
    if (d.taxe_sejour_mode === 'en_sus') lines.push({ label: t.taxeEnSus, value: fmt(d.taxe_sejour) })
    else lines.push({ label: t.taxeIncluse, value: fmt(d.taxe_sejour), sub: true })
  }
  return lines
}
