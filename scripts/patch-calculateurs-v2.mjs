#!/usr/bin/env node
// Patch v2 : selects en vert Jason quand ouverts + checkbox custom élégante.
// Idempotent (skip si déjà patché).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const TARGETS = [
  'calculateurs/index.html',
  'calculateurs/revenus-lcd/index.html',
  'calculateurs/prix-lcd/index.html',
  'calculateurs/comparer-villes/index.html',
  'calculateurs/revenu-airbnb-paris/index.html',
]

// CSS additionnel : styles des <option> ouvertes + checkbox custom
// Note : option:hover et :checked sont supportés Firefox/Chrome récents.
// Sur Safari le hover système reste bleu (limitation OS, on ne peut pas mieux).
const PATCH_CSS = `
    /* ─── v2 : selects ouverts en vert Jason + option:hover/checked ──── */
    .field select option,.city-select option,.country-select option,#f-pays option,#f-ville option,#f-type option,#f-chambres option,#f-mode option,#f-month option{
      background-color:var(--gd);
      color:#fff;
      padding:8px 12px;
      font-weight:500;
    }
    .field select option:hover,.city-select option:hover,.country-select option:hover{background-color:var(--g)}
    .field select option:checked,.city-select option:checked,.country-select option:checked{background:linear-gradient(0deg,var(--y) 0%,var(--y) 100%);color:var(--gd);font-weight:700}
    /* Caret de select aux couleurs JM */
    .field select,.city-select,.country-select{
      appearance:none;-webkit-appearance:none;
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23004C3F' stroke-width='2.5'><polyline points='6 9 12 15 18 9'/></svg>");
      background-repeat:no-repeat;background-position:right 14px center;background-size:14px;
      padding-right:38px;
    }
    .field select:focus,.city-select:focus,.country-select:focus{
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23004C3F' stroke-width='2.5'><polyline points='18 15 12 9 6 15'/></svg>")
    }

    /* ─── Checkbox custom élégante (au lieu de la mini case OS) ────── */
    label.jm-check,.jm-check{
      display:flex !important;align-items:center;gap:10px;
      cursor:pointer;
      padding:12px 14px !important;
      border-radius:10px;
      background:linear-gradient(135deg,rgba(0,76,63,.04) 0%,rgba(255,213,107,.06) 100%);
      border:1px solid rgba(0,76,63,.18);
      transition:all .2s cubic-bezier(.4,0,.2,1);
      margin-top:4px !important;
    }
    .jm-check:hover{border-color:var(--g);background:linear-gradient(135deg,rgba(0,76,63,.08) 0%,rgba(255,213,107,.10) 100%)}
    .jm-check input[type="checkbox"]{
      appearance:none;-webkit-appearance:none;
      width:20px;height:20px;
      border-radius:6px;
      border:2px solid rgba(0,76,63,.30);
      background:#fff;
      cursor:pointer;
      flex-shrink:0;
      position:relative;
      transition:all .15s;
      margin:0;
    }
    .jm-check input[type="checkbox"]:hover{border-color:var(--g)}
    .jm-check input[type="checkbox"]:checked{
      background:var(--g);
      border-color:var(--g);
    }
    .jm-check input[type="checkbox"]:checked::after{
      content:"";
      position:absolute;
      top:3px;left:6px;
      width:5px;height:9px;
      border:solid #fff;
      border-width:0 2px 2px 0;
      transform:rotate(45deg);
    }
    .jm-check span{font-size:13.5px;color:var(--td);font-weight:500;line-height:1.4}
    .jm-check span strong{color:var(--g)}
`

// Patches à appliquer
const REPLACEMENTS = [
  // Injecter le CSS v2 avant </style> (idempotent : skip si déjà présent)
  {
    isInsertion: true,
    marker: 'v2 : selects ouverts en vert Jason',
    from: '  </style>',
    to: PATCH_CSS + '\n  </style>',
  },

  // Remplacer les <label> de checkbox par <label class="jm-check"> avec format propre
  // Pattern : label inline style display:flex avec checkbox dedans
  {
    from: /<label style="\{ \.\.\.s\.field, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' \}">/g,
    to: '<label class="jm-check">',
  },
  // Pattern HTML inline (pour pages statiques calc)
  {
    from: /<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var\(--tm\)[^"]*">\s*<input type="checkbox"/g,
    to: '<label class="jm-check"><input type="checkbox"',
  },
]

let totalChanged = 0
for (const rel of TARGETS) {
  const fpath = path.join(ROOT, rel)
  if (!fs.existsSync(fpath)) { console.log(`  ⚠ skip (missing): ${rel}`); continue }
  let content = fs.readFileSync(fpath, 'utf8')
  let changes = 0
  for (const r of REPLACEMENTS) {
    if (r.isInsertion) {
      if (content.includes(r.marker)) continue
      const before = content
      content = content.replace(r.from, r.to)
      if (content !== before) changes++
    } else {
      const before = content
      content = content.replace(r.from, r.to)
      if (content !== before) changes++
    }
  }
  if (changes > 0) {
    fs.writeFileSync(fpath, content)
    console.log(`  ✓ ${rel} (${changes} patch(es))`)
    totalChanged++
  } else {
    console.log(`  ↻ ${rel} (déjà patché)`)
  }
}
console.log(`\n${totalChanged} fichier(s) mis à jour.`)
