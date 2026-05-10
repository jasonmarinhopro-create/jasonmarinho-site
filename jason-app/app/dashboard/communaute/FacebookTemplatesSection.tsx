'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { FacebookLogo, Copy, Check, House } from '@phosphor-icons/react/dist/ssr'

interface Template { id: string; title: string; content: string }
interface Logement { id: string; nom: string; lien_driing: string | null }

interface Props {
  templates: Template[]
  logements: Logement[]
}

// Remplace les variables connues du gabarit (lien Driing) par les vraies données.
// Les autres variables ([VILLE], [PRÉNOM], etc.) restent visibles dans le textarea
// pour que l'hôte les personnalise lui-même.
function applyVariables(content: string, lienDriing: string | null): string {
  if (!lienDriing) return content
  return content.replace(/\[LIEN_ANNONCE_DRIING\]/g, lienDriing)
}

export default function FacebookTemplatesSection({ templates, logements }: Props) {
  // Logement par défaut : le premier qui a un lien Driing renseigné, sinon le premier tout court.
  const defaultLogementId = useMemo(() => {
    const withLink = logements.find(l => l.lien_driing)
    return withLink?.id ?? logements[0]?.id ?? null
  }, [logements])

  const [selectedLogementId, setSelectedLogementId] = useState<string | null>(defaultLogementId)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templates[0]?.id ?? null)
  const [postContent, setPostContent] = useState('')
  const [copied, setCopied] = useState(false)

  const selectedLogement = useMemo(
    () => logements.find(l => l.id === selectedLogementId) ?? null,
    [selectedLogementId, logements],
  )

  // Quand on change de gabarit ou de logement, on régénère le contenu.
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    setPostContent(applyVariables(tpl.content, selectedLogement?.lien_driing ?? null))
  }, [selectedTemplateId, selectedLogement, templates])

  // Premier render : initialise le contenu si un template est dispo.
  useEffect(() => {
    if (!postContent && selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId)
      if (tpl) setPostContent(applyVariables(tpl.content, selectedLogement?.lien_driing ?? null))
    }
  }, [postContent, selectedTemplateId, templates, selectedLogement])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (templates.length === 0) return null

  const hasLogements = logements.length > 0
  const noLinkOnSelected = selectedLogement && !selectedLogement.lien_driing

  return (
    <section style={s.wrap} className="fade-up">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>
            <FacebookLogo size={20} color="#1877F2" weight="fill" />
          </div>
          <div>
            <div style={s.title}>Poste dans ces groupes</div>
            <div style={s.subtitle}>
              Personnalise ton message une seule fois, copie, colle dans tous les groupes.
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteurs : logement + gabarit */}
      <div style={s.controls}>
        {hasLogements ? (
          <label style={s.field}>
            <span style={s.fieldLabel}>Logement</span>
            <select
              value={selectedLogementId ?? ''}
              onChange={e => setSelectedLogementId(e.target.value || null)}
              style={s.select}
            >
              {logements.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nom}{!l.lien_driing ? ' (sans lien Driing)' : ''}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div style={s.warningBox}>
            <House size={14} />
            <span>
              Aucun logement enregistré.{' '}
              <Link href="/dashboard/logements" style={s.warningLink}>Crée-en un</Link>
              {' '}pour pré-remplir tes posts.
            </span>
          </div>
        )}
      </div>

      {/* Liste des gabarits — chips horizontales */}
      <div style={s.chipsRow}>
        {templates.map(t => {
          const active = t.id === selectedTemplateId
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplateId(t.id)}
              style={{
                ...s.chip,
                background: active ? 'var(--accent-bg-2)' : 'var(--surface)',
                borderColor: active ? 'var(--accent-border-2)' : 'var(--border)',
                color: active ? 'var(--accent-text)' : 'var(--text-2)',
                fontWeight: active ? 600 : 400,
              }}
              title={t.title}
            >
              {t.title}
            </button>
          )
        })}
      </div>

      {/* Hint si lien Driing manquant */}
      {noLinkOnSelected && (
        <div style={s.hintBox}>
          <span>
            <strong style={{ color: 'var(--text)' }}>Lien Driing manquant</strong> sur ce logement.{' '}
            <Link href={`/dashboard/logements/${selectedLogement.id}`} style={s.warningLink}>
              Renseigne-le
            </Link>
            {' '}pour qu'il se remplisse tout seul dans le post.
          </span>
        </div>
      )}

      {/* Textarea éditable */}
      <textarea
        value={postContent}
        onChange={e => setPostContent(e.target.value)}
        style={s.textarea}
        rows={12}
        spellCheck={false}
      />

      <div style={s.editorFooter}>
        <span style={s.footerHint}>
          Personnalise les zones <code style={s.code}>[entre crochets]</code> avant de copier.
        </span>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!postContent.trim()}
          style={{
            ...s.copyBtn,
            background: copied ? '#10b981' : 'var(--accent-text)',
            color: copied ? '#fff' : 'var(--bg)',
          }}
        >
          {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
          {copied ? 'Copié !' : 'Copier le post'}
        </button>
      </div>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px 22px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  headerIcon: {
    width: '40px', height: '40px',
    background: 'rgba(24,119,242,0.10)', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  subtitle: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 },

  controls: { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 240px', minWidth: 0 },
  fieldLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  select: {
    padding: '9px 12px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--bg-2)',
    color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit',
    cursor: 'pointer',
  },

  warningBox: {
    flex: '1 1 auto',
    padding: '10px 12px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    fontSize: '12.5px', color: 'var(--text-2)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  warningLink: { color: 'var(--accent-text)', textDecoration: 'underline', fontWeight: 500 },

  chipsRow: {
    display: 'flex', flexWrap: 'wrap', gap: '6px',
  },
  chip: {
    padding: '7px 12px', borderRadius: '100px',
    border: '1px solid', fontSize: '12.5px', fontFamily: 'inherit',
    cursor: 'pointer', transition: 'all 0.12s',
    background: 'var(--surface)',
  },

  hintBox: {
    padding: '10px 12px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5,
  },

  textarea: {
    width: '100%', minHeight: '220px',
    padding: '14px 16px', borderRadius: '12px',
    border: '1px solid var(--border)', background: 'var(--bg-2)',
    color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit',
    lineHeight: 1.6, resize: 'vertical', outline: 'none',
    boxSizing: 'border-box',
  },

  editorFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    flexWrap: 'wrap',
  },
  footerHint: { fontSize: '11.5px', color: 'var(--text-3)' },
  code: {
    background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px',
    fontSize: '11px', fontFamily: 'ui-monospace, monospace',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontFamily: 'inherit', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  },
}
