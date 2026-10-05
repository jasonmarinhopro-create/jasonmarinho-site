'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Users, Plus, MagnifyingGlass, CalendarBlank, FileText, ArrowRight, Check, House, Moon, UserPlus, Info,
} from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
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

  // Fermeture protégée (05/10/2026, Jason : « à peine je clique sur le côté,
  // ça ferme tout ») : plus de fermeture au clic à côté, et Échap / croix /
  // Annuler demandent confirmation dès qu'une saisie serait perdue
  const { confirm, dialog } = useConfirm()
  const dirty = !!(selectedVoyageurId || newPrenom || newNom || newEmail || newTel || newNationalite || montant
    || (!fixedLogementNom && chosenLogement !== (defaults?.logementNom ?? (logements.length === 1 ? logements[0].nom : '')))
    || dateArrivee !== (defaults?.dateArrivee ?? '') || dateDepart !== (defaults?.dateDepart ?? ''))
  const requestClose = useCallback(async () => {
    if (submitting) return
    if (dirty && !(await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'Ce que tu as saisi pour cette réservation sera perdu.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    }))) return
    onClose()
  }, [dirty, submitting, confirm, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); requestClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestClose])

  // Bloque le défilement de la page derrière la fenêtre
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

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
  const nights = datesValid
    ? Math.round((Date.parse(`${dateDepart}T12:00:00Z`) - Date.parse(`${dateArrivee}T12:00:00Z`)) / 86400000)
    : 0
  const montantNum = montant.trim() ? Number(montant.replace(',', '.')) : NaN
  const selectedVoyageur = voyageurs.find(v => v.id === selectedVoyageurId) ?? null
  const guestLabel = mode === 'existing'
    ? (selectedVoyageur ? `${selectedVoyageur.prenom} ${selectedVoyageur.nom}` : null)
    : ([newPrenom.trim(), newNom.trim()].filter(Boolean).join(' ') || null)
  const missing = [
    !voyageurValid && (mode === 'existing' ? 'choisis le voyageur' : 'prénom et nom du voyageur'),
    !logementNom && 'le logement',
    !datesValid && (dateArrivee && dateDepart ? 'des dates valides' : 'les dates'),
  ].filter(Boolean) as string[]
  const steps = platform ? ['Voyageur', 'Séjour'] : ['Voyageur', 'Séjour', 'Contrat']

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

  const frDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const useTiles = !fixedLogementNom && logements.length > 0 && logements.length <= 6

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="qsm-title">
      <div style={modal}>
        {/* ─── En-tête ─────────────────────────── */}
        <header style={header}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={eyebrow}>
              {platform ? `Réservation ${PLATFORM_NAMES[platform]}` : contractOnly ? 'Réservation directe' : 'Nouvelle réservation'}
              {fixedLogementNom ? ` · ${fixedLogementNom}` : ''}
            </p>
            <h2 id="qsm-title" style={title}>
              {platform ? 'Ajoute le voyageur' : contractOnly ? 'Nouvelle réservation directe' : 'Nouvelle réservation'}
            </h2>
            <p style={subtitle}>
              {platform
                ? 'Son nom et sa nationalité suffisent pour préparer la déclaration (fiche de police, SIBA) et garder le contact.'
                : contractOnly
                  ? 'Le voyageur et les dates : le contrat se remplit ensuite tout seul, prêt à envoyer.'
                  : 'Le voyageur et les dates, puis le contrat si tu le souhaites.'}
            </p>
            <ol style={stepsRow} aria-label="Étapes">
              {steps.map((label, i) => {
                const done = i === 0 ? voyageurValid : i === 1 ? (datesValid && !!logementNom) : false
                const next = i === 2
                return (
                  <li key={label} style={{ ...stepPill, ...(next ? stepPillNext : {}) }}>
                    <span style={{ ...stepNum, ...(done ? stepNumDone : next ? stepNumNext : {}) }}>
                      {done ? <Check size={11} weight="bold" /> : i + 1}
                    </span>
                    {label}{next ? ' (ensuite)' : ''}
                  </li>
                )
              })}
            </ol>
          </div>
          <button type="button" onClick={requestClose} style={closeBtn} aria-label="Fermer">
            <X size={16} weight="bold" />
          </button>
        </header>

        <div style={body}>
          <div style={columns}>
            {/* ─── 1. Voyageur ───────────────────────── */}
            <section style={card}>
              <div style={cardHead}>
                <span style={cardIcon}><Users size={16} weight="fill" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={cardTitle}>Le voyageur</h3>
                  <p style={cardSub}>{guestLabel ?? 'Déjà dans ton carnet, ou nouveau'}</p>
                </div>
              </div>

              <div style={segment} role="tablist">
                <button type="button" role="tab" aria-selected={mode === 'existing'} onClick={() => setMode('existing')}
                  disabled={voyageurs.length === 0} style={mode === 'existing' ? segOn : segOff}>
                  <Users size={13} weight={mode === 'existing' ? 'fill' : 'regular'} /> Mon carnet
                </button>
                <button type="button" role="tab" aria-selected={mode === 'new'} onClick={() => setMode('new')} style={mode === 'new' ? segOn : segOff}>
                  <UserPlus size={13} weight={mode === 'new' ? 'fill' : 'regular'} /> Nouveau voyageur
                </button>
              </div>

              {mode === 'existing' && (
                <>
                  <div style={searchWrap}>
                    <MagnifyingGlass size={14} weight="bold" color="var(--text-3)" />
                    <input
                      type="text"
                      placeholder="Prénom, nom ou e-mail"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={searchInput}
                      aria-label="Chercher un voyageur"
                    />
                  </div>
                  <div style={list}>
                    {filtered.length === 0 && (
                      <div style={emptyList}>
                        Personne à ce nom.{' '}
                        {search.trim() && <button type="button" onClick={() => { setMode('new'); const [p, ...n] = search.trim().split(/\s+/); setNewPrenom(p ?? ''); setNewNom(n.join(' ')) }} style={linkBtn}>
                          Créer « {search.trim()} »
                        </button>}
                      </div>
                    )}
                    {filtered.map(v => {
                      const selected = v.id === selectedVoyageurId
                      const meta = v.email && !/@guest\.(booking|airbnb)\.com$/i.test(v.email) ? v.email : v.telephone ?? v.email
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVoyageurId(selected ? null : v.id)}
                          style={selected ? listItemSelected : listItem}
                          aria-pressed={selected}
                        >
                          <div style={selected ? avatarOn : avatar}>{((v.prenom[0] ?? '') + (v.nom[0] ?? '')) || '?'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={listItemName}>{v.prenom} {v.nom}</div>
                            {meta && <div style={listItemMeta}>{meta}</div>}
                          </div>
                          <span style={selected ? radioOn : radio}>{selected && <Check size={11} weight="bold" />}</span>
                        </button>
                      )
                    })}
                  </div>
                  {!search.trim() && voyageurs.length > filtered.length && (
                    <p style={hintText}>Les {filtered.length} derniers voyageurs. Cherche pour retrouver les autres.</p>
                  )}
                </>
              )}

              {mode === 'new' && (
                <div style={grid2}>
                  <Field label="Prénom" required>
                    <input value={newPrenom} onChange={e => setNewPrenom(e.target.value)} style={input} autoFocus autoComplete="off" />
                  </Field>
                  <Field label="Nom" required>
                    <input value={newNom} onChange={e => setNewNom(e.target.value)} style={input} autoComplete="off" />
                  </Field>
                  <Field label="E-mail" hint={platform ? undefined : 'pour lui envoyer le contrat'}>
                    <input type="email" inputMode="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={input} autoComplete="off" />
                  </Field>
                  <Field label="Téléphone">
                    <input type="tel" inputMode="tel" value={newTel} onChange={e => setNewTel(e.target.value)} style={input} autoComplete="off" />
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Nationalité" hint="pour la déclaration (fiche de police, SIBA)">
                      <select value={newNationalite} onChange={e => setNewNationalite(e.target.value)} style={input} aria-label="Nationalité">
                        <option value="">Choisir un pays</option>
                        {NATIONALITES.map(n => <option key={n.code} value={n.code}>{n.name}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}
            </section>

            {/* ─── 2. Séjour ───────────────────────── */}
            <section style={card}>
              <div style={cardHead}>
                <span style={cardIcon}><CalendarBlank size={16} weight="fill" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={cardTitle}>Le séjour</h3>
                  <p style={cardSub}>{fixedLogementNom ?? (logementNom || 'Logement et dates')}</p>
                </div>
              </div>

              {!fixedLogementNom && (
                <div>
                  <p style={fieldLabel}>Logement <span style={req}>*</span></p>
                  {logements.length === 0 ? (
                    <p style={{ ...hintText, margin: 0 }}>
                      Ajoute d&apos;abord ton logement dans « Gérer mes logements » (sélecteur en bas du menu).
                    </p>
                  ) : useTiles ? (
                    <div style={tiles}>
                      {logements.map(l => {
                        const on = chosenLogement === l.nom
                        return (
                          <button key={l.id} type="button" onClick={() => setChosenLogement(l.nom)} style={on ? tileOn : tile} aria-pressed={on}>
                            <House size={15} weight={on ? 'fill' : 'regular'} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nom}</span>
                            {on && <Check size={13} weight="bold" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <select value={chosenLogement} onChange={e => setChosenLogement(e.target.value)} style={input} aria-label="Logement">
                      <option value="">Choisir le logement</option>
                      {logements.map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                    </select>
                  )}
                </div>
              )}

              <div style={grid2}>
                <Field label="Arrivée" required>
                  <CalendarInput
                    value={dateArrivee}
                    onChange={v => {
                      setDateArrivee(v)
                      if (dateDepart && v && dateDepart < v) setDateDepart(v)
                    }}
                    placeholder="Choisir"
                  />
                </Field>
                <Field label="Départ" required>
                  <CalendarInput value={dateDepart} onChange={setDateDepart} placeholder="Choisir" />
                </Field>
              </div>

              {datesValid && (
                <div style={nightsBox}>
                  <Moon size={15} weight="fill" />
                  <span><strong>{nights} nuit{nights > 1 ? 's' : ''}</strong> · du {frDay(dateArrivee)} au {frDay(dateDepart)}</span>
                </div>
              )}

              <Field label="Montant du séjour" hint="facultatif, modifiable dans le contrat">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={montant}
                    onChange={e => setMontant(e.target.value.replace(/[^0-9.,]/g, ''))}
                    style={{ ...input, paddingRight: '34px' }}
                    aria-label="Montant du séjour en euros"
                  />
                  <span style={euroSuffix}>€</span>
                </div>
                {Number.isFinite(montantNum) && montantNum > 0 && nights > 0 && (
                  <p style={{ ...hintText, margin: '6px 0 0' }}>Soit {eur(Math.round(montantNum / nights * 100) / 100)} € la nuit.</p>
                )}
              </Field>
            </section>
          </div>

          {!platform && (
            <div style={nextBox}>
              <FileText size={18} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0 }}>
                <strong>Ensuite : le contrat.</strong> Le logement, les dates et le montant sont repris. Tu vérifies, puis tu l&apos;envoies au voyageur pour signature et paiement en ligne.
              </p>
            </div>
          )}

          {error && <div style={errBox} role="alert">{error}</div>}
        </div>

        {/* ─── Pied ─────────────────────────── */}
        <footer style={footer}>
          <p style={footerHint}>
            {canSubmit || submitting
              ? <><Check size={13} weight="bold" color="var(--accent-text)" /> {guestLabel} · {logementNom} · {nights} nuit{nights > 1 ? 's' : ''}</>
              : <><Info size={13} weight="bold" /> Il manque : {missing.join(', ')}</>}
          </p>
          <div style={footerBtns}>
            <button type="button" onClick={requestClose} style={ghostBtn} disabled={submitting !== null}>
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
              {submitting === 'sejour-contract' ? 'Création…' : contractOnly ? 'Continuer vers le contrat' : 'Créer + contrat'}
              <ArrowRight size={13} weight="bold" />
            </button>}
          </div>
        </footer>
      </div>
      {dialog}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={fieldLabel}>
        {label}{required && <span style={req}> *</span>}
        {hint && <span style={fieldHint}> · {hint}</span>}
      </span>
      {children}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,20,14,0.5)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'clamp(8px, 3vw, 28px)', zIndex: 100,
  animation: 'fadeIn var(--d-base) var(--ease-smooth)',
}

const modal: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border-2)',
  borderRadius: '20px',
  width: '100%', maxWidth: '920px', maxHeight: 'calc(100dvh - 16px)',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
  boxShadow: 'var(--shadow-xl)',
  animation: 'scaleIn var(--d-base) var(--ease-out)',
}

const header: React.CSSProperties = {
  padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 26px)',
  background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
  borderBottom: '1px solid var(--accent-border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
  flexShrink: 0,
}

