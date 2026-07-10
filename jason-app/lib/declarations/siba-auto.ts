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

    // SIBA exige un boletim PAR voyageur (mineurs inclus) : envoi
    // INCRÉMENTAL — le lien étant partageable, les membres du groupe
    // arrivent au fil de l'eau. siba_sent_at (par accompagnant) évite les
    // doublons ; un retardataire est envoyé même si la déclaration est
    // déjà 'faite'.
    const { data: comps } = await supabase
      .from('checkin_companions')
      .select('id, prenom, nom, date_naissance, lieu_naissance, nationalite, id_type, id_numero, id_pays_emetteur, siba_sent_at')
      .eq('voyageur_id', voyageurId)
      .eq('user_id', userId)
    const companions = comps ?? []

    // ── Déclarations PT pour ce voyageur ('faite' incluse : retardataires) ─
    const { data: decls } = await supabase
      .from('guest_declarations')
      .select('id, sejour_id, contract_id, logement_nom, date_arrivee, statut, siba_sent_at')
      .eq('user_id', userId)
      .eq('voyageur_id', voyageurId)
      .eq('logement_pays', 'PT')
      .in('statut', ['a_faire', 'faite'])
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

      // Numéro de fichier dérivé du temps (secondes depuis 2020) + index :
      // unique, sans collision avec la numérotation count+1 du flux manuel
      // (valeurs bien plus petites).
      const fileBase = Math.floor(Date.now() / 1000) - 1_577_836_800
      let fileIdx = 0
      let sentInGroup = 0
      let anyFailure = false

      // 1. Le voyageur PRINCIPAL — une seule fois (decl.siba_sent_at le trace).
      if (decl.statut === 'a_faire' && !decl.siba_sent_at) {
        const mainGuest: SibaGuest = {
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
        const result = await submitToSiba(unit, mainGuest, fileBase + fileIdx++)
        if (result.ok) {
          await supabase
            .from('guest_declarations')
            .update({ siba_sent_at: new Date().toISOString(), siba_file_number: fileBase })
            .eq('id', decl.id)
            .eq('user_id', userId)
          decl.siba_sent_at = new Date().toISOString()
          sentInGroup++
        } else {
          console.error(`[siba-auto] envoi refusé (decl ${decl.id}, principal, code ${result.code}): ${result.errorMessage}`)
          anyFailure = true
        }
      }

      // 2. Chaque ACCOMPAGNANT pas encore envoyé (le lien partagé fait
      // arriver les membres au fil de l'eau — envoi incrémental, même si
      // la déclaration est déjà 'faite'). Résidence : celle du principal.
      let allCompanionsCovered = true
      for (const c of companions) {
        if (c.siba_sent_at) continue
        const cNac = toIso3(c.nationalite)
        const cEmissor = toIso3(c.id_pays_emetteur ?? c.nationalite)
        if (!c.nom || !c.date_naissance || !c.id_numero || !cNac || !cEmissor) {
          // Données incomplètes (jeune enfant sans document…) → reste à la
          // charge du flux manuel, la déclaration n'est pas marquée faite.
          allCompanionsCovered = false
          continue
        }
        const guest: SibaGuest = {
          apelido: c.nom.trim(),
          nome: (c.prenom ?? '').trim() || ' ',
          nacionalidade: cNac,
          dataNascimento: c.date_naissance,
          documentoNumero: c.id_numero.trim(),
          paisEmissorDocumento: cEmissor,
          tipoDocumento: idTypeToDocType(c.id_type),
          dataEntrada: decl.date_arrivee,
          dataSaida: dateDepart,
          paisResidencia,
          localResidencia,
        }
        const result = await submitToSiba(unit, guest, fileBase + fileIdx++)
        if (result.ok) {
          await supabase
            .from('checkin_companions')
            .update({ siba_sent_at: new Date().toISOString() })
            .eq('id', c.id)
            .eq('user_id', userId)
          c.siba_sent_at = new Date().toISOString()
          sentInGroup++
        } else {
          console.error(`[siba-auto] envoi refusé (decl ${decl.id}, ${guest.apelido}, code ${result.code}): ${result.errorMessage}`)
          anyFailure = true
          allCompanionsCovered = false
        }
      }

      // 3. Déclaration 'faite' quand le principal ET tous les accompagnants
      // connus sont partis. Sinon elle reste visible dans le widget (flux
      // manuel) — sans jamais renvoyer ceux déjà déclarés.
      if (decl.statut === 'a_faire' && decl.siba_sent_at && allCompanionsCovered && !anyFailure) {
        await supabase
          .from('guest_declarations')
          .update({ statut: 'faite', declared_at: new Date().toISOString() })
          .eq('id', decl.id)
          .eq('user_id', userId)
      }
      sent += sentInGroup
    }
    return sent
  } catch (e) {
    console.error('[siba-auto] échec inattendu:', e)
    return 0
  }
}
