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

    // SIBA exige un boletim PAR voyageur (mineurs inclus) : on déclare le
    // principal + chaque accompagnant du check-in disposant d'un document.
    // Un accompagnant sans document (jeune enfant) reste à la charge du
    // flux manuel — la déclaration n'est PAS marquée faite dans ce cas.
    const { data: comps } = await supabase
      .from('checkin_companions')
      .select('prenom, nom, date_naissance, lieu_naissance, nationalite, id_type, id_numero, id_pays_emetteur')
      .eq('voyageur_id', voyageurId)
      .eq('user_id', userId)
    const companions = comps ?? []

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

      // Boletins du groupe : principal + accompagnants. Résidence des
      // accompagnants : celle du principal (ils voyagent ensemble).
      const groupGuests: SibaGuest[] = [{
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
      }]
      // Si un accompagnant n'a pas les données minimales (document, etc.),
      // on n'envoie RIEN automatiquement : un envoi partiel marquerait la
      // déclaration "faite" alors que le groupe n'est pas déclaré en entier.
      let groupComplete = true
      for (const c of companions) {
        const cNac = toIso3(c.nationalite)
        const cEmissor = toIso3(c.id_pays_emetteur ?? c.nationalite)
        if (!c.nom || !c.date_naissance || !c.id_numero || !cNac || !cEmissor) {
          groupComplete = false
          break
        }
        groupGuests.push({
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
        })
      }
      if (!groupComplete) {
        console.error(`[siba-auto] accompagnant sans document (decl ${decl.id}) — flux manuel conservé`)
        continue
      }

      // Un boletim par voyageur. Numéro de fichier dérivé du temps
      // (secondes depuis 2020) + index : unique, sans collision avec la
      // numérotation count+1 du flux manuel (valeurs bien plus petites).
      const fileBase = Math.floor(Date.now() / 1000) - 1_577_836_800
      let allOk = true
      let sentInGroup = 0
      for (const guest of groupGuests) {
        const fileNumber = fileBase + sentInGroup
        const result = await submitToSiba(unit, guest, fileNumber)
        if (!result.ok) {
          // Refus SIBA → la déclaration reste 'a_faire', l'hôte la traitera
          // depuis le dashboard avec le message d'erreur du flux manuel.
          console.error(`[siba-auto] envoi refusé (decl ${decl.id}, ${guest.apelido}, code ${result.code}): ${result.errorMessage}`)
          allOk = false
          break
        }
        sentInGroup++
      }
      if (!allOk) continue

      await supabase
        .from('guest_declarations')
        .update({
          statut: 'faite',
          declared_at: new Date().toISOString(),
          siba_sent_at: new Date().toISOString(),
          siba_file_number: fileBase,
        })
        .eq('id', decl.id)
        .eq('user_id', userId)
      sent += sentInGroup
    }
    return sent
  } catch (e) {
    console.error('[siba-auto] échec inattendu:', e)
    return 0
  }
}
