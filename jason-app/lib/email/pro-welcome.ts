// Emails transactionnels destinés aux pros annuaire (photographes + ménage).
// Envoyés depuis le webhook Stripe (customer.subscription.created) à
// l'activation de la fiche.

import { METIERS, type ProKind } from '@/lib/pros/metiers'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailEtapes, emailFiche, emailNote, emailP, escHtml, EMAIL_FROM, EMAIL_REPLY_TO, htmlToText } from './template'

const APP_URL = 'https://app.jasonmarinho.com'
const SITE_URL = 'https://jasonmarinho.com'

const TEXTES: Record<ProKind, { annuaire: string; fiche: string; fondateurs: string }> = {
  photographer: { annuaire: 'photographes LCD', fiche: 'ta fiche photographe', fondateurs: 'des 20 premiers photographes fondateurs' },
  cleaner: { annuaire: 'équipes de ménage LCD', fiche: 'ta fiche équipe ménage', fondateurs: 'des 20 premières équipes fondatrices' },
  depannage: { annuaire: 'pros du dépannage LCD', fiche: 'ta fiche dépannage', fondateurs: 'des 20 premiers pros du dépannage fondateurs' },
}

const ETIQUETTES: Record<ProKind, string> = { photographer: 'Photo & vidéo', cleaner: 'Ménage', depannage: 'Dépannage' }

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export interface ProWelcomeArgs {
  pro: ProKind
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
/** Contenu de l'e-mail de bienvenue (pur, pour la galerie et les tests) */
export function proWelcomeEmail(args: ProWelcomeArgs): { subject: string; html: string } {
  const { pro, email, fullName, displayName, ville, slug, tier } = args
  const m = METIERS[pro]
  const isFondateur = tier === 'fondateur'
  const annual = isFondateur ? '39,98 €' : '79,98 €'
  const publicUrl = `${SITE_URL}${m.fiche(slug)}`
  const dashboardPath = m.espace
  const loginUrl = `${APP_URL}/auth/login?as=${m.slug}`
  const annuaireLabel = TEXTES[pro].annuaire
  const fiche = TEXTES[pro].fiche

  const subject = `${displayName}, ${fiche} est en ligne`

  const html = buildEmail({
    etiquette: `Ta fiche · ${ETIQUETTES[pro]}`,
    title: 'Bienvenue dans l’annuaire',
    preview: `${fiche} est en ligne. Voici les liens pour la gérer.`,
    body: [
      emailP(`Bonjour ${escHtml(fullName)},`, 10),
      emailP(`Ton paiement est confirmé et ${fiche} est <strong>en ligne dans l’annuaire des ${annuaireLabel}</strong>. Les hôtes de ${escHtml(ville)} et des environs peuvent maintenant te trouver et te contacter directement, sans commission.`),
      emailFiche([
        ['Formule', isFondateur ? 'Membre Fondateur' : 'Standard'],
        ['Tarif', `${annual} TTC / an`],
        ['Ville', ville],
        ['Identifiant', email],
      ]),
      emailP(isFondateur
        ? `Tu fais partie ${TEXTES[pro].fondateurs} : ton tarif est <strong>verrouillé à vie</strong> tant que ton abonnement reste actif.`
        : 'Ton abonnement est annuel, résiliable à tout moment depuis ton espace.'),
      emailBtn(`${APP_URL}${dashboardPath}`, 'Compléter ma fiche'),
      emailBtn(publicUrl, 'Voir ma fiche publique', 'secondary'),
      emailEtapes([
        'Ajoute tes plus belles photos et tes tarifs : une fiche complète reçoit plus de demandes.',
        'Partage le lien de ta fiche à tes clients et dans les groupes Facebook d’hôtes de ta région.',
        'Le 1er de chaque mois, tu reçois ton bilan : visites, demandes et recherches Google.',
      ]),
      emailNote(`Ta fiche publique peut mettre 2 à 3 minutes à apparaître. Connexion avec <strong>${escHtml(email)}</strong> et le mot de passe choisi à l’inscription (<a href="${loginUrl}" style="color:#004C3F;">page de connexion</a>). Factures, carte et résiliation : bouton « Gérer mon abonnement » dans ton espace.`),
    ].join(''),
    signature: 'Merci de ta confiance. Je relis chaque nouvelle fiche : si je vois une piste pour t’amener plus de demandes, je t’écris. Et si tu as une question, réponds simplement à cet e-mail.',
  })

  return { subject, html }
}

export async function sendProWelcomeEmail(args: ProWelcomeArgs): Promise<void> {
  const { subject, html } = proWelcomeEmail(args)
  const { email } = args
  try {
    await getResend().emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: email, subject, html, text: htmlToText(html) })
  } catch (err) {
    console.error('[email/pro-welcome] failed', err)
  }
}
