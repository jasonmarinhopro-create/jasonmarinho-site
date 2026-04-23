'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, MagnifyingGlass, Heart, PencilSimple, X,
  CalendarCheck, House, SunHorizon, ArrowRight, UsersThree,
} from '@phosphor-icons/react'
import type { Template, UserTemplateCustomization } from '@/types'

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

const TIMING_SHORTCUTS = ["Avant l'arrivée", 'Pendant le séjour', 'Après le départ']

const CATEGORY_LABELS: Record<string, string> = {
  confirmation: 'Confirmation',
  checkin:      'Check-in',
  checkout:     'Check-out',
  avis:         "Demande d'avis",
  bienvenue:    'Bienvenue',
  probleme:     'Problème',
  extra:        'Extra',
  upsell:       'Upsell',
  securite:     'Sécurité',
  conciergerie: 'Conciergerie',
  saisonnier:   'Saisonnier',
  airbnb:       'Airbnb',
  facebook:     'Groupe Facebook',
  autre:        'Autre',
}

const FACEBOOK_CONFIG = { label: 'Groupes Facebook', color: '#818CF8', icon: UsersThree }

const SECTION_CONFIG: Record<TimingBucket, { label: string; color: string; icon: React.ElementType }> = {
  'avant-arrivee':  { label: "Avant l'arrivée",   color: '#FFD56B', icon: CalendarCheck },
  'pendant-sejour': { label: 'Pendant le séjour',  color: '#60BEFF', icon: House },
  'apres-depart':   { label: 'Après le départ',    color: '#F97583', icon: SunHorizon },
}

const TIMING_ORDER: TimingBucket[] = ['avant-arrivee', 'pendant-sejour', 'apres-depart']
const INITIAL_SHOW = 6

function getTimingBucket(template: Template): TimingBucket | null {
  return CATEGORY_TO_TIMING[template.category] ?? null
}

function guessTimingBucket(label: string): TimingBucket | null {
  const t = label.toLowerCase()
  if (t.includes('avant') || t.includes('arrivée') || t.includes('confirmation') || t.includes('check-in') || t.includes('checkin')) return 'avant-arrivee'
  if (t.includes('pendant') || t.includes('séjour') || t.includes('durant')) return 'pendant-sejour'
  if (t.includes('après') || t.includes('départ') || t.includes('checkout') || t.includes('avis')) return 'apres-depart'
  return null
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g) ?? []
  return [...new Set(matches)]
}

type FilterKey = 'all' | 'favorites' | TimingBucket | 'facebook'

// ── Props ─────────────────────────────────────────────────────────────────────
interface GabaritsClientProps {
  templates:              Template[]
  initialFavorites:       string[]
  initialCustomizations:  UserTemplateCustomization[]
  userId:                 string | null
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function GabaritsClient({
  templates,
  initialFavorites,
  initialCustomizations,
  userId,
}: GabaritsClientProps) {

  const [favorites, setFavorites]           = useState<Set<string>>(new Set(initialFavorites))
  const [customizations, setCustomizations] = useState<Record<string, UserTemplateCustomization>>(
    () => Object.fromEntries(initialCustomizations.map(c => [c.template_id, c]))
  )

  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [copied, setCopied]             = useState<string | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [modalTitle, setModalTitle]           = useState('')
  const [modalContent, setModalContent]       = useState('')
  const [modalNotes, setModalNotes]           = useState('')
  const [modalTiming, setModalTiming]         = useState<string>('')
  const [savingModal, setSavingModal]         = useState(false)
  const [deletingCustom, setDeletingCustom]   = useState(false)

  // ── Favoris ───────────────────────────────────────────────────────────────
  async function toggleFavorite(templateId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    const supabase = createClient()
    const isFav = favorites.has(templateId)
    setFavorites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(templateId) : next.add(templateId)
      return next
    })
    if (isFav) {
      await supabase.from('user_template_favorites').delete().eq('user_id', userId).eq('template_id', templateId)
    } else {
      await supabase.from('user_template_favorites').insert({ user_id: userId, template_id: templateId })
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
    setCopied(t.id + lang)
    setTimeout(() => setCopied(null), 2000)
    showToast('Copié dans le presse-papier !')
    const supabase = createClient()
    try { await supabase.rpc('increment_copy_count', { template_id: t.id }) } catch {}
  }

