/**
 * Calcul des créneaux ménage entre 2 séjours consécutifs.
 *
 * Approche : on regroupe TOUTES les occupations (séjours du carnet,
 * contrats, événements iCal Airbnb/Booking) par logement, on trie par
 * date, et on génère un créneau ménage à la date de départ de chaque
 * occupation (sauf si le logement n'a aucune réservation derrière).
 *
 * On ne stocke RIEN en base : la dérivation à la volée garantit que
 * le planning reste toujours à jour quand l'hôte ajoute/déplace un
 * séjour. Un événement calendrier manuel de catégorie 'menage' à la
 * même date prend la priorité (l'hôte peut override).
 */

export type Occupation = {
  /** Identifiant unique de la source (sejour, contract, ical event) */
  sourceId: string
  /** Source d'origine (utile pour le debug + le display) */
  source: 'sejour' | 'contract' | 'ical'
  /** Nom du logement (string libre — la jointure se fait par nom) */
  logementName: string
  /** Date check-in (YYYY-MM-DD) */
  dateArrivee: string
  /** Date check-out (YYYY-MM-DD) — exclusive (= jour du ménage) */
  dateDepart: string
  /** Label voyageur (optionnel) */
  voyageurLabel?: string | null
}

export type LogementSettings = {
  id: string
  nom: string
  menageDureeMin: number          // défaut 180 (3h)
  menageHeureDefaut: string       // défaut '11:00'
  menageNotes: string | null
  adresse: string | null
  contactMenageNom: string | null
  contactMenageTel: string | null
  fraisMenage: number | null
}

export type MenageSlot = {
  /** ID dérivé stable : 'auto-<logement_id>-<date>' pour un slot auto,
   *  'manual-<calendar_event_id>' pour un slot manuel. */
  id: string
  date: string                    // YYYY-MM-DD (= jour de checkout)
  startTime: string               // HH:MM (heure de début)
  endTime: string                 // HH:MM (heure de fin = start + duree)
  durationMin: number
  logementId: string | null       // null si on n'a pas matché de logement
  logementName: string
  adresse: string | null
  contactNom: string | null
  contactTel: string | null
  notes: string | null
  fraisMenage: number | null
  /** Vrai si le prochain check-in est le même jour (turnaround serré) */
  sameDay: boolean
  /** Détails de l'occupation qui se termine (pour contexte) */
  voyageurSortant: string | null
  /** Détails de la prochaine occupation, s'il y en a une (sinon null) */
  voyageurEntrant: string | null
  prochainCheckIn: string | null  // YYYY-MM-DD
  /** True si ce slot vient d'un calendar_event saisi à la main (vs auto). */
  isManual?: boolean
  /** ID du calendar_event 'menage' associé (pour édition / suppression). */
  manualEventId?: string
}

/** Calendar event 'menage' saisi à la main (par le bouton + Événement ou
 *  par le bouton "Ajouter un ménage" du modal). */
export type ManualMenageEvent = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  title: string                   // attendu : "Ménage · LogementName"
  description: string | null
}

const DEFAULT_DUREE = 180
const DEFAULT_HEURE = '11:00'

/** Ajoute des minutes à une heure "HH:MM" → "HH:MM" (clampe à 23:59). */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return hhmm
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes)
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

