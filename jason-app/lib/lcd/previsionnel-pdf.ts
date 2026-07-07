// Générateur du PDF « Prévisionnel de revenus LCD » — destiné à un dossier
// de financement bancaire. Document A4 sobre, marque Jason Marinho, chiffres
// sourcés et hypothèses explicites (un banquier doit pouvoir tout tracer).
//
// Pure : prend le résultat de l'estimateur + les hypothèses saisies, rend un
// jsPDF. Aucun accès réseau/DB — testable en isolation.

import { jsPDF } from 'jspdf'
import type { EstimateRevenueResult } from './market-benchmarks'
import { DEFAULT_CHARGES, type ChargeAssumptions, type FinancingAssumptions } from './previsionnel-pdf-types'

export { DEFAULT_CHARGES }
export type { ChargeAssumptions, FinancingAssumptions }

// ── Marque ──────────────────────────────────────────────────────────────────
const GREEN: [number, number, number] = [40, 160, 99]      // #28A063 (lisible sur blanc)
const GREEN_LIGHT: [number, number, number] = [235, 248, 240]
const INK: [number, number, number] = [26, 32, 30]
const MUTED: [number, number, number] = [110, 120, 115]
const LINE: [number, number, number] = [225, 230, 227]
const YELLOW: [number, number, number] = [255, 200, 69]

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export interface PrevisionnelInput {
  result: EstimateRevenueResult
  /** Description lisible du bien */
  paysLabel: string
  typeLabel: string
  nbChambres: number
  modeLabel: string
  /** Hypothèses */
  charges: ChargeAssumptions
  financing: FinancingAssumptions
  /** Métadonnées document */
  porteurProjet?: string | null
  hoteName?: string | null
}

// Séparateur de milliers = espace normale (U+0020). On évite
// toLocaleString('fr-FR') qui produit une espace fine insécable (U+202F)
// absente de l'encodage WinAnsi de jsPDF → rendue comme un glyphe parasite.
function eur(n: number): string {
  const s = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' €'
}
function pct(n: number): string {
  return n.toFixed(1).replace('.', ',').replace(/,0$/, '') + ' %'
}

export interface PrevisionnelComputed {
  ca: number
  chargesLines: Array<{ label: string; montant: number; detail: string }>
  totalCharges: number
  resultatExploitation: number
  margeExploitationPct: number
  annuiteCredit: number | null
  cashFlow: number | null
  rentabiliteBrute: number | null
  rentabiliteNette: number | null
}

/** Calcule le prévisionnel d'exploitation à partir du CA central. */
export function computePrevisionnel(input: PrevisionnelInput): PrevisionnelComputed {
  const ca = input.result.revenuAnnuel
  const c = input.charges
  const v = (p: number) => Math.round(ca * p / 100)

  const chargesLines = [
    { label: 'Commissions plateformes', montant: v(c.commissionsPct), detail: `${pct(c.commissionsPct)} du CA` },
    { label: 'Ménage (net à charge)', montant: v(c.menagePct), detail: `${pct(c.menagePct)} du CA` },
    ...(c.gestionPct > 0 ? [{ label: 'Gestion / conciergerie', montant: v(c.gestionPct), detail: `${pct(c.gestionPct)} du CA` }] : []),
    { label: 'Assurance PNO + RC', montant: v(c.assurancePct), detail: `${pct(c.assurancePct)} du CA` },
    { label: 'Énergie, eau, internet', montant: v(c.energiePct), detail: `${pct(c.energiePct)} du CA` },
    { label: 'Entretien + petit équipement', montant: v(c.entretienPct), detail: `${pct(c.entretienPct)} du CA` },
    { label: 'Comptabilité', montant: c.comptaEur, detail: 'forfait annuel' },
    { label: 'Taxe foncière', montant: c.taxeFonciereEur, detail: 'estimation annuelle' },
    ...(c.coproEur > 0 ? [{ label: 'Charges de copropriété', montant: c.coproEur, detail: 'annuel' }] : []),
  ]
  const totalCharges = chargesLines.reduce((s, l) => s + l.montant, 0)
  const resultatExploitation = ca - totalCharges
  const margeExploitationPct = ca > 0 ? (resultatExploitation / ca) * 100 : 0

  const f = input.financing
  const annuiteCredit = f.mensualiteEur && f.mensualiteEur > 0 ? f.mensualiteEur * 12 : null
  const cashFlow = annuiteCredit != null ? resultatExploitation - annuiteCredit : null
  const rentabiliteBrute = f.prixAchatEur && f.prixAchatEur > 0 ? (ca / f.prixAchatEur) * 100 : null
  const rentabiliteNette = f.prixAchatEur && f.prixAchatEur > 0 ? (resultatExploitation / f.prixAchatEur) * 100 : null

  return {
    ca, chargesLines, totalCharges, resultatExploitation, margeExploitationPct,
    annuiteCredit, cashFlow, rentabiliteBrute, rentabiliteNette,
  }
}

