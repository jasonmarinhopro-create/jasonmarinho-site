'use client'

// Extrait de CalendrierView.tsx (découpage sept. 2026, code inchangé).
// Vue « liste » du Calendrier (réservations et événements par jour).
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr'
import type { ContractEvent, IcalFeed, IcalEvent, SejourEvent } from './page'
import { CalEvent, CAT, capitalize, fmtShortDate } from './calendrier-shared'

interface ListViewProps {
  byDate: Record<string, { custom: CalEvent[]; contracts: ContractEvent[]; ical: IcalEvent[]; sejours: SejourEvent[] }>
  contractEvents: ContractEvent[]
  today: string
  icalFeeds: IcalFeed[]
  onSelect: (date: string, contract?: ContractEvent) => void
  onSelectSejour: (voyageurId: string) => void
}

export default function ListView({ byDate, today, icalFeeds, onSelect, onSelectSejour }: ListViewProps) {
  const dates = Object.keys(byDate).sort()
  const upcoming = dates.filter(d => d >= today).slice(0, 60) // 60 prochains jours avec events
  const past     = dates.filter(d => d < today).slice(-15)    // 15 derniers passés

  function dayLabel(d: string) {
    const [y, m, dd] = d.split('-').map(Number)
    const date = new Date(y, m - 1, dd)
    const diffDays = Math.round((new Date(d + 'T12:00').getTime() - new Date(today + 'T12:00').getTime()) / 86400000)
    const main = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    let rel = ''
    if (diffDays === 0) rel = "Aujourd'hui"
    else if (diffDays === 1) rel = 'Demain'
    else if (diffDays === -1) rel = 'Hier'
    else if (diffDays > 0) rel = `J+${diffDays}`
    else rel = `J${diffDays}`
    return { main: main.charAt(0).toUpperCase() + main.slice(1), rel, isPast: diffDays < 0, isToday: diffDays === 0 }
  }

  // Utilitaires reservation
  function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }
  function nightsBetween(from: string, to: string) {
    return Math.max(0, Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000))
  }
  // Detection source : PRIORITE au champ voyageurs.source (rempli par les
  // syncs iCal Airbnb/Booking = source de verite), fallback sur le label
  // pour les cas ou le voyageur n'a pas de source enregistree.
  function detectSource(platform: string | null, label: string): { key: string; label: string; color: string } {
    const s = (platform ?? label).toLowerCase()
    if (s.includes('airbnb')) return { key: 'airbnb', label: 'Airbnb', color: '#FF385C' }
    if (s.includes('booking')) return { key: 'booking', label: 'Booking', color: '#003580' }
    if (s.includes('driing')) return { key: 'driing', label: 'Driing', color: '#B8860B' }
    if (s.includes('vrbo') || s.includes('abritel')) return { key: 'vrbo', label: 'VRBO', color: '#0072ce' }
    return { key: 'direct', label: 'Direct', color: '#63D683' }
  }
  function sejourStatus(dateArrivee: string, dateDepart: string): { label: string; color: string } {
    if (dateDepart < today) return { label: 'Terminé', color: 'var(--text-muted)' }
    if (dateArrivee <= today && dateDepart >= today) return { label: 'En cours', color: '#63D683' }
    return { label: 'À venir', color: 'var(--accent-text)' }
  }

  function renderDay(d: string) {
    const day = byDate[d]
    if (!day) return null
    const { main, rel, isPast, isToday } = dayLabel(d)

    // Sejours enrichis : rendu dedie avec beaucoup plus d'infos hote
    const richSejours = day.sejours.filter(s => s.date_arrivee === d)

    // Autres events : contracts (arrivee/depart), ical (synchro), custom
    const otherItems: Array<{ id: string; title: string; color: string; subtitle?: string; onClick?: () => void; tag?: string }> = []
    day.contracts.forEach(c => {
      otherItems.push({
        id: c.id,
        title: c.title,
        color: (CAT[c.type] ?? CAT.note).color,
        subtitle: c.logement_nom ?? undefined,
        tag: c.type === 'arrivee' ? 'Contrat · Arrivée' : c.type === 'depart' ? 'Contrat · Départ' : 'Contrat',
        onClick: () => onSelect(d, c),
      })
    })
    day.ical.forEach(e => {
      const feed = icalFeeds.find(f => f.id === e.feed_id)
      otherItems.push({
        id: `ical-${e.id}`,
        title: e.title,
        color: e.feed_color,
        subtitle: feed?.name ?? 'Synchro',
        tag: 'Synchro',
        onClick: () => onSelect(d),
      })
    })
    day.custom.filter(e => !e.end_date || e.end_date === e.date).forEach(e => {
      const cat = CAT[e.category] ?? CAT.note
      otherItems.push({
        id: e.id,
        title: e.title,
        color: cat.color,
        subtitle: e.start_time ? `${e.start_time.slice(0, 5)}${e.end_time ? ` → ${e.end_time.slice(0, 5)}` : ''}` : undefined,
        tag: cat.label,
        onClick: () => onSelect(d),
      })
    })

    if (richSejours.length === 0 && otherItems.length === 0) return null

    return (
      <div key={d} style={{ ...lvs.dayBlock, opacity: isPast ? 0.6 : 1 }}>
        <div style={lvs.dayHeader}>
          <span style={lvs.dayMain}>{main}</span>
          <span style={{ ...lvs.dayRel, color: isToday ? 'var(--accent-text)' : 'var(--text-muted)' }}>{rel}</span>
        </div>

        {/* Cartes reservations enrichies (sejours) */}
        <div style={lvs.itemsList}>
          {richSejours.map(s => {
            const source = detectSource(s.platform ?? null, s.voyageur_label)
            const nights = nightsBetween(s.date_arrivee, s.date_depart)
            const status = sejourStatus(s.date_arrivee, s.date_depart)
            const perNight = s.montant && nights > 0 ? Math.round(s.montant / nights) : null
            // Nom voyageur nettoye (retire les suffixes de source pour l'affichage)
            const cleanName = s.voyageur_label.replace(/\s*(Airbnb|Booking|Driing|VRBO|Abritel)\s*$/i, '').trim() || s.voyageur_label
            return (
              <button
                key={`sejour-${s.id}`}
                onClick={() => { if (s.voyageur_id) onSelectSejour(s.voyageur_id) }}
                style={lvs.resaCard}
                className="jm-resa-card"
              >
                {/* Bandeau accent source */}
                <span style={{ ...lvs.resaAccent, background: source.color }} />
                <span style={lvs.resaAvatar}>{initials(cleanName)}</span>
                <span style={lvs.resaBody}>
                  <span style={lvs.resaTopRow}>
                    <span style={lvs.resaName}>{cleanName}</span>
                    <span style={{ ...lvs.resaBadge, color: source.color, background: `${source.color}1a`, border: `1px solid ${source.color}33` }}>
                      {source.label}
                    </span>
                    <span style={{ ...lvs.resaBadge, color: status.color, background: 'transparent', border: `1px solid ${status.color}55` }}>
                      {status.label}
                    </span>
                  </span>
                  <span style={lvs.resaMeta}>
                    <span style={lvs.resaLogement}>🏠 {s.logement_label}</span>
                  </span>
                  <span style={lvs.resaDates}>
                    <span>Arrivée <strong>{fmtShortDate(s.date_arrivee)}</strong></span>
                    <span style={lvs.resaSep}>→</span>
                    <span>Départ <strong>{fmtShortDate(s.date_depart)}</strong></span>
                    <span style={lvs.resaSep}>·</span>
                    <span>{nights} nuit{nights > 1 ? 's' : ''}</span>
                    {s.montant && (
                      <>
                        <span style={lvs.resaSep}>·</span>
                        <span style={lvs.resaMontant}>{s.montant.toLocaleString('fr-FR')} €</span>
                        {perNight && <span style={lvs.resaPerNight}>({perNight}€/nuit)</span>}
                      </>
                    )}
                  </span>
                </span>
              </button>
            )
          })}

          {/* Autres events : rendu compact d'origine */}
          {otherItems.map(it => (
            <button key={it.id} onClick={it.onClick} style={lvs.item}>
              <span style={{ ...lvs.itemDot, background: it.color }} />
              <span style={lvs.itemBody}>
                <span style={lvs.itemTitle}>{it.title}</span>
                {it.subtitle && <span style={lvs.itemSub}>{it.subtitle}</span>}
              </span>
              {it.tag && <span style={{ ...lvs.itemTag, color: it.color, background: `${it.color}1a` }}>{it.tag}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div style={lvs.empty}>
        <CalendarBlank size={32} weight="thin" color="var(--text-muted)" />
        <div style={lvs.emptyTitle}>Aucun événement à afficher</div>
        <div style={lvs.emptyDesc}>Ajuste les filtres ou ajoute un événement</div>
      </div>
    )
  }

  return (
    <div style={lvs.wrap}>
      {upcoming.length > 0 && (
        <div style={lvs.section}>
          <div style={lvs.sectionLabel}>À venir</div>
          {upcoming.map(renderDay)}
        </div>
      )}
      {past.length > 0 && (
        <div style={lvs.section}>
          <div style={lvs.sectionLabel}>Récemment</div>
          {past.reverse().map(renderDay)}
        </div>
      )}
    </div>
  )
}

const lvs: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1, minWidth: 0,
    overflowY: 'auto' as const,
    padding: '12px 16px',
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
  },
  empty: {
    flex: 1,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    gap: '10px',
    padding: '60px 20px',
    textAlign: 'center' as const,
  },
  emptyTitle: { fontSize: '14px', color: 'var(--text-2)', fontWeight: 500 },
  emptyDesc:  { fontSize: '12px', color: 'var(--text-muted)' },
  section:    { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    padding: '4px 0',
  },
  dayBlock: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  },
  dayHeader: {
    display: 'flex', alignItems: 'baseline', gap: '10px',
    marginBottom: '6px',
  },
  dayMain: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '14px', fontWeight: 500,
    color: 'var(--text)',
    textTransform: 'capitalize' as const,
  },
  dayRel: {
    fontSize: '11px', fontWeight: 500,
  },
  itemsList: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  item: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    width: '100%',
    color: 'var(--text-2)',
  },
  itemDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    flexShrink: 0,
  },
  itemBody: {
    display: 'flex', flexDirection: 'column' as const, gap: '1px',
    flex: 1, minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  itemSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  itemTag: {
    fontSize: '10px', fontWeight: 600,
    padding: '3px 8px', borderRadius: '100px',
    flexShrink: 0,
    letterSpacing: '0.3px',
  },
  // ── Carte reservation enrichie (sejour) ──
  resaCard: {
    position: 'relative' as const,
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '14px 14px 14px 18px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    width: '100%',
    color: 'var(--text)',
    overflow: 'hidden' as const,
    transition: 'transform 0.15s var(--ease-spring), border-color 0.15s',
  },
  resaAccent: {
    position: 'absolute' as const, top: 0, left: 0, bottom: 0,
    width: '4px',
  },
  resaAvatar: {
    width: '38px', height: '38px', flexShrink: 0,
    borderRadius: '50%',
    background: 'rgba(255,213,107,0.14)',
    border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 600,
    fontFamily: 'var(--font-fraunces), serif',
    color: 'var(--accent-text)',
    letterSpacing: '0.3px',
  },
  resaBody: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    flex: 1, minWidth: 0,
  },
  resaTopRow: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
  },
  resaName: {
    fontSize: '14px', fontWeight: 600,
    color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
    letterSpacing: '-0.01em',
  },
  resaBadge: {
    fontSize: '10px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '100px',
    letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
  },
  resaMeta: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  resaLogement: {
    fontSize: '12px', color: 'var(--text-2)', fontWeight: 500,
  },
  resaDates: {
    display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const,
    fontSize: '12px',
    color: 'var(--text-3)',
    marginTop: '2px',
  },
  resaSep: { color: 'var(--text-muted)', opacity: 0.6 },
  resaMontant: { color: 'var(--accent-text)', fontWeight: 600 },
  resaPerNight: { color: 'var(--text-muted)', fontSize: '11px' },
}

// ─── Searchable combobox for voyageur / logement ─────────────────────────────
