// Lecture de la page publique d'une annonce Airbnb (15/11/2026, demande de
// Jason : « tout doit se faire avec le lien »). Calcul pur : reçoit le HTML,
// rend les faits utiles à l'analyse. Aucune IA, aucun service tiers.
// Testé par jason-app/lib/site/lire-annonce.test.ts.
//
// La page contient deux sources :
// - des données structurées publiques (JSON-LD VacationRental) : titre,
//   description, note, nombre d'avis ;
// - l'état de la page (script data-injector-instances) : photos, équipements,
//   sous-notes, hôte. Sa forme change sans prévenir : on y cherche des clés
//   par leur nom, jamais par leur chemin.

/** Identifiant de l'annonce à partir d'un lien airbnb.<pays>/rooms/<id>. Null si ce n'est pas un lien d'annonce. */
function idAnnonce(lien) {
  let u
  try { u = new URL(String(lien || '').trim()) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (!/(^|\.)airbnb\.[a-z.]{2,10}$/i.test(u.hostname)) return null
  const m = u.pathname.match(/\/rooms\/(?:plus\/)?(\d{5,24})(?:\/|$)/)
  return m ? m[1] : null
}

function scripts(html, re) {
  const out = []
  let m
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1])) } catch { /* bloc illisible : ignoré */ }
  }
  return out
}

/** Parcourt tout l'arbre et appelle fn sur chaque objet. */
function parcourir(o, fn) {
  const pile = [o]
  let garde = 0
  while (pile.length && garde++ < 400000) {
    const x = pile.pop()
    if (!x || typeof x !== 'object') continue
    if (Array.isArray(x)) { for (const v of x) pile.push(v); continue }
    fn(x)
    for (const k in x) pile.push(x[k])
  }
}

function nombre(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function extraireAnnonce(html) {
  html = String(html || '')
  const ld = scripts(html, /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  const fiche = ld.find(x => x && (x['@type'] === 'VacationRental' || x['@type'] === 'LodgingBusiness')) || ld.find(x => x && x['@type'] === 'Product') || null
  const etat = scripts(html, /<script[^>]*id="data-injector-instances"[^>]*>([\s\S]*?)<\/script>/g)[0] || null

  const a = {
    titre: fiche && typeof fiche.name === 'string' ? fiche.name.trim() : '',
    description: fiche && typeof fiche.description === 'string' ? fiche.description.trim() : '',
    note: fiche && fiche.aggregateRating ? nombre(fiche.aggregateRating.ratingValue) : null,
    avis: fiche && fiche.aggregateRating ? nombre(fiche.aggregateRating.ratingCount ?? fiche.aggregateRating.reviewCount) : null,
    photos: { total: 0, paysage: 0, legendes: 0, pieces: [] },
    equipements: { presents: [], absents: [] },
    sousNotes: {},
    superhote: null,
    coupDeCoeur: null,
    tauxReponse: null,
    capacite: null,
  }
  if (!a.titre) {
    const t = html.match(/<meta property="og:description" content="([^"]*)"/)
    if (t) a.titre = t[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
  }

  if (etat) {
    const photos = new Map()
    let groupes = null
    parcourir(etat, o => {
      if (o.__typename === 'Image' && o.orientation && typeof o.baseUrl === 'string' && o.id && !photos.has(o.id)) {
        photos.set(o.id, {
          paysage: o.orientation === 'LANDSCAPE',
          legende: !!(o.imageMetadata && typeof o.imageMetadata.caption === 'string' && o.imageMetadata.caption.trim()),
          piece: String(o.accessibilityLabel || '').replace(/ /g, ' ').replace(/\s*image\s*\d+\s*$/i, '').trim(),
        })
      }
      if (!groupes && Array.isArray(o.seeAllAmenitiesGroups) && o.seeAllAmenitiesGroups.length) groupes = o.seeAllAmenitiesGroups
      if (typeof o.accuracyRating === 'number' && typeof o.cleanlinessRating === 'number') {
        a.sousNotes = {
          proprete: nombre(o.cleanlinessRating), exactitude: nombre(o.accuracyRating), arrivee: nombre(o.checkinRating),
          communication: nombre(o.communicationRating), emplacement: nombre(o.locationRating), qualitePrix: nombre(o.valueRating),
        }
      }
      if (typeof o.isSuperhost === 'boolean' && a.superhote === null) a.superhote = o.isSuperhost
      if (typeof o.responseRateText === 'string' && a.tauxReponse === null) {
        const m = o.responseRateText.match(/(\d{1,3})\s*%/)
        if (m) a.tauxReponse = Number(m[1])
      }
      if (o.isGuestFavorite !== undefined && a.coupDeCoeur === null) a.coupDeCoeur = o.isGuestFavorite === true || o.isGuestFavorite === 'true'
      if (typeof o.personCapacity === 'number' && a.capacite === null) a.capacite = o.personCapacity
      if (a.avis === null && typeof o.reviewCount === 'number') a.avis = o.reviewCount
      if (a.note === null && typeof o.starRating === 'number') a.note = o.starRating
    })
    const liste = [...photos.values()]
    a.photos.total = liste.length
    a.photos.paysage = liste.filter(p => p.paysage).length
    a.photos.legendes = liste.filter(p => p.legende).length
    a.photos.pieces = [...new Set(liste.map(p => p.piece).filter(p => p && !/^photos? suppl/i.test(p)))]
    for (const g of groupes || []) {
      for (const e of (g && g.amenities) || []) {
        if (!e || typeof e.title !== 'string') continue
        ;(e.available === false ? a.equipements.absents : a.equipements.presents).push(e.title.trim())
      }
    }
  }
  if (!a.photos.total && fiche && Array.isArray(fiche.image)) a.photos.total = fiche.image.length
  if (a.avis === 0) a.note = null

  /** La page a-t-elle livré de quoi analyser ? */
  a.lisible = !!(a.titre && (a.description || a.photos.total))
  /** Les données fines (équipements, orientation des photos) sont-elles là ? */
  a.complet = !!(etat && a.equipements.presents.length)
  return a
}

module.exports = { idAnnonce, extraireAnnonce }
