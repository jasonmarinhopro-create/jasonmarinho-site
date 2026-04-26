// Parse un CSV Google Business Profile et le convertit en réponses pré-remplies pour l'audit.
// Le CSV de Google a des colonnes localisées (FR ou EN selon les paramètres du compte).
// On supporte les deux pour être robuste.

import type { AnswerValue } from './questions'

// ─── Colonnes possibles (FR + EN) ───
const COL_NAMES = {
  businessName: ['Business name', 'Nom', "Nom de l'établissement"],
  primaryCategory: ['Primary category', 'Catégorie principale'],
  additionalCategories: ['Additional categories', 'Catégories supplémentaires', 'Catégories additionnelles'],
  description: ['From the business', 'Description', "À propos de l'établissement"],
  primaryPhone: ['Primary phone', 'Téléphone principal', 'Numéro de téléphone'],
  website: ['Website', 'Site Web', 'Site web'],
  addressLine1: ['Address line 1', 'Adresse 1', 'Ligne 1'],
  postalCode: ['Postal code', 'Code postal'],
  city: ['Locality', 'Ville', 'Localité'],
  // Au moins un de ces 7 champs horaires non-vide
  hoursDays: [
    ['Sunday hours', 'Horaires du dimanche', 'Dimanche'],
    ['Monday hours', 'Horaires du lundi', 'Lundi'],
    ['Tuesday hours', 'Horaires du mardi', 'Mardi'],
    ['Wednesday hours', 'Horaires du mercredi', 'Mercredi'],
    ['Thursday hours', 'Horaires du jeudi', 'Jeudi'],
    ['Friday hours', 'Horaires du vendredi', 'Vendredi'],
    ['Saturday hours', 'Horaires du samedi', 'Samedi'],
  ],
}

// ─── Parser CSV minimaliste (pas de dépendance externe) ───
// Gère les guillemets et les virgules à l'intérieur de champs entre guillemets.
export function parseCsv(text: string): Record<string, string>[] {
  const lines = splitCsvLines(text)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    if (cells.every(c => c === '')) continue
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? ''
    }
    rows.push(row)
  }
  return rows
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      // Vérifie si c'est un guillemet échappé ""
      if (inQuotes && text[i + 1] === '"') {
        current += '""'
        i++
      } else {
        inQuotes = !inQuotes
        current += ch
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) lines.push(current)
  return lines
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

// ─── Helpers de récupération de colonne ───
function getCol(row: Record<string, string>, names: string[]): string {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== '') return row[n]
  }
  return ''
}

// ─── Mapping catégorie GBP → option de l'audit ───
function mapCategory(label: string): string {
  const l = label.toLowerCase().trim()
  // Maps possibles vers nos options
  if (/chambre.*h[oô]te|bed.*breakfast|guest house/.test(l)) return 'chambres_hotes'
  if (/g[iî]te/.test(l)) return 'gite'
  if (/maison.*vacances|holiday house|vacation house/.test(l)) return 'maison_vacances'
  if (/appartement.*vacances|holiday apartment|vacation apartment/.test(l)) return 'appartement_vacances'
  if (/logement.*vacances|vacation accommodation|holiday accommodation/.test(l)) return 'logement_vacances'
  if (/location.*vacances|vacation rental|holiday rental/.test(l)) return 'location_vacances'
  if (/maison.*campagne|country house/.test(l)) return 'maison_campagne'
  if (/appart.*h[oô]tel|apart.*hotel|aparthotel/.test(l)) return 'appart_hotel'
  if (/^h[oô]tel|^hotel/.test(l)) return 'hotel'
  return 'autre'
}

// ─── Résultat de l'import ───
export interface ImportResult {
  prefilled: Record<string, AnswerValue>
  prefilledQuestionIds: string[]  // Liste des question_ids pré-remplis (pour badges UI)
  meta: {
    businessName: string
    city: string
  }
  matchedFields: string[]   // Liste des champs auto-remplis (pour affichage)
  unmatchedFields: string[] // Champs non trouvés / vides
}

export function csvRowToAnswers(row: Record<string, string>): ImportResult {
  const prefilled: Record<string, AnswerValue> = {}
  const matched: string[] = []
  const unmatched: string[] = []

  // ─── Métadonnées (pas dans les questions, mais utiles pour la session) ───
  const businessName = getCol(row, COL_NAMES.businessName)
  const city = getCol(row, COL_NAMES.city)

  // ─── Q1: catégorie principale ───
  const primaryCat = getCol(row, COL_NAMES.primaryCategory)
  if (primaryCat) {
    prefilled.category_main = mapCategory(primaryCat)
    matched.push('Catégorie principale')
  } else {
    unmatched.push('Catégorie principale')
  }

  // ─── Q2: nombre de catégories secondaires ───
  const additionalCats = getCol(row, COL_NAMES.additionalCategories)
  if (additionalCats) {
    // Le CSV de Google sépare par des virgules dans le champ entre guillemets
    const count = additionalCats.split(',').map(s => s.trim()).filter(Boolean).length
    prefilled.category_secondary_count = count
    matched.push(`Catégories secondaires (${count})`)
  } else {
    prefilled.category_secondary_count = 0
    matched.push('Catégories secondaires (0)')
  }

  // ─── Q3: description >= 500 caractères ───
  const description = getCol(row, COL_NAMES.description)
  if (description) {
    prefilled.description_filled = description.length >= 500
    matched.push(`Description (${description.length} car.)`)
  } else {
    prefilled.description_filled = false
    matched.push('Description (vide)')
  }

  // ─── Q4: adresse complète ───
  const addrLine1 = getCol(row, COL_NAMES.addressLine1)
  const postal = getCol(row, COL_NAMES.postalCode)
  if (addrLine1 && postal) {
    prefilled.address_complete = true
    matched.push('Adresse')
  } else {
    prefilled.address_complete = false
    unmatched.push('Adresse incomplète')
  }

  // ─── Q5: téléphone + site web ───
  const phone = getCol(row, COL_NAMES.primaryPhone)
  const website = getCol(row, COL_NAMES.website)
  if (phone && website) {
    prefilled.phone_website = true
    matched.push('Téléphone + Site web')
  } else {
    prefilled.phone_website = false
    if (!phone) unmatched.push('Téléphone manquant')
    if (!website) unmatched.push('Site web manquant')
  }

  // ─── Q23: horaires ───
  let hasHours = false
  for (const dayCols of COL_NAMES.hoursDays) {
    const v = getCol(row, dayCols)
    if (v && v.toLowerCase() !== 'x' && v !== '') {
      hasHours = true
      break
    }
  }
  prefilled.opening_hours = hasHours
  if (hasHours) matched.push('Horaires')
  else unmatched.push('Horaires non définis')

  // ─── Q25: lien de réservation directe (présence du site web suffit en proxy) ───
  if (website) {
    prefilled.booking_link = true
    matched.push('Lien web (réservation)')
  } else {
    prefilled.booking_link = false
    unmatched.push('Pas de site web')
  }

  return {
    prefilled,
    prefilledQuestionIds: Object.keys(prefilled),
    meta: { businessName, city },
    matchedFields: matched,
    unmatchedFields: unmatched,
  }
}
