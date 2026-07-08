'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ChartLineUp, TrendUp, MapPin, Calculator, FilePdf, Trash, ArrowRight,
  HouseLine, Plus, CurrencyEur,
} from '@phosphor-icons/react/dist/ssr'
import { estimateRevenue } from '@/lib/lcd/market-benchmarks'
import { deleteInvestorProject, type InvestorProject } from '@/lib/investor/actions'

const TYPE_LABELS: Record<string, string> = {
  studio: 'Studio', t1: 'T1', t2: 'T2', t3: 'T3', maison: 'Maison',
}
const MODE_LABELS: Record<string, string> = {
  'toute-annee': "Toute l'année", 'saisonnier-ete': 'Saisonnier été',
  'saisonnier-hiver': 'Saisonnier hiver', 'weekends': 'Weekends',
}
const PAYS_LABELS: Record<string, string> = {
  FR: 'France', PT: 'Portugal', ES: 'Espagne', IT: 'Italie', BE: 'Belgique', CH: 'Suisse',
}

function eur(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}

export default function InvestirView({ projects, firstName }: { projects: InvestorProject[]; firstName: string | null }) {
  const [items, setItems] = useState(projects)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function remove(id: string) {
    if (!confirm('Supprimer ce projet d\'acquisition ?')) return
    setItems(prev => prev.filter(p => p.id !== id))
    startTransition(async () => { await deleteInvestorProject(id) })
  }

  async function regenPdf(p: InvestorProject) {
    setBusyId(p.id)
    try {
      const res = estimateRevenue({
        pays: p.pays as 'FR', ville: p.ville, typeLogement: p.type_logement,
        nbChambres: p.nb_chambres, mode: p.mode, adrOverride: null,
      })
      const { buildPrevisionnelPdf, previsionnelFileName, DEFAULT_CHARGES } = await import('@/lib/lcd/previsionnel-pdf')
      const doc = buildPrevisionnelPdf({
        result: res,
        paysLabel: PAYS_LABELS[p.pays] ?? p.pays,
        typeLabel: TYPE_LABELS[p.type_logement] ?? p.type_logement,
        nbChambres: p.nb_chambres,
        modeLabel: MODE_LABELS[p.mode] ?? p.mode,
        charges: DEFAULT_CHARGES,
        financing: { prixAchatEur: p.prix_achat, apportEur: null, mensualiteEur: p.mensualite },
        porteurProjet: firstName,
      })
      doc.save(previsionnelFileName(res.city))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={s.page}>
      {/* HERO */}
      <section style={s.hero} className="fade-up">
        <div style={s.heroIcon}><ChartLineUp size={24} weight="fill" /></div>
        <div>
          <h1 style={s.heroTitle}>Espace investisseur{firstName ? `, ${firstName}` : ''}</h1>
          <p style={s.heroDesc}>
            Analyse un bien avant de l&apos;acheter : estime les revenus, la rentabilité, et sors un
            prévisionnel prêt pour ta banque. Quand tu passes à l&apos;achat, tout bascule dans ton espace hôte.
          </p>
        </div>
      </section>

      {/* OUTILS D'ACQUISITION */}
      <div style={s.toolsGrid}>
        <Link href="/dashboard/simulateurs" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}><TrendUp size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Estimer les revenus + PDF banque</div>
            <div style={s.toolDesc}>Revenu annuel, saisonnalité, prévisionnel exportable pour un dossier de prêt.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
        <Link href="/dashboard/calculateurs" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'rgba(147,197,253,0.12)', color: '#93C5FD' }}><MapPin size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Comparer les villes</div>
            <div style={s.toolDesc}>Prix moyen, occupation, potentiel par ville pour cibler où acheter.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
        <Link href="/dashboard/simulateurs" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'rgba(99,214,131,0.12)', color: 'var(--success-1)' }}><Calculator size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Simuler la rentabilité & fiscalité</div>
            <div style={s.toolDesc}>Micro-BIC, LMNP, rentabilité nette, seuils TVA. Teste ton scénario.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
      </div>

      {/* MES PROJETS */}
      <section style={{ marginTop: '28px' }}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Mes projets d&apos;acquisition</h2>
          <Link href="/dashboard/simulateurs" style={s.newBtn}>
            <Plus size={14} weight="bold" /> Nouveau projet
          </Link>
        </div>

        {items.length === 0 ? (
          <div style={s.empty}>
            <ChartLineUp size={38} weight="thin" color="var(--text-muted)" />
            <div style={s.emptyTitle}>Aucun projet pour l&apos;instant</div>
            <div style={s.emptyDesc}>
              Lance une estimation depuis l&apos;estimateur, puis clique <strong>« Sauvegarder ce projet »</strong>.
              Tu le retrouveras ici avec son prévisionnel PDF.
            </div>
            <Link href="/dashboard/simulateurs" style={s.emptyCta}>
              <TrendUp size={15} weight="bold" /> Estimer un premier bien
            </Link>
          </div>
        ) : (
          <div style={s.projectsGrid}>
            {items.map(p => {
              const snap = p.snapshot
              return (
                <div key={p.id} style={s.projectCard} className="glass-card">
                  <div style={s.projectHead}>
                    <div style={{ minWidth: 0 }}>
                      <div style={s.projectName}>{p.nom}</div>
                      <div style={s.projectMeta}>
                        <MapPin size={11} weight="fill" style={{ verticalAlign: '-1px' }} />{' '}
                        {p.ville ?? PAYS_LABELS[p.pays] ?? p.pays} · {TYPE_LABELS[p.type_logement] ?? p.type_logement}
                        {p.nb_chambres > 0 ? ` · ${p.nb_chambres} ch.` : ''}
                      </div>
                    </div>
                    <button onClick={() => remove(p.id)} style={s.trashBtn} aria-label="Supprimer" title="Supprimer">
                      <Trash size={14} />
                    </button>
                  </div>

                  <div style={s.statsRow}>
                    <Stat label="Revenu / an" value={eur(snap?.revenuAnnuel)} strong />
                    <Stat label="Résultat expl." value={eur(snap?.resultatExploitation)} />
                    <Stat label="Rentab. nette" value={snap?.rentabiliteNette != null ? `${snap.rentabiliteNette.toFixed(1)} %` : '—'} />
                  </div>

                  {(p.prix_achat || p.mensualite) && (
                    <div style={s.finLine}>
                      <CurrencyEur size={11} weight="bold" />
                      {p.prix_achat ? `Achat ${eur(p.prix_achat)}` : ''}
                      {p.prix_achat && p.mensualite ? ' · ' : ''}
                      {p.mensualite ? `Crédit ${eur(p.mensualite)}/mois` : ''}
                    </div>
                  )}

                  <button onClick={() => regenPdf(p)} disabled={busyId === p.id} style={s.pdfBtn}>
                    <FilePdf size={14} weight="fill" /> {busyId === p.id ? 'Génération…' : 'Régénérer le PDF banque'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* PONT VERS L'ESPACE HÔTE */}
      <section style={s.bridge} className="fade-up">
        <div style={{ ...s.toolIcon, background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)' }}><HouseLine size={20} weight="fill" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.bridgeTitle}>Tu as acheté un bien ?</div>
          <div style={s.bridgeDesc}>
            Passe en mode Hôte : ajoute ton logement et débloque le pilotage complet (calendrier, réservations,
            contrats, finances). Ton compte reste le même.
          </div>
        </div>
        <Link href="/dashboard/logements" style={s.bridgeBtn}>
          Passer en mode Hôte <ArrowRight size={14} weight="bold" />
        </Link>
      </section>
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statVal, ...(strong ? { color: 'var(--accent-text)' } : {}) }}>{value}</div>
      <div style={s.statLbl}>{label}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px, 2.5vw, 28px)', maxWidth: '1100px', margin: '0 auto' },
  hero: {
    display: 'flex', gap: '16px', alignItems: 'flex-start',
    padding: 'clamp(18px, 2.5vw, 26px)', borderRadius: '16px', marginBottom: '20px',
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99,214,131,0.05) 100%)',
    border: '1px solid var(--accent-border)',
  },
  heroIcon: {
    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px, 2.6vw, 26px)',
    fontWeight: 400, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.01em',
  },
  heroDesc: { fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0, maxWidth: '640px' },

  toolsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '12px' },
  toolCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
    borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none', transition: 'all .18s',
  },
  toolIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toolBody: { flex: 1, minWidth: 0 },
  toolTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  toolDesc: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 },

  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '19px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 13px', borderRadius: '9px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: '12.5px', fontWeight: 600, textDecoration: 'none',
  },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center',
    padding: '40px 20px', borderRadius: '14px', border: '1px dashed var(--border)', background: 'var(--bg-2)',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  emptyDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, maxWidth: '440px' },
  emptyCta: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '6px', padding: '10px 18px',
    borderRadius: '10px', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px',
    fontWeight: 600, textDecoration: 'none',
  },

  projectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '14px' },
  projectCard: { padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  projectHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' },
  projectName: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  projectMeta: { fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' },
  trashBtn: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  stat: { padding: '8px 10px', borderRadius: '9px', background: 'var(--bg-2)', border: '1px solid var(--border)' },
  statVal: { fontSize: '14px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 },
  statLbl: { fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.2px' },
  finLine: { fontSize: '11.5px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '4px' },
  pdfBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px 14px',
    borderRadius: '9px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  bridge: {
    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' as const, marginTop: '28px',
    padding: '18px 20px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--accent-border)',
  },
  bridgeTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  bridgeDesc: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5, maxWidth: '560px' },
  bridgeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '10px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', flexShrink: 0,
  },
}
