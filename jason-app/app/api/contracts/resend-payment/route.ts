import { getServiceClient as createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { logger } from '@/lib/logger'
import { toEmailLang } from '@/lib/email/contract-i18n'
import { htmlToText } from '@/lib/email/template'
import { contractFrom, paymentReminderEmail, virementReference } from '@/lib/email/contract-emails'
import { depositWindow, depositOpensOn } from '@/lib/stripe/deposit-window'
import { emailTags } from '@/lib/email/tracking'
const log = logger('api/contracts/resend-payment')

export const dynamic = 'force-dynamic'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// POST /api/contracts/resend-payment
// Body: { contract_id }
// Renvoie l'email de paiement au voyageur
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification de l'hôte (getUser valide le token côté serveur Supabase)
    const supabase = await createAuthClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { contract_id } = await request.json()
    if (!contract_id) {
      return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })
    }

    const db = createServiceClient()

    // Récupérer le contrat (vérification ownership)
    const { data: contract, error: fetchErr } = await db
      .from('contracts')
      .select('id, token, user_id, statut, langue, bailleur_prenom, bailleur_nom, bailleur_email, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_adresse, date_arrivee, date_depart, montant_loyer, montant_caution, modalites_paiement, stripe_payment_enabled, stripe_payment_status, stripe_deposit_status')
      .eq('id', contract_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    if (contract.statut !== 'signe') {
      return NextResponse.json({ error: 'Le contrat doit être signé pour renvoyer les liens de paiement.' }, { status: 400 })
    }

    if (!contract.locataire_email) {
      return NextResponse.json({ error: 'Aucun email renseigné pour ce voyageur.' }, { status: 400 })
    }

    const emailLang = toEmailLang(contract.langue)

    const guestName = `${contract.locataire_prenom} ${contract.locataire_nom}`
    const propertyLabel = (contract.logement_nom as string | null) ?? contract.logement_adresse
    const contractUrl = `${APP_URL}/sign/${contract.token}`
    const paymentRedirectUrl = `${APP_URL}/api/stripe/payment/redirect?token=${contract.token}`
    const depositRedirectUrl = `${APP_URL}/api/stripe/deposit/redirect?token=${contract.token}`

    const hasPayment = !!(contract.stripe_payment_enabled) && contract.stripe_payment_status !== 'paid'
    const cautionDue = Number(contract.montant_caution) > 0 &&
      contract.stripe_deposit_status !== 'held' &&
      contract.stripe_deposit_status !== 'captured'
    // Lien de caution actif seulement de J-2 au départ (lib/stripe/deposit-window.ts) :
    // avant, on annonce la date d'envoi au lieu d'un lien qui ne marcherait pas
    const depositState = depositWindow(contract.date_arrivee, contract.date_depart)
    const hasCaution = cautionDue && depositState === 'open'
    const cautionLater = cautionDue && depositState === 'not_yet'
    const depositOpensLabel = new Date(`${depositOpensOn(contract.date_arrivee)}T12:00:00Z`)
      .toLocaleDateString(emailLang === 'pt' ? 'pt-PT' : 'fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })

    const isVirement = typeof contract.modalites_paiement === 'string' &&
      contract.modalites_paiement.toLowerCase().includes('virement')

    // Pour les contrats virement bancaire, on peut toujours renvoyer les coordonnées IBAN
    let hostIban: string | null = null
    let hostBic: string | null = null
    if (isVirement) {
      const { data: hostProfile } = await db
        .from('profiles')
        .select('iban, bic')
        .eq('id', contract.user_id)
        .single()
      hostIban = hostProfile?.iban ?? null
      hostBic = hostProfile?.bic ?? null
    }

    if (!hasPayment && !hasCaution && !isVirement) {
      return NextResponse.json({
        error: cautionLater
          ? `Rien à régler pour l'instant : le lien de caution partira automatiquement au voyageur le ${new Date(`${depositOpensOn(contract.date_arrivee)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, 2 jours avant l'arrivée.`
          : 'Tous les paiements ont déjà été effectués.',
      }, { status: 400 })
    }

    const loyerFormatted = Number(contract.montant_loyer).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
    const cautionFormatted = Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
    const hostName = `${contract.bailleur_prenom} ${contract.bailleur_nom}`

    const mail = paymentReminderEmail({
      lang: emailLang, hostName, guestName, property: propertyLabel, contractUrl,
      payments: {
        payUrl: hasPayment ? paymentRedirectUrl : null,
        loyer: loyerFormatted,
        depositUrl: hasCaution ? depositRedirectUrl : null,
        caution: hasCaution || cautionLater ? cautionFormatted : null,
        depositLater: cautionLater ? depositOpensLabel : null,
      },
      virement: isVirement && hostIban ? {
        iban: hostIban, bic: hostBic, beneficiaire: hostName,
        montant: Number(contract.montant_loyer) > 0 ? loyerFormatted : null,
        reference: virementReference(contract.logement_adresse),
      } : null,
    })

    const { error: emailErr } = await getResend().emails.send({ tags: emailTags('voyageur'),
      from: contractFrom(hostName),
      replyTo: contract.bailleur_email || undefined,
      to: contract.locataire_email,
      subject: mail.subject,
      html: mail.html,
      text: htmlToText(mail.html),
    })

    if (emailErr) {
      log.error('emailSend', { err: String(emailErr) })
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
