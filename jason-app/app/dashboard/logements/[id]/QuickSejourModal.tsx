'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Users, Plus, MagnifyingGlass, CalendarBlank, CurrencyEur, FileText, ArrowRight, Check, House,
} from '@phosphor-icons/react/dist/ssr'
import { addVoyageur, addSejour } from '@/app/dashboard/voyageurs/actions'
import { CalendarInput } from '@/components/ui/CalendarInput'
import { NATIONALITES } from '@/lib/nationalites'

export type VoyageurOption = {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
}

interface Props {
  /** Logement imposé (fiche logement). Sinon l'hôte choisit dans `logements`. */
  logementId?: string
  logementNom?: string
  /** Choix du logement (page Contrats & paiements). */
  logements?: Array<{ id: string; nom: string }>
  voyageurs: VoyageurOption[]
  onClose: () => void
  /** Ne propose que « Créer + contrat » (depuis « Nouveau contrat »). */
  contractOnly?: boolean
  /** Dates et logement préremplis (réservation Airbnb/Booking synchronisée). */
  defaults?: { logementNom?: string; dateArrivee?: string; dateDepart?: string }
  /**
   * Réservation venue d'une plateforme : le séjour est enregistré comme
   * « contrat géré par la plateforme » (pas de contrat ni de paiement proposé),
   * pour rattacher le voyageur (déclaration, carnet). Mes réservations, sept. 2026.
   */
  platform?: 'airbnb' | 'booking' | 'vrbo'
}

const PLATFORM_NAMES = { airbnb: 'Airbnb', booking: 'Booking', vrbo: 'Vrbo' } as const

type Mode = 'existing' | 'new'

