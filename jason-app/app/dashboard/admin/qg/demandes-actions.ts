'use server'

// QG : suivi des demandes d'hôtes (vue, note interne, traitée, envoi à un pro).
// Admin seulement, service role après vérification du rôle.

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { envoyerAUnPro } from '@/lib/demandes/send'

const MIGRATION_MSG = 'Colonnes de suivi absentes : la migration 133 n’est pas encore passée.'

async function requireAdmin(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

async function update(id: string, values: Record<string, unknown>): Promise<{ ok: true } | { error: string }> {
  if (!(await requireAdmin())) return { error: 'Accès refusé.' }
  const { error } = await getServiceClient().from('demandes_hotes').update(values).eq('id', id)
  if (error) return { error: /admin_/.test(error.message) ? MIGRATION_MSG : 'Enregistrement impossible.' }
  return { ok: true }
}

export async function markDemandeSeen(id: string) {
  return update(id, { admin_seen_at: new Date().toISOString() })
}

export async function saveDemandeNote(id: string, note: string) {
  return update(id, { admin_note: note.trim().slice(0, 4000) || null })
}

export async function setDemandeDone(id: string, done: boolean) {
  const res = await update(id, { admin_done_at: done ? new Date().toISOString() : null, ...(done ? { admin_seen_at: new Date().toISOString() } : {}) })
  if ('ok' in res) revalidatePath('/dashboard/admin/qg')
  return res
}

export async function sendDemandeToPro(id: string, proId: string) {
  if (!(await requireAdmin())) return { error: 'Accès refusé.' }
  const res = await envoyerAUnPro(id, proId)
  if ('ok' in res) revalidatePath('/dashboard/admin/qg')
  return res
}
