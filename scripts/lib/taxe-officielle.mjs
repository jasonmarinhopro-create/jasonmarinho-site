// Grille 2026 de la taxe de séjour d'une ville, d'après la base officielle de
// la DGFiP (données DELTA, relevées par scripts/taxe-officielle.mjs dans
// scripts/data/taxe-sejour-officielle.json). Pour chaque sorte
// d'hébergement, la délibération la plus récente en vigueur en 2026 gagne
// (une délibération reste valable tant qu'elle n'est pas remplacée).
// tarif = part votée par la commune ; total = avec les taxes additionnelles
// (départementale, régionale, Île-de-France), tel que publié par la DGFiP.
import { readFileSync, existsSync } from 'node:fs'

const FILE = new URL('../data/taxe-sejour-officielle.json', import.meta.url)
export const TAXE_SOURCE_URL = 'https://data.economie.gouv.fr/explore/dataset/delta_deliberation_ts_tarif0/'

// slug de nos pages → clé du relevé et libellé exact de la commune dans DELTA
const COMMUNES = {
  lyon: ['Lyon|69', 'LYON'], bordeaux: ['Bordeaux|33', 'BORDEAUX'], annecy: ['Annecy|74', 'ANNECY'],
  nice: ['Nice|06', 'NICE'], strasbourg: ['Strasbourg|67', 'STRASBOURG VILLE'], biarritz: ['Biarritz|64', 'BIARRITZ'],
  'la-rochelle': ['La Rochelle|17', 'LA ROCHELLE'], marseille: ['Marseille|13', 'MARSEILLE'], toulouse: ['Toulouse|31', 'TOULOUSE'],
  montpellier: ['Montpellier|34', 'MONTPELLIER'], nantes: ['Nantes|44', 'NANTES'], lille: ['Lille|59', 'LILLE'],
  'aix-en-provence': ['Aix-en-Provence|13', 'AIX-EN-PROVENCE'], cannes: ['Cannes|06', 'CANNES'], avignon: ['Avignon|84', 'AVIGNON'],
  chamonix: ['Chamonix|74', 'CHAMONIX-MONT-BLANC'], 'saint-malo': ['Saint-Malo|35', 'SAINT-MALO'], rennes: ['Rennes|35', 'RENNES'],
  colmar: ['Colmar|68', 'COLMAR'], dijon: ['Dijon|21', 'DIJON'], arcachon: ['Arcachon|33', 'ARCACHON'], deauville: ['Deauville|14', 'DEAUVILLE'],
  reims: ['Reims|51', 'REIMS'], tours: ['Tours|37', 'TOURS'], metz: ['Metz|57', 'METZ'], rouen: ['Rouen|76', 'ROUEN'],
  perpignan: ['Perpignan|66', 'PERPIGNAN'], grenoble: ['Grenoble|38', 'GRENOBLE'], bayonne: ['Bayonne|64', 'BAYONNE'], caen: ['Caen|14', 'CAEN'],
  vannes: ['Vannes|56', 'VANNES'], angers: ['Angers|49', 'ANGERS'], 'la-baule': ['La Baule|44', 'LA BAULE-ESCOUBLAC'],
  chambery: ['Chambery|73', 'CHAMBERY'], sete: ['Sete|34', 'SETE'], brest: ['Brest|29', 'BREST'], pau: ['Pau|64', 'PAU'],
  'saint-tropez': ['Saint-Tropez|83', 'SAINT-TROPEZ'], honfleur: ['Honfleur|14', 'HONFLEUR'], 'le-touquet': ['Le Touquet|62', 'LE TOUQUET-PARIS-PLAGE'],
  carcassonne: ['Carcassonne|11', 'CARCASSONNE'], ajaccio: ['Ajaccio|2A', 'AJACCIO'], antibes: ['Antibes|06', 'ANTIBES'],
  sarlat: ['Sarlat|24', 'SARLAT-LA-CANEDA'], nimes: ['Nimes|30', 'NIMES'], 'le-mans': ['Le Mans|72', 'LE MANS'],
  paris: ['Paris|75', 'VILLE DE PARIS'], megeve: ['Megeve|74', 'MEGEVE'], beaune: ['Beaune|21', 'BEAUNE'],
  epernay: ['Epernay|51', 'EPERNAY'], etretat: ['Etretat|76', 'ETRETAT'], menton: ['Menton|06', 'MENTON'], dinard: ['Dinard|35', 'DINARD'],
  quimper: ['Quimper|29', 'QUIMPER'], nancy: ['Nancy|54', 'NANCY'], troyes: ['Troyes|10', 'TROYES'], bastia: ['Bastia|2B', 'BASTIA'],
  'clermont-ferrand': ['Clermont|63', 'CLERMONT FERRAND CLT FD'], poitiers: ['Poitiers|86', 'POITIERS'], roanne: ['Roanne|42', 'ROANNE'],
  'les-sables-d-olonne': ['Les Sables|85', "LES SABLES-D'OLONNE"],
  // Versailles : la base ne porte que la part départementale, pas les taxes
  // d'Île-de-France (15 % et 200 %) : grille non affichée, texte local gardé.
}

