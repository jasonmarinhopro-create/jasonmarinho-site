// Désinscription en un clic (RFC 8058) : la messagerie du destinataire
// envoie un POST à l'adresse de l'en-tête List-Unsubscribe. Le lien visible
// dans l'e-mail mène à /desinscription/<jeton> (confirmation par bouton, pour
// qu'un antivirus qui ouvre les liens ne désinscrive personne).

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { suppress } from '@/lib/outreach/service'
import { verifyMemberUnsubToken } from '@/lib/admin/member-unsub'
import { memberMailSecret } from '@/lib/admin/member-mail-secret'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  const params = new URL(req.url).searchParams
  // E-mails aux membres de l'app (?m=<id signé>, lib/admin/member-mail-send.ts)
  const member = params.get('m')
  if (member) {
    const userId = verifyMemberUnsubToken(member, memberMailSecret())
    if (!userId) return NextResponse.json({ ok: false }, { status: 400 })
    const db = getServiceClient()
    const { data } = await db.from('profiles').select('email').eq('id', userId).maybeSingle()
    if (data?.email) await suppress(db, data.email, 'desinscrit')
    return NextResponse.json({ ok: true })
  }
  const token = params.get('t') ?? ''
  if (!UUID.test(token)) return NextResponse.json({ ok: false }, { status: 400 })
  const db = getServiceClient()
  const { data } = await db.from('outreach_contacts').select('email').eq('unsubscribe_token', token).maybeSingle()
  if (data?.email) await suppress(db, data.email, 'desinscrit')
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const member = new URL(req.url).searchParams.get('m')
  if (member) return NextResponse.redirect(new URL(`/desinscription/membre/${encodeURIComponent(member)}`, req.url))
  const token = new URL(req.url).searchParams.get('t') ?? ''
  return NextResponse.redirect(new URL(`/desinscription/${encodeURIComponent(token)}`, req.url))
}
