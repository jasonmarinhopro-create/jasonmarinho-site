'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkAllUrls } from '@/lib/seo/check-indexation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Non autorisé')
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// Une passe (~50s) ne suffit pas pour ~500 URLs (latence réseau réelle vers
// Google) — checkAllUrls priorise les jamais-vérifiées et renvoie combien il
// en reste. Le bouton "Vérifier l'indexation" (IndexationUI) rappelle cette
// action en boucle tant que remaining > 0, pour que le clic unique aille
// jusqu'au bout sans que l'utilisateur ait à recliquer manuellement.
export async function refreshIndexationNow(): Promise<{ checked?: number; remaining?: number; error?: string }> {
  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur inattendue' }
  }
  const result = await checkAllUrls()
  revalidatePath('/dashboard/admin/indexation')
  return result
}

// Google n'a pas d'API d'écriture pour demander l'indexation d'une page
// classique (cf. lib/google/search-console.ts) — la demande se fait à la
// main dans Search Console via inspectionLink. Ces deux actions servent
// juste à garder trace de ce qui a déjà été soumis, pour ne pas perdre le
// fil sur ~500 pages (cf. le bouton "C'est fait" de Driing, réclamé en
// référence par l'utilisateur).
export async function markSubmitted(url: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur inattendue' }
  }
  const db = serviceClient()
  const { error } = await db.from('seo_indexation_status').upsert(
    { url, submitted_at: new Date().toISOString() },
    { onConflict: 'url' },
  )
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/indexation')
  return {}
}

export async function unmarkSubmitted(url: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur inattendue' }
  }
  const db = serviceClient()
  const { error } = await db.from('seo_indexation_status').update({ submitted_at: null }).eq('url', url)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/indexation')
  return {}
}
