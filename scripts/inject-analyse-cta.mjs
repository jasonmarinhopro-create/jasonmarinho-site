// Encadré « Analyse ton annonce Airbnb » dans les articles et les pages de
// formation qui parlent de l'annonce Airbnb (15/11/2026, demande de Jason :
// « place ce lien dans les articles ou formations où on parle d'Airbnb »).
// Lien vers /services/analyse-annonce-airbnb (outil gratuit, sans compte).
// Idempotent : marqueurs ANALYSE:START/END. Pour un nouvel article sur
// l'annonce Airbnb, ajouter son slug à la liste et relancer :
//   node scripts/inject-analyse-cta.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const URL_OUTIL = '/services/analyse-annonce-airbnb'

const ARTICLES = [
  'optimiser-annonce-airbnb',
  'algorithme-airbnb-2026-criteres-classement',
  'airbnb-guest-favorites-2026-criteres-badge-coup-de-coeur',
  'description-airbnb-500-caracteres-convertit-2026',
  'mots-cles-titre-annonce-airbnb-eviter-spam-detection',
  'photo-couverture-airbnb-7-criteres-algo-computer-vision',
  'photos-airbnb-computer-vision-ia-optimiser',
  'photographier-logement-location-courte-duree-smartphone',
  'photographe-airbnb-tarifs-comment-choisir',
  'statistiques-annonce-airbnb-4-kpis-essentiels',
  'superhost-airbnb-criteres-methode-2026',
  'passer-4-7-a-4-9-etoiles-airbnb-methode-6-points',
  'obtenir-avis-5-etoiles-airbnb',
  'profil-hote-airbnb-bio-photo-confiance',
  'reservation-instantanee-airbnb-activer-desactiver-2026',
  'recherches-voyageurs-airbnb-tendances-emergentes-2026',
]
const FORMATIONS = ['optimiser-annonce-airbnb', 'photographie-lcd-smartphone', 'audit-annonce', 'annonce-360', 'ecrire-avis-repondre-voyageurs']

const carte = `<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;padding:26px clamp(18px,4vw,30px);border-radius:18px;background:linear-gradient(150deg,#001a11,#003329);color:#fff">
    <div style="flex:1 1 300px;min-width:0">
      <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#FFD56B;margin-bottom:8px">Outil gratuit, sans compte</div>
      <div style="font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(21px,3vw,26px);line-height:1.2;margin:0 0 8px">Et ton annonce, elle vaut combien sur 100 ?</div>
      <p style="margin:0;font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.72)">Colle le lien de ton annonce Airbnb : titre, description, photos, équipements et avis sont passés au crible, et tu repars avec ce qu'il faut corriger en premier.</p>
    </div>
    <a href="${URL_OUTIL}" style="flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:#FFD56B;color:#003329;font-weight:600;font-size:15px;text-decoration:none">Analyser mon annonce <i class="ph-bold ph-arrow-right"></i></a>
  </div>`

const BLOC_ARTICLE = `<!-- ANALYSE:START -->
<aside style="margin:36px 0 0">
  ${carte}
</aside>
<!-- ANALYSE:END -->
`
const BLOC_FORMATION = `<!-- ANALYSE:START -->
<section style="background:#FDFCF9;padding:0 clamp(16px,5vw,60px) clamp(48px,6vw,72px)">
  <div style="max-width:1100px;margin:0 auto">
  ${carte}
  </div>
</section>
<!-- ANALYSE:END -->
`
const RE = /<!-- ANALYSE:START -->[\s\S]*?<!-- ANALYSE:END -->\n?/

function poser(file, bloc, ancres) {
  if (!existsSync(file)) return 'absent'
  let html = readFileSync(file, 'utf8').replace(RE, '')
  const ancre = ancres.find(a => html.includes(a))
  if (!ancre) return 'sans emplacement'
  writeFileSync(file, html.replace(ancre, bloc + ancre))
  return 'ok'
}

let ok = 0
const rates = []
for (const slug of ARTICLES) {
  const r = poser(join(ROOT, 'blog', slug, 'index.html'), BLOC_ARTICLE, ['<!-- APPCTA:START -->', '<section class="related-sec">'])
  if (r === 'ok') ok++; else rates.push(`blog/${slug} (${r})`)
}
for (const slug of FORMATIONS) {
  const r = poser(join(ROOT, 'services/formations', slug, 'index.html'), BLOC_FORMATION, ['<!-- RELATED-FORMATIONS -->', '<section class="cta-s">'])
  if (r === 'ok') ok++; else rates.push(`formations/${slug} (${r})`)
}
console.log(`Encadré analyse d'annonce : ${ok} pages` + (rates.length ? `, non posé : ${rates.join(', ')}` : ''))
if (rates.length) process.exitCode = 1