const eyebrow: React.CSSProperties = {
  fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase',
  letterSpacing: '0.6px', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const title: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.15, letterSpacing: '-0.3px',
}

const subtitle: React.CSSProperties = {
  fontSize: '13.5px', color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.5, maxWidth: '560px',
}

const stepsRow: React.CSSProperties = {
  listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '6px',
}

const stepPill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 12px 5px 5px',
  borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)',
  fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)',
}

const stepPillNext: React.CSSProperties = { background: 'transparent', borderStyle: 'dashed', fontWeight: 500 }

const stepNum: React.CSSProperties = {
  width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-bg-2)', color: 'var(--accent-text)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0,
}

const stepNumDone: React.CSSProperties = { background: 'var(--accent-text)', color: 'var(--bg)' }
const stepNumNext: React.CSSProperties = { background: 'transparent', border: '1px dashed var(--border-2)', color: 'var(--text-3)' }

const closeBtn: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

const body: React.CSSProperties = {
  padding: 'clamp(14px, 2.5vw, 22px) clamp(14px, 3vw, 26px)', overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0,
}

const columns: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '14px', alignItems: 'start',
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
  padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0,
}

const cardHead: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' }

const cardIcon: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent-text)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

const cardTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 500, color: 'var(--text)', margin: 0,
}

