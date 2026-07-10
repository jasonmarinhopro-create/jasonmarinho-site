'use server'

// Server action de la fiche individuelle de police (France).
// Charge tout ce qu'il faut pour générer le PDF pré-rempli côté client
// (lib/declarations/police-fiche-pdf.ts) : identité voyageur (check-in),
// dates du séjour, logement et signature électronique éventuelle.

import { createClient } from '@/lib/supabase/server'

const ILIKE_ESCAPE = /[%_\\,]/g

export interface PoliceFicheContext {
  voyageur: {
    prenom: string
    nom: string
    dateNaissance: string | null
    lieuNaissance: string | null
    /** Code ISO-2 — converti en libellé côté client */
    nationalite: string | null
    adresse: string | null
    codePostal: string | null
    ville: string | null
    /** Code ISO-2 */
    pays: string | null
    telephone: string | null
    email: string | null
  }
  dateArrivee: string
  dateDepart: string | null
  logement: { nom: string; adresse: string | null }
  hoteName: string | null
  signatureDataUrl: string | null
  signedAt: string | null
}

export async function getPoliceFicheContext(declarationId: string): Promise<PoliceFicheContext | { error: string }> {
  const supabase = await createClient()
  // getUser() : valide le JWT côté serveur (règle sécurité server actions)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: decl } = await supabase
    .from('guest_declarations')
    .select('id, voyageur_id, sejour_id, contract_id, voyageur_nom, logement_nom, logement_pays, date_arrivee')
    .eq('id', declarationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!decl) return { error: 'Déclaration introuvable.' }
  if (decl.logement_pays !== 'FR') return { error: 'La fiche individuelle de police concerne les logements en France.' }

  // Identité voyageur (remplie par le check-in en ligne le cas échéant)
  let voyageur: PoliceFicheContext['voyageur'] = {
    prenom: '', nom: decl.voyageur_nom,
    dateNaissance: null, lieuNaissance: null, nationalite: null,
    adresse: null, codePostal: null, ville: null, pays: null,
    telephone: null, email: null,
  }
  let signatureDataUrl: string | null = null
  let signedAt: string | null = null
  if (decl.voyageur_id) {
    const { data: v } = await supabase
      .from('voyageurs')
      .select('prenom, nom, date_naissance, lieu_naissance, nationalite, adresse, code_postal, ville, pays, telephone, email, checkin_signature, checkin_completed_at')
      .eq('id', decl.voyageur_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (v) {
      voyageur = {
        prenom: v.prenom ?? '',
        nom: v.nom ?? decl.voyageur_nom,
        dateNaissance: v.date_naissance ?? null,
        lieuNaissance: v.lieu_naissance ?? null,
        nationalite: v.nationalite ?? null,
        adresse: v.adresse ?? null,
        codePostal: v.code_postal ?? null,
        ville: v.ville ?? null,
        pays: v.pays ?? null,
        telephone: v.telephone ?? null,
        email: v.email ?? null,
      }
      signatureDataUrl = v.checkin_signature ?? null
      signedAt = v.checkin_completed_at ?? null
    }
  }

  // Date de départ : séjour d'abord, contrat sinon
  let dateDepart: string | null = null
  if (decl.sejour_id) {
    const { data: sj } = await supabase
      .from('sejours').select('date_depart').eq('id', decl.sejour_id).maybeSingle()
    dateDepart = sj?.date_depart ?? null
  }
  if (!dateDepart && decl.contract_id) {
    const { data: c } = await supabase
      .from('contracts').select('date_depart').eq('id', decl.contract_id).maybeSingle()
    dateDepart = c?.date_depart ?? null
  }

  // Logement (match par nom, convention app)
  let logement: PoliceFicheContext['logement'] = { nom: decl.logement_nom ?? '', adresse: null }
  if (decl.logement_nom) {
    const safe = String(decl.logement_nom).replace(ILIKE_ESCAPE, '\\$&')
    const { data: log } = await supabase
      .from('logements')
      .select('nom, adresse')
      .eq('user_id', user.id)
      .ilike('nom', safe)
      .limit(1)
      .maybeSingle()
    if (log) logement = { nom: log.nom, adresse: log.adresse ?? null }
  }

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle()

  return {
    voyageur,
    dateArrivee: decl.date_arrivee,
    dateDepart,
    logement,
    hoteName: profile?.full_name ?? null,
    signatureDataUrl,
    signedAt,
  }
}