  // ── Modal personnalisation ────────────────────────────────────────────────
  function openCustomize(t: Template) {
    const existing = customizations[t.id]
    const bucket = getTimingBucket(t)
    const defaultTiming = existing?.timing_label ?? (bucket ? TIMING_LABELS[bucket] : '') ?? ''
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
      user_id: userId, template_id: editingTemplate.id,
      title: modalTitle.trim() || editingTemplate.title,
      content: modalContent.trim() || editingTemplate.content,
      notes: modalNotes.trim() || null,
      timing_label: modalTiming || null,
    }
    const existing = customizations[editingTemplate.id]
    let result
    if (existing) {
      result = await supabase.from('user_template_customizations')
        .update({ title: payload.title, content: payload.content, notes: payload.notes, timing_label: payload.timing_label })
        .eq('id', existing.id).select().single()
    } else {
      result = await supabase.from('user_template_customizations').insert(payload).select().single()
    }
    if (result.data) {
      setCustomizations(prev => ({ ...prev, [editingTemplate.id]: result.data as UserTemplateCustomization }))
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
    setCustomizations(prev => { const next = { ...prev }; delete next[editingTemplate.id]; return next })
    showToast('Version personnalisée supprimée')
    setDeletingCustom(false)
    setEditingTemplate(null)
  }

