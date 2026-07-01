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
  const { data: rows } = await admin
    .from('logements')
    .select('id, nom, ville')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  const allProperties: PropertyLite[] = (rows ?? []).map(r => ({
    id: r.id,
    nom: r.nom ?? 'Sans nom',
    ville: r.ville ?? null,
  }))

  // Fallback : si la table logements ne renvoie rien avec user_id, on
  // aggrège les noms depuis sejours + contracts, puis on essaie de
  // matcher ces noms avec des rows REELLES de la table logements (sans
  // filtre user_id — utile pour les admins et anciens comptes dont les
  // logements ont un user_id different, cas legacy). Le nom en base est
  // typiquement unique donc le match est fiable.
  // Si aucun match trouve, on tombe sur des pseudo-logements virtuels
  // (id prefixe "virtual:") pour au moins afficher quelque chose.
  if (allProperties.length === 0) {
    const [sejoursRes, contractsRes] = await Promise.all([
      admin.from('sejours').select('logement').eq('user_id', user.id).not('logement', 'is', null),
      admin.from('contracts').select('logement_nom').eq('user_id', user.id).not('logement_nom', 'is', null),
    ])
    const distinctNames = new Set<string>()
    ;(sejoursRes.data ?? []).forEach(r => { if (r.logement) distinctNames.add(String(r.logement).trim()) })
    ;(contractsRes.data ?? []).forEach(r => { if (r.logement_nom) distinctNames.add(String(r.logement_nom).trim()) })
    const names = Array.from(distinctNames).filter(Boolean)

    if (names.length > 0) {
      // Cherche les vrais UUIDs correspondants dans la table logements
      // (sans filtre user_id). Permet a un clic sur "Casa Do Peidreiro"
      // de router vers /dashboard/logements/{vrai-uuid} au lieu de
      // /dashboard/logements (liste).
      const { data: matched } = await admin
        .from('logements')
        .select('id, nom, ville')
        .in('nom', names)
      const foundNames = new Set<string>()
      ;(matched ?? []).forEach(r => {
        allProperties.push({
          id: r.id,
          nom: r.nom ?? 'Sans nom',
          ville: r.ville ?? null,
        })
        if (r.nom) foundNames.add(r.nom.trim())
      })
      // Pour les noms qui n'ont AUCUN match en DB, id virtuel de secours
      names.forEach(nom => {
        if (!foundNames.has(nom)) {
          allProperties.push({ id: `virtual:${nom}`, nom, ville: null })
        }
      })
    }
  }

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
