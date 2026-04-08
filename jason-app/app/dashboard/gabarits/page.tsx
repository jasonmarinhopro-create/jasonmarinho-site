'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, FileText, MagnifyingGlass,
  Heart, PencilSimple, X,
  CalendarCheck, House, SunHorizon, CaretRight,
} from '@phosphor-icons/react'
import type { Template, UserTemplateCustomization } from '@/types'
import Header from '@/components/layout/Header'

// ── Mapping catégorie → moment d'envoi ─────────────────────────────────────
type TimingBucket = 'avant-arrivee' | 'pendant-sejour' | 'apres-depart'

const CATEGORY_TO_TIMING: Record<string, TimingBucket> = {
  confirmation: 'avant-arrivee',
  checkin:      'avant-arrivee',
  bienvenue:    'avant-arrivee',
  securite:     'avant-arrivee',
  upsell:       'avant-arrivee',
  probleme:     'pendant-sejour',
  extra:        'pendant-sejour',
  conciergerie: 'pendant-sejour',
  checkout:     'apres-depart',
  avis:         'apres-depart',
}

const TIMING_LABELS: Record<TimingBucket, string> = {
  'avant-arrivee':  "Avant l'arrivée",
  'pendant-sejour': 'Pendant le séjour',
  'apres-depart':   'Après le départ',
}

// Raccourcis de timing affichés dans la modal
const TIMING_SHORTCUTS = [
  "Avant l'arrivée",
  'Pendant le séjour',
  'Après le départ',
]

const CATEGORY_LABELS: Record<string, string> = {
  confirmation:  'Confirmation',
  checkin:       'Check-in',
  checkout:      'Check-out',
  avis:          "Demande d'avis",
  bienvenue:     'Bienvenue',
  probleme:      'Problème',
  extra:         'Extra',
  upsell:        'Upsell',
  securite:      'Sécurité',
  conciergerie:  'Conciergerie',
  saisonnier:    'Saisonnier',
  airbnb:        'Airbnb',
  autre:         'Autre',
}

function getTimingBucket(template: Template): TimingBucket | null {
  return CATEGORY_TO_TIMING[template.category] ?? null
}

// Devine le bucket depuis une étiquette libre saisie par l'utilisateur
function guessTimingBucket(label: string): TimingBucket | null {
  const t = label.toLowerCase()
  if (t.includes('avant') || t.includes('j-') || t.includes('confirmation') || t.includes('arrivée') || t.includes('arrivee') || t.includes('réservation') || t.includes('check-in') || t.includes('checkin')) return 'avant-arrivee'
  if (t.includes('pendant') || t.includes('séjour') || t.includes('sejour') || t.includes('durant') || t.includes('en cours')) return 'pendant-sejour'
  if (t.includes('après') || t.includes('apres') || t.includes('départ') || t.includes('depart') || t.includes('check-out') || t.includes('checkout') || t.includes('sortie') || t.includes('avis')) return 'apres-depart'
  return null
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g) ?? []
  return [...new Set(matches)]
}

// ── Types de filtre ─────────────────────────────────────────────────────────
type FilterKey = 'all' | 'favorites' | TimingBucket

// ─────────────────────────────────────────────────────────────────────────────

