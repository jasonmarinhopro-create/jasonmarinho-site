#!/usr/bin/env node
// Liens entre les formations et le blog (24/11/2026, Jason : « go pour le
// point 2 »). Avant : aucune page de formation ne liait d'article, et les
// articles envoyaient tous vers l'ancre /#formations de l'accueil.
// - Page de formation : bloc « Sur le blog » (marqueurs FORMATION-BLOG) avec
//   les 3 articles les plus proches (titre, description, objectifs et modules
//   de la formation ; mots pondérés par leur rareté).
// - Article : le bouton de l'encadré « Voir les formations » (/#formations)
//   mène à la formation la plus proche quand elle l'est assez
//   (data-formation), sinon au catalogue /services/formations.
// Lancé au build (scripts/build-site.sh) : nouveaux articles et nouvelles
// formations reliés sans rien faire. Idempotent.
//   node scripts/inject-formations-blog.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const APP = path.join(ROOT, 'jason-app/app/dashboard/formations')
const { articles } = await import(pathToFileURL(path.join(ROOT, 'blog/articles-data.mjs')).href)
const { FORMATIONS_BLOG, ARTICLE_FORMATION = {} } = await import(pathToFileURL(path.join(ROOT, 'scripts/data/formations-blog.mjs')).href)
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const VIDES = new Set(('le la les un une des du de d l et ou en au aux à a pour par sur sans avec dans ce ces cette ton ta tes son sa ses vos votre tu te qui que quoi comment pourquoi quand quel quelle quels quelles est sont être faut plus moins tout tous toute bien mieux vraiment ne pas se s qu y il elle ils on 2025 2026 2027 lcd airbnb location locations courte durée hôte hôtes hote hotes voyageur voyageurs logement logements règles regles actions étapes etapes critères criteres guide solutions conseils erreurs points questions essentiels choses façons idées ans jason marinho concret concrete concretes booster transformer avis modele modeles sejour sejours choisir eviter attirer optimiser gerer reussir simple simples rapide pratique pratiques astuce astuces complet complete faire mettre garder sublimer entre nouveau nouvelle meilleur meilleure meilleurs argument arguments differenciant premium budget efficace vrai vraie chaque deja hors fois jour jours mois comprendre savoir methode formation formations module modules lecon lecons maitriser apprendre utiliser construire creer comprendre identifier mettre place').split(' '))
const mots = t => new Set(t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter(w => w.length > 2 && !/^\d+$/.test(w) && !VIDES.has(w)).map(w => w.replace(/s$/, '')))

