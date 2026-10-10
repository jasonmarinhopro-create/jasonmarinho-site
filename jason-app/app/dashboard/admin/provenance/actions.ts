'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { LINK_CHANNELS, makeLinkCode, normalizeDestination, shortLinkUrl } from '@/lib/acquisition/rules'

type Result = { ok: true; url: string; code: string } | { ok: false; error: string }

const MISSING = 'Colle d\'abord la migration 20261010_126_provenance.sql dans l\'éditeur SQL de Supabase.'

async function isAdmin() {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

export async function createTrackedLink(input: { label: string; channel: string; destination: string }): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: 'Réservé à l\'administration.' }
  const label = input.label.trim().slice(0, 120)
  if (label.length < 3) return { ok: false, error: 'Donne un nom au lien (le groupe ou le post), au moins 3 caractères.' }
  const channel = LINK_CHANNELS.some(c => c.key === input.channel) ? input.channel : 'autre'
  const destination = normalizeDestination(input.destination)
  if (!destination) return { ok: false, error: 'La page d\'arrivée doit être une page de jasonmarinho.com ou de l\'app.' }

  const db = getServiceClient()
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeLinkCode(label, Math.random().toString(36).slice(2, 8))
    const { error } = await db.from('tracked_links').insert({ code, label, channel, destination })
    if (!error) {
      revalidatePath('/dashboard/admin/provenance')
      return { ok: true, url: shortLinkUrl(code), code }
    }
    if (isMissingRelation(error.code)) return { ok: false, error: MISSING }
    if (error.code !== '23505') return { ok: false, error: 'Le lien n\'a pas pu être créé. Réessaie.' }
  }
  return { ok: false, error: 'Le lien n\'a pas pu être créé. Réessaie.' }
}

export async function setTrackedLinkArchived(id: string, archived: boolean): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false }
  const { error } = await getServiceClient().from('tracked_links').update({ archived }).eq('id', id)
  if (!error) revalidatePath('/dashboard/admin/provenance')
  return { ok: !error }
}
