import Link from 'next/link'
import { CheckCircle, Circle, ArrowRight, UserCircle } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import ProfilForm, { DangerZone } from './ProfilForm'
import AccountCard from './AccountCard'
import ChezNousIdentity from './ChezNousIdentity'
import FiscalContextCard from './FiscalContextCard'
import AbonnementCard from './AbonnementCard'
import type { getSubscriptionDetails } from '@/lib/stripe/subscription-info'

// Page « Mon compte » (refonte sept. 2026, affichage séparé du chargement
// des données pour pouvoir la prévisualiser). Avant : 7 cartes en colonnes
// CSS « masonry » (ordre de lecture imprévisible, zone de suppression du
// compte au milieu), 3 couleurs hors marque, et une jauge « Profil complété »
// dont 40 % tenaient au pseudo et à la bio du forum. Maintenant : à gauche
// ce qui sert aux contrats, aux factures et aux simulations fiscales, à droite
// le compte (connexion, abonnement, profil public), la suppression tout en bas.

export type PlanLabel = 'Découverte' | 'Standard' | 'Membre Driing' | 'Administrateur'

export type ProfilData = {
  userId: string
  email: string
  createdAt: string
  fullName: string
  planLabel: PlanLabel
  subscription: Awaited<ReturnType<typeof getSubscriptionDetails>>
  autresRevenusPro: number | null
  pd: {
    stripe_account_id: string | null
    stripe_onboarding_complete: boolean | null
    iban: string | null
    bic: string | null
    adresse: string | null
    pseudo: string | null
    bio: string | null
    privacy_show_logements: boolean | null
    privacy_show_platforms: boolean | null
    privacy_show_city: boolean | null
    entreprise_numero: string | null
    mention_tva: string | null
  } | null
}

function fmtMemberSince(iso: string): string {
  try { return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', timeZone: 'Europe/Paris' }) } catch { return '' }
}

export default function ProfilView({ userId, email, createdAt, fullName, planLabel, subscription, autresRevenusPro, pd }: ProfilData) {
  const initials = fullName
    ? fullName.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  // Ce dont les contrats et les factures ont besoin, chaque point menant à sa carte
  const checks = [
    { label: 'Nom du bailleur', done: !!fullName.trim(), href: '#identite' },
    { label: 'Adresse du bailleur', done: !!pd?.adresse?.trim(), href: '#identite' },
    { label: 'Un moyen d’encaisser (Stripe ou IBAN)', done: !!(pd?.stripe_onboarding_complete || pd?.iban?.trim()), href: '#stripe' },
    { label: 'Numéro et mention TVA pour les factures', done: !!(pd?.entreprise_numero?.trim() && pd?.mention_tva?.trim()), href: '#facturation' },
  ]
  const done = checks.filter(c => c.done).length
  const ready = done === checks.length

  return (
    <div className="profil-page">
      <style>{`
        .profil-page { padding: 20px var(--dash-page-px) 48px; width: 100%; }
        .profil-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
        .profil-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .profil-layout [id] { scroll-margin-top: 90px; }
        @media (min-width: 1200px) { .profil-layout { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); } }
      `}</style>

      {/* En-tête (DA 28/09/2026) : bandeau vert HubHero comme les autres
          pages ; à droite, ce qui manque encore pour des contrats complets. */}
      <HubHero
        eyebrowIcon={<UserCircle size={14} weight="fill" />}
        eyebrow="Mon compte"
        title={ready ? <>Ton compte est <HeroEm>prêt</HeroEm></> : <>Prépare tes <HeroEm>contrats</HeroEm></>}
        desc="Ce qui apparaît sur tes contrats et tes factures, comment tu encaisses, et ton abonnement. Chaque carte s'enregistre à part."
        aside={
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={s.readyHead}>
              <span style={s.readyTitle}>Prêt pour tes contrats</span>
              <span style={{ ...s.readyCount, color: ready ? 'var(--accent-text)' : 'var(--text)' }}>{done}/{checks.length}</span>
            </div>
            <span style={s.bar}><span style={{ ...s.barFill, width: `${(done / checks.length) * 100}%` }} /></span>
            <ul style={s.readyList}>
              {checks.map(c => (
                <li key={c.label}>
                  {c.done ? (
                    <span style={s.readyDone}><CheckCircle size={15} weight="fill" color="var(--accent-text)" /> {c.label}</span>
                  ) : (
                    <a href={c.href} style={s.readyTodo}><Circle size={15} /> {c.label} <ArrowRight size={11} weight="bold" /></a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <div style={s.who}>
          <div style={s.av}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={s.name}>{fullName || email}</div>
            {fullName && <div style={s.email}>{email}</div>}
          </div>
        </div>
        <div style={s.badges}>
          <span style={s.plan}>{planLabel === 'Administrateur' ? planLabel : `Formule ${planLabel}`}</span>
          {createdAt && <span style={s.since}>Membre depuis {fmtMemberSince(createdAt)}</span>}
          {planLabel === 'Découverte' && <Link href="/dashboard/abonnement" style={s.upgrade}>Passer en Standard <ArrowRight size={12} weight="bold" /></Link>}
        </div>
      </HubHero>

      <div className="profil-layout">
        <div className="profil-col">
          <ProfilForm
            initialFullName={fullName}
            email={email}
            stripeAccountId={pd?.stripe_account_id ?? null}
            stripeComplete={pd?.stripe_onboarding_complete ?? false}
            initialIban={pd?.iban ?? ''}
            initialBic={pd?.bic ?? ''}
            initialAdresse={pd?.adresse ?? ''}
            initialEntrepriseNumero={pd?.entreprise_numero ?? ''}
            initialMentionTva={pd?.mention_tva ?? ''}
          />
          <FiscalContextCard initialValue={autresRevenusPro} />
        </div>
        <div className="profil-col">
          <AccountCard email={email} />
          <AbonnementCard planLabel={planLabel} subscription={subscription} />
          <ChezNousIdentity
            initialPseudo={pd?.pseudo ?? ''}
            initialBio={pd?.bio ?? ''}
            firstName={fullName.split(/\s+/)[0] ?? ''}
            userId={userId}
            initialPrivacy={{
              show_logements: pd?.privacy_show_logements ?? true,
              show_platforms: pd?.privacy_show_platforms ?? true,
              show_city:      pd?.privacy_show_city ?? true,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <DangerZone />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  who: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  av: {
    width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', border: '2px solid var(--accent-border)', color: 'var(--accent-text)',
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 600,
  },
  name: { fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflowWrap: 'anywhere' },
  email: { fontSize: '13px', color: 'var(--text-2)', overflowWrap: 'anywhere' },
  badges: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 10px' },
  plan: { fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', background: 'var(--surface)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: '999px' },
  since: { fontSize: '12px', color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '999px' },
  upgrade: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  readyHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  readyTitle: { fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  readyCount: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 500 },
  bar: { display: 'block', height: 7, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 6, background: 'var(--accent-text)' },
  readyList: { listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' },
  readyDone: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-3)' },
  readyTodo: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
}
