// Injecte l'exemple de « Mes statistiques » (scripts/lib/stats-demo.mjs) dans
// les pages de recrutement des pros (les fiches d'exemple l'ont par
// build-exemples-fiches.mjs). Idempotent :
// marqueurs <!-- STATSDEMO:START --> / <!-- STATSDEMO:END -->.
// Usage : node scripts/inject-stats-demo.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { statsDemoHtml } from './lib/stats-demo.mjs'

const START = '<!-- STATSDEMO:START -->'
const END = '<!-- STATSDEMO:END -->'

const TARGETS = [
  { file: 'devenir-photographe-lcd/index.html', metier: 'photographe', before: '<!-- FONDATEUR PRICING -->', cta: { href: '/annuaires/photographes/inscription', label: 'Créer ma fiche photographe' } },
  { file: 'devenir-prestataire-menage-lcd/index.html', metier: 'menage', before: '<!-- FONDATEUR PRICING -->', cta: { href: '/annuaires/menage/inscription', label: 'Créer ma fiche équipe ménage' } },
  // Fiches d'exemple : générées avec l'exemple par build-exemples-fiches.mjs
]

for (const t of TARGETS) {
  let s = readFileSync(t.file, 'utf8')
  const block = `${START}
<section id="exemple-stats" style="background:#fff;padding:clamp(48px,7vw,80px) 0;scroll-margin-top:72px">
${statsDemoHtml(t.metier, { cta: t.cta })}
</section>
${END}
`
  const a = s.indexOf(START)
  if (a >= 0) {
    const b = s.indexOf(END, a)
    s = s.slice(0, a) + block.trimEnd() + s.slice(b + END.length)
  } else {
    const i = s.indexOf(t.before)
    if (i < 0) throw new Error(`Point d'insertion introuvable dans ${t.file}`)
    s = s.slice(0, i) + block + '\n' + s.slice(i)
  }
  writeFileSync(t.file, s)
  console.log('ok', t.file)
}
