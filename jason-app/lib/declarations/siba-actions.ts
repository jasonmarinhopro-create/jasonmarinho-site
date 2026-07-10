'use server'

// Server actions de l'envoi SIBA (Portugal) depuis le widget Déclarations.
// Flux : getSibaContext (préremplit le modal) → saveSibaConfig (1re fois)
// → sendSibaDeclaration (XML + SOAP + retour, marque la déclaration faite).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { submitToSiba, toIso3, type SibaGuest, type SibaUnit } from './siba'
import type { SibaDocType } from './siba-shared'

const ILIKE_ESCAPE = /[%_\\,]/g

export interface SibaConfigInput {
  siba_unidade: string
  siba_estabelecimento: string
  siba_chave: string
  siba_abreviatura: string
  siba_localidade: string
  siba_codigo_postal: string
  siba_zona_postal: string
  siba_telefone: string
  /** Envoi auto du boletim dès que le check-in en ligne est complété */
  siba_auto_envoi?: boolean
}

export interface SibaContext {
  declarationId: string
  logement: {
    id: string
    nom: string
    adresse: string | null
    numeroEnregistrement: string | null
    configured: boolean
    config: Partial<SibaConfigInput>
  } | null
  voyageur: {
    id: string | null
    prenom: string
    nom: string
    nationalite: string | null
    dateNaissance: string | null
    idType: string | null
    idNumero: string | null
    idPaysEmetteur: string | null
    paysResidence: string | null
    villeResidence: string | null
  }
  dateArrivee: string
  dateDepart: string | null
}

function docTypeToIdType(t: SibaDocType): string {
  return t === 'P' ? 'passeport' : t === 'B' ? 'cni' : 'autre'
}

