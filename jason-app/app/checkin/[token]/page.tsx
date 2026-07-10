import { createClient } from '@supabase/supabase-js'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import CheckinForm from './CheckinForm'

// Page publique token-based (comme /sign/[token]) : toujours fraîche,
// jamais indexée, servie via service role scoped par le token unique.
export const dynamic = 'force-dynamic'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  )
}

export async function generateMetadata() {
  return {
    title: 'Check-in en ligne',
    description: 'Complétez vos informations voyageur avant votre arrivée.',
    robots: 'noindex, nofollow',
  }
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  noStore()
  const { token } = await params
  if (!token || token.length < 16) notFound()

  const supabase = createServiceClient()

  const { data: voyageur } = await supabase
    .from('voyageurs')
    .select('id, user_id, prenom, nom, email, telephone, date_naissance, nationalite, adresse, code_postal, ville, pays, id_type, id_numero, id_pays_emetteur, checkin_completed_at')
    .eq('checkin_token', token)
    .maybeSingle()

  if (!voyageur) notFound()

  // Nom de l'hôte pour l'en-tête (confiance : le voyageur sait qui demande)
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', voyageur.user_id)
    .maybeSingle()

  // Prochain séjour à venir (contexte dates affiché au voyageur)
  const today = new Date().toISOString().split('T')[0]
  const { data: nextSejour } = await supabase
    .from('sejours')
    .select('logement, date_arrivee, date_depart')
    .eq('voyageur_id', voyageur.id)
    .eq('user_id', voyageur.user_id)
    .gte('date_depart', today)
    .order('date_arrivee')
    .limit(1)
    .maybeSingle()

  return (
    <CheckinForm
      token={token}
      hostName={hostProfile?.full_name ?? null}
      sejour={nextSejour ?? null}
      alreadyCompletedAt={voyageur.checkin_completed_at ?? null}
      initial={{
        prenom: voyageur.prenom ?? '',
        nom: voyageur.nom ?? '',
        email: voyageur.email ?? '',
        telephone: voyageur.telephone ?? '',
        date_naissance: voyageur.date_naissance ?? '',
        nationalite: voyageur.nationalite ?? '',
        adresse: voyageur.adresse ?? '',
        code_postal: voyageur.code_postal ?? '',
        ville: voyageur.ville ?? '',
        pays: voyageur.pays ?? '',
        id_type: voyageur.id_type ?? '',
        id_numero: voyageur.id_numero ?? '',
        id_pays_emetteur: voyageur.id_pays_emetteur ?? '',
      }}
    />
  )
}
