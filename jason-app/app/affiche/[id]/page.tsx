import { notFound } from 'next/navigation'
import { getAfficheById } from '@/app/dashboard/outils-impression/actions'
import AffichePublicView from './AffichePublicView'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const affiche = await getAfficheById(params.id)
  if (!affiche) return { title: 'Affiche introuvable' }
  const data = affiche.data as Record<string, unknown>
  const nom = (data.logementNom as string) ?? 'Logement'
  return {
    title: `Affiche — ${nom}`,
    description: `QR code WiFi et informations de contact pour ${nom}`,
  }
}

export default async function AffichePublicPage({ params }: Props) {
  const affiche = await getAfficheById(params.id)
  if (!affiche) notFound()

  return <AffichePublicView data={affiche.data as Record<string, unknown>} />
}
