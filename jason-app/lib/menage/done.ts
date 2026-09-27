// « Ménage fait » côté hôte : un calendar_event de catégorie 'menage' à la
// date du ménage, dont la description contient [FAIT]. Partagé par :
//   - setMenageDone (l'hôte coche dans son Calendrier, client utilisateur),
//   - l'espace de l'équipe (bouton « Terminé », client service role après
//     vérification du lien de partage).
import type { SupabaseClient } from '@supabase/supabase-js'

const escIlike = (s: string) => s.replace(/[%_\\,]/g, '\\$&')

export async function applyMenageDone(
  db: SupabaseClient,
  hostId: string,
  input: { date: string; logementName: string; done: boolean; startTime?: string; endTime?: string; notes?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing } = await db
    .from('calendar_events')
    .select('id, description')
    .eq('user_id', hostId)
    .eq('date', input.date)
    .eq('category', 'menage')
    .ilike('title', `%${escIlike(input.logementName)}%`)
    .limit(1)
    .maybeSingle()

  // ─── Décocher : supprimer l'événement (ou son tag [FAIT]) ────────────
  if (!input.done) {
    if (!existing) return { ok: true }
    // Si la description contient autre chose que [FAIT], on garde l'événement
    // pour préserver les notes manuelles éventuelles. Sinon on supprime.
    const stripped = (existing.description ?? '').replace(/\[FAIT\]\s*/, '').trim()
    if (stripped.length > 0 && stripped !== '·') {
      await db.from('calendar_events').update({ description: stripped }).eq('id', existing.id)
    } else {
      await db.from('calendar_events').delete().eq('id', existing.id)
    }
    return { ok: true }
  }

  // ─── Cocher : créer ou marquer [FAIT] ────────────────────────────────
  if (existing) {
    const desc = existing.description ?? ''
    if (!desc.includes('[FAIT]')) {
      await db.from('calendar_events').update({ description: `[FAIT] ${desc}`.trim() }).eq('id', existing.id)
    }
    return { ok: true }
  }

  const { error } = await db.from('calendar_events').insert({
    user_id: hostId,
    title: `Ménage · ${input.logementName}`,
    date: input.date,
    end_date: null,
    start_time: input.startTime ?? '11:00',
    end_time: input.endTime ?? '14:00',
    category: 'menage',
    description: `[FAIT]${input.notes ? ' · ' + input.notes : ''}`,
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}
