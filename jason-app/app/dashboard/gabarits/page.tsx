import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
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

  const [{ data: templates }, { data: favData }, { data: custData }] = await Promise.all([
    supabase.from('templates').select('id, title, content, corps_en, category, timing, variante, variables, tags, copy_count, created_at').order('category').order('title').limit(500),
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
        templates={(templates ?? []) as Template[]}
        initialFavorites={initialFavorites}
        initialCustomizations={(custData ?? []) as UserTemplateCustomization[]}
        userId={userId}
      />
    </>
  )
}
