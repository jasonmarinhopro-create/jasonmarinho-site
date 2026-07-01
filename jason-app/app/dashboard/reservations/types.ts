export type Platform = 'airbnb' | 'booking' | 'driing' | 'vrbo' | 'direct'
export type ReservationStatus = 'upcoming' | 'ongoing' | 'past'

export interface Reservation {
  id: string
  source: 'contract' | 'sejour'
  sourceId: string
  voyageur_id: string | null
  voyageur_name: string
  voyageur_email: string | null
  voyageur_phone: string | null
  logement_id: string | null
  logement_name: string
  date_arrivee: string
  date_depart: string
  montant: number | null
  nb_voyageurs: number | null
  platform: Platform
  contract_status: string | null
  payment_status: string | null
  checklist_status: Record<string, boolean> | null
}

export interface LogementLite {
  id: string
  nom: string
}

export const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  airbnb:  { label: 'Airbnb',  color: '#FF385C' },
  booking: { label: 'Booking', color: '#003580' },
  driing:  { label: 'Driing',  color: '#B8860B' },
  vrbo:    { label: 'VRBO',    color: '#0072ce' },
  direct:  { label: 'Direct',  color: '#63D683' },
}
