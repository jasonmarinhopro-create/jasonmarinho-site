import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
const log = logger('api/contracts/force-sign')

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/contracts/force-sign
// Body: { contract_id, signature_date? }
//
// ⚠ ENDPOINT ADMIN UNIQUEMENT (depuis sécurisation 2026-06).
// Avant : tout hôte authentifié pouvait forcer la signature d'un contrat.
// Problème : signature légalement contestable au sens eIDAS (le locataire
// n'a pas réellement signé, signature_ip = 'sync-manuel'). Risque
// juridique réel en cas de litige.
// Maintenant : réservé à Jason (role='admin'). Utilisé uniquement pour
// debug/récupération suite à bug technique avéré. Audit log obligatoire.
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'hôte est authentifié (getUser valide le token côté serveur Supabase)
    const supabase = await createAuthClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    // Garde admin-only : check role dans profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role !== 'admin') {
      log.warn('forceSignAttemptByNonAdmin', { userId: user.id })
      return NextResponse.json({
        error: 'Action réservée à l\'administrateur. Si un contrat est bloqué, contacte le support.',
      }, { status: 403 })
    }

    const { contract_id, signature_date } = await request.json()
    if (!contract_id) {
      return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })
    }

    const db = createServiceClient()

    // Récupérer le contrat (sans restriction user_id puisque admin)
    const { data: contract, error: fetchErr } = await db
      .from('contracts')
      .select('id, statut, sejour_id, token, user_id, locataire_prenom, locataire_nom, logement_adresse')
      .eq('id', contract_id)
      .single()

    if (fetchErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable ou accès refusé.' }, { status: 404 })
    }

    if (contract.statut === 'signe') {
      return NextResponse.json({ error: 'Ce contrat est déjà marqué comme signé.' }, { status: 409 })
    }

    if (contract.statut === 'annule') {
      return NextResponse.json({ error: 'Ce contrat a été annulé.' }, { status: 409 })
    }

    const signDateIso = signature_date
      ? new Date(signature_date).toISOString()
      : new Date().toISOString()

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

    // Forcer la signature. Marquage explicite "admin-override" pour audit
    // futur (un signature_ip = admin-override:* est NON-eIDAS et ne doit
    // pas être utilisé comme preuve dans un litige juridique).
    log.warn('forceSignByAdmin', { adminId: user.id, contractId: contract_id, contractOwner: contract.user_id })
    const { data: updated, error: updateErr } = await db
      .from('contracts')
      .update({
        statut: 'signe',
        signature_date: signDateIso,
        signature_ip: `admin-override:${user.id.slice(0, 8)}`,
        signature_user_agent: `Admin force-sign at ${new Date().toISOString()} for owner ${contract.user_id}`,
      })
      .eq('id', contract_id)
      .select('id, statut')
      .single()

    if (updateErr || !updated) {
      log.error('updateContract', { code: updateErr?.code })
      return NextResponse.json({ error: 'Impossible de mettre à jour le contrat.' }, { status: 500 })
    }

    // Synchroniser le séjour
    const today = new Date().toISOString().split('T')[0]
    await db
      .from('sejours')
      .update({
        contrat_statut: 'signe',
        contrat_date_signature: signature_date
          ? new Date(signature_date).toISOString().split('T')[0]
          : today,
        contrat_lien: `${APP_URL}/sign/${contract.token}`,
      })
      .eq('id', contract.sejour_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
