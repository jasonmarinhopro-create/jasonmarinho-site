'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, House, MapPin, Star, PencilSimple, ArrowSquareOut,
  CurrencyEur, Calendar as CalendarIcon, Users, TrendUp, Clock,
  WifiHigh, Key, Phone, Wrench, Sparkle, ShieldCheck,
  Check, Copy, ArrowRight,
} from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Logement = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  type_logement: string | null
  capacite_max: number
  surface_m2: number | null
  nb_chambres: number | null
  nb_lits: number | null
  nb_sdb: number | null
  numero_enregistrement: string | null
  classement_etoiles: number | null
  dpe: string | null
  tarif_nuitee_moyen: number | null
  frais_menage: number | null
  caution: number | null
  equipements: string[] | null
  lien_airbnb: string | null
  lien_booking: string | null
  lien_gmb: string | null
  lien_site_direct: string | null
  photo_couverture_url: string | null
  photos_urls: string[] | null
  contact_urgence_nom: string | null
  contact_urgence_tel: string | null
  contact_menage_nom: string | null
  contact_menage_tel: string | null
  actif: boolean | null
  proprietaire_nom: string | null
  proprietaire_email: string | null
  proprietaire_telephone: string | null
  honoraires_pct: number | null
  reglement_interieur: string | null
  conditions_annulation: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement: string | null
  heure_arrivee: string | null
  heure_depart: string | null
  code_acces: string | null
  wifi_nom: string | null
  wifi_mdp: string | null
}

type Sejour = {
  id: string
  voyageur_id: string
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
  contrat_statut: string | null
  contrat_date_signature: string | null
  contrat_lien: string | null
  voyageurs: { id: string; prenom: string; nom: string; email: string | null; telephone: string | null } | null
}

interface Props {
  logement: Logement
  sejours: Sejour[]
  contractsCount: number
}

const TYPE_LABELS: Record<string, string> = {
  'gite': 'Gîte',
  'chambres-hotes': "Chambres d'hôtes",
  'appartement': 'Appartement',
  'studio': 'Studio',
  'maison': 'Maison',
  'villa': 'Villa',
  'autre': 'Autre',
}

const EQUIPEMENT_LABELS: Record<string, { label: string; emoji: string }> = {
  'wifi':           { label: 'Wi-Fi',          emoji: '📶' },
  'parking':        { label: 'Parking',        emoji: '🅿️' },
  'piscine':        { label: 'Piscine',        emoji: '🏊' },
  'climatisation':  { label: 'Climatisation',  emoji: '❄️' },
  'chauffage':      { label: 'Chauffage',      emoji: '🔥' },
  'lave-linge':     { label: 'Lave-linge',     emoji: '🧺' },
  'lave-vaisselle': { label: 'Lave-vaisselle', emoji: '🍽️' },
  'tv':             { label: 'TV',             emoji: '📺' },
  'jardin':         { label: 'Jardin',         emoji: '🌳' },
  'terrasse':       { label: 'Terrasse',       emoji: '🪑' },
  'balcon':         { label: 'Balcon',         emoji: '🌿' },
  'pmr':            { label: 'Accès PMR',      emoji: '♿' },
  'ascenseur':      { label: 'Ascenseur',      emoji: '🛗' },
  'cheminee':       { label: 'Cheminée',       emoji: '🪵' },
  'spa':            { label: 'Spa / jacuzzi',  emoji: '🛁' },
}

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dpeColor(letter: string): { bg: string; fg: string; border: string } {
  switch (letter) {
    case 'A': return { bg: 'rgba(34,197,94,0.12)',  fg: '#16a34a', border: 'rgba(34,197,94,0.30)' }
    case 'B': return { bg: 'rgba(132,204,22,0.12)', fg: '#65a30d', border: 'rgba(132,204,22,0.30)' }
    case 'C': return { bg: 'rgba(234,179,8,0.12)',  fg: '#ca8a04', border: 'rgba(234,179,8,0.30)' }
    case 'D': return { bg: 'rgba(245,158,11,0.12)', fg: '#d97706', border: 'rgba(245,158,11,0.30)' }
    case 'E': return { bg: 'rgba(249,115,22,0.12)', fg: '#ea580c', border: 'rgba(249,115,22,0.30)' }
    case 'F': return { bg: 'rgba(239,68,68,0.12)',  fg: '#dc2626', border: 'rgba(239,68,68,0.30)' }
    case 'G': return { bg: 'rgba(127,29,29,0.18)',  fg: '#991b1b', border: 'rgba(127,29,29,0.40)' }
    default:  return { bg: 'var(--surface)',        fg: 'var(--text-2)', border: 'var(--border)' }
  }
}