export default function GabaritsPage() {
  const [templates, setTemplates]           = useState<Template[]>([])
  const [favorites, setFavorites]           = useState<Set<string>>(new Set())
  const [customizations, setCustomizations] = useState<Record<string, UserTemplateCustomization>>({})
  const [userId, setUserId]                 = useState<string | null>(null)

  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [copied, setCopied]             = useState<string | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  // Modal personnalisation
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [modalTitle, setModalTitle]           = useState('')
  const [modalContent, setModalContent]       = useState('')
  const [modalNotes, setModalNotes]           = useState('')
  const [modalTiming, setModalTiming]         = useState<string>('')
  const [savingModal, setSavingModal]         = useState(false)
  const [deletingCustom, setDeletingCustom]   = useState(false)

  // ── Chargement initial ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [tmplRes, favRes, custRes] = await Promise.all([
      supabase.from('templates').select('*').order('category').order('title'),
      supabase.from('user_template_favorites').select('template_id').eq('user_id', user.id),
      supabase.from('user_template_customizations').select('*').eq('user_id', user.id),
    ])

    if (tmplRes.data)  setTemplates(tmplRes.data as Template[])
    if (favRes.data)   setFavorites(new Set(favRes.data.map((f: { template_id: string }) => f.template_id)))
    if (custRes.data) {
      const map: Record<string, UserTemplateCustomization> = {}
      custRes.data.forEach((c: UserTemplateCustomization) => { map[c.template_id] = c })
      setCustomizations(map)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Favoris ───────────────────────────────────────────────────────────────
  async function toggleFavorite(templateId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    const supabase = createClient()
    const isFav = favorites.has(templateId)

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(templateId) : next.add(templateId)
      return next
    })

    if (isFav) {
      await supabase.from('user_template_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('template_id', templateId)
    } else {
      await supabase.from('user_template_favorites')
        .insert({ user_id: userId, template_id: templateId })
    }

    showToast(isFav ? 'Retiré des favoris' : '⭐ Ajouté aux favoris')
  }

  // ── Copier ────────────────────────────────────────────────────────────────
  async function copyTemplate(t: Template, e: React.MouseEvent, lang: 'fr' | 'en' = 'fr') {
    e.stopPropagation()
    const content = lang === 'en'
      ? (t.corps_en ?? t.content)
      : (customizations[t.id]?.content ?? t.content)
    await navigator.clipboard.writeText(content)
    setCopied(t.id)
    setTimeout(() => setCopied(null), 2000)
    showToast('Copié dans le presse-papier')

    const supabase = createClient()
    try { await supabase.rpc('increment_copy_count', { template_id: t.id }) } catch {}
  }

  // ── Modal personnalisation ────────────────────────────────────────────────
  function openCustomize(t: Template) {
    const existing = customizations[t.id]
    const defaultTiming = existing?.timing_label
      ?? TIMING_LABELS[getTimingBucket(t) ?? ''] ?? ''
    setEditingTemplate(t)
    setModalTitle(existing?.title ?? t.title)
    setModalContent(existing?.content ?? t.content)
    setModalNotes(existing?.notes ?? '')
    setModalTiming(defaultTiming)
  }

  async function saveCustomization() {
    if (!editingTemplate || !userId) return
    setSavingModal(true)
    const supabase = createClient()

    const payload = {
      user_id:      userId,
      template_id:  editingTemplate.id,
      title:        modalTitle.trim() || editingTemplate.title,
      content:      modalContent.trim() || editingTemplate.content,
      notes:        modalNotes.trim() || null,
      timing_label: modalTiming || null,
    }

    const existing = customizations[editingTemplate.id]
    let result
    if (existing) {
      result = await supabase
        .from('user_template_customizations')
        .update({ title: payload.title, content: payload.content, notes: payload.notes, timing_label: payload.timing_label })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('user_template_customizations')
        .insert(payload)
        .select()
        .single()
    }

    if (result.data) {
      setCustomizations(prev => ({ ...prev, [editingTemplate.id]: result.data as UserTemplateCustomization }))
      // Auto-favorite when customizing
      if (!favorites.has(editingTemplate.id)) {
        setFavorites(prev => new Set([...prev, editingTemplate.id]))
        await supabase.from('user_template_favorites').insert({ user_id: userId, template_id: editingTemplate.id })
      }
      showToast('Version personnalisée enregistrée !')
    }

    setSavingModal(false)
    setEditingTemplate(null)
  }

  async function deleteCustomization() {
    if (!editingTemplate || !userId) return
    const existing = customizations[editingTemplate.id]
    if (!existing) return setEditingTemplate(null)

    setDeletingCustom(true)
    const supabase = createClient()
    await supabase.from('user_template_customizations').delete().eq('id', existing.id)
    setCustomizations(prev => {
      const next = { ...prev }
      delete next[editingTemplate.id]
      return next
    })
    showToast('Version personnalisée supprimée')
    setDeletingCustom(false)
    setEditingTemplate(null)
  }

  function resetModal() {
    if (!editingTemplate) return
    setModalTitle(editingTemplate.title)
    setModalContent(editingTemplate.content)
    setModalNotes('')
    setModalTiming(TIMING_LABELS[getTimingBucket(editingTemplate) ?? ''] ?? '')
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = templates.filter(t => {
    if (activeFilter === 'favorites')     return favorites.has(t.id)
    if (activeFilter === 'avant-arrivee')  return getTimingBucket(t) === 'avant-arrivee'
    if (activeFilter === 'pendant-sejour') return getTimingBucket(t) === 'pendant-sejour'
    if (activeFilter === 'apres-depart')   return getTimingBucket(t) === 'apres-depart'
    // 'all' + search
    if (!search) return true
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
  })

  // Groupement pour la vue favoris
  const favoritesByTiming: Record<TimingBucket | 'autre', Template[]> = {
    'avant-arrivee':  [],
    'pendant-sejour': [],
    'apres-depart':   [],
    'autre':          [],
  }
  if (activeFilter === 'favorites') {
    filtered.forEach(t => {
      const customTiming = customizations[t.id]?.timing_label
      const bucket = (customTiming ? guessTimingBucket(customTiming) : null)
        ?? getTimingBucket(t)
        ?? 'autre'
      favoritesByTiming[bucket].push(t)
    })
  }

  const favoriteSections: { key: TimingBucket | 'autre'; label: string; icon: React.ReactNode }[] = [
    { key: 'avant-arrivee',  label: "Avant l'arrivée",   icon: <CalendarCheck size={16} weight="fill" color="#FFD56B" /> },
    { key: 'pendant-sejour', label: 'Pendant le séjour', icon: <House size={16} weight="fill" color="#60BEFF" /> },
    { key: 'apres-depart',   label: 'Après le départ',   icon: <SunHorizon size={16} weight="fill" color="#F97583" /> },
    { key: 'autre',          label: 'Non classifié',      icon: <FileText size={16} weight="fill" color="var(--text-muted)" /> },
  ]

  const isFavoritesView = activeFilter === 'favorites'

  return (
    <>
      <Header title="Gabarits" />

      {/* Toast */}
      {toast && (
        <div style={s.toast}>
          <Check size={14} color="#34D399" weight="bold" />
          {toast}
        </div>
      )}

      <div style={s.page}>
        {/* Intro */}
        <div style={s.intro} className="fade-up">
          <h2 style={s.pageTitle}>
            Gabarits <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>prêts à l'emploi</em>
          </h2>
          <p style={s.pageDesc}>
            Messages prêts à copier pour chaque étape du séjour. Personnalise-les pour ton logement et retrouve tes versions dans tes favoris.
          </p>
        </div>

        {/* Filtres simplifiés */}
        <div style={s.filterBar} className="fade-up d1">
          {([
            { key: 'all',            label: 'Tous' },
            { key: 'favorites',      label: '⭐ Mes favoris' },
            { key: 'avant-arrivee',  label: "Avant l'arrivée" },
            { key: 'pendant-sejour', label: 'Pendant le séjour' },
            { key: 'apres-depart',   label: 'Après le départ' },
          ] as { key: FilterKey; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setSearch('') }}
              style={{
                ...s.filterBtn,
                ...(activeFilter === f.key ? s.filterBtnActive : {}),
                ...(f.key === 'favorites' && activeFilter !== 'favorites' ? s.filterBtnFav : {}),
              }}
            >
              {f.label}
              {f.key !== 'all' && f.key !== 'favorites' && (
                <span style={s.filterCount}>
                  {templates.filter(t =>
                    f.key === 'favorites'
                      ? favorites.has(t.id)
                      : getTimingBucket(t) === f.key
                  ).length}
                </span>
              )}
              {f.key === 'favorites' && favorites.size > 0 && (
                <span style={{ ...s.filterCount, background: 'rgba(255,213,107,0.25)', color: '#FFD56B' }}>
                  {favorites.size}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Barre de recherche (cachée en vue favoris) */}
        {!isFavoritesView && (
          <div style={s.searchWrap} className="fade-up d2">
            <MagnifyingGlass size={15} color="var(--text-3)" />
            <input
              type="text"
              placeholder="Chercher un gabarit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Vue favoris groupée par moment */}
        {isFavoritesView && favorites.size === 0 && (
          <div style={s.empty} className="fade-up">
            <Heart size={40} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-3)', marginTop: '12px', fontSize: '14px' }}>
              Clique sur ♡ sur un gabarit pour l'ajouter à tes favoris.
            </p>
          </div>
        )}

        {isFavoritesView && favorites.size > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-up d1">
            {favoriteSections.map(section => {
              const items = favoritesByTiming[section.key]
              if (items.length === 0) return null
              return (
                <div key={section.key}>
                  <div style={s.sectionHeader}>
                    {section.icon}
                    <span style={s.sectionTitle}>{section.label}</span>
                    <span style={s.sectionCount}>{items.length}</span>
                  </div>
                  <div className="dash-grid-3">
                    {items.map((t, i) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        isFav={favorites.has(t.id)}
                        customization={customizations[t.id]}
                        copied={copied}
                        onCopy={copyTemplate}
                        onFavorite={toggleFavorite}
                        onCustomize={openCustomize}
                        delay={i % 3 + 1}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Grille normale */}
        {!isFavoritesView && (
          <>
            <div className="dash-grid-3">
              {filtered.map((t, i) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isFav={favorites.has(t.id)}
                  customization={customizations[t.id]}
                  copied={copied}
                  onCopy={copyTemplate}
                  onFavorite={toggleFavorite}
                  onCustomize={openCustomize}
                  delay={i % 3 + 1}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={s.empty}>
                <FileText size={36} color="var(--text-muted)" weight="fill" />
                <p style={{ color: 'var(--text-3)', marginTop: '12px', fontSize: '14px' }}>
                  Aucun gabarit trouvé.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal personnalisation */}
      {editingTemplate && (
        <CustomizeModal
          template={editingTemplate}
          existing={customizations[editingTemplate.id]}
          title={modalTitle}
          content={modalContent}
          notes={modalNotes}
          timing={modalTiming}
          saving={savingModal}
          deleting={deletingCustom}
          onTitleChange={setModalTitle}
          onContentChange={setModalContent}
          onNotesChange={setModalNotes}
          onTimingChange={setModalTiming}
          onSave={saveCustomization}
          onDelete={deleteCustomization}
          onReset={resetModal}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </>
  )
}

// ── Carte gabarit ─────────────────────────────────────────────────────────────
interface TemplateCardProps {
  template:      Template
  isFav:         boolean
  customization: UserTemplateCustomization | undefined
  copied:        string | null
  delay:         number
  onCopy:        (t: Template, e: React.MouseEvent, lang: 'fr' | 'en') => void
  onFavorite:    (id: string, e: React.MouseEvent) => void
  onCustomize:   (t: Template) => void
}

function TemplateCard({ template: t, isFav, customization, copied, delay, onCopy, onFavorite, onCustomize }: TemplateCardProps) {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const hasEN = !!t.corps_en

  // Badge : étiquette libre de l'utilisateur, ou label prédéfini du bucket, ou rien
  const customTimingLabel = customization?.timing_label || null
  const timingBucket = customTimingLabel ? guessTimingBucket(customTimingLabel) : getTimingBucket(t)
  const timingDisplayLabel = customTimingLabel || (timingBucket ? TIMING_LABELS[timingBucket] : null)

  const displayContent = lang === 'en'
    ? (t.corps_en ?? t.content)
    : (customization?.content ?? t.content)
  const displayTitle = customization?.title ?? t.title

  return (
    <div style={s.card} className={`glass-card fade-up d${delay}`}>
      {/* Header */}
      <div style={s.cardHead}>
        <div style={s.cardIcon}>
          <FileText size={18} color="#FFD56B" weight="fill" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.cardTitle}>{displayTitle}</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
            {timingDisplayLabel && (
              <span style={{ ...s.timingBadge, ...(timingBucket ? timingColors[timingBucket] : s.timingBadgeCustom) }}>
                {timingDisplayLabel}
              </span>
            )}
            {customization && lang === 'fr' && (
              <span style={s.customBadge}>Personnalisé</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {/* Toggle FR / EN */}
          {hasEN && (
            <div style={s.langToggle}>
              <button
                onClick={() => setLang('fr')}
                style={{ ...s.langBtn, ...(lang === 'fr' ? s.langBtnActive : {}) }}
                title="Version française"
              >
                FR
              </button>
              <button
                onClick={() => setLang('en')}
                style={{ ...s.langBtn, ...(lang === 'en' ? s.langBtnActiveEN : {}) }}
                title="English version"
              >
                EN
              </button>
            </div>
          )}
          <button
            onClick={e => onFavorite(t.id, e)}
            style={{ ...s.iconBtn, ...(isFav ? s.iconBtnFavActive : {}) }}
            title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={15} weight={isFav ? 'fill' : 'regular'} color={isFav ? '#FFD56B' : undefined} />
          </button>
          <button
            onClick={() => onCustomize(t)}
            style={{ ...s.iconBtn, ...(customization ? s.iconBtnCustomActive : {}) }}
            title="Personnaliser"
          >
            <PencilSimple size={15} weight={customization ? 'fill' : 'regular'} />
          </button>
          <button
            onClick={e => onCopy(t, e, lang)}
            style={{ ...s.iconBtn, ...(copied === t.id ? s.iconBtnCopied : {}) }}
            title={lang === 'en' ? 'Copy English version' : (customization ? 'Copier ma version' : 'Copier')}
          >
            {copied === t.id
              ? <Check size={15} color="#34D399" weight="bold" />
              : <Copy size={15} />}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <pre style={s.content}>{displayContent}</pre>

      {/* Note privée si présente (FR only) */}
      {customization?.notes && lang === 'fr' && (
        <div style={s.notePreview}>
          <CaretRight size={10} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-3)', fontSize: '11.5px', fontStyle: 'italic', lineHeight: 1.5 }}>
            {customization.notes}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Modal personnalisation ────────────────────────────────────────────────────
interface CustomizeModalProps {
  template:        Template
  existing?:       UserTemplateCustomization
  title:           string
  content:         string
  notes:           string
  timing:          string
  saving:          boolean
  deleting:        boolean
  onTitleChange:   (v: string) => void
  onContentChange: (v: string) => void
  onNotesChange:   (v: string) => void
  onTimingChange:  (v: string) => void
  onSave:          () => void
  onDelete:        () => void
  onReset:         () => void
  onClose:         () => void
}

function CustomizeModal({
  template, existing,
  title, content, notes, timing,
  saving, deleting,
  onTitleChange, onContentChange, onNotesChange, onTimingChange,
  onSave, onDelete, onReset, onClose,
}: CustomizeModalProps) {
  const variables = extractVariables(content)
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalSubtitle}>
              <span className="badge badge-blue">{categoryLabel}</span>
              {template.timing && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  {template.timing}
                </span>
              )}
            </div>
            <h3 style={s.modalTitle}>Personnaliser le gabarit</h3>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Corps de la modal */}
        <div style={s.modalBody}>
          {/* Titre */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Titre (ton nom)</label>
            <input
              value={title}
              onChange={e => onTitleChange(e.target.value)}
              placeholder={template.title}
              style={s.input}
            />
          </div>

          {/* Moment d'envoi — input libre + raccourcis */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Quand envoyer ce message ?
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', marginLeft: '6px' }}>
                (libre, ex: J-2 avant arrivée)
              </span>
            </label>
            <input
              value={timing}
              onChange={e => onTimingChange(e.target.value)}
              placeholder="Ex: J-2 avant arrivée, Après le check-out…"
              style={s.input}
            />
            {/* Raccourcis rapides */}
            <div style={s.timingBtns}>
              {TIMING_SHORTCUTS.map(shortcut => (
                <button
                  key={shortcut}
                  onClick={() => onTimingChange(shortcut)}
                  style={{
                    ...s.timingBtn,
                    ...(timing === shortcut ? s.timingBtnActive : {}),
                  }}
                >
                  {shortcut}
                </button>
              ))}
              {timing && (
                <button
                  onClick={() => onTimingChange('')}
                  style={{ ...s.timingBtn, color: 'var(--text-muted)' }}
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Variables détectées */}
          {variables.length > 0 && (
            <div style={s.fieldGroup}>
              <label style={s.label}>Variables à remplacer</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {variables.map(v => (
                  <span key={v} style={s.varChip}>{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Contenu */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Mon message</label>
            <textarea
              value={content}
              onChange={e => onContentChange(e.target.value)}
              style={s.textarea}
              rows={10}
            />
          </div>

          {/* Notes privées */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Notes privées <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Ex: À envoyer 48h avant l'arrivée via Airbnb"
              style={{ ...s.textarea, minHeight: '64px' }}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={s.modalFooter}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {existing && (
              <button
                onClick={onDelete}
                style={s.deleteBtnSmall}
                disabled={deleting}
              >
                {deleting ? '...' : 'Supprimer ma version'}
              </button>
            )}
            <button onClick={onReset} style={s.resetBtn}>
              Réinitialiser
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={s.cancelBtn}>Annuler</button>
            <button onClick={onSave} style={s.saveBtn} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer ma version'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Couleurs timing ───────────────────────────────────────────────────────────
const timingColors: Record<TimingBucket, React.CSSProperties> = {
  'avant-arrivee':  { background: 'rgba(255,213,107,0.12)', color: '#FFD56B',  border: '1px solid rgba(255,213,107,0.25)' },
  'pendant-sejour': { background: 'rgba(96,190,255,0.1)',   color: '#60BEFF',  border: '1px solid rgba(96,190,255,0.25)' },
  'apres-depart':   { background: 'rgba(249,117,131,0.1)',  color: '#F97583',  border: '1px solid rgba(249,117,131,0.25)' },
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:         { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:        { marginBottom: '28px' },
  pageTitle:    { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc:     { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.6 },

  filterBar:    {
    display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px',
    width: '100%',
  } as React.CSSProperties,
  filterBtn:    {
    fontSize: '12.5px', fontWeight: 500, padding: '7px 14px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '5px',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  filterBtnActive: {
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)',
  },
  filterBtnFav: { color: 'var(--text-2)' },
  filterCount:  {
    fontSize: '10px', fontWeight: 600,
    background: 'rgba(255,255,255,0.07)', color: 'var(--text-3)',
    borderRadius: '100px', padding: '1px 6px',
  },

  searchWrap:   {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px', maxWidth: '440px', marginBottom: '24px',
    width: '100%',
  },
  searchInput:  {
    background: 'none', border: 'none', outline: 'none',
    fontFamily: 'Outfit, sans-serif', fontSize: '13.5px',
    color: 'var(--text)', width: '100%',
  },
  clearSearch:  {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', display: 'flex', padding: '2px',
  },

  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  sectionTitle:  { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' },
  sectionCount:  {
    fontSize: '10px', fontWeight: 600,
    background: 'rgba(255,255,255,0.07)', color: 'var(--text-3)',
    borderRadius: '100px', padding: '1px 7px',
  },

  card:     { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, overflow: 'hidden' },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 },
  cardIcon: {
    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle:    { fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  timingBadge:       { fontSize: '10.5px', fontWeight: 500, padding: '2px 8px', borderRadius: '100px' },
  timingBadgeCustom: { fontSize: '10.5px', fontWeight: 500, padding: '2px 8px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-3)' },
  customBadge:  {
    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.15)', color: '#FFD56B', border: '1px solid rgba(255,213,107,0.3)',
  },

  iconBtn: {
    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--border)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.18s',
  },
  iconBtnFavActive:    { background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)', color: '#FFD56B' },
  iconBtnCustomActive: { background: 'rgba(96,190,255,0.1)',   border: '1px solid rgba(96,190,255,0.25)', color: '#60BEFF' },
  iconBtnCopied:       { background: 'rgba(52,211,153,0.1)',   border: '1px solid rgba(52,211,153,0.2)' },

  langToggle: {
    display: 'flex', borderRadius: '7px', overflow: 'hidden',
    border: '1px solid var(--border)', background: 'var(--border)',
    gap: '1px',
  },
  langBtn: {
    fontSize: '10px', fontWeight: 700, padding: '0 7px', height: '30px',
    background: 'var(--surface)', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', fontFamily: 'Outfit, sans-serif',
    letterSpacing: '0.4px', transition: 'all 0.15s',
  },
  langBtnActive: {
    background: 'rgba(255,213,107,0.15)', color: 'var(--accent-text)',
  },
  langBtnActiveEN: {
    background: 'rgba(129,140,248,0.15)', color: '#818cf8',
  },

  content: {
    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.7,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px',
    maxHeight: '160px', overflowY: 'auto', overflowX: 'hidden', flex: 1,
    width: '100%',
  },
  notePreview: {
    display: 'flex', alignItems: 'flex-start', gap: '5px',
    padding: '7px 10px', borderRadius: '7px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
  },

  empty: { textAlign: 'center', padding: '56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },

  toast: {
    position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,30,20,0.96)', border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '10px', padding: '10px 18px',
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    zIndex: 1000, backdropFilter: 'blur(12px)',
    animation: 'fadeUp 0.3s ease', whiteSpace: 'nowrap',
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, zIndex: 900,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', width: '100%', maxWidth: '640px',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 24px 16px', borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  modalSubtitle: { display: 'flex', alignItems: 'center', marginBottom: '4px' },
  modalTitle:    { fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)' },
  closeBtn:      {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--border)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-2)', flexShrink: 0,
  },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  modalFooter: {
    padding: '16px 24px', borderTop: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0, flexWrap: 'wrap', gap: '8px',
  },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:      { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input:      {
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '13.5px', color: 'var(--text)',
    outline: 'none', width: '100%',
  },
  textarea: {
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '12.5px', color: 'var(--text-2)',
    outline: 'none', width: '100%', resize: 'vertical',
    minHeight: '200px', lineHeight: 1.7,
  },

  timingBtns: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  timingBtn:  {
    fontSize: '12px', fontWeight: 500, padding: '6px 13px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
  },
  timingBtnActive: {
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B',
  },

  varChip: {
    fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '6px',
    background: 'rgba(96,190,255,0.1)', border: '1px solid rgba(96,190,255,0.2)',
    color: '#60BEFF', fontFamily: 'monospace',
  },

  saveBtn: {
    fontSize: '13px', fontWeight: 600, padding: '9px 20px',
    borderRadius: '10px', cursor: 'pointer',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
  },
  cancelBtn: {
    fontSize: '13px', fontWeight: 500, padding: '9px 16px',
    borderRadius: '10px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'Outfit, sans-serif',
  },
  resetBtn: {
    fontSize: '12px', fontWeight: 500, padding: '7px 13px',
    borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-3)', fontFamily: 'Outfit, sans-serif',
  },
  deleteBtnSmall: {
    fontSize: '12px', fontWeight: 500, padding: '7px 13px',
    borderRadius: '8px', cursor: 'pointer',
    background: 'rgba(249,117,131,0.08)', border: '1px solid rgba(249,117,131,0.25)',
    color: '#F97583', fontFamily: 'Outfit, sans-serif',
  },
}
