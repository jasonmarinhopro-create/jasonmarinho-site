/**
 * Publie les questions/réponses d'amorce dans « Questions & réponses »
 * (ex-forum Entre Hôtes), au nom du compte admin de Jason : la question,
 * puis sa réponse, marquée comme acceptée (badge « Résolu », filtre
 * « Déjà répondues »).
 *
 * Idempotent : une question dont le titre existe déjà est ignorée, le script
 * peut être relancé sans créer de doublon.
 *
 * Usage   : node scripts/seed-questions-reponses.mjs
 * Requis  : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Option  : SEED_AUTHOR_EMAIL (sinon : le plus ancien profil admin)
 * Lancé par .github/workflows/seed-questions-reponses.yml
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, SEED_AUTHOR_EMAIL: authorEmail } = process.env
if (!url || !key) {
  console.error('Environnement manquant : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const ITEMS = JSON.parse(readFileSync(resolve(__dirname, 'data/questions-reponses-amorce.json'), 'utf8'))

async function findAuthor() {
  let q = supabase.from('profiles').select('id, full_name, email').eq('role', 'admin')
  if (authorEmail) q = q.eq('email', authorEmail)
  const { data, error } = await q.order('created_at', { ascending: true }).limit(1)
  if (error) throw new Error(`Lecture des profils admin : ${error.message}`)
  if (!data?.length) throw new Error('Aucun profil admin trouvé.')
  return data[0]
}

async function main() {
  const author = await findAuthor()
  console.log(`Auteur : ${author.full_name ?? author.email} (${author.id})`)

  // Ordre inverse : la question n° 1 est publiée en dernier, donc affichée en tête (« Récentes »)
  let created = 0
  for (const item of [...ITEMS].reverse()) {
    const { data: existing, error: exErr } = await supabase
      .from('chez_nous_posts').select('id').eq('title', item.title).limit(1)
    if (exErr) throw new Error(`Vérification « ${item.title} » : ${exErr.message}`)
    if (existing?.length) {
      console.log(`Déjà publiée, ignorée : ${item.title}`)
      continue
    }

    const { data: post, error: postErr } = await supabase
      .from('chez_nous_posts')
      .insert({ author_id: author.id, category: item.category, title: item.title, body: item.body })
      .select('id').single()
    if (postErr) throw new Error(`Question « ${item.title} » : ${postErr.message}`)

    const { data: reply, error: replyErr } = await supabase
      .from('chez_nous_replies')
      .insert({ post_id: post.id, author_id: author.id, body: item.reply })
      .select('id').single()
    if (replyErr) {
      // Pas de question sans réponse : on annule la question
      await supabase.from('chez_nous_posts').delete().eq('id', post.id)
      throw new Error(`Réponse « ${item.title} » : ${replyErr.message}`)
    }

    const { error: accErr } = await supabase
      .from('chez_nous_posts').update({ accepted_reply_id: reply.id }).eq('id', post.id)
    if (accErr) console.warn(`Réponse non marquée acceptée (« ${item.title} ») : ${accErr.message}`)

    created++
    console.log(`Publiée : ${item.title}`)
  }
  console.log(`Terminé : ${created} question(s) publiée(s), ${ITEMS.length - created} déjà présente(s).`)
}

main().catch(e => { console.error(e.message ?? e); process.exit(1) })
