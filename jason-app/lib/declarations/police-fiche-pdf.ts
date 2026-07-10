// Générateur PDF « Fiche individuelle de police » (France) — arrêté du
// 1er octobre 2015, art. R.813-2 CESEDA. Obligatoire pour tout voyageur
// étranger ; à conserver 6 mois par l'hébergeur et à transmettre à la
// police sur réquisition. Il n'existe PAS de télé-service national : le
// PDF pré-rempli (et signé via le check-in en ligne) EST la conformité.
//
// Pure : prend les données, rend un jsPDF. Aucun accès réseau/DB.

import { jsPDF } from 'jspdf'

const GREEN: [number, number, number] = [0, 76, 63]        // #004C3F — vert forêt marque
const INK: [number, number, number] = [26, 32, 30]
const MUTED: [number, number, number] = [110, 120, 115]
const LINE: [number, number, number] = [223, 228, 225]

export interface PoliceFicheInput {
  voyageur: {
    prenom: string
    nom: string
    dateNaissance: string | null      // yyyy-mm-dd
    lieuNaissance: string | null
    nationalite: string | null        // libellé lisible (pas le code ISO)
    adresse: string | null            // domicile habituel (rue)
    codePostal: string | null
    ville: string | null
    pays: string | null               // libellé lisible
    telephone: string | null
    email: string | null
  }
  sejour: {
    dateArrivee: string               // yyyy-mm-dd
    dateDepart: string | null         // yyyy-mm-dd
  }
  logement: {
    nom: string
    adresse: string | null
  }
  hoteName: string | null
  /** Signature électronique du check-in (data URL PNG) — sinon case vide à signer à l'arrivée */
  signatureDataUrl: string | null
  signedAt: string | null             // ISO — horodatage du check-in
}

function fmtDay(d: string | null): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return y && m && day ? `${day}/${m}/${y}` : d
}

export function buildPoliceFichePdf(input: PoliceFicheInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 20
  let y = 24

  // ── En-tête officiel ──────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...INK)
  doc.text('FICHE INDIVIDUELLE DE POLICE', W / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('Arrêté du 1er octobre 2015 — article R.813-2 du CESEDA', W / 2, y, { align: 'center' })
  y += 4.5
  doc.text('À remplir par les étrangers hébergés dans un meublé de tourisme / hébergement touristique', W / 2, y, { align: 'center' })
  y += 8

  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.8)
  doc.line(M, y, W - M, y)
  y += 10

  // ── Champ ligne : libellé + valeur soulignée ──────────────────────────
  function field(label: string, value: string | null | undefined, opts?: { half?: 'left' | 'right' }) {
    const x = opts?.half === 'right' ? W / 2 + 4 : M
    const width = opts?.half ? (W - 2 * M - 8) / 2 : W - 2 * M
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    const v = (value ?? '').trim()
    doc.text(v || ' ', x, y + 5.5)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(x, y + 7.5, x + width, y + 7.5)
    if (!opts?.half || opts.half === 'right') y += 14
  }

  const v = input.voyageur
  field('Nom', v.nom.toUpperCase(), { half: 'left' })
  field('Prénom(s)', v.prenom, { half: 'right' })
  field('Date de naissance', fmtDay(v.dateNaissance), { half: 'left' })
  field('Lieu de naissance', v.lieuNaissance, { half: 'right' })
  field('Nationalité', v.nationalite)

  const domicile = [v.adresse, [v.codePostal, v.ville].filter(Boolean).join(' '), v.pays]
    .filter(x => x && x.trim()).join(', ')
  field('Domicile habituel', domicile)
  field('Téléphone mobile', v.telephone, { half: 'left' })
  field('Adresse électronique', v.email, { half: 'right' })
  field("Date d'arrivée", fmtDay(input.sejour.dateArrivee), { half: 'left' })
  field('Date de départ prévue', fmtDay(input.sejour.dateDepart), { half: 'right' })

  // Enfants de moins de 15 ans (peuvent figurer sur la fiche d'un adulte)
  field('Enfants de moins de 15 ans accompagnant le voyageur (nom, prénom, date de naissance)', '')
  y += 2

  // ── Hébergement ───────────────────────────────────────────────────────
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.line(M, y, W - M, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GREEN)
  doc.text('HÉBERGEMENT', M, y)
  y += 8
  field('Établissement / meublé', input.logement.nom, { half: 'left' })
  field('Hébergeur', input.hoteName ?? '', { half: 'right' })
  field('Adresse de l\'hébergement', input.logement.adresse)
  y += 2

  // ── Signature ─────────────────────────────────────────────────────────
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.line(M, y, W - M, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text('Je certifie exacts les renseignements portés sur cette fiche.', M, y)
  y += 8

  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const signDate = input.signedAt ? fmtDay(input.signedAt.slice(0, 10)) : ''
  doc.text(`FAIT LE : ${signDate}`, M, y)
  doc.text('SIGNATURE DU VOYAGEUR :', W / 2 + 4, y)

  // Cadre signature (image du check-in si dispo, sinon vide à signer à l'arrivée)
  const boxX = W / 2 + 4
  const boxY = y + 3
  const boxW = 60
  const boxH = 24
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.4)
  doc.rect(boxX, boxY, boxW, boxH)
  if (input.signatureDataUrl) {
    try {
      doc.addImage(input.signatureDataUrl, 'PNG', boxX + 2, boxY + 2, boxW - 4, boxH - 4)
      doc.setFontSize(7)
      doc.text('Signé électroniquement via le check-in en ligne', boxX, boxY + boxH + 4)
    } catch { /* image illisible : le cadre reste vide, signature manuscrite */ }
  }
  y = boxY + boxH + 12

  // ── Pied de page légal ────────────────────────────────────────────────
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  const footer = doc.splitTextToSize(
    'Cette fiche doit être conservée pendant une durée de six mois par l\'hébergeur et remise, sur leur demande, ' +
    'aux services de police et unités de gendarmerie. Les données ne sont utilisées à aucune autre fin.',
    W - 2 * M,
  )
  doc.text(footer, M, 275)

  return doc
}
