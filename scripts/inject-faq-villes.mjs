#!/usr/bin/env node
// FAQ des pages photographe-lcd- et menage-lcd- (audit SEO, lot D, 19/11/2026,
// validé par Jason : « go pour la FAQ »).
// Avant : environ 500 mots de FAQ par page, communs à 75 % aux 63 villes.
// - Réponses génériques raccourcies, avec un lien vers l'article du blog qui
//   détaille (photo : nombre de photos, photographe spécialisé, vidéo et
//   drone ; ménage : qui paie, ce que comprend un turnover, trouver une équipe).
//   Les chiffres propres à la ville déjà présents sont gardés (annonces,
//   occupation, rotations par mois).
// - Question ajoutée, propre à la ville : « Quand prévoir son shooting » /
//   « Quand réserver son équipe de ménage », d'après les temps forts vérifiés
//   (`pics` de scripts/data/villes-local.mjs). Marqueurs FAQ-SAISON.
// - Taxe de séjour : la réponse générique (« entre 1 % et 5 % ») devient la
//   grille officielle de la ville (DGFiP, scripts/lib/taxe-officielle.mjs) avec
//   un lien vers le guide hôte, quand le relevé existe.
// FAQ affichée et JSON-LD (FAQPage) modifiés ensemble. Idempotent.
//   node scripts/inject-faq-villes.mjs [--check]
// À lancer APRÈS inject-local-villes.mjs (qui réécrit la question taxe) :
// creer-ville.mjs le lance en dernier.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VILLES_LOCAL } from './data/villes-local.mjs'
import { officialGrid, fmtTotal, fmtTarif, phraseAdditions } from './lib/taxe-officielle.mjs'
import { ANNEE_TARIFS } from './lib/annee.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const L = 'style="color:var(--g);font-weight:600"'
const lien = (href, txt) => `<a href="${href}" ${L}>${txt}</a>`
const texte = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const nb = s => s.replace(/ (€|%)/g, ' $1')

const ART = {
  shooting: '/blog/preparer-logement-shooting-photo-lcd-7-etapes',
  choisir: '/blog/photographe-airbnb-tarifs-comment-choisir',
  video: '/blog/video-annonce-airbnb-6-regles-tour-video-conversion-2026',
  frais: '/blog/frais-menage-airbnb-combien-facturer-2026',
  checklist: '/blog/checklist-menage-professionnelle-location-courte-duree',
  equipe: '/blog/trouver-equipe-menage-airbnb-fiable',
}
for (const a of Object.values(ART)) {
  if (!fs.existsSync(path.join(ROOT, a.slice(1), 'index.html'))) throw new Error(`Article introuvable : ${a}`)
}

