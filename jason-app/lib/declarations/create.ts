// SERVER ONLY — création des déclarations voyageurs obligatoires.
// Appelé par la route de signature (service role) : quand un contrat est
// signé et que le pays du logement exige une déclaration (SIBA PT, fiche
// police FR, SES Hospedajes ES…), on crée une ligne guest_declarations
// que l'hôte suit depuis le dashboard.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getCountry, COUNTRIES, type CountryCode } from '@/lib/countries'

export interface DeclarationRequirement {
  label: string
  portalUrl?: string
  note: string
  deadlineAt: Date
  countryName: string
  flag: string
}

export interface DeclarationCreateResult {
  created: boolean
  requirement: DeclarationRequirement | null
}

function isKnownCountry(code: string): code is CountryCode {
  return code in COUNTRIES
}

/**
 * La déclaration est-elle requise pour ce couple pays/nationalité ?
 * - ES : TOUS les voyageurs (RD 933/2021, nationaux compris)
 * - Autres pays couverts : voyageur de nationalité différente du pays
 * - Nationalité inconnue : on ne crée rien (pas de bruit) — la page de
 *   signature demande la nationalité au voyageur pour maximiser les cas connus.
 */
export function declarationRequired(
  logementPays: string | null | undefined,
  nationalite: string | null | undefined,
): boolean {
  const pays = (logementPays ?? 'FR').toUpperCase()
  if (!isKnownCountry(pays)) return false
  if (pays === 'ES') return true
  if (!nationalite) return false
  return nationalite.toUpperCase() !== pays
}

/**
 * Crée (idempotent) la déclaration liée à un contrat signé.
 * Best-effort : toute erreur est retournée sans throw — la signature ne
 * doit JAMAIS échouer à cause de ce post-traitement.
 *
 * @param db  client Supabase service-role (la signature n'a pas de session)
 * @param nationaliteFromSignature nationalité déclarée par le voyageur sur
 *        la page de signature (prioritaire, écrite sur la fiche voyageur)
 */
export async function createDeclarationForSignedContract(
  db: SupabaseClient,
  contractId: string,
  nationaliteFromSignature?: string | null,
): Promise<DeclarationCreateResult> {
  const none: DeclarationCreateResult = { created: false, requirement: null }

  const { data: contract } = await db
    .from('contracts')
    .select('id, user_id, sejour_id, locataire_prenom, locataire_nom, logement_nom, date_arrivee')
    .eq('id', contractId)
    .maybeSingle()
  if (!contract?.user_id || !contract.date_arrivee) return none

  // ── Voyageur : nationalité (signature > fiche voyageur) ──────────────────
  let voyageurId: string | null = null
  let sejourLogement: string | null = null
  if (contract.sejour_id) {
    const { data: sejour } = await db
      .from('sejours')
      .select('voyageur_id, logement')
      .eq('id', contract.sejour_id)
      .maybeSingle()
    voyageurId = sejour?.voyageur_id ?? null
    sejourLogement = sejour?.logement ?? null
  }

  let nationalite: string | null =
    nationaliteFromSignature?.toUpperCase().match(/^[A-Z]{2}$/)
      ? nationaliteFromSignature.toUpperCase()
      : null

  if (voyageurId) {
    if (nationalite) {
      // Le voyageur vient de déclarer sa nationalité en signant : on la
      // reporte sur sa fiche (source la plus fiable — c'est lui qui sait).
      await db.from('voyageurs').update({ nationalite }).eq('id', voyageurId)
    } else {
      const { data: voyageur } = await db
        .from('voyageurs')
        .select('nationalite')
        .eq('id', voyageurId)
        .maybeSingle()
      nationalite = voyageur?.nationalite ?? null
    }
  }

  // ── Logement : pays (match par nom, comme partout dans l'app) ────────────
  const logementNom = (contract.logement_nom as string | null) ?? sejourLogement
  let logementPays = 'FR'
  if (logementNom) {
    const safe = logementNom.replace(/[%_\\,]/g, '\\$&')
    const { data: logement } = await db
      .from('logements')
      .select('pays')
      .eq('user_id', contract.user_id)
      .ilike('nom', safe)
      .limit(1)
      .maybeSingle()
    if (logement?.pays) logementPays = logement.pays
  }

  if (!declarationRequired(logementPays, nationalite)) return none

  const config = getCountry(logementPays)
  const decl = config.foreignGuestDeclaration
  const arrivee = new Date(contract.date_arrivee + 'T12:00:00')
  const deadlineAt = new Date(arrivee.getTime() + decl.deadlineHours * 3600 * 1000)

  const { error } = await db
    .from('guest_declarations')
    .upsert({
      user_id: contract.user_id,
      contract_id: contract.id,
      sejour_id: contract.sejour_id,
      voyageur_id: voyageurId,
      voyageur_nom: `${contract.locataire_prenom ?? ''} ${contract.locataire_nom ?? ''}`.trim() || 'Voyageur',
      voyageur_nationalite: nationalite,
      logement_nom: logementNom,
      logement_pays: logementPays,
      date_arrivee: contract.date_arrivee,
      deadline_at: deadlineAt.toISOString(),
    }, { onConflict: 'contract_id', ignoreDuplicates: true })

  if (error) return none

  return {
    created: true,
    requirement: {
      label: decl.label,
      portalUrl: decl.portalUrl,
      note: decl.note,
      deadlineAt,
      countryName: config.name,
      flag: config.flag,
    },
  }
}
