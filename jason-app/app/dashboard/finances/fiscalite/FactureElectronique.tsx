'use client'

// « Facture électronique : ta situation » (05/10/2026). Trois questions,
// réponse immédiate : rien ne change, ou concerné au 1er septembre 2027, avec
// quoi faire et quand. Règles dans lib/finances/einvoicing.ts (testées).
// Réponses gardées sur l'appareil seulement (confort, pas une donnée à garder).
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Receipt, CheckCircle, Warning, ArrowSquareOut, ArrowRight, Hourglass, Info } from '@phosphor-icons/react/dist/ssr'
import {
  SERVICES, einvoicingVerdict, type EinvoicingAnswers, type ServiceKey, type TvaStatus,
} from '@/lib/finances/einvoicing'
import { TIIME_URL, INDY_URL } from '@/lib/pros/invoicing-partners'
import { ui } from '../_ui/ui'

const STORE = 'jm-facture-electronique-v1'
const AMBER = '#B7791F'

const TVA_OPTIONS: Array<{ value: TvaStatus; label: string; hint: string }> = [
  { value: 'exonere', label: 'Non, exonérée', hint: 'meublé sans services' },
  { value: 'franchise', label: 'Franchise de TVA', hint: 'art. 293 B' },
  { value: 'collecte', label: 'Oui, je facture la TVA', hint: '10 % en général' },
  { value: 'nsp', label: 'Je ne sais pas', hint: 'on déduit des services' },
]

interface Props {
  today: string
  /** Statut déduit de la mention de TVA saisie dans Mon compte */
  guessedTva: TvaStatus
  hasMention: boolean
  /** Au moins un logement « chambres d'hôtes » */
  hasChambresHotes: boolean
}