export default function QuickSejourModal({ logementNom: fixedLogementNom, logements = [], voyageurs, onClose, contractOnly = false, defaults, platform }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(voyageurs.length > 0 ? 'existing' : 'new')
  const [search, setSearch] = useState('')
  const [selectedVoyageurId, setSelectedVoyageurId] = useState<string | null>(null)

  const [newPrenom, setNewPrenom] = useState('')
  const [newNom, setNewNom] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newTel, setNewTel] = useState('')
  const [newNationalite, setNewNationalite] = useState('')

  const [chosenLogement, setChosenLogement] = useState(defaults?.logementNom ?? (logements.length === 1 ? logements[0].nom : ''))
  const logementNom = fixedLogementNom ?? chosenLogement
  const [dateArrivee, setDateArrivee] = useState(defaults?.dateArrivee ?? '')
  const [dateDepart, setDateDepart] = useState(defaults?.dateDepart ?? '')
  const [montant, setMontant] = useState('')

  const [submitting, setSubmitting] = useState<null | 'sejour' | 'sejour-contract'>(null)
  const [error, setError] = useState<string | null>(null)

  // Esc pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!search.trim()) return voyageurs.slice(0, 8)
    const q = search.toLowerCase()
    return voyageurs.filter(v =>
      v.prenom.toLowerCase().includes(q) ||
      v.nom.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q),
    ).slice(0, 8)
  }, [voyageurs, search])

  const datesValid = !!dateArrivee && !!dateDepart && dateArrivee <= dateDepart
  const voyageurValid = mode === 'existing'
    ? !!selectedVoyageurId
    : !!newPrenom.trim() && !!newNom.trim()

  const canSubmit = datesValid && voyageurValid && !!logementNom && submitting === null

  async function ensureVoyageurId(): Promise<string | null> {
    if (mode === 'existing') return selectedVoyageurId
    const res = await addVoyageur({
      prenom: newPrenom.trim(),
      nom: newNom.trim(),
      email: newEmail.trim() || undefined,
      telephone: newTel.trim() || undefined,
      nationalite: newNationalite || null,
      ...(platform ? { source: platform } : {}),
    })
    if (res.error || !res.id) {
      setError(res.error ?? 'Impossible de créer le voyageur')
      return null
    }
    return res.id
  }

  async function handleSubmit(withContract: boolean) {
    setSubmitting(withContract ? 'sejour-contract' : 'sejour')
    setError(null)

    try {
      const voyageurId = await ensureVoyageurId()
      if (!voyageurId) { setSubmitting(null); return }

      const montantNum = montant.trim() ? parseFloat(montant.replace(',', '.')) : null
      const sejourRes = await addSejour({
        voyageur_id: voyageurId,
        logement: logementNom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        montant: Number.isFinite(montantNum) ? montantNum : null,
        // Plateforme : contrat et paiement gérés par Airbnb/Booking
        ...(platform
          ? { contrat_statut: 'signe' as const, contrat_plateforme: platform }
          : { contrat_statut: 'nouveau' as const }),
      })
      if (sejourRes.error || !sejourRes.id) {
        setError(sejourRes.error ?? 'Impossible de créer le séjour')
        setSubmitting(null)
        return
      }

      if (withContract) {
        router.push(`/dashboard/voyageurs/${voyageurId}?contract=${sejourRes.id}`)
      } else {
        router.push(`/dashboard/voyageurs/${voyageurId}`)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inattendue')
      setSubmitting(null)
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <header style={header}>
          <div>
            <h2 style={title}>{platform ? `Voyageur de la réservation ${PLATFORM_NAMES[platform]}` : contractOnly ? 'Nouvelle réservation directe' : 'Nouvelle réservation'}</h2>
            <p style={subtitle}>
              {platform
                ? 'Nom et nationalité : de quoi préparer la déclaration (fiche de police, SIBA) et garder le contact.'
                : fixedLogementNom ?? 'Le voyageur, les dates, puis le contrat à signer'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Fermer">
            <X size={16} weight="bold" />
          </button>
        </header>

        <div style={body}>
          {/* ─── Voyageur ───────────────────────── */}
          <section style={section}>
            <h3 style={sectionTitle}>
              <Users size={13} weight="fill" />
              Voyageur
            </h3>

            <div style={tabsRow}>
              <button
                type="button"
                onClick={() => setMode('existing')}
                disabled={voyageurs.length === 0}
                style={mode === 'existing' ? tabActive : tab}
              >
                Existant
              </button>
              <button type="button" onClick={() => setMode('new')} style={mode === 'new' ? tabActive : tab}>
                <Plus size={11} weight="bold" />
                Nouveau
              </button>
            </div>

            {mode === 'existing' && (
              <>
                <div style={searchWrap}>
                  <MagnifyingGlass size={13} weight="bold" color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Chercher par prénom, nom ou email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={searchInput}
                    autoFocus
                  />
                </div>
                <div style={list}>
                  {filtered.length === 0 && (
                    <div style={emptyList}>Aucun voyageur trouvé. Crée un nouveau voyageur ↑</div>
                  )}
                  {filtered.map(v => {
                    const selected = v.id === selectedVoyageurId
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoyageurId(v.id)}
                        style={selected ? listItemSelected : listItem}
                      >
                        <div style={avatar}>{(v.prenom[0] ?? '') + (v.nom[0] ?? '')}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={listItemName}>{v.prenom} {v.nom}</div>
                          {v.email && <div style={listItemMeta}>{v.email}</div>}
                        </div>
                        {selected && <Check size={14} weight="bold" color="var(--accent-text)" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {mode === 'new' && (
              <div style={grid2}>
                <div>
                  <label style={fieldLabel}>Prénom *</label>
                  <input value={newPrenom} onChange={e => setNewPrenom(e.target.value)} style={input} autoFocus />
                </div>
                <div>
                  <label style={fieldLabel}>Nom *</label>
                  <input value={newNom} onChange={e => setNewNom(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={fieldLabel}>Email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={fieldLabel}>Téléphone</label>
                  <input type="tel" value={newTel} onChange={e => setNewTel(e.target.value)} style={input} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={fieldLabel}>Nationalité {platform ? '(pour la déclaration)' : ''}</label>
                  <select value={newNationalite} onChange={e => setNewNationalite(e.target.value)} style={input} aria-label="Nationalité">
                    <option value="">Choisir un pays…</option>
                    {NATIONALITES.map(n => <option key={n.code} value={n.code}>{n.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ─── Logement (quand il n'est pas imposé) ── */}
          {!fixedLogementNom && (
            <section style={section}>
              <h3 style={sectionTitle}>
                <House size={13} weight="fill" />
                Logement
              </h3>
              {logements.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Ajoute d&apos;abord ton logement dans « Gérer mes logements » (sélecteur en bas du menu).
                </p>
              ) : (
                <select value={chosenLogement} onChange={e => setChosenLogement(e.target.value)} style={input} aria-label="Logement">
                  <option value="">Choisir le logement…</option>
                  {logements.map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                </select>
              )}
            </section>
          )}

          {/* ─── Dates ───────────────────────── */}
          <section style={section}>
            <h3 style={sectionTitle}>
              <CalendarBlank size={13} weight="fill" />
              Dates du séjour
            </h3>
            <div style={grid2}>
              <div>
                <label style={fieldLabel}>Arrivée *</label>
                <CalendarInput
                  value={dateArrivee}
                  onChange={v => {
                    setDateArrivee(v)
                    if (dateDepart && v && dateDepart < v) setDateDepart(v)
                  }}
                  placeholder="Choisir une date"
                />
              </div>
              <div>
                <label style={fieldLabel}>Départ *</label>
                <CalendarInput
                  value={dateDepart}
                  onChange={setDateDepart}
                  placeholder="Choisir une date"
                />
              </div>
            </div>
          </section>

          {/* ─── Montant (optionnel) ───────────────────────── */}
          <section style={section}>
            <h3 style={sectionTitle}>
              <CurrencyEur size={13} weight="fill" />
              Montant <span style={optional}>(optionnel)</span>
            </h3>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              style={input}
            />
          </section>

          {error && <div style={errBox}>{error}</div>}
        </div>

        <footer style={footer}>
          <button type="button" onClick={onClose} style={ghostBtn} disabled={submitting !== null}>
            Annuler
          </button>
          {(!contractOnly || platform) && <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!canSubmit}
            style={{ ...(platform ? primaryBtn : secondaryBtn), opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {submitting === 'sejour' ? 'Création…' : platform ? 'Enregistrer le voyageur' : 'Créer le séjour'}
          </button>}
          {!platform && <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!canSubmit}
            style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            <FileText size={13} weight="bold" />
            {submitting === 'sejour-contract' ? 'Création…' : contractOnly ? 'Continuer vers le contrat' : 'Créer + contrat'}
            <ArrowRight size={11} weight="bold" />
          </button>}
        </footer>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'var(--s-5)', zIndex: 100,
  animation: 'fadeIn var(--d-base) var(--ease-smooth)',
}

const modal: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-xl)',
  width: '100%', maxWidth: '560px', maxHeight: '92vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
  boxShadow: 'var(--shadow-xl)',
  animation: 'scaleIn var(--d-base) var(--ease-out)',
}

const header: React.CSSProperties = {
  padding: '18px 22px', borderBottom: '1px solid var(--border-2)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
  flexShrink: 0,
}

const title: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: '20px', fontWeight: 500, color: 'var(--text)', margin: 0,
}

const subtitle: React.CSSProperties = {
  fontSize: '12.5px', color: 'var(--text-2)', margin: '3px 0 0', fontWeight: 500,
}

const closeBtn: React.CSSProperties = {
  width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-2)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

const body: React.CSSProperties = {
  padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px',
  flex: 1,
}

const section: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '10px',
}

const sectionTitle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', margin: 0,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const optional: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0,
}

const tabsRow: React.CSSProperties = {
  display: 'inline-flex', gap: '4px', padding: '3px', background: 'var(--bg-2)',
  border: '1px solid var(--border)', borderRadius: '9px', alignSelf: 'flex-start',
}

const tab: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '5px 11px', fontSize: '12px', fontWeight: 500,
  color: 'var(--text-2)', background: 'transparent', border: 'none', borderRadius: '7px',
  cursor: 'pointer', fontFamily: 'inherit',
}

const tabActive: React.CSSProperties = { ...tab, background: 'var(--surface)', color: 'var(--text)' }

const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '9px',
}

const searchInput: React.CSSProperties = {
  flex: 1, border: 'none', background: 'transparent', outline: 'none',
  fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit',
}

const list: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto',
}

const listItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '8px 11px', borderRadius: '9px', background: 'transparent', border: '1px solid transparent',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
  transition: 'all 0.12s ease',
}

const listItemSelected: React.CSSProperties = {
  ...listItem, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)',
}

const avatar: React.CSSProperties = {
  width: '30px', height: '30px', borderRadius: '50%',
  background: 'var(--accent-bg-2)', color: 'var(--accent-text)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0,
}

const listItemName: React.CSSProperties = {
  fontSize: '13px', fontWeight: 500, color: 'var(--text)',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const listItemMeta: React.CSSProperties = {
  fontSize: '11.5px', color: 'var(--text-2)', marginTop: '1px',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const emptyList: React.CSSProperties = {
  fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '14px',
}

const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '5px',
}

const input: React.CSSProperties = {
  width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: '9px',
  background: 'var(--bg-2)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

const errBox: React.CSSProperties = {
  padding: '9px 12px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', fontSize: '12.5px',
}

const footer: React.CSSProperties = {
  padding: '14px 22px', borderTop: '1px solid var(--border-2)',
  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px',
  flexShrink: 0, flexWrap: 'wrap',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: '13px', fontWeight: 500,
  color: 'var(--text-2)', background: 'transparent', border: '1px solid var(--border)',
  borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: '13px', fontWeight: 600,
  color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '9px', fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', fontSize: '13px', fontWeight: 600,
  color: 'var(--bg)', background: 'var(--accent-text)', border: 'none',
  borderRadius: '9px', fontFamily: 'inherit',
}
