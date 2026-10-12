import { redirect } from 'next/navigation'

// Les demandes d'hôtes vivent dans le QG depuis le 12/10/2026 (fiche par demande).
export default function DemandesPage({ searchParams }: { searchParams: { demande?: string } }) {
  redirect(`/dashboard/admin/qg?onglet=hotes${searchParams.demande ? `&demande=${encodeURIComponent(searchParams.demande)}` : ''}`)
}
