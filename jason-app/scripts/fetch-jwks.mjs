// Clé publique de signature des sessions Supabase, téléchargée au build
// (20/11/2026). Sans elle, la vérification de session (getClaims) redemande
// la clé à Supabase à chaque démarrage d'un serveur et toutes les 10 minutes,
// séparément dans le middleware et dans les pages : 0,3 à plusieurs secondes
// quand la base gratuite ralentit. Avec elle, la vérification est locale.
// Si la clé change (rotation dans Supabase), getClaims retombe tout seul sur
// le téléchargement réseau. Ne fait jamais échouer le build.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../lib/supabase/jwks.generated.json', import.meta.url))
const base = process.env.NEXT_PUBLIC_SUPABASE_URL
let keys = []
if (base) {
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`, { signal: AbortSignal.timeout(8000) })
    const body = res.ok ? await res.json() : null
    // Clés publiques seulement (jamais de partie privée « d »)
    keys = Array.isArray(body?.keys)
      ? body.keys.filter(k => k && typeof k.kid === 'string' && !('d' in k))
      : []
    console.log(`[jwks] ${keys.length} clé(s) publique(s)${res.ok ? '' : ` (HTTP ${res.status})`}`)
  } catch (e) {
    console.log('[jwks] téléchargement impossible, vérification réseau gardée :', e?.name ?? 'erreur')
  }
} else {
  console.log('[jwks] NEXT_PUBLIC_SUPABASE_URL absente, rien à faire')
}
writeFileSync(out, JSON.stringify({ keys }, null, 2) + '\n')
