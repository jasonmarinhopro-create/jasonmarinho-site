import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import OutilsImpressionView from './OutilsImpressionView'

export const metadata = {
  title: 'Outils Impression — QR Code & Affiches',
}

export default async function OutilsImpressionPage() {
  const profile = await getProfile()
  const plan = profile?.plan ?? 'decouverte'
  const userId = profile?.userId ?? ''

  const supabase = await createClient()
  const { data: logements } = await supabase
    .from('logements')
    .select('id, nom, adresse, wifi_nom, wifi_mdp')
    .eq('user_id', userId)
    .order('nom')

  return (
    <OutilsImpressionView
      plan={plan}
      logements={(logements ?? []) as { id: string; nom: string; adresse?: string; wifi_nom?: string; wifi_mdp?: string }[]}
    />
  )
}
