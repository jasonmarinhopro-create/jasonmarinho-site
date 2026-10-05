// Page serveur « Mes statistiques », partagée par les espaces photographe et
// ménage (05/10/2026). Accès : propriétaire, ou admin avec ?id=.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr'
import { parisToday } from '@/lib/stripe/deposit-window'
import { perfTimer } from '@/lib/perf/server-timing'
import { loadProStats, proStatsPath, resolveProFiche } from '@/lib/visibility/pro-load'
import { parseProPeriod, type ProMetier } from '@/lib/visibility/pro-stats'
import ProStatsView from './ProStatsView'

export default async function ProStatsPage({ metier, searchParams }: {
  metier: ProMetier
  searchParams?: { id?: string; periode?: string }
}) {
  const timer = perfTimer(`page ${proStatsPath(metier)}`)
  const previewId = searchParams?.id ?? null
  const resolved = await resolveProFiche(metier, previewId)
  timer.mark('fiche')
  if (resolved.status === 'login') redirect(`/auth/login?as=${metier === 'photographe' ? 'photographe' : 'menage'}`)
  if (resolved.status === 'redirect') redirect(resolved.to)
  if (resolved.status === 'none') return <NoFiche metier={metier} preview={!!previewId} />

  const data = await loadProStats({
    metier,
    fiche: resolved.fiche,
    db: resolved.db,
    periodKey: parseProPeriod(searchParams?.periode),
    today: parisToday(),
    isAdminPreview: resolved.isAdminPreview,
    isAdmin: resolved.isAdmin,
  })
  timer.mark('statistiques')
  timer.done()

  return <ProStatsView data={data} basePath={proStatsPath(metier)} previewId={resolved.isAdminPreview ? resolved.fiche.id : null} />
}

function NoFiche({ metier, preview }: { metier: ProMetier; preview: boolean }) {
  const photo = metier === 'photographe'
  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <div style={{ maxWidth: 560, margin: '40px auto 0', padding: '32px 28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', marginBottom: 14 }}>
          <ChartLineUp size={26} weight="duotone" />
        </span>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 400, margin: '0 0 10px', color: 'var(--text)' }}>
          {preview ? 'Fiche introuvable' : 'Crée ta fiche'}
        </h1>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.65, fontSize: 14.5, margin: '0 0 22px' }}>
          {preview
            ? 'Cet identifiant ne correspond à aucune fiche.'
            : `Tes statistiques s'affichent ici dès que ta fiche ${photo ? 'photographe' : 'équipe de ménage'} est dans l'annuaire : qui la voit, d'où, et ce que Google en montre.`}
        </p>
        {!preview && (
          <Link href={photo ? '/dashboard/creer-fiche-photographe' : '/dashboard/creer-fiche-menage'} style={{ display: 'inline-flex', padding: '12px 20px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Créer ma fiche
          </Link>
        )}
      </div>
    </div>
  )
}
