// Les parcours vivent dans l'onglet Parcours de l'espace Formations (23/11/2026)
import { redirect } from 'next/navigation'

export default function ParcoursPage() {
  redirect('/dashboard/formations?onglet=parcours')
}
