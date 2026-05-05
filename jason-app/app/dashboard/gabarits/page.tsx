import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCachedTemplatesCatalog } from '@/lib/queries/cache'
import dynamic from 'next/dynamic'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import type { Template, UserTemplateCustomization } from '@/types'

const GabaritsClient = dynamic(() => import('./GabaritsClient'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
})

export default async function GabaritsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? null

  const [templates, { data: favData }, { data: custData }] = await Promise.all([
    // Catalogue partagé entre tous les utilisateurs : caché 5 min.
    // copy_count peut être figé jusqu'à 5 min, accepté (compteur décoratif).
    getCachedTemplatesCatalog(),
    userId
      ? supabase.from('user_template_favorites').select('template_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { template_id: string }[] }),
    userId
      ? supabase.from('user_template_customizations').select('id, user_id, template_id, title, content, notes, timing_label, created_at, updated_at').eq('user_id', userId)
      : Promise.resolve({ data: [] as UserTemplateCustomization[] }),
  ])

  const initialFavorites = (favData ?? []).map((f: { template_id: string }) => f.template_id)

  return (
    <>
      <GabaritsClient
        templates={templates as unknown as Template[]}
        initialFavorites={initialFavorites}
        initialCustomizations={(custData ?? []) as UserTemplateCustomization[]}
        userId={userId}
      />
    </>
  )
}
