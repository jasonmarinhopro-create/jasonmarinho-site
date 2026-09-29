// Prospection par e-mail : règles pures (testées dans engine.test.ts).
// Planification des étapes (J+n, jours d'envoi), fin de séquence (boucle,
// enchaînement), gabarits {prenom}, texte d'information CNIL, extraction
// d'e-mails d'un site et des adresses en échec d'un rebond.

export type Audience = 'photographe' | 'menage' | 'hote' | 'autre'
export type Stage =
  | 'a_trouver' | 'a_contacter' | 'contacte' | 'a_repondu' | 'interesse'
  | 'inscrit' | 'client' | 'pas_interesse' | 'desinscrit' | 'invalide'
export type Source = 'manuel' | 'csv' | 'sirene' | 'google' | 'datatourisme' | 'site'

export const AUDIENCES: Record<Audience, { label: string; plural: string }> = {
  photographe: { label: 'Photographe', plural: 'Photographes' },
  menage:      { label: 'Équipe de ménage', plural: 'Équipes de ménage' },
  hote:        { label: 'Hôte', plural: 'Hôtes' },
  autre:       { label: 'Autre', plural: 'Autres' },
}

/** Pipeline, dans l'ordre d'affichage. `open` : le contact peut encore recevoir une séquence. */
export const STAGES: Array<{ key: Stage; label: string; hint: string; open: boolean }> = [
  { key: 'a_trouver',     label: 'E-mail à trouver', hint: 'Repéré, sans adresse e-mail', open: false },
  { key: 'a_contacter',   label: 'À contacter',      hint: 'Prêt pour une séquence', open: true },
  { key: 'contacte',      label: 'Contacté',         hint: 'Au moins un e-mail envoyé', open: true },
  { key: 'a_repondu',     label: 'A répondu',        hint: 'Réponse reçue, à traiter à la main', open: false },
  { key: 'interesse',     label: 'Intéressé',        hint: 'Veut en savoir plus ou s\'inscrire', open: true },
  { key: 'inscrit',       label: 'Inscrit',          hint: 'Compte ou fiche créé', open: true },
  { key: 'client',        label: 'Client',           hint: 'Abonnement actif', open: true },
  { key: 'pas_interesse', label: 'Pas intéressé',    hint: 'Ne plus relancer', open: false },
  { key: 'desinscrit',    label: 'Désinscrit',       hint: 'Opposition : plus aucun e-mail', open: false },
  { key: 'invalide',      label: 'Adresse invalide', hint: 'Rebond ou adresse fausse', open: false },
]
export const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.key, s.label])) as Record<Stage, string>
export const CLOSED_STAGES: Stage[] = ['desinscrit', 'invalide', 'pas_interesse']

export const SOURCE_LABEL: Record<Source, string> = {
  manuel: 'Ajout manuel',
  csv: 'Import de fichier',
  sirene: 'Annuaire des entreprises (INSEE)',
  google: 'Google Maps',
  datatourisme: 'DATAtourisme',
  site: 'Site web',
}

// ─── Dates (AAAA-MM-JJ, calculs en UTC) ─────────────────────────────────────

export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Jour de la semaine ISO : 1 = lundi … 7 = dimanche */
export function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return wd === 0 ? 7 : wd
}

/** Premier jour d'envoi autorisé à partir de `iso` (inclus). */
export function nextAllowedDay(iso: string, sendDays: number[]): string {
  const days = sendDays.length ? sendDays : [1, 2, 3, 4, 5]
  let d = iso
  for (let i = 0; i < 7; i++) {
    if (days.includes(isoWeekday(d))) return d
    d = addDaysIso(d, 1)
  }
  return iso
}

/** Date d'envoi d'une étape : `delayDays` après `fromIso`, reportée au prochain jour d'envoi. */
export function scheduleStep(fromIso: string, delayDays: number, sendDays: number[]): string {
  return nextAllowedDay(addDaysIso(fromIso, Math.max(0, delayDays)), sendDays)
}

// ─── Fin d'une étape / d'une séquence ───────────────────────────────────────