// Réponses raccourcies. `ancien` : la réponse actuelle (pour garder ses
// chiffres locaux). Renvoie le HTML de la nouvelle réponse.
const COURTES = {
  photographe: [
    [/^Combien de photos faut-il pour une annonce/, (ancien, v) => {
      const marche = ancien.match(/Sur un marché (?:à|de) ([\d\s  ]+) annonces/)?.[1]?.trim()
      return `Visez <strong>25 à 35 photos</strong> : une couverture très travaillée, chaque pièce sous 2 ou 3 angles, les détails qui différencient et le quartier.${marche ? ` Sur un marché de ${marche} annonces comme ${v.ville}, la couverture fait la différence dans les résultats.` : ''} La liste photo par photo : ${lien(ART.shooting, 'préparer son logement pour un shooting')}.`
    }],
    [/^Faut-il un photographe spécialisé LCD/, () =>
      `Oui : le photographe immobilier vend des mètres carrés, le photographe LCD vend <strong>un séjour</strong> (angles pensés pour les vignettes Airbnb et Booking, lumière chaleureuse, mise en scène). Demandez à voir des annonces qu'il a déjà photographiées. Tarifs et critères de choix : ${lien(ART.choisir, 'photographe Airbnb, comment le choisir')}.`],
    [/^Une vidéo ou des vues au drone/, () =>
      `Les photos restent la base sur Airbnb et Booking ; une <strong>vidéo</strong> sert surtout au site de réservation directe, aux réseaux et à la fiche Google. Le <strong>drone</strong> vaut le coup avec un extérieur ou une vue, avec un pilote en règle auprès de la DGAC. Le détail : ${lien(ART.video, 'la vidéo d’une annonce Airbnb')}.`],
  ],
  menage: [
    [/^Qui paie le ménage/, () =>
      `Le voyageur, par les <strong>frais de ménage</strong> ajoutés au séjour sur Airbnb et Booking. Calés sur le coût réel de votre équipe, ils la couvrent sans plomber le classement de l'annonce. Comment les fixer : ${lien(ART.frais, 'frais de ménage Airbnb, combien facturer')}.`],
    [/^Que doit inclure un vrai ménage de turnover/, ancien => {
      const rythme = ancien.match(/Avec[^.]*?fois par mois<\/strong>[^.]*\./)?.[0]
      return `Un nettoyage complet, des <strong>lits faits qualité hôtelière</strong>, le réassort des consommables, le contrôle des équipements et le signalement des dégâts en photos.${rythme ? ` ${rythme}` : ''} La liste point par point : ${lien(ART.checklist, 'la checklist ménage professionnelle')}.`
    }],
    [/^Comment trouver une équipe de ménage fiable/, () =>
      `Quatre critères : une <strong>RC pro</strong> à jour, une vraie expérience du turnover LCD, la disponibilité les week-ends et jours fériés, et un remplaçant en cas d'absence. Dans l'annuaire, chaque équipe affiche ses prestations, sa zone et ses tarifs, contact direct sans commission. La méthode : ${lien(ART.equipe, 'trouver une équipe de ménage fiable')}.`],
  ],
}

function saison(kind, v) {
  const pics = (v.pics || []).map(p => p.replace(/\.$/, ''))
  if (!pics.length) return null
  const liste = pics.join(' ; ')
  return kind === 'photographe'
    ? [`Quand prévoir son shooting ${v.a} ?`, `Quelques semaines avant les temps forts, pour que l'annonce soit à jour quand les voyageurs réservent : ${liste}. Les photos d'extérieur se font avec la lumière de la saison que vous voulez vendre.`]
    : [`Quand réserver son équipe de ménage ${v.a} ?`, `Avant les temps forts, quand toutes les équipes sont demandées en même temps : ${liste}. Calez vos créneaux plusieurs semaines à l'avance et prévoyez un remplaçant pour ces dates.`]
}

function taxe(slug, v) {
  const g = officialGrid(slug)
  const l4 = g?.lignes.find(l => l.label.includes('4 étoiles'))
  if (!g || !l4 || !g.lignes[0]?.label.toLowerCase().includes('non class')) return null
  const guide = `/devenir-hote-airbnb-${slug}`
  if (!fs.existsSync(path.join(ROOT, guide.slice(1), 'index.html'))) return null
  // Tarif voté d'abord (celui de taxesejour.impots.gouv.fr), montant à collecter
  // ensuite (Jason, 28/11/2026 : le total seul ne se retrouvait pas sur le site officiel)
  const add = phraseAdditions(g)
  const coll = add ? ` Avec ${add}, le voyageur paie ${fmtTotal(g.lignes[0])} et ${fmtTotal(l4)}.` : ''
  return nb(`En ${ANNEE_TARIFS} ${v.a}, d'après la base officielle de la DGFiP (tarifs publiés sur taxesejour.impots.gouv.fr), la taxe de séjour votée est de <strong>${fmtTarif(g.lignes[0])}</strong> du prix HT par personne et par nuit pour un meublé non classé et de <strong>${fmtTarif(l4)}</strong> par personne et par nuit en 4 étoiles.${coll} Airbnb la collecte en général pour vous ; en réservation directe, vous la collectez et la reversez. Toute la grille : ${lien(guide, `taxe de séjour ${v.a}`)}.`)
}

