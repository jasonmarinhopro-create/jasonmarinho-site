// Registre des métiers pour les scripts du site (31/10/2026). Même contenu que
// jason-app/lib/pros/metiers.ts (vérifié par jason-app/lib/pros/metiers.test.ts).
// Un nouveau métier = une entrée ici et là-bas.

export const METIERS = {
  photographer: {
    kind: 'photographer', slug: 'photographe', table: 'photographers', contactsTable: 'photographer_contacts', idColumn: 'photographer_id',
    nom: 'Photographes et vidéastes', pro: 'photographe', pros: 'photographes', leMetier: 'la photo et la vidéo',
    annuaire: '/annuaires/photographes', villePrefixe: 'photographe-lcd-', api: '/api/photographer',
    ouvert: true,
  },
  cleaner: {
    kind: 'cleaner', slug: 'menage', table: 'cleaners', contactsTable: 'cleaner_contacts', idColumn: 'cleaner_id',
    nom: 'Équipes de ménage', pro: 'équipe de ménage', pros: 'équipes de ménage', leMetier: 'le ménage',
    annuaire: '/annuaires/menage', villePrefixe: 'menage-lcd-', api: '/api/cleaner',
    ouvert: true,
  },
  depannage: {
    kind: 'depannage', slug: 'depannage', table: 'depannage_pros', contactsTable: 'depannage_contacts', idColumn: 'depannage_id',
    nom: 'Dépannage et maintenance', pro: 'pro du dépannage', pros: 'pros du dépannage', leMetier: 'le dépannage',
    annuaire: '/annuaires/depannage', villePrefixe: 'depannage-lcd-', api: '/api/pro/depannage',
    ouvert: true,
  },
}

export const SPECIALITES_DEPANNAGE = [
  { id: 'electricite', label: 'Électricité' },
  { id: 'plomberie', label: 'Plomberie' },
  { id: 'chauffage', label: 'Chauffage et climatisation' },
  { id: 'serrurerie', label: 'Serrurerie' },
  { id: 'multiservice', label: 'Multiservice et petits travaux' },
  { id: 'montage', label: 'Montage de meubles' },
  { id: 'vitrerie', label: 'Vitrerie' },
  { id: 'electromenager', label: 'Électroménager' },
  { id: 'exterieur', label: 'Entretien extérieur (jardin, piscine)' },
]

/** Métiers ouverts (pages générées, liens, pied de page) */
export const METIERS_OUVERTS = Object.values(METIERS).filter(m => m.ouvert)