const cardSub: React.CSSProperties = {
  fontSize: '12.5px', color: 'var(--text-2)', margin: '1px 0 0',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const segment: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '4px',
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px',
}

const segOff: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '9px 10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)',
  background: 'transparent', border: '1px solid transparent', borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit',
}

const segOn: React.CSSProperties = {
  ...segOff, background: 'var(--surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
}

const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '0 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '11px',
}

const searchInput: React.CSSProperties = {
  flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none',
  fontSize: '14px', color: 'var(--text)', fontFamily: 'inherit', padding: '11px 0',
}

const list: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '264px', overflowY: 'auto', margin: '0 -4px', padding: '0 4px',
}

const listItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
  padding: '9px 10px', borderRadius: '11px', background: 'transparent', border: '1px solid transparent',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
}

const listItemSelected: React.CSSProperties = {
  ...listItem, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
}

const avatar: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '50%',
  background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--accent-text)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0,
}

const avatarOn: React.CSSProperties = { ...avatar, background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)' }

const radio: React.CSSProperties = {
  width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid var(--border-2)', flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}

const radioOn: React.CSSProperties = { ...radio, background: 'var(--accent-text)', border: '1.5px solid var(--accent-text)', color: 'var(--bg)' }

const listItemName: React.CSSProperties = {
  fontSize: '14px', fontWeight: 600, color: 'var(--text)',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const listItemMeta: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-3)', marginTop: '1px',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const emptyList: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-2)', textAlign: 'center', padding: '16px 10px',
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, color: 'var(--accent-text)', fontWeight: 600,
  textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
}

