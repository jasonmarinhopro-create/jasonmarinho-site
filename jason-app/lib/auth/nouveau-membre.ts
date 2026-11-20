// Suites d'une inscription (formulaire ou Google) : e-mail à Jason et ajout à
// la lettre Brevo. Ne font jamais échouer l'inscription.
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailP, emailInfoBlock, emailStats, escHtml, EMAIL_FROM } from '@/lib/email/template'
import { getServiceClient } from '@/lib/supabase/service'
import { describeAcquisition, type Acquisition } from '@/lib/acquisition/rules'
import { NEWSLETTER_LISTS } from '@/lib/newsletter/lists'
import { logger } from '@/lib/logger'
import { emailTags } from '@/lib/email/tracking'

const log = logger('nouveau-membre')

/** Compteurs pour l'e-mail à Jason : inscrits du mois (heure de Paris) et total. null si la base ne répond pas. */
async function compteursInscriptions(): Promise<{ mois: number; total: number } | null> {
  try {
    const db = getServiceClient()
    const debut = `${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }).slice(0, 7)}-01T00:00:00+01:00`
    const [mois, total] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', debut).neq('role', 'admin'),
      db.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
    ])
    if (mois.error || total.error || mois.count === null || total.count === null) return null
    return { mois: mois.count, total: total.count }
  } catch {
    return null
  }
}

export interface InscriptionInfo {
  email: string
  fullName: string | null
  isInvestor: boolean
  isDriingMember: boolean
  acquisition: Acquisition | null
  via: 'formulaire' | 'google'
}

/** E-mail « nouvelle inscription » pour Jason (pur, pour la galerie) */
export function inscriptionEmail(m: InscriptionInfo, compteurs: { mois: number; total: number } | null, now: Date = new Date()): { subject: string; html: string } {
  const dateStr = now.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })
  const profilLabel = m.isInvestor ? 'Investisseur' : 'Hôte'
  const v = describeAcquisition(m.acquisition)
  return {
    subject: `Nouvelle inscription ${profilLabel} : ${m.fullName || m.email}`,
    html: buildEmail({
      etiquette: `Pour toi · Inscription ${profilLabel.toLowerCase()}`,
      title: 'Une nouvelle personne vient de rejoindre !',
      preview: `${m.fullName || m.email} vient de créer un compte ${profilLabel.toLowerCase()} sur ta plateforme.`,
      body: `
        ${emailP(`<strong>Bonne nouvelle !</strong> Une nouvelle personne vient de rejoindre ta communauté. C'est la preuve que ton travail attire et convainc, continue comme ça, tu construis quelque chose de solide.`)}
        ${compteurs ? emailStats([
          { label: 'Inscrits ce mois-ci', value: String(compteurs.mois), hint: 'hôtes et investisseurs' },
          { label: 'Membres au total', value: compteurs.total.toLocaleString('fr-FR').replace(/\u202f| /g, ' ') },
        ]) : ''}
        ${emailInfoBlock([
          { label: 'Profil', value: profilLabel },
          { label: 'Prénom / Nom', value: escHtml(m.fullName || '-') },
          { label: 'Email', value: escHtml(m.email) },
          { label: 'Inscription', value: m.via === 'google' ? 'Avec Google' : 'Formulaire' },
          { label: 'Membre Driing', value: m.isDriingMember ? 'Oui' : 'Non' },
          { label: 'Provenance', value: escHtml([v.label, v.detail, v.landing ? `arrivé sur ${v.landing}` : null].filter(Boolean).join(' · ')) },
          { label: 'Inscription le', value: escHtml(dateStr) },
        ])}
        ${emailBtn(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/membres`, 'Voir les membres', 'secondary')}
      `,
    }),
  }
}

export async function annoncerInscription(m: InscriptionInfo): Promise<void> {
  const mail = inscriptionEmail(m, await compteursInscriptions())
  await new Resend(process.env.RESEND_API_KEY).emails.send({ tags: emailTags('admin'),
    from: EMAIL_FROM,
    to: 'contact@jasonmarinho.com',
    subject: mail.subject,
    html: mail.html,
  }).then(() => undefined, () => undefined)
}

export async function inscrireNewsletter(email: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({ email, listIds: NEWSLETTER_LISTS, updateEnabled: true }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) log.error('brevo newsletter', { status: res.status, body: (await res.text()).slice(0, 200) })
  } catch (e) {
    log.warn('brevo', { err: String(e) })
  }
}

/** Lien de l'e-mail : connexion directe à l'espace (page /auth/confirmer). */
export function lienConfirmation(hashedToken: string, type: 'signup' | 'magiclink'): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirmer?t=${encodeURIComponent(hashedToken)}&type=${type}`
}
