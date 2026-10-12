'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { LINK_CHANNELS, makeLinkCode, normalizeDestination, shortLinkUrl } from '@/lib/acquisition/rules'
import {
  applyOverrides, buildPrompt, cleanFacebookText, finalLink, makeGroupCode, pickResources, readMessage, readingTitle, trackUrl,
  type GroupOverrides, type GroupReading, type GroupResource,
} from '@/lib/acquisition/groupes'
import { loadGroupCatalog } from '@/lib/acquisition/groupes-load'

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

// ── Onglet Groupes : lire un message de groupe Facebook et préparer le prompt ──

export type GroupReplyResult =
  | {
      ok: true
      code: string
      text: string
      author: string | null
      group: string | null
      reading: GroupReading
      title: string
      resources: Array<GroupResource & { tracked: string }>
      final: { url: string; instruction: string; label: string }
      prompt: string
      promptShort: string
      saved: boolean
    }
  | { ok: false; error: string }

export async function prepareGroupReply(input: { text: string; overrides?: GroupOverrides; code?: string }): Promise<GroupReplyResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Réservé à l\'administration.' }
  const { text, author, group: seenGroup } = cleanFacebookText(String(input.text ?? '').slice(0, 20_000))
  if (text.length < 5) return { ok: false, error: 'Rien à lire : copie le texte du message dans Facebook, puis colle-le ici.' }

  const o = input.overrides ?? {}
  const reading = applyOverrides(readMessage(text), o)
  const catalog = await loadGroupCatalog()
  const resources = pickResources({ text, reading, articles: catalog.articles, pros: catalog.pros })
  const code = input.code && /^g[a-z2-9]{6}$/.test(input.code) ? input.code : makeGroupCode()
  const group = (typeof o.group === 'string' && o.group.trim() ? o.group : seenGroup ?? '').slice(0, 120) || undefined
  const corrected = !!(o.profile || o.city !== undefined || o.topics)

  // Ce que l'outil a compris, jamais le message lui-même
  const db = getServiceClient()
  const row = { profile: reading.profile, topics: reading.topics, city: reading.city, resources: resources.length, corrected, updated_at: new Date().toISOString() }
  const res = input.code
    ? await db.from('group_replies').update(row).eq('code', code)
    : await db.from('group_replies').insert({ code, ...row })
  const saved = !res.error
  if (res.error && !isMissingRelation(res.error.code)) console.error('group_replies', res.error.message)

  const end = finalLink(reading.profile, reading.topics)
  const common = { message: text, author, reading, resources, code, group }
  return {
    ok: true, code, text, author, group: group ?? null, reading,
    title: readingTitle(reading),
    resources: resources.map(r => ({ ...r, tracked: trackUrl(r.url, code) })),
    final: { url: trackUrl(end.url, code), instruction: end.instruction, label: end.label },
    prompt: buildPrompt(common),
    promptShort: buildPrompt({ ...common, short: true }),
    saved,
  }
}
