#!/usr/bin/env node
// Injecte le contenu local vérifié (scripts/data/villes-local.mjs) dans les
// pages menage-lcd-{slug} et photographe-lcd-{slug} : une section
// « À savoir à {Ville} » + 2 questions dans la FAQ (HTML + JSON-LD).
// Idempotent (marqueurs LOCAL:START/END et LOCAL-FAQ:START/END) : à relancer
// après scripts/build-pages-pros-villes.mjs, qui régénère ces pages sans ce
// contenu.
//
// Usage : node scripts/inject-local-villes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VILLES_LOCAL } from './data/villes-local.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const strip = s => s.replace(/<[^>]+>/g, '')

function section(v, kind) {
  const pratique = kind === 'menage' ? v.menage : v.photo
  const titrePratique = kind === 'menage' ? `Ce que ça change pour le ménage à ${v.ville}` : `Réussir ses photos à ${v.ville}`
  const li = arr => arr.map(x => `<li><i class="ph-bold ph-check-circle"></i><span>${x}</span></li>`).join('')
  const sources = v.sources.map(s => `<a href="${s.url}" target="_blank" rel="nofollow noopener">${s.label}</a>`).join(' · ')
  return `<!-- LOCAL:START -->
<section class="sec" style="border-top:1px solid var(--bd)">
  <style>
    .loc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:22px;max-width:1000px}
    .loc-card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
    .loc-card h3{font-size:15px;font-weight:600;color:var(--td);margin:0 0 10px;display:flex;align-items:center;gap:8px}
    .loc-card h3 i{color:var(--g)}
    .loc-card ul{margin:0;padding-left:18px}
    .loc-card li,.loc-card p{font-size:14px;line-height:1.65;color:var(--tm);margin:0 0 8px}
    .loc-src{font-size:12.5px!important;color:var(--tl)!important;margin-top:16px!important;line-height:1.7!important}
    .loc-src a{color:var(--tl);text-decoration:underline}
  </style>
  <div class="s-in">
    <span class="lbl dk">À savoir à ${v.ville}</span>
    <h2>Les règles et le calendrier <em>à ${v.ville}</em></h2>
    <p>Ce qu'un hôte et son prestataire doivent connaître en 2026, vérifié en ${v.verifie}.</p>
    <div class="loc-grid">
      <div class="loc-card"><h3><i class="ph-bold ph-scales"></i> Réglementation</h3><ul>${v.reglementation.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="loc-card"><h3><i class="ph-bold ph-receipt"></i> Taxe de séjour</h3><p>${v.taxe}</p></div>
      <div class="loc-card"><h3><i class="ph-bold ph-calendar-check"></i> Pics de demande</h3><ul>${v.pics.map(x => `<li>${x}</li>`).join('')}</ul></div>
    </div>
    <h3 style="font-size:17px;font-weight:600;color:var(--td);margin:30px 0 4px">${titrePratique}</h3>
    <ul class="check-list">${li(pratique)}</ul>
    <p class="loc-src">Sources : ${sources}. La réglementation évolue : vérifiez auprès de votre mairie avant de vous lancer.</p>
  </div>
</section>
<!-- LOCAL:END -->`
}

function faqItems(v) {
  return [
    [`Combien de nuits peut-on louer sa résidence principale à ${v.ville} ?`, v.faqPlafond],
    [`Quelle taxe de séjour pour un meublé non classé à ${v.ville} ?`, v.faqTaxe],
  ]
}

let count = 0
for (const [slug, v] of Object.entries(VILLES_LOCAL)) {
  for (const [kind, dir] of [['menage', 'menage-lcd'], ['photo', 'photographe-lcd']]) {
    const file = path.join(ROOT, `${dir}-${slug}`, 'index.html')
    if (!fs.existsSync(file)) { console.warn('absent :', file); continue }
    let html = fs.readFileSync(file, 'utf8')

    // 1) Section locale, après la première section de contenu
    html = html.replace(/<!-- LOCAL:START -->[\s\S]*?<!-- LOCAL:END -->\n?/, '')
    const first = html.indexOf('<section class="sec">')
    if (first === -1) throw new Error(`Aucune section dans ${file}`)
    const end = html.indexOf('</section>', first) + '</section>'.length
    html = html.slice(0, end) + '\n\n' + section(v, kind) + html.slice(end)

    // 2) FAQ HTML
    html = html.replace(/<!-- LOCAL-FAQ:START -->[\s\S]*?<!-- LOCAL-FAQ:END -->\n?/, '')
    const items = faqItems(v)
    const faqHtml = '<!-- LOCAL-FAQ:START -->\n' + items.map(([q, a]) =>
      `<details>\n  <summary>${q}</summary>\n  <div class="faq-a">${a}</div>\n</details>`).join('\n') + '\n<!-- LOCAL-FAQ:END -->\n'
    const faqOpen = html.indexOf('<div class="faq">')
    if (faqOpen === -1) throw new Error(`FAQ introuvable dans ${file}`)
    const faqClose = html.indexOf('</div>\n  </div>\n</section>', faqOpen)
    html = html.slice(0, faqClose) + faqHtml + html.slice(faqClose)

    // 3) FAQ JSON-LD
    let ldDone = false
    html = html.replace(/(<script type="application\/ld\+json">\s*)(\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?)(\s*<\/script>)/, (m, a, json, c) => {
      ldDone = true
      const data = JSON.parse(json)
      const names = new Set(items.map(([q]) => q))
      data.mainEntity = data.mainEntity.filter(q => !names.has(q.name))
      for (const [q, ans] of items) data.mainEntity.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(ans) } })
      return a + JSON.stringify(data) + c
    })
    if (!ldDone) throw new Error(`JSON-LD FAQPage introuvable dans ${file}`)

    fs.writeFileSync(file, html)
    count++
  }
}
console.log(`[inject-local-villes] ${count} pages mises à jour`)
