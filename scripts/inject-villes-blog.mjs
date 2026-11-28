// Liens du blog vers les pages de ville (17/10/2026, Jason : « pousser les
// pages de ville qui sont presque en première page »). Relevé Search Console
// du 17/10/2026 (workflow « Chiffres d'usage », annotations « Villes
// proches ») : les pages ménage, photographe et les guides hôtes sortent en
// place 4 à 20 sur « ménage airbnb <ville> », « photographe airbnb <ville> »,
// « taxe de séjour <ville> », mais presque aucun article ne pointe vers elles.
// Un encadré « Par ville » dans les articles du même sujet, avec l'ancre de la
// recherche visée. Villes proches de la première page en tête, puis les plus
// grosses. Idempotent (marqueurs VILLES-BLOG:START/END, avant l'encadré de
// l'app) :
//   node scripts/inject-villes-blog.mjs
//
// Mise à jour du 19/11/2026 (audit SEO, lot D, validé par Jason) : listes de
// villes refaites d'après la Search Console du 20/10 au 16/11/2026 (pages de
// ville en place 10 ou mieux, les plus vues d'abord), encadré ajouté aux
// autres articles du même sujet, et liens dans le texte (LIENS_TEXTE) quand un
// article parle vraiment d'une ville (marchés de Noël, règles locales,
// exemples de marché) : première mention de la ville, dans un paragraphe ou
// une liste, jamais dans un titre ni un lien existant. Les liens posés portent
// data-vl et sont retirés puis reposés à chaque passage.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { aVille } from './data/villes-local.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const footer = readFileSync(new URL('../footer.js', import.meta.url), 'utf8')
const NAMES = Object.fromEntries([...footer.matchAll(/slug: '([^']+)',\s*name: '([^']+)'/g)].map(m => [m[1], m[2]]))
NAMES['les-sables-d-olonne'] ??= "Les Sables-d'Olonne"

const GROUPS = {
  menage: {
    articles: [
      'checklist-menage-professionnelle-location-courte-duree', 'devenir-prestataire-menage-airbnb-se-lancer',
      'equipe-menage-conciergerie-recruter-fideliser', 'frais-menage-airbnb-combien-facturer-2026',
      'trouver-equipe-menage-airbnb-fiable', 'turnover-j0-lcd-7-regles-enchainer-checkout-checkin-meme-jour',
      'communiquer-equipe-menage-lcd-6-regles-turnover-fluide', 'devis-menage-lcd-6-regles-transformer-demande-hote-client-recurrent',
      'linge-de-maison-lcd-7-regles-draps-impeccables-budget', 'prestataire-menage-lcd-basse-saison-garder-hotes-revenu-stable',
    ],
    villes: ['cannes', 'annecy', 'rennes', 'clermont-ferrand', 'carcassonne', 'megeve', 'lyon', 'avignon', 'versailles', 'brest',
      'paris', 'troyes'],
    href: s => `/menage-lcd-${s}`,
    label: v => `Ménage Airbnb ${aVille(v)}`,
    titre: 'Une équipe de ménage dans ta ville',
    texte: 'Tarifs d’un ménage de location courte durée, règles locales et équipes de l’annuaire, ville par ville.',
    tous: ['/annuaires/menage', 'Toutes les équipes de ménage'],
    icone: 'ph-broom',
  },
  photo: {
    articles: [
      'photographe-airbnb-tarifs-comment-choisir', 'photographier-logement-location-courte-duree-smartphone',
      'photo-couverture-airbnb-7-criteres-algo-computer-vision', 'photos-airbnb-computer-vision-ia-optimiser',
      'photos-avant-apres-home-staging-lcd', 'photos-nocturne-crepuscule-lcd-airbnb-differenciation',
      'eclairage-lcd-7-regles-confort-photos-avis',
      'photographe-hotel-conciergerie-7-points-avant-shooting', 'preparer-logement-shooting-photo-lcd-7-etapes',
      'videaste-lcd-6-regles-vendre-visite-video-hotes-airbnb', 'video-annonce-airbnb-6-regles-tour-video-conversion-2026',
    ],
    villes: ['lyon', 'toulouse', 'strasbourg', 'nice', 'nantes', 'carcassonne', 'sarlat', 'montpellier', 'lille', 'epernay',
      'bordeaux', 'grenoble'],
    href: s => `/photographe-lcd-${s}`,
    label: v => `Photographe Airbnb ${aVille(v)}`,
    titre: 'Un photographe ou vidéaste dans ta ville',
    texte: 'Tarifs d’une séance pour une annonce, ce qui se photographie selon la ville et pros de l’annuaire.',
    tous: ['/annuaires/photographes', 'Tous les photographes'],
    icone: 'ph-camera',
  },
  taxe: {
    // Articles où le tarif local compte : taxe, classement (le tarif dépend des
    // étoiles), déclaration et fiscalité de l'hôte
    articles: ['taxe-sejour-lcd-comment-collecter', 'classement-meuble-tourisme-lcd-6-etapes-obtenir-abattement-2027',
      'erp-classement-meuble-tourisme-lcd', 'guide-fiscal-debutant-hote-airbnb-2026', 'location-courte-duree-impots-france',
      'declarer-activite-location-courte-duree-france-demarches', 'micro-bic-abattement-2026-airbnb'],
    villes: ['arcachon', 'strasbourg', 'la-rochelle', 'colmar', 'menton', 'avignon', 'deauville', 'megeve', 'chamonix', 'rennes',
      'reims', 'rouen'],
    href: s => `/devenir-hote-airbnb-${s}`,
    label: v => `Taxe de séjour ${aVille(v)}`,
    titre: 'Le tarif 2026 de ta ville',
    texte: 'Chaque guide de ville donne la grille officielle 2026 (DGFiP), du meublé non classé au 5 étoiles : le tarif voté, celui de taxesejour.impots.gouv.fr, et le montant à collecter, taxes additionnelles comprises.',
    tous: ['/services/simulateurs/taxe-de-sejour', 'Calculer la taxe d’un séjour'],
    icone: 'ph-receipt',
  },
}

