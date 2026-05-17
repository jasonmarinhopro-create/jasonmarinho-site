// Types partagés client + server pour le système de notifications.

export type NotificationCategory =
  | 'sejour'    // Arrivée demain, départ, séjour à problème
  | 'fiscal'    // Approche d'un plafond fiscal (micro 15k/23k/77k7)
  | 'sync'      // Synchro iCal Airbnb échouée, Stripe non-onboardé
  | 'guide'     // Nouveau guide publié
  | 'chez_nous' // Mention/réponse forum (vue agrégée)
  | 'system'    // Maintenance, annonces produit

export type NotificationSeverity = 'info' | 'warning' | 'success' | 'error'

export interface AppNotification {
  id: string
  category: NotificationCategory
  type: string
  title: string
  body: string | null
  cta_label: string | null
  cta_href: string | null
  severity: NotificationSeverity
  metadata: Record<string, unknown>
  dedup_key: string
  read_at: string | null
  created_at: string
  expires_at: string | null
}
