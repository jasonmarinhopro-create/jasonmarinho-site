// SERVER ONLY — envoi SIBA automatique après check-in en ligne.
//
// Chaîne complète : le voyageur complète /checkin/[token] → sa fiche est à
// jour → syncDeclarationsForVoyageur crée les déclarations 'a_faire' → ce
// module tente d'envoyer IMMÉDIATEMENT les boletins SIBA (Portugal) au Web
// Service de l'État, sans action de l'hôte (comme Partee).
//
// Conditions pour l'envoi auto (sinon la déclaration reste 'a_faire' et le
// flux manuel du dashboard prend le relais — jamais d'erreur bloquante) :
//  - logement PT avec config SIBA complète (nipc + chave) et siba_auto_envoi
//  - identité voyageur complète (nom, naissance, document, nationalité, ville)
//
// Volontairement découplé de siba-actions.ts ('use server' + session auth) :
// ici on tourne en service role depuis une route publique.

import type { SupabaseClient } from '@supabase/supabase-js'
import { submitToSiba, toIso3, type SibaGuest, type SibaUnit } from './siba'
import { idTypeToDocType } from './siba-shared'

const ILIKE_ESCAPE = /[%_\\,]/g

/** Tente l'envoi SIBA auto pour toutes les déclarations PT 'a_faire' du
 *  voyageur. Retourne le nombre de boletins envoyés. Ne throw jamais. */
export async function autoSendSibaForVoyageur(
  supabase: SupabaseClient,
  userId: string,
  voyageurId: string,
): Promise<number> {
  try {
    // ── Identité voyageur (vient d'être remplie par le check-in) ──────────
    const { data: v } = await supabase
      .from('voyageurs')
      .select('id, prenom, nom, nationalite, date_naissance, id_type, id_numero, id_pays_emetteur, pays, ville')
      .eq('id', voyageurId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!v) return 0

    const nacionalidade = toIso3(v.nationalite)
    const paisEmissor = toIso3(v.id_pays_emetteur ?? v.nationalite)
    const paisResidencia = toIso3(v.pays ?? v.nationalite)
    const localResidencia = (v.ville ?? '').trim()
    // Identité incomplète → flux manuel (le modal du dashboard redemande)
    if (!v.nom || !v.date_naissance || !v.id_numero || !nacionalidade || !paisEmissor || !paisResidencia || !localResidencia) {
      return 0
    }

    // ── Déclarations PT en attente pour ce voyageur ───────────────────────
    const { data: decls } = await supabase
      .from('guest_declarations')
      .select('id, sejour_id, contract_id, logement_nom, date_arrivee')
      .eq('user_id', userId)
      .eq('voyageur_id', voyageurId)
      .eq('logement_pays', 'PT')
      .eq('statut', 'a_faire')
    if (!decls || decls.length === 0) return 0

    // ── Contact hôte (Nome/Email_Contacto du XML) ─────────────────────────
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', userId).maybeSingle()
    let email = ''
    try {
      const { data: au } = await supabase.auth.admin.getUserById(userId)
      email = au?.user?.email ?? ''
    } catch { /* service role sans accès admin : email vide accepté */ }

    let sent = 0
    for (const decl of decls) {
      if (!decl.logement_nom) continue

      // Logement + config SIBA (match par nom, convention app)
      const safe = String(decl.logement_nom).replace(ILIKE_ESCAPE, '\\$&')
      const { data: log } = await supabase
        .from('logements')
        .select('id, nom, adresse, siba_unidade, siba_estabelecimento, siba_chave, siba_abreviatura, siba_localidade, siba_codigo_postal, siba_zona_postal, siba_telefone, siba_auto_envoi')
        .eq('user_id', userId)
        .ilike('nom', safe)
        .limit(1)
        .maybeSingle()
      if (!log?.siba_unidade || !log.siba_chave) continue     // pas configuré
      if (log.siba_auto_envoi === false) continue             // désactivé par l'hôte

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
        emailContacto: email,
      }

      const guest: SibaGuest = {
        apelido: v.nom.trim(),
        nome: (v.prenom ?? '').trim() || ' ',
        nacionalidade,
        dataNascimento: v.date_naissance,
        documentoNumero: v.id_numero.trim(),
        paisEmissorDocumento: paisEmissor,
        tipoDocumento: idTypeToDocType(v.id_type),
        dataEntrada: decl.date_arrivee,
        dataSaida: dateDepart,
        paisResidencia,
        localResidencia,
      }

      // Numéro de fichier séquentiel par compte (même convention que le
      // flux manuel — voir siba-actions.ts)
      const { count } = await supabase
        .from('guest_declarations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('siba_sent_at', 'is', null)
      const fileNumber = (count ?? 0) + 1

      const result = await submitToSiba(unit, guest, fileNumber)
      if (!result.ok) {
        // Refus SIBA → la déclaration reste 'a_faire', l'hôte la traitera
        // depuis le dashboard avec le message d'erreur du flux manuel.
        console.error(`[siba-auto] envoi refusé (decl ${decl.id}, code ${result.code}): ${result.errorMessage}`)
        continue
      }

      await supabase
        .from('guest_declarations')
        .update({
          statut: 'faite',
          declared_at: new Date().toISOString(),
          siba_sent_at: new Date().toISOString(),
          siba_file_number: fileNumber,
        })
        .eq('id', decl.id)
        .eq('user_id', userId)
      sent++
    }
    return sent
  } catch (e) {
    console.error('[siba-auto] échec inattendu:', e)
    return 0
  }
}
