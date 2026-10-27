// Brouillon de Ma fiche (atelier, 27/10/2026). Règles pures, testées
// (fiche-draft.test.ts), partagées par les deux Ma fiche (photographe, ménage).
//
// Le brouillon garde l'état de l'écran tel quel ({ form, reseaux, … }) : le
// remettre à l'écran au retour ne demande aucune conversion. La fiche publique
// ne lit jamais ce brouillon : elle change au clic « Mettre en ligne ».

export const DRAFT_VERSION = 1
/** Au-delà, le brouillon n'est pas gardé (texte collé par erreur…) */
export const DRAFT_MAX_CHARS = 40_000

/** Ce qui est déjà écrit en base mais pas encore visible sur la fiche publique */
export interface DraftTouched { photos?: boolean; logo?: boolean }

export interface DraftEnvelope<S> {
  v: number
  savedAt: string
  state: S
  touched: DraftTouched
}

/** Une partie de la fiche et les morceaux de l'état qu'elle modifie (« form.bio », « vitrine.formules »…) */
export interface DraftSection { id: string; paths: string[]; touched?: keyof DraftTouched }

export function valueAt(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const k of path.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}

function setAt<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root = { ...(obj as Record<string, unknown>) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i++) {
    const next = cur[keys[i]]
    cur[keys[i]] = next && typeof next === 'object' && !Array.isArray(next) ? { ...(next as Record<string, unknown>) } : {}
    cur = cur[keys[i]] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = value
  return root as T
}

/** Comparaison stable (ordre des clés indifférent, chaîne vide = absent) */
export function sameValue(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b)
}

function stable(v: unknown): string {
  if (v === undefined || v === null || v === '') return 'null'
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
  }
  if (typeof v === 'string') return JSON.stringify(v.trim())
  return JSON.stringify(v)
}

/** Parties modifiées depuis la dernière mise en ligne, dans l'ordre des parties */
export function changedSections<S>(sections: DraftSection[], current: S, baseline: S, touched: DraftTouched): string[] {
  return sections
    .filter(s => (s.touched && touched[s.touched]) || s.paths.some(p => !sameValue(valueAt(current, p), valueAt(baseline, p))))
    .map(s => s.id)
}

/** Remet des parties comme sur la fiche publique (« Annuler » dans Revoir) */
export function revertSections<S>(sections: DraftSection[], ids: string[], current: S, baseline: S): S {
  let next = current
  for (const s of sections) {
    if (!ids.includes(s.id)) continue
    for (const p of s.paths) next = setAt(next, p, structuredCloneSafe(valueAt(baseline, p)))
  }
  return next
}

function structuredCloneSafe(v: unknown): unknown {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v))
}

/** Brouillon relu de la base ou du téléphone : forme vérifiée, sinon rien */
export function readDraft<S>(raw: unknown): DraftEnvelope<S> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== DRAFT_VERSION || typeof o.savedAt !== 'string' || !o.state || typeof o.state !== 'object') return null
  if (Number.isNaN(Date.parse(o.savedAt))) return null
  const t = (o.touched && typeof o.touched === 'object' ? o.touched : {}) as Record<string, unknown>
  return { v: DRAFT_VERSION, savedAt: o.savedAt, state: o.state as S, touched: { photos: t.photos === true, logo: t.logo === true } }
}

/** Le plus récent des deux brouillons (base, téléphone) */
export function newerDraft<S>(a: DraftEnvelope<S> | null, b: DraftEnvelope<S> | null): DraftEnvelope<S> | null {
  if (!a) return b
  if (!b) return a
  return Date.parse(b.savedAt) > Date.parse(a.savedAt) ? b : a
}

/** État de départ : celui de la fiche publique, complété par le brouillon (clé par clé, rien d'inconnu) */
export function mergeDraftState<S extends Record<string, unknown>>(initial: S, draft: Partial<S> | null): S {
  if (!draft) return initial
  const out = { ...initial }
  for (const k of Object.keys(initial) as Array<keyof S>) {
    const d = draft[k]
    const i = initial[k]
    if (d === undefined || d === null) continue
    if (i && typeof i === 'object' && !Array.isArray(i) && typeof d === 'object' && !Array.isArray(d)) {
      const merged: Record<string, unknown> = { ...(i as Record<string, unknown>) }
      for (const kk of Object.keys(i as Record<string, unknown>)) {
        const dv = (d as Record<string, unknown>)[kk]
        const iv = (i as Record<string, unknown>)[kk]
        if (dv === undefined) continue
        // Même type, valeur vidée (prix effacé) ou champ vide au départ : repris
        if (dv === null || iv === null || (typeof dv === typeof iv && Array.isArray(dv) === Array.isArray(iv))) merged[kk] = dv
      }
      out[k] = merged as S[keyof S]
    } else if (Array.isArray(i) === Array.isArray(d)) {
      out[k] = d as S[keyof S]
    }
  }
  return out
}

export function pendingLabel(n: number): string {
  return n <= 1 ? '1 modification' : `${n} modifications`
}

/** « formules, zone et présentation » */
export function listeFr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}
