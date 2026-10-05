import { redirect } from 'next/navigation'

// « Paiements en ligne » a rejoint Contrats & paiements (onglet Paiements,
// 05/10/2026, demande de Jason : tout ce qui concerne les contrats directs au
// même endroit). Mes finances garde les revenus, le journal et la fiscalité.
export default function PaiementsEnLigneRedirect() {
  redirect('/dashboard/contrats?onglet=paiements')
}