const hintText: React.CSSProperties = { fontSize: '12px', color: 'var(--text-3)', margin: '-4px 0 0', lineHeight: 1.5 }

const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px',
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)', margin: '0 0 6px',
}

const fieldHint: React.CSSProperties = { fontWeight: 400, color: 'var(--text-3)' }
const req: React.CSSProperties = { color: 'var(--accent-text)' }

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: '1px solid var(--border)', borderRadius: '11px',
  background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
}

const euroSuffix: React.CSSProperties = {
  position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
  color: 'var(--text-3)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none',
}

const tiles: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '8px',
}

const tile: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0,
  padding: '11px 12px', borderRadius: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
}

const tileOn: React.CSSProperties = {
  ...tile, background: 'var(--accent-bg)', border: '1px solid var(--accent-text)', color: 'var(--accent-text)',
}

const nightsBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '11px',
  background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(183,121,31,0.25)', color: 'var(--text)', fontSize: '13.5px',
}

const nextBox: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '14px',
  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
  fontSize: '13px', lineHeight: 1.55,
}

const errBox: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '11px', background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
  border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)', color: 'var(--danger)', fontSize: '13px',
}

const footer: React.CSSProperties = {
  padding: '12px clamp(14px, 3vw, 26px)', borderTop: '1px solid var(--border)', background: 'var(--surface)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px 16px',
  flexShrink: 0, flexWrap: 'wrap',
}

const footerHint: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '12.5px', color: 'var(--text-2)',
  flex: '1 1 220px', minWidth: 0,
}

const footerBtns: React.CSSProperties = {
  display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 auto',
}

const ghostBtn: React.CSSProperties = {
  padding: '11px 16px', fontSize: '14px', fontWeight: 500,
  color: 'var(--text-2)', background: 'transparent', border: '1px solid var(--border)',
  borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  padding: '11px 16px', fontSize: '14px', fontWeight: 600,
  color: 'var(--accent-text)', background: 'var(--surface)', border: '1px solid var(--accent-border)',
  borderRadius: '11px', fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '11px 18px', fontSize: '14px', fontWeight: 700,
  color: 'var(--bg)', background: 'var(--accent-text)', border: '1px solid var(--accent-text)',
  borderRadius: '11px', fontFamily: 'inherit', flex: '0 1 auto',
}
