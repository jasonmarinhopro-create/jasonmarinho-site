import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import MaFicheMenage from './MaFicheMenage'

export const metadata = { title: 'Ma fiche équipe ménage' }
export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

interface PageProps {
  searchParams?: Promise<{ id?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams
  const previewId = sp?.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?as=menage')

  const admin = getServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = profile?.role

  if (role === 'photographer' && !previewId) redirect('/dashboard/ma-fiche-photographe')
  if (role !== 'cleaner' && role !== 'admin') redirect('/dashboard')

  let cleaner: any = null
  let isAdminPreview = false
  if (previewId && role === 'admin') {
    const { data } = await admin
      .from('cleaners')
      .select('*')
      .eq('id', previewId)
      .maybeSingle()
    cleaner = data
    isAdminPreview = true
  } else {
    const { data } = await admin
      .from('cleaners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    cleaner = data
  }

  if (!cleaner) {
    return (
      <div style={{ padding: 40, maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, marginBottom: 14 }}>
          {previewId ? 'Équipe ménage introuvable' : 'Aucune fiche équipe ménage rattachée'}
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>
          {previewId
            ? `L'identifiant ${previewId} ne correspond à aucune fiche.`
            : <>Ton compte existe mais aucune fiche n'y est associée. Inscris-toi à nouveau depuis le site public ou contacte <a href="mailto:contact@jasonmarinho.com" style={{ color: 'var(--accent-text)' }}>contact@jasonmarinho.com</a>.</>
          }
        </p>
        {!previewId && (
          <a href="https://jasonmarinho.com/annuaires/menage/inscription" style={{ display: 'inline-block', marginTop: 18, padding: '10px 18px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
            Créer ma fiche
          </a>
        )}
      </div>
    )
  }

  const createdAt = new Date(cleaner.created_at)
  const daysActive = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000))

  return (
    <MaFicheMenage
      cleaner={cleaner}
      kpis={{
        views: cleaner.views_count ?? 0,
        contacts: cleaner.contacts_count ?? 0,
        daysActive,
      }}
      isAdminPreview={isAdminPreview}
    />
  )
}