// ─── CopyChip helper ─────────────────────────────────────────────────────────

function CopyChip({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  const [copied, setCopied] = useState(false)
  async function onClick() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={onClick} style={{ ...s.copyChip, color: accent ?? 'var(--text-2)' }} title={`Copier : ${value}`}>
      {copied ? <Check size={12} weight="bold" color="#10b981" /> : icon}
      <span>{copied ? 'Copié !' : label}</span>
      <Copy size={10} style={{ opacity: 0.5 }} />
    </button>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function LogementDetail({ logement: l, sejours, contractsCount }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  // Stats : CA, occupation, séjours, prochain check-in
  const stats = (() => {
    const yearStart = `${new Date().getFullYear()}-01-01`
    const ytdSejours = sejours.filter(s => s.date_arrivee >= yearStart)
    const caYTD = ytdSejours.reduce((sum, s) => sum + (s.montant ?? 0), 0)

    // Occupation YTD : nb jours occupés / jours écoulés depuis 01-01
    const today_d = new Date()
    const yearStartD = new Date(today_d.getFullYear(), 0, 1)
    const daysSinceYearStart = Math.max(1, Math.round((today_d.getTime() - yearStartD.getTime()) / 86400000))
    const occupiedDays = new Set<string>()
    ytdSejours.forEach(s => {
      const [sy, sm, sd] = s.date_arrivee.split('-').map(Number)
      const [ey, em, ed] = s.date_depart.split('-').map(Number)
      const cur = new Date(sy, sm - 1, sd)
      const end = new Date(ey, em - 1, ed)
      while (cur <= end && cur <= today_d) {
        const ds = cur.toISOString().slice(0, 10)
        occupiedDays.add(ds)
        cur.setDate(cur.getDate() + 1)
      }
    })
    const occupationPct = Math.round((occupiedDays.size / daysSinceYearStart) * 100)

    // Prochain check-in
    const nextCheckIn = sejours.filter(s => s.date_arrivee >= today).sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee))[0]

    return {
      caYTD,
      nbSejoursYTD: ytdSejours.length,
      occupationPct: Math.min(100, occupationPct),
      occupiedDays: occupiedDays.size,
      daysSinceYearStart,
      nextCheckIn,
    }
  })()

  const upcomingSejours = sejours.filter(sj => sj.date_arrivee >= today).sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee)).slice(0, 3)

  const recentVoyageurs = (() => {
    const seen = new Set<string>()
    return sejours
      .sort((a, b) => b.date_arrivee.localeCompare(a.date_arrivee))
      .filter(sj => {
        if (!sj.voyageurs) return false
        if (seen.has(sj.voyageur_id)) return false
        seen.add(sj.voyageur_id)
        return true
      })
      .slice(0, 5)
  })()

  return (
    <div style={s.page}>
      {/* Back link */}
      <Link href="/dashboard/logements" style={s.backLink}>
        <ArrowLeft size={14} weight="bold" />
        Retour à mes logements
      </Link>

      {/* Hero */}
      <div style={s.hero}>
        {l.photo_couverture_url ? (
          <div style={s.heroImageWrap}>
            <img src={l.photo_couverture_url} alt={l.nom} style={s.heroImage} />
            <div style={s.heroOverlay} />
          </div>
        ) : (
          <div style={{ ...s.heroImageWrap, background: 'var(--bg-2)' }}>
            <div style={s.heroFallback}>
              <House size={48} weight="thin" color="var(--accent-text)" />
            </div>
          </div>
        )}

        <div style={s.heroContent}>
          <div style={s.heroChips}>
            {l.type_logement && (
              <span style={s.heroChip}>{TYPE_LABELS[l.type_logement] ?? l.type_logement}</span>
            )}
            {l.classement_etoiles !== null && l.classement_etoiles > 0 && (
              <span style={{ ...s.heroChip, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                {Array.from({ length: l.classement_etoiles }).map((_, i) => (
                  <Star key={i} size={11} weight="fill" />
                ))}
              </span>
            )}
            {l.dpe && (() => {
              const dc = dpeColor(l.dpe)
              return <span style={{ ...s.heroChip, background: dc.bg, color: dc.fg, borderColor: dc.border }}>DPE {l.dpe}</span>
            })()}
            {l.actif === false && (
              <span style={{ ...s.heroChip, background: 'rgba(148,163,184,0.2)', color: '#94a3b8', borderColor: 'rgba(148,163,184,0.4)' }}>
                En pause
              </span>
            )}
          </div>
          <h1 style={s.heroTitle}>{l.nom}</h1>
          <p style={s.heroAddress}>
            <MapPin size={13} weight="fill" />
            {l.adresse}
          </p>
          <div style={s.heroActions}>
            <Link href={`/dashboard/logements?edit=${l.id}`} style={s.btnPrimary}>
              <PencilSimple size={14} weight="bold" />
              Modifier la fiche
            </Link>
            <Link href="/dashboard/voyageurs" style={s.btnSecondary}>
              <Users size={14} weight="bold" />
              Nouveau séjour
            </Link>
            <Link href={`/dashboard/calendrier?logement=${encodeURIComponent(l.nom)}`} style={s.btnSecondary}>
              <CalendarIcon size={14} weight="bold" />
              Calendrier de ce bien
            </Link>
            <Link href={`/dashboard/revenus?logement=${encodeURIComponent(l.nom)}`} style={s.btnSecondary}>
              <CurrencyEur size={14} weight="bold" />
              Revenus de ce bien
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statIcon}>
            <CurrencyEur size={16} weight="fill" color="#10b981" />
          </div>
          <div style={s.statValue}>{fmtEur(stats.caYTD)}</div>
          <div style={s.statLabel}>CA depuis le 1<sup>er</sup> janvier</div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'var(--accent-bg)' }}>
            <TrendUp size={16} weight="fill" color="var(--accent-text)" />
          </div>
          <div style={{
            ...s.statValue,
            color: stats.occupationPct >= 70 ? '#10b981' : stats.occupationPct >= 40 ? 'var(--accent-text)' : 'var(--text)',
          }}>
            {stats.occupationPct}%
          </div>
          <div style={s.statLabel}>Occupation YTD ({stats.occupiedDays}/{stats.daysSinceYearStart} j)</div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'rgba(96,165,250,0.10)' }}>
            <Users size={16} weight="fill" color="#60a5fa" />
          </div>
          <div style={s.statValue}>{stats.nbSejoursYTD}</div>
          <div style={s.statLabel}>séjour{stats.nbSejoursYTD > 1 ? 's' : ''} cette année</div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'rgba(167,139,250,0.10)' }}>
            <CalendarIcon size={16} weight="fill" color="#a78bfa" />
          </div>
          {stats.nextCheckIn ? (
            <>
              <div style={s.statValue}>{fmtDate(stats.nextCheckIn.date_arrivee)}</div>
              <div style={s.statLabel}>
                Prochain check-in{' '}
                {stats.nextCheckIn.voyageurs && (
                  <>· {stats.nextCheckIn.voyageurs.prenom} {stats.nextCheckIn.voyageurs.nom}</>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ ...s.statValue, color: 'var(--text-muted)' }}>-</div>
              <div style={s.statLabel}>Aucun séjour à venir</div>
            </>
          )}
        </div>
      </div>

      {/* Layout 2 colonnes : prochains séjours + voyageurs récents */}
      <div style={s.twoColumns}>
        {/* Prochains séjours */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>
              <CalendarIcon size={15} weight="fill" />
              Prochains séjours
            </h3>
            {upcomingSejours.length > 0 && (
              <Link href="/dashboard/calendrier" style={s.sectionLink}>
                Voir le calendrier <ArrowRight size={11} weight="bold" />
              </Link>
            )}
          </div>
          {upcomingSejours.length === 0 ? (
            <div style={s.emptyMini}>Aucun séjour à venir</div>
          ) : (
            <div style={s.itemsList}>
              {upcomingSejours.map(sj => {
                const v = sj.voyageurs
                const isContracted = sj.contrat_statut === 'signe'
                return (
                  <Link
                    key={sj.id}
                    href={v ? `/dashboard/voyageurs/${v.id}` : '#'}
                    style={s.sejourItem}
                  >
                    <div style={s.sejourDates}>
                      <span style={s.sejourDateMain}>{fmtDate(sj.date_arrivee)}</span>
                      <span style={s.sejourDateArrow}>→</span>
                      <span style={s.sejourDateMain}>{fmtDate(sj.date_depart)}</span>
                    </div>
                    <div style={s.sejourBody}>
                      <span style={s.sejourName}>
                        {v ? `${v.prenom} ${v.nom}` : 'Voyageur inconnu'}
                      </span>
                      {sj.montant != null && sj.montant > 0 && (
                        <span style={s.sejourAmount}>{fmtEur(sj.montant)}</span>
                      )}
                      <span style={{
                        ...s.sejourStatus,
                        color: isContracted ? '#10b981' : 'var(--text-muted)',
                        background: isContracted ? 'rgba(16,185,129,0.10)' : 'var(--surface)',
                        borderColor: isContracted ? 'rgba(16,185,129,0.25)' : 'var(--border)',
                      }}>
                        {isContracted ? 'Signé' : sj.contrat_statut === 'en_attente' ? 'En attente' : 'Brouillon'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Voyageurs récents */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>
              <Users size={15} weight="fill" />
              Voyageurs récents
            </h3>
          </div>
          {recentVoyageurs.length === 0 ? (
            <div style={s.emptyMini}>Personne n&apos;est encore passé ici</div>
          ) : (
            <div style={s.itemsList}>
              {recentVoyageurs.map(sj => {
                const v = sj.voyageurs!
                const initials = `${v.prenom[0] ?? ''}${v.nom[0] ?? ''}`.toUpperCase()
                return (
                  <Link key={v.id} href={`/dashboard/voyageurs/${v.id}`} style={s.voyageurItem}>
                    <span style={s.voyageurAvatar}>{initials}</span>
                    <div style={s.voyageurBody}>
                      <span style={s.voyageurName}>{v.prenom} {v.nom}</span>
                      <span style={s.voyageurMeta}>
                        Dernière venue : {fmtDate(sj.date_arrivee)}
                        {v.email && ` · ${v.email}`}
                      </span>
                    </div>
                    <ArrowRight size={12} color="var(--text-muted)" weight="bold" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Infos pratiques + Contacts utiles */}
      <div style={s.twoColumns}>
        {/* Infos pratiques */}
        {(l.heure_arrivee || l.heure_depart || l.code_acces || l.wifi_nom) && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <Sparkle size={15} weight="fill" />
                Infos pratiques
              </h3>
            </div>
            <div style={s.chipsRow}>
              {(l.heure_arrivee || l.heure_depart) && (
                <div style={s.infoChip}>
                  <Clock size={12} weight="fill" color="#60a5fa" />
                  <span>
                    {l.heure_arrivee && <>Arrivée {l.heure_arrivee}</>}
                    {l.heure_arrivee && l.heure_depart && ' · '}
                    {l.heure_depart && <>Départ {l.heure_depart}</>}
                  </span>
                </div>
              )}
              {l.wifi_nom && (
                <CopyChip
                  icon={<WifiHigh size={12} weight="bold" color="#10b981" />}
                  label={l.wifi_mdp ? `${l.wifi_nom} · ${l.wifi_mdp}` : l.wifi_nom}
                  value={l.wifi_mdp ? `${l.wifi_nom} / ${l.wifi_mdp}` : l.wifi_nom}
                />
              )}
              {l.code_acces && (
                <CopyChip
                  icon={<Key size={12} weight="bold" color="var(--accent-text)" />}
                  label={`Code : ${l.code_acces}`}
                  value={l.code_acces}
                />
              )}
              {l.telephone && (
                <CopyChip
                  icon={<Phone size={12} weight="fill" color="var(--text-2)" />}
                  label={l.telephone}
                  value={l.telephone}
                />
              )}
            </div>
          </div>
        )}

        {/* Contacts utiles */}
        {(l.contact_urgence_nom || l.contact_menage_nom) && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <Wrench size={15} weight="fill" />
                Contacts utiles
              </h3>
            </div>
            <div style={s.contactsList}>
              {l.contact_urgence_nom && (
                <div style={s.contactRow}>
                  <div style={{ ...s.contactBadge, background: 'rgba(239,68,68,0.10)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}>
                    Urgence
                  </div>
                  <div style={s.contactBody}>
                    <span style={s.contactName}>{l.contact_urgence_nom}</span>
                    {l.contact_urgence_tel && (
                      <a href={`tel:${l.contact_urgence_tel}`} style={s.contactTel}>{l.contact_urgence_tel}</a>
                    )}
                  </div>
                </div>
              )}
              {l.contact_menage_nom && (
                <div style={s.contactRow}>
                  <div style={{ ...s.contactBadge, background: 'rgba(96,165,250,0.10)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.25)' }}>
                    Ménage
                  </div>
                  <div style={s.contactBody}>
                    <span style={s.contactName}>{l.contact_menage_nom}</span>
                    {l.contact_menage_tel && (
                      <a href={`tel:${l.contact_menage_tel}`} style={s.contactTel}>{l.contact_menage_tel}</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conformité + Tarifs */}
      <div style={s.twoColumns}>
        {/* Conformité */}
        {(l.numero_enregistrement || l.classement_etoiles || l.dpe || l.surface_m2 || l.nb_chambres || l.nb_lits || l.nb_sdb) && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <ShieldCheck size={15} weight="fill" />
                Caractéristiques & conformité
              </h3>
            </div>
            <div style={s.detailRows}>
              {l.surface_m2 && <div style={s.detailRow}><span style={s.detailKey}>Surface</span><span style={s.detailVal}>{l.surface_m2} m²</span></div>}
              {l.nb_chambres != null && l.nb_chambres > 0 && <div style={s.detailRow}><span style={s.detailKey}>Chambres</span><span style={s.detailVal}>{l.nb_chambres}</span></div>}
              {l.nb_lits != null && l.nb_lits > 0 && <div style={s.detailRow}><span style={s.detailKey}>Lits</span><span style={s.detailVal}>{l.nb_lits}</span></div>}
              {l.nb_sdb != null && l.nb_sdb > 0 && <div style={s.detailRow}><span style={s.detailKey}>Salles de bain</span><span style={s.detailVal}>{l.nb_sdb}</span></div>}
              <div style={s.detailRow}><span style={s.detailKey}>Capacité</span><span style={s.detailVal}>{l.capacite_max} personnes</span></div>
              {l.numero_enregistrement && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>N° enregistrement</span>
                  <span style={s.detailVal}>{l.numero_enregistrement}</span>
                </div>
              )}
              {l.classement_etoiles != null && l.classement_etoiles > 0 && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>Classement</span>
                  <span style={s.detailVal}>{'★'.repeat(l.classement_etoiles)} ({l.classement_etoiles}/5)</span>
                </div>
              )}
              {l.dpe && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>DPE</span>
                  <span style={{ ...s.detailVal, color: dpeColor(l.dpe).fg, fontWeight: 700 }}>{l.dpe}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tarifs */}
        {(l.tarif_nuitee_moyen || l.frais_menage || l.caution) && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <CurrencyEur size={15} weight="fill" />
                Tarifs indicatifs
              </h3>
            </div>
            <div style={s.detailRows}>
              {l.tarif_nuitee_moyen && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>Nuitée moyenne</span>
                  <span style={{ ...s.detailVal, color: '#10b981', fontWeight: 700 }}>{fmtEur(l.tarif_nuitee_moyen)}</span>
                </div>
              )}
              {l.frais_menage && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>Frais de ménage</span>
                  <span style={s.detailVal}>{fmtEur(l.frais_menage)}</span>
                </div>
              )}
              {l.caution && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>Caution</span>
                  <span style={s.detailVal}>{fmtEur(l.caution)}</span>
                </div>
              )}
              {l.methodes_paiement && (
                <div style={s.detailRow}>
                  <span style={s.detailKey}>Paiements</span>
                  <span style={s.detailVal}>{l.methodes_paiement.split(',').map(m => m.trim()).join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Équipements + Liens */}
      <div style={s.twoColumns}>
        {/* Équipements */}
        {l.equipements && l.equipements.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <Sparkle size={15} weight="fill" />
                Équipements
              </h3>
            </div>
            <div style={s.equipChips}>
              {l.equipements.map(eq => {
                const def = EQUIPEMENT_LABELS[eq] ?? { label: eq, emoji: '✓' }
                return (
                  <span key={eq} style={s.equipChip}>
                    <span>{def.emoji}</span>
                    {def.label}
                  </span>
                )
              })}
              {l.animaux_acceptes && <span style={s.equipChip}>🐾 Animaux acceptés</span>}
              {l.fumeur_accepte && <span style={s.equipChip}>🚬 Fumeur autorisé</span>}
            </div>
          </div>
        )}

        {/* Liens annonces externes */}
        {(l.lien_airbnb || l.lien_booking || l.lien_gmb || l.lien_site_direct) && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>
                <ArrowSquareOut size={15} weight="fill" />
                Liens annonces
              </h3>
            </div>
            <div style={s.linksList}>
              {l.lien_airbnb && (
                <a href={l.lien_airbnb} target="_blank" rel="noopener noreferrer" style={s.linkRow}>
                  <span style={s.linkEmoji}>🏠</span>
                  <span style={s.linkLabel}>Airbnb</span>
                  <ArrowSquareOut size={11} color="var(--text-muted)" />
                </a>
              )}
              {l.lien_booking && (
                <a href={l.lien_booking} target="_blank" rel="noopener noreferrer" style={s.linkRow}>
                  <span style={s.linkEmoji}>🛎️</span>
                  <span style={s.linkLabel}>Booking.com</span>
                  <ArrowSquareOut size={11} color="var(--text-muted)" />
                </a>
              )}
              {l.lien_gmb && (
                <a href={l.lien_gmb} target="_blank" rel="noopener noreferrer" style={s.linkRow}>
                  <span style={s.linkEmoji}>📍</span>
                  <span style={s.linkLabel}>Google Business Profile</span>
                  <ArrowSquareOut size={11} color="var(--text-muted)" />
                </a>
              )}
              {l.lien_site_direct && (
                <a href={l.lien_site_direct} target="_blank" rel="noopener noreferrer" style={s.linkRow}>
                  <span style={s.linkEmoji}>🌐</span>
                  <span style={s.linkLabel}>Site direct</span>
                  <ArrowSquareOut size={11} color="var(--text-muted)" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Propriétaire (conciergerie) */}
      {(l.proprietaire_nom || l.proprietaire_email || l.proprietaire_telephone || l.honoraires_pct != null) && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>
              <Users size={15} weight="fill" />
              Propriétaire (conciergerie)
            </h3>
          </div>
          <div style={s.detailRows}>
            {l.proprietaire_nom && (
              <div style={s.detailRow}>
                <span style={s.detailKey}>Nom</span>
                <span style={s.detailVal}>{l.proprietaire_nom}</span>
              </div>
            )}
            {l.proprietaire_email && (
              <div style={s.detailRow}>
                <span style={s.detailKey}>Email</span>
                <a href={`mailto:${l.proprietaire_email}`} style={{ ...s.detailVal, color: 'var(--accent-text)', textDecoration: 'none' as const }}>{l.proprietaire_email}</a>
              </div>
            )}
            {l.proprietaire_telephone && (
              <div style={s.detailRow}>
                <span style={s.detailKey}>Téléphone</span>
                <a href={`tel:${l.proprietaire_telephone}`} style={{ ...s.detailVal, color: 'var(--accent-text)', textDecoration: 'none' as const }}>{l.proprietaire_telephone}</a>
              </div>
            )}
            {l.honoraires_pct != null && (
              <div style={s.detailRow}>
                <span style={s.detailKey}>Honoraires</span>
                <span style={{ ...s.detailVal, color: '#a78bfa', fontWeight: 700 }}>{l.honoraires_pct}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {l.description && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>Description</h3>
          </div>
          <p style={s.descText}>{l.description}</p>
        </div>
      )}

      {/* Conditions & règlement (collapsible feel : light) */}
      {(l.conditions_annulation || l.reglement_interieur) && (
        <div style={s.twoColumns}>
          {l.conditions_annulation && (
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Conditions d&apos;annulation</h3>
              </div>
              <p style={s.descText}>{l.conditions_annulation}</p>
            </div>
          )}
          {l.reglement_interieur && (
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Règlement intérieur</h3>
              </div>
              <p style={{ ...s.descText, whiteSpace: 'pre-wrap' as const }}>{l.reglement_interieur}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text-2)',
    textDecoration: 'none' as const,
    width: 'fit-content',
  },

  // Hero
  hero: {
    position: 'relative' as const,
    display: 'flex', flexDirection: 'column' as const,
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '20px',
    overflow: 'hidden' as const,
  },
  heroImageWrap: {
    position: 'relative' as const,
    width: '100%',
    height: '220px',
    overflow: 'hidden' as const,
  },
  heroImage: {
    width: '100%', height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  heroOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)',
  },
  heroFallback: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    padding: '20px 24px 24px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  heroChips: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  heroChip: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    borderRadius: '100px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px,3vw,34px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: 0,
  },
  heroAddress: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '14px', color: 'var(--text-2)',
    margin: 0,
  },
  heroActions: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '10px',
    marginTop: '8px',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px',
    fontSize: '13px', fontWeight: 600,
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '10px',
    textDecoration: 'none' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px',
    fontSize: '13px', fontWeight: 500,
    background: 'var(--surface)',
    color: 'var(--text-2)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    textDecoration: 'none' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Stats cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    padding: '16px 18px',
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  statIcon: {
    width: '32px', height: '32px', borderRadius: '9px',
    background: 'rgba(16,185,129,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400,
    color: 'var(--text)',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },

  // 2-column layout
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },

  // Sections
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex', flexDirection: 'column' as const, gap: '12px',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px', fontWeight: 500,
    color: 'var(--text)',
    margin: 0,
  },
  sectionLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 500,
    color: 'var(--accent-text)',
    textDecoration: 'none' as const,
  },
  emptyMini: {
    fontSize: '12px', fontWeight: 300,
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
    padding: '20px',
  },
  itemsList: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
  },

  // Séjour item
  sejourItem: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    padding: '10px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none' as const,
    color: 'var(--text-2)',
  },
  sejourDates: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12px', color: 'var(--text-muted)',
  },
  sejourDateMain: {
    fontWeight: 500,
    color: 'var(--text-2)',
  },
  sejourDateArrow: {
    color: 'var(--text-muted)',
  },
  sejourBody: {
    display: 'flex', alignItems: 'center', gap: '8px',
    flexWrap: 'wrap' as const,
  },
  sejourName: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--text)',
    flex: 1, minWidth: 0,
  },
  sejourAmount: {
    fontSize: '12px', fontWeight: 600,
    color: '#10b981',
  },
  sejourStatus: {
    fontSize: '10px', fontWeight: 600,
    padding: '2px 8px',
    border: '1px solid',
    borderRadius: '100px',
    letterSpacing: '0.3px',
  },

  // Voyageur item
  voyageurItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none' as const,
    color: 'var(--text-2)',
  },
  voyageurAvatar: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700,
    flexShrink: 0,
  },
  voyageurBody: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column' as const, gap: '1px',
  },
  voyageurName: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  voyageurMeta: {
    fontSize: '11px', color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },

  // Chips row (infos pratiques)
  chipsRow: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  infoChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 11px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-2)',
  },

  // Contacts
  contactsList: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
  },
  contactRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  contactBadge: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    padding: '3px 8px',
    border: '1px solid',
    borderRadius: '100px',
    flexShrink: 0,
  },
  contactBody: {
    flex: 1, minWidth: 0,
    display: 'flex', alignItems: 'baseline',
    gap: '8px', flexWrap: 'wrap' as const,
  },
  contactName: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
  },
  contactTel: {
    fontSize: '12px', fontWeight: 500,
    color: 'var(--accent-text)',
    textDecoration: 'none' as const,
  },

  // Detail rows (caractéristiques + tarifs)
  detailRows: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
  },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px dashed var(--border)',
    fontSize: '13px',
  },
  detailKey: {
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  detailVal: {
    color: 'var(--text)',
    fontWeight: 500,
  },

  // Équipements
  equipChips: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  equipChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 10px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-2)',
  },

  // Liens
  linksList: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  },
  linkRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none' as const,
    color: 'var(--text-2)',
  },
  linkEmoji: { fontSize: '14px', flexShrink: 0 },
  linkLabel: {
    flex: 1, minWidth: 0,
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
  },

  // Description text
  descText: {
    fontSize: '13px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.6,
    margin: 0,
  },

  // CopyChip (réutilisé partout)
  copyChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 11px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
