// Dépannage et maintenance (31/10/2026) : listes propres au métier, partagées
// par Ma fiche, Créer ma fiche, l'admin et la fiche publique. Les valeurs de
// délai suivent la contrainte de la table depannage_pros (migration 170).
import { SPECIALITES_DEPANNAGE } from './metiers'

export const DISPONIBILITES_DEPANNAGE = [
  { id: 'semaine', label: 'En semaine' },
  { id: 'soir', label: 'Le soir' },
  { id: 'weekend', label: 'Le week-end' },
  { id: 'urgence', label: 'Urgences' },
] as const

export const DELAIS_DEPANNAGE = [
  { id: 'jour_meme', label: 'Le jour même' },
  { id: '24h', label: 'Sous 24 h' },
  { id: '48h', label: 'Sous 48 h' },
  { id: 'semaine', label: 'Dans la semaine' },
] as const

export const specialiteLabel = (id: string) => SPECIALITES_DEPANNAGE.find(s => s.id === id)?.label ?? id
export const dispoLabel = (id: string) => DISPONIBILITES_DEPANNAGE.find(d => d.id === id)?.label ?? id
export const delaiLabel = (id: string | null | undefined) => DELAIS_DEPANNAGE.find(d => d.id === id)?.label ?? null
