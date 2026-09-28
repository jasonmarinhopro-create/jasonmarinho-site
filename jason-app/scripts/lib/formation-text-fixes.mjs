// Correctifs de texte des leçons, utilisés par scripts/fix-formations-db.mjs.

// ─── Fiscalité 2026 (vérifié sept. 2026, cf. lib/lcd/fiscal-params.ts) ───
// Micro-BIC : non classé 30 % / 15 000 € ; classé et chambres d'hôtes 50 % /
// 83 600 € sur les revenus 2026 (77 700 € sur 2025). Prélèvements sociaux
// LMNP 18,6 % depuis les revenus 2025. Les tableaux « avant la loi Le Meur »
// (50 % / 77 700 € non classé, 71 % / 188 700 € classé) sont historiques et
// restent tels quels.
export const PROTECT = [
  /\|\s*Meublé non classé\s*\|\s*50\s?%\s*\|\s*77 ?700 ?€(\/an)?\s*\|/g, // ligne du tableau « avant »
  /passe de 77 ?700 ?€ à 15 ?000 ?€/g, // non classé : ancien plafond → nouveau (historique)
  /[Aa]vant la loi Le Meur[^\n]*/g, // phrases qui décrivent l'ancien régime
]

export function fiscalFix(text) {
  let out = text
  const kept = []
  for (const rx of PROTECT) {
    out = out.replace(rx, m => { kept.push(m); return `\u0000${kept.length - 1}\u0000` })
  }
  const rules = [
    // Chambres d'hôtes à 71 % après la loi Le Meur → 50 % (Conseil d'État, 16/09/2025)
    [/(Chambres? d['’]hôtes[^|\n]*\|\s*)71\s?%(\s*\|\s*)77 ?700 ?€/g, '$150%$283 600€'],
    // Prélèvements sociaux LMNP
    [/Prélèvements sociaux à 17,2\s?% : \*\*430 ?€\*\*/g, 'Prélèvements sociaux à 18,6% : **465€**'],
    [/\*\*Total : environ 1 180 ?€\/an\*\*/g, '**Total : environ 1 215€/an**'],
    [/Régime réel : \*\*1 180 ?€ d'impôts\*\*/g, "Régime réel : **1 215€ d'impôts**"],
    [/Économie : \*\*1 520 ?€\/an\*\*/g, 'Économie : **1 485€/an**'],
    [/17,2\s?% = 1 720 ?€/g, '18,6% = 1 860€'],
    // 3 000 € d'impôt + 1 720 € de prélèvements (17,2 %) → + 1 860 € (18,6 %)
    [/\*\*Total : environ 4 720 ?€ par an\*\*/g, '**Total : environ 4 860€ par an**'],
    // Prélèvements sociaux LMNP : 18,6 % depuis les revenus 2025 (LFSS 2026, art. 12)
    [/17,2\s?%/g, m => m.replace('17,2', '18,6')],
    // Plafond micro 77 700 € → 83 600 € (revenus 2026)
    [/77 ?700 ?€/g, '83 600€'],
  ]
  for (const [rx, rep] of rules) out = out.replace(rx, rep)
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)])
  return out
}

// ─── Tiret cadratin (règle de rédaction du site : jamais de « — ») ───
export function dashFix(text, { isTitle = false } = {}) {
  return text
    .split('\n')
    .map(line => {
      if (!line.includes('—')) return line
      const heading = isTitle || /^\s*#/.test(line)
      return line
        .replace(/\s+—\s+/g, heading ? (isTitle ? ', ' : ' : ') : ', ')
        .replace(/^(\s*)—\s*/, '$1')
        .replace(/—/g, '-')
    })
    .join('\n')
}

