// SERVER ONLY : notifie l'hôte quand un check-in en ligne est soumis.
// Sans ça, l'hôte est aveugle : impossible de savoir si un voyageur a
// (re)rempli sa fiche, ajouté un accompagnant, ou si rien ne s'est passé.

import { Resend } from 'resend'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any
import { buildEmail, emailInfoBlock, emailP, escHtml } from './template'

const FROM = 'Jason Marinho <noreply@jasonmarinho.com>'

export async function notifyHostCheckinSubmitted(supabase: AnySupabase, opts: {
  userId: string
  voyageurId: string
  /** 'main-first' = 1re complétion, 'main-update' = re-soumission du principal, 'companion' = un membre du groupe s'est ajouté */
  kind: 'main-first' | 'main-update' | 'companion'
  /** Nom de l'accompagnant qui vient de s'ajouter (kind = 'companion') */
  companionName?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const [{ data: profile }, { data: voyageur }, { data: companions }] = await Promise.all([
    supabase.from('profiles').select('email, full_name').eq('id', opts.userId).maybeSingle(),
    supabase.from('voyageurs').select('prenom, nom').eq('id', opts.voyageurId).maybeSingle(),
    supabase.from('checkin_companions').select('prenom, nom, id_numero, date_naissance, siba_sent_at').eq('voyageur_id', opts.voyageurId).eq('user_id', opts.userId),
  ])
  if (!profile?.email || !voyageur) return

  const mainName = `${voyageur.prenom ?? ''} ${voyageur.nom ?? ''}`.trim()
  const comps = companions ?? []
  const groupSize = comps.length + 1

  const subject =
    opts.kind === 'companion'
      ? `Check-in : ${opts.companionName} a rejoint le groupe de ${mainName}`
      : opts.kind === 'main-first'
        ? `Check-in complété : ${mainName}`
        : `Check-in mis à jour : ${mainName}`

  const intro =
    opts.kind === 'companion'
      ? `<strong style="color:#e8ede8;">${escHtml(opts.companionName ?? '')}</strong> vient de remplir sa fiche via le lien de groupe de ${escHtml(mainName)}.`
      : opts.kind === 'main-first'
        ? `<strong style="color:#e8ede8;">${escHtml(mainName)}</strong> vient de compléter son check-in en ligne.`
        : `<strong style="color:#e8ede8;">${escHtml(mainName)}</strong> vient de modifier son check-in en ligne (fiche déjà complétée auparavant).`

  const compRows = comps.map((c: { prenom: string; nom: string; id_numero: string | null; date_naissance: string | null; siba_sent_at: string | null }) => {
    const complete = !!(c.id_numero && c.date_naissance)
    const statut = c.siba_sent_at ? '✓ envoyé à SIBA' : complete ? 'fiche complète' : 'fiche incomplète'
    return { label: `${c.prenom} ${c.nom}`, value: statut }
  })

  const body = `
    ${emailP(intro)}
    ${emailInfoBlock([
      { label: 'Voyageur principal', value: escHtml(mainName) },
      { label: 'Groupe déclaré', value: `${groupSize} voyageur${groupSize > 1 ? 's' : ''}` },
      ...compRows,
    ])}
    ${emailP(`Retrouve la fiche complète (identité, document, signature) et le suivi des déclarations dans ton espace.`)}
  `

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: profile.email,
      subject,
      html: buildEmail({ title: subject, preview: intro.replace(/<[^>]+>/g, ''), body }),
    })
  } catch (e) {
    console.error('[checkin-notify] send failed', e)
  }
}