// Liens dans le texte : article → page visée pour chaque ville citée
const guide = s => `/devenir-hote-airbnb-${s}`
const LIENS_TEXTE = {
  'marches-de-noel-2026-lcd-6-regles-capter-voyageurs-illuminations': guide,
  'saisonnalite-tarif-region-france-lcd-2026': guide,
  'declarer-activite-location-courte-duree-france-demarches': guide,
  'numero-enregistrement-lcd-obtenir-etapes-pratiques': guide,
  'reglementation-lcd-france-2026': guide,
  'acheter-appartement-lcd-7-criteres-rentabilite-avant-signer': guide,
  'photographe-airbnb-tarifs-comment-choisir': s => `/photographe-lcd-${s}`,
  'trouver-equipe-menage-airbnb-fiable': s => `/menage-lcd-${s}`,
  'devenir-prestataire-menage-airbnb-se-lancer': s => `/menage-lcd-${s}`,
}
const LIEN_STYLE = 'color:var(--g);font-weight:500'
const echap = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Pose un lien sur la première mention de chaque ville, dans le corps de
// l'article (paragraphes et listes), hors titres, liens et blocs injectés
export function lierVilles(html, cible) {
  html = html.replace(/<a href="[^"]*" style="[^"]*" data-vl="1">([^<]*)<\/a>/g, '$1')
  const debut = html.indexOf('<div class="art-body">')
  if (debut < 0) return { html, n: 0 }
  const fins = ['<!-- VILLES-BLOG:START -->', '<!-- APPCTA:START -->'].map(m => html.indexOf(m, debut)).filter(i => i > 0)
  const fin = fins.length ? Math.min(...fins) : html.length
  const morceaux = html.slice(debut, fin).split(/(<[^>]+>)/)
  const faits = new Set()
  let interdit = 0, dansTexte = 0, bloc = 0, n = 0
  for (let i = 0; i < morceaux.length; i++) {
    const m = morceaux[i]
    if (m.startsWith('<!--')) { if (/:START -->$/.test(m)) bloc++; else if (/:END -->$/.test(m)) bloc--; continue }
    if (m.startsWith('<')) {
      const tag = m.match(/^<\/?([a-z0-9]+)/i)?.[1]?.toLowerCase()
      const ferme = m.startsWith('</')
      if (['a', 'h1', 'h2', 'h3', 'h4', 'script', 'style', 'figure', 'button', 'summary', 'strong'].includes(tag)) interdit += ferme ? -1 : 1
      if (['p', 'li'].includes(tag)) dansTexte += ferme ? -1 : 1
      continue
    }
    if (interdit > 0 || bloc > 0 || dansTexte <= 0 || !m.trim()) continue
    let t = m
    for (const [slug, nom] of Object.entries(NAMES)) {
      if (faits.has(slug)) continue
      const href = cible(slug)
      if (!existsSync(`${ROOT}${href.slice(1)}/index.html`)) continue
      const re = new RegExp(`(^|[^\\p{L}-])(${echap(nom)})(?![\\p{L}-])`, 'u')
      if (!re.test(t)) continue
      t = t.replace(re, `$1<a href="${href}" style="${LIEN_STYLE}" data-vl="1">$2</a>`)
      faits.add(slug)
      n++
    }
    morceaux[i] = t
  }
  return { html: html.slice(0, debut) + morceaux.join('') + html.slice(fin), n }
}

