'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FacebookLogo, Copy, Check, House, FloppyDisk, Trash, BookmarkSimple, Plus, Warning } from '@phosphor-icons/react/dist/ssr'
import { saveFacebookPost, deleteFacebookPost } from './actions'
import { markStepIfNotYet } from '@/lib/onboarding/client'

interface Template { id: string; title: string; content: string }
interface Logement { id: string; nom: string; lien_driing: string | null }
interface SavedPost { id: string; logement_id: string | null; title: string; content: string }

interface Props {
  templates: Template[]
  logements: Logement[]
  savedPosts: SavedPost[]
}

// Remplace les variables connues du gabarit (lien Driing) par les vraies données.
// Les autres variables ([VILLE], [PRÉNOM]…) restent à la charge de l'hôte dans le textarea.
function applyVariables(content: string, lienDriing: string | null): string {
  if (!lienDriing) return content
  return content.replace(/\[LIEN_ANNONCE_DRIING\]/g, lienDriing)
}

export default function FacebookTemplatesSection({ templates, logements, savedPosts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Logement par défaut : le premier qui a un lien Driing, sinon le premier tout court.
  const defaultLogementId = useMemo(() => {
    const withLink = logements.find(l => l.lien_driing)
    return withLink?.id ?? logements[0]?.id ?? null
  }, [logements])

  const [selectedLogementId, setSelectedLogementId] = useState<string | null>(defaultLogementId)

  const selectedLogement = useMemo(
    () => logements.find(l => l.id === selectedLogementId) ?? null,
    [selectedLogementId, logements],
  )

  // Posts sauvegardés pour le logement courant.
  const savedForLogement = useMemo(() => {
    return savedPosts.filter(p => p.logement_id === selectedLogementId)
  }, [savedPosts, selectedLogementId])

  // editingPostId = id du post sauvegardé en cours d'édition. null = brouillon (nouveau).
  const [editingPostId, setEditingPostId] = useState<string | null>(
    savedForLogement[0]?.id ?? null,
  )
  // lastLoadedTemplateId = id du dernier template d'inspiration piché.
  // Sert uniquement à highlighter visuellement la chip dans la rangée inspiration.
  const [lastLoadedTemplateId, setLastLoadedTemplateId] = useState<string | null>(null)
  const [postTitle, setPostTitle] = useState('Mon post')
  const [postContent, setPostContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const editingPost = useMemo(
    () => savedPosts.find(p => p.id === editingPostId) ?? null,
    [editingPostId, savedPosts],
  )

  // À chaque changement de logement, on bascule sur le premier saved du logement,
  // ou sur un brouillon si aucun saved n'existe.
  useEffect(() => {
    const first = savedForLogement[0]
    if (first) {
      setEditingPostId(first.id)
      setPostTitle(first.title)
      setPostContent(first.content)
    } else {
      setEditingPostId(null)
      setPostTitle('Mon post')
      const firstTpl = templates[0]
      setPostContent(firstTpl ? applyVariables(firstTpl.content, selectedLogement?.lien_driing ?? null) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLogementId])

  function selectSavedPost(post: SavedPost) {
    setEditingPostId(post.id)
    setLastLoadedTemplateId(null)
    setPostTitle(post.title)
    setPostContent(post.content)
    setSaveError(null)
  }

  function startNewDraft() {
    setEditingPostId(null)
    setLastLoadedTemplateId(null)
    setPostTitle('Mon post')
    setPostContent('')
    setSaveError(null)
  }

  function loadTemplate(tpl: Template) {
    // Bascule en mode brouillon avec le contenu ET le titre de l'inspiration.
    // L'utilisateur peut ensuite tweaker et 'Sauvegarder' → ça créera un nouveau
    // post sauvegardé (pas écrasement du saved courant).
    setEditingPostId(null)
    setLastLoadedTemplateId(tpl.id)
    setPostTitle(tpl.title)
    setPostContent(applyVariables(tpl.content, selectedLogement?.lien_driing ?? null))
    setSaveError(null)
    void markStepIfNotYet('fb_template_chosen')
  }

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
    setSaveError(null)
    const res = await saveFacebookPost({
      postId: editingPostId,
      logementId: selectedLogementId,
      title: postTitle.trim() || 'Mon post',
      content: postContent,
    })
    setSaving(false)
    if (res.error) {
      setSaveError(res.error)
      return
    }
    // Si c'était une création, on garde le postId retourné pour rester en mode édition.
    if (!editingPostId && (res as any).postId) {
      setEditingPostId((res as any).postId)
    }
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!editingPost) return
    if (!confirm(`Supprimer le post "${editingPost.title}" ?`)) return
    const res = await deleteFacebookPost(editingPost.id)
    if (res.error) {
      setSaveError(res.error)
      return
    }
    // Reset sur le suivant ou nouveau brouillon
    const remaining = savedForLogement.filter(p => p.id !== editingPost.id)
    if (remaining[0]) {
      selectSavedPost(remaining[0])
    } else {
      startNewDraft()
    }
    startTransition(() => router.refresh())
  }

  if (templates.length === 0) return null

  const hasLogements = logements.length > 0
  const noLinkOnSelected = selectedLogement && !selectedLogement.lien_driing

  return (
    <section style={s.wrap} className="fade-up">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerIcon}>
          <FacebookLogo size={20} color="#1877F2" weight="fill" />
        </div>
        <div>
          <div style={s.title}>Poste dans ces groupes</div>
          <div style={s.subtitle}>
            Crée un ou plusieurs posts par logement, sauvegarde-les, puis copie-colle dans tous les groupes.
          </div>
        </div>
      </div>

      {/* Sélecteur logement */}
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

      {/* Section 1 : Mes posts sauvegardés (+ chip Nouveau) */}
      <div>
        <div style={s.chipsLabel}>Mes posts pour ce logement</div>
        <div style={s.chipsRow}>
          {savedForLogement.map(post => {
            const active = post.id === editingPostId
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => selectSavedPost(post)}
                style={{
                  ...s.chip,
                  background: active ? 'var(--success-1)' : 'transparent',
                  borderColor: active ? 'var(--success-1)' : 'rgba(16,185,129,0.45)',
                  color: active ? '#fff' : '#059669',
                  fontWeight: 600,
                }}
                title={post.title}
              >
                <BookmarkSimple size={11} weight="fill" />
                {post.title}
              </button>
            )
          })}
          <button
            type="button"
            onClick={startNewDraft}
            style={{
              ...s.chip,
              background: editingPostId === null ? 'var(--accent-bg-2)' : 'var(--surface)',
              borderColor: editingPostId === null ? 'var(--accent-border-2)' : 'var(--border)',
              color: editingPostId === null ? 'var(--accent-text)' : 'var(--text-2)',
              fontWeight: editingPostId === null ? 600 : 400,
              borderStyle: 'dashed',
            }}
            title="Démarrer un nouveau brouillon"
          >
            <Plus size={11} weight="bold" />
            Nouveau
          </button>
        </div>
      </div>

      {/* Section 2 : Inspirations templates — carrousel horizontal sur mobile */}
      <div>
        <div style={s.chipsLabel}>Pioche un style pour t'inspirer</div>
        <div style={s.chipsRow} className="fb-inspirations-row">
          <style>{`
            @media (max-width: 640px) {
              .fb-inspirations-row {
                flex-wrap: nowrap !important;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                padding-bottom: 6px;
                -webkit-overflow-scrolling: touch;
              }
              .fb-inspirations-row > button {
                scroll-snap-align: start;
                flex-shrink: 0;
              }
              .fb-inspirations-row::-webkit-scrollbar { height: 3px; }
              .fb-inspirations-row::-webkit-scrollbar-thumb {
                background: var(--border-2); border-radius: 999px;
              }
            }
          `}</style>
          {templates.map(t => {
            const active = t.id === lastLoadedTemplateId
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => loadTemplate(t)}
                style={{
                  ...s.chip,
                  background: active ? 'var(--accent-bg-2)' : 'var(--surface)',
                  borderColor: active ? 'var(--accent-border-2)' : 'var(--border)',
                  color: active ? 'var(--accent-text)' : 'var(--text-2)',
                  fontWeight: active ? 600 : 400,
                }}
                title={`Charger : ${t.title}`}
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

      {/* Input titre du post */}
      <label style={s.field}>
        <span style={s.fieldLabel}>Titre du post</span>
        <input
          type="text"
          value={postTitle}
          onChange={e => setPostTitle(e.target.value)}
          placeholder="Mon post"
          style={s.input}
          maxLength={60}
        />
      </label>

      {/* Textarea contenu */}
      <textarea
        value={postContent}
        onChange={e => setPostContent(e.target.value)}
        style={s.textarea}
        rows={12}
        spellCheck={false}
        placeholder="Écris ton post Facebook ici, ou pioche un style ci-dessus pour démarrer."
      />

      {/* Message d'erreur */}
      {saveError && (
        <div style={s.errorBox}>
          <Warning size={14} />
          <span>
            Impossible de sauvegarder : {saveError}.
            {saveError.includes('does not exist') || saveError.includes('relation') ? (
              <> Applique la migration <code style={s.code}>user_facebook_posts</code> sur Supabase et réessaie.</>
            ) : null}
          </span>
        </div>
      )}

      {/* Footer : hint + boutons */}
      <div style={s.editorFooter}>
        <span style={s.footerHint}>
          Personnalise les zones <code style={s.code}>[entre crochets]</code>, sauvegarde, puis copie.
        </span>
        <div style={s.actionsRow}>
          {editingPost && (
            <button
              type="button"
              onClick={handleDelete}
              style={s.deleteBtn}
              title={`Supprimer "${editingPost.title}"`}
            >
              <Trash size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!postContent.trim() || saving}
            style={{
              ...s.saveBtn,
              background: savedFlash ? 'var(--success-1)' : 'transparent',
              color: savedFlash ? '#fff' : 'var(--text-2)',
              borderColor: savedFlash ? 'var(--success-1)' : 'var(--border-2)',
            }}
            title={editingPostId ? 'Mettre à jour ce post' : 'Sauvegarder comme nouveau post'}
          >
            {savedFlash ? <Check size={13} weight="bold" /> : <FloppyDisk size={13} weight="bold" />}
            {savedFlash ? 'Sauvegardé' : (editingPostId ? 'Mettre à jour' : 'Sauvegarder')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!postContent.trim()}
            style={{
              ...s.copyBtn,
              background: copied ? 'var(--success-1)' : 'var(--accent-text)',
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
  header: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  headerIcon: {
    width: '40px', height: '40px',
    background: 'rgba(24,119,242,0.10)', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  subtitle: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 },

  field: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
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
  chipsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
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

  errorBox: {
    padding: '10px 12px', borderRadius: '10px',
    background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.30)',
    fontSize: '12.5px', color: 'var(--danger)', lineHeight: 1.5,
    display: 'flex', alignItems: 'center', gap: '8px',
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
  actionsRow: { display: 'flex', alignItems: 'center', gap: '8px' },
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
