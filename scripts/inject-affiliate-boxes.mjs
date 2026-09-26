#!/usr/bin/env node
// Encadrés affiliés/parrainage (Hospitable, Shine) injectés dans les pages
// qui parlent déjà de l'outil. Idempotent : chaque encadré est entouré de
// marqueurs <!-- AFF:<id>:START/END --> et remplacé à chaque passage. À
// relancer après régénération d'un article (scripts/generate-article.mjs).
//
// Règles (cf. CLAUDE.md, Liens affiliés) : rel="sponsored noopener" sur
// chaque lien + mention visible. Le suivi des clics (nav.js) est automatique
// sur tout lien rel="sponsored".
//
// Usage : node scripts/inject-affiliate-boxes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const HOSPITABLE_BLOG = 'https://hospitable.com/partners/refer?utm_source=affiliates&utm_medium=blog&utm_campaign=BASWTYN7'
const SHINE = 'https://app.shine.fr/register?referral=WYDP4644'

const btn = (href, label) => `<a href="${href}" target="_blank" rel="sponsored noopener" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:10px 16px;border-radius:9px;text-decoration:none;background:#004c3f;color:#fff">${label}</a>`
const box = (id, intro, button, mention) => `<!-- AFF:${id}:START -->
<div class="aff-${id.split('-')[0]}" style="margin:18px 0 22px;padding:16px 18px;border:1px solid rgba(0,76,63,.18);border-radius:12px;background:rgba(0,76,63,.04)">
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#111827">${intro}</p>
<div style="display:flex;flex-wrap:wrap;gap:8px">${button}</div>
<p style="margin:10px 0 0;font-size:12.5px;line-height:1.5;color:#6B7280">${mention}</p>
</div>
<!-- AFF:${id}:END -->
`

const hospitableTu = box('hospitable-tu',
  "<strong>Tester Hospitable :</strong> essai gratuit de 14 jours sans carte bancaire, puis <strong>25 % de réduction sur tes 3 premiers mois</strong> en passant par ce lien.",
  btn(HOSPITABLE_BLOG, 'Essayer Hospitable gratuitement'),
  "Lien affilié : si tu t'abonnes via ce lien, je touche une commission, sans aucun surcoût pour toi (tu profites au contraire de la réduction). Mon avis reste indépendant.")

const hospitableVous = box('hospitable-vous',
  "<strong>Tester Hospitable :</strong> essai gratuit de 14 jours sans carte bancaire, puis <strong>25 % de réduction sur vos 3 premiers mois</strong> en passant par ce lien.",
  btn(HOSPITABLE_BLOG, 'Essayer Hospitable gratuitement'),
  "Lien affilié : si vous vous abonnez via ce lien, je perçois une commission, sans aucun surcoût pour vous (vous profitez au contraire de la réduction). Mon avis reste indépendant.")

const shineTu = box('shine-tu',
  "<strong>Ouvrir un compte Shine :</strong> néobanque pro française, ouverture en ligne. Avec mon lien de parrainage, tu as un mois d'abonnement offert en plus de l'essai (selon les conditions de parrainage en vigueur chez Shine).",
  btn(SHINE, 'Ouvrir mon compte Shine'),
  "Lien de parrainage : si tu ouvres un compte via ce lien, je touche une prime de parrainage, sans aucun surcoût pour toi. Je ne recommande Shine que comme une option parmi d'autres (Qonto, Blank, Finom) : compare selon tes besoins.")

// [fichier, id, texte avant lequel insérer l'encadré, contenu]
const PLACEMENTS = [
  ['comparatif-smoobu-hospitable/index.html', 'hospitable-vous', '</section>\n\n<section id="verdict">', hospitableVous],
  ['blog/messagerie-unifiee-3-plateformes-tester/index.html', 'hospitable-tu', '<h2 class="art-h2">2. Smoobu : l\'option européenne complète</h2>', hospitableTu],
  ['blog/logiciels-conciergerie-comparatif-2026/index.html', 'hospitable-tu', '<h2 class="art-h2">2. Smoobu : l\'option européenne tout-en-un</h2>', hospitableTu],
  ['blog/hospitable-tarification-dynamique-incluse-pms-fin-outils-seuls/index.html', 'hospitable-tu', '<h2 class="art-h2">4. L\'automatisation au-delà du pricing', hospitableTu],
  ['blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026/index.html', 'shine-tu', '<ul class="art-ul"><li>Ouverture 100 % en ligne recommandée', shineTu],
]

let n = 0
for (const [rel, id, anchor, html] of PLACEMENTS) {
  const file = path.join(ROOT, rel)
  let src = fs.readFileSync(file, 'utf8')
  src = src.replace(new RegExp(`<!-- AFF:${id}:START -->[\\s\\S]*?<!-- AFF:${id}:END -->\\n?`), '')
  const i = src.indexOf(anchor)
  if (i === -1) throw new Error(`Ancre introuvable dans ${rel} : ${anchor}`)
  src = src.slice(0, i) + html + src.slice(i)
  fs.writeFileSync(file, src)
  n++
}
console.log(`[inject-affiliate-boxes] ${n} encadrés injectés`)
