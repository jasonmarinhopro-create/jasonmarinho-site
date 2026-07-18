'use server'

// Recommandation d'un pro annuaire (photographe / ménage) par un hôte.
// Le badge « Recommandé par N hôtes » est relu par les build scripts du
// site statique (scripts/build-photographers.mjs, build-cleaners.mjs).

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type ProType = 'photographer' | 'cleaner'

const TABLE_BY_TYPE: Record<ProType, string> = {
  photographer: 'photographers',
  cleaner: 'cleaners',
}

export async function getProForRecommendation(proType: ProType, proId: string): Promise<
  { error: string } | { name: string; ville: string | null; alreadyRecommended: boolean }
> {
  if (!TABLE_BY_TYPE[proType]) return { error: 'Type de pro inconnu.' }
  if (!/^[0-9a-f-]{36}$/i.test(proId)) return { error: 'Identifiant invalide.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: pro } = await admin
    .from(TABLE_BY_TYPE[proType])
    .select('id, full_name, pseudo, ville, status')
    .eq('id', proId)
    .maybeSingle()
  if (!pro || pro.status !== 'active') return { error: 'Cette fiche n\'existe pas ou n\'est plus active.' }

  const { data: existing } = await admin
    .from('pro_recommendations')
    .select('id')
    .eq('user_id', user.id)
    .eq('pro_type', proType)
    .eq('pro_id', proId)
    .maybeSingle()

  return {
    name: (pro.pseudo || pro.full_name) as string,
    ville: pro.ville ?? null,
    alreadyRecommended: !!existing,
  }
}

export async function recommendPro(proType: ProType, proId: string): Promise<{ error?: string }> {
  const check = await getProForRecommendation(proType, proId)
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Insert avec le client utilisateur : la policy RLS garantit user_id = auth.uid()
  const { error } = await supabase
    .from('pro_recommendations')
    .upsert(
      { user_id: user.id, pro_type: proType, pro_id: proId },
      { onConflict: 'user_id,pro_type,pro_id', ignoreDuplicates: true },
    )
  if (error) return { error: 'Impossible d\'enregistrer la recommandation.' }
  return {}
}
