/**
 * Source de vérité unique pour le préfilage des pages dashboard simulateurs
 * et calculateurs. Évite de dupliquer les requêtes Supabase logements + séjours
 * entre les 2 pages.
 *
 * Cache : per-user, TTL 60 s — assez court pour que la donnée reste fraîche
 * mais long pour absorber une navigation simulateurs ↔ calculateurs sans
 * re-querier (cas typique : utilisateur explore les 2 outils en quelques
 * secondes).
 *
 * Pour invalidation explicite après une mutation logement / séjour :
 *   import { revalidateTag } from 'next/cache'
 *   revalidateTag(`user-prefill-${userId}`)
 */

import { unstable_cache } from 'next/cache'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { extractCity } from '@/lib/lcd/market-benchmarks'

// On utilise le service role client à l'intérieur de unstable_cache :
// 1. Pas besoin de cookies() (interdit dans unstable_cache en Next 14.2+)
// 2. On filtre toujours par user_id explicitement → équivalent RLS
// 3. Le service role tolère d'être appelé hors contexte de requête
let _service: SupabaseClient<any, 'public', any> | null = null
function svc(): SupabaseClient<any, 'public', any> {
  if (_service) return _service
  _service = createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  return _service
}

export type ClassementAtoutFrance = 'non_classe' | '1' | '2' | '3' | '4' | '5' | 'chambres_hotes'

export type LogementPrefill = {
  id: string
  nom: string
  pays: 'FR' | 'PT' | 'ES' | 'IT' | 'BE' | 'DE' | 'NL' | 'AT' | 'CH'
  ville: string | null
  tarifNuitee: number | null
  prixAirbnb: number | null
  prixBooking: number | null
  prixDirect: number | null
  saisonBassePct: number | null
  saisonHautePct: number | null
  typeLogement: string | null
  nbChambres: number | null
  classementAtoutFrance: ClassementAtoutFrance | null
  stats?: {
    nuitsLouees: number
    revenuTotal: number
    adrReel: number
    occupationReelle: number
    nbSejours: number
  }
}

const SUPPORTED_PAYS = ['PT', 'ES', 'IT', 'BE', 'DE', 'NL', 'AT', 'CH'] as const

function prefillTag(userId: string) {
  return `user-prefill-${userId}`
}

/**
 * Récupère logements + séjours (12 mois glissants) et les agrège.
 * Cache par userId, TTL 60 s.
 */
export async function getDashboardPrefill(userId: string): Promise<LogementPrefill[]> {
  if (!userId) return []

  const cachedFetch = unstable_cache(
    async (uid: string): Promise<LogementPrefill[]> => {
      // Service role obligatoire ici : pas de cookies() dans unstable_cache.
      // RLS bypassé mais on filtre par user_id explicitement (équivalent sécurité).
      const supabase = svc()
      const [{ data: logements }, { data: sejours }] = await Promise.all([
        supabase
          .from('logements')
          .select('id, nom, adresse, pays, tarif_nuitee_moyen, prix_airbnb_nuit, prix_booking_nuit, prix_direct_nuit, prix_saison_basse_pct, prix_saison_haute_pct, type_logement, nb_chambres, classement_etoiles')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
        supabase
          .from('sejours')
          .select('logement, date_arrivee, date_depart, montant')
          .eq('user_id', uid)
          .gte('date_arrivee', new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10))
          .not('montant', 'is', null)
          .gt('montant', 0),
      ])

      // Agrégation des stats par nom de logement
      const statsByLogementNom: Record<string, NonNullable<LogementPrefill['stats']>> = {}
      ;(sejours ?? []).forEach(s => {
        const nom = (s.logement as string) ?? ''
        if (!nom) return
        const arr = new Date((s.date_arrivee as string) + 'T12:00:00')
        const dep = new Date((s.date_depart as string) + 'T12:00:00')
        const nuits = Math.max(0, Math.round((dep.getTime() - arr.getTime()) / 86400000))
        if (nuits <= 0) return
        if (!statsByLogementNom[nom]) {
          statsByLogementNom[nom] = { nuitsLouees: 0, revenuTotal: 0, adrReel: 0, occupationReelle: 0, nbSejours: 0 }
        }
        statsByLogementNom[nom].nuitsLouees += nuits
        statsByLogementNom[nom].revenuTotal += Number(s.montant ?? 0)
        statsByLogementNom[nom].nbSejours += 1
      })
      Object.keys(statsByLogementNom).forEach(nom => {
        const s = statsByLogementNom[nom]
        s.adrReel = s.nuitsLouees > 0 ? Math.round(s.revenuTotal / s.nuitsLouees) : 0
        s.occupationReelle = Math.round((s.nuitsLouees / 365) * 100)
      })

      const prefill: LogementPrefill[] = (logements ?? []).map(l => {
        const rawPays = ((l.pays as string) ?? 'FR').toUpperCase()
        const pays: LogementPrefill['pays'] =
          (SUPPORTED_PAYS as readonly string[]).includes(rawPays)
            ? (rawPays as LogementPrefill['pays'])
            : 'FR'
        const nom = (l.nom as string) ?? ''
        // Dérivation du classement Atout France depuis les colonnes existantes :
        //  - type_logement === 'chambres-hotes' → 'chambres_hotes' (régime 50 %/77.7k)
        //  - classement_etoiles 1-5            → '1'..'5' (régime classé 50 %/77.7k)
        //  - classement_etoiles 0              → 'non_classe' (régime 30 %/15k)
        //  - classement_etoiles null           → null (non renseigné, on suggérera la saisie)
        const typeLog = (l.type_logement as string | null) ?? null
        const stars = (l.classement_etoiles as number | null)
        let classementAtoutFrance: LogementPrefill['classementAtoutFrance'] = null
        if (typeLog === 'chambres-hotes') {
          classementAtoutFrance = 'chambres_hotes'
        } else if (stars === 0) {
          classementAtoutFrance = 'non_classe'
        } else if (stars && stars >= 1 && stars <= 5) {
          classementAtoutFrance = String(stars) as LogementPrefill['classementAtoutFrance']
        }
        return {
          id: l.id as string,
          nom,
          pays,
          ville: extractCity(l.adresse as string | null),
          tarifNuitee: (l.tarif_nuitee_moyen as number | null) ?? null,
          prixAirbnb: (l.prix_airbnb_nuit as number | null) ?? null,
          prixBooking: (l.prix_booking_nuit as number | null) ?? null,
          prixDirect: (l.prix_direct_nuit as number | null) ?? null,
          saisonBassePct: (l.prix_saison_basse_pct as number | null) ?? null,
          saisonHautePct: (l.prix_saison_haute_pct as number | null) ?? null,
          typeLogement: typeLog,
          nbChambres: (l.nb_chambres as number | null) ?? null,
          classementAtoutFrance,
          stats: statsByLogementNom[nom],
        }
      })

      return prefill
    },
    ['dashboard-prefill', userId],
    { tags: [prefillTag(userId)], revalidate: 60 },
  )

  return cachedFetch(userId)
}

/**
 * Invalide le cache prefill pour un utilisateur — à appeler depuis les server
 * actions qui modifient logements ou séjours.
 */
export async function invalidateDashboardPrefill(userId: string) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(prefillTag(userId))
}
