// Vérification d'une adresse avant le premier e-mail (20/11/2026, Jason :
// « je n'envoie que 10 mails par jour ») : la montée en charge avait ramené
// le plafond de 45 à 10 à cause de 5 à 8 % de rebonds, presque tous au premier
// e-mail sur des adresses trouvées sur des sites. Contrôle gratuit : le
// domaine de l'adresse reçoit-il du courrier (enregistrement MX) ? Une
// boîte qui n'existe plus sur un domaine vivant reste invisible ici (pas de
// test SMTP : le port 25 est fermé chez Vercel), la règle « adresse du site »
// d'engine.ts (`emailSiteMatch`) couvre une bonne partie de ces cas.

import { promises as dns } from 'node:dns'

export type MxVerdict = 'ok' | 'sans_mx' | 'incertain'

/** Codes DNS qui disent « ce domaine ne reçoit pas de courrier » (le reste : on ne sait pas). */
const DEAD_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN'])

/** Verdict d'après la réponse DNS (règle pure, testée). */
export function mxVerdict(result: { records?: Array<{ exchange: string }>; errorCode?: string | null }): MxVerdict {
  if (result.errorCode) return DEAD_CODES.has(result.errorCode) ? 'sans_mx' : 'incertain'
  const usable = (result.records ?? []).filter(r => r.exchange && r.exchange !== '.')
  // MX nul (RFC 7505, « 0 . ») : le domaine refuse tout courrier
  return usable.length ? 'ok' : 'sans_mx'
}

/** Domaine de l'adresse → verdict, avec un cache par passage et 4 s au plus. */
export async function checkMx(email: string, cache: Map<string, MxVerdict> = new Map()): Promise<MxVerdict> {
  const domain = String(email).toLowerCase().split('@')[1] ?? ''
  if (!domain) return 'sans_mx'
  const known = cache.get(domain)
  if (known) return known
  let verdict: MxVerdict
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(Object.assign(new Error('délai'), { code: 'ETIMEOUT' })), 4_000)),
    ])
    verdict = mxVerdict({ records })
  } catch (e) {
    verdict = mxVerdict({ errorCode: (e as { code?: string })?.code ?? 'EUNKNOWN' })
  }
  cache.set(domain, verdict)
  return verdict
}
