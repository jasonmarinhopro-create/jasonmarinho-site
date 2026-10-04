'use client'

// Accueil « Devis & factures » des pros (photographes, équipes ménage),
// 04/10/2026. Inspiré des outils de facturation des indépendants (Tiime,
// Abby, Henrri) : chiffres de l'année en un coup d'œil, liste filtrable par
// statut, création en un clic, infos de facturation remplies une seule fois.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Receipt, FileText, Plus, MagnifyingGlass, CaretRight, PencilSimple, WarningCircle,
  ShieldCheck, ArrowCounterClockwise, Lightning, Info,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import BillingSettings from './BillingSettings'
import { statusLabel, statusStyle } from './status'
import {
  DOC_LABEL, displayStatus, eur, frDate, missingProfileFields, sellerDisplayName, yearStats,
  type BillingProfile, type DisplayStatus, type ProDocument, type ProKind,
} from '@/lib/pros/billing'

type Tab = 'tous' | 'devis' | 'facture'
type Filter = 'tous' | 'a_traiter' | DisplayStatus

export default function BillingHub({ kind, base, docs, profile: initialProfile, profileSaved, today, tableMissing, tvaThreshold, microThreshold }: {
  kind: ProKind
  base: string
  docs: ProDocument[]
  profile: BillingProfile
  profileSaved: boolean
  today: string
  tableMissing: boolean
  tvaThreshold: number
  microThreshold: number
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [saved, setSaved] = useState(profileSaved)
  const [showSettings, setShowSettings] = useState(false)
  const [tab, setTab] = useState<Tab>('tous')
  const [filter, setFilter] = useState<Filter>('tous')
  const [q, setQ] = useState('')

  const stats = useMemo(() => yearStats(docs, today), [docs, today])
  const missing = missingProfileFields(saved ? profile : null)
  const year = today.slice(0, 4)

  const rows = useMemo(() => docs.map(d => ({ d, st: displayStatus(d, today) })), [docs, today])
  const counts = {
    tous: rows.length,
    devis: rows.filter(r => r.d.kind === 'devis').length,
    facture: rows.filter(r => r.d.kind !== 'devis').length,
  }
  const isTodo = (st: DisplayStatus) => st === 'brouillon' || st === 'en_retard' || st === 'en_attente' || st === 'a_encaisser'
  const filtered = rows.filter(({ d, st }) => {
    if (tab === 'devis' && d.kind !== 'devis') return false
    if (tab === 'facture' && d.kind === 'devis') return false
    if (filter === 'a_traiter' && !isTodo(st)) return false
    if (filter !== 'tous' && filter !== 'a_traiter' && st !== filter) return false
    if (q.trim()) {
      const hay = `${d.number ?? ''} ${d.client_name ?? ''} ${d.title ?? ''}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const filterChips: Array<[Filter, string]> = tab === 'devis'
    ? [['tous', 'Tous'], ['a_traiter', 'À traiter'], ['en_attente', 'En attente'], ['accepte', 'Acceptés'], ['brouillon', 'Brouillons']]
    : tab === 'facture'
      ? [['tous', 'Toutes'], ['a_traiter', 'À traiter'], ['a_encaisser', 'À encaisser'], ['en_retard', 'En retard'], ['paye', 'Payées']]
      : [['tous', 'Tout'], ['a_traiter', 'À traiter'], ['brouillon', 'Brouillons']]

  const pctTva = Math.min(100, Math.round((stats.encaisse / tvaThreshold) * 100))

  if (tableMissing) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.card, padding: 28 }}>
          <div style={s.cardTitle}>Devis et factures arrivent très bientôt</div>
          <p style={s.muted}>L&apos;outil est prêt, il reste une mise à jour technique à faire de notre côté. Reviens dans quelques heures.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <HubHero
        eyebrowIcon={<Receipt size={14} weight="bold" />}
        eyebrow="Devis & factures"
        title={<>Tes devis et factures, <HeroEm>prêts en 2 minutes</HeroEm></>}
        desc="Un devis propre envoyé par e-mail, accepté en ligne par ton client, puis transformé en facture en un clic. Les mentions obligatoires sont ajoutées pour toi."
        steps={[
          ['Crée', 'ton devis à partir de tes prestations habituelles'],
          ['Envoie', 'le lien : ton client l\'accepte en ligne, sans imprimer'],
          ['Facture', 'en un clic et suis ce qui est payé'],
        ]}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0, gap: 12 }}>
            <div style={s.asideTitle}>En {year}</div>
            <Stat label="Encaissé" value={eur(stats.encaisse)} strong />
            <Stat label="À encaisser" value={eur(stats.aEncaisser)} hint={stats.nbEnRetard ? `dont ${eur(stats.enRetard)} en retard` : undefined} hintColor="#B4462F" />
            <Stat label="Devis en attente" value={stats.nbDevisEnAttente ? `${stats.nbDevisEnAttente} · ${eur(stats.devisEnAttente)}` : 'Aucun'} />
            {profile.vat_mode === 'franchise' && (
              <div style={{ marginTop: 2 }}>
                <div style={s.barHead}><span>Seuil de franchise de TVA</span><span>{eur(tvaThreshold)}</span></div>
                <div style={s.bar}><div style={{ ...s.barFill, width: `${pctTva}%`, background: pctTva >= 85 ? '#B7791F' : 'var(--accent-text)' }} /></div>
                <div style={s.barNote}>{pctTva} % atteint d&apos;après tes factures payées. Plafond micro-entreprise : {eur(microThreshold)}.</div>
              </div>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href={`${base}/nouveau?type=devis`} style={heroCta}><Plus size={16} weight="bold" /> Nouveau devis</Link>
          <Link href={`${base}/nouveau?type=facture`} style={s.heroSecondary}><Plus size={16} weight="bold" /> Nouvelle facture</Link>
        </div>
      </HubHero>

      {missing.length > 0 && (
        <div style={s.setup}>
          <span style={s.setupIcon}><Lightning size={18} weight="fill" /></span>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14.5 }}>Avant ton premier document, 1 minute de réglages</div>
            <div style={s.muted}>Il manque {missing.join(', ')}. Ces infos apparaissent sur chaque devis et chaque facture.</div>
          </div>
          <button onClick={() => setShowSettings(true)} className="btn-primary">Compléter mes infos</button>
        </div>
      )}

      <div className="billing-cols" style={s.cols}>
        <section style={{ ...s.card, flex: '1 1 560px', minWidth: 0 }}>
          <div style={s.tabs} role="tablist">
            {(['tous', 'devis', 'facture'] as Tab[]).map(t => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setFilter('tous') }}
                style={{ ...s.tab, ...(tab === t ? s.tabOn : {}) }}>
                {t === 'tous' ? 'Tout' : t === 'devis' ? 'Devis' : 'Factures'} <span style={s.tabCount}>{counts[t]}</span>
              </button>
            ))}
          </div>
          <div style={s.toolbar}>
            <div style={s.chips}>
              {filterChips.map(([f, l]) => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...s.chip, ...(filter === f ? s.chipOn : {}) }}>{l}</button>
              ))}
            </div>
            <label style={s.search}>
              <MagnifyingGlass size={15} color="var(--text-muted)" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Client, numéro, objet…" style={s.searchInput} />
            </label>
          </div>

          {filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}><FileText size={26} /></div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{docs.length ? 'Rien ici avec ces filtres' : 'Ton premier devis t\'attend'}</div>
              <div style={s.muted}>{docs.length ? 'Change de filtre ou de recherche.' : 'Choisis tes prestations, ajoute ton client, envoie. Ton client reçoit un lien pour accepter en ligne.'}</div>
              {!docs.length && <Link href={`${base}/nouveau?type=devis`} className="btn-primary" style={{ marginTop: 6, textDecoration: 'none' }}><Plus size={15} weight="bold" /> Créer un devis</Link>}
            </div>
          ) : (
            <ul style={s.list}>
              {filtered.map(({ d, st }) => (
                <li key={d.id}>
                  <Link href={`${base}/${d.id}`} style={s.row} className="billing-row">
                    <span style={{ ...s.kindIcon, ...(d.kind === 'devis' ? {} : s.kindIconInv) }}>
                      {d.kind === 'devis' ? <FileText size={18} weight="bold" /> : d.kind === 'avoir' ? <ArrowCounterClockwise size={18} weight="bold" /> : <Receipt size={18} weight="bold" />}
                    </span>
                    <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <span style={s.rowTitle}>{d.client_name || 'Client à renseigner'}</span>
                      <span style={s.rowSub}>
                        {DOC_LABEL[d.kind]} {d.number ?? '(brouillon)'}{d.title ? ` · ${d.title}` : ''}
                      </span>
                    </span>
                    <span className="br-date" style={s.rowDate}>{d.issue_date ? frDate(d.issue_date) : frDate(d.created_at.slice(0, 10))}</span>
                    <span className="br-right" style={s.rowRight}>
                      <span style={s.rowAmount}>{eur(d.total_ttc)}</span>
                      <span style={statusStyle(st)}>{statusLabel(st)}</span>
                    </span>
                    <CaretRight className="br-chev" size={15} color="var(--text-muted)" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside style={s.side}>
          <section style={s.card}>
            <div style={s.sideHead}>
              <div style={s.cardTitle}>Mes infos de facturation</div>
              <button onClick={() => setShowSettings(true)} style={s.editBtn}><PencilSimple size={14} weight="bold" /> Modifier</button>
            </div>
            {saved ? (
              <div style={s.infoList}>
                <Info2 k="Nom" v={sellerDisplayName(profile) || 'À compléter'} />
                {profile.trade_name && <Info2 k="Nom commercial" v={profile.trade_name} />}
                <Info2 k="SIRET" v={profile.siret || 'À compléter'} warn={!profile.siret} />
                <Info2 k="Adresse" v={profile.address || 'À compléter'} warn={!profile.address} />
                <Info2 k="TVA" v={profile.vat_mode === 'franchise' ? 'Non applicable (franchise)' : `${String(profile.default_vat_rate).replace('.', ',')} %`} />
                <Info2 k="IBAN" v={profile.iban ? `${profile.iban.slice(0, 4)} •••• ${profile.iban.slice(-4)}` : 'Non renseigné'} />
                <Info2 k="Paiement" v={profile.payment_days ? `${profile.payment_days} jours` : 'À réception'} />
              </div>
            ) : (
              <p style={s.muted}>Nom, SIRET, adresse, TVA et IBAN : à remplir une fois, repris sur tous tes documents.</p>
            )}
          </section>

          <section style={s.card}>
            <div style={s.cardTitle}><ShieldCheck size={17} weight="bold" color="var(--accent-text)" style={{ verticalAlign: -3, marginRight: 6 }} />Ce que l&apos;outil gère pour toi</div>
            <ul style={s.tips}>
              <li>Numérotation continue, sans trou, une série par année : obligatoire pour les factures.</li>
              <li>Mentions légales ajoutées selon ton statut et ton client (franchise de TVA, « EI », pénalités et 40 € pour un client professionnel).</li>
              <li>Une facture finalisée ne se modifie plus : en cas d&apos;erreur, tu l&apos;annules par un avoir, en un clic.</li>
              <li>Ton client accepte le devis en ligne : date et nom gardés sur le document.</li>
            </ul>
          </section>

          <section style={{ ...s.card, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
            <div style={s.cardTitle}><Info size={17} weight="bold" color="var(--accent-text)" style={{ verticalAlign: -3, marginRight: 6 }} />Facture électronique en 2027</div>
            <p style={{ ...s.muted, margin: 0 }}>
              Tes factures PDF restent valables jusqu&apos;au 31 août 2027. À partir du 1er septembre 2027, les micro-entreprises devront émettre leurs factures entre professionnels via une plateforme agréée (et déclarer leurs ventes aux particuliers). Des plateformes gratuites existent, comme Tiime ou Indy : on te préviendra avant l&apos;échéance.
            </p>
          </section>
        </aside>
      </div>

      {showSettings && (
        <BillingSettings kind={kind} initial={profile} onClose={() => setShowSettings(false)} onSaved={p => { setProfile(p); setSaved(true) }} />
      )}
      <style>{`
        .billing-row:hover { background: var(--surface-2, rgba(0,76,63,.04)); }
        @media (max-width: 640px) {
          .billing-row .br-date, .billing-row .br-chev { display: none; }
          .billing-row .br-right { flex-direction: column; align-items: flex-end; gap: 4px; }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, strong, hint, hintColor }: { label: string; value: string; strong?: boolean; hint?: string; hintColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ textAlign: 'right' as const }}>
        <span style={{ fontSize: strong ? 20 : 15, fontWeight: 700, color: strong ? 'var(--accent-text)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {hint && <span style={{ display: 'block', fontSize: 11.5, color: hintColor ?? 'var(--text-muted)', fontWeight: 600 }}><WarningCircle size={11} weight="bold" style={{ verticalAlign: -1 }} /> {hint}</span>}
      </span>
    </div>
  )
}

function Info2({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span>
      <span style={{ color: warn ? '#B7791F' : 'var(--text)', fontWeight: 600, textAlign: 'right' as const, overflowWrap: 'anywhere' }}>{v}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  asideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)' },
  heroSecondary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', background: 'var(--surface)' },
  barHead: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginBottom: 6 },
  bar: { height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  barNote: { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 },
  setup: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 18px', borderRadius: 16, background: 'color-mix(in srgb, #FFD56B 18%, var(--surface))', border: '1px solid color-mix(in srgb, #FFD56B 55%, transparent)' },
  setupIcon: { width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-text)', color: '#FFD56B', flexShrink: 0 },
  cols: { display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' },
  side: { flex: '1 1 320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' },
  muted: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },
  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', margin: '-4px -4px 0', overflowX: 'auto' },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '10px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 },
  tabOn: { borderBottom: '2px solid var(--accent-text)', color: 'var(--accent-text)' },
  tabCount: { fontSize: 11.5, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent-text)', marginLeft: 4 },
  toolbar: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' },
  chipOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', flex: '0 1 240px', minWidth: 160 },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text)', width: '100%' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 12, textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' },
  kindIcon: { width: 38, height: 38, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F', flexShrink: 0 },
  kindIconInv: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  rowTitle: { display: 'block', fontWeight: 700, fontSize: 14.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub: { display: 'block', fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowDate: { fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  rowRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  rowAmount: { fontSize: 14.5, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 84, textAlign: 'right' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6, padding: '34px 16px' },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', marginBottom: 6 },
  sideHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' },
  infoList: { display: 'flex', flexDirection: 'column', gap: 8 },
  tips: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 },
}
