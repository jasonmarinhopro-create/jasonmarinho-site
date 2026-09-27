// Garde-fou : la clé service role contourne toutes les règles d'accès (RLS).
// Tout nouveau code doit passer par getServiceClient() (lib/supabase/service.ts,
// server-only) et seulement quand le client utilisateur ne suffit pas.
// Les fichiers ci-dessous lisent encore la clé directement (état de sept. 2026) :
// la liste ne doit que RÉTRÉCIR. Quand tu migres un fichier vers
// getServiceClient() ou vers le client utilisateur, retire-le de la liste.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')
const LEGACY_DIRECT_KEY_FILES = new Set([
  'app/api/admin/live-traffic/route.ts',
  'app/api/calendar/feed/route.ts',
  'app/api/calendar/menage-feed/route.ts',
  'app/api/contracts/sign/route.ts',
  'app/api/cron/notifications-engine/route.ts',
  'app/api/cron/ping-db/route.ts',
  'app/api/errors/route.ts',
  'app/api/founder-seats/route.ts',
  'app/api/register/route.ts',
  'app/api/send-reset-email/route.ts',
  'app/api/stripe/deposit/redirect/route.ts',
  'app/api/stripe/payment/redirect/route.ts',
  'app/api/stripe/subscribe/portal/route.ts',
  'app/api/stripe/subscribe/reactivate/route.ts',
  'app/api/stripe/subscribe/switch-interval/route.ts',
  'app/auth/login/actions.ts',
  'app/checkin/[token]/page.tsx',
  'app/dashboard/abonnement/actions.ts',
  'app/dashboard/admin/actualites/actions.ts',
  'app/dashboard/admin/communaute/actions.ts',
  'app/dashboard/admin/formations/[slug]/actions.ts',
  'app/dashboard/admin/formations/actions.ts',
  'app/dashboard/admin/gabarits/actions.ts',
  'app/dashboard/admin/indexation/page.tsx',
  'app/dashboard/admin/investisseurs/page.tsx',
  'app/dashboard/admin/membres/page.tsx',
  'app/dashboard/admin/menage/actions.ts',
  'app/dashboard/admin/photographes/actions.ts',
  'app/dashboard/admin/signalements/moderation-actions.ts',
  'app/dashboard/admin/social/page.tsx',
  'app/dashboard/profil/actions.ts',
  'app/dashboard/recommander/actions.ts',
  'app/invoice/[token]/page.tsx',
  'app/sign/[token]/page.tsx',
  'lib/errors/server-report.ts',
  'lib/lcd/dashboard-prefill.ts',
  'lib/notifications/create.ts',
  'lib/notifications/rules.ts',
  'lib/onboarding/persist-complete.ts',
  'lib/queries/cache.ts',
  'lib/security/crypto.ts',
])

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules' && !e.name.startsWith('.')) walk(p, out) }
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.ts$/.test(e.name)) out.push(p)
  }
  return out
}
const files = ['app', 'lib', 'components'].flatMap(d => walk(path.join(ROOT, d)))
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/')

describe('clé service role', () => {
  it('aucun nouveau fichier ne lit SUPABASE_SERVICE_ROLE_KEY directement', () => {
    const offenders = files
      .filter(f => fs.readFileSync(f, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'))
      .map(rel)
      .filter(f => f !== 'lib/supabase/service.ts' && !LEGACY_DIRECT_KEY_FILES.has(f))
    expect(offenders, 'Utilise getServiceClient() de @/lib/supabase/service (ou mieux, le client utilisateur)').toEqual([])
  })

  it('aucun composant client n’importe le client service role', () => {
    const offenders = files
      .filter(f => /^\s*['"]use client['"]/.test(fs.readFileSync(f, 'utf8')) && fs.readFileSync(f, 'utf8').includes('@/lib/supabase/service'))
      .map(rel)
    expect(offenders).toEqual([])
  })
})
