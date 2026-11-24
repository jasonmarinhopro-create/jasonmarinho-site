'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Briefcase, Camera, Broom, Wrench, Star, Eye, ChatCircle, CursorClick, MagnifyingGlass, X,
  SquaresFour, Rows, ArrowSquareOut, PresentationChart, UserCircle, EyeSlash, Trash, CheckCircle,
  Warning, MapPin, CurrencyEur, Clock, Prohibit, Flask, Info, ClockCounterClockwise,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, PINK, BROWN, tint } from '../_ui/theme'
import HubTabBar from '@/components/layout/HubTabBar'
import InlineStyle from '@/components/ui/InlineStyle'
import RelativeTime from '@/components/ui/RelativeTime'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { METIERS, type ProKind } from '@/lib/pros/metiers'
import { filterPros, sortPros, prosKpis, isCounted, type AdminPro, type ProEtat, type ProFiltre, type ProTri } from '@/lib/pros/admin-list'
import { setProHidden, deleteUnpaidPro } from './actions'

const RUST = '#A4502A'
const FOUNDER_QUOTA = 20
const SITE = 'https://jasonmarinho.com'

const KIND_UI: Record<ProKind, { label: string; Icon: typeof Camera; color: string }> = {
  photographer: { label: 'Photo et vidéo', Icon: Camera, color: PINK },
  cleaner: { label: 'Ménage', Icon: Broom, color: BROWN },
  depannage: { label: 'Dépannage', Icon: Wrench, color: RUST },
}
const ETAT_UI: Record<ProEtat, { label: string; color: string; Icon: typeof Camera }> = {
  active: { label: 'En ligne', color: 'var(--accent-text)', Icon: CheckCircle },
  pending_payment: { label: 'Paiement à finaliser', color: AMBER, Icon: Clock },
  hidden: { label: 'Masquée', color: 'var(--text-3)', Icon: EyeSlash },
  cancelled: { label: 'Résiliée', color: 'var(--danger)', Icon: Prohibit },
}
const TRIS: Array<[ProTri, string]> = [['recent', 'Récents'], ['vues', 'Vues'], ['contacts', 'Demandes'], ['nom', 'Nom']]
const SUB_LABEL: Record<string, string> = {
  active: 'Actif', trialing: 'Essai', past_due: 'Paiement en retard', canceled: 'Résilié', unpaid: 'Impayé',
  incomplete: 'Jamais payé', incomplete_expired: 'Jamais payé (expiré)',
}

const VIEW_KEY = 'jm-admin-pros-vue'
const fr = (n: number) => n.toLocaleString('fr-FR')
const euros = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const dateFr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : '-')
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