/** Construit le document PDF. Retourne le jsPDF (à .save() côté appelant). */
export function buildPrevisionnelPdf(input: PrevisionnelInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16                 // marge
  const CW = W - M * 2         // largeur contenu
  const comp = computePrevisionnel(input)
  const r = input.result
  const today = new Date()
  const ref = `LCD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${r.city.slice(0, 3).toUpperCase()}`

  let y = 0

  // ── Bandeau marque ────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, W, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text('Jason Marinho', M, 12)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
  doc.text('Plateforme de gestion — Location courte durée', M, 18)
  doc.setFontSize(8)
  doc.text('jasonmarinho.com', W - M, 12, { align: 'right' })
  doc.text(`Réf. ${ref}`, W - M, 18, { align: 'right' })

  y = 38
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17)
  doc.text('Prévisionnel de revenus locatifs', M, y)
  y += 6.5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...MUTED)
  doc.text(`Location courte durée (meublé de tourisme) — ${r.city}`, M, y)
  y += 5
  doc.setFontSize(9)
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(`Établi le ${dateStr}${input.porteurProjet ? ` — Porteur du projet : ${input.porteurProjet}` : ''}`, M, y)
  y += 8

  // ── Helpers de section ────────────────────────────────────────────────────
  function sectionTitle(n: number, label: string) {
    doc.setFillColor(...GREEN_LIGHT)
    doc.rect(M, y - 4.2, CW, 7, 'F')
    doc.setTextColor(...GREEN)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(`${n}.  ${label.toUpperCase()}`, M + 2.5, y)
    y += 6.5
    doc.setTextColor(...INK)
  }
  function kvRow(label: string, value: string, opts?: { bold?: boolean; color?: [number, number, number] }) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
    doc.setTextColor(...MUTED)
    doc.text(label, M + 2, y)
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    doc.setTextColor(...(opts?.color ?? INK))
    doc.text(value, W - M - 2, y, { align: 'right' })
    y += 5.6
  }
  function divider() {
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2)
    doc.line(M + 2, y - 2.5, W - M - 2, y - 2.5)
  }

  // ── 1. Le bien analysé ────────────────────────────────────────────────────
  sectionTitle(1, 'Le bien analysé')
  kvRow('Localisation', `${r.city} (${input.paysLabel})`)
  kvRow('Typologie', `${input.typeLabel}${input.nbChambres > 0 ? ` · ${input.nbChambres} chambre${input.nbChambres > 1 ? 's' : ''}` : ''}`)
  kvRow('Mode d\'exploitation', input.modeLabel)
  if (input.financing.prixAchatEur) kvRow('Prix d\'acquisition envisagé', eur(input.financing.prixAchatEur))
  y += 2

  // ── 2. Hypothèses de marché ───────────────────────────────────────────────
  sectionTitle(2, 'Hypothèses de marché')
  kvRow('Prix moyen par nuit (ADR)', eur(r.adr))
  kvRow('Taux d\'occupation annuel', `${r.occupation} %`)
  kvRow('Nuits louées / an (estimé)', String(Math.round(365 * r.occupation / 100)))
  kvRow('RevPAR (revenu par nuit disponible)', eur(r.revpar))
  divider()
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED)
  doc.text(`Source des données marché : ${r.source}.`, M + 2, y)
  y += 7

  // ── 3. Revenus escomptés (3 scénarios) ────────────────────────────────────
  sectionTitle(3, 'Revenus annuels escomptés')
  // Tableau 3 colonnes
  const col = [M + 2, M + CW * 0.40, M + CW * 0.68, W - M - 2]
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  doc.text('Scénario', col[0], y)
  doc.text('Hypothèse', col[1], y)
  doc.text('CA annuel', col[3], y, { align: 'right' })
  y += 1.5; divider(); y += 3.5
  const scenarios: Array<[string, string, number, boolean]> = [
    ['Prudent', 'Occupation -20 %', r.revenuLow, false],
    ['Central (retenu)', 'Base marché', r.revenuAnnuel, true],
    ['Optimiste', 'Occupation +20 %', r.revenuHigh, false],
  ]
  scenarios.forEach(([name, hyp, val, hi]) => {
    doc.setFont('helvetica', hi ? 'bold' : 'normal'); doc.setFontSize(9.5)
    doc.setTextColor(...(hi ? GREEN : INK))
    doc.text(name, col[0], y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED); doc.setFontSize(9)
    doc.text(hyp, col[1], y)
    doc.setFont('helvetica', hi ? 'bold' : 'normal'); doc.setTextColor(...(hi ? GREEN : INK)); doc.setFontSize(hi ? 10.5 : 9.5)
    doc.text(eur(val), col[3], y, { align: 'right' })
    y += 6
  })
  y += 3

  // ── 4. Prévisionnel d'exploitation ────────────────────────────────────────
  sectionTitle(4, 'Prévisionnel d\'exploitation (scénario central)')
  kvRow('Chiffre d\'affaires locatif', eur(comp.ca), { bold: true })
  y += 1
  comp.chargesLines.forEach(l => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
    doc.text(`—  ${l.label}`, M + 2, y)
    doc.setFontSize(7.5)
    doc.text(`(${l.detail})`, M + 68, y)
    doc.setTextColor(...INK); doc.setFontSize(9)
    doc.text('- ' + eur(l.montant), W - M - 2, y, { align: 'right' })
    y += 5
  })
  divider()
  kvRow('Total charges d\'exploitation', '- ' + eur(comp.totalCharges))
  kvRow('Résultat d\'exploitation', eur(comp.resultatExploitation), { bold: true, color: GREEN })
  kvRow('Marge d\'exploitation', pct(comp.margeExploitationPct))

  // Cash-flow / rentabilité si financement renseigné
  if (comp.annuiteCredit != null || comp.rentabiliteBrute != null) {
    y += 2; divider()
    if (comp.annuiteCredit != null) {
      kvRow('Annuité de crédit (12 mensualités)', '- ' + eur(comp.annuiteCredit))
      kvRow('Cash-flow annuel avant impôt', eur(comp.cashFlow!), {
        bold: true, color: (comp.cashFlow ?? 0) >= 0 ? GREEN : [200, 60, 60],
      })
    }
    if (comp.rentabiliteBrute != null) {
      kvRow('Rentabilité brute', pct(comp.rentabiliteBrute))
      kvRow('Rentabilité nette (avant impôt)', pct(comp.rentabiliteNette!), { bold: true })
    }
  }

  // ── PAGE 2 ────────────────────────────────────────────────────────────────
  doc.addPage()
  y = M + 4

  // ── 5. Saisonnalité ───────────────────────────────────────────────────────
  sectionTitle(5, 'Répartition mensuelle des revenus')
  const maxM = Math.max(...r.monthly.map(m => m.revenu), 1)
  const barX = M + 42
  const barMaxW = CW - 42 - 26
  r.monthly.forEach(m => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK)
    doc.text(MONTHS[m.month - 1], M + 2, y + 1)
    const w = Math.max(1, (m.revenu / maxM) * barMaxW)
    doc.setFillColor(...(m.isHigh ? GREEN : YELLOW))
    doc.rect(barX, y - 2.6, w, 3.4, 'F')
    doc.setTextColor(...MUTED); doc.setFontSize(8.5)
    doc.text(eur(m.revenu), W - M - 2, y + 1, { align: 'right' })
    y += 6.2
  })
  y += 1; divider()
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED)
  doc.text('Barres vertes = haute saison observée. Répartition indicative pondérée par la saisonnalité locale.', M + 2, y)
  y += 9

  // ── 6. Sources & méthodologie ─────────────────────────────────────────────
  sectionTitle(6, 'Sources & méthodologie')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...INK)
  const method = [
    `• Données marché ${r.city} : ${r.source}.`,
    '• Benchmarks nationaux agrégés : DGE Mémento du Tourisme, INSEE, Observatoires Régionaux du Tourisme (CRT),',
    '  Atout France (France) ; INE & Turismo de Portugal (Portugal) ; INE (Espagne).',
    '• Revenu annuel = ADR × taux d\'occupation × 365, ajusté par typologie, nombre de chambres et mode d\'exploitation.',
    '• Charges d\'exploitation : hypothèses standard du secteur LCD, exprimées en % du chiffre d\'affaires ou en forfait',
    '  annuel, ajustables selon la situation réelle du porteur de projet.',
    '• Fourchette prudente/optimiste : ± 20 % sur le taux d\'occupation.',
  ]
  method.forEach(line => { doc.text(line, M + 2, y); y += 4.6 })
  y += 4

  // ── Avertissement ─────────────────────────────────────────────────────────
  doc.setFillColor(250, 250, 248)
  doc.setDrawColor(...LINE); doc.setLineWidth(0.2)
  const discY = y
  doc.roundedRect(M, discY, CW, 30, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...MUTED)
  doc.text('AVERTISSEMENT', M + 3, discY + 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8)
  const disc = doc.splitTextToSize(
    'Ce document est une estimation indicative établie à partir de données publiques et d\'hypothèses de marché. ' +
    'Il ne constitue ni un engagement de revenus, ni un conseil en investissement, ni un document comptable ou fiscal ' +
    'certifié. Les revenus réels dépendent de la gestion, de la qualité du bien, de la réglementation locale (changement ' +
    'd\'usage, quotas, plafonds de nuitées) et de la conjoncture. Une analyse personnalisée par un professionnel ' +
    '(expert-comptable, courtier) est recommandée avant toute décision d\'investissement ou de financement.', CW - 6)
  doc.text(disc, M + 3, discY + 10)
  y = discY + 36

  // ── Pied de page (les 2 pages) ────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2)
    doc.line(M, 287, W - M, 287)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED)
    doc.text(`Généré via jasonmarinho.com${input.hoteName ? ` — ${input.hoteName}` : ''}`, M, 291)
    doc.text(`Réf. ${ref}`, W / 2, 291, { align: 'center' })
    doc.text(`Page ${p}/${pageCount}`, W - M, 291, { align: 'right' })
  }

  return doc
}

/** Nom de fichier propre pour le téléchargement. */
export function previsionnelFileName(city: string): string {
  const slug = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  const d = new Date()
  return `previsionnel-lcd-${slug}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}.pdf`
}
