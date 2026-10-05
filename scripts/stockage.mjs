// Stockage Supabase (05/10/2026) : taille de chaque dossier (« bucket ») et,
// sur demande, vidage d'un dossier dont la fonction a été retirée de l'app.
// Offre gratuite : 1 Go en tout. Le dépôt est public : journaux en nombres
// seulement (dossiers, fichiers, Mo), jamais un nom de fichier.
//
// Usage : node scripts/stockage.mjs liste
//         node scripts/stockage.mjs vider logement-photos
import process from 'node:process'

const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const [op = 'liste', bucketArg] = process.argv.slice(2)
// Seuls les dossiers des fonctions retirées peuvent être vidés (05/10/2026 :
// photos des logements et galerie des photographes).
const VIDABLES = new Set(['logement-photos', 'pro-portfolio'])
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

if (!URL_BASE || !KEY) { console.error('Variables Supabase manquantes.'); process.exit(1) }

async function listAll(bucket) {
  const out = []
  const stack = ['']
  while (stack.length) {
    const prefix = stack.pop()
    for (let offset = 0; ; offset += 1000) {
      const r = await fetch(`${URL_BASE}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
      })
      if (!r.ok) throw new Error(`liste ${bucket} : HTTP ${r.status}`)
      const items = await r.json()
      for (const it of items) {
        const path = prefix ? `${prefix}/${it.name}` : it.name
        if (it.id === null) stack.push(path)
        else out.push({ path, size: Number(it.metadata?.size ?? 0) })
      }
      if (items.length < 1000) break
    }
  }
  return out
}

const mo = b => (b / 1048576).toFixed(1)

if (op === 'liste') {
  const r = await fetch(`${URL_BASE}/storage/v1/bucket`, { headers })
  const buckets = await r.json()
  let total = 0
  const lines = []
  for (const b of buckets) {
    const files = await listAll(b.id)
    const size = files.reduce((s, f) => s + f.size, 0)
    total += size
    lines.push(`${b.id} : ${files.length} fichiers, ${mo(size)} Mo`)
  }
  console.log(`::notice title=Stockage (${mo(total)} Mo sur 1 024)::${lines.join(' · ')}`)
} else if (op === 'vider') {
  if (!VIDABLES.has(bucketArg)) { console.error(`Dossier non autorisé : ${bucketArg}`); process.exit(1) }
  const files = await listAll(bucketArg)
  let deleted = 0
  for (let i = 0; i < files.length; i += 100) {
    const prefixes = files.slice(i, i + 100).map(f => f.path)
    const r = await fetch(`${URL_BASE}/storage/v1/object/${encodeURIComponent(bucketArg)}`, {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes }),
    })
    if (r.ok) deleted += (await r.json()).length
  }
  const freed = files.reduce((s, f) => s + f.size, 0)
  console.log(`::notice title=Vidage ${bucketArg}::${deleted} fichier(s) supprimé(s) sur ${files.length}, ${mo(freed)} Mo libérés`)
} else {
  console.error('op inconnue (liste, vider <dossier>)'); process.exit(1)
}