export default function ProsAdmin({ pros: initial, demo, errors, initialKind }: {
  pros: AdminPro[]
  demo: AdminPro[]
  errors: string[]
  initialKind: ProKind | 'tous'
}) {
  // Copie locale : les actions s'appliquent tout de suite, la page se revalide ensuite
  const [pros, setPros] = useState(initial)
  useEffect(() => setPros(initial), [initial])
  const [kind, setKind] = useState<ProKind | 'tous'>(initialKind)
  const [filtre, setFiltre] = useState<ProFiltre>('tous')
  const [tri, setTri] = useState<ProTri>('recent')
  const [q, setQ] = useState('')
  const [vue, setVue] = useState<'grille' | 'liste'>('grille')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    try { if (localStorage.getItem(VIEW_KEY) === 'liste') setVue('liste') } catch { /* stockage indisponible */ }
  }, [])
  const changeVue = (v: 'grille' | 'liste') => {
    setVue(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* stockage indisponible */ }
  }
  const selectKind = (k: ProKind | 'tous') => {
    setKind(k)
    const url = new URL(window.location.href)
    if (k === 'tous') url.searchParams.delete('metier')
    else url.searchParams.set('metier', METIERS[k].slug)
    window.history.replaceState(null, '', url.toString())
  }

  const kpis = useMemo(() => prosKpis(pros, kind), [pros, kind])
  const list = useMemo(() => sortPros(filterPros(pros, { kind, filtre, q }), tri), [pros, kind, filtre, q, tri])
  const open = pros.find(p => p.id === openId) ?? demo.find(p => p.id === openId) ?? null
  // Paiements à finaliser hors des comptes (Jason, 24/11/2026)
  const count = (k: ProKind | 'tous') => pros.filter(p => isCounted(p) && (k === 'tous' || p.kind === k)).length

  const tabs = (['tous', 'photographer', 'cleaner', 'depannage'] as const).map(k => {
    const ui = k === 'tous' ? { label: 'Tous les pros', Icon: Briefcase } : KIND_UI[k]
    const n = count(k)
    return {
      href: k === 'tous' ? '/dashboard/admin/pros' : `/dashboard/admin/pros?metier=${METIERS[k].slug}`,
      label: ui.label,
      hint: `${n} fiche${n > 1 ? 's' : ''}`,
      Icon: ui.Icon,
      active: kind === k,
      prefetch: false,
      onSelect: () => selectKind(k),
    }
  })

  const etats: Array<{ f: ProFiltre; label: string; value: number; color: string; Icon: typeof Camera }> = [
    { f: 'active', label: 'en ligne', value: kpis.enLigne, color: 'var(--accent-text)', Icon: CheckCircle },
    { f: 'fondateur', label: 'Fondateur', value: kpis.fondateurs, color: AMBER, Icon: Star },
    { f: 'hidden', label: 'masquées', value: kpis.masquees, color: 'var(--text-3)', Icon: EyeSlash },
    { f: 'cancelled', label: 'résiliées', value: kpis.resiliees, color: 'var(--danger)', Icon: Prohibit },
    { f: 'pending_payment', label: 'paiements à finaliser', value: kpis.aFinaliser, color: AMBER, Icon: Clock },
  ]

  return (
    <div style={s.wrap}>
      <InlineStyle css={CSS} />
      <AdminHero
        section="Pros"
        title="Les pros"
        em="de l’annuaire"
        desc={`${kpis.enLigne} fiche${kpis.enLigne > 1 ? 's' : ''} en ligne, ${fr(kpis.vues)} vues et ${fr(kpis.contacts)} demandes reçues. Inscription en libre-service : tu interviens seulement pour masquer, réafficher ou supprimer une inscription jamais payée.`}
        aside={
          <div style={adminAsideCard}>
            <span style={s.asideTitle}>Places Fondateur</span>
            {(Object.keys(KIND_UI) as ProKind[]).map(k => {
              const taken = kpis.placesFondateur[k]
              return (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)' }}>{KIND_UI[k].label}</span>
                    <strong style={{ color: 'var(--text)' }}>{taken}/{FOUNDER_QUOTA}</strong>
                  </div>
                  <div style={s.track}><div style={{ ...s.fill, width: `${Math.min(100, (taken / FOUNDER_QUOTA) * 100)}%`, background: KIND_UI[k].color }} /></div>
                </div>
              )
            })}
            {kpis.placesEnAttente > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Dont {kpis.placesEnAttente} inscription{kpis.placesEnAttente > 1 ? 's' : ''} non payée{kpis.placesEnAttente > 1 ? 's' : ''} (place gardée 7 jours).
              </span>
            )}
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>
              Revenu des fiches payées : <strong style={{ color: 'var(--accent-text)' }}>{euros(kpis.annual)}</strong> par an
            </span>
          </div>
        }
      />

      <HubTabBar tabs={tabs} label="Métiers de l’annuaire" flush />

      {errors.length > 0 && (
        <div role="alert" style={s.err}><Warning size={15} weight="fill" /> Lecture impossible pour : {errors.join(', ')}. Recharge la page dans un instant.</div>
      )}

      <div className="pa-kpis" style={s.kpis}>
        {etats.map(({ f, label, value, color, Icon }) => {
          const active = filtre === f
          // Paiements à finaliser : tuile à part, en pointillés (hors des chiffres)
          const apart = f === 'pending_payment'
          return (
            <button key={f} type="button" onClick={() => setFiltre(active ? 'tous' : f)} aria-pressed={active} title={apart ? 'Inscriptions jamais payées, hors des chiffres' : undefined} style={{
              ...s.kpi,
              border: active ? '1px solid var(--accent-border)' : apart ? '1px dashed var(--border-2)' : '1px solid var(--border)',
              background: active ? 'var(--accent-bg)' : apart ? 'transparent' : 'var(--surface)',
            }}>
              <Icon size={17} weight="fill" color={color} />
              <span style={{ ...s.kpiNum, color }}>{value}</span>
              <span style={s.kpiLabel}>{label}</span>
            </button>
          )
        })}
      </div>

      <div style={s.toolbar}>
        <div style={s.search}>
          <MagnifyingGlass size={15} color="var(--text-3)" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, e-mail ou ville" style={s.searchInput} aria-label="Rechercher un pro" />
          {q && <button type="button" onClick={() => setQ('')} style={s.clear} aria-label="Effacer"><X size={13} /></button>}
        </div>
        <div style={s.seg} role="group" aria-label="Trier">
          {TRIS.map(([t, l]) => (
            <button key={t} type="button" onClick={() => setTri(t)} aria-pressed={tri === t} style={{ ...s.segBtn, ...(tri === t ? s.segOn : null) }}>{l}</button>
          ))}
        </div>
        <div style={{ ...s.seg, marginLeft: 'auto' }} role="group" aria-label="Affichage">
          <button type="button" onClick={() => changeVue('grille')} aria-pressed={vue === 'grille'} title="Fiches" style={{ ...s.segBtn, ...(vue === 'grille' ? s.segOn : null) }}><SquaresFour size={15} weight={vue === 'grille' ? 'fill' : 'regular'} /></button>
          <button type="button" onClick={() => changeVue('liste')} aria-pressed={vue === 'liste'} title="Liste" style={{ ...s.segBtn, ...(vue === 'liste' ? s.segOn : null) }}><Rows size={15} weight={vue === 'liste' ? 'fill' : 'regular'} /></button>
        </div>
      </div>

      {filtre === 'pending_payment' && (
        <div style={s.note}>
          <Info size={16} weight="fill" color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Inscriptions jamais payées : elles ne comptent ni dans les fiches ni dans les chiffres. Une inscription Fondateur garde sa place 7 jours, puis la libère. Tu peux supprimer celles qui ne reviendront pas.</span>
        </div>
      )}

      {filtre !== 'tous' || q ? (
        <p style={s.count}>{list.length} fiche{list.length > 1 ? 's' : ''}{filtre === 'pending_payment' ? '' : ` sur ${kpis.total}`}{filtre !== 'tous' && <> · <button type="button" onClick={() => { setFiltre('tous'); setQ('') }} style={s.reset}>tout afficher</button></>}</p>
      ) : null}

      {list.length === 0 ? (
        <div style={s.empty}>
          {pros.filter(isCounted).length === 0 && filtre === 'tous' && !q && !errors.length ? 'Aucune inscription pour l’instant. Les 20 places Fondateur de chaque métier sont libres.' : 'Aucune fiche ne correspond.'}
        </div>
      ) : vue === 'grille' ? (
        <div className="pa-grid">
          {list.map(p => <Card key={p.id} p={p} onOpen={() => setOpenId(p.id)} showKind={kind === 'tous'} />)}
        </div>
      ) : (
        <div style={s.listBox}>
          {list.map(p => <Line key={p.id} p={p} onOpen={() => setOpenId(p.id)} />)}
        </div>
      )}

      {demo.length > 0 && (
        <div style={s.demo}>
          <Flask size={15} color="var(--text-3)" />
          <span>Fiches d’exemple (ton compte admin, jamais publiées ni comptées) :</span>
          {demo.map(d => (
            <button key={d.id} type="button" onClick={() => setOpenId(d.id)} style={s.demoBtn}>{d.name} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· {KIND_UI[d.kind].label}</span></button>
          ))}
        </div>
      )}

      {open && (
        <Panel
          p={open}
          demo={demo.some(d => d.id === open.id)}
          onClose={() => setOpenId(null)}
          onChange={(id, patch) => setPros(list => list.map(x => (x.id === id ? { ...x, ...patch } : x)))}
          onRemove={id => { setPros(list => list.filter(x => x.id !== id)); setOpenId(null) }}
        />
      )}
    </div>
  )
}