/** Normalise un nom de logement pour le matching (case insensitive, trim). */
function normalizeLogementName(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

/**
 * Génère les créneaux ménage pour une liste d'occupations.
 *
 * Pour chaque logement :
 *   1. Trier les occupations par date_arrivee asc
 *   2. Pour chaque occupation, créer un créneau ménage au date_depart
 *      sauf si c'est la dernière occupation ET qu'il n'y a aucun
 *      départ ce jour-là d'un autre logement (= juste un check-out, pas
 *      de tournover urgent → on garde quand même : la femme de ménage
 *      doit savoir qu'il faut nettoyer même sans nouvelle résa).
 *
 * Filter : on évite les doublons inter-sources via dateDepart+logement.
 */
export function computeMenageSlots(
  occupations: Occupation[],
  logementSettings: LogementSettings[],
  options?: {
    /** Ne garde que les créneaux >= cette date (YYYY-MM-DD) */
    fromDate?: string
    /** Ne garde que les créneaux <= cette date */
    toDate?: string
  },
): MenageSlot[] {
  // Index settings par nom normalisé pour matching
  const settingsByName = new Map<string, LogementSettings>()
  for (const l of logementSettings) {
    settingsByName.set(normalizeLogementName(l.nom), l)
  }

  // Groupe occupations par logement (clé = nom normalisé)
  const byLogement = new Map<string, Occupation[]>()
  for (const o of occupations) {
    if (!o.dateDepart || !o.dateArrivee) continue
    const key = normalizeLogementName(o.logementName)
    if (!key) continue
    if (!byLogement.has(key)) byLogement.set(key, [])
    byLogement.get(key)!.push(o)
  }

  const slots: MenageSlot[] = []
  // Déduplication : un même (logement, date) peut être généré 2× si
  // un séjour + un événement iCal couvrent la même réservation.
  const seen = new Set<string>()

  for (const [logementKey, ops] of byLogement) {
    ops.sort((a, b) => a.dateArrivee.localeCompare(b.dateArrivee))
    const settings = settingsByName.get(logementKey)

    const dureeMin = settings?.menageDureeMin ?? DEFAULT_DUREE
    const heureDeb = settings?.menageHeureDefaut ?? DEFAULT_HEURE

    for (let i = 0; i < ops.length; i++) {
      const current = ops[i]
      const next = ops[i + 1] ?? null
      const dateDepart = current.dateDepart

      if (options?.fromDate && dateDepart < options.fromDate) continue
      if (options?.toDate && dateDepart > options.toDate) continue

      const dedupKey = `${logementKey}|${dateDepart}`
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)

      const sameDay = next ? next.dateArrivee === dateDepart : false
      slots.push({
        id: `auto-${settings?.id ?? logementKey}-${dateDepart}`,
        date: dateDepart,
        startTime: heureDeb,
        endTime: addMinutes(heureDeb, dureeMin),
        durationMin: dureeMin,
        logementId: settings?.id ?? null,
        logementName: settings?.nom ?? current.logementName,
        adresse: settings?.adresse ?? null,
        contactNom: settings?.contactMenageNom ?? null,
        contactTel: settings?.contactMenageTel ?? null,
        notes: settings?.menageNotes ?? null,
        fraisMenage: settings?.fraisMenage ?? null,
        sameDay,
        voyageurSortant: current.voyageurLabel ?? null,
        voyageurEntrant: next?.voyageurLabel ?? null,
        prochainCheckIn: next?.dateArrivee ?? null,
      })
    }
  }

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
}

/**
 * Convertit un calendar_event 'menage' en MenageSlot en fusionnant les
 * settings du logement (adresse, contact, prix par défaut). Le nom de
 * logement est extrait du titre "Ménage · {LogementName}".
 *
 * Notes & prix : si la description contient un marker "[€XX]" on l'extrait
 * comme fraisMenage override. Le reste est utilisé comme notes brutes.
 */
