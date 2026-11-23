// Attestation de fin de formation (23/11/2026, docs/claude/formations.md).
// Visible par le membre seulement, quand la formation est terminée à 100 %.
// Attestation de suivi : ce n'est pas une certification officielle.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import TitleSetter from '@/components/layout/TitleSetter'
import { FORMATION_CONTENT_MAP } from '@/app/dashboard/admin/formations/[slug]/contentMap'
import PrintButton from './PrintButton'
import InlineStyle from '@/components/ui/InlineStyle'

export const metadata = { title: 'Mon attestation de formation', robots: { index: false, follow: false } }

export default async function AttestationPage({ params }: { params: { slug: string } }) {
  const content = FORMATION_CONTENT_MAP[params.slug]
  if (!content) notFound()
  const profile = await getProfile()
  if (!profile) return null
  const supabase = await createClient()

  const { data: formation } = await supabase.from('formations').select('id, title, duration').eq('slug', params.slug).maybeSingle()
  if (!formation) notFound()
  const [{ data: uf }, answersRes] = await Promise.all([
    supabase.from('user_formations').select('id, progress, completed_at, enrolled_at').eq('user_id', profile.userId).eq('formation_id', formation.id).maybeSingle(),
    supabase.from('formation_answers').select('correct').eq('user_id', profile.userId).eq('formation_id', formation.id),
  ])

  const back = `/dashboard/formations/${params.slug}`
  if (!uf || (uf.progress ?? 0) < 100) {
    return (
      <div style={{ padding: 'clamp(24px,4vw,48px)', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <TitleSetter title="Mon attestation" />
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: '28px', margin: 0, color: 'var(--text)' }}>Ton attestation t&apos;attend</h1>
        <p style={{ color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>Termine toutes les leçons de « {formation.title} » et ton attestation à ton nom sera prête ici.</p>
        <Link href={back} className="btn-primary" style={{ alignSelf: 'flex-start', textDecoration: 'none', padding: '11px 20px', fontSize: '14px' }}>Continuer la formation</Link>
      </div>
    )
  }

  const answers = (answersRes.data ?? []) as Array<{ correct: boolean }>
  const good = answers.filter(a => a.correct).length
  const name = profile.full_name?.trim() || 'Membre Jason Marinho'
  const date = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(uf.completed_at ?? new Date().toISOString()))
  const ref = `JM-${String(uf.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`

  return (
    <div className="att-page" style={{ padding: 'clamp(20px,4vw,48px)', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
      <TitleSetter title="Mon attestation" />
      <InlineStyle css={ATTESTATION_CSS} />
      <div style={{ width: 'min(880px, 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Link href={back} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)', fontSize: '13px', textDecoration: 'none' }}><ArrowLeft size={15} /> Retour à la formation</Link>
        <PrintButton />
      </div>

      <section className="att" aria-label="Attestation de formation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
          <span style={{ fontSize: 'clamp(10px,1.4vw,12px)', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, color: '#004C3F' }}>Jason Marinho · Location courte durée</span>
          <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,4.6vw,46px)', lineHeight: 1.05, color: '#14201C' }}>Attestation de formation</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
          <span style={{ fontSize: 'clamp(12px,1.6vw,15px)', color: '#4B5953' }}>Décernée à</span>
          <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,4vw,40px)', color: '#004C3F', lineHeight: 1.1 }}>{name}</span>
          <span style={{ fontSize: 'clamp(12px,1.6vw,15px)', color: '#4B5953', maxWidth: '60ch', lineHeight: 1.5 }}>
            pour avoir suivi l&apos;ensemble de la formation <b style={{ color: '#14201C' }}>« {formation.title} »</b> ({formation.duration}){answers.length > 0 ? `, avec ${good} bonnes réponses sur ${answers.length} aux questions de vérification` : ''}.
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 18px', position: 'relative', maxWidth: '78%' }}>
          {content.objectifs.slice(0, 6).map((o, i) => (
            <li key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', fontSize: 'clamp(10.5px,1.3vw,12.5px)', color: '#14201C', lineHeight: 1.4 }}>
              <CheckCircle size={14} weight="fill" color="#004C3F" style={{ flexShrink: 0, marginTop: '1px' }} />{o}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 'clamp(18px,5vw,56px)', flexWrap: 'wrap', alignItems: 'flex-end', position: 'relative' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontStyle: 'italic', fontSize: 'clamp(18px,2.6vw,26px)', color: '#004C3F' }}>Jason Marinho</span>
            <span style={{ fontSize: '11px', color: '#4B5953', borderTop: '1px solid #C9D2CC', paddingTop: '4px' }}>Fondateur, formateur LCD</span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: '#4B5953' }}>
            <span>Le {date}</span>
            <span>Référence {ref}</span>
          </span>
        </div>
        <div className="att-seal">Formation<br />terminée</div>
      </section>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, maxWidth: '880px' }}>Attestation de suivi délivrée par la plateforme Jason Marinho. Ce n&apos;est pas un diplôme ni une certification professionnelle.</p>
    </div>
  )
}

const ATTESTATION_CSS = `
        .att { width: min(880px, 100%); aspect-ratio: 1.414; background: #FBFAF6; color: #14201C; border-radius: 6px; position: relative; padding: clamp(22px, 5vw, 56px); display: flex; flex-direction: column; justify-content: space-between; gap: 14px; box-shadow: 0 30px 60px -30px rgba(0,0,0,.45); overflow: hidden; }
        .att::before { content: ""; position: absolute; inset: 12px; border: 2px solid #004C3F; border-radius: 3px; pointer-events: none; }
        .att::after { content: ""; position: absolute; inset: 18px; border: 1px solid rgba(0,76,63,.35); border-radius: 2px; pointer-events: none; }
        .att-seal { position: absolute; right: clamp(24px, 6vw, 64px); bottom: clamp(24px, 6vw, 60px); width: clamp(70px, 12vw, 110px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); display: grid; place-items: center; text-align: center; font-size: clamp(9px, 1.3vw, 12px); font-weight: 700; letter-spacing: .08em; color: #3A2A00; text-transform: uppercase; line-height: 1.3; }
        @media (max-width: 640px) { .att { aspect-ratio: auto; } .att-seal { position: static; align-self: flex-end; } }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          .att, .att * { visibility: visible; }
          .att { position: fixed; inset: 0; width: 100%; height: 100%; aspect-ratio: auto; box-shadow: none; border-radius: 0; }
        }
      `
