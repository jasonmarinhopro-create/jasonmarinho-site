'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  HouseLine, Coffee, Buildings, Handshake,
  Scales, CurrencyEur, ClipboardText, Globe, Briefcase, FileText, Megaphone, ShieldCheck, Gavel,
  Warning, Info, CheckCircle, ArrowRight,
} from '@phosphor-icons/react'

type ProfileFilter = 'all' | 'gites' | 'chambres' | 'conciergerie' | 'direct'
type RuleType = 'info' | 'ok' | 'warn'

interface Rule {
  type: RuleType
  text: React.ReactNode
}

interface GuideCard {
  id: string
  profile: Exclude<ProfileFilter, 'all'>
  iconColor: string
  iconBg: string
  icon: React.ReactNode
  title: string
  subtitle: string
  rules: Rule[]
}

const PROFILE_DEFS: Record<Exclude<ProfileFilter, 'all'>, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}> = {
  gites:        { label: 'Gîtes · EI ou SASU',    icon: <HouseLine size={13} weight="fill" />, color: '#d97706', bg: 'rgba(245,158,11,0.12)' },
  chambres:     { label: "Chambres d'hôtes",        icon: <Coffee    size={13} weight="fill" />, color: '#db2777', bg: 'rgba(236,72,153,0.12)' },
  conciergerie: { label: 'Conciergeries',           icon: <Buildings size={13} weight="fill" />, color: '#7c3aed', bg: 'rgba(139,92,246,0.12)' },
  direct:       { label: 'Réservation directe',     icon: <Handshake size={13} weight="fill" />, color: '#059669', bg: 'rgba(16,185,129,0.12)' },
}