export function manualEventToSlot(
  ev: ManualMenageEvent,
  logementSettings: LogementSettings[],
): MenageSlot {
  // Extrait le nom du logement : on retire le préfixe "Ménage · " ou "Ménage - "
  const logementName = ev.title.replace(/^Ménage\s*[·\-:]\s*/i, '').trim() || ev.title
  const logementKey = normalizeLogementName(logementName)
  const settings = logementSettings.find(l => normalizeLogementName(l.nom) === logementKey)

  const start = ev.startTime ?? settings?.menageHeureDefaut ?? DEFAULT_HEURE
  const end = ev.endTime ?? addMinutes(start, settings?.menageDureeMin ?? DEFAULT_DUREE)

  // Calcul durée à partir des heures explicites pour rester cohérent
  // si l'utilisateur a saisi des bornes non standard.
  const durationMin = (() => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    if (isNaN(sh) || isNaN(eh)) return settings?.menageDureeMin ?? DEFAULT_DUREE
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  })()

  // Parse description : [FAIT] est géré ailleurs. On extrait [€xxx] et le reste = notes.
  let notes: string | null = null
  let fraisOverride: number | null = null
  if (ev.description) {
    const cleaned = ev.description.replace(/\[FAIT\]\s*/g, '').trim()
    const priceMatch = cleaned.match(/\[(\d+(?:[.,]\d+)?)\s*€\]/)
    if (priceMatch) {
      fraisOverride = parseFloat(priceMatch[1].replace(',', '.'))
    }
    const withoutPrice = cleaned.replace(/\[(\d+(?:[.,]\d+)?)\s*€\]\s*/g, '').trim()
    if (withoutPrice.length > 0 && withoutPrice !== '·') notes = withoutPrice
  }

  return {
    id: `manual-${ev.id}`,
    date: ev.date,
    startTime: start,
    endTime: end,
    durationMin,
    logementId: settings?.id ?? null,
    logementName: settings?.nom ?? logementName,
    adresse: settings?.adresse ?? null,
    contactNom: settings?.contactMenageNom ?? null,
    contactTel: settings?.contactMenageTel ?? null,
    notes: notes ?? settings?.menageNotes ?? null,
    fraisMenage: fraisOverride ?? settings?.fraisMenage ?? null,
    sameDay: false,
    voyageurSortant: null,
    voyageurEntrant: null,
    prochainCheckIn: null,
    isManual: true,
    manualEventId: ev.id,
  }
}

/**
 * Fusionne les slots auto-dérivés des séjours avec les ménages saisis
 * manuellement (ce qui inclut les événements [FAIT] créés par la case à
 * cocher du popover séjour — cocher "fait" crée un calendar_event 'menage',
 * qui est donc lui aussi un "manualEvent" de ce point de vue).
 *
 * Politique : si un manuel et un auto matchent sur (date + logement), on
 * FUSIONNE au lieu de remplacer — le manuel prime pour les notes/frais/
 * horaires explicitement saisis, mais on GARDE le contexte calculé de
 * l'auto (prochainCheckIn, sameDay, voyageurEntrant/Sortant, logementId).
 *
 * Avant : le manuel remplaçait entièrement l'auto, et manualEventToSlot()
 * met toujours prochainCheckIn à null (un événement calendrier n'a pas
 * cette notion). Résultat : dès qu'on cochait un ménage "fait", son slot
 * perdait le lien vers le check-in suivant — donc le popover du séjour
 * suivant ne retrouvait plus ce ménage comme "avant l'arrivée" (le slot
 * cherché par `prochainCheckIn === date_arrivee` n'existait plus), et
 * l'hôte se retrouvait avec la case "à faire" qui revenait sans arrêt.
 */
export function mergeAutoAndManual(
  autoSlots: MenageSlot[],
  manualEvents: ManualMenageEvent[],
  logementSettings: LogementSettings[],
): MenageSlot[] {
  const manualSlots = manualEvents.map(ev => manualEventToSlot(ev, logementSettings))

  const autoByKey = new Map<string, MenageSlot>()
  for (const a of autoSlots) {
    autoByKey.set(`${normalizeLogementName(a.logementName)}|${a.date}`, a)
  }

  const usedAutoKeys = new Set<string>()
  const merged: MenageSlot[] = manualSlots.map(m => {
    const key = `${normalizeLogementName(m.logementName)}|${m.date}`
    const auto = autoByKey.get(key)
    if (!auto) return m
    usedAutoKeys.add(key)
    return {
      ...auto,
      isManual: true,
      manualEventId: m.manualEventId,
      notes: m.notes ?? auto.notes,
      fraisMenage: m.fraisMenage ?? auto.fraisMenage,
      startTime: m.startTime,
      endTime: m.endTime,
      durationMin: m.durationMin,
    }
  })

  const filteredAuto = autoSlots.filter(a =>
    !usedAutoKeys.has(`${normalizeLogementName(a.logementName)}|${a.date}`)
  )

  return [...filteredAuto, ...merged]
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
}

/** Formate un créneau pour affichage compact. Ex: "11:00 → 14:00 · 3h". */
export function formatSlotTime(slot: MenageSlot): string {
  const h = Math.floor(slot.durationMin / 60)
  const m = slot.durationMin % 60
  const dur = m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
  return `${slot.startTime} → ${slot.endTime} · ${dur}`
}
