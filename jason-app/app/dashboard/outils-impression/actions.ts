'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'

export async function saveAffiche({
  logementId,
  data,
  existingId,
}: {
  logementId: string
  data: Record<string, unknown>
  existingId?: string
}) {
  const profile = await getProfile()
  if (!profile?.userId) return { error: 'Non authentifié' }

  const supabase = await createClient()

  if (existingId) {
    const { error } = await supabase
      .from('affiches')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .eq('user_id', profile.userId)
    if (error) return { error: error.message }
    return { id: existingId }
  }

  const { data: row, error } = await supabase
    .from('affiches')
    .insert({ user_id: profile.userId, logement_id: logementId, data })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: row.id }
}

export async function getAfficheByLogement(logementId: string) {
  const profile = await getProfile()
  if (!profile?.userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('affiches')
    .select('id, data')
    .eq('user_id', profile.userId)
    .eq('logement_id', logementId)
    .maybeSingle()
  return data
}

export async function getAfficheById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('affiches')
    .select('id, data, logement_id, user_id')
    .eq('id', id)
    .maybeSingle()
  return data
}

// ─── Liens permanents pour QR codes (qr_redirects) ──────────────────────────
// Le QR code imprimé encode /q/<slug>, une URL qui ne change JAMAIS. La
// destination réelle (target_url) se modifie librement depuis le dashboard :
// le QR déjà imprimé reste valable, seule la redirection change de cible.

function generateSlug(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8)
}

export interface QrRedirect {
  id: string
  slug: string
  label: string
  target_url: string
  logement_id: string | null
  click_count: number
  created_at: string
  updated_at: string
}

export async function listQrRedirects(): Promise<QrRedirect[]> {
  const profile = await getProfile()
  if (!profile?.userId) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('qr_redirects')
    .select('id, slug, label, target_url, logement_id, click_count, created_at, updated_at')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createQrRedirect({
  label,
  targetUrl,
  logementId,
}: {
  label: string
  targetUrl: string
  logementId?: string | null
}): Promise<{ ok: true; redirect: QrRedirect } | { ok: false; error: string }> {
  const profile = await getProfile()
  if (!profile?.userId) return { ok: false, error: 'Non authentifié' }
  if (!label.trim()) return { ok: false, error: 'Donne un nom à ce lien.' }
  if (!/^https?:\/\//i.test(targetUrl.trim())) return { ok: false, error: 'URL invalide (doit commencer par http:// ou https://).' }

  const supabase = await createClient()

  // Collision quasi impossible (8 caractères base16 = 4 milliards de
  // combinaisons) mais on retente proprement si jamais.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    const { data, error } = await supabase
      .from('qr_redirects')
      .insert({
        user_id: profile.userId,
        logement_id: logementId ?? null,
        slug,
        label: label.trim(),
        target_url: targetUrl.trim(),
      })
      .select('id, slug, label, target_url, logement_id, click_count, created_at, updated_at')
      .single()
    if (!error) {
      revalidatePath('/dashboard/outils-impression')
      return { ok: true, redirect: data }
    }
    if (error.code !== '23505') return { ok: false, error: error.message }
  }
  return { ok: false, error: 'Impossible de générer un lien unique, réessaie.' }
}

export async function updateQrRedirectTarget(id: string, targetUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfile()
  if (!profile?.userId) return { ok: false, error: 'Non authentifié' }
  if (!/^https?:\/\//i.test(targetUrl.trim())) return { ok: false, error: 'URL invalide (doit commencer par http:// ou https://).' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('qr_redirects')
    .update({ target_url: targetUrl.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', profile.userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/outils-impression')
  return { ok: true }
}

export async function updateQrRedirectLabel(id: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfile()
  if (!profile?.userId) return { ok: false, error: 'Non authentifié' }
  if (!label.trim()) return { ok: false, error: 'Le nom ne peut pas être vide.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('qr_redirects')
    .update({ label: label.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', profile.userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/outils-impression')
  return { ok: true }
}

export async function deleteQrRedirect(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfile()
  if (!profile?.userId) return { ok: false, error: 'Non authentifié' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('qr_redirects')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/outils-impression')
  return { ok: true }
}
