#!/usr/bin/env node
/**
 * Génération automatique d'articles LCD via Claude API.
 * Utilisé par .github/workflows/auto-article.yml (Lun/Mer/Ven 7h UTC).
 *
 * Flux :
 *   1. Lit le premier sujet non traité dans scripts/articles-queue.json
 *   2. Appelle Claude API pour générer le contenu complet (JSON)
 *   3. Écrit le config temporaire puis appelle generate-article.mjs
 *   4. Retire le sujet traité de la queue et sauvegarde
 *
 * Prérequis : ANTHROPIC_API_KEY dans l'env.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Config ──────────────────────────────────────────────────────────────────

const QUEUE_PATH    = resolve(__dirname, 'articles-queue.json')
const TEMP_CONFIG   = resolve(__dirname, 'articles', '_auto_temp.mjs')
const ARTICLES_DATA = resolve(ROOT, 'blog', 'articles-data.mjs')
const MODEL         = 'claude-sonnet-4-6'
const MAX_TOKENS    = 7000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n✗ ${msg}`); process.exit(1) }

async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) die('ANTHROPIC_API_KEY manquant dans les variables d\'environnement')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    die(`Claude API erreur ${res.status} : ${body}`)
  }

  const data = await res.json()
  return data.content[0].text
}

function extractJson(text) {
  // Extraire le JSON depuis la réponse (même si Claude entoure avec du markdown)
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (fenced) return fenced[1]
  const brace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (brace !== -1 && lastBrace !== -1) return text.slice(brace, lastBrace + 1)
  return text.trim()
}

// ─── Lecture des articles existants ──────────────────────────────────────────

async function getExistingArticles() {
  if (!existsSync(ARTICLES_DATA)) return []
  const { articles } = await import(pathToFileURL(ARTICLES_DATA).href)
  return articles || []
}

// ─── Construction du prompt Claude ───────────────────────────────────────────

const CATEGORIES_LABELS = {
  revenus:        'Revenus',
  visibilite:     'Visibilité',
  experience:     'Expérience voyageur',
  automatisation: 'Automatisation',
  reglementation: 'Réglementation',
  conciergerie:   'Conciergerie',
  fiscalite:      'Fiscalité',
  driing:         'Driing',
}

function buildPrompt(topic, existingArticles) {
  // Sélectionner 20 articles pertinents pour le related (même catégorie en priorité)
  const sameCat = existingArticles.filter(a => a.categorySlug === topic.categorySlug).slice(0, 8)
  const others  = existingArticles.filter(a => a.categorySlug !== topic.categorySlug).slice(0, 14)
  const pool    = [...sameCat, ...others]
  const relatedPool = pool.map(a => `- slug: "${a.slug}" | titre: "${a.title}"`).join('\n')

  const catLabel = CATEGORIES_LABELS[topic.categorySlug] || topic.categorySlug

  return `Tu es rédacteur expert en location courte durée (LCD) et Airbnb pour jasonmarinho.com — blog de référence francophone LCD avec 136 articles publiés.

SUJET À RÉDIGER :
Titre indicatif : "${topic.title}"
Catégorie : "${topic.categorySlug}" (${catLabel})

INSTRUCTIONS DE RÉDACTION :
- Public : hôtes Airbnb français, débutants à intermédiaires
- Langue : français courant, tutoiement, ton direct, concret, sans jargon inutile
- Structure : 5 à 6 sections avec h2 numérotés ("1. ...", "2. ...", etc.)
- Contenu varié par section : paragraphes (p), listes à puces (ul), astuces (tip), max 1 CTA (cta)
- Chaque section a 2 à 4 blocs de contenu
- Exactement 1 bloc "cta" dans tout l'article (pas plus)
- Exactement 2 à 3 blocs "tip" (astuces) au total dans l'article
- Les listes ul : 4 à 7 items concrets, sans tirets ni puces au début du texte
- Le "lead" : 2-3 phrases d'accroche avec un chiffre ou stat percutant
- La "description" : meta description 140-155 caractères exactement
- readTime : nombre entier entre 5 et 9 (selon la densité du contenu)
- Date : "2026-05-03"
- Le slug : en kebab-case, 4-8 mots, sans accent, représentatif du contenu

TYPES DE BLOCS :
- {"type":"p","text":"texte..."} — paragraphe
- {"type":"ul","items":["item 1","item 2","item 3"]} — liste à puces
- {"type":"tip","text":"astuce..."} — encadré conseil
- {"type":"cta","text":"accroche courte","button":"Libellé bouton","href":"/services"} — appel à l'action (1 seul dans tout l'article)

ARTICLES EXISTANTS pour le champ "related" (choisis 3 parmi cette liste) :
${relatedPool}

RÉPONDS UNIQUEMENT avec un objet JSON valide, sans markdown, sans commentaire, sans texte avant ou après :

{
  "slug": "slug-de-l-article",
  "title": "Titre complet de l'article",
  "description": "Meta description 140-155 caractères",
  "keywords": "mot-clé 1, mot-clé 2, mot-clé 3, mot-clé 4, mot-clé 5",
  "categorySlug": "${topic.categorySlug}",
  "date": "2026-05-03",
  "readTime": 7,
  "lead": "Accroche 2-3 phrases avec chiffre ou stat percutant.",
  "sections": [
    {
      "h2": "1. Titre de section",
      "content": [
        {"type": "p", "text": "Paragraphe..."},
        {"type": "ul", "items": ["Item 1", "Item 2", "Item 3"]},
        {"type": "tip", "text": "Astuce concrète..."}
      ]
    }
  ],
  "related": [
    {"slug": "slug-existant", "label": "Titre court pour la carte", "categoryLabel": "Catégorie"}
  ]
}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'))

if (!queue.topics || queue.topics.length === 0) {
  console.log('✓ Queue vide — aucun sujet à traiter. Ajoutez des sujets dans scripts/articles-queue.json')
  process.exit(0)
}

const topic = queue.topics[0]
console.log(`\n→ Sujet sélectionné : "${topic.title}"`)
console.log(`  Catégorie : ${topic.categorySlug} | ID : ${topic.id}\n`)

// Vérifier que l'article n'existe pas déjà (par id de sujet)
const existingArticles = await getExistingArticles()

// Appel Claude
console.log(`→ Appel Claude API (${MODEL})…`)
const raw = await callClaude(buildPrompt(topic, existingArticles))

// Parser le JSON
let config
try {
  config = JSON.parse(extractJson(raw))
} catch (e) {
  console.error('Réponse brute Claude :\n', raw)
  die(`JSON invalide dans la réponse Claude : ${e.message}`)
}

// Vérifications minimales
const required = ['slug','title','description','categorySlug','date','readTime','keywords','lead','sections','related']
for (const f of required) {
  if (config[f] === undefined) die(`Champ manquant dans le JSON généré : ${f}`)
}
if (typeof config.sections !== 'object' || config.sections.length < 3) {
  die(`Sections insuffisantes : ${config.sections?.length ?? 0} (minimum 3)`)
}

// Vérifier que le slug n'existe pas déjà
if (existsSync(resolve(ROOT, 'blog', config.slug))) {
  die(`Le slug "${config.slug}" existe déjà dans blog/. Article non créé pour éviter un doublon.`)
}

console.log(`✓ Article généré : "${config.title}"`)
console.log(`  Slug : ${config.slug} | ${config.sections.length} sections | ~${config.readTime} min`)

// Écrire le config temporaire
writeFileSync(TEMP_CONFIG, `export default ${JSON.stringify(config, null, 2)}\n`, 'utf8')

try {
  // Déléguer au script CLI existant
  execSync(`node scripts/generate-article.mjs scripts/articles/_auto_temp.mjs`, {
    cwd: ROOT,
    stdio: 'inherit',
  })

  // Mettre à jour la queue (retirer le sujet traité)
  queue.topics = queue.topics.slice(1)
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n', 'utf8')
  console.log(`\n✓ Queue mise à jour — ${queue.topics.length} sujets restants`)

} catch (err) {
  die(`generate-article.mjs a échoué : ${err.message}`)
} finally {
  try { unlinkSync(TEMP_CONFIG) } catch {}
}

console.log(`\n🎉 Article publié : https://jasonmarinho.com/blog/${config.slug}/`)
