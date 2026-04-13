'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const FROM_EMAIL = 'contrats@jasonmarinho.com'

export type ContractData = {
  sejour_id: string
  voyageur_id: string

  // Bailleur
  bailleur_prenom: string
  bailleur_nom: string
  bailleur_email: string
  bailleur_telephone?: string
  bailleur_adresse?: string

  // Locataire
  locataire_prenom: string
  locataire_nom: string
  locataire_email?: string
  locataire_telephone?: string

  // Bien
  logement_adresse: string
  logement_description?: string
  capacite_max: number

  // Séjour
  date_arrivee: string
  date_depart: string
  heure_arrivee: string
  heure_depart: string

  // Financier
  montant_loyer: number
  montant_caution: number
  modalites_paiement: string

  // Clauses
  conditions_annulation: string
  reglement_interieur: string
  animaux_acceptes: boolean
  fumeur_accepte: boolean
}

// ─── Créer un contrat ─────────────────────────────────────────────────────────

export async function createContract(data: ContractData): Promise<{
  id?: string
  token?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: row, error } = await supabase
    .from('contracts')
    .insert({
      ...data,
      user_id: session.user.id,
      statut: 'en_attente',
    })
    .select('id, token')
    .single()

  if (error) return { error: error.message }

  // Mettre à jour le statut du séjour associé
  await supabase
    .from('sejours')
    .update({ contrat_statut: 'en_attente' })
    .eq('id', data.sejour_id)
    .eq('user_id', session.user.id)

  // Envoyer l'email de signature au voyageur (si email disponible)
  if (data.locataire_email) {
    const signUrl = `${APP_URL}/sign/${row.token}`
    const hostName = `${data.bailleur_prenom} ${data.bailleur_nom}`
    const guestName = `${data.locataire_prenom} ${data.locataire_nom}`
    const dateArr = new Date(data.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateDep = new Date(data.date_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.locataire_email,
      subject: `Contrat de location à signer — ${data.logement_adresse}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#132b22;border:1px solid #1e3d2f;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #1e3d2f;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#FFD56B;font-weight:600;">Contrat de location</p>
        <h1 style="margin:0;font-size:24px;font-weight:400;color:#f0ebe1;font-family:Georgia,serif;">À signer — ${data.logement_adresse}</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Bonjour <strong style="color:#f0ebe1;">${guestName}</strong>,
        </p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          <strong style="color:#f0ebe1;">${hostName}</strong> vous invite à signer votre contrat de location pour le séjour du <strong style="color:#f0ebe1;">${dateArr}</strong> au <strong style="color:#f0ebe1;">${dateDep}</strong>.
        </p>
        <div style="background:#0d1f1a;border:1px solid #1e3d2f;border-radius:12px;padding:18px 20px;margin:24px 0;">
          <p style="margin:0 0 6px;font-size:12px;color:#a5c4b0;text-transform:uppercase;letter-spacing:1px;">Logement</p>
          <p style="margin:0;font-size:15px;color:#f0ebe1;font-weight:500;">${data.logement_adresse}</p>
        </div>
        <a href="${signUrl}" style="display:block;text-align:center;background:#FFD56B;color:#0d1f1a;padding:16px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:28px 0;">
          Lire et signer le contrat
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">
          Ce lien est valable 30 jours. La signature de ce contrat constitue une signature électronique simple au sens du règlement eIDAS (UE) 910/2014, juridiquement valable en France et dans l'Union Européenne.
        </p>
      </div>
    </div>
    <p style="text-align:center;color:#4a7260;font-size:11px;margin-top:24px;">
      Propulsé par <a href="https://jasonmarinho.com" style="color:#4a7260;">jasonmarinho.com</a>
    </p>
  </div>
</body>
</html>`,
    }).catch(() => null) // Ne pas faire échouer la création si l'email échoue
  }

  revalidatePath(`/dashboard/voyageurs/${data.voyageur_id}`)
  return { id: row.id, token: row.token }
}

// ─── Récupérer les contrats d'un voyageur ────────────────────────────────────

export async function getContractsBySejour(sejourId: string): Promise<{
  contracts?: Array<{
    id: string
    token: string
    statut: string
    signature_date: string | null
    created_at: string
    locataire_prenom: string
    locataire_nom: string
    montant_caution: number | null
    stripe_deposit_status: string | null
    stripe_deposit_payment_intent_id: string | null
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('contracts')
    .select('id, token, statut, signature_date, created_at, locataire_prenom, locataire_nom, montant_caution, stripe_deposit_status, stripe_deposit_payment_intent_id')
    .eq('sejour_id', sejourId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { contracts: data ?? [] }
}

// ─── Annuler un contrat ───────────────────────────────────────────────────────

export async function cancelContract(contractId: string, voyageurId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('contracts')
    .update({ statut: 'annule' })
    .eq('id', contractId)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}

// ─── Récupérer le profil bailleur depuis les métadonnées utilisateur ──────────

export async function getBailleurProfile(): Promise<{
  prenom: string
  nom: string
  email: string
}> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { prenom: '', nom: '', email: '' }

  const user = session.user
  const meta = user.user_metadata ?? {}

  return {
    prenom: (meta.prenom ?? meta.first_name ?? '').toString(),
    nom:    (meta.nom ?? meta.last_name ?? meta.full_name ?? '').toString(),
    email:  user.email ?? '',
  }
}
