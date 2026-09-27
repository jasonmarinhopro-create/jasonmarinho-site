// Détail d'un ménage marqué « terminé » par l'équipe (photos + note), ouvert
// depuis la notification reçue par l'hôte. Visible par l'hôte et par la
// personne qui l'a validé (policy RLS menage_completions_select_parties).
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

export const metadata = { title: 'Ménage terminé' }
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login')

  // Lecture avec le client utilisateur : la RLS garantit l'accès (hôte ou équipe).
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('menage_completions')
    .select('id, host_user_id, cleaner_user_id, logement_nom, date, note, photos, done_at')
    .eq('id', params.id)
    .maybeSingle()
  if (!row) notFound()

  // Photos du bucket privé : URL signées (1 h), générées côté serveur.
  const db = getServiceClient()
  const [{ data: signed }, { data: cleaner }] = await Promise.all([
    row.photos?.length
      ? db.storage.from('menage-photos').createSignedUrls(row.photos, 3600)
      : Promise.resolve({ data: [] as Array<{ signedUrl: string | null }> }),
    row.cleaner_user_id
      ? db.from('cleaners').select('full_name').eq('user_id', row.cleaner_user_id).maybeSingle()
      : Promise.resolve({ data: null as { full_name: string | null } | null }),
  ])
  const urls = (signed ?? []).map(s => s.signedUrl).filter(Boolean) as string[]
  const isHost = row.host_user_id === user.id
  const dateLabel = new Date(row.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const doneLabel = new Date(row.done_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%', maxWidth: 980 }}>
      <Link href={isHost ? '/dashboard/calendrier' : '/dashboard/ma-fiche-menage/planning'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 16 }}>
        <ArrowLeft size={13} /> {isHost ? 'Calendrier' : 'Mes ménages'}
      </Link>
      <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 6px' }}>
        {row.logement_nom}
      </h1>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--success-text)', margin: '0 0 18px' }}>
        <CheckCircle size={16} weight="fill" />
        Ménage du {dateLabel} terminé à {doneLabel}{cleaner?.full_name ? ` par ${cleaner.full_name}` : ''}
      </p>
      {row.note && (
        <blockquote style={{ margin: '0 0 20px', padding: '12px 16px', borderLeft: '3px solid var(--accent)', background: 'var(--surface)', borderRadius: '0 10px 10px 0', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          {row.note}
        </blockquote>
      )}
      {urls.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Aucune photo pour ce ménage.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
          {urls.map(u => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Photo du ménage, ${row.logement_nom}`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