export interface SequenceRules {
  repeat_after_days: number | null
  max_repeats: number
  then_sequence_id: string | null
  end_stage: Stage | null
}

export type AfterSend =
  | { kind: 'next'; next_step: number; next_send_on: string }
  | { kind: 'loop'; next_step: 0; next_send_on: string; loop_count: number }
  | { kind: 'done'; chain_to: string | null; end_stage: Stage | null }

/**
 * Ce qui suit l'envoi de l'étape `sentIndex` (0 = première). `delays` :
 * délais des étapes, dans l'ordre. La dernière étape envoyée sans réponse
 * déclenche la boucle (si elle reste des tours) sinon la fin (enchaînement).
 */
export function afterSend(
  sentIndex: number, delays: number[], rules: SequenceRules, loopCount: number, today: string, sendDays: number[],
): AfterSend {
  const nextIndex = sentIndex + 1
  if (nextIndex < delays.length) {
    return { kind: 'next', next_step: nextIndex, next_send_on: scheduleStep(today, delays[nextIndex], sendDays) }
  }
  if (rules.repeat_after_days && loopCount < rules.max_repeats) {
    return { kind: 'loop', next_step: 0, next_send_on: scheduleStep(today, rules.repeat_after_days, sendDays), loop_count: loopCount + 1 }
  }
  return { kind: 'done', chain_to: rules.then_sequence_id, end_stage: rules.end_stage }
}

// ─── Gabarits ───────────────────────────────────────────────────────────────

export interface TemplateVars {
  prenom?: string | null
  nom?: string | null
  entreprise?: string | null
  ville?: string | null
  [k: string]: string | null | undefined
}

/**
 * Remplace `{prenom}`, `{ville}`… Une variable absente disparaît proprement :
 * « Bonjour {prenom}, » devient « Bonjour, » et « à {ville} » disparaît
 * avec sa préposition si on écrit « {à ville} » (préfixe facultatif).
 */
export function renderTemplate(tpl: string, vars: TemplateVars): string {
  let out = tpl.replace(/\{([^{}|]*?\s)?([a-z_]+)\}/gi, (_m, prefix: string | undefined, key: string) => {
    const v = vars[key.toLowerCase()]
    const val = typeof v === 'string' ? v.trim() : ''
    if (!val) return ''
    return `${prefix ?? ''}${val}`
  })
  // Nettoyage après une variable vide
  out = out
    .replace(/[ \t]+([,.])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +\n/g, '\n')
  return out
}

/** Prénom plausible : champ prénom, sinon premier mot du nom s'il ressemble à un prénom. */
export function guessFirstName(prenom?: string | null, nom?: string | null): string {
  const p = (prenom ?? '').trim()
  if (p) return capitalize(p.split(/\s+/)[0])
  const n = (nom ?? '').trim()
  if (!n || /\b(sarl|sas|eurl|sasu|sci|studio|photo|photographie|nettoyage|services?|agence|conciergerie)\b/i.test(n)) return ''
  const first = n.split(/\s+/)[0]
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'-]{2,20}$/.test(first) && n.split(/\s+/).length >= 2 ? capitalize(first) : ''
}

