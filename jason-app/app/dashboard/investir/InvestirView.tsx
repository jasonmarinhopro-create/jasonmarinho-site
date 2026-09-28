'use client'

import RegulationAlert from '@/components/lcd/RegulationAlert'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ChartLineUp, TrendUp, MapPin, Calculator, FilePdf, Trash, ArrowRight,
  HouseLine, Plus, CurrencyEur,
} from '@phosphor-icons/react/dist/ssr'
import { estimateRevenue } from '@/lib/lcd/market-benchmarks'
import { deleteInvestorProject, type InvestorProject } from '@/lib/investor/actions'
import HubHero, { HeroEm, heroCard, heroCta, heroLink } from '@/components/dashboard/HubHero'
import { useConfirm } from '@/components/ui/ConfirmDialog'

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
  if (n == null) return '-'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}

export default function InvestirView({ projects, firstName }: { projects: InvestorProject[]; firstName: string | null }) {
  const [items, setItems] = useState(projects)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  // Meilleur projet par rentabilité nette (carte à droite du bandeau)
  const withRenta = items.filter(p => p.snapshot?.rentabiliteNette != null)
  const best = withRenta.length ? withRenta.reduce((a, b) => (b.snapshot!.rentabiliteNette! > a.snapshot!.rentabiliteNette! ? b : a)) : null
  const villes = new Set(items.map(p => p.ville ?? p.pays)).size

  async function remove(id: string) {
    const p = items.find(x => x.id === id)
    if (!(await confirm({ message: `Supprimer le projet « ${p?.nom ?? 'sans nom'} » ? Action irréversible.`, confirmLabel: 'Supprimer', danger: true }))) return
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
      {dialog}
      <HubHero
        eyebrowIcon={<ChartLineUp size={14} weight="fill" />}
        eyebrow={firstName ? `Espace investisseur · ${firstName}` : 'Espace investisseur'}
        title={<>Analyse un bien <HeroEm>avant de l&apos;acheter</HeroEm></>}
        desc="Estime les revenus en location courte durée, vérifie la réglementation de la ville et sors un prévisionnel prêt pour ta banque. Quand tu achètes, tout bascule dans ton espace hôte, avec le même compte."
        steps={[['Estime', 'les revenus du bien'], ['Compare', 'les villes'], ['Présente', 'le PDF à ta banque']]}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0 }}>
            <div style={s.asideLabel}>Mes projets</div>
            <div style={s.asideBig}>{items.length === 0 ? 'Aucun projet' : `${items.length} projet${items.length > 1 ? 's' : ''} analysé${items.length > 1 ? 's' : ''}`}</div>
            {items.length > 0 && <div style={s.asideLine}>{villes} ville{villes > 1 ? 's' : ''} étudiée{villes > 1 ? 's' : ''}</div>}
            {best ? (
              <div style={s.asideBest}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Meilleure rentabilité nette</span>
                <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, color: 'var(--accent-text)', lineHeight: 1.1 }}>{best.snapshot!.rentabiliteNette!.toFixed(1).replace('.', ',')} %</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{best.nom}</span>
              </div>
            ) : (
              <div style={s.asideLine}>Sauvegarde une estimation pour la retrouver ici avec son PDF.</div>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
          <Link href="/dashboard/investir/estimateur" style={heroCta}><TrendUp size={17} weight="bold" /> Estimer un bien</Link>
          <Link href="/dashboard/investir/comparateur" style={heroLink}>Comparer les villes</Link>
          <Link href="/dashboard/investir/simulateurs" style={heroLink}>Rentabilité et fiscalité</Link>
        </div>
      </HubHero>

      {/* OUTILS D'ACQUISITION */}
      <div style={s.toolsGrid}>
        <Link href="/dashboard/investir/estimateur" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}><TrendUp size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Estimer les revenus + PDF banque</div>
            <div style={s.toolDesc}>Revenu annuel, saisonnalité, réglementation de la ville, prévisionnel pour un dossier de prêt.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
        <Link href="/dashboard/investir/comparateur" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'rgba(255,213,107,0.22)', color: '#8A5A12' }}><MapPin size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Comparer les villes</div>
            <div style={s.toolDesc}>Prix moyen, occupation, potentiel et réglementation, ville par ville.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
        <Link href="/dashboard/investir/simulateurs" style={s.toolCard} className="quick-hover">
          <div style={{ ...s.toolIcon, background: 'color-mix(in srgb, #6E5446 14%, transparent)', color: '#6E5446' }}><Calculator size={20} weight="fill" /></div>
          <div style={s.toolBody}>
            <div style={s.toolTitle}>Simuler la rentabilité et la fiscalité</div>
            <div style={s.toolDesc}>Rentabilité nette, micro-BIC ou réel en LMNP : teste ton scénario d&apos;achat.</div>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: 'var(--text-3)' }} />
        </Link>
      </div>

      {/* MES PROJETS */}
      <section style={{ marginTop: '28px' }}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Mes projets d&apos;acquisition</h2>
          <Link href="/dashboard/investir/estimateur" style={s.newBtn}>
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
            <Link href="/dashboard/investir/estimateur" style={s.emptyCta}>
              <TrendUp size={15} weight="bold" /> Estimer un premier bien
            </Link>
          </div>
        ) : (
          <div style={s.projectsGrid}>
            {items.map(p => {
              const snap = p.snapshot
              return (
                <div key={p.id} style={s.projectCard}>
                  <div style={s.projectHead}>
                    <div style={{ minWidth: 0 }}>
                      <div style={s.projectName}>{p.nom}</div>
                      <div style={s.projectMeta}>
                        <MapPin size={11} weight="fill" style={{ verticalAlign: '-1px' }} />{' '}
                        {p.ville ?? PAYS_LABELS[p.pays] ?? p.pays} · {TYPE_LABELS[p.type_logement] ?? p.type_logement}
                        {p.nb_chambres > 0 ? ` · ${p.nb_chambres} ch.` : ''}
                      </div>
                    </div>
                    <button onClick={() => remove(p.id)} style={s.trashBtn} aria-label={`Supprimer ${p.nom}`} title="Supprimer">
                      <Trash size={14} />
                    </button>
                  </div>

                  <div style={s.statsRow}>
                    <Stat label="Revenu / an" value={eur(snap?.revenuAnnuel)} strong />
                    <Stat label="Résultat d'exploitation" value={eur(snap?.resultatExploitation)} />
                    <Stat label="Rentabilité nette" value={snap?.rentabiliteNette != null ? `${snap.rentabiliteNette.toFixed(1).replace('.', ',')} %` : '-'} />
                  </div>

                  <RegulationAlert ville={p.ville} pays={p.pays} compact />

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
        <div style={{ ...s.toolIcon, background: 'var(--surface)', color: 'var(--accent-text)' }}><HouseLine size={20} weight="fill" /></div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
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
  // Aligné sur la convention dashboard (cf. ReservationsView) : pleine
  // largeur jusqu'à 1600px, centré, pour bien exploiter les grands écrans.
  // Pleine largeur, comme le reste du dashboard (avant : limitée à 1600 px)
  page: { padding: 'var(--dash-page-px)', width: '100%' },
  asideLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  asideBig: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, color: 'var(--text)', lineHeight: 1.2 },
  asideLine: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 },
  asideBest: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, padding: '10px 12px', borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', minWidth: 0 },
  toolsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '12px' },
  toolCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px',
    borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none', transition: 'all .18s',
  },
  toolIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toolBody: { flex: 1, minWidth: 0 },
  toolTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  toolDesc: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 },

  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 13px', borderRadius: '9px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: '12.5px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
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
  projectCard: { padding: '16px 18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)' },
  projectHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' },
  projectName: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  projectMeta: { fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' },
  trashBtn: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' },
  stat: { padding: '8px 9px', borderRadius: '9px', minWidth: 0, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  statVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', color: 'var(--text)', lineHeight: 1.1, whiteSpace: 'nowrap' },
  statLbl: { fontSize: '11px', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 },
  finLine: { fontSize: '11.5px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '4px' },
  pdfBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px 14px',
    borderRadius: '9px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  bridge: {
    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' as const, marginTop: '28px',
    padding: '18px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(255,213,107,0.14) 100%)', border: '1px solid var(--accent-border)',
  },
  bridgeTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  bridgeDesc: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5, maxWidth: '560px' },
  bridgeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '10px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', flexShrink: 0,
  },
}
