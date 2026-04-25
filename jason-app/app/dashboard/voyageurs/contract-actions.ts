'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
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
  logement_nom?: string
  logement_id?: string
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
  stripe_payment_enabled?: boolean

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

  // Mettre à jour le statut du séjour associé + stocker le lien dès la création
  const signUrl = `${APP_URL}/sign/${row.token}`
  await supabase
    .from('sejours')
    .update({ contrat_statut: 'en_attente', contrat_lien: signUrl })
    .eq('id', data.sejour_id)
    .eq('user_id', session.user.id)

  // Envoyer l'email de signature au voyageur (si email disponible)
  if (data.locataire_email) {
    const signUrl = `${APP_URL}/sign/${row.token}`
    const hostName = `${data.bailleur_prenom} ${data.bailleur_nom}`
    const guestName = `${data.locataire_prenom} ${data.locataire_nom}`
    const dateArr = new Date(data.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateDep = new Date(data.date_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const propertyLabel = data.logement_nom ?? data.logement_adresse
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.locataire_email,
      subject: `Contrat à signer — ${propertyLabel}`,
      html: buildEmail({
        title: 'Contrat de location',
        preview: `${hostName} vous invite à signer votre contrat pour ${propertyLabel}.`,
        body: `
          ${emailP(`Bonjour <strong style="color:#e8ede8;">${escHtml(guestName)}</strong>,`)}
          ${emailP(`<strong style="color:#e8ede8;">${escHtml(hostName)}</strong> vous invite à lire et signer votre contrat de location.`)}
          ${emailInfoBlock([
            { label: 'Logement', value: escHtml(propertyLabel) },
            ...(data.logement_nom ? [{ label: 'Adresse', value: escHtml(data.logement_adresse) }] : []),
            { label: 'Arrivée', value: escHtml(dateArr) },
            { label: 'Départ', value: escHtml(dateDep) },
          ])}
          ${emailBtn(signUrl, 'Lire et signer le contrat', 'primary')}
          ${emailNote('Ce lien est valable 30 jours. La signature constitue une signature électronique simple au sens du règlement eIDAS (UE) 910/2014, juridiquement valable en France et dans l\'Union Européenne.')}
        `,
      }),
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
    signature_image: string | null
    created_at: string
    locataire_prenom: string
    locataire_nom: string
    montant_loyer: number | null
    montant_caution: number | null
    modalites_paiement: string | null
    stripe_payment_enabled: boolean
    stripe_payment_status: string | null
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
    .select('id, token, statut, signature_date, signature_image, created_at, locataire_prenom, locataire_nom, montant_loyer, montant_caution, modalites_paiement, stripe_payment_enabled, stripe_payment_status, stripe_deposit_status, stripe_deposit_payment_intent_id')
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

// ─── Récupérer la checklist d'un séjour ──────────────────────────────────────

export async function getChecklistBySejour(sejourId: string): Promise<{
  contractId?: string
  checklist?: Record<string, boolean>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('contracts')
    .select('id, checklist_status')
    .eq('sejour_id', sejourId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return {}
  return {
    contractId: data.id,
    checklist: (data.checklist_status as Record<string, boolean>) ?? {},
  }
}
