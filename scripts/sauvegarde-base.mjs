// Sauvegarde de la base Supabase (05/10/2026). L'offre gratuite de Supabase
// ne fait aucune sauvegarde : ce script exporte chaque table du schéma public
// et les comptes de connexion, en JSON (une ligne par enregistrement), dans
// le dossier passé en argument. Le workflow « Sauvegarde de la base »
// (.github/workflows/sauvegarde.yml) l'archive, la chiffre et la garde 30 jours.
//
// Le dépôt est public : les journaux ne contiennent que des nombres (tables,
// lignes, taille), jamais une donnée.
//
// Usage : NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/sauvegarde-base.mjs <dossier>
import { mkdir, writeFile, appendFile } from 'node:fs/promises'
import { join } from 'node:path'

const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const OUT = process.argv[2]
const PAGE = 1000

// Tables volumineuses sans valeur à restaurer (statistiques de visite purgées
// à 30 jours, journal d'erreurs). Tout le reste est sauvegardé.
const SKIP = new Set(['site_visits', 'app_errors'])

if (!URL_BASE || !KEY || !OUT) {
  console.error('Variables NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ou dossier de sortie manquants.')
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function getJson(url, extra = {}, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { ...headers, ...extra } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (err) {
      if (i >= tries) throw err
      await new Promise(res => setTimeout(res, 1500 * i))
    }
  }
}

/** Tables exposées par l'API (schéma public) et leur clé primaire, pour paginer dans un ordre stable. */
async function listTables() {
  const spec = await getJson(`${URL_BASE}/rest/v1/`, { Accept: 'application/openapi+json' })
  const tables = []
  for (const path of Object.keys(spec.paths || {})) {
    const name = path.replace(/^\//, '')
    if (!name || name.startsWith('rpc/')) continue
    const props = spec.definitions?.[name]?.properties || {}
    const pk = Object.entries(props).filter(([, p]) => String(p.description || '').includes('<pk/>')).map(([k]) => k)
    tables.push({ name, pk })
  }
  return tables.sort((a, b) => a.name.localeCompare(b.name))
}

async function dumpTable({ name, pk }, dir) {
  const file = join(dir, `${name}.ndjson`)
  await writeFile(file, '')
  const order = pk.length ? `&order=${pk.map(k => `${encodeURIComponent(k)}.asc`).join(',')}` : ''
  let offset = 0
  let rows = 0
  let bytes = 0
  for (;;) {
    const page = await getJson(`${URL_BASE}/rest/v1/${encodeURIComponent(name)}?select=*${order}&limit=${PAGE}&offset=${offset}`)
    if (!Array.isArray(page) || page.length === 0) break
    const chunk = page.map(r => JSON.stringify(r)).join('\n') + '\n'
    await appendFile(file, chunk)
    rows += page.length
    bytes += Buffer.byteLength(chunk)
    if (page.length < PAGE) break
    offset += PAGE
  }
  return { rows, bytes, ordered: pk.length > 0 }
}

/** Comptes de connexion (auth.users) : l'API d'administration, page par page. */
async function dumpAuthUsers(dir) {
  const file = join(dir, '_auth_users.ndjson')
  await writeFile(file, '')
  let rows = 0
  for (let page = 1; page < 200; page++) {
    const res = await getJson(`${URL_BASE}/auth/v1/admin/users?page=${page}&per_page=${PAGE}`)
    const users = res.users || []
    if (users.length === 0) break
    await appendFile(file, users.map(u => JSON.stringify(u)).join('\n') + '\n')
    rows += users.length
    if (users.length < PAGE) break
  }
  return rows
}

/** Liste des fichiers stockés (noms et tailles, pas les fichiers eux-mêmes). */
async function listStorage(dir) {
  const buckets = await getJson(`${URL_BASE}/storage/v1/bucket`)
  const out = []
  for (const b of buckets || []) {
    const stack = ['']
    let count = 0
    while (stack.length && count < 50000) {
      const prefix = stack.pop()
      for (let offset = 0; ; offset += PAGE) {
        const r = await fetch(`${URL_BASE}/storage/v1/object/list/${encodeURIComponent(b.id)}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
        })
        if (!r.ok) break
        const items = await r.json()
        for (const it of items) {
          const path = prefix ? `${prefix}/${it.name}` : it.name
          if (it.id === null) stack.push(path)
          else { out.push({ bucket: b.id, path, size: it.metadata?.size ?? null, updated_at: it.updated_at }); count++ }
        }
        if (items.length < PAGE) break
      }
    }
  }
  await writeFile(join(dir, '_storage_files.json'), JSON.stringify({ buckets: (buckets || []).map(b => ({ id: b.id, public: b.public })), files: out }))
  return { buckets: (buckets || []).length, files: out.length }
}

const started = Date.now()
const dir = join(OUT, 'tables')
await mkdir(dir, { recursive: true })

const tables = await listTables()
const manifest = { date: new Date().toISOString(), source: 'supabase-rest', tables: {}, skipped: [], errors: [] }
let totalRows = 0
let totalBytes = 0
for (const t of tables) {
  if (SKIP.has(t.name)) { manifest.skipped.push(t.name); continue }
  try {
    const r = await dumpTable(t, dir)
    manifest.tables[t.name] = r
    totalRows += r.rows
    totalBytes += r.bytes
  } catch (err) {
    manifest.errors.push({ table: t.name, error: String(err.message || err) })
  }
}

try { manifest.auth_users = await dumpAuthUsers(OUT) } catch (err) { manifest.errors.push({ table: 'auth.users', error: String(err.message || err) }) }
try { manifest.storage = await listStorage(OUT) } catch (err) { manifest.errors.push({ table: 'storage', error: String(err.message || err) }) }

await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
await writeFile(join(OUT, 'LISEZMOI.txt'), [
  'Sauvegarde de la base jasonmarinho (Supabase).',
  'tables/<table>.ndjson : une ligne JSON par enregistrement du schéma public.',
  '_auth_users.ndjson : comptes de connexion (auth.users, sans mot de passe en clair).',
  '_storage_files.json : liste des fichiers stockés (les fichiers eux-mêmes ne sont pas copiés).',
  'schema.sql / data.sql : présents seulement si le secret SUPABASE_DB_URL est configuré (pg_dump).',
  'Restauration : voir CLAUDE.md, section « Sauvegarde de la base ».',
  '',
].join('\n'))

const secs = Math.round((Date.now() - started) / 1000)
console.log(`Tables sauvegardées : ${Object.keys(manifest.tables).length} (ignorées : ${manifest.skipped.length})`)
console.log(`Lignes : ${totalRows} · taille brute : ${(totalBytes / 1048576).toFixed(1)} Mo · durée : ${secs} s`)
console.log(`Comptes : ${manifest.auth_users ?? 'erreur'} · fichiers stockés listés : ${manifest.storage?.files ?? 'erreur'}`)
if (manifest.errors.length) {
  console.log(`::error::${manifest.errors.length} élément(s) en échec : ${manifest.errors.map(e => `${e.table} (${e.error})`).join(', ')}`)
  process.exit(1)
}
if (Object.keys(manifest.tables).length < 10) {
  console.log('::error::Moins de 10 tables trouvées : sauvegarde suspecte.')
  process.exit(1)
}