/* ── Fiche carrée ─────────────────────────────────────────────── */

function Cover({ p, size }: { p: AdminPro; size: 'lg' | 'sm' }) {
  const ui = KIND_UI[p.kind]
  const big = size === 'lg'
  return (
    <div style={{
      ...(big ? s.cover : s.avatar),
      background: p.photo
        ? `center / cover no-repeat url(${JSON.stringify(p.photo)})`
        : `radial-gradient(120% 90% at 85% 0%, ${tint(ui.color, 38)}, transparent 60%), linear-gradient(135deg, ${tint(ui.color, 20)}, ${tint(ui.color, 6)})`,
    }}>
      {!p.photo && <span style={{ ...(big ? s.coverInit : s.avatarInit), color: ui.color }}>{initials(p.name)}</span>}
    </div>
  )
}

function EtatBadge({ etat, solid }: { etat: ProEtat; solid?: boolean }) {
  const e = ETAT_UI[etat]
  return (
    <span style={{ ...s.badge, color: e.color, background: solid ? 'var(--surface)' : tint(e.color, 12), boxShadow: solid ? 'var(--card-shadow)' : 'none' }}>
      <e.Icon size={12} weight="fill" /> {e.label}
    </span>
  )
}

function demandesTip(p: AdminPro): string | undefined {
  if (!p.demandes) return undefined
  const { fiche, trouver, enAttente } = p.demandes
  if (!fiche && !trouver) return 'Aucune demande reçue'
  const parts = [`${fiche} depuis sa fiche`, `${trouver} par Trouver un pro`]
  return parts.join(', ') + (enAttente ? `, ${enAttente} pas encore ouverte${enAttente > 1 ? 's' : ''}` : '')
}

