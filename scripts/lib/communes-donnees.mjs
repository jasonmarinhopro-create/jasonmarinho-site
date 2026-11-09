// Chiffres publics d'une commune, d'un département ou d'une région (10/11/2026) :
// population (geo.api.gouv.fr) et capacité d'hébergement touristique (Insee),
// relevés par le workflow « Données communes » dans scripts/data/communes-donnees.json.
// Fichier absent ou zone inconnue : pas de section (les pages restent valides).
import fs from 'node:fs'

const FILE = new URL('../data/communes-donnees.json', import.meta.url)
let _d
function data() {
  if (_d !== undefined) return _d
  try { _d = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { _d = null }
  return _d
}

/** { population, hotels, chambres, campings, emplacements, autres, lits } ou null */
export function chiffres(niveau, code) {
  const a = data()?.[niveau]?.[code]
  if (!a) return null
  const [population, hotels, chambres, campings, emplacements, autres, lits] = a
  return { population, hotels, chambres, campings, emplacements, autres, lits }
}

/** Habitants par chambre d'hôtel en France (somme des régions) */
export function moyenneFrance() {
  const regs = Object.values(data()?.REG ?? {})
  const pop = regs.reduce((n, a) => n + a[0], 0), ch = regs.reduce((n, a) => n + a[2], 0)
  return ch ? Math.round(pop / ch) : null
}

const nb = n => Number(n).toLocaleString('fr-FR').replace(/ | /g, ' ')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Section « Le tourisme en chiffres » : habitants, hôtels, campings, autres
 * hébergements collectifs, et le nombre d'habitants par chambre d'hôtel comparé
 * à la moyenne française (peu de chambres d'hôtel = place pour la location
 * courte durée, beaucoup = concurrence hôtelière).
 */
export function tourismeSection(zoneDe, niveau, code) {
  const c = chiffres(niveau, code)
  if (!c || (!c.population && !c.hotels && !c.campings)) return ''
  const d = data()
  const fr = moyenneFrance()
  const ratio = c.chambres ? Math.round(c.population / c.chambres) : null
  const cartes = [
    c.population ? ['ph-users-three', nb(c.population), 'habitants'] : null,
    ['ph-buildings', nb(c.hotels), `hôtel${c.hotels > 1 ? 's' : ''}${c.chambres ? `, ${nb(c.chambres)} chambres` : ''}`],
    ['ph-tent', nb(c.campings), `camping${c.campings > 1 ? 's' : ''}${c.emplacements ? `, ${nb(c.emplacements)} emplacements` : ''}`],
    c.autres ? ['ph-house-line', nb(c.autres), `résidence${c.autres > 1 ? 's' : ''} de tourisme, village${c.autres > 1 ? 's' : ''} vacances ou auberge${c.autres > 1 ? 's' : ''}${c.lits ? ` (${nb(c.lits)} lits)` : ''}`] : null,
  ].filter(Boolean)
  let lecture = ''
  if (ratio && fr && c.population) {
    lecture = ratio > fr * 1.3
      ? `Une chambre d’hôtel pour ${nb(ratio)} habitants, contre une pour ${nb(fr)} en moyenne en France : l’offre hôtelière est plutôt rare, les locations meublées de courte durée ont de la place.`
      : ratio < fr * 0.7
        ? `Une chambre d’hôtel pour ${nb(ratio)} habitants, contre une pour ${nb(fr)} en moyenne en France : une zone très touristique, où les hôtels sont nombreux. Des photos soignées et un ménage irréprochable font la différence.`
        : `Une chambre d’hôtel pour ${nb(ratio)} habitants, proche de la moyenne française (une pour ${nb(fr)}).`
  } else if (!c.hotels && c.population) {
    lecture = 'Aucun hôtel classé ou non dans la commune : les voyageurs de passage se tournent vers les meublés et les chambres d’hôtes.'
  }
  return `<section class="zs"><h2>Le tourisme en chiffres <em>${esc(zoneDe)}</em></h2>
<p>Capacité d’accueil touristique officielle : ce que trouvent les voyageurs en dehors des locations meublées.</p>
<div class="zs-cards zs-kpis">${cartes.map(([i, n, l]) => `<div class="zs-card"><h3><i class="ph-bold ${i}"></i>${n}</h3><p style="margin:0;color:var(--tm);font-size:13.5px">${esc(l)}</p></div>`).join('')}</div>
${lecture ? `<p style="margin:14px 0 0;color:var(--td);font-size:14.5px;line-height:1.6;max-width:820px">${esc(lecture)}</p>` : ''}
<p class="zs-src">Sources : <a href="${d.sources.tourisme}" rel="noopener" target="_blank">Insee, capacité des communes en hébergement touristique ${esc(d.tourismeAnnee ?? '')}</a> · population légale Insee via <a href="https://geo.api.gouv.fr" rel="noopener" target="_blank">geo.api.gouv.fr</a>.</p></section>`
}