const GUIDE_CARDS: GuideCard[] = [
  // ── GÎTES ──
  {
    id: 'gites-statut',
    profile: 'gites',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <Scales size={22} weight="fill" />,
    title: 'Statut juridique : EI ou SASU ?',
    subtitle: 'Choisir la bonne structure selon ton projet',
    rules: [
      { type: 'info', text: <><strong>EI (Entreprise Individuelle)</strong> : création gratuite, régime TNS, cotisations ~40 % du bénéfice, responsabilité illimitée sur patrimoine personnel</> },
      { type: 'info', text: <><strong>SASU</strong> : assimilé-salarié, responsabilité limitée au capital, optimisation salaire + dividendes possible — plus de charges fixes</> },
      { type: 'ok',   text: <>EI conseillée pour <strong>1–2 biens</strong>, SASU pertinente dès que les revenus dépassent 30–40 k€/an ou pour protéger son patrimoine</> },
    ],
  },
  {
    id: 'gites-fiscalite',
    profile: 'gites',
    iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.12)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: 'Classement & impact fiscal (loi Le Meur 2025)',
    subtitle: "L'abattement varie selon le classement",
    rules: [
      { type: 'ok',   text: <><strong>Classé Atout France (1–5★)</strong> : micro-BIC abattement <strong>71 %</strong>, plafond 77 700 €/an</> },
      { type: 'warn', text: <><strong>Non classé depuis 2025</strong> : abattement tombé à <strong>30 %</strong>, plafond 15 000 €/an — fort impact si tu n&apos;es pas classé</> },
      { type: 'info', text: <>Régime <strong>réel simplifié</strong> : déduction charges réelles (amortissement, travaux, intérêts) — souvent plus avantageux au-delà de 30 k€</> },
    ],
  },
  {
    id: 'gites-obligations',
    profile: 'gites',
    iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)',
    icon: <ClipboardText size={22} weight="fill" />,
    title: 'Obligations légales du gîte',
    subtitle: "Ce que la loi impose avant d'accueillir",
    rules: [
      { type: 'warn', text: <><strong>Déclaration en mairie obligatoire</strong> (Cerfa 14004*04) avant la 1ère location</> },
      { type: 'warn', text: <><strong>Numéro d&apos;enregistrement</strong> obligatoire dans les communes &gt; 200 000 hab. et communes touristiques — amende jusqu&apos;à 5 000 €</> },
      { type: 'info', text: <><strong>Résidence principale</strong> : 120 nuits/an max · <strong>Résidence secondaire ou dédiée</strong> : pas de plafond de nuits</> },
      { type: 'ok',   text: <>Taxe de séjour à collecter et reverser à la mairie si la plateforme ne le fait pas</> },
    ],
  },

  // ── CHAMBRES D'HÔTES ──
  {
    id: 'chambres-regles',
    profile: 'chambres',
    iconColor: '#fb7185', iconBg: 'rgba(251,113,133,0.12)',
    icon: <Gavel size={22} weight="fill" />,
    title: 'Les règles légales strictes (loi 2006)',
    subtitle: 'Les obligations que beaucoup ignorent',
    rules: [
      { type: 'warn', text: <><strong>Maximum 5 chambres</strong> et <strong>15 personnes simultanément</strong> — au-delà, c&apos;est un autre régime juridique</> },
      { type: 'warn', text: <><strong>Petit-déjeuner obligatoire</strong> (légalement) — il doit être proposé, inclus ou en option payante</> },
      { type: 'warn', text: <><strong>Propriétaire présent sur place</strong> obligatoirement — contrairement au gîte où tu peux être absent</> },
      { type: 'info', text: <>Ne pas appeler &ldquo;gîte&rdquo; une chambre d&apos;hôtes — la terminologie est encadrée par la loi</> },
    ],
  },
  {
    id: 'chambres-fiscalite',
    profile: 'chambres',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: "Fiscalité spécifique chambres d'hôtes",
    subtitle: 'Différente du meublé de tourisme classique',
    rules: [
      { type: 'ok',   text: <>Si revenus &lt; <strong>760 €/an</strong> : exonération fiscale totale possible</> },
      { type: 'info', text: <>Micro-BIC <strong>71 % abattement</strong> si classées Gîtes de France ou Clévacances — <strong>50 %</strong> si non classées</> },
      { type: 'warn', text: <>Classement <strong>Atout France (meublé de tourisme) interdit</strong> pour les chambres d&apos;hôtes — régime différent</> },
      { type: 'ok',   text: <>Labels possibles : <strong>Gîtes de France</strong> (épis) et <strong>Clévacances</strong> (clés) — recommandés pour le référencement et la fiscalité</> },
    ],
  },
  {
    id: 'chambres-plateformes',
    profile: 'chambres',
    iconColor: '#2dd4bf', iconBg: 'rgba(45,212,191,0.12)',
    icon: <Globe size={22} weight="fill" />,
    title: 'Canaux de réservation adaptés',
    subtitle: "Airbnb n'est pas ton seul levier",
    rules: [
      { type: 'ok',   text: <>Airbnb, Booking.com, Abritel/Vrbo : compatibles avec les chambres d&apos;hôtes</> },
      { type: 'ok',   text: <><strong>Réseau Gîtes de France</strong> : spécialisé chambres d&apos;hôtes, clientèle qualifiée — recommandé</> },
      { type: 'ok',   text: <><strong>Driing</strong> et site propre : réservation directe sans commission — fort potentiel pour fidéliser les voyageurs récurrents</> },
      { type: 'info', text: <><strong>Google My Business</strong> : levier visibilité locale essentiel pour les chambres d&apos;hôtes en zone rurale ou touristique</> },
    ],
  },

  // ── CONCIERGERIES ──
  {
    id: 'conciergerie-hoguet',
    profile: 'conciergerie',
    iconColor: '#818cf8', iconBg: 'rgba(129,140,248,0.12)',
    icon: <Scales size={22} weight="fill" />,
    title: "Loi Hoguet : quand s'applique-t-elle ?",
    subtitle: 'La question que toute conciergerie doit se poser',
    rules: [
      { type: 'warn', text: <><strong>Tu encaisses les loyers pour le propriétaire</strong> → Loi Hoguet s&apos;applique → carte professionnelle obligatoire + garantie financière</> },
      { type: 'ok',   text: <><strong>Le propriétaire encaisse directement</strong> (via Airbnb, Booking, virement) → Prestation de services classique → pas de carte pro requise</> },
      { type: 'info', text: <>La plupart des conciergeries évitent la loi Hoguet en structurant correctement le flux de paiement dès le départ</> },
    ],
  },
  {
    id: 'conciergerie-statut',
    profile: 'conciergerie',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <Briefcase size={22} weight="fill" />,
    title: 'Statuts recommandés & TVA',
    subtitle: 'Choisir la bonne structure pour scaler',
    rules: [
      { type: 'ok',   text: <><strong>Micro-entreprise</strong> : pour démarrer, plafond 77 700 €/an (prestations de services), franchise TVA jusqu&apos;à 36 800 €</> },
      { type: 'ok',   text: <><strong>SASU/SAS</strong> : pour aller au-delà, protéger son patrimoine, avoir des associés ou employés</> },
      { type: 'warn', text: <><strong>TVA 20 %</strong> obligatoire dès 36 800 € de CA — à intégrer dans ta tarification dès le départ</> },
      { type: 'info', text: <><strong>RC Pro obligatoire</strong> dans tous les cas — couvre les dommages causés lors des prestations</> },
    ],
  },
  {
    id: 'conciergerie-contrats',
    profile: 'conciergerie',
    iconColor: '#2dd4bf', iconBg: 'rgba(45,212,191,0.12)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrats & tarification',
    subtitle: 'Les bases contractuelles indispensables',
    rules: [
      { type: 'warn', text: <><strong>Contrat de mandat de gestion</strong> obligatoire avec chaque propriétaire — définit honoraires, périmètre, durée et conditions de résiliation</> },
      { type: 'info', text: <>Honoraires usuels : <strong>15–30 % des revenus bruts</strong> selon les services inclus (ménage, accueil, gestion messages, etc.)</> },
      { type: 'ok',   text: <>Distinguer les prestations incluses dans les honoraires et celles facturées en supplément (ménage, linge, réparations)</> },
    ],
  },

  // ── RÉSERVATION DIRECTE ──
  {
    id: 'direct-contrat',
    profile: 'direct',
    iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.12)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrat obligatoire sans plateforme',
    subtitle: 'Ce que tu dois avoir avant le premier séjour',
    rules: [
      { type: 'warn', text: <><strong>Contrat de location saisonnière obligatoire</strong> — mentions légales : identité des parties, durée, prix, descriptif du logement, conditions d&apos;annulation</> },
      { type: 'info', text: <>État des lieux <strong>recommandé</strong> (non obligatoire pour LCD &lt; 30 jours, mais utile en cas de litige)</> },
      { type: 'ok',   text: <><strong>Taxe de séjour à collecter toi-même</strong> et reverser à la mairie — montant selon commune et catégorie du logement</> },
    ],
  },
  {
    id: 'direct-assurance',
    profile: 'direct',
    iconColor: '#fb7185', iconBg: 'rgba(251,113,133,0.12)',
    icon: <ShieldCheck size={22} weight="fill" />,
    title: "Assurance : pas d'AirCover hors Airbnb",
    subtitle: 'La protection que tu dois assurer toi-même',
    rules: [
      { type: 'warn', text: <><strong>Assurance habitation classique insuffisante</strong> pour la LCD — vérifie et informe obligatoirement ton assureur</> },
      { type: 'ok',   text: <>Contrats adaptés : <strong>MAIF, MMA, Hiscox, AXA Pro</strong> — extension LCD ou contrat dédié couvrant dommages, vol, RC voyageur</> },
      { type: 'ok',   text: <>Caution/dépôt de garantie : <strong>Swikly</strong> (digitale), virement, ou chèque — délai de restitution à préciser dans le contrat (usage : 7 jours)</> },
      { type: 'info', text: <>Assurance annulation voyageur : tu peux proposer Chapka, AXA Assistance — ça rassure et évite les litiges d&apos;annulation</> },
    ],
  },
  {
    id: 'direct-visibilite',
    profile: 'direct',
    iconColor: '#fbbf24', iconBg: 'rgba(251,191,36,0.12)',
    icon: <Megaphone size={22} weight="fill" />,
    title: 'Se rendre visible sans Airbnb',
    subtitle: 'Les canaux pour remplir ton calendrier en direct',
    rules: [
      { type: 'ok',   text: <><strong>Google My Business</strong> : fiche gratuite, apparaît dans les recherches locales — indispensable pour gîtes et chambres d&apos;hôtes</> },
      { type: 'ok',   text: <><strong>Driing</strong> : annonce directe sans commission, comparateur de prix intégré, voyageurs qualifiés</> },
      { type: 'ok',   text: <>Paiements : <strong>Stripe, SumUp, Driing ou virement bancaire</strong> — prévoir une solution sécurisée avant le premier séjour direct</> },
      { type: 'info', text: <>Construire une <strong>base de voyageurs fidèles</strong> (email, Instagram) : la réservation directe se développe sur le temps long</> },
    ],
  },
]