function Card({ p, onOpen, showKind }: { p: AdminPro; onOpen: () => void; showKind: boolean }) {
  const ui = KIND_UI[p.kind]
  const M = METIERS[p.kind]
  return (
    <div className="pa-card" style={s.card}>
      <button type="button" onClick={onOpen} style={s.cardMain} aria-label={`Ouvrir la fiche de ${p.name}`}>
        <div style={{ position: 'relative' }}>
          <Cover p={p} size="lg" />
          <span style={{ position: 'absolute', top: 10, left: 10, right: p.tier === 'fondateur' ? 48 : 10, display: 'flex' }}><EtatBadge etat={p.etat} solid /></span>
          {p.tier === 'fondateur' && <span style={s.founder} title="Tarif Fondateur" aria-label="Fondateur"><Star size={12} weight="fill" /><span className="pa-ft">Fondateur</span></span>}
        </div>
        <div style={s.cardBody}>
          {showKind && <span style={{ ...s.kind, color: ui.color }}><ui.Icon size={13} weight="fill" /> {ui.label}</span>}
          <span style={s.cardName}>{p.name}</span>
          <span style={s.cardMeta}><MapPin size={13} /> {p.ville || 'Ville non renseignée'}{p.villes > 1 ? ` · ${p.villes} villes` : ''}</span>
          {p.detail && <span style={s.cardDetail}>{p.detail}</span>}
          <div style={s.cardStats}>
            <span className="pa-tip" data-tip="Vues de la fiche"><Eye size={14} /> {fr(p.views)}</span>
            <span className="pa-tip" data-tip={demandesTip(p) ?? 'Demandes reçues'}><ChatCircle size={14} /> {fr(p.contacts)}</span>
            <span className="pa-tip" data-tip="Clics vers son site ou ses réseaux"><CursorClick size={14} /> {fr(p.clicks)}</span>
          </div>
          <span style={s.cardFoot}>
            <ClockCounterClockwise size={13} />
            {p.lastSeenAt ? <>Vu <RelativeTime iso={p.lastSeenAt} /></> : <>Jamais revenu dans l’app</>}
          </span>
        </div>
      </button>
      <div style={s.cardActions}>
        {p.slug && p.etat === 'active'
          ? <a href={`${SITE}${M.fiche(p.slug)}`} target="_blank" rel="noopener noreferrer" style={s.cardAction}><ArrowSquareOut size={14} weight="bold" /> Voir la fiche</a>
          : <span style={{ ...s.cardAction, color: 'var(--text-3)', cursor: 'default' }} title="La fiche n’est pas en ligne"><EyeSlash size={14} /> Hors ligne</span>}
        <Link prefetch={false} href={`${M.espace}?id=${p.id}`} style={{ ...s.cardAction, borderLeft: '1px solid var(--border)' }}><UserCircle size={14} weight="bold" /> Son espace</Link>
      </div>
    </div>
  )
}

