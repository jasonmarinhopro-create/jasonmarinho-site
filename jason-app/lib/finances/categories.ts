// Catégories de charges du Journal (revenus_charges.categorie).
export const CHARGE_CATEGORIES: Array<{ slug: string; label: string; color: string }> = [
  { slug: 'menage',                 label: 'Ménage',                  color: '#2F9E5B' },
  { slug: 'energie',                label: 'Énergie',                 color: '#B7791F' },
  { slug: 'commissions_plateforme', label: 'Commission de plateforme', color: '#B7791F' },
  { slug: 'taxe_fonciere',          label: 'Taxe foncière',           color: '#8B6D5E' },
  { slug: 'taxe_sejour',            label: 'Taxe de séjour',          color: '#8B6D5E' },
  { slug: 'assurance',              label: 'Assurance',               color: '#4D7C5E' },
  { slug: 'travaux',                label: 'Travaux',                 color: '#C2410C' },
  { slug: 'equipement',             label: 'Équipement',              color: '#6B8E23' },
  { slug: 'abonnement',             label: 'Abonnement',              color: '#6B8E23' },
  { slug: 'comptabilite',           label: 'Comptabilité',            color: '#4D7C5E' },
  { slug: 'banque',                 label: 'Banque',                  color: '#8B6D5E' },
  { slug: 'amortissement',          label: 'Investissement amorti',   color: '#A16207' },
  { slug: 'autre',                  label: 'Autre',                   color: '#78716C' },
]

export function chargeCategory(slug: string | null | undefined) {
  return CHARGE_CATEGORIES.find(c => c.slug === slug) ?? CHARGE_CATEGORIES[CHARGE_CATEGORIES.length - 1]
}
