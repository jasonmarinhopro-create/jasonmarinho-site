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
    ],
    villes: ['cannes', 'rennes', 'montpellier', 'caen', 'annecy', 'la-rochelle', 'strasbourg', 'grenoble', 'metz', 'dijon',
      'clermont-ferrand', 'toulouse', 'paris', 'lyon'],
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
    ],
    villes: ['lyon', 'strasbourg', 'toulouse', 'paris', 'nice', 'avignon', 'nantes', 'nancy', 'pau', 'menton', 'annecy',
      'dijon', 'bordeaux'],
    href: s => `/photographe-lcd-${s}`,
    label: v => `Photographe Airbnb ${aVille(v)}`,
    titre: 'Un photographe ou vidéaste dans ta ville',
    texte: 'Tarifs d’une séance pour une annonce, ce qui se photographie selon la ville et pros de l’annuaire.',
    tous: ['/annuaires/photographes', 'Tous les photographes'],
    icone: 'ph-camera',
  },
  taxe: {
    articles: ['taxe-sejour-lcd-comment-collecter'],
    villes: ['strasbourg', 'arcachon', 'menton', 'chamonix', 'troyes', 'la-rochelle', 'biarritz', 'megeve', 'paris', 'lyon',
      'bordeaux', 'nice'],
    href: s => `/devenir-hote-airbnb-${s}`,
    label: v => `Taxe de séjour ${aVille(v)}`,
    titre: 'Le tarif 2026 de ta ville',
    texte: 'Chaque guide de ville donne la grille officielle 2026 (DGFiP), du meublé non classé au 5 étoiles, taxes additionnelles comprises.',
    tous: ['/services/simulateurs/taxe-de-sejour', 'Calculer la taxe d’un séjour'],
    icone: 'ph-receipt',
  },
}

function block(g) {
  const chips = g.villes.filter(s => NAMES[s] && existsSync(`${ROOT}${g.href(s).slice(1)}/index.html`))
    .map(s => `<a href="${g.href(s)}" style="display:block;padding:8px 11px;border-radius:10px;background:#fff;border:1px solid rgba(0,76,63,.16);color:#004C3F;font-size:13.5px;font-weight:500;line-height:1.35;text-decoration:none">${g.label(NAMES[s])}</a>`)
    .join('\n    ')
  return `<!-- VILLES-BLOG:START -->
<div style="margin:32px 0 8px;padding:22px clamp(18px,3vw,26px);border-radius:16px;background:#FBF8F1;border:1px solid rgba(0,76,63,.12)">
  <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:8px;display:flex;align-items:center;gap:7px"><i class="ph-bold ${g.icone}" style="font-size:15px"></i> Par ville</div>
  <p style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(18px,2.2vw,21px);line-height:1.25;color:#0F1A0D;margin:0 0 6px">${g.titre}</p>
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
console.log(`Liens par ville : ${done} articles`)
if (missing.length) console.log('Ignorés :', missing.join(', '))