  function resetModal() {
    if (!editingTemplate) return
    setModalTitle(editingTemplate.title)
    setModalContent(editingTemplate.content)
    setModalNotes('')
    const b = getTimingBucket(editingTemplate)
    setModalTiming(b ? TIMING_LABELS[b] : '')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = templates.filter(t => {
    const q = search.toLowerCase()
    const matchesSearch = !search || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
    if (activeFilter === 'favorites')      return favorites.has(t.id) && matchesSearch
    if (activeFilter === 'avant-arrivee')  return getTimingBucket(t) === 'avant-arrivee' && matchesSearch
    if (activeFilter === 'pendant-sejour') return getTimingBucket(t) === 'pendant-sejour' && matchesSearch
    if (activeFilter === 'apres-depart')   return getTimingBucket(t) === 'apres-depart' && matchesSearch
    if (activeFilter === 'facebook')       return t.category === 'facebook' && matchesSearch
    return matchesSearch
  })

  const templatesByBucket = TIMING_ORDER.reduce((acc, bucket) => {
    acc[bucket] = filtered.filter(t => getTimingBucket(t) === bucket)
    return acc
  }, {} as Record<TimingBucket, Template[]>)

  const favoritesByBucket = TIMING_ORDER.reduce((acc, bucket) => {
    acc[bucket] = filtered.filter(t => {
      const customTiming = customizations[t.id]?.timing_label
      const b = (customTiming ? guessTimingBucket(customTiming) : null) ?? getTimingBucket(t)
      return b === bucket
    })
    return acc
  }, {} as Record<TimingBucket, Template[]>)

  const facebookTemplates    = filtered.filter(t => t.category === 'facebook')
  const allFacebookTemplates = templates.filter(t => t.category === 'facebook')

  const isFavoritesView  = activeFilter === 'favorites'
  const isFacebookView   = activeFilter === 'facebook'
  const isSingleSection  = !['all', 'favorites', 'facebook'].includes(activeFilter)

  return (
    <>
      {toast && (
        <div style={s.toast}>
          <Check size={13} color="#34D399" weight="bold" />
          {toast}
        </div>
      )}

      <div style={s.page}>

        <div style={s.intro} className="fade-up">
          <h2 style={s.pageTitle}>
            Gabarits <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>prêts à l&apos;emploi</em>
          </h2>
          <p style={s.pageDesc}>
            Tes messages déjà rédigés, à copier-coller directement sur les plateformes ou les groupes.
            Personnalise-les une fois, retrouve-les dans tes favoris.
          </p>
        </div>

        {/* Navigation */}
        <div style={s.nav} className="fade-up d1">
          {([
            { key: 'all',            label: 'Tous les gabarits' },
            { key: 'favorites',      label: '♡ Mes favoris',     count: favorites.size,    color: undefined },
            { key: 'avant-arrivee',  label: "Avant l'arrivée",   color: '#FFD56B', count: templates.filter(t => getTimingBucket(t) === 'avant-arrivee').length  || undefined },
            { key: 'pendant-sejour', label: 'Pendant le séjour',  color: '#60BEFF', count: templates.filter(t => getTimingBucket(t) === 'pendant-sejour').length || undefined },
            { key: 'apres-depart',   label: 'Après le départ',    color: '#F97583', count: templates.filter(t => getTimingBucket(t) === 'apres-depart').length   || undefined },
            { key: 'facebook',       label: 'Groupes Facebook',   color: '#818CF8', count: allFacebookTemplates.length || undefined },
          ] as { key: FilterKey; label: string; count?: number; color?: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setSearch('') }}
              style={{
                ...s.navBtn,
                ...(activeFilter === f.key ? {
                  background: f.color ? `${f.color}14` : 'rgba(255,213,107,0.1)',
                  border: `1px solid ${f.color ?? '#FFD56B'}35`,
                  color: f.color ?? 'var(--accent-text)',
                } : {}),
              }}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span style={{
                  ...s.navCount,
                  background: f.color ? `${f.color}20` : 'rgba(255,213,107,0.2)',
                  color: f.color ?? '#FFD56B',
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div style={s.searchWrap} className="fade-up d2">
          <MagnifyingGlass size={15} color="var(--text-3)" />
          <input
            type="text"
            placeholder="Chercher un gabarit…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.clearSearch}><X size={14} /></button>
          )}
        </div>

        {/* Vue Favoris */}
        {isFavoritesView && (
          <div className="fade-up d1">
            {favorites.size === 0 ? (
              <div style={s.empty}>
                <Heart size={40} color="var(--text-muted)" />
                <p style={s.emptyText}>Clique sur ♡ pour sauvegarder tes gabarits préférés.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.empty}>
                <MagnifyingGlass size={36} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun favori pour &ldquo;{search}&rdquo;.</p>
                <button onClick={() => setSearch('')} style={s.ghostBtn}>Effacer la recherche</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {TIMING_ORDER.map(bucket => {
                  const items = favoritesByBucket[bucket]
                  if (!items.length) return null
                  const cfg = SECTION_CONFIG[bucket]
                  const Icon = cfg.icon
                  return (
                    <div key={bucket}>
                      <SectionHeader Icon={Icon} label={cfg.label} color={cfg.color} count={items.length} />
                      <div style={s.grid}>
                        {items.map(t => (
                          <TemplateCard
                            key={t.id} template={t}
                            isFav={favorites.has(t.id)}
                            customization={customizations[t.id]}
                            copied={copied} bucket={getTimingBucket(t)}
                            onCopy={copyTemplate} onFavorite={toggleFavorite} onCustomize={openCustomize}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Vue Facebook */}
        {isFacebookView && (
          <div className="fade-up d1">
            {facebookTemplates.length === 0 ? (
              <div style={s.empty}>
                <UsersThree size={40} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun gabarit Facebook{search ? ` pour "${search}"` : ''}.</p>
              </div>
            ) : (
              <>
                <SectionHeader Icon={FACEBOOK_CONFIG.icon} label={FACEBOOK_CONFIG.label} color={FACEBOOK_CONFIG.color} count={facebookTemplates.length} />
                <div style={s.grid}>
                  {facebookTemplates.map(t => (
                    <TemplateCard
                      key={t.id} template={t}
                      isFav={favorites.has(t.id)}
                      customization={customizations[t.id]}
                      copied={copied} bucket={null}
                      onCopy={copyTemplate} onFavorite={toggleFavorite} onCustomize={openCustomize}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vue section unique */}
        {isSingleSection && (
          <div className="fade-up d1">
            {filtered.length === 0 ? (
              <div style={s.empty}>
                <MagnifyingGlass size={36} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun gabarit pour &ldquo;{search}&rdquo;.</p>
              </div>
            ) : (
              <div style={s.grid}>
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id} template={t}
                    isFav={favorites.has(t.id)}
                    customization={customizations[t.id]}
                    copied={copied} bucket={getTimingBucket(t)}
                    onCopy={copyTemplate} onFavorite={toggleFavorite} onCustomize={openCustomize}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Tous */}
        {activeFilter === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }} className="fade-up d1">
            {(() => {
              const fbItems = allFacebookTemplates.filter(t =>
                !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase())
              )
              if (!fbItems.length) return null
              const Icon = FACEBOOK_CONFIG.icon
              const shown = fbItems.slice(0, INITIAL_SHOW)
              const remaining = fbItems.length - INITIAL_SHOW
              return (
                <div key="facebook">
                  <SectionHeader Icon={Icon} label={FACEBOOK_CONFIG.label} color={FACEBOOK_CONFIG.color} count={fbItems.length} />
                  <div style={s.grid}>
                    {shown.map(t => (
                      <TemplateCard key={t.id} template={t} isFav={favorites.has(t.id)} customization={customizations[t.id]} copied={copied} bucket={null} onCopy={copyTemplate} onFavorite={toggleFavorite} onCustomize={openCustomize} />
                    ))}
                  </div>
                  {remaining > 0 && (
                    <button onClick={() => setActiveFilter('facebook')} style={s.seeMoreBtn}>
                      <ArrowRight size={14} color={FACEBOOK_CONFIG.color} />
                      <span>Voir les {remaining} autres gabarits &ldquo;{FACEBOOK_CONFIG.label}&rdquo;</span>
                    </button>
                  )}
                </div>
              )
            })()}

            {TIMING_ORDER.map(bucket => {
              const items = templatesByBucket[bucket]
              if (!items.length) return null
              const cfg = SECTION_CONFIG[bucket]
              const Icon = cfg.icon
              const shown = items.slice(0, INITIAL_SHOW)
              const remaining = items.length - INITIAL_SHOW
              return (
                <div key={bucket}>
                  <SectionHeader Icon={Icon} label={cfg.label} color={cfg.color} count={items.length} />
                  <div style={s.grid}>
                    {shown.map(t => (
                      <TemplateCard key={t.id} template={t} isFav={favorites.has(t.id)} customization={customizations[t.id]} copied={copied} bucket={bucket} onCopy={copyTemplate} onFavorite={toggleFavorite} onCustomize={openCustomize} />
                    ))}
                  </div>
                  {remaining > 0 && (
                    <button onClick={() => setActiveFilter(bucket)} style={s.seeMoreBtn}>
                      <ArrowRight size={14} color={cfg.color} />
                      <span>Voir les {remaining} autres gabarits &ldquo;{cfg.label}&rdquo;</span>
                    </button>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && allFacebookTemplates.length === 0 && (
              <div style={s.empty}>
                <MagnifyingGlass size={36} color="var(--text-muted)" />
                <p style={s.emptyText}>Aucun gabarit pour &ldquo;{search}&rdquo;.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal personnalisation */}
      {editingTemplate && (
        <CustomizeModal
          template={editingTemplate} existing={customizations[editingTemplate.id]}
          title={modalTitle} content={modalContent} notes={modalNotes} timing={modalTiming}
          saving={savingModal} deleting={deletingCustom}
          onTitleChange={setModalTitle} onContentChange={setModalContent}
          onNotesChange={setModalNotes} onTimingChange={setModalTiming}
          onSave={saveCustomization} onDelete={deleteCustomization}
          onReset={resetModal} onClose={() => setEditingTemplate(null)}
        />
      )}
    </>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ Icon, label, color, count }: {
  Icon: React.ElementType; label: string; color: string; count: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} weight="duotone" />
      </div>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>{label}</h3>
      <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600, color, background: `${color}18`, borderRadius: 20, padding: '2px 9px' }}>{count}</span>
    </div>
  )
}

// ── TemplateCard ──────────────────────────────────────────────────────────────
interface TemplateCardProps {
  template:      Template
  isFav:         boolean
  customization: UserTemplateCustomization | undefined
  copied:        string | null
  bucket:        TimingBucket | null
  onCopy:        (t: Template, e: React.MouseEvent, lang?: 'fr' | 'en') => void
  onFavorite:    (id: string, e: React.MouseEvent) => void
  onCustomize:   (t: Template) => void
}

function TemplateCard({ template: t, isFav, customization, copied, bucket, onCopy, onFavorite, onCustomize }: TemplateCardProps) {
  const [showEn, setShowEn] = useState(false)
  const displayContent = showEn
    ? (t.corps_en ?? t.content)
    : (customization?.content ?? t.content)
  const displayTitle = showEn ? t.title : (customization?.title ?? t.title)
  const variables = extractVariables(displayContent)
  const isCustomized = !!customization
  const copiedKey = t.id + (showEn ? 'en' : 'fr')
  const bucketCfg = bucket ? SECTION_CONFIG[bucket] : null

  return (
    <div style={s.card} onClick={() => onCustomize(t)}>
      <div style={s.cardTop}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
          {bucketCfg && (
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${bucketCfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <bucketCfg.icon size={13} color={bucketCfg.color} weight="duotone" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={s.cardTitle}>{displayTitle}</span>
              {isCustomized && <span style={s.customBadge}>Personnalisé</span>}
            </div>
            {t.category && (
              <span style={s.catBadge}>{CATEGORY_LABELS[t.category] ?? t.category}</span>
            )}
          </div>
        </div>
        <button
          onClick={e => onFavorite(t.id, e)}
          style={{ ...s.iconBtn, color: isFav ? '#F97583' : 'var(--text-muted)' }}
          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={16} weight={isFav ? 'fill' : 'regular'} />
        </button>
      </div>

      <p style={s.cardBody}>{displayContent.slice(0, 160)}{displayContent.length > 160 ? '…' : ''}</p>

      {variables.length > 0 && (
        <div style={s.varRow}>
          {variables.slice(0, 4).map(v => (
            <span key={v} style={s.varChip}>{v}</span>
          ))}
          {variables.length > 4 && <span style={s.varChip}>+{variables.length - 4}</span>}
        </div>
      )}

      <div style={s.cardActions} onClick={e => e.stopPropagation()}>
        {t.corps_en && (
          <button
            onClick={() => setShowEn(p => !p)}
            style={{ ...s.langBtn, ...(showEn ? s.langBtnActive : {}) }}
          >
            {showEn ? 'FR' : 'EN'}
          </button>
        )}
        <button onClick={e => onCustomize(t)} style={s.editBtn} title="Personnaliser">
          <PencilSimple size={13} />
        </button>
        <button
          onClick={e => onCopy(t, e, showEn ? 'en' : 'fr')}
          style={{ ...s.copyBtn, ...(copied === copiedKey ? s.copyBtnDone : {}) }}
        >
          {copied === copiedKey
            ? <><Check size={13} weight="bold" /> Copié</>
            : <><Copy size={13} /> Copier</>}
        </button>
      </div>
    </div>
  )
}

// ── CustomizeModal ────────────────────────────────────────────────────────────
interface CustomizeModalProps {
  template:       Template
  existing:       UserTemplateCustomization | undefined
  title:          string
  content:        string
  notes:          string
  timing:         string
  saving:         boolean
  deleting:       boolean
  onTitleChange:  (v: string) => void
  onContentChange:(v: string) => void
  onNotesChange:  (v: string) => void
  onTimingChange: (v: string) => void
  onSave:         () => void
  onDelete:       () => void
  onReset:        () => void
  onClose:        () => void
}

function CustomizeModal({
  template: t, existing, title, content, notes, timing,
  saving, deleting,
  onTitleChange, onContentChange, onNotesChange, onTimingChange,
  onSave, onDelete, onReset, onClose,
}: CustomizeModalProps) {
  const variables = extractVariables(content)

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>Personnaliser le gabarit</h3>
          <button onClick={onClose} style={s.iconBtn}><X size={16} /></button>
        </div>

        <div style={s.modalBody}>
          <label style={s.label}>Titre</label>
          <input
            style={s.input}
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={t.title}
          />

          <label style={s.label}>Contenu</label>
          <textarea
            style={{ ...s.input, ...s.textarea }}
            value={content}
            onChange={e => onContentChange(e.target.value)}
            placeholder={t.content}
            rows={8}
          />

          {variables.length > 0 && (
            <div style={s.varRow}>
              {variables.map(v => <span key={v} style={s.varChip}>{v}</span>)}
            </div>
          )}

          <label style={s.label}>Étiquette d&apos;envoi (optionnel)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {TIMING_SHORTCUTS.map(ts => (
              <button
                key={ts}
                onClick={() => onTimingChange(timing === ts ? '' : ts)}
                style={{ ...s.timingChip, ...(timing === ts ? s.timingChipActive : {}) }}
              >{ts}</button>
            ))}
          </div>

          <label style={s.label}>Notes privées (optionnel)</label>
          <textarea
            style={{ ...s.input, ...s.textarea }}
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Rappels, contexte, utilisation…"
            rows={3}
          />
        </div>

        <div style={s.modalFooter}>
          {existing && (
            <button onClick={onDelete} disabled={deleting} style={s.deleteBtn}>
              {deleting ? 'Suppression…' : 'Supprimer ma version'}
            </button>
          )}
          <button onClick={onReset} style={s.ghostBtn}>Réinitialiser</button>
          <button onClick={onSave} disabled={saving} style={s.saveBtn}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 80 },
  intro:       { marginBottom: 28 },
  pageTitle:   { margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.5px' },
  pageDesc:    { marginTop: 8, marginBottom: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 },

  nav:         { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  navBtn:      { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', transition: 'all .15s' },
  navCount:    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 18, borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '0 5px' },

  searchWrap:  { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', height: 40, marginBottom: 32 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-1)' },
  clearSearch: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 },

  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 },

  card:        { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 0, transition: 'border-color .15s, transform .1s', position: 'relative' },
  cardTop:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  cardTitle:   { fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 },
  cardBody:    { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, margin: '0 0 10px', flex: 1 },
  cardActions: { display: 'flex', gap: 6, alignItems: 'center', marginTop: 'auto', paddingTop: 4 },

  catBadge:    { display: 'inline-block', marginTop: 3, fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 6, padding: '1px 6px' },
  customBadge: { fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: '#60BEFF', background: 'rgba(96,190,255,0.12)', borderRadius: 6, padding: '2px 6px' },

  varRow:      { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  varChip:     { fontSize: 11, color: '#FFD56B', background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.2)', borderRadius: 6, padding: '1px 6px' },

  iconBtn:     { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6, color: 'var(--text-muted)', transition: 'color .15s' },
  editBtn:     { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer' },
  copyBtn:     { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)', color: '#FFD56B', cursor: 'pointer', transition: 'all .15s', marginLeft: 'auto' },
  copyBtnDone: { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399' },
  langBtn:     { fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' },
  langBtnActive: { background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)', color: '#FFD56B' },

  seeMoreBtn:  { display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '7px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer' },

  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', color: 'var(--text-muted)' },
  emptyText:   { margin: 0, fontSize: 14, color: 'var(--text-3)', textAlign: 'center' as const },
  ghostBtn:    { background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer' },

  toast:       { position: 'fixed' as const, bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 500, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, whiteSpace: 'nowrap' as const },

  backdrop:    { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:       { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' },
  modalTitle:  { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' },
  modalBody:   { padding: '18px 20px', overflowY: 'auto' as const, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  modalFooter: { display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' },

  label:       { fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, marginTop: 8, letterSpacing: '0.2px' },
  input:       { width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' as const },
  textarea:    { resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.55 },

  timingChip:      { fontSize: 12, padding: '5px 11px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' },
  timingChipActive:{ background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.35)', color: '#FFD56B' },

  saveBtn:     { padding: '8px 18px', borderRadius: 9, background: '#FFD56B', border: 'none', fontSize: 13, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer' },
  deleteBtn:   { padding: '8px 14px', borderRadius: 9, background: 'rgba(249,117,131,0.12)', border: '1px solid rgba(249,117,131,0.3)', fontSize: 13, color: '#F97583', cursor: 'pointer', marginRight: 'auto' },
}
