// Moment choisi pour une action de fin de module (« Ce soir », « Demain »,
// « Ce week-end »), en heure de Paris. Calcul pur (test à côté).

const PARIS = 'Europe/Paris'

function parisParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: PARIS, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) }
}

/** Date UTC correspondant à y-m-d hh:00 à Paris. */
function parisAt(y: number, m: number, d: number, h: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, h))
  const p = parisParts(guess)
  const shown = Date.UTC(p.y, p.m - 1, p.d, p.h)
  return new Date(guess.getTime() - (shown - guess.getTime()))
}

export function actionDueDate(when: 'ce-soir' | 'demain' | 'week-end', now: Date): Date {
  const p = parisParts(now)
  if (when === 'ce-soir') {
    // 19 h ; s'il est déjà 19 h passées, dans une heure
    return p.h < 19 ? parisAt(p.y, p.m, p.d, 19) : new Date(now.getTime() + 60 * 60 * 1000)
  }
  if (when === 'demain') {
    const t = new Date(Date.UTC(p.y, p.m - 1, p.d + 1))
    return parisAt(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), 9)
  }
  // Samedi 10 h (si on est déjà samedi ou dimanche : le samedi suivant)
  const add = ((6 - p.wd + 7) % 7) || 7
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + add))
  return parisAt(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), 10)
}
