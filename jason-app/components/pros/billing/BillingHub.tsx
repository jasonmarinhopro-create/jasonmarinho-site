'use client'

// Accueil « Devis » des pros (photographes, équipes ménage), 04/10/2026.
// Décision de Jason : l'app fait les devis (hors réforme de la facture
// électronique), la facture se fait ensuite dans un outil agréé (Tiime, Indy
// ou celui du pro, encart InvoicingCard). Chiffres de l'année, liste
// filtrable, création en un clic, infos du pro remplies une seule fois.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Plus, MagnifyingGlass, CaretRight, PencilSimple, ShieldCheck, Lightning,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import BillingSettings from './BillingSettings'
import InvoicingCard from './InvoicingCard'
import { statusLabel, statusStyle } from './status'
import {
  displayStatus, eur, frDate, missingProfileFields, sellerDisplayName, yearStats,
  type BillingProfile, type DisplayStatus, type ProDocument, type ProKind,
} from '@/lib/pros/billing'

type Filter = 'tous' | 'en_attente' | 'accepte' | 'brouillon' | 'clos'

export default function BillingHub({ kind, base, guideHref, docs, profile: initialProfile, profileSaved, today, tableMissing }: {
  kind: ProKind
  base: string
  guideHref: string
  docs: ProDocument[]
  profile: BillingProfile
  profileSaved: boolean
  today: string
  tableMissing: boolean
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [saved, setSaved] = useState(profileSaved)
  const [showSettings, setShowSettings] = useState(false)
  const [filter, setFilter] = useState<Filter>('tous')
  const [q, setQ] = useState('')

  const stats = useMemo(() => yearStats(docs, today), [docs, today])
  const missing = missingProfileFields(saved ? profile : null)
  const year = today.slice(0, 4)

  const rows = useMemo(() => docs.map(d => ({ d, st: displayStatus(d, today) })), [docs, today])
  const match = (f: Filter, st: DisplayStatus) =>
    f === 'tous' || (f === 'clos' ? st === 'refuse' || st === 'expire' : st === f)
  const filtered = rows.filter(({ d, st }) => {
    if (!match(filter, st)) return false
    if (q.trim()) {
      const hay = `${d.number ?? ''} ${d.client_name ?? ''} ${d.title ?? ''}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const chips: Array<[Filter, string]> = [['tous', 'Tous'], ['en_attente', 'En attente'], ['accepte', 'Acceptés'], ['brouillon', 'Brouillons'], ['clos', 'Refusés ou expirés']]
  const count = (f: Filter) => rows.filter(r => match(f, r.st)).length

  if (tableMissing) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.card, padding: 28 }}>
          <div style={s.cardTitle}>Les devis arrivent très bientôt</div>
          <p style={s.muted}>L&apos;outil est prêt, il reste une mise à jour technique à faire de notre côté. Reviens dans quelques heures.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <HubHero
        eyebrowIcon={<FileText size={14} weight="bold" />}
        eyebrow="Devis"
        title={<>Tes devis, <HeroEm>prêts en 2 minutes</HeroEm></>}
        desc="Un devis propre envoyé par e-mail, que ton client accepte en ligne en un clic. Tes prestations habituelles sont proposées, les mentions obligatoires ajoutées pour toi."
        steps={[
          ['Crée', 'ton devis à partir de tes prestations'],
          ['Envoie', 'le lien : ton client l\'accepte en ligne'],
          ['Facture', 'ensuite dans ton outil de facturation'],
        ]}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0, gap: 12 }}>
            <div style={s.asideTitle}>En {year}</div>
            <Stat label="Devis envoyés" value={String(stats.envoyes)} />
            <Stat label="Acceptés" value={stats.acceptes ? `${eur(stats.montantAccepte)} (${stats.acceptes})` : '0'} strong />
            <Stat label="En attente de réponse" value={stats.enAttente ? `${eur(stats.montantEnAttente)} (${stats.enAttente})` : 'Aucun'} />
            {stats.tauxAcceptation !== null && <Stat label="Taux d&apos;acceptation" value={`${stats.tauxAcceptation} %`} />}
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href={`${base}/nouveau`} style={heroCta}><Plus size={16} weight="bold" /> Nouveau devis</Link>
        </div>
      </HubHero>

      {missing.length > 0 && (
        <div style={s.setup}>
          <span style={s.setupIcon}><Lightning size={18} weight="fill" /></span>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14.5 }}>Avant ton premier devis, 1 minute de réglages</div>
            <div style={s.muted}>Il manque {missing.join(', ')}. Ces infos apparaissent sur chaque devis.</div>
          </div>
          <button onClick={() => setShowSettings(true)} className="btn-primary">Compléter mes infos</button>
        </div>
      )}

      <div style={s.cols}>
        <section style={{ ...s.card, flex: '999 1 560px', minWidth: 0 }}>
          <div style={s.toolbar}>
            <div style={s.chips}>
              {chips.map(([f, l]) => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...s.chip, ...(filter === f ? s.chipOn : {}) }}>
                  {l} <span style={s.chipCount}>{count(f)}</span>
                </button>
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
              {!docs.length && <Link href={`${base}/nouveau`} className="btn-primary" style={{ marginTop: 6, textDecoration: 'none' }}><Plus size={15} weight="bold" /> Créer un devis</Link>}
            </div>
          ) : (
            <ul style={s.list}>
              {filtered.map(({ d, st }) => (
                <li key={d.id}>
                  <Link href={`${base}/${d.id}`} style={s.row} className="billing-row">
                    <span style={s.kindIcon}><FileText size={18} weight="bold" /></span>
                    <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <span style={s.rowTitle}>{d.client_name || 'Client à renseigner'}</span>
                      <span style={s.rowSub}>{d.number ?? 'Brouillon'}{d.title ? ` · ${d.title}` : ''}</span>
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
              <div style={s.cardTitle}>Mes infos sur les devis</div>
              <button onClick={() => setShowSettings(true)} style={s.editBtn}><PencilSimple size={14} weight="bold" /> Modifier</button>
            </div>
            {saved ? (
              <div style={s.infoList}>
                <Info2 k="Nom" v={sellerDisplayName(profile) || 'À compléter'} />
                {profile.trade_name && <Info2 k="Nom commercial" v={profile.trade_name} />}
                <Info2 k="SIRET" v={profile.siret || 'À compléter'} warn={!profile.siret} />
                <Info2 k="Adresse" v={profile.address || 'À compléter'} warn={!profile.address} />
                <Info2 k="TVA" v={profile.vat_mode === 'franchise' ? 'Non applicable (franchise)' : `${String(profile.default_vat_rate).replace('.', ',')} %`} />
                <Info2 k="Validité" v={`${profile.quote_validity_days} jours`} />
              </div>
            ) : (
              <p style={s.muted}>Nom, SIRET, adresse et TVA : à remplir une fois, repris sur tous tes devis.</p>
            )}
          </section>

          <InvoicingCard
            kind={kind} hasTool={profile.has_invoicing_tool} tool={profile.invoicing_tool} guideHref={guideHref}
            onChange={has => setProfile(p => ({ ...p, has_invoicing_tool: has }))}
          />

          <section style={s.card}>
            <div style={s.cardTitle}><ShieldCheck size={17} weight="bold" color="var(--accent-text)" style={{ verticalAlign: -3, marginRight: 6 }} />Ce que l&apos;outil gère pour toi</div>
            <ul style={s.tips}>
              <li>Un numéro par devis, une série par année (D{year}-0001…).</li>
              <li>Mentions ajoutées selon ton statut : « EI », franchise de TVA, date de validité.</li>
              <li>Ton client accepte en ligne : date et nom gardés sur le devis, et tu es prévenu.</li>
              <li>Un devis envoyé ne se modifie plus : duplique-le pour faire une nouvelle version.</li>
            </ul>
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

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: strong ? 18 : 15, fontWeight: 700, color: strong ? 'var(--accent-text)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
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
  setup: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 18px', borderRadius: 16, background: 'color-mix(in srgb, #FFD56B 18%, var(--surface))', border: '1px solid color-mix(in srgb, #FFD56B 55%, transparent)' },
  setupIcon: { width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-text)', color: '#FFD56B', flexShrink: 0 },
  cols: { display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' },
  side: { flex: '1 1 320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' },
  muted: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },
  toolbar: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' },
  chipCount: { fontSize: 11, fontWeight: 700, marginLeft: 4, opacity: 0.7 },
  chipOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', flex: '0 1 240px', minWidth: 160 },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text)', width: '100%' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 12, textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' },
  kindIcon: { width: 38, height: 38, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F', flexShrink: 0 },
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
