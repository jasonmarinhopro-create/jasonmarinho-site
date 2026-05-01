'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  facebook:     'Posts & annonces',
  autre:        'Autre',
}

const FACEBOOK_CONFIG = { label: 'Posts & annonces', color: '#818CF8', icon: UsersThree }

const SECTION_CONFIG: Record<TimingBucket, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  'avant-arrivee':  { label: "Avant l'arrivée",   color: 'var(--accent-text)', bg: 'var(--accent-bg)',            border: 'var(--accent-border)',          icon: CalendarCheck },
  'pendant-sejour': { label: 'Pendant le séjour',  color: '#60BEFF', bg: 'rgba(96,190,255,0.14)', border: 'rgba(96,190,255,0.28)',  icon: House },
  'apres-depart':   { label: 'Après le départ',    color: '#F97583', bg: 'rgba(249,117,131,0.14)',border: 'rgba(249,117,131,0.28)', icon: SunHorizon },
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

  // ── Auto-filtre depuis ?cat= (lien depuis le calendrier) ─────────────
  const searchParams = useSearchParams()
  useEffect(() => {
    const cat = searchParams?.get('cat')
    if (!cat) return
    const bucket = CATEGORY_TO_TIMING[cat]
    if (bucket) setActiveFilter(bucket)
    else if (cat === 'facebook') setActiveFilter('facebook')
  }, [searchParams])

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [modalTitle, setModalTitle]           = useState('')
  const [modalContent, setModalContent]       = useState('')
  const [modalNotes, setModalNotes]           = useState('')
  const [modalTiming, setModalTiming]         = useState<string>('')
  const [savingModal, setSavingModal]         = useState(false)
  const [deletingCustom, setDeletingCustom]   = useState(false)

  // ── Remplissage variables ─────────────────────────────────────────────────
  const [fillTemplate, setFillTemplate]       = useState<{ t: Template; lang: 'fr' | 'en' } | null>(null)
  const [fillValues, setFillValues]           = useState<Record<string, string>>({})

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
    const raw = lang === 'en'
      ? (t.corps_en ?? t.content)
      : (customizations[t.id]?.content ?? t.content)
    const vars = extractVariables(raw)
    if (vars.length > 0) {
      setFillTemplate({ t, lang })
      setFillValues(Object.fromEntries(vars.map(v => [v, ''])))
      return
    }
    await doCopy(t.id, raw, lang)
  }

  async function doCopy(id: string, content: string, lang: 'fr' | 'en') {
    await navigator.clipboard.writeText(content)
    setCopied(id + lang)
    setTimeout(() => setCopied(null), 2000)
    showToast('Copié dans le presse-papier !')
    const supabase = createClient()
    try { await supabase.rpc('increment_copy_count', { template_id: id }) } catch {}
  }

  async function copyWithFill() {
    if (!fillTemplate) return
    const { t, lang } = fillTemplate
    const raw = lang === 'en'
      ? (t.corps_en ?? t.content)
      : (customizations[t.id]?.content ?? t.content)
    let filled = raw
    for (const [variable, value] of Object.entries(fillValues)) {
      filled = filled.split(variable).join(value || variable)
    }
    await doCopy(t.id, filled, lang)
    setFillTemplate(null)
    setFillValues({})
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
            { key: 'favorites',      label: '♡ Mes favoris',     count: favorites.size },
            { key: 'facebook',       label: 'Posts & annonces',   color: '#818CF8', count: allFacebookTemplates.length || undefined },
            { key: 'avant-arrivee',  label: "Avant l'arrivée",   bg: 'var(--accent-bg)', borderColor: 'var(--accent-border)', count: templates.filter(t => getTimingBucket(t) === 'avant-arrivee').length  || undefined },
            { key: 'pendant-sejour', label: 'Pendant le séjour',  color: '#60BEFF', count: templates.filter(t => getTimingBucket(t) === 'pendant-sejour').length || undefined },
            { key: 'apres-depart',   label: 'Après le départ',    color: '#F97583', count: templates.filter(t => getTimingBucket(t) === 'apres-depart').length   || undefined },
          ] as { key: FilterKey; label: string; count?: number; color?: string; bg?: string; borderColor?: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setSearch('') }}
              style={{
                ...s.navBtn,
                ...(activeFilter === f.key ? {
                  background: f.bg ?? (f.color ? `${f.color}14` : 'var(--accent-bg)'),
                  border: `1px solid ${f.borderColor ?? (f.color ? `${f.color}35` : 'var(--accent-border)')}`,
                  color: f.color ?? 'var(--accent-text)',
                } : {}),
              }}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span style={{
                  ...s.navCount,
                  background: f.bg ?? (f.color ? `${f.color}20` : 'var(--accent-bg-2)'),
                  color: f.color ?? 'var(--accent-text)',
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
                      <SectionHeader Icon={Icon} label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} count={items.length} />
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

      {/* Modal remplissage variables */}
      {fillTemplate && (
        <div style={s.overlay} onClick={() => setFillTemplate(null)}>
          <div style={{ ...s.modal, maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>Remplir les variables</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Personnalise ce message avant de le copier
                </p>
              </div>
              <button onClick={() => setFillTemplate(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ ...s.modalBody, gap: '14px' }}>
              {Object.keys(fillValues).map(variable => (
                <div key={variable} style={s.fieldGroup}>
                  <label style={s.label}>{variable}</label>
                  <input
                    value={fillValues[variable]}
                    onChange={e => setFillValues(prev => ({ ...prev, [variable]: e.target.value }))}
                    placeholder={`Remplace ${variable}`}
                    style={s.input}
                    autoFocus={Object.keys(fillValues)[0] === variable}
                  />
                </div>
              ))}
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setFillTemplate(null)} style={s.ghostBtn}>Annuler</button>
              <button onClick={copyWithFill} className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
                <Copy size={14} /> Copier le message
              </button>
            </div>
          </div>
        </div>
      )}

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

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ Icon, label, color, bg, border, count }: {
  Icon: React.ElementType; label: string; color: string; bg?: string; border?: string; count: number
}) {
  const iconBg  = bg     ?? `${color}18`
  const iconBdr = border ?? `${color}30`
  const cntBg   = bg     ?? `${color}14`
  const cntBdr  = border ?? `${color}25`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
        background: iconBg, border: `1px solid ${iconBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} weight="fill" />
      </div>
      <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)' }}>
        {label}
      </span>
      <span style={{
        fontSize: '11px', fontWeight: 600, color, background: cntBg,
        border: `1px solid ${cntBdr}`, borderRadius: '100px', padding: '2px 10px', marginLeft: '2px',
      }}>
        {count}
      </span>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template:      Template
  isFav:         boolean
  customization: UserTemplateCustomization | undefined
  copied:        string | null
  bucket:        TimingBucket | null
  onCopy:        (t: Template, e: React.MouseEvent, lang: 'fr' | 'en') => void
  onFavorite:    (id: string, e: React.MouseEvent) => void
  onCustomize:   (t: Template) => void
}

function TemplateCard({ template: t, isFav, customization, copied, bucket, onCopy, onFavorite, onCustomize }: TemplateCardProps) {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const hasEN = !!t.corps_en
  const cfg         = bucket ? SECTION_CONFIG[bucket] : null
  const accentColor = cfg ? cfg.color : 'var(--text-muted)'
  const accentBg    = cfg ? cfg.bg    : 'rgba(255,255,255,0.05)'
  const accentBdr   = cfg ? cfg.border : 'rgba(255,255,255,0.1)'
  const copiedKey = t.id + lang
  const isCopied = copied === copiedKey

  const displayContent = lang === 'en'
    ? (t.corps_en ?? t.content)
    : (customization?.content ?? t.content)
  const displayTitle = customization?.title ?? t.title
  const categoryLabel = CATEGORY_LABELS[t.category] ?? t.category

  return (
    <div style={{ ...s.card, borderLeftColor: accentColor }}>
      {/* Header */}
      <div style={s.cardHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
          <span style={{ ...s.catChip, background: accentBg, color: accentColor, border: `1px solid ${accentBdr}` }}>
            {categoryLabel}
          </span>
          {customization && (
            <span style={s.customChip}>Personnalisé</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={e => onFavorite(t.id, e)}
            style={{ ...s.iconBtn, ...(isFav ? s.iconBtnFavActive : {}) }}
            title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={14} weight={isFav ? 'fill' : 'regular'} color={isFav ? 'var(--accent-text)' : undefined} />
          </button>
          <button
            onClick={() => onCustomize(t)}
            style={{ ...s.iconBtn, ...(customization ? s.iconBtnCustomActive : {}) }}
            title="Personnaliser"
          >
            <PencilSimple size={14} weight={customization ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>

      {/* Titre */}
      <div style={s.cardTitle}>{displayTitle}</div>

      {/* Contenu */}
      <div style={s.contentWrap}>
        <pre style={s.content}>{displayContent}</pre>
        <div style={s.contentFade} />
      </div>

      {/* Note privée */}
      {customization?.notes && lang === 'fr' && (
        <div style={s.notePreview}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            📎 {customization.notes}
          </span>
        </div>
      )}

      {/* Footer : copier */}
      <div style={s.cardFooter}>
        {hasEN && (
          <div style={s.langToggle}>
            <button
              onClick={() => setLang('fr')}
              style={{ ...s.langBtn, ...(lang === 'fr' ? s.langBtnActive : {}) }}
            >FR</button>
            <button
              onClick={() => setLang('en')}
              style={{ ...s.langBtn, ...(lang === 'en' ? s.langBtnActiveEN : {}) }}
            >EN</button>
          </div>
        )}
        <button
          onClick={e => onCopy(t, e, lang)}
          style={{
            ...s.copyBtn,
            ...(isCopied ? s.copyBtnDone : { borderColor: `${accentColor}35`, color: accentColor }),
            flex: hasEN ? undefined : 1,
          }}
        >
          {isCopied
            ? <><Check size={14} weight="bold" /> Copié !</>
            : <><Copy size={14} /> {lang === 'en' ? 'Copy in English' : 'Copier le message'}</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Modal personnalisation ────────────────────────────────────────────────────

interface CustomizeModalProps {
  template: Template; existing?: UserTemplateCustomization
  title: string; content: string; notes: string; timing: string
  saving: boolean; deleting: boolean
  onTitleChange: (v: string) => void; onContentChange: (v: string) => void
  onNotesChange: (v: string) => void; onTimingChange: (v: string) => void
  onSave: () => void; onDelete: () => void; onReset: () => void; onClose: () => void
}

function CustomizeModal({
  template, existing, title, content, notes, timing,
  saving, deleting,
  onTitleChange, onContentChange, onNotesChange, onTimingChange,
  onSave, onDelete, onReset, onClose,
}: CustomizeModalProps) {
  const variables = extractVariables(content)
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div>
            <div style={{ marginBottom: '4px' }}>
              <span className="badge badge-blue">{categoryLabel}</span>
            </div>
            <h3 style={s.modalTitle}>Personnaliser le gabarit</h3>
          </div>
          <button onClick={onClose} style={s.closeBtn}><X size={18} /></button>
        </div>

        <div style={s.modalBody}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Titre (ton nom)</label>
            <input value={title} onChange={e => onTitleChange(e.target.value)} placeholder={template.title} style={s.input} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>
              Quand envoyer ?
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', marginLeft: '6px' }}>(libre, ex: J-2 avant arrivée)</span>
            </label>
            <input value={timing} onChange={e => onTimingChange(e.target.value)} placeholder="Ex: J-2 avant arrivée…" style={s.input} />
            <div style={s.timingBtns}>
              {TIMING_SHORTCUTS.map(sc => (
                <button key={sc} onClick={() => onTimingChange(sc)}
                  style={{ ...s.timingBtn, ...(timing === sc ? s.timingBtnActive : {}) }}>{sc}</button>
              ))}
              {timing && <button onClick={() => onTimingChange('')} style={{ ...s.timingBtn, color: 'var(--text-muted)' }}>Effacer</button>}
            </div>
          </div>

          {variables.length > 0 && (
            <div style={s.fieldGroup}>
              <label style={s.label}>Variables à remplacer</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {variables.map(v => <span key={v} style={s.varChip}>{v}</span>)}
              </div>
            </div>
          )}

          <div style={s.fieldGroup}>
            <label style={s.label}>Mon message</label>
            <textarea value={content} onChange={e => onContentChange(e.target.value)} style={s.textarea} rows={10} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Notes privées <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Ex: À envoyer 48h avant via Airbnb" style={{ ...s.textarea, minHeight: '64px' }} rows={3} />
          </div>
        </div>

        <div style={s.modalFooter}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {existing && (
              <button onClick={onDelete} style={s.deleteBtnSmall} disabled={deleting}>
                {deleting ? '...' : 'Supprimer ma version'}
              </button>
            )}
            <button onClick={onReset} style={s.ghostBtn}>Réinitialiser</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={s.cancelBtn}>Annuler</button>
            <button onClick={onSave} style={s.saveBtn} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer ma version'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:      { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:     { marginBottom: '32px' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc:  { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.65 },

  nav: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' },
  navBtn: {
    fontSize: '13px', fontWeight: 500, padding: '8px 16px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap',
  },
  navCount: { fontSize: '10px', fontWeight: 700, borderRadius: '100px', padding: '1px 7px' },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '11px 16px',
    maxWidth: '480px', width: '100%', marginBottom: '32px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', color: 'var(--text)', width: '100%',
  },
  clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: '2px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' },

  card: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    padding: '22px 22px 18px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderLeft: '3px solid', borderRadius: '16px',
    transition: 'box-shadow 0.18s',
  },
  cardHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  catChip:   { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.2px' },
  customChip: {
    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
  },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 },

  iconBtn: {
    width: '28px', height: '28px', borderRadius: '7px',
    background: 'transparent', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)', transition: 'all 0.15s', flexShrink: 0,
  },
  iconBtnFavActive:    { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  iconBtnCustomActive: { background: 'rgba(96,190,255,0.08)', border: '1px solid rgba(96,190,255,0.25)', color: '#60BEFF' },

  contentWrap: { position: 'relative' },
  content: {
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '13px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: '200px', overflowY: 'auto',
    margin: 0, paddingRight: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  },
  contentFade: { display: 'none' },
  notePreview: {
    padding: '8px 12px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },

  cardFooter: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' },
  langToggle: {
    display: 'flex', borderRadius: '8px', overflow: 'hidden',
    border: '1px solid var(--border)', flexShrink: 0,
  },
  langBtn: {
    fontSize: '11px', fontWeight: 700, padding: '0 10px', height: '32px',
    background: 'var(--surface)', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif',
    letterSpacing: '0.4px', transition: 'all 0.15s',
  },
  langBtnActive:   { background: 'var(--accent-bg-2)', color: 'var(--accent-text)' },
  langBtnActiveEN: { background: 'rgba(129,140,248,0.15)', color: '#818cf8' },

  copyBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'transparent', border: '1px solid',
    fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.18s',
  },
  copyBtnDone: {
    background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: '#34D399',
  },

  seeMoreBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '14px', padding: '10px 18px',
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: '10px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },

  empty:     { textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  emptyText: { fontSize: '14px', color: 'var(--text-3)', margin: 0 },

  toast: {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,30,20,0.96)', border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '10px', padding: '10px 18px',
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    zIndex: 1000, backdropFilter: 'blur(12px)',
    animation: 'fadeUp 0.3s ease', whiteSpace: 'nowrap',
  },

  overlay: {
    position: 'fixed', inset: 0, zIndex: 900,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', width: '100%', maxWidth: '640px',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  modalTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--border)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0,
  },
  modalBody:   { padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  modalFooter: {
    padding: '16px 24px', borderTop: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '8px',
  },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: {
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '13.5px', color: 'var(--text)', outline: 'none', width: '100%',
  },
  textarea: {
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 14px',
    fontFamily: 'var(--font-outfit), sans-serif', fontSize: '12.5px', color: 'var(--text-2)',
    outline: 'none', width: '100%', resize: 'vertical', minHeight: '200px', lineHeight: 1.7,
  },

  timingBtns: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  timingBtn: {
    fontSize: '12px', fontWeight: 500, padding: '6px 13px', borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  timingBtnActive: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },

  varChip: {
    fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '6px',
    background: 'rgba(96,190,255,0.1)', border: '1px solid rgba(96,190,255,0.2)', color: '#60BEFF', fontFamily: 'monospace',
  },

  saveBtn: {
    fontSize: '13px', fontWeight: 600, padding: '9px 20px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  cancelBtn: {
    fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
  },
  ghostBtn: {
    fontSize: '12px', fontWeight: 500, padding: '7px 13px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif',
  },
  deleteBtnSmall: {
    fontSize: '12px', fontWeight: 500, padding: '7px 13px', borderRadius: '8px', cursor: 'pointer',
    background: 'rgba(249,117,131,0.08)', border: '1px solid rgba(249,117,131,0.25)',
    color: '#F97583', fontFamily: 'var(--font-outfit), sans-serif',
  },
}
