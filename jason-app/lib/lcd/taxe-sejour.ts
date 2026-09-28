// Taxe de séjour au réel (art. L2333-26 et suivants du CGCT), barème 2026.
//
// Chaque commune vote ses tarifs à l'intérieur des plafonds nationaux : le
// calculateur part du plafond et laisse l'hôte saisir le tarif de sa commune
// (sa délibération), plutôt qu'un barème de villes impossible à tenir à jour.
//
// Sources (vérifié sept. 2026) :
// - plafonds 2026 (palace 4,90 €, 5★ 3,60 €, 4★ 2,60 €, 3★ 1,70 €, 1-2★ et
//   chambres d'hôtes 1,00 € au plus) : barème DGCL « Taxe de séjour, barème
//   applicable pour 2026 », collectivites-locales.gouv.fr ;
// - non classé : 1 à 5 % du coût HT de la nuitée par personne, dans la limite
//   du tarif le plus élevé voté par la commune (plus de référence au 4★
//   depuis février 2025) ;
// - Île-de-France : taxe additionnelle régionale de 15 % et taxe additionnelle
//   de 200 % au profit d'Île-de-France Mobilités ; Paris non classé plafonné à
//   15,93 € par personne et par nuit en 2026 (4,90 € × 3,25).

export type CategorieTaxe = 'nc' | 'cdh12' | 'e3' | 'e4' | 'e5' | 'palace'

export const TAXE_SEJOUR_2026 = {
  categories: [
    { id: 'nc' as const, label: 'Non classé', plafond: null },
    { id: 'cdh12' as const, label: "1★, 2★ ou chambres d'hôtes", plafond: 1.0 },
    { id: 'e3' as const, label: '3★', plafond: 1.7 },
    { id: 'e4' as const, label: '4★', plafond: 2.6 },
    { id: 'e5' as const, label: '5★', plafond: 3.6 },
    { id: 'palace' as const, label: 'Palace', plafond: 4.9 },
  ],
  /** Tarif le plus élevé qu'une commune peut voter (palaces) */
  plafondMax: 4.9,
  tauxMin: 0.01,
  tauxMax: 0.05,
  departementale: 0.1,
  idfRegionale: 0.15,
  idfMobilites: 2.0,
}

export type TaxeSejourInput = {
  categorie: CategorieTaxe
  /** Classé : tarif voté par la commune, € par personne et par nuit */
  tarifCommune: number
  /** Non classé : taux voté (0,01 à 0,05) */
  taux: number
  /** Non classé : tarif le plus élevé voté par la commune (plafond) */
  plafondCommune: number
  /** Non classé : prix HT d'une nuit pour tout le logement */
  prixNuit: number
  adultes: number
  mineurs: number
  nuits: number
  departementale: boolean
  ileDeFrance: boolean
}

export type TaxeSejourResult = {
  /** Part communale par adulte et par nuit */
  tarifParNuit: number
  communale: number
  departementale: number
  regionale: number
  mobilites: number
  total: number
  /** Total par adulte et par nuit, taxes additionnelles comprises */
  totalParNuit: number
  plafonne: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeTaxeSejour(i: TaxeSejourInput): TaxeSejourResult {
  const adultes = Math.max(0, Math.floor(i.adultes))
  const occupants = Math.max(1, adultes + Math.max(0, Math.floor(i.mineurs)))
  const nuits = Math.max(0, Math.floor(i.nuits))
  let tarifParNuit: number
  let plafonne = false
  if (i.categorie === 'nc') {
    const taux = Math.min(TAXE_SEJOUR_2026.tauxMax, Math.max(TAXE_SEJOUR_2026.tauxMin, i.taux))
    const plafond = Math.min(TAXE_SEJOUR_2026.plafondMax, Math.max(0, i.plafondCommune))
    // Coût de la nuitée par personne : prix divisé par tous les occupants,
    // mineurs compris (ils sont exonérés mais comptent dans la division)
    const brut = (Math.max(0, i.prixNuit) / occupants) * taux
    plafonne = brut > plafond
    tarifParNuit = Math.min(brut, plafond)
  } else {
    const plafondCat = TAXE_SEJOUR_2026.categories.find(c => c.id === i.categorie)?.plafond ?? TAXE_SEJOUR_2026.plafondMax
    plafonne = i.tarifCommune > plafondCat
    tarifParNuit = Math.min(Math.max(0, i.tarifCommune), plafondCat)
  }
  const communale = tarifParNuit * adultes * nuits
  const departementale = i.departementale ? communale * TAXE_SEJOUR_2026.departementale : 0
  const regionale = i.ileDeFrance ? communale * TAXE_SEJOUR_2026.idfRegionale : 0
  const mobilites = i.ileDeFrance ? communale * TAXE_SEJOUR_2026.idfMobilites : 0
  const total = communale + departementale + regionale + mobilites
  const coef = 1 + (i.departementale ? TAXE_SEJOUR_2026.departementale : 0)
    + (i.ileDeFrance ? TAXE_SEJOUR_2026.idfRegionale + TAXE_SEJOUR_2026.idfMobilites : 0)
  return {
    tarifParNuit: round2(tarifParNuit),
    communale: round2(communale),
    departementale: round2(departementale),
    regionale: round2(regionale),
    mobilites: round2(mobilites),
    total: round2(total),
    totalParNuit: round2(tarifParNuit * coef),
    plafonne,
  }
}
