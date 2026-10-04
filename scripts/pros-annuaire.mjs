#!/usr/bin/env node
// État des fiches pros (photographes, équipes de ménage) dans l'annuaire, et
// publication des fiches payées restées hors ligne.
//
//   node scripts/pros-annuaire.mjs etat      → lecture seule
//   node scripts/pros-annuaire.mjs publier   → active les fiches payées
//
// Les journaux GitHub sont publics : on n'affiche ni nom, ni e-mail, ni slug,
// seulement un identifiant court, le statut et des dates.
// « Payée » = abonnement Stripe enregistré par le webhook
// (stripe_subscription_id + statut active/trialing). Une fiche masquée par
// l'admin (status = 'hidden') ou annulée n'est jamais republiée ici.

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SERVICE_KEY
const MODE = (process.argv[2] || 'etat').trim()
if (!SUPABASE_URL || !KEY) { console.error('Secrets Supabase absents'); process.exit(1) }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' }
const notice = (title, body) => console.log(`::notice title=${title}::${String(body).replace(/\n/g, '%0A')}`)

async function get(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H })
  if (!res.ok) throw new Error(`${path.split('?')[0]} : ${res.status} ${await res.text()}`)
  return res.json()
}
async function patch(table, id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`${table} ${id.slice(0, 6)} : ${res.status} ${await res.text()}`)
}

const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const day = d => (d ? String(d).slice(0, 16).replace('T', ' ') : '-')
const PAID = new Set(['active', 'trialing'])
const PUBLISHABLE = new Set(['pending_payment', 'approved_pending_payment', 'active'])

async function liveCount(path) {
  try {
    const res = await fetch(`https://jasonmarinho.com/${path}`, { redirect: 'follow' })
    if (!res.ok) return `HTTP ${res.status}`
    return String((await res.text()).match(/<loc>/g)?.length ?? 0)
  } catch (e) { return `erreur ${e.message}` }
}

async function run(kind) {
  const table = kind === 'photographe' ? 'photographers' : 'cleaners'
  const view = kind === 'photographe' ? 'public_photographers_view' : 'public_cleaners_view'
  const nameCols = kind === 'photographe' ? 'full_name,ville' : 'full_name,pseudo,ville'
  const rows = await get(`${table}?select=id,status,is_public,slug,tier,stripe_subscription_id,stripe_subscription_status,created_at,updated_at,${nameCols}&order=updated_at.desc.nullslast&limit=40`)
  const pub = await get(`${view}?select=id&limit=1000`)
  const pubIds = new Set(pub.map(r => r.id))

  const byStatus = {}
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1
  notice(`${kind} : base`, `${pub.length} fiche(s) dans la vue publique · 40 dernières modifiées par statut : ${JSON.stringify(byStatus)}`)

  const lines = rows.slice(0, 15).map(r =>
    `${r.id.slice(0, 6)} · ${r.status} · public ${r.is_public ? 'oui' : 'non'} · slug ${r.slug ? 'oui' : 'non'} · abonnement ${r.stripe_subscription_id ? (r.stripe_subscription_status || '?') : 'aucun'} · vue publique ${pubIds.has(r.id) ? 'oui' : 'non'} · créée ${day(r.created_at)} · modifiée ${day(r.updated_at)}`)
  notice(`${kind} : 15 dernières fiches modifiées`, lines.join('\n'))

  const stuck = rows.filter(r => r.stripe_subscription_id && PAID.has(r.stripe_subscription_status) && PUBLISHABLE.has(r.status) && !pubIds.has(r.id))
  notice(`${kind} : payées mais hors ligne`, stuck.length ? stuck.map(r => `${r.id.slice(0, 6)} (${r.status}, public ${r.is_public ? 'oui' : 'non'}, slug ${r.slug ? 'oui' : 'non'})`).join('\n') : 'aucune')

  if (MODE !== 'publier' || !stuck.length) return 0
  let done = 0
  for (const r of stuck) {
    let slug = r.slug
    if (!slug) {
      const base = slugify(`${(kind === 'menage' && r.pseudo) || r.full_name}-${r.ville}`).slice(0, 80)
      const clash = await get(`${table}?select=id&slug=eq.${encodeURIComponent(base)}&id=neq.${r.id}&limit=1`)
      slug = clash.length ? `${base}-${r.id.slice(0, 6)}` : base
    }
    await patch(table, r.id, { status: 'active', is_public: true, slug, updated_at: new Date().toISOString() })
    done++
    notice(`${kind} : publiée`, `${r.id.slice(0, 6)} passée en active et publique`)
  }
  return done
}

// Comptes : compare les comptes de connexion, les profils et les fiches pros
// (chiffres seulement, aucun nom ni e-mail)
async function comptes() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers: H })
  const authIds = res.ok ? ((await res.json()).users ?? []).map(u => u.id) : null
  const profiles = await get('profiles?select=id,role,plan&limit=5000')
  const profIds = new Set(profiles.map(p => p.id))
  const byRole = {}, byPlan = {}
  for (const p of profiles) { byRole[p.role] = (byRole[p.role] || 0) + 1; byPlan[p.plan] = (byPlan[p.plan] || 0) + 1 }
  const ph = await get('photographers?select=user_id,tier,status,stripe_subscription_status&limit=1000')
  const cl = await get('cleaners?select=user_id,tier,status,stripe_subscription_status&limit=1000')
  const pro = (rows, label) => {
    const paid = rows.filter(r => PAID.has(r.stripe_subscription_status))
    return `${label} : ${rows.length} fiche(s), ${rows.filter(r => !r.user_id).length} sans compte, ${rows.filter(r => r.user_id && !profIds.has(r.user_id)).length} compte sans profil, payées ${paid.length} (fondateur ${paid.filter(r => r.tier === 'fondateur').length})`
  }
  notice('Comptes', [
    `comptes de connexion : ${authIds ? authIds.length : 'lecture impossible ' + res.status}`,
    authIds ? `comptes sans profil : ${authIds.filter(id => !profIds.has(id)).length}` : '',
    `profils : ${profiles.length} · par rôle ${JSON.stringify(byRole)} · par formule ${JSON.stringify(byPlan)}`,
    pro(ph, 'photographes'), pro(cl, 'ménage'),
  ].filter(Boolean).join('\n'))
}
await comptes()

const p = await run('photographe')
const m = await run('menage')
notice('Site en ligne', `sitemap-photographes.xml : ${await liveCount('sitemap-photographes.xml')} URL · sitemap-menages.xml : ${await liveCount('sitemap-menages.xml')} URL`)
if (MODE === 'publier') notice('Publication', `${p + m} fiche(s) activée(s). Le site se met à jour au prochain déploiement de main.`)
