import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import { extractCity } from '@/lib/lcd/market-benchmarks'
import SimulateursUI from './SimulateursUI'

export const metadata = { title: 'Simulateurs LCD, Jason Marinho' }
export const dynamic = 'force-dynamic'

export type LogementPrefill = {
  id: string
  nom: string
  pays: 'FR' | 'PT' | 'ES' | 'IT' | 'BE' | 'DE' | 'NL' | 'AT' | 'CH'
  ville: string | null
  tarifNuitee: number | null
  typeLogement: string | null
  nbChambres: number | null
}

export default async function SimulateursPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()
  const { data: logements } = await supabase
    .from('logements')
    .select('id, nom, adresse, pays, tarif_nuitee_moyen, type_logement, nb_chambres')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  const prefill: LogementPrefill[] = (logements ?? []).map(l => {
    const rawPays = ((l.pays as string) ?? 'FR').toUpperCase()
    const supported = ['PT','ES','IT','BE','DE','NL','AT','CH'] as const
    const pays: LogementPrefill['pays'] =
      (supported as readonly string[]).includes(rawPays) ? (rawPays as LogementPrefill['pays']) : 'FR'
    return {
      id: l.id as string,
      nom: (l.nom as string) ?? '',
      pays,
      ville: extractCity(l.adresse as string | null),
      tarifNuitee: (l.tarif_nuitee_moyen as number | null) ?? null,
      typeLogement: (l.type_logement as string | null) ?? null,
      nbChambres: (l.nb_chambres as number | null) ?? null,
    }
  })

  return <SimulateursUI logementsPrefill={prefill} />
}
