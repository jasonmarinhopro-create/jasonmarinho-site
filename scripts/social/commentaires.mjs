// Commentaires pour la routine « Community manager », sans connecteur
// Supabase (24/10/2026 : le connecteur ne s'active pas dans les sessions des
// routines). Le workflow chiffre les commentaires à traiter dans
// data/social/commentaires.enc (dépôt public : illisible sans la clé, rangée
// dans social_settings et dans la consigne privée de la routine) ; la routine
// les lit, dépose ses réponses dans data/social-queue/reponses-*.json, et le
// workflow les applique (social_comments) puis les publie.
//   node scripts/social/commentaires.mjs exporter          (workflow)
//   node scripts/social/commentaires.mjs lire <clé>        (routine)

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const ENC_FILE = path.join(ROOT, 'data/social/commentaires.enc')

/** AES-256-GCM, clé en hexadécimal (64 caractères). */
export function encrypt(obj, keyHex) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv)
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') })
}

export function decrypt(text, keyHex) {
  const { iv, tag, data } = JSON.parse(text)
  const d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), Buffer.from(iv, 'base64'))
  d.setAuthTag(Buffer.from(tag, 'base64'))
  return JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'))
}

/** Réponses déposées par la routine : liste propre, ou erreurs. */
export function checkReplies(list) {
  const errs = []
  const ok = []
  if (!Array.isArray(list)) return { ok, errs: ['le fichier doit contenir une liste'] }
  for (const [i, r] of list.entries()) {
    if (!/^[0-9a-f-]{36}$/.test(r?.id ?? '')) { errs.push(`réponse ${i + 1} : id invalide`); continue }
    if (r.action === 'ignorer') { ok.push({ id: r.id, action: 'ignorer' }); continue }
    const t = String(r.texte ?? '').trim()
    if (r.action !== 'repondre' || !t) errs.push(`réponse ${i + 1} : action « repondre » avec un texte, ou « ignorer »`)
    else if (t.length > 600) errs.push(`réponse ${i + 1} : 600 caractères au plus`)
    else if (/—/.test(t) || /\p{Extended_Pictographic}/u.test(t)) errs.push(`réponse ${i + 1} : ni tiret cadratin ni emoji`)
    else if ((t.match(/https?:\/\/[^\s)]+/g) ?? []).some(l => !/^https:\/\/(app\.)?jasonmarinho\.com(\/|$)/.test(l))) errs.push(`réponse ${i + 1} : liens vers jasonmarinho.com seulement`)
    else ok.push({ id: r.id, action: 'repondre', texte: t })
  }
  return { ok, errs }
}

async function rest(pathq, init = {}) {
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${URL_}/rest/v1/${pathq}`, {
    ...init, cache: 'no-store',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${pathq.split('?')[0]} : HTTP ${res.status} ${text.slice(0, 160)}`)
  return text ? JSON.parse(text) : null
}

async function settingKey() {
  const [row] = await rest('social_settings?select=value&key=eq.comments_key')
  if (!row?.value) throw new Error('clé des commentaires absente (social_settings.comments_key)')
  return row.value
}

/** Workflow : commentaires à traiter (7 derniers jours), avec la première ligne du post, sans nom. */
export async function exporter() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const rows = await rest(`social_comments?select=id,platform,text,parent_id,post_external_id,created_at&reply_status=eq.nouveau&created_at=gte.${since}&order=created_at.asc&limit=40`)
  const ids = [...new Set(rows.map(r => r.post_external_id).filter(Boolean))]
  const posts = ids.length ? await rest(`social_post_targets?select=external_post_id,social_posts(body)&external_post_id=in.(${ids.map(encodeURIComponent).join(',')})`) : []
  const postOf = id => String(posts.find(p => p.external_post_id === id)?.social_posts?.body ?? '').split('\n').find(l => l.trim()) ?? ''
  const list = rows.map(r => ({ id: r.id, reseau: r.platform, commentaire: r.text, reponse_a_un_commentaire: !!r.parent_id, post: postOf(r.post_external_id), date: r.created_at }))
  fs.writeFileSync(ENC_FILE, encrypt({ genere_le: new Date().toISOString(), commentaires: list }, await settingKey()) + '\n')
  console.log(`::notice title=Commentaires à traiter::${list.length}`)
}

/** Workflow : applique un fichier de réponses, renvoie le nombre de lignes mises à jour. */
export async function appliquer(file) {
  const { ok, errs } = checkReplies(JSON.parse(fs.readFileSync(file, 'utf8')))
  let n = 0
  for (const r of ok) {
    const patch = r.action === 'ignorer' ? { reply_status: 'ignore' } : { reply_status: 'a_envoyer', reply_text: r.texte }
    const res = await rest(`social_comments?id=eq.${r.id}&reply_status=eq.nouveau`, { method: 'PATCH', body: JSON.stringify(patch) })
    n += res?.length ?? 0
  }
  return { n, errs }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2)
  if (cmd === 'exporter') await exporter()
  else if (cmd === 'lire') {
    if (!fs.existsSync(ENC_FILE)) console.log(JSON.stringify({ commentaires: [] }))
    else console.log(JSON.stringify(decrypt(fs.readFileSync(ENC_FILE, 'utf8'), String(arg ?? '').trim()), null, 2))
  } else { console.log('usage : exporter | lire <clé>'); process.exitCode = 1 }
}