// Met à jour la FAQ HTML (details) et le JSON-LD (FAQPage)
function appliquer(html, kind, slug, v) {
  const remplacees = new Map() // question → nouvelle réponse HTML
  const faqA = /(<details>\s*<summary>)(.*?)(<\/summary>\s*<div class="faq-a">)([\s\S]*?)(<\/div>\s*<\/details>)/g
  html = html.replace(faqA, (all, a, q, b, rep, c) => {
    for (const [re, fn] of COURTES[kind]) {
      if (re.test(q)) { const n = fn(rep, v); remplacees.set(q, n); return a + q + b + n + c }
    }
    if (/^Quelle taxe de séjour pour un meublé non classé/.test(q)) {
      const n = taxe(slug, v)
      if (n) { remplacees.set(q, n); return a + q + b + n + c }
    }
    return all
  })
  // Question de saison (avant les questions locales)
  html = html.replace(/<!-- FAQ-SAISON:START -->[\s\S]*?<!-- FAQ-SAISON:END -->\n?/, '')
  const s = saison(kind, v)
  if (s && html.includes('<!-- LOCAL-FAQ:START -->')) {
    html = html.replace('<!-- LOCAL-FAQ:START -->', `<!-- FAQ-SAISON:START -->\n<details>\n  <summary>${s[0]}</summary>\n  <div class="faq-a">${s[1]}</div>\n</details>\n<!-- FAQ-SAISON:END -->\n<!-- LOCAL-FAQ:START -->`)
  }
  // JSON-LD
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
    let data
    try { data = JSON.parse(json) } catch { return all }
    const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data]
    const faq = nodes.find(n => n && n['@type'] === 'FAQPage' && Array.isArray(n.mainEntity))
    if (!faq) return all
    for (const e of faq.mainEntity) {
      const n = remplacees.get(e.name)
      if (n) e.acceptedAnswer = { '@type': 'Answer', text: texte(n) }
    }
    faq.mainEntity = faq.mainEntity.filter(e => !/^Quand (prévoir son shooting|réserver son équipe de ménage)/.test(e.name || ''))
    if (s) {
      const at = faq.mainEntity.findIndex(e => /^Combien de nuits peut-on louer/.test(e.name || ''))
      const q = { '@type': 'Question', name: s[0], acceptedAnswer: { '@type': 'Answer', text: texte(s[1]) } }
      if (at >= 0) faq.mainEntity.splice(at, 0, q); else faq.mainEntity.push(q)
    }
    const indent = /\n\s+"/.test(json)
    return `<script type="application/ld+json">${indent ? '\n' + JSON.stringify(data, null, 2) + '\n' : JSON.stringify(data)}</script>`
  })
  return html
}

let ecrites = 0, aJour = 0
const ecarts = [], manques = []
for (const [slug, loc] of Object.entries(VILLES_LOCAL)) {
  for (const kind of ['photographe', 'menage']) {
    const file = path.join(ROOT, `${kind}-lcd-${slug}`, 'index.html')
    if (!fs.existsSync(file)) continue
    const src = fs.readFileSync(file, 'utf8')
    const a = src.match(/<h2>Les règles et le calendrier <em>([^<]+)<\/em>/)?.[1]
    if (!a) { manques.push(`${kind}-lcd-${slug}`); continue }
    const out = appliquer(src, kind, slug, { a, ville: loc.ville, pics: loc.pics })
    if (out === src) { aJour++; continue }
    if (CHECK) { ecarts.push(`${kind}-lcd-${slug}`); continue }
    fs.writeFileSync(file, out)
    ecrites++
  }
}
if (manques.length) console.log('Ignorées :', manques.join(', '))
if (CHECK) {
  if (ecarts.length) { console.error(`FAQ à mettre à jour (${ecarts.length}) : ${ecarts.slice(0, 10).join(', ')}`); process.exit(1) }
  console.log(`FAQ des pages pros : ${aJour} pages à jour`)
} else console.log(`FAQ des pages pros : ${ecrites} pages écrites, ${aJour} déjà à jour`)
