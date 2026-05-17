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

export default async function GabaritsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? null

  const [templates, { data: favData }, { data: custData }, { data: pinData }, { data: logementsData }] = await Promise.all([
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
  ])

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
        userId={userId}
      />
    </>
  )
}