function block(g) {
  const chips = g.villes.filter(s => NAMES[s] && existsSync(`${ROOT}${g.href(s).slice(1)}/index.html`))
    .map(s => `<a href="${g.href(s)}" style="display:block;padding:8px 11px;border-radius:10px;background:#fff;border:1px solid rgba(0,76,63,.16);color:#004C3F;font-size:13.5px;font-weight:500;line-height:1.35;text-decoration:none">${g.label(NAMES[s])}</a>`)
    .join('\n    ')
  return `<!-- VILLES-BLOG:START -->
<div style="margin:32px 0 8px;padding:22px clamp(18px,3vw,26px);border-radius:16px;background:#FBF8F1;border:1px solid rgba(0,76,63,.12)">
  <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:8px;display:flex;align-items:center;gap:7px"><i class="ph-bold ${g.icone}" style="font-size:15px"></i> Par ville</div>
  <p style="font-family:'Fraunces','Fraunces Fallback',serif;font-weight:500;font-size:clamp(18px,2.2vw,21px);line-height:1.25;color:#0F1A0D;margin:0 0 6px">${g.titre}</p>
  <p style="font-size:14.5px;line-height:1.6;color:#3D5038;margin:0 0 14px">${g.texte}</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
    ${chips}
  </div>
  <p style="margin:14px 0 0;font-size:14px"><a href="${g.tous[0]}" style="color:#004C3F;font-weight:600">${g.tous[1]} →</a></p>
</div>
<!-- VILLES-BLOG:END -->`
}

let done = 0
const missing = []
for (const g of Object.values(GROUPS)) {
  const html0 = block(g)
  for (const slug of g.articles) {
    const file = `${ROOT}blog/${slug}/index.html`
    if (!existsSync(file)) { missing.push(slug); continue }
    let html = readFileSync(file, 'utf8').replace(/\n?<!-- VILLES-BLOG:START -->[\s\S]*?<!-- VILLES-BLOG:END -->\n?/, '\n')
    const at = html.indexOf('<!-- APPCTA:START -->')
    if (at < 0) { missing.push(`${slug} (encadré de l'app)`); continue }
    html = html.slice(0, at) + html0 + '\n' + html.slice(at)
    writeFileSync(file, html)
    done++
  }
}
let liens = 0
for (const [slug, cible] of Object.entries(LIENS_TEXTE)) {
  const file = `${ROOT}blog/${slug}/index.html`
  if (!existsSync(file)) { missing.push(slug); continue }
  const src = readFileSync(file, 'utf8')
  const { html, n } = lierVilles(src, cible)
  if (!n) missing.push(`${slug} (aucune ville dans le texte)`)
  liens += n
  if (html !== src) writeFileSync(file, html)
}
console.log(`Liens par ville : ${done} articles avec l'encadré, ${liens} liens dans le texte de ${Object.keys(LIENS_TEXTE).length} articles`)
if (missing.length) console.log('Ignorés :', missing.join(', '))
