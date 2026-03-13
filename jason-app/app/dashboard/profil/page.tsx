'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { Check, User, EnvelopeSimple, PencilSimple } from '@phosphor-icons/react'

export default function ProfilPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editName, setEditName] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name)
      })
    })
  }, [])

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({ id: user.id, full_name: fullName })
    setLoading(false)
    setSaved(true)
    setEditName(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  return (
    <>
      <Sidebar />
      <Header title="Mon profil" userName={fullName || undefined} />

      <div style={styles.page} className="dash-page">
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Mon <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>profil</em></h2>
          <p style={styles.pageDesc}>Gère tes informations personnelles.</p>
        </div>

        <div style={styles.content} className="fade-up d1">
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>{initials}</span>
            </div>
            <div>
              <div style={styles.avatarName}>{fullName || email}</div>
              <div style={styles.avatarSub}>{email}</div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Nom complet */}
          <div style={styles.field}>
            <label style={styles.label}>
              <User size={15} />
              Nom complet
            </label>
            {editName ? (
              <div style={styles.editRow}>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={styles.input}
                  placeholder="Prénom Nom"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '10px 18px' }}
                >
                  {saved ? <><Check size={14} weight="bold" /> Sauvegardé</> : 'Enregistrer'}
                </button>
                <button onClick={() => setEditName(false)} style={styles.cancelBtn}>
                  Annuler
                </button>
              </div>
            ) : (
              <div style={styles.valueRow}>
                <span style={styles.value}>{fullName || <span style={{ color: 'rgba(240,244,255,0.28)' }}>Non renseigné</span>}</span>
                <button onClick={() => setEditName(true)} style={styles.editBtn}>
                  <PencilSimple size={14} />
                  Modifier
                </button>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>
              <EnvelopeSimple size={15} />
              Adresse e-mail
            </label>
            <div style={styles.valueRow}>
              <span style={styles.value}>{email}</span>
              <span style={styles.readOnly}>Non modifiable</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '32px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)' },
  content: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,40px)',
    maxWidth: '600px',
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' },
  avatar: {
    width: '64px', height: '64px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)', border: '2px solid rgba(255,213,107,0.25)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 600, color: '#FFD56B' },
  avatarName: { fontSize: '17px', fontWeight: 600, color: '#f0f4ff', marginBottom: '3px' },
  avatarSub: { fontSize: '13px', color: 'rgba(240,244,255,0.38)' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 24px' },
  field: { marginBottom: '24px' },
  label: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'rgba(240,244,255,0.45)', marginBottom: '10px',
  },
  valueRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  value: { fontSize: '15px', color: '#f0f4ff', fontWeight: 400 },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'rgba(240,244,255,0.45)',
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
    transition: 'all 0.18s',
  },
  editRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  input: {
    flex: 1, minWidth: '180px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,213,107,0.3)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#f0f4ff',
    outline: 'none',
  },
  cancelBtn: {
    fontSize: '13px', fontWeight: 400, color: 'rgba(240,244,255,0.38)',
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
  },
  readOnly: {
    fontSize: '11px', fontWeight: 500, color: 'rgba(240,244,255,0.25)',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '6px', padding: '4px 10px',
  },
}
