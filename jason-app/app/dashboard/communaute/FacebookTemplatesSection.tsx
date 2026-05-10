'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FacebookLogo, Copy, Check, House, FloppyDisk, Trash, BookmarkSimple } from '@phosphor-icons/react/dist/ssr'
import { saveFacebookPost, deleteFacebookPost } from './actions'

interface Template { id: string; title: string; content: string }
interface Logement { id: string; nom: string; lien_driing: string | null }
interface SavedPost { id: string; logement_id: string | null; title: string; content: string }

interface Props {
  templates: Template[]
  logements: Logement[]
  savedPosts: SavedPost[]
}

// Remplace les variables connues du gabarit (lien Driing) par les vraies données.
// Les autres variables ([VILLE], [PRÉNOM], etc.) restent visibles dans le textarea
// pour que l'hôte les personnalise lui-même.
function applyVariables(content: string, lienDriing: string | null): string {
  if (!lienDriing) return content
  return content.replace(/\[LIEN_ANNONCE_DRIING\]/g, lienDriing)
}

const SAVED_PREFIX = 'saved-' // pour distinguer les chips post sauvegardé vs template

export default function FacebookTemplatesSection({ templates, logements, savedPosts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Logement par défaut : le premier qui a un lien Driing renseigné, sinon le premier tout court.
  const defaultLogementId = useMemo(() => {
    const withLink = logements.find(l => l.lien_driing)
    return withLink?.id ?? logements[0]?.id ?? null
  }, [logements])

  const [selectedLogementId, setSelectedLogementId] = useState<string | null>(defaultLogementId)

  const selectedLogement = useMemo(
    () => logements.find(l => l.id === selectedLogementId) ?? null,
    [selectedLogementId, logements],
  )

  // Post sauvegardé pour le logement sélectionné (ou null si aucun).
  const savedForLogement = useMemo(() => {
    return savedPosts.find(p => p.logement_id === selectedLogementId) ?? null
  }, [savedPosts, selectedLogementId])

  // Sélection initiale : si un post sauvegardé existe pour ce logement → on l'affiche.
  // Sinon → premier template.
  const initialSelectedKey = savedForLogement
    ? `${SAVED_PREFIX}${savedForLogement.id}`
    : (templates[0]?.id ?? null)

  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey)
  const [postContent, setPostContent] = useState('')
  const [postTitle, setPostTitle] = useState('Mon post')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [titleEditing, setTitleEditing] = useState(false)

  const isSavedSelected = !!selectedKey?.startsWith(SAVED_PREFIX)

  // Quand on change de logement → bascule sur le post sauvegardé du logement si existant.
  useEffect(() => {
    if (savedForLogement) {
      setSelectedKey(`${SAVED_PREFIX}${savedForLogement.id}`)
      setPostTitle(savedForLogement.title)
      setPostContent(savedForLogement.content)
    } else {
      const firstTpl = templates[0]
      if (firstTpl) {
        setSelectedKey(firstTpl.id)
        setPostTitle('Mon post')
        setPostContent(applyVariables(firstTpl.content, selectedLogement?.lien_driing ?? null))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLogementId])

  // Quand on change de chip → recharge le contenu correspondant.
  useEffect(() => {
    if (!selectedKey) return
    if (selectedKey.startsWith(SAVED_PREFIX)) {
      // Chip "Mon post" sélectionnée
      if (savedForLogement) {
        setPostTitle(savedForLogement.title)
        setPostContent(savedForLogement.content)
      }
    } else {
      // Chip d'un template d'inspiration
      const tpl = templates.find(t => t.id === selectedKey)
      if (tpl) {
        setPostContent(applyVariables(tpl.content, selectedLogement?.lien_driing ?? null))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  async function handleSave() {
    if (!postContent.trim()) return
    setSaving(true)
    const res = await saveFacebookPost({
      logementId: selectedLogementId,
      title: postTitle.trim() || 'Mon post',
      content: postContent,
    })
    setSaving(false)
    if (!res.error) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1800)
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete() {
    if (!savedForLogement) return
    if (!confirm('Supprimer ce post sauvegardé ?')) return
    const res = await deleteFacebookPost(savedForLogement.id)
    if (!res.error) {
      // Reset sur le premier template d'inspiration
      const firstTpl = templates[0]
      if (firstTpl) {
        setSelectedKey(firstTpl.id)
        setPostContent(applyVariables(firstTpl.content, selectedLogement?.lien_driing ?? null))
        setPostTitle('Mon post')
      }
      startTransition(() => router.refresh())
    }
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
              Personnalise ton message une fois, sauvegarde-le, puis copie-colle dans tous les groupes.
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur logement */}
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

      {/* Chips : Mon post (si sauvegardé) + templates d'inspiration */}
      <div>
        <div style={s.chipsLabel}>
          {savedForLogement ? 'Ton post sauvegardé · ou pioche un autre style' : "Choisis un style pour démarrer"}
        </div>
        <div style={s.chipsRow}>
          {savedForLogement && (() => {
            const key = `${SAVED_PREFIX}${savedForLogement.id}`
            const active = key === selectedKey
            return (
              <button
                type="button"
                onClick={() => setSelectedKey(key)}
                style={{
                  ...s.chip,
                  background: active ? '#10b98122' : 'rgba(16,185,129,0.07)',
                  borderColor: active ? '#10b981' : 'rgba(16,185,129,0.45)',
                  color: active ? '#10b981' : '#10b981',
                  fontWeight: 600,
                }}
                title="Ton post sauvegardé pour ce logement"
              >
                <BookmarkSimple size={11} weight="fill" />
                {savedForLogement.title}
              </button>
            )
          })()}
          {templates.map(t => {
            const active = t.id === selectedKey
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedKey(t.id)}
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

      {/* Input titre (visible uniquement si on est en train d'éditer / sauvegarder) */}
      {(isSavedSelected || titleEditing) && (
        <label style={s.field}>
          <span style={s.fieldLabel}>Titre de ton post</span>
          <input
            type="text"
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            placeholder="Mon post"
            style={s.input}
            maxLength={60}
          />
        </label>
      )}

      {/* Textarea éditable */}
      <textarea
        value={postContent}
        onChange={e => setPostContent(e.target.value)}
        style={s.textarea}
        rows={12}
        spellCheck={false}
      />

      {/* Footer : hint + boutons */}
      <div style={s.editorFooter}>
        <span style={s.footerHint}>
          Personnalise les zones <code style={s.code}>[entre crochets]</code>, sauvegarde, puis copie.
        </span>
        <div style={s.actionsRow}>
          {isSavedSelected && savedForLogement && (
            <button
              type="button"
              onClick={handleDelete}
              style={s.deleteBtn}
              title="Supprimer ce post sauvegardé"
            >
              <Trash size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!isSavedSelected) setTitleEditing(true)
              handleSave()
            }}
            disabled={!postContent.trim() || saving}
            style={{
              ...s.saveBtn,
              background: savedFlash ? '#10b981' : 'transparent',
              color: savedFlash ? '#fff' : 'var(--text-2)',
              borderColor: savedFlash ? '#10b981' : 'var(--border-2)',
            }}
            title={isSavedSelected ? 'Mettre à jour ce post' : 'Sauvegarder comme ton post pour ce logement'}
          >
            {savedFlash ? <Check size={13} weight="bold" /> : <FloppyDisk size={13} weight="bold" />}
            {savedFlash ? 'Sauvegardé' : (isSavedSelected ? 'Mettre à jour' : 'Sauvegarder')}
          </button>
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
  input: {
    padding: '9px 12px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--bg-2)',
    color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit',
    outline: 'none',
  },

  warningBox: {
    flex: '1 1 auto',
    padding: '10px 12px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    fontSize: '12.5px', color: 'var(--text-2)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  warningLink: { color: 'var(--accent-text)', textDecoration: 'underline', fontWeight: 500 },

  chipsLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    marginBottom: '8px',
  },
  chipsRow: {
    display: 'flex', flexWrap: 'wrap', gap: '6px',
  },
  chip: {
    padding: '7px 12px', borderRadius: '100px',
    border: '1px solid', fontSize: '12.5px', fontFamily: 'inherit',
    cursor: 'pointer', transition: 'all 0.12s',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
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
  actionsRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  saveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 14px', borderRadius: '10px',
    border: '1px solid var(--border-2)',
    fontSize: '12.5px', fontFamily: 'inherit', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  deleteBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-3)', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontFamily: 'inherit', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  },
}
