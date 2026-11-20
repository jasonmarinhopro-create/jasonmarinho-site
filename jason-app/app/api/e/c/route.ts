// Clic sur un bouton d'e-mail (20/11/2026) : compté de façon anonyme (jour,
// catégorie, bouton ; aucune personne), puis redirection vers la page prévue.
// Seules nos adresses sont acceptées (pas de redirection ouverte).
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { buttonKey, isAllowedTarget, isEmailCategory } from '@/lib/email/tracking'
import { parisToday } from '@/lib/stripe/deposit-window'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const target = p.get('u') ?? ''
  if (!isAllowedTarget(target)) return NextResponse.redirect('https://jasonmarinho.com', 302)
  const c = p.get('c') ?? ''
  const b = buttonKey(p.get('b') ?? '')
  if (isEmailCategory(c)) {
    // Best-effort : un compteur qui échoue ne bloque jamais le lien
    await getServiceClient().rpc('email_click_count', { p_jour: parisToday(), p_categorie: c, p_bouton: b }).then(() => undefined, () => undefined)
  }
  return NextResponse.redirect(target, 302)
}