function Line({ p, onOpen }: { p: AdminPro; onOpen: () => void }) {
  const ui = KIND_UI[p.kind]
  return (
    <button type="button" onClick={onOpen} className="pa-line" style={s.line}>
      <Cover p={p} size="sm" />
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 200px' }}>
        <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.name}{p.tier === 'fondateur' && <Star size={12} weight="fill" color={AMBER} aria-label="Fondateur" />}
        </span>
        <span style={s.lineSub}>{p.ville || 'Ville non renseignée'}{p.email ? ` · ${p.email}` : ''}</span>
      </span>
      <span className="pa-l-kind" style={{ ...s.kind, color: ui.color, flex: '0 0 130px' }}><ui.Icon size={13} weight="fill" /> {ui.label}</span>
      <span className="pa-l-etat" style={{ flex: '0 0 170px', display: 'flex', minWidth: 0 }}><EtatBadge etat={p.etat} /></span>
      <span className="pa-l-stats" style={{ ...s.cardStats, flex: '0 0 120px', margin: 0, padding: 0, border: 'none', flexWrap: 'nowrap' }}>
        <span><Eye size={14} /> {fr(p.views)}</span>
        <span className="pa-tip" data-tip={demandesTip(p) ?? 'Demandes reçues'}><ChatCircle size={14} /> {fr(p.contacts)}</span>
      </span>
      <span className="pa-l-date" style={{ ...s.lineSub, flex: '0 0 130px', textAlign: 'right' }}>{p.lastSeenAt ? <>Vu <RelativeTime iso={p.lastSeenAt} /></> : 'Jamais revenu'}</span>
    </button>
  )
}

/* ── Panneau latéral ──────────────────────────────────────────── */

