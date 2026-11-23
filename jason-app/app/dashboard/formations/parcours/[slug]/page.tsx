// Un parcours = un objectif de l'onglet Parcours (23/11/2026)
import { redirect } from 'next/navigation'

export default function ParcoursSlugPage({ params }: { params: { slug: string } }) {
  redirect(`/dashboard/formations?onglet=parcours&objectif=${encodeURIComponent(params.slug)}`)
}
