'use client'

import { useState } from 'react'
import { Copy, Check, Camera, Sparkle, EnvelopeSimple, Phone } from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import RelativeTime from '@/components/ui/RelativeTime'

export interface DemandeAdmin {
  id: string; created_at: string; metier: 'photographe' | 'menage'; ville: string
  status: 'envoyee' | 'elargie' | 'sans_pro' | 'close'
  nom: string; email: string; telephone: string | null; message: string | null
  details: string; besoin: string; pros: Array<{ name: string; round: number }>
}

const STATUS: Record<DemandeAdmin['status'], { label: string; color: string }> = {
  envoyee: { label: 'Envoyée', color: 'var(--accent-text)' },
  elargie: { label: 'Envoyée à d’autres pros', color: '#B7791F' },
  sans_pro: { label: 'Sans pro dans la zone', color: '#C2410C' },
  close: { label: 'Close', color: 'var(--text-3)' },
}

export default function DemandesView({ demandes, missing }: { demandes: DemandeAdmin[]; missing: boolean }) {
  const [filtre, setFiltre] = useState<'toutes' | 'sans_pro' | 'photographe' | 'menage'>('toutes')
  const [copied, setCopied] = useState<string | null>(null)
  const list = demandes.filter(d => filtre === 'toutes' || (filtre === 'sans_pro' ? d.status === 'sans_pro' : d.metier === filtre))
  const mois = demandes.filter(d => Date.now() - new Date(d.created_at).getTime() < 30 * 86_400_000)
  const sansPro = demandes.filter(d => d.status === 'sans_pro')

  async function copy(d: DemandeAdmin) {
    try { await navigator.clipboard.writeText(d.besoin); setCopied(d.id); setTimeout(() => setCopied(null), 1800) } catch { /* rien */ }
  }

  return (
    <>
      <AdminHero
        section="Demandes d’hôtes"
        title="Les besoins des hôtes,"
        em="envoyés aux pros"
        desc="Chaque demande décrite sur jasonmarinho.com/trouver-un-pro part aux 3 pros les plus proches ; sans réponse sous 48 h, à 3 autres ; sans pro dans la zone, aux pros qui s’inscrivent dans les 30 jours. Le besoin anonymisé (sans nom ni contact) peut être copié pour ta prospection."
        aside={
          <div style={adminAsideCard}>
            <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18 }}>30 derniers jours</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Stat v={mois.length} l="demandes" />
              <Stat v={sansPro.length} l="sans pro (à recruter)" />
            </div>
          </div>
        }
      />
      {missing && <p style={note}>La table des demandes n’existe pas encore (migration 132) : elle sera créée au prochain passage du workflow Migrations.</p>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '18px 0 14px' }}>
        {([['toutes', 'Toutes'], ['sans_pro', `Sans pro (${sansPro.length})`], ['photographe', 'Photographes'], ['menage', 'Ménage']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFiltre(k)} style={{ ...pill, ...(filtre === k ? pillOn : {}) }}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <p style={note}>Aucune demande pour le moment. Le formulaire est sur jasonmarinho.com/trouver-un-pro, et proposé sur les annuaires et les pages de ville.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: 14 }}>
          {list.map(d => (
            <article key={d.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={ico}>{d.metier === 'photographe' ? <Camera size={16} weight="duotone" /> : <Sparkle size={16} weight="duotone" />}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 17 }}>{d.metier === 'photographe' ? 'Photographe' : 'Ménage'} à {d.ville}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}><RelativeTime iso={d.created_at} /></div>
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS[d.status].color, border: '1px solid currentColor', borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' }}>{STATUS[d.status].label}</span>
              </div>
              {d.details && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{d.details}</div>}
              {d.message && <div style={{ fontSize: 13, color: 'var(--text-2)', background: 'var(--bg)', borderRadius: 10, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{d.message}</div>}
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                <span>{d.nom}</span>
                <a href={`mailto:${d.email}`} style={lnk}><EnvelopeSimple size={12} /> {d.email}</a>
                {d.telephone && <a href={`tel:${d.telephone.replace(/\s/g, '')}`} style={lnk}><Phone size={12} /> {d.telephone}</a>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                {d.pros.length ? <>Envoyée à : {d.pros.map(p => `${p.name}${p.round > 1 ? ` (vague ${p.round})` : ''}`).join(', ')}</> : 'Aucun pro de l’annuaire dans la zone pour l’instant.'}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1, minWidth: 0 }}>{d.besoin}</span>
                <button type="button" onClick={() => copy(d)} style={copyBtn} title="Copier le besoin, sans nom ni contact">
                  {copied === d.id ? <><Check size={13} weight="bold" /> Copié</> : <><Copy size={13} /> Copier le besoin</>}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function Stat({ v, l }: { v: number; l: string }) {
  return <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22 }}>{v}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l}</div></div>
}

const note: React.CSSProperties = { fontSize: 13.5, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }
const pill: React.CSSProperties = { padding: '7px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const pillOn: React.CSSProperties = { background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)' }
const card: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, minWidth: 0 }
const ico: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const lnk: React.CSSProperties = { color: 'var(--accent-text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }
const copyBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