const RULE_STYLES: Record<RuleType, { color: string; bg: string }> = {
  warn: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  ok:   { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  info: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
}

function RuleIcon({ type }: { type: RuleType }) {
  if (type === 'warn') return <Warning size={14} weight="fill" />
  if (type === 'ok')   return <CheckCircle size={14} weight="fill" />
  return <Info size={14} weight="fill" />
}

function GuideCardItem({ card }: { card: GuideCard }) {
  const profileDef = PROFILE_DEFS[card.profile]
  return (
    <div style={s.card} className="glass-card">
      <div style={{ ...s.profileBadge, color: profileDef.color, background: profileDef.bg, borderColor: `${profileDef.color}40` }}>
        {profileDef.icon}
        {profileDef.label}
      </div>
      <div style={s.cardHead}>
        <div style={{ ...s.iconBox, background: card.iconBg, color: card.iconColor }}>
          {card.icon}
        </div>
        <div>
          <h3 style={s.cardTitle}>{card.title}</h3>
          <p style={s.cardSub}>{card.subtitle}</p>
        </div>
      </div>
      <div style={s.rules}>
        {card.rules.map((rule, i) => {
          const rc = RULE_STYLES[rule.type]
          return (
            <div key={i} style={{ ...s.rule, background: rc.bg }}>
              <span style={{ color: rc.color, flexShrink: 0, marginTop: '1px', display: 'flex' }}>
                <RuleIcon type={rule.type} />
              </span>
              <span style={s.ruleText}>{rule.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const FILTER_TABS: { id: ProfileFilter; label: string; Icon: React.ComponentType<{ size: number; weight: 'fill' }> | null }[] = [
  { id: 'all',          label: 'Tous les profils',    Icon: null },
  { id: 'gites',        label: 'Gîtes',               Icon: HouseLine },
  { id: 'chambres',     label: "Chambres d'hôtes",    Icon: Coffee },
  { id: 'conciergerie', label: 'Conciergeries',       Icon: Buildings },
  { id: 'direct',       label: 'Réservation directe', Icon: Handshake },
]

export default function GuideUI() {
  const [activeFilter, setActiveFilter] = useState<ProfileFilter>('all')

  useEffect(() => {
    const saved = localStorage.getItem('guide-filter') as ProfileFilter | null
    if (saved && ['all', 'gites', 'chambres', 'conciergerie', 'direct'].includes(saved)) {
      setActiveFilter(saved)
    }
  }, [])

  function handleFilter(id: ProfileFilter) {
    setActiveFilter(id)
    localStorage.setItem('guide-filter', id)
  }

  const visibleCards = activeFilter === 'all'
    ? GUIDE_CARDS
    : GUIDE_CARDS.filter(c => c.profile === activeFilter)

  return (
    <div style={s.page}>

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Guide <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h2>
        <p style={s.pageDesc}>
          Gîtes en EI ou SASU, chambres d&apos;hôtes, conciergeries, réservation directe — chaque activité a ses règles, sa fiscalité, ses obligations. Ici, on ne parle pas que d&apos;Airbnb.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={s.filterWrap} className="fade-up d1">
        {FILTER_TABS.map(tab => {
          const Icon = tab.Icon
          const isActive = activeFilter === tab.id
          const def = tab.id !== 'all' ? PROFILE_DEFS[tab.id as Exclude<ProfileFilter, 'all'>] : null
          return (
            <button
              key={tab.id}
              onClick={() => handleFilter(tab.id)}
              style={{
                ...s.filterTab,
                ...(isActive ? {
                  background: def ? def.bg : 'rgba(0,76,63,0.15)',
                  borderColor: def ? `${def.color}70` : 'var(--accent-text)',
                  color: def ? def.color : 'var(--accent-text)',
                } : {}),
              }}
            >
              {Icon && <Icon size={13} weight="fill" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div className="dash-grid-2 fade-up d2" style={{ marginBottom: '32px' }}>
        {visibleCards.map(card => (
          <GuideCardItem key={card.id} card={card} />
        ))}
      </div>

      {/* Driing banner */}
      <div style={s.banner} className="fade-up glass-card">
        <div style={s.bannerIcon}>
          <HouseLine size={28} color="var(--accent-text)" weight="fill" />
        </div>
        <div style={s.bannerText}>
          <h3 style={s.bannerTitle}>Tu connais Driing ?</h3>
          <p style={s.bannerDesc}>
            La plateforme de réservation sans commissions pour hôtes LCD — alternative directe à Airbnb.
          </p>
        </div>
        <Link
          href="https://jasonmarinho.fr/blog/driing-plateforme-vacances-sans-commissions"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}
        >
          Découvrir <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  intro: { marginBottom: '28px', maxWidth: '640px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  filterWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '28px' },
  filterTab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, padding: '8px 16px',
    borderRadius: '100px', border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-2)',
    cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap' as const,
  },

  card: { padding: '22px', borderRadius: '20px', display: 'flex', flexDirection: 'column' as const, gap: '0', position: 'relative' as const },

  profileBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, padding: '4px 9px',
    borderRadius: '100px', border: '1px solid',
    marginBottom: '16px', alignSelf: 'flex-start' as const,
  },

  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' },
  iconBox: { width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: '0 0 3px' },
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', margin: 0 },

  rules: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  rule: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '9px' },
  ruleText: { fontSize: '12.5px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.55 },

  banner: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const, padding: 'clamp(20px,3vw,32px)', borderRadius: '20px' },
  bannerIcon: { width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, background: 'rgba(0,76,63,0.25)', border: '1px solid rgba(255,213,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, minWidth: '200px' },
  bannerTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  bannerDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
}