function Panel({ p, demo, onClose, onChange, onRemove }: {
  p: AdminPro
  demo: boolean
  onClose: () => void
  onChange: (id: string, patch: Partial<AdminPro>) => void
  onRemove: (id: string) => void
}) {
  const M = METIERS[p.kind]
  const ui = KIND_UI[p.kind]
  const { confirm, dialog } = useConfirm()
  const [busy, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function hide(hidden: boolean) {
    if (hidden && !(await confirm({ message: `Masquer ${p.name} de l’annuaire ? Son abonnement Stripe reste actif.`, confirmLabel: 'Masquer', danger: true }))) return
    setErr(null)
    const before = p.etat
    onChange(p.id, { etat: hidden ? 'hidden' : 'active' })
    start(async () => {
      const r = await setProHidden(p.kind, p.id, hidden)
      if (r.error) { onChange(p.id, { etat: before }); setErr(r.error) }
    })
  }
  async function remove() {
    if (!(await confirm({ message: `Supprimer définitivement ${p.name} (inscription jamais payée) ? Son compte est aussi supprimé s’il ne sert à rien d’autre (pas de logement ni d’autre fiche).`, confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null)
    start(async () => {
      const r = await deleteUnpaidPro(p.kind, p.id)
      if (r.error) setErr(r.error)
      else onRemove(p.id)
    })
  }

  const rows: Array<[string, React.ReactNode]> = [
    ['Formule', p.tier === 'fondateur' ? 'Fondateur (39,98 € par an à vie)' : 'Standard (79,98 € par an)'],
    ['Abonnement Stripe', p.subStatus ? (SUB_LABEL[p.subStatus] ?? p.subStatus) : 'Aucun'],
    ['Ville', p.ville || '-'],
    ['Villes couvertes', p.villes ? String(p.villes) : '-'],
    ...(p.detail ? [['Activité', p.detail] as [string, React.ReactNode]] : []),
    ...(p.tarif ? [['Tarif affiché', p.tarif] as [string, React.ReactNode]] : []),
    ['Inscrit le', dateFr(p.createdAt)],
  ]

  return (
    <>
      {dialog}
      <div style={s.backdrop} onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={`Fiche de ${p.name}`} className="pa-panel" style={s.panel}>
        <div style={{ position: 'relative' }}>
          <Cover p={p} size="lg" />
          <button type="button" onClick={onClose} style={s.close} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>
        <div style={{ padding: '18px 22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ ...s.kind, color: ui.color }}><ui.Icon size={13} weight="fill" /> {M.nom}</span>
            <h2 style={s.panelName}>{p.name}</h2>
            {p.fullName && p.fullName !== p.name && <span style={s.lineSub}>{p.fullName}</span>}
            {p.email && <span style={s.lineSub}>{p.email}</span>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {demo ? <span style={{ ...s.badge, color: 'var(--text-3)', background: 'var(--bg-2)' }}><Flask size={12} weight="fill" /> Fiche d’exemple</span> : <EtatBadge etat={p.etat} />}
              {p.tier === 'fondateur' && <span style={{ ...s.badge, color: AMBER, background: tint(AMBER, 12) }}><Star size={12} weight="fill" /> Fondateur</span>}
            </div>
          </div>

          <div style={s.panelStats}>
            {[[Eye, p.views, 'vues'], [ChatCircle, p.contacts, 'demandes'], [CursorClick, p.clicks, 'clics']].map(([I, v, l]) => {
              const Ico = I as typeof Eye
              return (
                <div key={l as string} style={s.panelStat}>
                  <Ico size={16} color="var(--accent-text)" />
                  <strong style={{ fontSize: 20, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500 }}>{fr(v as number)}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{l as string}</span>
                </div>
              )
            })}
          </div>

          <dl style={s.dl}>
            {rows.map(([k, v]) => (
              <div key={k} style={s.dlRow}><dt style={s.dt}>{k}</dt><dd style={s.dd}>{v}</dd></div>
            ))}
          </dl>
          {p.demandes && (p.demandes.fiche + p.demandes.trouver) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={s.panelSection}>D’où viennent ses demandes</span>
              <div style={s.split}>
                <div style={{ ...s.splitBar, flex: Math.max(p.demandes.fiche, 0.0001), background: 'var(--accent-text)' }} />
                <div style={{ ...s.splitBar, flex: Math.max(p.demandes.trouver, 0.0001), background: AMBER }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--text-2)' }}>
                <span><span style={{ ...s.dot, background: 'var(--accent-text)' }} /> {p.demandes.fiche} depuis sa fiche</span>
                <span><span style={{ ...s.dot, background: AMBER }} /> {p.demandes.trouver} par Trouver un pro</span>
                {p.demandes.enAttente > 0 && <span style={{ color: 'var(--text-3)' }}>{p.demandes.enAttente} pas encore ouverte{p.demandes.enAttente > 1 ? 's' : ''}</span>}
              </div>
            </div>
          )}

          {p.activity.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={s.panelSection}>Son activité</span>
              <ol style={s.timeline}>
                {p.activity.map((e, i) => (
                  <li key={e.label} style={s.tlItem}>
                    <span style={{ ...s.tlDot, background: i === 0 ? 'var(--accent-text)' : 'var(--border-2)' }} />
                    <span style={{ flex: 1, minWidth: 0, color: 'var(--text)' }}>{e.label}</span>
                    <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }} title={dateFr(e.at)}><RelativeTime iso={e.at} /></span>
                  </li>
                ))}
              </ol>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Dates seulement : le contenu de ses demandes et de son carnet reste privé.</span>
            </div>
          )}

          {p.paid && <span style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center' }}><CurrencyEur size={13} /> Rapporte {euros(p.annual)} par an.</span>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={s.panelSection}>Ouvrir</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Link prefetch={false} href={`${M.espace}?id=${p.id}`} style={s.btn}><UserCircle size={15} weight="bold" /> Son espace</Link>
              {p.etat === 'active' && <Link prefetch={false} href={`${M.espace}/statistiques?id=${p.id}`} style={s.btn}><PresentationChart size={15} weight="bold" /> Statistiques</Link>}
              {p.slug && p.etat === 'active' && !demo && <a href={`${SITE}${M.fiche(p.slug)}`} target="_blank" rel="noopener noreferrer" style={s.btn}><ArrowSquareOut size={15} weight="bold" /> Fiche en ligne</a>}
            </div>
          </div>

          {!demo && (p.etat === 'active' || p.etat === 'hidden' || p.unpaid) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={s.panelSection}>Modération</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.etat === 'active' && <button type="button" disabled={busy} onClick={() => hide(true)} style={s.btn}><EyeSlash size={15} weight="bold" /> Masquer de l’annuaire</button>}
                {p.etat === 'hidden' && <button type="button" disabled={busy} onClick={() => hide(false)} style={s.btnPrimary}><Eye size={15} weight="bold" /> Réafficher</button>}
                {p.unpaid && p.etat !== 'hidden' && <button type="button" disabled={busy} onClick={remove} style={s.btnDanger}><Trash size={15} weight="bold" /> Supprimer l’inscription</button>}
              </div>
              {err && <span role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>{err}</span>}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

/* ── Styles ───────────────────────────────────────────────────── */

const CSS = `
.pa-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.pa-card { transition: transform .18s ease, box-shadow .18s ease, border .18s ease; }
.pa-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border: 1px solid var(--border-2) !important; }
.pa-card:focus-visible, .pa-line:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
.pa-line:hover { background: var(--surface-2) !important; }
.pa-tip { position: relative; display: inline-flex; align-items: center; gap: 4px; }
.pa-tip:hover::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 8px); left: -6px; width: max-content; max-width: 220px; white-space: normal; text-align: center; padding: 7px 10px; border-radius: 9px; background: var(--text); color: var(--bg); font-size: 12px; font-weight: 500; line-height: 1.35; z-index: 5; pointer-events: none; box-shadow: var(--shadow-md); }
.pa-card-act:hover { background: var(--surface-2); color: var(--text); }
.pa-line + .pa-line { border-top: 1px solid var(--border) !important; }
.pa-kpis { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.pa-panel { animation: paIn .22s ease; }
@keyframes paIn { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
@media (max-width: 900px) { .pa-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .pa-l-kind { display: none !important; } }
@media (max-width: 640px) {
  .pa-l-etat { flex: 0 1 auto !important; }
  .pa-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pa-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pa-l-stats, .pa-l-date, .pa-ft { display: none !important; }
  .pa-panel { width: 100% !important; }
}
`

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'var(--font-outfit), sans-serif' },
  asideTitle: { fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' },
  track: { height: 6, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  err: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: tint('var(--danger)', 10), border: '1px solid var(--border)', color: 'var(--danger)', fontSize: 13.5 },
  kpis: { display: 'grid', gap: 10 },
  kpi: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minWidth: 0, flexWrap: 'wrap' },
  kpiNum: { fontSize: 22, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, lineHeight: 1 },
  kpiLabel: { fontSize: 13, color: 'var(--text-2)', minWidth: 0 },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', flex: '1 1 240px', maxWidth: 380, minWidth: 0 },
  searchInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' },
  clear: { border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 2 },
  seg: { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', fontWeight: 600 },
  count: { margin: 0, fontSize: 13, color: 'var(--text-3)' },
  reset: { border: 'none', background: 'none', padding: 0, color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  empty: { padding: '40px 20px', textAlign: 'center', color: 'var(--text-2)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 16, fontSize: 14 },
  card: { display: 'flex', flexDirection: 'column', borderRadius: 18, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', minWidth: 0 },
  cardMain: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', minWidth: 0 },
  cardActions: { display: 'flex', borderTop: '1px solid var(--border)' },
  cardAction: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', minWidth: 0, whiteSpace: 'nowrap' },
  note: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: tint(AMBER, 10), border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
  split: { display: 'flex', gap: 3, height: 8, borderRadius: 999, overflow: 'hidden' },
  splitBar: { height: '100%', borderRadius: 999, minWidth: 4 },
  dot: { display: 'inline-block', width: 8, height: 8, borderRadius: 99, marginRight: 4 },
  timeline: { listStyle: 'none', margin: 0, padding: '4px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' },
  tlItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', fontSize: 13.5, borderTop: '1px solid var(--border)' },
  tlDot: { width: 9, height: 9, borderRadius: 99, flexShrink: 0 },
  cover: { height: 132, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  coverInit: { fontFamily: 'var(--font-fraunces), serif', fontSize: 40, fontWeight: 500, opacity: 0.85 },
  avatar: { width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, fontWeight: 600 },
  founder: { position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, background: AMBER, color: '#fff', fontSize: 11.5, fontWeight: 700 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 5, padding: '14px 16px 14px', flex: 1, minWidth: 0 },
  kind: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
  cardName: { fontSize: 16, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardDetail: { fontSize: 12.5, color: 'var(--text-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' },
  cardStats: { display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)' },
  cardFoot: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', marginTop: 2 },
  listBox: { display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' },
  line: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', width: '100%', flexWrap: 'nowrap', minWidth: 0 },
  lineSub: { fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflowWrap: 'anywhere' },
  demo: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' },
  demoBtn: { border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 999, padding: '4px 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 80 },
  panel: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 100%)', background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 81, overflowY: 'auto', boxShadow: 'var(--shadow-md)' },
  close: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  panelName: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 26, lineHeight: 1.15, overflowWrap: 'anywhere' },
  panelStats: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  panelStat: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' },
  dl: { margin: 0, display: 'flex', flexDirection: 'column', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' },
  dlRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: '1px solid var(--border)' },
  dt: { fontSize: 13, color: 'var(--text-3)', flexShrink: 0 },
  dd: { margin: 0, fontSize: 13.5, color: 'var(--text)', textAlign: 'right', overflowWrap: 'anywhere', minWidth: 0 },
  panelSection: { fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', background: 'var(--surface)', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
