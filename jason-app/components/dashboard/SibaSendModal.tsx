'use client'

// Modal d'envoi d'un boletim au Web Service SIBA (Portugal).
// Deux temps selon l'état du logement :
//  1. Config (1re fois) : NIPC, chave de ativação, localité, code postal…
//     reçus par email après l'inscription SIBA. Enregistrés sur le logement.
//  2. Formulaire voyageur : prérempli depuis la fiche, complète l'identité
//     documentaire manquante (date de naissance, n° passeport…), puis envoie.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, PaperPlaneTilt, Gear, Info, CircleNotch } from '@phosphor-icons/react/dist/ssr'
import { NATIONALITES } from '@/lib/nationalites'
import { SIBA_DOC_TYPES, idTypeToDocType, type SibaDocType } from '@/lib/declarations/siba-shared'
import {
  getSibaContext, saveSibaConfig, sendSibaDeclaration,
  type SibaContext, type SibaConfigInput, type SibaGuestInput,
} from '@/lib/declarations/siba-actions'

interface Props {
  declarationId: string
  onClose: () => void
  onSent: () => void
}

type Phase = 'loading' | 'config' | 'guest' | 'sending' | 'error-load'

export default function SibaSendModal({ declarationId, onClose, onSent }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [ctx, setCtx] = useState<SibaContext | null>(null)
  const [error, setError] = useState('')

  // Config logement (rempli si 1re fois)
  const [config, setConfig] = useState<SibaConfigInput>({
    siba_unidade: '', siba_estabelecimento: '00', siba_chave: '',
    siba_abreviatura: '', siba_localidade: '', siba_codigo_postal: '',
    siba_zona_postal: '', siba_telefone: '', siba_auto_envoi: true,
  })

  // Formulaire voyageur
  const [guest, setGuest] = useState<SibaGuestInput>({
    prenom: '', nom: '', nationalite: '', dateNaissance: '',
    tipoDocumento: 'P', documentoNumero: '', paysEmetteur: '',
    paysResidence: '', localResidence: '', dateEntree: '', dateSortie: null,
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getSibaContext(declarationId)
      if (!alive) return
      if ('error' in res) { setError(res.error); setPhase('error-load'); return }
      setCtx(res)
      // Préremplit la config si déjà connue (les champs absents restent vides)
      const cfg = res.logement?.config
      if (cfg) {
        setConfig(c => ({
          siba_unidade: cfg.siba_unidade ?? c.siba_unidade,
          siba_estabelecimento: cfg.siba_estabelecimento ?? c.siba_estabelecimento,
          siba_chave: cfg.siba_chave ?? c.siba_chave,
          siba_abreviatura: cfg.siba_abreviatura ?? c.siba_abreviatura,
          siba_localidade: cfg.siba_localidade ?? c.siba_localidade,
          siba_codigo_postal: cfg.siba_codigo_postal ?? c.siba_codigo_postal,
          siba_zona_postal: cfg.siba_zona_postal ?? c.siba_zona_postal,
          siba_telefone: cfg.siba_telefone ?? c.siba_telefone,
          siba_auto_envoi: cfg.siba_auto_envoi ?? c.siba_auto_envoi,
        }))
      }
      // Préremplit le voyageur
      setGuest(g => ({
        ...g,
        prenom: res.voyageur.prenom,
        nom: res.voyageur.nom,
        nationalite: res.voyageur.nationalite ?? '',
        dateNaissance: res.voyageur.dateNaissance ?? '',
        tipoDocumento: idTypeToDocType(res.voyageur.idType),
        documentoNumero: res.voyageur.idNumero ?? '',
        paysEmetteur: res.voyageur.idPaysEmetteur ?? res.voyageur.nationalite ?? '',
        paysResidence: res.voyageur.paysResidence ?? res.voyageur.nationalite ?? '',
        localResidence: res.voyageur.villeResidence ?? '',
        dateEntree: res.dateArrivee,
        dateSortie: res.dateDepart,
      }))
      setPhase(res.logement?.configured ? 'guest' : 'config')
    })()
    return () => { alive = false }
  }, [declarationId])

  async function handleSaveConfig() {
    if (!ctx?.logement) return
    setError('')
    const res = await saveSibaConfig(ctx.logement.id, config)
    if (res.error) { setError(res.error); return }
    setPhase('guest')
  }

  async function handleSend() {
    setError(''); setPhase('sending')
    const res = await sendSibaDeclaration(declarationId, guest)
    if (res.error) { setError(res.error); setPhase('guest'); return }
    onSent()
  }

  const body = (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <div style={s.headTitle}>
            🇵🇹 Déclaration SIBA {ctx?.voyageur.nom ? <span style={s.headSub}>· {ctx.voyageur.prenom} {ctx.voyageur.nom}</span> : null}
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>

        {phase === 'loading' && (
          <div style={s.centered}><CircleNotch size={22} className="spin" /> Chargement…</div>
        )}

        {phase === 'error-load' && (
          <div style={s.centered}>
            <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
            <button onClick={onClose} style={s.secondaryBtn}>Fermer</button>
          </div>
        )}

        {phase === 'config' && (
          <div style={s.content}>
            <div style={s.infoBox}>
              <Info size={15} weight="fill" style={{ flexShrink: 0, color: 'var(--accent-text)' }} />
              <span>Première déclaration pour <strong>{ctx?.logement?.nom}</strong>. Renseigne les identifiants reçus par email après ton inscription SIBA (option « Web Service »). C&apos;est à faire une seule fois par logement.</span>
            </div>
            <div style={s.grid2}>
              <Field label="NIPC / NIF de l'entité" value={config.siba_unidade} onChange={v => setConfig(c => ({ ...c, siba_unidade: v }))} placeholder="9 chiffres" />
              <Field label="N° établissement" value={config.siba_estabelecimento} onChange={v => setConfig(c => ({ ...c, siba_estabelecimento: v }))} placeholder="00" />
            </div>
            <Field label="Chave de ativação (SIBA)" value={config.siba_chave} onChange={v => setConfig(c => ({ ...c, siba_chave: v }))} placeholder="Reçue par email/courrier officiel" />
            <div style={s.grid2}>
              <Field label="Abréviation du nom" value={config.siba_abreviatura} onChange={v => setConfig(c => ({ ...c, siba_abreviatura: v }))} placeholder="Max 10 car." />
              <Field label="Localité" value={config.siba_localidade} onChange={v => setConfig(c => ({ ...c, siba_localidade: v }))} placeholder="Lisboa" />
            </div>
            <div style={s.grid2}>
              <div style={s.grid2}>
                <Field label="Code postal" value={config.siba_codigo_postal} onChange={v => setConfig(c => ({ ...c, siba_codigo_postal: v }))} placeholder="3660" />
                <Field label="Zone" value={config.siba_zona_postal} onChange={v => setConfig(c => ({ ...c, siba_zona_postal: v }))} placeholder="366" />
              </div>
              <Field label="Téléphone" value={config.siba_telefone} onChange={v => setConfig(c => ({ ...c, siba_telefone: v }))} placeholder="630212592" />
            </div>
            {/* Envoi automatique après check-in en ligne (opt-out) */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.siba_auto_envoi ?? true}
                onChange={e => setConfig(c => ({ ...c, siba_auto_envoi: e.target.checked }))}
                style={{ marginTop: '2px', accentColor: 'var(--accent-text)' }}
              />
              <span style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                <strong>Envoi automatique</strong> : dès qu&apos;un voyageur complète son
                check-in en ligne, son boletim part tout seul au SIBA (recommandé).
              </span>
            </label>
            {error && <p style={s.errorText}>{error}</p>}
            <div style={s.footer}>
              <button onClick={onClose} style={s.secondaryBtn}>Annuler</button>
              <button onClick={handleSaveConfig} style={s.primaryBtn}><Gear size={14} weight="bold" /> Enregistrer et continuer</button>
            </div>
          </div>
        )}

        {(phase === 'guest' || phase === 'sending') && (
          <div style={s.content}>
            <div style={s.infoBox}>
              <Info size={15} weight="fill" style={{ flexShrink: 0, color: 'var(--accent-text)' }} />
              <span>Vérifie et complète l&apos;identité du voyageur. Les champs vides sont ceux que SIBA exige et que tu n&apos;as pas encore renseignés sur sa fiche — ils y seront enregistrés au passage.</span>
            </div>
            <div style={s.grid2}>
              <Field label="Prénom" value={guest.prenom} onChange={v => setGuest(g => ({ ...g, prenom: v }))} />
              <Field label="Nom *" value={guest.nom} onChange={v => setGuest(g => ({ ...g, nom: v }))} />
            </div>
            <div style={s.grid2}>
              <SelectField label="Nationalité *" value={guest.nationalite} onChange={v => setGuest(g => ({ ...g, nationalite: v }))} options={NATIONALITES} />
              <Field label="Date de naissance *" type="date" value={guest.dateNaissance} onChange={v => setGuest(g => ({ ...g, dateNaissance: v }))} />
            </div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Type de document *</label>
                <select value={guest.tipoDocumento} onChange={e => setGuest(g => ({ ...g, tipoDocumento: e.target.value as SibaDocType }))} style={s.input}>
                  {SIBA_DOC_TYPES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                </select>
              </div>
              <Field label="N° du document *" value={guest.documentoNumero} onChange={v => setGuest(g => ({ ...g, documentoNumero: v }))} placeholder="Passeport / CNI" />
            </div>
            <div style={s.grid2}>
              <SelectField label="Pays émetteur du document *" value={guest.paysEmetteur} onChange={v => setGuest(g => ({ ...g, paysEmetteur: v }))} options={NATIONALITES} />
              <SelectField label="Pays de résidence *" value={guest.paysResidence} onChange={v => setGuest(g => ({ ...g, paysResidence: v }))} options={NATIONALITES} />
            </div>
            <Field label="Ville de résidence *" value={guest.localResidence} onChange={v => setGuest(g => ({ ...g, localResidence: v }))} placeholder="Ex. Madrid" />
            <div style={s.grid2}>
              <Field label="Date d'arrivée *" type="date" value={guest.dateEntree} onChange={v => setGuest(g => ({ ...g, dateEntree: v }))} />
              <Field label="Date de départ" type="date" value={guest.dateSortie ?? ''} onChange={v => setGuest(g => ({ ...g, dateSortie: v || null }))} />
            </div>
            {error && <p style={s.errorText}>{error}</p>}
            <div style={s.footer}>
              {!ctx?.logement?.configured && (
                <button onClick={() => setPhase('config')} style={s.secondaryBtn} disabled={phase === 'sending'}>← Config</button>
              )}
              <button onClick={handleSend} style={s.primaryBtn} disabled={phase === 'sending'}>
                {phase === 'sending'
                  ? <><CircleNotch size={14} className="spin" /> Envoi à SIBA…</>
                  : <><PaperPlaneTilt size={14} weight="bold" /> Envoyer à SIBA</>}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(body, document.body)
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s.input} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { code: string; name: string }[]
}) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={s.input}>
        <option value="">Sélectionner…</option>
        {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 400,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    width: '560px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
    background: 'var(--floating-surface)', border: '1px solid var(--accent-border)',
    borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, background: 'var(--floating-surface)', zIndex: 1,
  },
  headTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  headSub: { color: 'var(--text-2)', fontWeight: 400 },
  closeBtn: {
    width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  centered: { padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-2)' },
  infoBox: {
    display: 'flex', gap: '8px', padding: '10px 12px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '10px', fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '5px' },
  input: {
    width: '100%', padding: '9px 11px', borderRadius: '9px',
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  },
  errorText: { fontSize: '12.5px', color: 'var(--danger)', margin: '2px 0 0', lineHeight: 1.5 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '9px', border: 'none',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  secondaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 14px', borderRadius: '9px', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-2)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
}