// Formations : contenu de l'app + page publique
const lit = (src, cle) => src.match(new RegExp(`\\b${cle}:\\s*(['\`"])((?:\\\\.|(?!\\1)[\\s\\S])*?)\\1`))?.[2]?.replace(/\\(['`"])/g, '$1') ?? ''
const formations = []
for (const slug of fs.readdirSync(path.join(ROOT, 'services/formations')).sort()) {
  const page = path.join(ROOT, 'services/formations', slug, 'index.html')
  const src = path.join(APP, slug, 'content.ts')
  if (!fs.existsSync(page) || !fs.existsSync(src)) continue
  const c = fs.readFileSync(src, 'utf8')
  const titre = lit(c, 'title')
  const obj = c.match(/objectifs:\s*\[([\s\S]*?)\n\s*\],/)?.[1] ?? ''
  const modules = [...c.matchAll(/\n\s{6}title:\s*(['`"])((?:\\.|(?!\1).)*)\1/g)].map(m => m[2]).join(' ')
  formations.push({ slug, titre, page, sig: mots(`${titre} ${lit(c, 'description')} ${modules}`) })
}
const arts = articles.filter(a => fs.existsSync(path.join(ROOT, 'blog', a.slug, 'index.html')))
  .map(a => ({ ...a, sig: mots(`${a.title} ${a.title} ${a.description || ''}`) }))

const df = new Map()
for (const d of [...formations, ...arts]) for (const w of d.sig) df.set(w, (df.get(w) || 0) + 1)
const N = formations.length + arts.length
const score = (a, b) => { let s = 0; for (const w of a) if (b.has(w)) s += Math.log(N / df.get(w)); return s }
const SEUIL = 9 // automatique (formations absentes de scripts/data/formations-blog.mjs)
const SEUIL_ARTICLE = 10 // bouton d'un article vers une formation précise

let ecrites = 0
const ecarts = []
const ecrire = (file, avant, apres) => {
  if (avant === apres) return
  if (CHECK) ecarts.push(path.relative(ROOT, file))
  else { fs.writeFileSync(file, apres); ecrites++ }
}

// 1. Pages de formation : 3 articles
for (const f of formations) {
  const choisis = FORMATIONS_BLOG[f.slug]
  if (choisis) for (const sl of choisis) if (!arts.some(a => a.slug === sl)) throw new Error(`Article introuvable dans formations-blog.mjs : ${sl}`)
  const top = choisis
    ? choisis.map(sl => ({ a: arts.find(a => a.slug === sl) }))
    : arts.map(a => ({ a, s: score(f.sig, a.sig) })).filter(x => x.s >= SEUIL)
      .sort((x, y) => y.s - x.s || x.a.slug.localeCompare(y.a.slug)).slice(0, 3)
  const avant = fs.readFileSync(f.page, 'utf8')
  let html = avant.replace(/<!-- FORMATION-BLOG:START -->[\s\S]*?<!-- FORMATION-BLOG:END -->\n/, '')
  if (top.length && html.includes('<section class="cta-s">')) {
    const cartes = top.map(({ a }) => `    <a class="rel-card" href="/blog/${a.slug}">
      <span class="rel-ico" aria-hidden="true"><i class="ph ph-article"></i></span>
      <span class="rel-body"><span class="rel-title">${esc(a.title)}</span><span class="rel-desc">${esc(a.description || '')}</span><span class="rel-cta">Lire l'article <i class="ph-bold ph-arrow-right"></i></span></span>
    </a>`).join('\n')
    const bloc = `\n<!-- FORMATION-BLOG:START -->
<section class="sec wh rel-sec">
  <div class="s-in">
    <div class="rel-head"><div class="lbl ct">Sur le blog</div><h2 class="h2 ct">Pour aller plus loin, <em>gratuitement</em></h2></div>
    <div class="rel-grid">
${cartes}
    </div>
  </div>
</section>
<!-- FORMATION-BLOG:END -->`
    html = html.replace('<section class="cta-s">', bloc.slice(1) + '\n<section class="cta-s">')
  }
  ecrire(f.page, avant, html)
}

// 2. Articles : bouton de l'encadré vers la formation la plus proche
let versFormation = 0
for (const a of arts) {
  const file = path.join(ROOT, 'blog', a.slug, 'index.html')
  const avant = fs.readFileSync(file, 'utf8')
  // Formation qui liste cet article d'abord, sinon la plus proche si elle l'est assez
  const liee = formations.find(f => FORMATIONS_BLOG[f.slug]?.includes(a.slug))
  const best = formations.map(f => ({ f, s: score(a.sig, f.sig) })).sort((x, y) => y.s - x.s || x.f.slug.localeCompare(y.f.slug))[0]
  const force = Object.hasOwn(ARTICLE_FORMATION, a.slug) ? ARTICLE_FORMATION[a.slug] : undefined
  const cible = force !== undefined ? formations.find(f => f.slug === force) ?? null
    : liee || (best && best.s >= SEUIL_ARTICLE ? best.f : null)
  if (cible) versFormation++
  const html = avant.replace(/<a href="(?:\/#formations|\/services\/formations(?:\/[a-z0-9-]+)?)" class="btn-p"(?: data-formation="[^"]*")?\s*>(?:Voir les formations|Découvrir les formations|Voir la formation)[^<]*(<i class="ph-bold ph-arrow-right"><\/i><\/a>)/,
    (all, fin) => cible
      ? `<a href="/services/formations/${cible.slug}" class="btn-p" data-formation="${cible.slug}">Voir la formation ${fin}`
      : `<a href="/services/formations" class="btn-p" data-formation="">Voir les formations ${fin}`)
  ecrire(file, avant, html)
}

if (CHECK) {
  if (ecarts.length) { console.error(`Liens formations et blog à mettre à jour (${ecarts.length}) : ${ecarts.slice(0, 8).join(', ')}`); process.exit(1) }
  console.log('Liens formations et blog : à jour')
} else console.log(`Liens formations et blog : ${ecrites} fichiers écrits, ${versFormation} articles vers une formation précise`)
