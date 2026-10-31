// Suites d'une inscription (formulaire ou Google) : e-mail à Jason et ajout à
// la lettre Brevo. Ne font jamais échouer l'inscription.
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailP, emailInfoBlock, escHtml } from '@/lib/email/template'
import { describeAcquisition, type Acquisition } from '@/lib/acquisition/rules'
import { NEWSLETTER_LISTS } from '@/lib/newsletter/lists'
import { logger } from '@/lib/logger'

const log = logger('nouveau-membre')

export function annoncerInscription(m: {
  email: string
  fullName: string | null
  isInvestor: boolean
  isDriingMember: boolean
  acquisition: Acquisition | null
  via: 'formulaire' | 'google'
}): Promise<void> {
  const dateStr = new Date().toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })
  const profilLabel = m.isInvestor ? 'Investisseur' : 'Hôte'
  const v = describeAcquisition(m.acquisition)
  return new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Jason Marinho <noreply@jasonmarinho.com>',
    to: 'contact@jasonmarinho.com',
    subject: `Nouvelle inscription ${profilLabel} : ${m.fullName || m.email}`,
    html: buildEmail({
      title: 'Une nouvelle personne vient de rejoindre !',
      preview: `${m.fullName || m.email} vient de créer un compte ${profilLabel.toLowerCase()} sur ta plateforme.`,
      body: `
        ${emailP(`<strong style="color:#e8ede8;">Bonne nouvelle !</strong> Une nouvelle personne vient de rejoindre ta communauté. C'est la preuve que ton travail attire et convainc, continue comme ça, tu construis quelque chose de solide.`)}
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
