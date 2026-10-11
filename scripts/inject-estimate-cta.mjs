// Encadré « Combien peut rapporter ton logement à <ville> ? » en fin des guides
// devenir-hote-airbnb-<ville> (11/10/2026, audit de Jason : ces pages sont les
// premières portes d'entrée du site, 287 visites sur 30 jours, mais ne menaient
// qu'à un bouton générique). Lien vers l'estimateur de la ville (page dédiée
// /calculateurs/revenu-lcd-<ville> si elle existe, sinon l'estimateur général
// avec ?ville=), puis vers le compte gratuit.
// Idempotent : marqueurs ESTIMATE:START/END, relancer après une régénération.
//   node scripts/inject-estimate-cta.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const REGISTER = 'https://app.jasonmarinho.com/auth/register'

function estimatorUrl(slug, ville) {
  if (slug === 'paris' && existsSync(join(ROOT, 'calculateurs/revenu-airbnb-paris'))) return '/calculateurs/revenu-airbnb-paris'
  if (existsSync(join(ROOT, `calculateurs/revenu-lcd-${slug}`))) return `/calculateurs/revenu-lcd-${slug}`
  return `/calculateurs/revenus-lcd?ville=${encodeURIComponent(ville)}`
}

function block(slug, prep, ville) {
  // « au Mans » → Le Mans, « aux Sables » → Les Sables pour la recherche de l'estimateur
  const fullName = prep === 'au' ? `Le ${ville}` : prep === 'aux' ? `Les ${ville}` : ville
  const href = estimatorUrl(slug, fullName)
  return `<!-- ESTIMATE:START -->
<section style="margin:40px 0 0;padding:28px clamp(18px,4vw,32px);border-radius:18px;background:#F2F8F4;border:1px solid rgba(0,76,63,.14)">
  <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
    <div style="flex:1 1 320px;min-width:0">
      <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:8px"><i class="ph-bold ph-calculator"></i> Estimation gratuite</div>
      <h2 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(22px,3vw,28px);line-height:1.2;color:#0F1A0D;margin:0 0 8px">Combien peut rapporter ton logement ${prep} ${ville} ?</h2>
      <p style="margin:0;font-size:14.5px;line-height:1.65;color:#3D5038">Occupation, prix moyen par nuit et revenu annuel ${prep} ${ville}, mois par mois, en 30 secondes. Ensuite, garde ton estimation et prépare ton prévisionnel dans ton compte gratuit.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;flex:1 1 220px;max-width:340px;min-width:0">
      <a href="${href}" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border-radius:10px;background:#004C3F;color:#fff;font-weight:600;font-size:15px;text-decoration:none">Estimer mes revenus <i class="ph-bold ph-arrow-right"></i></a>
      <a href="${REGISTER}" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:10px;border:1px solid rgba(0,76,63,.25);color:#004C3F;font-weight:600;font-size:14px;text-decoration:none">Créer mon compte gratuit</a>
    </div>
  </div>
</section>
<!-- ESTIMATE:END -->
`
}

let done = 0, skipped = 0
for (const dir of readdirSync(ROOT).filter(d => d.startsWith('devenir-hote-airbnb-'))) {
  const file = join(ROOT, dir, 'index.html')
  if (!existsSync(file)) continue
  let html = readFileSync(file, 'utf8')
  const slug = dir.replace('devenir-hote-airbnb-', '')
  // « Démarre ton activité <em>LCD à Lyon</em> » : préposition et nom de la ville
  const m = html.match(/<em>LCD (à|au|aux|en) ([^<]+)<\/em>/)
  if (!m) { skipped++; console.warn('ville introuvable :', dir); continue }
  const [, prep, ville] = m
  html = html.replace(/<!-- ESTIMATE:START -->[\s\S]*?<!-- ESTIMATE:END -->\n?/, '')
  const anchor = html.indexOf('<!-- PROS_VILLE_LINKS_START -->') >= 0 ? '<!-- PROS_VILLE_LINKS_START -->' : '<aside class="cta-banner">'
  if (html.indexOf(anchor) < 0) { skipped++; console.warn('emplacement introuvable :', dir); continue }
  html = html.replace(anchor, block(slug, prep, ville) + anchor)
  writeFileSync(file, html)
  done++
}
console.log(`Encadré estimation : ${done} guides, ${skipped} ignorés`)
