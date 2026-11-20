// Clés publiques de signature des sessions (scripts/fetch-jwks.mjs, au build,
// 20/11/2026). Passées à getClaims : vérification locale, sans redemander la
// clé à Supabase à chaque démarrage de serveur et toutes les 10 minutes.
// Liste vide (build local, téléchargement raté) ou clé changée dans Supabase :
// getClaims télécharge la clé comme avant.
import type { SupabaseClient } from '@supabase/supabase-js'
import data from './jwks.generated.json'

type ClaimsOptions = NonNullable<Parameters<SupabaseClient['auth']['getClaims']>[1]>
type Jwks = NonNullable<ClaimsOptions['jwks']>

const jwks = data as unknown as Jwks
export const SESSION_CLAIMS_OPTIONS: ClaimsOptions = jwks.keys.length ? { jwks } : {}
