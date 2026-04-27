'use client'

import { ArrowUpRight, Wrench, Bank, BookOpen } from '@phosphor-icons/react'

interface Resource {
  label: string
  desc: string
  href: string
  external: boolean
}

const OFFICIAL: Resource[] = [
  {
    label: 'Cerfa 14004*04 — Déclaration en mairie',
    desc: 'Formulaire obligatoire avant la 1ère location d\'un meublé de tourisme',
    href: 'https://www.service-public.fr/particuliers/vosdroits/R14321',
    external: true,
  },
  {
    label: 'Numéro d\'enregistrement (téléservice)',
    desc: 'Obligatoire dans les communes > 200 000 hab. et zones touristiques',
    href: 'https://www.service-public.fr/particuliers/vosdroits/F2018',
    external: true,
  },
  {
    label: 'Classement Atout France',
    desc: 'Procédure officielle pour faire classer son meublé 1–5★',
    href: 'https://www.classement.atout-france.fr/',
    external: true,
  },
  {
    label: 'Cerfa 13984 — Déclaration DDPP',
    desc: 'Hygiène alimentaire pour les chambres d\'hôtes servant un petit-déj',
    href: 'https://www.formulaires.service-public.fr/gf/cerfa_13984.do',
    external: true,
  },
  {
    label: 'Régime fiscal du meublé de tourisme',
    desc: 'Page de référence sur impots.gouv.fr',
    href: 'https://www.impots.gouv.fr/particulier/location-meublee',
    external: true,
  },
  {
    label: 'Réglementation chambres d\'hôtes',
    desc: 'Service Public — règles spécifiques',
    href: 'https://www.service-public.fr/particuliers/vosdroits/F31376',
    external: true,
  },
]

const TOOLS: Resource[] = [
  {
    label: 'Audit GBP',
    desc: 'Audit gratuit de ta fiche Google Business pour la résa directe',
    href: '/dashboard/outils/audit-gbp',
    external: false,
  },
  {
    label: 'Gabarits messages',
    desc: 'Templates de messages voyageurs (avant arrivée, séjour, après)',
    href: '/dashboard/gabarits',
    external: false,
  },
  {
    label: 'Formations',
    desc: 'Modules vidéo pour structurer ton activité',
    href: '/dashboard/formations',
    external: false,
  },
  {
    label: 'Roadmap & suggestions',
    desc: 'Suggérer une nouvelle ressource ou voter pour les prochaines',
    href: '/dashboard/roadmap',
    external: false,
  },
]

function ResourceItem({ r, accent }: { r: Resource; accent: string }) {
  const props = r.external
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {}
  return (
    <a href={r.href} {...props} style={s.item}>
      <div style={s.itemHead}>
        <span style={s.itemLabel}>{r.label}</span>
        <ArrowUpRight size={12} weight="bold" color={accent} />
      </div>
      <div style={s.itemDesc}>{r.desc}</div>
    </a>
  )
}

export default function Resources() {
  return (
    <div style={s.wrap} className="fade-up glass-card">
      <div style={s.header}>
        <span style={s.headerIcon}>
          <BookOpen size={18} weight="fill" />
        </span>
        <div>
          <h3 style={s.title}>Ressources & téléchargements</h3>
          <p style={s.subtitle}>
            Formulaires officiels, sites de référence et outils Driing
          </p>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>
          <Bank size={12} weight="fill" />
          Documents & sites officiels
        </div>
        <div style={s.list}>
          {OFFICIAL.map(r => (
            <ResourceItem key={r.href} r={r} accent="#60a5fa" />
          ))}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>
          <Wrench size={12} weight="fill" />
          Outils Driing intégrés
        </div>
        <div style={s.list}>
          {TOOLS.map(r => (
            <ResourceItem key={r.href} r={r} accent="var(--accent-text)" />
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(20px,3vw,28px)',
    borderRadius: '20px',
    marginBottom: '28px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '20px',
  },
  headerIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 2px',
  },
  subtitle: {
    fontSize: '12px', fontWeight: 300,
    color: 'var(--text-3)',
    margin: 0,
  },
  section: { marginBottom: '20px' },
  sectionLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    marginBottom: '10px',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '8px',
  },
  item: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '11px',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  itemHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: '8px',
  },
  itemLabel: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
    lineHeight: 1.4,
  },
  itemDesc: {
    fontSize: '11.5px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.45,
  },
}
