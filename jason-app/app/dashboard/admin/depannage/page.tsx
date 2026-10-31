// Admin « Dépannage et maintenance » (31/10/2026, ouverture du 3e annuaire) :
// liste des fiches par statut, lien vers l'aperçu admin de chaque fiche (Ma
// fiche ?id=). Actions (étape 4) : masquer, réactiver, supprimer une
// inscription jamais payée (lib/pros/admin-fiche.ts, commun aux 3 métiers).
// Fiches d'exemple (comptes admin) à part, hors chiffres et places Fondateur.
// Rien des demandes reçues ni du carnet clients d'un pro (confidentialité).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { METIERS, SPECIALITES_DEPANNAGE } from '@/lib/pros/metiers'
import { Wrench, ArrowSquareOut, Eye } from '@phosphor-icons/react/dist/ssr'
import { syncProSubscriptions } from '@/lib/pros/subscription-sync'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'
import { isUnpaidFiche } from '@/lib/pros/paid'
import FicheAction from './FicheActions'

export const metadata = { title: 'Dépannage, Admin' }
export const dynamic = 'force-dynamic'

const M = METIERS.depannage
const STATUTS: Array<[string, string]> = [['active', 'En ligne'], ['pending_payment', 'Paiement à finaliser'], ['hidden', 'Masquées'], ['cancelled', 'Résiliées']]
const spec = (id: string) => SPECIALITES_DEPANNAGE.find(s => s.id === id)?.label ?? id
const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })

type Row = { id: string; user_id: string | null; full_name: string; pseudo: string | null; ville: string; specialites: string[] | null; tier: string; status: string; slug: string | null; created_at: string; views_count: number; contacts_count: number; is_public: boolean; stripe_subscription_id: string | null; stripe_subscription_status: string | null }

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const db = getServiceClient()
  // Statut des abonnements relu chez Stripe avant d'afficher (3 s au plus)
  await syncProSubscriptions(db, 3000)
  const [{ data, error }, admins] = await Promise.all([
    db.from(M.table)
      .select('id, user_id, full_name, pseudo, ville, specialites, tier, status, slug, created_at, views_count, contacts_count, is_public, stripe_subscription_id, stripe_subscription_status')
      .in('status', STATUTS.map(s => s[0]))
      .order('created_at', { ascending: false })
      .limit(500),
    adminUserIds(db),
  ])
  const { real, demo } = splitDemo((data ?? []) as Row[], admins)
  // Une fiche jamais payée n'est pas « en ligne », même marquée active
  const rows = real.map(r => (r.status === 'active' && isUnpaidFiche(r) ? { ...r, status: 'pending_payment' } : r))

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Wrench size={22} weight="duotone" color="var(--accent-text)" />
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 26, margin: 0 }}>Dépannage et maintenance</h1>
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 22px' }}>
        {rows.filter(r => r.status === 'active').length} en ligne, {rows.filter(r => r.tier === 'fondateur' && r.status !== 'cancelled').length} place{rows.filter(r => r.tier === 'fondateur').length > 1 ? 's' : ''} Fondateur prise{rows.filter(r => r.tier === 'fondateur').length > 1 ? 's' : ''} sur 20.{' '}
        <a href={`https://jasonmarinho.com${M.annuaire}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Voir l’annuaire</a>
      </p>
      {error && <p style={{ color: 'var(--danger-text)' }}>Lecture impossible : {error.message}</p>}
      {STATUTS.map(([st, label]) => {
        const list = rows.filter(r => r.status === st)
        if (!list.length) return null
        return (
          <section key={st} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 10px' }}>{label} · {list.length}</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {list.map(r => (
                <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{r.pseudo || r.full_name} <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 13 }}>· {r.ville}{r.tier === 'fondateur' ? ' · Fondateur' : ''}</span></div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{(r.specialites ?? []).map(spec).join(', ') || 'Aucune spécialité'}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Inscrit le {date(r.created_at)} · {r.views_count} vues · {r.contacts_count} demandes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Link href={`${M.espace}?id=${r.id}`} style={btn}><Eye size={14} weight="bold" /> Fiche</Link>
                    {r.slug && r.status === 'active' && <a href={`https://jasonmarinho.com${M.fiche(r.slug)}`} target="_blank" rel="noopener noreferrer" style={btn}><ArrowSquareOut size={14} weight="bold" /> En ligne</a>}
                    {r.status === 'active' && <FicheAction id={r.id} name={r.pseudo || r.full_name} mode="hide" />}
                    {r.status === 'hidden' && <FicheAction id={r.id} name={r.pseudo || r.full_name} mode="unhide" />}
                    {isUnpaidFiche(r) && r.status !== 'hidden' && <FicheAction id={r.id} name={r.pseudo || r.full_name} mode="delete" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      {demo.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '8px 0 0' }}>
          Fiches d’exemple (ton compte admin, jamais publiées ni comptées) :{' '}
          {demo.map((d, i) => <span key={d.id}>{i > 0 && ', '}<Link href={`${M.espace}?id=${d.id}`} style={{ color: 'var(--accent-text)' }}>{d.pseudo || d.full_name}</Link></span>)}
        </p>
      )}
      {!rows.length && !error && <p style={{ color: 'var(--text-2)' }}>Aucune inscription pour l’instant. Les places Fondateur (20) sont toutes libres.</p>}
    </div>
  )
}

const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }
