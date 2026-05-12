'use client'

import { useState } from 'react'
import { Copy, Check, Clock, Warning, ProhibitInset, Scales, Shield, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import type { ScenarioContent as ScenarioContentType } from '@/lib/sos/scenarios-content'
import { getVerificationStatus } from '@/lib/sos/scenarios-content'

/* Composant client de rendu d'un scénario SOS Hôte.
   Reçoit le contenu typé et l'affiche avec :
   - Section rassurance (doux)
   - Délai critique (bandeau ambre/rouge)
   - Pas-à-pas numéroté
   - Templates copiables (bouton Copier intégré)
   - Erreurs à ne pas faire (rouge)
   - Recours additionnels
   - Prévention (vert)
*/

interface Props {
  content: ScenarioContentType
}

export default function ScenarioContent({ content }: Props) {
  const verif = getVerificationStatus(content.lastVerified)

  return (
    <div style={s.wrap}>
      {/* Badge vérification éditoriale */}
      {verif.date && (
        <div style={{
          ...s.verifBadge,
          ...(verif.isStale ? s.verifBadgeStale : {}),
        }}>
          {verif.isStale
            ? <ArrowsClockwise size={12} weight="bold" />
            : <CheckCircle size={12} weight="fill" />
          }
          <span>
            Dernière vérification&nbsp;: <strong>{verif.label}</strong>
            {verif.isStale && <span style={{ marginLeft: '6px', opacity: 0.85 }}>· à revérifier</span>}
          </span>
        </div>
      )}

      {/* Rassurance */}
      <div style={s.reassurance}>
        <strong style={{ color: 'var(--text)' }}>Avant tout, respire.</strong>
        <span style={{ marginLeft: '6px' }}>{content.reassurance}</span>
      </div>

      {/* Délai critique */}
      <div style={{
        ...s.delayBox,
        background: content.delayBox.type === 'urgent' ? 'rgba(220,38,38,0.07)' : 'rgba(217,119,6,0.07)',
        borderColor: content.delayBox.type === 'urgent' ? 'rgba(220,38,38,0.30)' : 'rgba(217,119,6,0.28)',
      }}>
        <Clock
          size={18}
          weight="fill"
          style={{ color: content.delayBox.type === 'urgent' ? '#dc2626' : '#b45309', flexShrink: 0, marginTop: '2px' }}
        />
        <div>
          <div style={{
            ...s.delayLabel,
            color: content.delayBox.type === 'urgent' ? '#dc2626' : '#b45309',
          }}>
            {content.delayBox.label}
          </div>
          <div style={s.delayBody}>{content.delayBox.body}</div>
        </div>
      </div>

      {/* Pas-à-pas */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Le pas-à-pas</h2>
        <ol style={s.stepsList}>
          {content.steps.map((step, i) => (
            <li key={i} style={s.step}>
              <div style={s.stepNum}>{i + 1}</div>
              <div style={s.stepBody}>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepText} dangerouslySetInnerHTML={{ __html: renderMarkdown(step.body) }} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Templates */}
      {content.templates.length > 0 && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Templates prêts à copier</h2>
          <div style={s.templatesList}>
            {content.templates.map((tpl, i) => (
              <TemplateBox key={i} template={tpl} />
            ))}
          </div>
        </div>
      )}

      {/* Ce qu'il NE faut surtout PAS faire */}
      <div style={{ ...s.section, ...s.dontSection }}>
        <h2 style={{ ...s.sectionTitle, color: '#dc2626' }}>
          <ProhibitInset size={18} weight="fill" style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: '6px' }} />
          Ce qu&apos;il ne faut surtout PAS faire
        </h2>
        <ul style={s.dontList}>
          {content.doNotDo.map((item, i) => (
            <li key={i} style={s.dontItem}>
              <span style={{ ...s.bullet, color: '#dc2626' }}>✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recours additionnels */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>
          <Scales size={18} weight="fill" style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: '6px', color: 'var(--accent-text)' }} />
          Si ça tourne mal, les recours
        </h2>
        <ul style={s.recoursesList}>
          {content.recourses.map((item, i) => (
            <li key={i} style={s.recourseItem}>
              <span style={{ ...s.bullet, color: 'var(--accent-text)' }}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Prévention */}
      <div style={{ ...s.section, ...s.preventionSection }}>
        <h2 style={{ ...s.sectionTitle, color: '#059669' }}>
          <Shield size={18} weight="fill" style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: '6px' }} />
          Pour que ça ne se reproduise plus
        </h2>
        <ul style={s.preventionList}>
          {content.prevention.map((item, i) => (
            <li key={i} style={s.preventionItem}>
              <span style={{ ...s.bullet, color: '#059669' }}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Sous-composant client : box de template avec bouton Copier */
function TemplateBox({ template }: { template: { label: string; subject?: string; body: string } }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      const text = template.subject
        ? `Objet : ${template.subject}\n\n${template.body}`
        : template.body
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div style={s.template}>
      <div style={s.templateHead}>
        <span style={s.templateLabel}>{template.label}</span>
        <button onClick={handleCopy} style={s.copyBtn}>
          {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      {template.subject && (
        <div style={s.templateSubject}>
          <strong>Objet :</strong> {template.subject}
        </div>
      )}
      <pre style={s.templateBody}>{template.body}</pre>
    </div>
  )
}

/** Markdown ultra-light : seulement les **gras**. Pas d'autre support pour la sécurité. */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
  },

  verifBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    alignSelf: 'flex-start',
    padding: '5px 10px', borderRadius: '999px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontSize: '11.5px', lineHeight: 1.4,
  },
  verifBadgeStale: {
    background: 'rgba(217,119,6,0.08)',
    border: '1px solid rgba(217,119,6,0.30)',
    color: '#b45309',
  },

  reassurance: {
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    fontSize: '14px', color: 'var(--text-2)',
    lineHeight: 1.6,
  },

  delayBox: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '14px 16px', borderRadius: '12px',
    border: '1px solid',
  },
  delayLabel: {
    fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  delayBody: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55,
  },

  section: {
    padding: '18px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)',
    margin: '0 0 14px',
    letterSpacing: '-0.2px',
  },

  stepsList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column' as const,
    gap: '14px',
  },
  step: {
    display: 'flex', gap: '12px',
  },
  stepNum: {
    width: '28px', height: '28px', flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border-2)',
    color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700,
  },
  stepBody: { flex: 1, minWidth: 0, paddingTop: '2px' },
  stepTitle: {
    fontSize: '13.5px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '4px',
    lineHeight: 1.4,
  },
  stepText: {
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.6,
  },

  templatesList: {
    display: 'flex', flexDirection: 'column' as const,
    gap: '12px',
  },
  template: {
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  templateHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--surface-2)',
    borderBottom: '1px solid var(--border)',
  },
  templateLabel: {
    fontSize: '12.5px', fontWeight: 600,
    color: 'var(--text)',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: '7px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontSize: '11.5px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  templateSubject: {
    padding: '10px 14px',
    fontSize: '12.5px', color: 'var(--text-2)',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border)',
  },
  templateBody: {
    margin: 0,
    padding: '14px',
    background: 'var(--bg-2)',
    fontFamily: 'inherit',
    fontSize: '12.5px',
    color: 'var(--text-2)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },

  dontSection: {
    background: 'rgba(220,38,38,0.04)',
    border: '1px solid rgba(220,38,38,0.20)',
  },
  dontList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column' as const,
    gap: '8px',
  },
  dontItem: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.55,
  },
  bullet: {
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
    lineHeight: 1.55,
    minWidth: '14px',
  },

  recoursesList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column' as const,
    gap: '8px',
  },
  recourseItem: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.55,
  },

  preventionSection: {
    background: 'rgba(16,185,129,0.04)',
    border: '1px solid rgba(16,185,129,0.20)',
  },
  preventionList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column' as const,
    gap: '8px',
  },
  preventionItem: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.55,
  },
}
