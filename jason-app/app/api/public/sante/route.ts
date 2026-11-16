// La base répond-elle ? (16/11/2026) Lu par la page d'erreur de l'app pour
// dire à l'utilisateur ce qui se passe : « la base fait une pause » plutôt que
// « une erreur s'est produite ». Un appel minuscule à la base (is_admin, sans
// session, 4 s au plus), gardé 8 s en mémoire pour qu'une page d'erreur
// ouverte chez plusieurs personnes ne charge pas une base déjà en peine.
// Rend seulement l'état et la durée : rien de personnel, route ouverte.
import { NextResponse } from 'next/server'
import { etatDeLaBase, type EtatBase } from '@/lib/errors/diagnostic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

let garde: { t: number; corps: { base: EtatBase; ms: number } } | null = null

export async function GET() {
  const reponse = (corps: { base: EtatBase; ms: number }) => NextResponse.json(corps, { headers: { 'Cache-Control': 'no-store' } })
  if (garde && Date.now() - garde.t < 8000) return reponse(garde.corps)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const t0 = Date.now()
  let status = 0
  if (url && anon) {
    try {
      const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
        method: 'POST', body: '{}', cache: 'no-store', signal: AbortSignal.timeout(4000),
        headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
      })
      status = r.status
    } catch { status = 0 }
  }
  const ms = Date.now() - t0
  const corps = { base: etatDeLaBase({ status, ms }), ms }
  garde = { t: Date.now(), corps }
  return reponse(corps)
}