/** Charge tout ce qu'il faut pour préremplir le modal d'envoi SIBA. */
export async function getSibaContext(declarationId: string): Promise<SibaContext | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: decl } = await supabase
    .from('guest_declarations')
    .select('id, voyageur_id, sejour_id, contract_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, statut')
    .eq('id', declarationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!decl) return { error: 'Déclaration introuvable.' }
  if (decl.logement_pays !== 'PT') return { error: 'L\'envoi Web Service ne concerne que le Portugal (SIBA).' }

  // Logement + config SIBA (match par nom, convention app)
  let logement: SibaContext['logement'] = null
  if (decl.logement_nom) {
    const safe = String(decl.logement_nom).replace(ILIKE_ESCAPE, '\\$&')
    const { data: log } = await supabase
      .from('logements')
      .select('id, nom, adresse, numero_enregistrement, siba_unidade, siba_estabelecimento, siba_chave, siba_abreviatura, siba_localidade, siba_codigo_postal, siba_zona_postal, siba_telefone, siba_auto_envoi')
      .eq('user_id', user.id)
      .ilike('nom', safe)
      .limit(1)
      .maybeSingle()
    if (log) {
      const configured = !!(log.siba_unidade && log.siba_chave && log.siba_estabelecimento)
      logement = {
        id: log.id,
        nom: log.nom,
        adresse: log.adresse ?? null,
        numeroEnregistrement: log.numero_enregistrement ?? null,
        configured,
        config: {
          siba_unidade: log.siba_unidade ?? '',
          siba_estabelecimento: log.siba_estabelecimento ?? '00',
          siba_chave: log.siba_chave ?? '',
          siba_abreviatura: log.siba_abreviatura ?? '',
          siba_localidade: log.siba_localidade ?? '',
          siba_codigo_postal: log.siba_codigo_postal ?? '',
          siba_zona_postal: log.siba_zona_postal ?? '',
          siba_telefone: log.siba_telefone ?? '',
          siba_auto_envoi: log.siba_auto_envoi ?? true,
        },
      }
    }
  }

  // Voyageur (identité)
  let voyageur: SibaContext['voyageur'] = {
    id: decl.voyageur_id ?? null,
    prenom: '', nom: decl.voyageur_nom,
    nationalite: decl.voyageur_nationalite,
    dateNaissance: null, idType: null, idNumero: null, idPaysEmetteur: null,
    paysResidence: null, villeResidence: null,
  }
  if (decl.voyageur_id) {
    const { data: v } = await supabase
      .from('voyageurs')
      .select('id, prenom, nom, nationalite, date_naissance, id_type, id_numero, id_pays_emetteur, pays, ville')
      .eq('id', decl.voyageur_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (v) {
      voyageur = {
        id: v.id,
        prenom: v.prenom ?? '',
        nom: v.nom ?? '',
        nationalite: v.nationalite ?? decl.voyageur_nationalite,
        dateNaissance: v.date_naissance ?? null,
        idType: v.id_type ?? null,
        idNumero: v.id_numero ?? null,
        idPaysEmetteur: v.id_pays_emetteur ?? null,
        paysResidence: v.pays ?? v.nationalite ?? null,
        villeResidence: v.ville ?? null,
      }
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

  return {
    declarationId: decl.id,
    logement,
    voyageur,
    dateArrivee: decl.date_arrivee,
    dateDepart,
  }
}

/** Enregistre la config SIBA sur le logement (1re utilisation). */
export async function saveSibaConfig(logementId: string, config: SibaConfigInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const nipc = config.siba_unidade.trim()
  if (!/^\d{9}$/.test(nipc)) return { error: 'Le NIPC/NIF doit comporter 9 chiffres.' }
  if (!config.siba_chave.trim()) return { error: 'La chave de ativação est requise (reçue par email après ton inscription SIBA).' }
  if (!/^\d{4}$/.test(config.siba_codigo_postal.trim())) return { error: 'Code postal : 4 chiffres (ex. 3660).' }
  if (!/^\d{3}$/.test(config.siba_zona_postal.trim())) return { error: 'Zone postale : 3 chiffres (ex. 366).' }
  if (!config.siba_localidade.trim()) return { error: 'La localité est requise.' }
  if (!config.siba_telefone.trim()) return { error: 'Le téléphone est requis.' }
  const abrev = config.siba_abreviatura.trim()
  if (!abrev || abrev.length > 10) return { error: 'Abréviation requise (10 caractères max).' }

  const { error } = await supabase
    .from('logements')
    .update({
      siba_unidade: nipc,
      siba_estabelecimento: config.siba_estabelecimento.trim() || '00',
      siba_chave: config.siba_chave.trim(),
      siba_abreviatura: abrev,
      siba_localidade: config.siba_localidade.trim(),
      siba_codigo_postal: config.siba_codigo_postal.trim(),
      siba_zona_postal: config.siba_zona_postal.trim(),
      siba_telefone: config.siba_telefone.trim(),
      siba_auto_envoi: config.siba_auto_envoi ?? true,
    })
    .eq('id', logementId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { ok: true }
}

export interface SibaGuestInput {
  prenom: string
  nom: string
  /** ISO-2 */
  nationalite: string
  /** yyyy-mm-dd */
  dateNaissance: string
  tipoDocumento: SibaDocType
  documentoNumero: string
  /** ISO-2 */
  paysEmetteur: string
  /** ISO-2 */
  paysResidence: string
  localResidence: string
  /** yyyy-mm-dd */
  dateEntree: string
  /** yyyy-mm-dd, optionnelle */
  dateSortie?: string | null
}

/** Envoie le boletim au Web Service SIBA et marque la déclaration faite. */
export async function sendSibaDeclaration(
  declarationId: string,
  guest: SibaGuestInput,
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // ── Validation des champs voyageur ────────────────────────────────────────
  if (!guest.nom.trim()) return { error: 'Le nom du voyageur est requis.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(guest.dateNaissance)) return { error: 'Date de naissance requise.' }
  if (!guest.documentoNumero.trim()) return { error: 'Le numéro de document (passeport/CNI) est requis.' }
  if (!guest.localResidence.trim()) return { error: 'La ville de résidence est requise.' }
  const nacionalidade = toIso3(guest.nationalite)
  const paisEmissor = toIso3(guest.paysEmetteur)
  const paisResidencia = toIso3(guest.paysResidence)
  if (!nacionalidade) return { error: 'Nationalité invalide.' }
  if (!paisEmissor) return { error: 'Pays émetteur du document invalide.' }
  if (!paisResidencia) return { error: 'Pays de résidence invalide.' }

  // ── Déclaration + logement + config ───────────────────────────────────────
  const { data: decl } = await supabase
    .from('guest_declarations')
    .select('id, voyageur_id, logement_nom, logement_pays, statut')
    .eq('id', declarationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!decl) return { error: 'Déclaration introuvable.' }
  if (decl.logement_pays !== 'PT') return { error: 'Seules les déclarations Portugal partent via SIBA.' }
  if (decl.statut === 'faite') return { error: 'Cette déclaration est déjà marquée faite.' }
  if (!decl.logement_nom) return { error: 'Logement introuvable pour cette déclaration.' }

  const safe = String(decl.logement_nom).replace(ILIKE_ESCAPE, '\\$&')
  const { data: log } = await supabase
    .from('logements')
    .select('id, nom, adresse, siba_unidade, siba_estabelecimento, siba_chave, siba_abreviatura, siba_localidade, siba_codigo_postal, siba_zona_postal, siba_telefone')
    .eq('user_id', user.id)
    .ilike('nom', safe)
    .limit(1)
    .maybeSingle()
  if (!log?.siba_unidade || !log.siba_chave) {
    return { error: 'Configuration SIBA manquante sur ce logement — renseigne-la d\'abord.' }
  }

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle()

  const unit: SibaUnit = {
    nipc: log.siba_unidade,
    estabelecimento: log.siba_estabelecimento ?? '00',
    chave: log.siba_chave,
    nome: log.nom,
    abreviatura: log.siba_abreviatura ?? log.nom.slice(0, 10),
    morada: log.adresse ?? log.nom,
    localidade: log.siba_localidade ?? '',
    codigoPostal: log.siba_codigo_postal ?? '',
    zonaPostal: log.siba_zona_postal ?? '',
    telefone: log.siba_telefone ?? '',
    nomeContacto: profile?.full_name ?? 'Hôte',
    emailContacto: user.email ?? '',
  }

  const sibaGuest: SibaGuest = {
    apelido: guest.nom.trim(),
    nome: guest.prenom.trim() || ' ',
    nacionalidade,
    dataNascimento: guest.dateNaissance,
    documentoNumero: guest.documentoNumero.trim(),
    paisEmissorDocumento: paisEmissor,
    tipoDocumento: guest.tipoDocumento,
    dataEntrada: guest.dateEntree,
    dataSaida: guest.dateSortie ?? null,
    paisResidencia,
    localResidencia: guest.localResidence.trim(),
  }

  // Numéro de fichier séquentiel par compte (SIBA veut un identifiant d'envoi)
  const { count } = await supabase
    .from('guest_declarations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('siba_sent_at', 'is', null)
  const fileNumber = (count ?? 0) + 1

  const result = await submitToSiba(unit, sibaGuest, fileNumber)
  if (!result.ok) {
    return { error: `SIBA a refusé l'envoi (code ${result.code}) : ${result.errorMessage}` }
  }

  // ── Succès : marque la déclaration + enrichit la fiche voyageur ──────────
  await supabase
    .from('guest_declarations')
    .update({
      statut: 'faite',
      declared_at: new Date().toISOString(),
      siba_sent_at: new Date().toISOString(),
      siba_file_number: fileNumber,
    })
    .eq('id', declarationId)
    .eq('user_id', user.id)

  if (decl.voyageur_id) {
    await supabase
      .from('voyageurs')
      .update({
        nationalite: guest.nationalite,
        date_naissance: guest.dateNaissance,
        id_type: docTypeToIdType(guest.tipoDocumento),
        id_numero: guest.documentoNumero.trim(),
        id_pays_emetteur: guest.paysEmetteur,
        pays: guest.paysResidence,
        ville: guest.localResidence.trim(),
      })
      .eq('id', decl.voyageur_id)
      .eq('user_id', user.id)
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