export default function FactureElectronique({ today, guessedTva, hasMention, hasChambresHotes }: Props) {
  const [answers, setAnswers] = useState<EinvoicingAnswers>({
    tva: guessedTva,
    services: hasChambresHotes ? ['petit_dejeuner', 'linge'] : [],
    clientsPros: false,
  })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<EinvoicingAnswers>
      setAnswers(a => ({
        tva: saved.tva ?? a.tva,
        services: Array.isArray(saved.services) ? saved.services.filter(s => SERVICES.some(x => x.key === s)) : a.services,
        clientsPros: typeof saved.clientsPros === 'boolean' ? saved.clientsPros : a.clientsPros,
      }))
      setTouched(true)
    } catch { /* stockage indisponible : réponses par défaut */ }
  }, [])

  function update(next: Partial<EinvoicingAnswers>) {
    setAnswers(a => {
      const merged = { ...a, ...next }
      try { localStorage.setItem(STORE, JSON.stringify(merged)) } catch { /* ignore */ }
      return merged
    })
    setTouched(true)
  }

  function toggleService(k: ServiceKey) {
    update({ services: answers.services.includes(k) ? answers.services.filter(s => s !== k) : [...answers.services, k] })
  }

  const v = useMemo(() => einvoicingVerdict(answers, today), [answers, today])
  const concerned = v.key === 'concerne'
  const tone = concerned ? AMBER : 'var(--accent-text)'

  return (
    <section id="facture-electronique" style={{ ...ui.card, scrollMarginTop: 90 }}>
      <div style={ui.cardHead}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ ...ui.cardTitle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} weight="duotone" color="var(--accent-text)" /> Facture électronique : ta situation
          </h3>
          <p style={ui.cardSub}>3 questions, réponse immédiate. Tes réponses restent sur cet appareil.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Questions */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <fieldset style={s.fieldset}>
            <legend style={s.legend}>1. Factures-tu la TVA à tes voyageurs ?</legend>
            {hasMention && !touched && guessedTva !== 'nsp' && (
              <p style={s.hint}>Choix déduit de la mention de TVA de tes factures (Mon compte → Factures).</p>
            )}
            <div style={s.pills}>
              {TVA_OPTIONS.map(o => {
                const on = answers.tva === o.value
                return (
                  <button key={o.value} type="button" onClick={() => update({ tva: o.value })} aria-pressed={on}
                    style={{ ...s.pill, border: `1px solid ${on ? 'var(--accent-text)' : 'var(--border)'}`, background: on ? 'var(--accent-bg)' : 'var(--surface)' }}>
                    <span style={{ fontWeight: 700, color: on ? 'var(--accent-text)' : 'var(--text)' }}>{o.label}</span>
                    <span style={s.pillHint}>{o.hint}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset style={s.fieldset}>
            <legend style={s.legend}>2. Que proposes-tu pendant le séjour ?</legend>
            <p style={s.hint}>À partir de 3 sur 4, ta location relève de la para-hôtellerie.{hasChambresHotes ? ' En chambres d\'hôtes, le petit-déjeuner et le linge vont presque toujours avec.' : ''}</p>
            <div style={s.tiles}>
              {SERVICES.map(sv => {
                const on = answers.services.includes(sv.key)
                return (
                  <button key={sv.key} type="button" onClick={() => toggleService(sv.key)} aria-pressed={on}
                    style={{ ...s.tile, border: `1px solid ${on ? 'var(--accent-text)' : 'var(--border)'}`, background: on ? 'var(--accent-bg)' : 'var(--surface)' }}>
                    <span style={{ ...s.check, border: `1.5px solid ${on ? 'var(--accent-text)' : 'var(--border-2)'}`, background: on ? 'var(--accent-text)' : 'transparent' }}>
                      {on && <CheckCircle size={14} weight="fill" color="var(--bg)" />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, color: 'var(--text)', fontSize: 13.5 }}>{sv.label}</span>
                      <span style={s.pillHint}>{sv.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p style={{ ...s.hint, marginTop: 6 }}>{answers.services.length} sur 4</p>
          </fieldset>

          <fieldset style={s.fieldset}>
            <legend style={s.legend}>3. Loues-tu aussi à des entreprises ?</legend>
            <p style={s.hint}>Déplacements professionnels, facture au nom d&apos;une société.</p>
            <div style={s.pills}>
              {[{ v: false, l: 'Non, des particuliers' }, { v: true, l: 'Oui, parfois' }].map(o => {
                const on = answers.clientsPros === o.v
                return (
                  <button key={String(o.v)} type="button" onClick={() => update({ clientsPros: o.v })} aria-pressed={on}
                    style={{ ...s.pill, border: `1px solid ${on ? 'var(--accent-text)' : 'var(--border)'}`, background: on ? 'var(--accent-bg)' : 'var(--surface)' }}>
                    <span style={{ fontWeight: 700, color: on ? 'var(--accent-text)' : 'var(--text)' }}>{o.l}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* Réponse */}
        <div aria-live="polite" style={{ flex: '1 1 380px', minWidth: 0, borderRadius: 16, padding: 'clamp(16px, 2vw, 22px)', background: `color-mix(in srgb, ${tone} 8%, var(--surface))`, border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {concerned ? <Warning size={18} weight="fill" color={tone} /> : <CheckCircle size={18} weight="fill" color={tone} />}
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: tone }}>Ta situation</span>
            {concerned && v.daysLeft > 0 && (
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: tone, padding: '3px 10px', borderRadius: 99, border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)` }}>
                <Hourglass size={13} weight="fill" /> encore {v.daysLeft} jours
              </span>
            )}
          </div>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 'clamp(19px, 2.2vw, 23px)', lineHeight: 1.25, color: 'var(--text)' }}>{v.title}</h4>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{v.text}</p>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v.steps.map((st, i) => (
              <li key={i} style={{ display: 'flex', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--bg)', background: tone }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--text)' }}>{st.when} : </strong>{st.what}
                </span>
              </li>
            ))}
          </ol>

          {v.notes.map((n, i) => (
            <p key={i} style={{ margin: 0, display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55, padding: '10px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 2, color: AMBER }} /> <span>{n}</span>
            </p>
          ))}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={TIIME_URL} target="_blank" rel="sponsored noopener" style={s.partner}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ color: 'var(--text)' }}>Tiime</strong><ArrowSquareOut size={14} color="var(--accent-text)" /></span>
              <span style={s.pillHint}>Facturation gratuite, plateforme agréée : reçoit et émet tes factures électroniques.</span>
            </a>
            <a href={INDY_URL} target="_blank" rel="sponsored noopener" style={s.partner}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ color: 'var(--text)' }}>Indy</strong><ArrowSquareOut size={14} color="var(--accent-text)" /></span>
              <span style={s.pillHint}>Plateforme agréée, gratuite pour la facturation, offre LMNP pour ta déclaration.</span>
            </a>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>Liens affiliés : je touche une commission si tu t&apos;abonnes, sans surcoût pour toi.</p>
          <Link href="/dashboard/aide/contrats-paiements/emettre-facture" style={{ ...ui.link, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Ce qui change, en détail et avec les sources <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  fieldset: { border: 'none', margin: 0, padding: 0, minWidth: 0 },
  legend: { padding: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  hint: { margin: '0 0 8px', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '8px 12px', borderRadius: 11, cursor: 'pointer', fontSize: 13, textAlign: 'left', fontFamily: 'inherit' },
  pillHint: { display: 'block', fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.45, fontWeight: 500 },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 8 },
  tile: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  check: { width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  partner: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4, textDecoration: 'none', padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' },
}
