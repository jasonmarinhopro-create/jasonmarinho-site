'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, FileText, MagnifyingGlass } from '@phosphor-icons/react'
import type { Template } from '@/types'

const categoryLabels: Record<string, string> = {
  airbnb: 'Airbnb',
  checkin: 'Check-in',
  checkout: 'Check-out',
  avis: 'Demande d\'avis',
  bienvenue: 'Bienvenue',
  autre: 'Autre',
}

// Server-side data is passed as props for simplicity
// In production, use React Server Components + client interaction
import { useEffect } from 'react'
import Header from '@/components/layout/Header'

export default function GabaritsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('templates').select('*').order('created_at').then(({ data }) => {
      if (data) setTemplates(data as Template[])
    })
  }, [])

  const categories = ['all', ...new Set(templates.map(t => t.category))]

  const filtered = templates.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  async function copyTemplate(t: Template) {
    await navigator.clipboard.writeText(t.content)
    setCopied(t.id)
    setToast(true)
    setTimeout(() => { setCopied(null); setToast(false) }, 2000)

    // Increment copy count
    const supabase = createClient()
    try { await supabase.rpc('increment_copy_count', { template_id: t.id }) } catch {}
  }

  return (
    <>
      <Header title="Gabarits" />

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>
          <Check size={16} color="#34D399" weight="bold" />
          Copié dans le presse-papier
        </div>
      )}

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Gabarits <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>prêts à l'emploi</em></h2>
          <p style={styles.pageDesc}>Messages prêts à copier pour chaque étape du séjour. Personnalise les crochets [ ] selon ton logement.</p>
        </div>

        {/* Search + filters */}
        <div style={styles.controls} className="fade-up d1">
          <div style={styles.searchWrap}>
            <MagnifyingGlass size={16} color="var(--text-3)" />
            <input
              type="text"
              placeholder="Chercher un gabarit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.catFilters}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.catBtn,
                  ...(activeCategory === cat ? styles.catBtnActive : {}),
                }}
              >
                {cat === 'all' ? 'Tous' : categoryLabels[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={styles.grid} className="dash-grid-3">
          {filtered.map((t, i) => (
            <div key={t.id} style={styles.card} className={`glass-card fade-up d${(i % 3) + 1}`}>
              <div style={styles.cardHead}>
                <div style={styles.cardIcon}>
                  <FileText size={18} color="#FFD56B" weight="fill" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardTitle}>{t.title}</div>
                  <span className="badge badge-blue" style={{ marginTop: '4px' }}>
                    {categoryLabels[t.category] ?? t.category}
                  </span>
                </div>
                <button
                  onClick={() => copyTemplate(t)}
                  style={{ ...styles.copyBtn, ...(copied === t.id ? styles.copyBtnDone : {}) }}
                  title="Copier"
                >
                  {copied === t.id
                    ? <Check size={16} color="#34D399" weight="bold" />
                    : <Copy size={16} />}
                </button>
              </div>
              <pre style={styles.content}>{t.content}</pre>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={styles.empty}>
            <FileText size={36} color="var(--text-muted)" weight="fill" />
            <p style={{ color: 'var(--text-3)', marginTop: '12px' }}>Aucun gabarit dans cette catégorie.</p>
          </div>
        )}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '28px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },
  controls: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px', maxWidth: '440px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px',
    color: 'var(--text)', width: '100%',
  },
  catFilters: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  catBtn: {
    fontSize: '12px', fontWeight: 500, padding: '6px 14px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.18s',
  },
  catBtnActive: {
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B',
  },
  grid: {}, /* className dash-grid-3 */
  card: { padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  cardIcon: {
    width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 },
  copyBtn: {
    width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--border)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.18s',
  },
  copyBtnDone: { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' },
  content: {
    fontFamily: 'Outfit, sans-serif', fontSize: '12.5px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.7,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px',
    maxHeight: '180px', overflowY: 'auto',
  },
  empty: { textAlign: 'center', padding: '48px 0' },
  toast: {
    position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,30,20,0.96)', border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '10px', padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    zIndex: 1000, backdropFilter: 'blur(12px)',
    animation: 'fadeUp 0.3s ease',
  },
}
