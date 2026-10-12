// Taxe de séjour des guides devenir-hote-airbnb-<ville> (12/10/2026).
// Constat : Google montre ces guides sur « taxe de séjour <ville> » (place 5
// à 10), mais leurs montants 2026 n'étaient pas sourcés et parfois faux
// (Strasbourg « 0,88 à 1,65 € » alors que l'Eurométropole applique 2,60 € en
// 4 étoiles). On remplace le paragraphe par des faits vérifiés : plafonds
// nationaux 2026 (barème DGCL, comme lib/lcd/taxe-sejour.ts), règle du non
// classé, faits locaux de scripts/data/villes-local.mjs quand ils existent,
// lien vers la base officielle par commune et le simulateur. Ajoute aussi
// une question à la FAQ (HTML + JSON-LD) et « taxe de séjour » dans la
// description si elle n'y est pas.
// Idempotent (marqueurs TAXE:START/END, TAXE-FAQ:START/END) :
//   node scripts/inject-taxe-villes.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { VILLES_LOCAL } from './data/villes-local.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const TARIFS_URL = 'https://entreprendre.service-public.gouv.fr/vosdroits/R46583'
const SIMULATEUR = '/services/simulateurs/taxe-de-sejour'
const VERIFIE = 'octobre 2026'

const strip = s => s.replace(/<[^>]+>/g, '')
// Espaces insécables avant € et % (« 1,70 € » ne se coupe pas en fin de ligne)
const nb = s => s.replace(/ (€|%)/g, '\u00a0$1')
const PLAFONDS = "jusqu'à <strong>1,00 €</strong> en 1 et 2 étoiles et en chambres d'hôtes, <strong>1,70 €</strong> en 3 étoiles, <strong>2,60 €</strong> en 4 étoiles et <strong>3,60 €</strong> en 5 étoiles, par personne et par nuit"
const NON_CLASSE = "Pour un meublé <strong>non classé</strong>, c'est un pourcentage voté localement, <strong>entre 1 % et 5 % du prix HT de la nuitée par personne</strong>, plafonné au tarif le plus élevé de la commune"

// Faits locaux confirmés par une source officielle (en plus de villes-local.mjs)
const EXTRA = {
  biarritz: "La grille 2025 de la ville de Biarritz ajoute aussi une taxe additionnelle régionale de 34 % (financement de la ligne à grande vitesse du Sud-Ouest) à la part départementale de 10 %.",
}

function localTaxe(slug) {
  const t = VILLES_LOCAL[slug]?.taxe
  // Texte générique de villes-local : on garde notre formulation nationale
  if (!t || /entre 1 % et 5 %.*base officielle/.test(strip(t))) return null
  return t
}

function paragraphs(slug, a, de) {
  const local = localTaxe(slug)
  const first = local
    ? `<p>${local} Pour un meublé classé, le tarif voté ${a} reste dans les plafonds nationaux 2026 : ${PLAFONDS}. Les mineurs ne la paient pas.</p>`
    : `<p>Le tarif est voté par la commune ou l'intercommunalité ${de}, dans les plafonds nationaux 2026 : ${PLAFONDS}. ${NON_CLASSE}. Une taxe additionnelle départementale de 10 % s'y ajoute le plus souvent, et les mineurs ne la paient pas.</p>`
  const extra = EXTRA[slug] ? ` ${EXTRA[slug]}` : ''
  return nb(`<!-- TAXE:START -->
${first}
  <p>${extra.trim() ? extra.trim() + ' ' : ''}Airbnb la collecte et la reverse pour vous dans la plupart des cas ; sur une autre plateforme ou en réservation directe, vérifiez qui la collecte (en direct, c'est à vous de la déclarer). Le tarif exact voté ${a} figure dans la <a href="${TARIFS_URL}" rel="noopener" target="_blank">base officielle des tarifs par commune</a>, et notre <a href="${SIMULATEUR}">simulateur de taxe de séjour</a> calcule le montant d'un séjour. <span style="font-size:.85em;opacity:.75">Vérifié en ${VERIFIE}.</span></p>
<!-- TAXE:END -->`)
}

