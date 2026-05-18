// Cron Vercel : ping quotidien la DB pour éviter l'auto-pause Supabase
// après 7 jours d'inactivité. Une simple SELECT sur une table existante
// suffit à compter comme "activité".
//
// Programmé tous les 6 jours via vercel.json (margin de sécurité par
// rapport à la limite officielle de 7 jours). Sécurisé par CRON_SECRET.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET(req: Request) {
  // Sécurité : Vercel injecte CRON_SECRET dans Authorization quand
  // configuré. En dev local sans secret, on bypass pour permettre le test.
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'missing env vars' }, { status: 500 })
  }

  const supabase = createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const t0 = Date.now()
  // SELECT minimaliste : 1 row, head:true (HEAD request, pas de body).
  // Coût quasi-nul mais suffit comme activité pour Supabase.
  const { error, count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .limit(1)

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      durationMs: Date.now() - t0,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'DB ping successful — Supabase auto-pause prevented',
    rowsAlive: count ?? 0,
    durationMs: Date.now() - t0,
  })
}
