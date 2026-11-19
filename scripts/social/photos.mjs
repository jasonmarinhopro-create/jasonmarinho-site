// Photos des publications (19/11/2026, demande de Jason : « tu utilises souvent
// les mêmes photos »). En plus des 12 images de img/exemple-fiches/, un champ
// photo peut valoir « pexels:<recherche> » (ex. « pexels:annecy lac hiver ») ou
// « pexels:<id> » : le workflow cherche sur Pexels (secret PEXELS_API_KEY,
// licence libre https://www.pexels.com/license/), écarte les photos déjà
// publiées depuis 60 jours (data/social/photos-utilisees.json, ids et dates
// seulement), télécharge l'image dans tmp-social/ (jamais commité) et la sert
// au rendu. Pexels injoignable ou sans résultat : fond vert de la marque.
// L'environnement de Claude ne joint pas api.pexels.com : la recherche se fait
// dans le workflow.

import fs from 'node:fs'
import path from 'node:path'

export const REUSE_DAYS = 60
export const PEXELS_RE = /^pexels:(.{2,80})$/

/** Champs « photo » d'un fichier (post, scènes, écrans de stories), avec de quoi les remplacer. */
export function photoFields(spec) {
  const out = []
  const visit = (obj, key) => { if (obj && typeof obj[key] === 'string') out.push({ get: () => obj[key], set: v => { if (v) obj[key] = v; else delete obj[key] } }) }
  visit(spec, 'photo')
  for (const s of spec.slides ?? []) visit(s, 'photo')
  for (const f of spec.frames ?? []) visit(f, 'photo')
  for (const f of spec.story?.frames ?? []) visit(f, 'photo')
  return out
}

/** Première photo de la recherche pas encore publiée depuis REUSE_DAYS jours (used : { id: "AAAA-MM-JJ" }). */
export function choosePhoto(results, used, today, taken = new Set()) {
  const limit = new Date(`${today}T00:00:00Z`).getTime() - REUSE_DAYS * 86400000
  const fresh = p => !taken.has(String(p.id)) && !(used[String(p.id)] && new Date(`${used[String(p.id)]}T00:00:00Z`).getTime() >= limit)
  return (results ?? []).find(fresh) ?? null
}

/**
 * Remplace les « pexels:… » d'un fichier par une image locale (servie depuis
 * root). Renvoie les ids utilisés ; used est mis à jour (à enregistrer).
 */
export async function resolvePhotos(spec, { root, key, used, today, fetchFn = fetch, log = () => {} }) {
  const fields = photoFields(spec).filter(f => PEXELS_RE.test(f.get()))
  if (!fields.length) return []
  const dir = path.join(root, 'tmp-social')
  fs.mkdirSync(dir, { recursive: true })
  const taken = new Set()
  const ids = []
  for (const f of fields) {
    const q = PEXELS_RE.exec(f.get())[1].trim()
    try {
      if (!key) throw new Error('PEXELS_API_KEY absente')
      const get = async u => {
        const r = await fetchFn(u, { headers: { Authorization: key }, cache: 'no-store', signal: AbortSignal.timeout(30000) })
        if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`)
        return r.json()
      }
      let photo
      if (/^\d+$/.test(q)) photo = await get(`https://api.pexels.com/v1/photos/${q}`)
      else {
        const d = await get(`https://api.pexels.com/v1/search?${new URLSearchParams({ query: q, orientation: 'portrait', size: 'large', per_page: '30', locale: 'fr-FR' })}`)
        photo = choosePhoto(d.photos, used, today, taken)
      }
      if (!photo?.src) throw new Error(`aucune photo neuve pour « ${q} »`)
      const img = await fetchFn(photo.src.large2x || photo.src.original, { cache: 'no-store', signal: AbortSignal.timeout(60000) })
      if (!img.ok) throw new Error(`image HTTP ${img.status}`)
      const file = `tmp-social/pexels-${photo.id}.jpg`
      fs.writeFileSync(path.join(root, file), Buffer.from(await img.arrayBuffer()))
      f.set(file)
      taken.add(String(photo.id))
      used[String(photo.id)] = today
      ids.push(photo.id)
    } catch (err) {
      // Pas de photo plutôt qu'un post bloqué : le gabarit garde le fond de la marque
      log(`photo « ${q} » : ${err.message} ; fond de la marque à la place`)
      f.set(null)
    }
  }
  return ids
}

/** Registre des photos Pexels publiées (ids et dates, rien d'autre : dépôt public). */
export function readUsed(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return {} }
}

export function writeUsed(file, used, today) {
  // On ne garde que la fenêtre utile
  const limit = new Date(`${today}T00:00:00Z`).getTime() - REUSE_DAYS * 86400000
  const kept = Object.fromEntries(Object.entries(used).filter(([, d]) => new Date(`${d}T00:00:00Z`).getTime() >= limit).sort())
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(kept, null, 2) + '\n')
}
