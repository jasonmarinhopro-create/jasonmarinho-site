import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ProfilForm from './ProfilForm'
import ChezNousIdentity from './ChezNousIdentity'

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Membre Driing':  { label: 'Membre Driing',  color: '#FFD56B', bg: 'rgba(255,213,107,0.14)', dot: '#FFD56B' },
  'Standard':       { label: 'Standard',        color: '#34D399', bg: 'rgba(52,211,153,0.12)',  dot: '#34D399' },
  'Administrateur': { label: 'Administrateur',  color: '#C084FC', bg: 'rgba(192,132,252,0.12)', dot: '#C084FC' },
  'Découverte':     { label: 'Découverte',      color: 'var(--text-3)', bg: 'var(--border)',    dot: '#6b7280' },
}

function fmtMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
  } catch { return '' }
}

export default async function ProfilPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) redirect('/auth/login')

  const userId = profile.userId

  const [{ data: { session } }, { data: pd }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, iban, bic, adresse, pseudo, bio, privacy_show_logements, privacy_show_platforms, privacy_show_city')
      .eq('id', userId)
      .maybeSingle(),
  ])

  const email       = session?.user?.email ?? ''
  const createdAt   = session?.user?.created_at ?? ''
  const fullName    = profile.full_name ?? ''
  const initials    = fullName
    ? fullName.split(/\s+/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  const planLabel = profile.role === 'admin' ? 'Administrateur'
    : profile.plan === 'driing'    ? 'Membre Driing'
    : profile.plan === 'standard'  ? 'Standard'
    : 'Découverte'

  const badge = PLAN_BADGE[planLabel] ?? PLAN_BADGE['Découverte']

  return (
    <>
      <style>{`
        .profil-page {
          padding: clamp(20px,3vw,44px);
          width: 100%;
          max-width: 800px;
        }
        .profil-hero {
          display: flex;
          align-items: center;
          gap: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: clamp(24px,3vw,36px);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .profil-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, var(--accent-bg) 0%, transparent 70%);
          pointer-events: none;
        }
        .profil-hero-av {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(0,76,63,0.45);
          border: 2px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-fraunces), serif;
          font-size: 28px; font-weight: 600;
          color: var(--accent-text);
          flex-shrink: 0;
          position: relative; z-index: 1;
        }
        .profil-hero-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .profil-hero-name {
          font-family: var(--font-fraunces), serif;
          font-size: clamp(20px,2.5vw,26px);
          font-weight: 400; color: var(--text);
          margin: 0 0 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .profil-hero-email {
          font-size: 13px; color: var(--text-3);
          margin: 0 0 12px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .profil-hero-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .profil-plan-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
          padding: 4px 10px; border-radius: 100px;
        }
        .profil-plan-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .profil-since {
          font-size: 12px; color: var(--text-muted);
          background: var(--bg); border: 1px solid var(--border);
          padding: 4px 10px; border-radius: 100px;
        }
        .profil-sections { display: flex; flex-direction: column; gap: 16px; }

        @media (max-width: 560px) {
          .profil-hero { flex-direction: column; align-items: flex-start; gap: 16px; }
          .profil-hero-av { width: 64px; height: 64px; font-size: 22px; }
        }
      `}</style>

      <div className="profil-page">
        {/* ── Hero card ── */}
        <div className="profil-hero fade-up">
          <div className="profil-hero-av">{initials}</div>
          <div className="profil-hero-info">
            <h2 className="profil-hero-name">{fullName || email}</h2>
            <p className="profil-hero-email">{email}</p>
            <div className="profil-hero-badges">
              <span
                className="profil-plan-badge"
                style={{ background: badge.bg, color: badge.color }}
              >
                <span className="profil-plan-dot" style={{ background: badge.dot }} />
                {badge.label}
              </span>
              {createdAt && (
                <span className="profil-since">
                  Membre depuis {fmtMemberSince(createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section cards ── */}
        <div className="profil-sections">
          <ProfilForm
            initialFullName={fullName}
            email={email}
            stripeAccountId={pd?.stripe_account_id ?? null}
            stripeComplete={pd?.stripe_onboarding_complete ?? false}
            initialIban={pd?.iban ?? ''}
            initialBic={pd?.bic ?? ''}
            initialAdresse={pd?.adresse ?? ''}
          />
          <ChezNousIdentity
            initialPseudo={pd?.pseudo ?? ''}
            initialBio={pd?.bio ?? ''}
            firstName={fullName.split(/\s+/)[0] ?? ''}
            initialPrivacy={{
              show_logements: pd?.privacy_show_logements ?? true,
              show_platforms: pd?.privacy_show_platforms ?? true,
              show_city:      pd?.privacy_show_city ?? true,
            }}
          />
        </div>
      </div>
    </>
  )
}
