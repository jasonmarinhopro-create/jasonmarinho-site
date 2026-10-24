// File des publications réseaux sociaux (24/10/2026), lancée par le workflow
// « Réseaux sociaux » : pour chaque data/social-queue/*.json déposé par la
// routine, vérifie, rend les visuels, les dépose dans Supabase Storage
// (bucket public social-post-media) et programme le post (social_posts +
// social_post_targets) au prochain créneau. Le cron de l'app le publie.
// Puis réécrit data/social/historique.md depuis la base (posts et chiffres,
// jamais de nom de commentateur : dépôt public).
//   node scripts/social/publish-queue.mjs            file + historique
//   node scripts/social/publish-queue.mjs historique  historique seul

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkSpec, captions, nextSlot } from './spec.mjs'
import { renderFeed, renderReel } from './render.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const QUEUE = path.join(ROOT, 'data/social-queue')
const HISTO = path.join(ROOT, 'data/social/historique.md')
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'social-post-media'
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' }

async function rest(pathq, init = {}) {
  const res = await fetch(`${URL_}/rest/v1/${pathq}`, {
    ...init,
    cache: 'no-store',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${pathq.split('?')[0]} : HTTP ${res.status} ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

async function upload(file, dest) {
  const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${dest}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': MIME[path.extname(file)], 'x-upsert': 'true', 'cache-control': '31536000' },
    body: fs.readFileSync(file),
  })
  if (!res.ok) throw new Error(`envoi de ${path.basename(file)} : HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  return `${URL_}/storage/v1/object/public/${BUCKET}/${dest}`
}

async function publishOne(file) {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'))
  const errs = checkSpec(spec, { exists: p => fs.existsSync(path.join(ROOT, p)) })
  if (errs.length) throw new Error(errs.join(' ; '))

  // Déjà programmé (le fichier peut revenir par la fusion de la branche) : ignoré
  const recent = await rest(`social_posts?select=media_urls&created_at=gte.${new Date(Date.now() - 45 * 86400000).toISOString()}`)
  if (recent.some(p => (p.media_urls ?? []).some(u => u.includes(`-${spec.slug}/`)))) return { slug: spec.slug, format: spec.format, slot: 'déjà programmé', images: 0, skipped: true }

  const out = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'social-'))
  const stamp = new Date().toISOString().slice(0, 10)
  const dir = `auto/${stamp}-${spec.slug}`
  let media
  if (spec.format === 'reel') {
    const r = await renderReel(spec, out)
    media = [await upload(r.mp4, `${dir}/reel.mp4`), await upload(r.cover, `${dir}/cover.jpg`)]
    console.log(`::notice title=Reel rendu::${r.seconds.toFixed(1)} s, ${fs.statSync(r.mp4).size} o`)
  } else {
    const files = await renderFeed(spec, out)
    media = []
    for (const f of files) media.push(await upload(f, `${dir}/${path.basename(f)}`))
  }

  const [admin] = await rest('profiles?select=id&role=eq.admin&limit=1')
  const upcoming = await rest(`social_posts?select=scheduled_at&status=eq.scheduled&scheduled_at=gte.${new Date().toISOString()}`)
  const slot = nextSlot(new Date(), upcoming.map(p => String(p.scheduled_at).slice(0, 10)))
  const c = captions(spec)
  const [post] = await rest('social_posts', { method: 'POST', body: JSON.stringify({
    created_by: admin.id, body: c.facebook, media_urls: media, platforms: ['facebook', 'instagram'], scheduled_at: slot.toISOString(), status: 'scheduled',
  }) })
  await rest('social_post_targets', { method: 'POST', body: JSON.stringify([
    { post_id: post.id, platform: 'facebook', status: 'pending', body_override: null },
    { post_id: post.id, platform: 'instagram', status: 'pending', body_override: c.instagram },
  ]) })
  fs.rmSync(out, { recursive: true, force: true })
  return { slug: spec.slug, format: spec.format, slot: slot.toISOString(), images: media.length }
}

/** Historique lu par la routine : anti-doublon des sujets et chiffres du rapport. */
async function writeHistory() {
  const posts = await rest('social_posts?select=id,body,media_urls,scheduled_at,status,created_at,social_post_targets(platform,status,like_count,comment_count,published_at,error)&order=created_at.desc&limit=120')
  const comments = await rest('social_comments?select=reply_status,created_at&created_at=gte.' + new Date(Date.now() - 30 * 86400000).toISOString()).catch(() => [])
  const fmt = p => (p.media_urls ?? []).some(u => /\.mp4/i.test(u)) ? 'reel' : (p.media_urls ?? []).length > 1 ? 'carrousel' : (p.media_urls ?? []).length ? 'photo' : 'texte'
  const firstLine = b => String(b ?? '').split('\n').find(l => l.trim())?.slice(0, 110) ?? ''
  const slugOf = p => ((p.media_urls ?? [])[0]?.match(/\/auto\/\d{4}-\d{2}-\d{2}-([a-z0-9-]+)\//) ?? [])[1] ?? '(manuel)'
  const lines = posts.map(p => {
    const t = p.social_post_targets ?? []
    const st = pf => { const x = t.find(y => y.platform === pf); return x ? `${x.status}${x.status === 'published' ? ` ${x.like_count ?? 0} j'aime ${x.comment_count ?? 0} comm.` : ''}` : '-' }
    return `- ${String(p.scheduled_at || p.created_at).slice(0, 10)} · ${fmt(p)} · ${slugOf(p)} · FB ${st('facebook')} · IG ${st('instagram')} · « ${firstLine(p.body).replace(/\|/g, '/')} »`
  })
  const count = s => comments.filter(c => c.reply_status === s).length
  const md = `# Historique des publications réseaux sociaux

Réécrit par le workflow « Réseaux sociaux » depuis la base (ne pas modifier à la main). Les plus récentes en premier.
Format : date prévue · format · sujet (slug) · Facebook · Instagram · première ligne de la légende.

Commentaires des 30 derniers jours : ${comments.length} (nouveaux ${count('nouveau')}, réponses en attente d'envoi ${count('a_envoyer')}, envoyées ${count('envoye')}, ignorés ${count('ignore')}, échecs ${count('echec')}).
Mis à jour le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.

${lines.join('\n') || '- (aucune publication)'}
`
  fs.mkdirSync(path.dirname(HISTO), { recursive: true })
  fs.writeFileSync(HISTO, md)
}

if (!URL_ || !KEY) { console.log('::error::NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant'); process.exit(1) }

let failed = 0
if (process.argv[2] !== 'historique') {
  const files = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).filter(f => f.endsWith('.json')).sort() : []
  for (const f of files) {
    const file = path.join(QUEUE, f)
    try {
      const r = await publishOne(file)
      console.log(`::notice title=Publication programmée::${r.slug} (${r.format}, ${r.images} média) le ${r.slot}`)
      fs.rmSync(file)
    } catch (err) {
      failed++
      console.log(`::error title=Publication refusée (${f})::${err.message}`)
      // Gardée de côté pour que la routine voie le refus et corrige
      fs.mkdirSync(path.join(ROOT, 'data/social/refusees'), { recursive: true })
      fs.writeFileSync(path.join(ROOT, 'data/social/refusees', f.replace(/\.json$/, '.txt')), `${new Date().toISOString()}\n${err.message}\n`)
      fs.renameSync(file, path.join(ROOT, 'data/social/refusees', f))
    }
  }
}
await writeHistory()
if (failed) process.exitCode = 1
