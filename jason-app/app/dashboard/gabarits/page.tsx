import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCachedTemplatesCatalog } from '@/lib/queries/cache'
import GabaritsClient from './GabaritsClient'
import type { Template, UserTemplateCustomization, UserPinnedTemplate } from '@/types'

export interface LogementOption {
  id: string
  nom: string
  adresse?: string | null
}

export interface NextContractInfo {
  logement_nom: string
  locataire_prenom: string | null
  locataire_nom: string | null
  date_arrivee: string  // YYYY-MM-DD
  date_depart: string | null
}

export default async function GabaritsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? null
  const today = new Date().toISOString().slice(0, 10)

  const [templates, { data: favData }, { data: custData }, { data: pinData }, { data: logementsData }, { data: contractsData }] = await Promise.all([
    getCachedTemplatesCatalog(),
    userId
      ? supabase.from('user_template_favorites').select('template_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { template_id: string }[] }),
    userId
      ? supabase.from('user_template_customizations').select('id, user_id, template_id, title, content, notes, timing_label, created_at, updated_at').eq('user_id', userId)
      : Promise.resolve({ data: [] as UserTemplateCustomization[] }),
    userId
      ? supabase.from('user_pinned_templates').select('id, user_id, timing_bucket, template_id, logement_id, position, created_at, updated_at').eq('user_id', userId).order('position', { ascending: true })
      : Promise.resolve({ data: [] as UserPinnedTemplate[] }),
    userId
      ? supabase.from('logements').select('id, nom, adresse').eq('user_id', userId).order('nom')
      : Promise.resolve({ data: [] as LogementOption[] }),
    userId
      ? supabase.from('contracts')
          .select('logement_nom, locataire_prenom, locataire_nom, date_arrivee, date_depart')
          .eq('user_id', userId)
          .neq('statut', 'annule')
          .gte('date_arrivee', today)
          .order('date_arrivee', { ascending: true })
      : Promise.resolve({ data: [] as NextContractInfo[] }),
  ])

  // Pour chaque logement, on garde le contrat à venir le plus proche
  const nextContractByLogement: Record<string, NextContractInfo> = {}
  ;(contractsData ?? []).forEach((c: NextContractInfo) => {
    if (!c.logement_nom) return
    if (!nextContractByLogement[c.logement_nom]) {
      nextContractByLogement[c.logement_nom] = c
    }
  })

  const initialFavorites = (favData ?? []).map((f: { template_id: string }) => f.template_id)

  // Les templates 'facebook' sont gérés séparément dans la page Communauté
  // (posts pour groupes Facebook). On les exclut de la page Gabarits qui ne
  // concerne que les séquences de messages voyageur.
  const sequencesTemplates = templates.filter(t => t.category !== 'facebook')

  return (
    <>
      <GabaritsClient
        templates={sequencesTemplates as unknown as Template[]}
        initialFavorites={initialFavorites}
        initialCustomizations={(custData ?? []) as UserTemplateCustomization[]}
        initialPinned={(pinData ?? []) as UserPinnedTemplate[]}
        logements={(logementsData ?? []) as LogementOption[]}
        nextContractByLogement={nextContractByLogement}
        hostFullName={profile?.full_name ?? null}
        userId={userId}
      />
    </>
  )
}
