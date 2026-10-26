// Liens vers une fiche précise du Guide LCD depuis les pages de l'app
// (26/10/2026, Jason : « le Guide LCD est trop caché »). Une fiche s'ouvre par
// son ancre (`id` de la carte dans app/dashboard/guide/GuideCards.tsx) :
// GuideUI retire alors filtre et recherche, fait défiler et surligne la fiche.
export const GUIDE_PATH = '/dashboard/apprendre/guide'

export const GUIDE_FICHES = {
  'commun-taxe-sejour': 'Taxe de séjour : qui, combien, comment',
  'commun-fiche-police': 'Fiche de police et registre des voyageurs',
  'commun-rgpd': 'Données des voyageurs (RGPD)',
  'commun-pricing': 'Prix et saisonnalité',
  'commun-avis': 'Avis et e-réputation',
  'commun-litiges': 'Litiges, dégâts et dépôt de garantie',
  'gites-fiscalite': 'Classement et impact fiscal',
  'gites-rentabilite': 'Calculer la rentabilité d’un bien',
  'direct-contrat': 'Le contrat sans plateforme',
  'direct-assurance': 'Assurance : pas d’AirCover hors Airbnb',
  'direct-paiement': 'Encaisser sans plateforme, sans risque',
  'direct-visibilite': 'Se rendre visible sans Airbnb',
  'direct-seo-local': 'SEO local et fiche Google',
  'direct-fidelisation': 'Fidéliser tes voyageurs',
} as const

export type GuideFicheId = keyof typeof GUIDE_FICHES

export const guideHref = (id: GuideFicheId) => `${GUIDE_PATH}#${id}`

/** Fiches proposées en bas de chaque page (dans l'ordre affiché) */
export const PAGE_GUIDE: Record<string, GuideFicheId[]> = {
  contrats: ['direct-contrat', 'direct-paiement', 'commun-litiges'],
  securite: ['direct-assurance', 'commun-fiche-police', 'commun-litiges'],
  voyageurs: ['commun-rgpd', 'commun-fiche-police', 'direct-fidelisation'],
  fiscalite: ['commun-taxe-sejour', 'gites-fiscalite'],
  messages: ['commun-avis', 'direct-fidelisation'],
  visibilite: ['direct-visibilite', 'direct-seo-local'],
  outils: ['commun-pricing', 'gites-rentabilite'],
}
