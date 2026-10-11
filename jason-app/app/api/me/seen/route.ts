// POST /api/me/seen : note la visite du membre connecté (profiles.last_seen_at,
// migration 129), au plus toutes les 6 heures côté navigateur (LastSeenPing).
// Sert seulement à la colonne « Dernière visite » de Membres dans l'admin.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { error } = await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
  // Sans la migration 129 (colonne absente), rien à faire
  if (error && error.code !== '42703') return NextResponse.json({ error: 'failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