const LIGNES = [
  ['sans classement', 'Meublé non classé'],
  ['Chambres', "Chambres d'hôtes"],
  ['Meublés de tourisme 1', 'Meublé 1 étoile'],
  ['Meublés de tourisme 2', 'Meublé 2 étoiles'],
  ['Meublés de tourisme 3', 'Meublé 3 étoiles'],
  ['Meublés de tourisme 4', 'Meublé 4 étoiles'],
  ['Meublés de tourisme 5', 'Meublé 5 étoiles'],
]

const num = v => (v == null || v === '' ? null : Number(String(v).replace(',', '.')))

let data
function load() {
  if (data !== undefined) return data
  data = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null
  return data
}

/** Taxes additionnelles lues sur une ligne (en %) */
function additions(r) {
  const out = []
  const dep = num(r.taxe_add_dep)
  if (dep) out.push(`départementale ${dep} %`)
  const reg = num(r.taxe_add_article_l_4332_4_du_code_general_des_collectivites_territoriales)
    ?? num(r.taxe_add_article_l_4332_5_du_code_general_des_collectivites_territoriales)
    ?? num(r.taxe_add_article_l_4332_6_du_code_general_des_collectivites_territoriales)
  if (reg) out.push(`régionale ${reg} %`)
  const idf = num(r.taxe_add_article_l_2531_17_du_code_general_des_collectivites_territoriales)
  if (idf) out.push(`Île-de-France ${idf} %`)
  // Île-de-France Mobilités (200 %) : visible seulement dans le total
  if (idf && r.tarif && r.tarif_total / r.tarif > 3) out.push('Île-de-France Mobilités 200 %')
  return out
}

/**
 * Grille de la ville, ou null (pas de relevé, commune absente, ligne manquante).
 * { annee, releve, lignes: [{ label, tarif, total, unite }], additions: [] }
 */
export function officialGrid(slug) {
  const d = load()
  const c = COMMUNES[slug]
  if (!d || !c) return null
  const rows = (d.communes[c[0]] ?? []).filter(r => r.libelle_commune === c[1] && Number(String(r.date_effet).slice(0, 4)) <= 2026)
  const best = new Map()
  for (const r of rows) {
    const k = r.hebergement
    if (!best.has(k) || Number(best.get(k).date_effet) < Number(r.date_effet)) best.set(k, r)
  }
  const lignes = []
  let annee = 0
  const adds = new Set()
  for (const [key, label] of LIGNES) {
    const r = [...best.values()].find(x => x.hebergement.includes(key))
    if (!r || r.tarif == null || r.tarif_total == null) return null
    lignes.push({ label, tarif: Number(r.tarif), total: Number(r.tarif_total), unite: r.unite === '%' ? '%' : '€' })
    annee = Math.max(annee, Number(String(r.date_effet).slice(0, 4)))
    adds.add(additions(r).join(', '))
  }
  if (lignes[0].unite !== '%') return null
  // Taxes additionnelles citées seulement si toutes les lignes ont les mêmes
  const one = adds.size === 1 ? [...adds][0] : null
  return { annee, releve: d.releve, lignes, additions: one === null ? null : one ? one.split(', ') : [] }
}

const fr = (n, d = 2) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
export const fmtTarif = l => (l.unite === '%' ? `${fr(l.tarif, l.tarif % 1 ? 2 : 0)} %` : `${fr(l.tarif)} €`)
export const fmtTotal = l => (l.unite === '%' ? `${fr(l.total, l.total % 1 ? 2 : 0)} %` : `${fr(l.total)} €`)
