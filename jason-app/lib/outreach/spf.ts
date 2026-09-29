// Garde-fou de délivrabilité (29/09/2026) : pas d'envoi de prospection tant
// que le domaine de l'adresse d'envoi n'a pas d'enregistrement SPF qui
// autorise le serveur SMTP utilisé. Sans SPF (ni DKIM), Gmail et Outlook
// refusent ou classent en indésirables, et le domaine se grille dès le
// premier jour. Le contrôle est refait à chaque passage : les envois
// démarrent seuls dès que le DNS est corrigé.

import { promises as dns } from 'node:dns'

/** Nom du fournisseur à retrouver dans le SPF, d'après le serveur SMTP (smtp.hostinger.com → hostinger). */
export function providerHint(smtpHost: string): string {
  const parts = smtpHost.toLowerCase().split('.').filter(Boolean)
  const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? ''
  return base === 'gmail' || base === 'googlemail' ? 'google' : base
}

/** Le SPF autorise-t-il ce fournisseur ? (include:, a:, mx ou ip explicites non vérifiés : on cherche le nom du fournisseur) */
export function spfAllows(records: string[], smtpHost: string): boolean {
  const spf = records.find(r => /^v=spf1\b/i.test(r.trim()))
  if (!spf) return false
  return spf.toLowerCase().includes(providerHint(smtpHost))
}

export async function checkSpf(fromEmail: string, smtpHost: string): Promise<{ ok: boolean; domain: string; record: string | null }> {
  const domain = fromEmail.split('@')[1]?.toLowerCase() ?? ''
  try {
    const txt = (await dns.resolveTxt(domain)).map(chunks => chunks.join(''))
    return { ok: spfAllows(txt, smtpHost), domain, record: txt.find(r => /^v=spf1\b/i.test(r)) ?? null }
  } catch {
    return { ok: false, domain, record: null }
  }
}
