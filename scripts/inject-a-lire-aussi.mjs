#!/usr/bin/env node
// Bloc « À lire aussi » dans les articles du blog (23/11/2026, Jason : « il faut
// qu'on mette de l'ordre dans le SEO », conseils d'Amandine Bart / SEO Sans
// Migraine : remettre à jour les anciens articles pour qu'ils pointent vers les
// nouveaux, ancres descriptives, liens entre pages du même sujet).
// Constat : chaque article lie 3 articles plus anciens (`related`, choisis à
// l'écriture), jamais l'inverse : 62 articles n'étaient liés que par /blog et
// leur catégorie.
// Règle : un article qui reçoit moins de 3 liens d'autres articles en reçoit
// jusqu'à 3 de plus, depuis les articles de la MÊME catégorie dont le titre et
// la description lui ressemblent le plus. Ancre = titre de l'article visé.
// Au plus 2 liens par article d'accueil, placés au milieu du texte (avant le
// 3e intertitre), marqueurs A-LIRE. Recalculé de zéro à chaque passage :
// idempotent, déterministe. Lancé au build (scripts/build-site.sh) pour que
// chaque nouvel article soit relié dès sa mise en ligne.
//   node scripts/inject-a-lire-aussi.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const { articles } = await import(pathToFileURL(path.join(ROOT, 'blog/articles-data.mjs')).href)

const CIBLE = 3        // liens d'autres articles visés pour chaque article
const MAX_HOTE = 2     // liens ajoutés au plus par article d'accueil
const BLOC = /\n?<!-- A-LIRE:START -->[\s\S]*?<!-- A-LIRE:END -->/g

const VIDES = new Set(('le la les un une des du de d l et ou en au aux à a pour par sur sans avec dans ce ces cette ton ta tes son sa ses vos votre tu te qui que quoi comment pourquoi quand quel quelle quels quelles est sont être faut plus moins tout tous toute bien mieux vraiment ne pas se s qu y il elle ils on 2025 2026 2027 lcd airbnb location locations courte durée hôte hôtes hote hotes voyageur voyageurs logement logements règles regles actions étapes etapes critères criteres guide solutions conseils erreurs points questions essentiels choses façons idées ans jason marinho concret concrete concretes booster transformer avis modele modeles sejour sejours choisir eviter attirer optimiser gerer reussir simple simples rapide pratique pratiques astuce astuces complet complete faire mettre garder sublimer entre nouveau nouvelle meilleur meilleure meilleurs argument arguments differenciant premium budget efficace vrai vraie chaque deja hors fois jour jours mois sans comprendre savoir').split(' '))
const mots = t => new Set(t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter(w => w.length > 2 && !/^\d+$/.test(w) && !VIDES.has(w)).map(w => w.replace(/s$/, '')))
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fichier = slug => path.join(ROOT, 'blog', slug, 'index.html')
const liste = articles.filter(a => fs.existsSync(fichier(a.slug)))
const html = new Map(liste.map(a => [a.slug, fs.readFileSync(fichier(a.slug), 'utf8')]))
const nu = new Map([...html].map(([s, h]) => [s, h.replace(BLOC, '')]))

// Liens existants entre articles (hors blocs A-LIRE)
const lie = new Map(liste.map(a => [a.slug, new Set()])) // cible → sources
for (const [src, h] of nu) {
  for (const m of h.matchAll(/href="(?:https:\/\/jasonmarinho\.com)?\/blog\/([a-z0-9-]+)\/?"/g)) {
    if (m[1] !== src && lie.has(m[1])) lie.get(m[1]).add(src)
  }
}

const sig = new Map(liste.map(a => [a.slug, mots(`${a.title} ${a.description || ''}`)]))
// Proximité pondérée par la rareté des mots (un mot présent partout ne rapproche rien)
const df = new Map()
for (const m of sig.values()) for (const w of m) df.set(w, (df.get(w) || 0) + 1)
const poids = w => Math.log(liste.length / (df.get(w) || 1))
const proche = (a, b) => { let n = 0; for (const w of sig.get(a)) if (sig.get(b).has(w)) n += poids(w); return n }
const SEUIL = 6 // au moins un mot rare ou deux mots peu courants en commun

const ajouts = new Map() // hôte → [cibles]
const cibles = liste.filter(a => lie.get(a.slug).size < CIBLE)
  .sort((x, y) => lie.get(x.slug).size - lie.get(y.slug).size || x.slug.localeCompare(y.slug))
for (const t of cibles) {
  let manque = CIBLE - lie.get(t.slug).size
  const candidats = liste
    .filter(h => h.slug !== t.slug && h.categorySlug === t.categorySlug && !lie.get(t.slug).has(h.slug)
      && !nu.get(h.slug).includes(`/blog/${t.slug}"`) && (ajouts.get(h.slug)?.length ?? 0) < MAX_HOTE)
    .map(h => ({ h, s: proche(t.slug, h.slug) }))
    .filter(c => c.s >= SEUIL)
    .sort((a, b) => b.s - a.s || a.h.slug.localeCompare(b.h.slug))
  for (const { h } of candidats) {
    if (manque <= 0) break
    if (!ajouts.has(h.slug)) ajouts.set(h.slug, [])
    ajouts.get(h.slug).push(t)
    manque--
  }
}

const parSlug = new Map(liste.map(a => [a.slug, a]))
let ecrites = 0, liens = 0
const ecarts = []
for (const a of liste) {
  let h = nu.get(a.slug)
  const t = ajouts.get(a.slug)
  if (t?.length) {
    const bloc = `\n<!-- A-LIRE:START -->\n<p class="art-p" style="border-left:3px solid var(--g);padding-left:14px"><strong>À lire aussi :</strong> ${t.map(x => `<a href="/blog/${x.slug}" style="color:var(--g);font-weight:500">${esc(parSlug.get(x.slug).title)}</a>`).join(' ; ')}</p>\n<!-- A-LIRE:END -->`
    const h2 = [...h.matchAll(/<h2 class="art-h2"/g)]
    const at = (h2[2] ?? h2[1] ?? h2[0])?.index
    if (at === undefined) continue
    h = h.slice(0, at) + bloc.slice(1) + '\n' + h.slice(at)
    liens += t.length
  }
  if (h !== html.get(a.slug)) {
    if (CHECK) ecarts.push(a.slug)
    else { fs.writeFileSync(fichier(a.slug), h); ecrites++ }
  }
}
const restants = liste.filter(a => lie.get(a.slug).size + [...ajouts.values()].flat().filter(x => x.slug === a.slug).length < CIBLE).length
if (CHECK) {
  if (ecarts.length) { console.error(`À lire aussi : ${ecarts.length} articles à mettre à jour`); process.exit(1) }
  console.log(`À lire aussi : à jour (${liens} liens)`)
} else console.log(`À lire aussi : ${liens} liens dans ${ajouts.size} articles, ${ecrites} fichiers écrits ; articles encore sous ${CIBLE} liens : ${restants}`)
