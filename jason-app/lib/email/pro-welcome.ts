// Emails transactionnels destinés aux pros annuaire (photographes + ménage).
// Envoyés depuis le webhook Stripe (customer.subscription.created) à
// l'activation de la fiche.

import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from './template'

const FROM_EMAIL = 'notifications@jasonmarinho.com'
const APP_URL = 'https://app.jasonmarinho.com'
const SITE_URL = 'https://jasonmarinho.com'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export interface ProWelcomeArgs {
  pro: 'photographer' | 'cleaner'
  email: string
  fullName: string
  displayName: string
  ville: string
  slug: string
  tier: 'fondateur' | 'standard' | string
}

/**
 * Email de bienvenue envoyé au paiement Stripe confirmé. Contient :
 * - URL publique de la fiche (visible dans 2-3 min après rebuild)
 * - Lien direct vers le dashboard ma-fiche (avec le bon ?as= côté login)
 * - Lien Stripe (factures, résiliation) — accessible via le dashboard
 * - Rappel des identifiants
 */
export async function sendProWelcomeEmail(args: ProWelcomeArgs): Promise<void> {
  const { pro, email, fullName, displayName, ville, slug, tier } = args
  const isPhotographer = pro === 'photographer'
  const isFondateur = tier === 'fondateur'
  const annual = isFondateur ? '39,98 €' : '79,98 €'
  const publicUrl = isPhotographer
    ? `${SITE_URL}/annuaires/photographes/${slug}`
    : `${SITE_URL}/annuaires/menage/${slug}`
  const dashboardPath = isPhotographer
    ? '/dashboard/ma-fiche-photographe'
    : '/dashboard/ma-fiche-menage'
  const loginAsParam = isPhotographer ? 'photographe' : 'menage'
  const loginUrl = `${APP_URL}/auth/login?as=${loginAsParam}`
  const annuaireLabel = isPhotographer ? 'photographes LCD' : 'équipes de ménage LCD'
  const fiche = isPhotographer ? 'ta fiche photographe' : 'ta fiche équipe ménage'

  const subject = `${displayName}, ${fiche} est en ligne 🎉`

  const html = buildEmail({
    title: 'Bienvenue dans l\'annuaire',
    preview: `${fiche} est désormais publique. Voici les liens pour la gérer.`,
    body: `
      ${emailP(`Bonjour ${escHtml(fullName)},`)}
      ${emailP(`Excellente nouvelle : ton paiement Stripe est confirmé et ${fiche} est <strong>en ligne dans l'annuaire des ${annuaireLabel} de Jason Marinho</strong> 🎉`)}
      ${isFondateur
        ? emailP(`Tu fais partie ${isPhotographer ? 'des 20 premiers photographes fondateurs' : 'des 20 premières équipes fondatrices'} — ton tarif de <strong>${annual} TTC / an est verrouillé à vie</strong> tant que ton abonnement reste actif.`)
        : emailP(`Ton abonnement annuel est de <strong>${annual} TTC / an</strong>, résiliable à tout moment sans engagement.`)
      }
      ${emailInfoBlock([
        { label: 'Statut', value: isFondateur ? '🌟 Membre Fondateur (à vie)' : 'Standard' },
        { label: 'Tarif', value: `${annual} TTC / an` },
        { label: 'Ville', value: escHtml(ville) },
        { label: 'Identifiant', value: escHtml(email) },
      ], '#63D683')}

      ${emailP(`<strong>Voir ${fiche} publique</strong> (le rebuild du site prend 2-3 minutes après l'activation, tu peux rafraîchir si c'est encore vide) :`)}
      ${emailBtn(publicUrl, 'Voir ma fiche publique', 'primary')}

      ${emailP(`<strong>Éditer ${fiche}</strong> (bio, tarifs, zone, prestations) :`)}
      ${emailBtn(`${APP_URL}${dashboardPath}`, 'Accéder à mon espace', 'secondary')}
      ${emailNote(`Connecte-toi avec l'email <strong>${escHtml(email)}</strong> et le mot de passe choisi à l'inscription. Première connexion : passe par <a href="${loginUrl}" style="color:#FFD56B;text-decoration:underline">cette page</a>.`)}

      ${emailP(`<strong>Gérer ton abonnement</strong> (factures, changement de carte, résiliation) : depuis ton espace dashboard, bouton « Gérer mon abonnement ». Stripe te facturera automatiquement chaque année à la même date.`)}

      ${emailP(`Pour toute question, réponds simplement à cet email.`)}
    `,
  })

  try {
    await getResend().emails.send({ from: FROM_EMAIL, to: email, subject, html })
  } catch (err) {
    console.error('[email/pro-welcome] failed', err)
  }
}
