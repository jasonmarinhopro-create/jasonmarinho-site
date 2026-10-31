import type { IssueData } from './template'

type Partner = IssueData['partner']

/**
 * Offres datées des partenaires : elles prennent la place du bon plan du mois
 * pendant leur fenêtre, seulement dans les éditions qui proposent déjà ce partenaire.
 * Black Friday Lodgify (e-mail de Lodgify du 30/10/2026) : code JASON65, -65 % sur
 * Professional et Ultimate en annuel ou 2 ans, nouveaux clients, du 12/11 au 12/12/2026.
 * Annoncé dès la lettre de novembre (envoyée début novembre, avant l'ouverture).
 */
const PROMOS: { name: string; from: string; start: string; end: string; before: Omit<Partner, 'url'>; during: Omit<Partner, 'url'> }[] = [
  {
    name: 'Lodgify', from: '2026-11-01', start: '2026-11-12', end: '2026-12-12',
    before: {
      name: 'Lodgify',
      offer: 'Black Friday : -65 % du 12 novembre au 12 décembre',
      desc: 'Avec le code JASON65, sur Professional et Ultimate en annuel ou 2 ans, pour les nouveaux clients. D\'ici là, JASON15 reste valable.',
    },
    during: {
      name: 'Lodgify',
      offer: 'Black Friday : -65 % jusqu\'au 12 décembre',
      desc: 'Avec le code JASON65, sur Professional et Ultimate en annuel ou 2 ans, pour les nouveaux clients. Ton site de réservation directe, relié à Airbnb et Booking.',
    },
  },
]

/** Bon plan daté à mettre en avant à cette date (AAAA-MM-JJ, heure de Paris), sinon null */
export function promoPartner(parisDate: string, partners: Partner[]): Partner | null {
  for (const p of PROMOS) {
    if (parisDate < p.from || parisDate > p.end) continue
    const base = partners.find(x => x.name === p.name)
    if (!base) continue
    return { ...(parisDate >= p.start ? p.during : p.before), url: base.url }
  }
  return null
}
