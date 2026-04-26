// Mappe la réponse Places API vers les réponses pré-remplies de l'audit GBP.
// Couvre jusqu'à 12 questions sur 25 selon les données disponibles.

import type { PlaceDetails } from './places-api'
import type { AnswerValue } from './questions'

// ─── Mapping types Places → catégorie de notre audit ───
function mapPlacesType(primaryType: string | undefined, primaryDisplay: string | undefined): string {
  const haystack = `${primaryType ?? ''} ${primaryDisplay ?? ''}`.toLowerCase()
  if (/bed_and_breakfast|chambre.*h[oô]te|guest.house/.test(haystack)) return 'chambres_hotes'
  if (/cottage|g[iî]te/.test(haystack)) return 'gite'
  if (/vacation_home_rental|vacation.rental|holiday.rental|location.vacances/.test(haystack)) return 'location_vacances'
  if (/holiday_apartment|appartement.vacances|vacation.apartment/.test(haystack)) return 'appartement_vacances'
  if (/holiday_house|maison.vacances|vacation.house/.test(haystack)) return 'maison_vacances'
  if (/holiday_accommodation|logement.vacances|vacation.accommodation/.test(haystack)) return 'logement_vacances'
  if (/country_house|maison.campagne/.test(haystack)) return 'maison_campagne'
  if (/aparthotel|appart.h[oô]tel/.test(haystack)) return 'appart_hotel'
  if (/^hotel$|^h[oô]tel$/.test(haystack.trim())) return 'hotel'
  return 'autre'
}

export interface PlacesImportResult {
  prefilled: Record<string, AnswerValue>
  prefilledQuestionIds: string[]
  meta: {
    businessName: string
    city: string
    placeId: string
    rating?: number
    reviewCount?: number
  }
  matchedFields: string[]
  unmatchedFields: string[]
}

export function placesResponseToAnswers(place: PlaceDetails): PlacesImportResult {
  const prefilled: Record<string, AnswerValue> = {}
  const matched: string[] = []
  const unmatched: string[] = []

  // ─── Méta ───
  const businessName = place.displayName?.text ?? ''
  const city = (() => {
    const locality = place.addressComponents?.find(c => c.types?.includes('locality'))
    return locality?.longText ?? ''
  })()

  // ─── Q1 category_main : type principal ───
  const cat = mapPlacesType(place.primaryType, place.primaryTypeDisplayName?.text)
  prefilled.category_main = cat
  if (cat !== 'autre') {
    matched.push(`Catégorie : ${place.primaryTypeDisplayName?.text ?? cat}`)
  } else {
    unmatched.push('Catégorie inconnue')
  }

  // ─── Q2 category_secondary_count : nombre de types - le primaryType ───
  const secondaryCount = (place.types?.length ?? 1) - 1
  const safeSecondary = Math.max(0, secondaryCount)
  prefilled.category_secondary_count = safeSecondary
  matched.push(`Catégories secondaires (${safeSecondary})`)

  // ─── Q3 description_filled : editorialSummary >= 500 ───
  const descLen = place.editorialSummary?.text?.length ?? 0
  prefilled.description_filled = descLen >= 500
  if (descLen > 0) {
    matched.push(`Description (${descLen} car.)`)
  } else {
    matched.push('Description (vide)')
  }

  // ─── Q4 address_complete : formattedAddress présent ───
  if (place.formattedAddress) {
    prefilled.address_complete = true
    matched.push('Adresse complète')
  } else {
    prefilled.address_complete = false
    unmatched.push('Adresse manquante')
  }

  // ─── Q5 phone_website : téléphone ET site web ───
  const hasPhone = !!(place.nationalPhoneNumber || place.internationalPhoneNumber)
  const hasWebsite = !!place.websiteUri
  prefilled.phone_website = hasPhone && hasWebsite
  if (hasPhone && hasWebsite) {
    matched.push('Téléphone + Site web')
  } else {
    if (!hasPhone) unmatched.push('Téléphone manquant')
    if (!hasWebsite) unmatched.push('Site web manquant')
  }

  // ─── Q (PHOTOS) reviews_count : nombre d'avis ───
  if (typeof place.userRatingCount === 'number') {
    prefilled.reviews_count = place.userRatingCount
    matched.push(`Avis (${place.userRatingCount})`)
  } else {
    unmatched.push('Nombre d\'avis inconnu')
  }

  // ─── reviews_average : note ───
  if (typeof place.rating === 'number') {
    let bucket = 'under_40'
    if (place.rating >= 4.7) bucket = 'over_47'
    else if (place.rating >= 4.5) bucket = '45_47'
    else if (place.rating >= 4.0) bucket = '40_45'
    prefilled.reviews_average = bucket
    matched.push(`Note moyenne (${place.rating.toFixed(1)}/5)`)
  } else {
    unmatched.push('Note moyenne inconnue')
  }

  // ─── opening_hours : horaires définis ───
  const hasHours = !!(place.regularOpeningHours?.periods?.length ?? place.regularOpeningHours?.weekdayDescriptions?.length)
  prefilled.opening_hours = hasHours
  if (hasHours) {
    matched.push('Horaires définis')
  } else {
    unmatched.push('Horaires non définis')
  }

  // ─── booking_link : site web ─→ proxy pour réservation directe ───
  prefilled.booking_link = hasWebsite
  if (hasWebsite) {
    matched.push('Lien web (réservation)')
  } else {
    unmatched.push('Pas de site web')
  }

  return {
    prefilled,
    prefilledQuestionIds: Object.keys(prefilled),
    meta: {
      businessName,
      city,
      placeId: place.id,
      rating: place.rating,
      reviewCount: place.userRatingCount,
    },
    matchedFields: matched,
    unmatchedFields: unmatched,
  }
}