function faqAnswer(slug, a, de) {
  const local = localTaxe(slug)
  const base = local
    ? `${strip(local)} Pour un meublé classé, le tarif reste dans les plafonds nationaux 2026 : jusqu'à 1,00 € (1 et 2 étoiles, chambres d'hôtes), 1,70 € (3 étoiles), 2,60 € (4 étoiles) et 3,60 € (5 étoiles) par personne et par nuit.`
    : `Le tarif est voté par la commune ou l'intercommunalité ${de}. En 2026, il ne peut pas dépasser 1,00 € (1 et 2 étoiles, chambres d'hôtes), 1,70 € (3 étoiles), 2,60 € (4 étoiles) et 3,60 € (5 étoiles) par personne et par nuit. Pour un meublé non classé, c'est 1 % à 5 % du prix HT de la nuitée par personne, plafonné au tarif le plus élevé de la commune, plus le plus souvent 10 % de taxe départementale.`
  return nb(`${base}${EXTRA[slug] ? ' ' + EXTRA[slug] : ''} Les mineurs sont exonérés. Le tarif exact ${a} est dans la base officielle des tarifs par commune (service-public.gouv.fr).`)
}

let done = 0
const skipped = []
for (const dir of readdirSync(ROOT).filter(d => d.startsWith('devenir-hote-airbnb-'))) {
  const file = join(ROOT, dir, 'index.html')
  if (!existsSync(file)) continue
  const slug = dir.replace('devenir-hote-airbnb-', '')
  let html = readFileSync(file, 'utf8')
  const m = html.match(/<em>LCD (à|au|aux|en) ([^<]+)<\/em>/)
  if (!m) { skipped.push(`${slug} (ville)`); continue }
  const [, prep, ville] = m
  const a = `${prep} ${ville}`
  const de = prep === 'au' ? `du ${ville}` : prep === 'aux' ? `des ${ville}` : /^[AEIOUYÉÈÂÎH]/i.test(ville) ? `d'${ville}` : `de ${ville}`

  // 1. Paragraphe de la section « Taxe de séjour »
  if (html.includes('<!-- TAXE:START -->')) {
    html = html.replace(/<!-- TAXE:START -->[\s\S]*?<!-- TAXE:END -->/, paragraphs(slug, a, de))
  } else {
    const h = html.search(/<h3[^>]*>(?:(?!<\/h3>)[\s\S])*Taxe de séjour(?:(?!<\/h3>)[\s\S])*<\/h3>/i)
    if (h < 0) { skipped.push(`${slug} (section)`); continue }
    const pStart = html.indexOf('<p>', h)
    const pEnd = html.indexOf('</p>', pStart)
    if (pStart < 0 || pEnd < 0 || pStart - h > 400) { skipped.push(`${slug} (paragraphe)`); continue }
    html = html.slice(0, pStart) + paragraphs(slug, a, de) + html.slice(pEnd + 4)
  }

  // 2. Question de FAQ (HTML)
  const q = `Combien coûte la taxe de séjour ${a} en 2026 ?`
  const ans = faqAnswer(slug, a, de)
  html = html.replace(/\s*<!-- TAXE-FAQ:START -->[\s\S]*?<!-- TAXE-FAQ:END -->/, '')
  const fancy = html.indexOf('<details class="faq-i">')
  const plain = html.search(/<details>\s*<summary>/)
  let block, at
  if (fancy >= 0) {
    at = fancy
    block = `<!-- TAXE-FAQ:START --><details class="faq-i">
      <summary class="faq-q">${q} <i class="ph ph-caret-down"></i></summary>
      <div class="faq-a">${ans}</div>
    </details><!-- TAXE-FAQ:END -->
    `
  } else if (plain >= 0) {
    at = plain
    block = `<!-- TAXE-FAQ:START --><details>
      <summary>${q}</summary>
      <div class="faq-body">${ans}</div>
    </details><!-- TAXE-FAQ:END -->
    `
  }
  if (at !== undefined) html = html.slice(0, at) + block + html.slice(at)
  else skipped.push(`${slug} (faq html)`)

  // 3. Question de FAQ (JSON-LD), en tête de la liste
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
    let data
    try { data = JSON.parse(json) } catch { return all }
    const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data]
    const faq = nodes.find(n => n && n['@type'] === 'FAQPage' && Array.isArray(n.mainEntity))
    if (!faq) return all
    faq.mainEntity = faq.mainEntity.filter(e => !/^Combien coûte la taxe de séjour/.test(e.name || ''))
    faq.mainEntity.unshift({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })
    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`
  })

  // 4. Description : « taxe de séjour » si absente
  html = html.replace(/(<meta name="description" content=")([^"]*)(")/, (all, s, d, e) =>
    /taxe de séjour/i.test(d) ? all : s + d.replace(/fiscalité/, 'taxe de séjour, fiscalité') + e)

  writeFileSync(file, html)
  done++
}
console.log(`Taxe de séjour : ${done} guides`)
if (skipped.length) console.log('Ignorés :', skipped.join(', '))
