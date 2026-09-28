import { redirect } from 'next/navigation'

// Ancienne adresse : « Paiements en ligne » de Mes finances (refonte sept. 2026)
export default function EncaissementsRedirect() {
  redirect('/dashboard/finances/encaissements')
}
