// « Repéré dans ton activité » (refonte du 23/11/2026, piste A validée par
// Jason) : à partir des données de l'hôte dans l'app, la leçon courte qui
// répond à sa situation. Une seule à la fois, la plus utile. Calcul pur
// (test à côté) ; les données sont lues par app/dashboard/formations/page.tsx.

export interface SignalInput {
  today: string                 // AAAA-MM-JJ (Paris)
  logementsCount: number
  prixRenseignes: boolean       // au moins un prix par plateforme saisi dans Mes prix
  sejoursTotal: number          // séjours non annulés enregistrés dans l'app
  sejoursProchains: Array<{ arrivee: string; depart: string | null }> // 30 prochains jours
  leconsFaites: Set<string>     // « slug:id » des leçons terminées
}

export interface Signal {
  key: string
  titre: string
  detail: string
  href: string
  minutes: number
}

const BON_PRIX = 'mettre-le-bon-prix-lcd'

function addDays(d: string, n: number): string {
  const t = new Date(d + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

/** Nuits réservées entre aujourd'hui et J+30 (exclu), tous logements confondus. */
export function nuitsReservees(sejours: SignalInput['sejoursProchains'], today: string): number {
  const fin = addDays(today, 30)
  let n = 0
  for (const s of sejours) {
    const a = s.arrivee < today ? today : s.arrivee
    const d = !s.depart || s.depart > fin ? fin : s.depart
    if (d <= a) continue
    n += Math.round((new Date(d + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000)
  }
  return n
}

export function computeSignals(i: SignalInput): Signal[] {
  const out: Signal[] = []
  if (i.logementsCount === 0) return out
  const fait = (id: number) => i.leconsFaites.has(`${BON_PRIX}:${id}`)

  if (!i.prixRenseignes && !fait(1)) {
    out.push({
      key: 'prix-minimum',
      titre: 'Ton prix minimum n\'est pas encore calculé',
      detail: 'Leçon « Calculer ton prix minimum »',
      href: `/dashboard/formations/${BON_PRIX}?lecon=1`,
      minutes: 8,
    })
  }

  // Remplissage : seulement si l'hôte enregistre vraiment ses séjours dans l'app
  if (i.sejoursTotal >= 3) {
    const capacite = 30 * i.logementsCount
    const taux = Math.round((nuitsReservees(i.sejoursProchains, i.today) / capacite) * 100)
    if (taux < 35 && !fait(12)) {
      out.push({
        key: 'calendrier-vide',
        titre: `Tes 30 prochains jours sont remplis à ${taux} %`,
        detail: 'Leçon « Remises de durée et séjour minimum »',
        href: `/dashboard/formations/${BON_PRIX}?lecon=12`,
        minutes: 7,
      })
    } else if (taux >= 90 && !fait(2)) {
      out.push({
        key: 'calendrier-plein',
        titre: `Tes 30 prochains jours sont remplis à ${taux} % : ton prix est peut-être trop bas`,
        detail: 'Leçon « Trouver ton prix de base »',
        href: `/dashboard/formations/${BON_PRIX}?lecon=2`,
        minutes: 7,
      })
    }
  }
  return out
}
