import { cookies } from 'next/headers'
import { cache } from 'react'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const ACTIVE_PROPERTY_COOKIE = 'active-property-id'
export const ALL_PROPERTIES = 'all' as const

export interface PropertyLite {
  id: string
  nom: string
  ville: string | null
}

export interface ActiveProperty {
  /** 'all' = vue agrégée, ou l'UUID d'un logement précis. */
  propertyId: string
  /** Logement résolu (null si 'all' ou si l'utilisateur n'a aucun logement). */
  property: PropertyLite | null
  /** Tous les logements de l'utilisateur (pour le sélecteur dans la sidebar). */
  allProperties: PropertyLite[]
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Source de vérité pour "quel logement est sélectionné par l'utilisateur".
 *
 * Lit le cookie `active-property-id` côté serveur. Valide qu'il pointe
 * bien sur un logement appartenant à l'utilisateur (sinon fallback sur 'all'
 * pour éviter qu'un cookie corrompu/expiré ne casse les queries).
 *
 * `cache()` garantit qu'on ne refait pas la query Supabase à chaque appel
 * dans le même rendu serveur (pages + layout partagent le résultat).
 */
export const getActiveProperty = cache(async (): Promise<ActiveProperty> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { propertyId: ALL_PROPERTIES, property: null, allProperties: [] }
  }

  const admin = getServiceClient()

  // On lance les 3 queries en parallele : logements(user_id),
  // sejours(user_id) et contracts(user_id). Puis on merge :
  //   1. Tous les logements dont user_id = current user (source primaire)
  //   2. Plus les vrais logements dont le NOM matche un sejour/contract
  //      du user (couvre les cas legacy ou user_id est different sur
  //      logements pour raison historique/migration)
  //   3. Enfin, les noms sans match DB → virtual: pour au moins afficher.
  // Ceci garantit que Casa Do Peidreiro est TOUJOURS trouve avec son vrai
  // UUID des qu'il existe en DB, meme si les user_id sont desynchronises.
  const [ownedRes, sejoursRes, contractsRes] = await Promise.all([
    admin.from('logements').select('id, nom, ville').eq('user_id', user.id).order('created_at', { ascending: true }),
    admin.from('sejours').select('logement').eq('user_id', user.id).not('logement', 'is', null),
    admin.from('contracts').select('logement_nom').eq('user_id', user.id).not('logement_nom', 'is', null),
  ])

  const allProperties: PropertyLite[] = []
  const seenIds = new Set<string>()
  const addLogement = (r: { id: string; nom: string | null; ville: string | null }) => {
    if (seenIds.has(r.id)) return
    seenIds.add(r.id)
    allProperties.push({ id: r.id, nom: r.nom ?? 'Sans nom', ville: r.ville ?? null })
  }

  // 1. Logements possedes (user_id match)
  ;(ownedRes.data ?? []).forEach(addLogement)

  // 2. Noms distincts depuis sejours + contracts du user
  const distinctNames = new Set<string>()
  ;(sejoursRes.data ?? []).forEach(r => { if (r.logement) distinctNames.add(String(r.logement).trim()) })
  ;(contractsRes.data ?? []).forEach(r => { if (r.logement_nom) distinctNames.add(String(r.logement_nom).trim()) })
  const names = Array.from(distinctNames).filter(Boolean)

  // 2b. Cherche les vrais UUIDs pour ces noms (sans filtre user_id)
  const foundNames = new Set<string>()
  ;(ownedRes.data ?? []).forEach(r => { if (r.nom) foundNames.add(r.nom.trim()) })
  const namesToFetch = names.filter(n => !foundNames.has(n))
  if (namesToFetch.length > 0) {
    const { data: matched } = await admin
      .from('logements')
      .select('id, nom, ville')
      .in('nom', namesToFetch)
    ;(matched ?? []).forEach(r => {
      addLogement(r)
      if (r.nom) foundNames.add(r.nom.trim())
    })
  }

  // 3. Noms sans aucun match en DB → virtual: pour affichage seulement
  names.forEach(nom => {
    if (!foundNames.has(nom)) {
      const virtualId = `virtual:${nom}`
      if (!seenIds.has(virtualId)) {
        seenIds.add(virtualId)
        allProperties.push({ id: virtualId, nom, ville: null })
      }
    }
  })

  const cookieStore = await cookies()
  const cookieVal = cookieStore.get(ACTIVE_PROPERTY_COOKIE)?.value ?? ALL_PROPERTIES

  // Cookie 'all' OU pas de logements → vue agrégée
  if (cookieVal === ALL_PROPERTIES || allProperties.length === 0) {
    return { propertyId: ALL_PROPERTIES, property: null, allProperties }
  }

  // Cookie pointe sur un UUID : valider qu'il appartient bien à l'utilisateur
  // (sinon un cookie obsolète d'un autre compte casserait le filtre)
  const match = allProperties.find(p => p.id === cookieVal)
  if (match) {
    return { propertyId: match.id, property: match, allProperties }
  }
  // Cookie invalide → fallback silencieux sur 'all'
  return { propertyId: ALL_PROPERTIES, property: null, allProperties }
})