function capitalize(s: string): string {
  const low = s.toLowerCase()
  return low.replace(/(^|[-'\s])([a-zà-öø-ÿ])/g, (_m, a: string, b: string) => a + b.toUpperCase())
}

/** Objet d'une relance dans le même fil */
export function replySubject(subject: string): string {
  return /^re\s*:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`
}

// ─── Information CNIL + désinscription ──────────────────────────────────────

const SOURCE_PHRASE: Partial<Record<Source, string>> = {
  google: 'ta fiche Google Maps',
  sirene: "l'annuaire public des entreprises (INSEE)",
  datatourisme: 'DATAtourisme, la base publique des offices de tourisme',
  site: 'ton site internet',
}

/**
 * Pied de message : identité de l'expéditeur, origine de l'adresse (premier
 * message) et désinscription en un clic. Prospection B2B : pas de
 * consentement préalable, mais information et opposition simple obligatoires.
 */
export function complianceFooter(opts: { source: Source; firstMessage: boolean; unsubscribeUrl: string }): string {
  const lines: string[] = []
  if (opts.firstMessage) {
    const where = SOURCE_PHRASE[opts.source]
    lines.push(
      where
        ? `Je t'écris parce que ton activité est présentée publiquement sur ${where}. Ton adresse sert uniquement à ces quelques messages de Jason Marinho (jasonmarinho.com).`
        : `Ton adresse sert uniquement à ces quelques messages de Jason Marinho (jasonmarinho.com).`,
    )
  }
  lines.push(`Pour ne plus recevoir de message de ma part : ${opts.unsubscribeUrl}`)
  return lines.join('\n')
}

// ─── Mise en forme : texte brut → HTML simple (meilleure délivrabilité) ─────

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Paragraphes et liens cliquables, sans image ni pixel de suivi. */
export function textToHtml(text: string, footer: string): string {
  const para = (block: string) => escapeHtml(block)
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>')
  const body = text.trim().split(/\n{2,}/).map(b => `<p style="margin:0 0 14px;">${para(b)}</p>`).join('')
  const foot = footer.trim().split(/\n/).map(l => para(l)).join('<br>')
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.6;color:#1f2a24;">${body}<p style="margin:22px 0 0;font-size:12px;color:#6b7a72;">${foot}</p></div>`
}

// ─── E-mails trouvés sur un site ────────────────────────────────────────────

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi
const JUNK_RE = /(\.(png|jpe?g|gif|webp|svg|css|js)$)|(^|@)(example|exemple|domain|email|votre|your|test)\.|sentry|wixpress|noreply|no-reply|donotreply|u003e|@2x|@3x/i

/** Adresses e-mail d'une page (mailto et texte), sans doublon ni adresse technique. */
export function extractEmails(html: string): string[] {
  const decoded = html
    .replace(/\s*(?:&#64;|&commat;|\[at\]|\(at\)|\sarobase\s)\s*/gi, '@')
    .replace(/\s*(?:&#46;|\[dot\]|\(dot\))\s*/gi, '.')
  const found = new Set<string>()
  for (const m of decoded.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase().replace(/^mailto:/, '').replace(/\.+$/, '')
    if (!JUNK_RE.test(e) && e.length <= 80) found.add(e)
  }
  return Array.from(found)
}

/** Meilleure adresse : même domaine que le site, puis contact@/bonjour@/hello@, puis la première. */
export function bestEmail(emails: string[], siteUrl?: string | null): string | null {
  if (!emails.length) return null
  let host = ''
  try { host = siteUrl ? new URL(siteUrl).hostname.replace(/^www\./, '') : '' } catch { host = '' }
  const score = (e: string) => {
    const [local, domain] = e.split('@')
    let s = 0
    if (host && (domain === host || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`))) s += 10
    if (/^(contact|bonjour|hello|info|studio|photo|reservation)/.test(local)) s += 3
    if (/^(rgpd|dpo|privacy|legal|admin|webmaster|support|compta|facturation)/.test(local)) s -= 5
    return s
  }
  return [...emails].sort((a, b) => score(b) - score(a))[0]
}

// ─── Rebonds (DSN) ──────────────────────────────────────────────────────────

/** Adresses en échec d'un message de non-remise (Final-Recipient, « failed recipient »). */
export function bouncedAddresses(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(/(?:Final-Recipient|Original-Recipient)\s*:\s*rfc822\s*;\s*<?([^\s>]+@[^\s>]+)>?/gi)) out.add(m[1].toLowerCase())
  for (const m of text.matchAll(/X-Failed-Recipients\s*:\s*([^\s,]+@[^\s,]+)/gi)) out.add(m[1].toLowerCase())
  return Array.from(out)
}

/** Expéditeur d'un rebond (serveur de messagerie), à ne pas confondre avec une vraie réponse. */
export function isBounceSender(from: string): boolean {
  return /mailer-daemon|postmaster|mail delivery|delivery status/i.test(from)
}
