// Photo de signature des e-mails de prospection : compte une ouverture puis
// redirige vers la vraie photo. Conforme à la recommandation CNIL du
// 12/03/2026 sur les pixels (sans consentement) : un compteur anonyme par
// e-mail de séquence, et pour la délivrabilité la seule date (sans l'heure)
// de la dernière ouverture du contact. Rien n'est enregistré par envoi.
//
// Limites connues, affichées dans l'admin : Apple Mail charge les images à la
// réception (ouvertures en trop), les messageries qui bloquent les images
// n'en comptent aucune (ouvertures en moins).

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { SIGNATURE_PHOTO_URL } from '@/lib/outreach/engine'
import { parisToday } from '@/lib/stripe/deposit-window'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Un antivirus ou un filtre qui charge l'image dans la minute de l'envoi n'est pas un lecteur
const MIN_DELAY_MS = 60_000

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const redirect = NextResponse.redirect(SIGNATURE_PHOTO_URL, 302)
  redirect.headers.set('Cache-Control', 'no-store, max-age=0')
  if (!UUID.test(params.id)) return redirect
  try {
    await countOpen(params.id)
  } catch {
    // Le compteur ne doit jamais empêcher la photo de s'afficher
  }
  return redirect
}

async function countOpen(sendId: string) {
  const db = getServiceClient()
  const { data: send } = await db.from('outreach_sends')
    .select('contact_id, sequence_id, step_position, sent_at, status')
    .eq('id', sendId).maybeSingle()
  if (!send || send.status !== 'envoye' || !send.sequence_id || send.step_position == null || !send.contact_id) return
  const sentAt = new Date(send.sent_at)
  if (Date.now() - sentAt.getTime() < MIN_DELAY_MS) return

  // Une ouverture par contact et par e-mail : si le contact a déjà ouvert
  // depuis cet envoi (même e-mail rouvert, doublon), on ne recompte pas.
  const { data: contact, error } = await db.from('outreach_contacts').select('last_open_on').eq('id', send.contact_id).maybeSingle()
  if (error) return // migration 117 pas appliquée
  const sentDay = parisToday(sentAt)
  if (contact?.last_open_on && contact.last_open_on >= sentDay) return

  const today = parisToday()
  const { error: rpcError } = await db.rpc('outreach_count_open', { p_sequence: send.sequence_id, p_step: send.step_position })
  if (rpcError) return
  await db.from('outreach_contacts').update({ last_open_on: today }).eq('id', send.contact_id)
}
