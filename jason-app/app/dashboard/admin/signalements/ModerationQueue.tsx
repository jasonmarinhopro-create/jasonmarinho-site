'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, X, Warning, Eye, Megaphone, Trash, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import { approvePublicSignalement, rejectPublicSignalement, removePublicSignalement, forceStaticRebuild } from './moderation-actions'

type Pending = {
  id: string
  identifier: string
  identifier_type: string
  name: string | null
  incident_type: string | null
  description: string | null
  public_summary: string | null
  public_city: string | null
  public_month: string | null
  reported_at: string
  reporter_id: string
}

type RemovalRequest = {
  id: string
  public_slug: string | null
  public_summary: string | null
  removal_request_at: string
  removal_request_email: string
  removal_request_reason: string | null
}

type Approved = {
  id: string
  public_slug: string | null
  public_summary: string | null
  public_city: string | null
  public_month: string | null
  incident_type: string | null
  moderation_decided_at: string | null
}

interface Props {
  pending: Pending[]
  removalRequests: RemovalRequest[]
  approved: Approved[]
  approvedCount: number
}

function fmtAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600_000)
  if (h < 1) return 'il y a quelques minutes'
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

export default function ModerationQueue({ pending, removalRequests, approved, approvedCount }: Props) {
  const router = useRouter()
  const [isProcessing, startProcessing] = useTransition()
  const [editingSummary, setEditingSummary] = useState<Record<string, string>>({})
  const [editingCity, setEditingCity] = useState<Record<string, string>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [removalToConfirm, setRemovalToConfirm] = useState<string | null>(null)

  function getSummary(p: Pending) {
    return editingSummary[p.id] ?? p.public_summary ?? ''
  }
  function getCity(p: Pending) {
    return editingCity[p.id] ?? p.public_city ?? ''
  }

  // Reload garanti : router.refresh() peut être pris au piège du cache
  // server-component selon les configs. window.location.reload() est le
  // hammer qui marche dans 100% des cas après mutation server.
  function hardRefresh() {
    if (typeof window !== 'undefined') window.location.reload()
    else router.refresh()
  }

  async function handleApprove(p: Pending) {
    setErrorMsg(null)
    startProcessing(async () => {
      const res = await approvePublicSignalement(p.id, {
        public_summary: getSummary(p),
        public_city: getCity(p),
      })
      if (res.error) setErrorMsg(res.error)
      else hardRefresh()
    })
  }

  async function handleReject(p: Pending) {
    setErrorMsg(null)
    const reason = window.prompt('Motif du refus (optionnel) :') ?? undefined
    startProcessing(async () => {
      const res = await rejectPublicSignalement(p.id, reason)
      if (res.error) setErrorMsg(res.error)
      else hardRefresh()
    })
  }

  async function handleRemove(reportId: string) {
    setErrorMsg(null)
    const reason = window.prompt('Motif du retrait (sera loggé) :') ?? undefined
    startProcessing(async () => {
      const res = await removePublicSignalement(reportId, reason)
      if (res.error) setErrorMsg(res.error)
      else { setRemovalToConfirm(null); hardRefresh() }
    })
  }

  const [rebuildMsg, setRebuildMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  async function handleRebuild() {
    setRebuildMsg(null)
    startProcessing(async () => {
      const res = await forceStaticRebuild()
      if (res.error) setRebuildMsg({ kind: 'err', text: res.error })
      else setRebuildMsg({ kind: 'ok', text: '✓ Rebuild déclenché. Compte 1-2 minutes pour voir le résultat sur jasonmarinho.com/securite/signalements.' })
    })
  }

  return (
    <section style={s.wrap}>
      <header style={s.head}>
        <div>
          <h2 style={s.title}>
            <Megaphone size={20} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-text)' }} />
            Modération signalements <em style={s.titleEm}>publics</em>
          </h2>
          <p style={s.sub}>
            Signalements pour lesquels l'hôte a opt-in à une publication anonymisée. Décision attendue sous 24h, retrait des PII strict.
          </p>
        </div>
        <div style={s.stats}>
          <div style={s.stat}><span style={s.statN}>{pending.length}</span><span style={s.statL}>en attente</span></div>
          <div style={s.stat}><span style={{ ...s.statN, color: removalRequests.length > 0 ? 'var(--danger)' : 'var(--text-2)' }}>{removalRequests.length}</span><span style={s.statL}>retraits demandés</span></div>
          <div style={s.stat}><span style={{ ...s.statN, color: 'var(--success-1)' }}>{approvedCount}</span><span style={s.statL}>en ligne</span></div>
        </div>
      </header>

      {errorMsg && (
        <div style={s.errorBanner}><Warning size={14} weight="fill" /> {errorMsg}</div>
      )}

      {/* Bouton rebuild manuel — utile quand un signalement vient d'être
          approuvé/retiré et qu'on veut forcer la régénération immédiate
          du site statique sans attendre le webhook auto. */}
      <div style={s.rebuildBox}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Site public</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
            Après chaque approbation, le site jasonmarinho.com se rebuild auto si <code>VERCEL_DEPLOY_HOOK_URL</code> est posé. Sinon, force ici.
          </div>
        </div>
        <button onClick={handleRebuild} disabled={isProcessing} style={s.btnSecondary}>
          <ArrowsClockwise size={13} weight="bold" /> Forcer le rebuild
        </button>
      </div>
      {rebuildMsg && (
        <div style={{ ...s.errorBanner, background: rebuildMsg.kind === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderColor: rebuildMsg.kind === 'ok' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', color: rebuildMsg.kind === 'ok' ? 'var(--success-1)' : 'var(--danger)' }}>
          {rebuildMsg.text}
        </div>
      )}

      {/* ── DEMANDES DE RETRAIT (priorité maximale, SLA 48h) ─────────── */}
      {removalRequests.length > 0 && (
        <div style={s.urgentSection}>
          <h3 style={s.sectionTitle}>
            <Warning size={16} weight="fill" color="var(--danger)" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Demandes de retrait à traiter
          </h3>
          {removalRequests.map(r => (
            <div key={r.id} style={s.removalCard}>
              <div style={s.removalHead}>
                <div>
                  <div style={s.removalSlug}>{r.public_slug}</div>
                  <div style={s.removalMeta}>Demandé {fmtAge(r.removal_request_at)} · {r.removal_request_email}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {r.public_slug && (
                    <a href={`https://jasonmarinho.com/securite/signalements/${r.public_slug}`} target="_blank" rel="noopener" style={s.btnLink}>
                      <Eye size={12} /> Voir la page
                    </a>
                  )}
                  <button onClick={() => handleRemove(r.id)} disabled={isProcessing} style={s.btnDanger}>
                    <Trash size={12} weight="bold" /> Retirer
                  </button>
                </div>
              </div>
              {r.public_summary && <p style={s.removalSummary}>{r.public_summary}</p>}
              {r.removal_request_reason && (
                <div style={s.removalReason}>
                  <strong>Motif invoqué :</strong> {r.removal_request_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── QUEUE PENDING ─────────────────────────────────────────────── */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={s.sectionTitle}>
          File de modération · {pending.length} en attente
        </h3>
        {pending.length === 0 ? (
          <div style={s.empty}>
            <CheckCircle size={28} weight="duotone" color="var(--success-1)" />
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Aucun signalement en attente. Tu peux respirer.
            </p>
          </div>
        ) : (
          pending.map(p => (
            <div key={p.id} style={s.pendingCard}>
              <div style={s.pendingHead}>
                <span style={{ ...s.badge, background: 'rgba(251,191,36,0.15)', color: '#d97706' }}>
                  {p.incident_type ?? 'Incident'}
                </span>
                <span style={s.pendingDate}>Signalé {fmtAge(p.reported_at)}</span>
              </div>

              {/* Données privées (référence modérateur) */}
              <div style={s.privateBlock}>
                <div style={s.privateLabel}>DONNÉES PRIVÉES (jamais publiées)</div>
                <div style={s.privateRow}><strong>{p.identifier_type} :</strong> {p.identifier}</div>
                {p.name && <div style={s.privateRow}><strong>Nom :</strong> {p.name}</div>}
                <div style={s.privateDesc}>{p.description}</div>
              </div>

              {/* Édition publique */}
              <div style={s.publicBlock}>
                <div style={s.publicLabel}>VERSION PUBLIQUE (édite si nécessaire avant approbation)</div>
                <label style={s.fieldLabel}>Ville publique</label>
                <input
                  type="text"
                  value={getCity(p)}
                  onChange={e => setEditingCity(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={s.fieldInput}
                  placeholder="Lyon"
                  maxLength={80}
                />
                <label style={s.fieldLabel}>Résumé public anonymisé ({getSummary(p).length}/600)</label>
                <textarea
                  value={getSummary(p)}
                  onChange={e => setEditingSummary(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={s.fieldTextarea}
                  rows={4}
                  maxLength={600}
                  placeholder="Vérifie que rien n'identifie la personne (pas de nom complet, email, téléphone, adresse précise, plaque…)."
                />
                <div style={s.publishedPreview}>
                  Mois publié : <strong>{p.public_month ?? '(courant)'}</strong>
                </div>
              </div>

              {/* Hint visible si le résumé est encore trop court (ville
                  désormais optionnelle, pas bloquante). */}
              {getSummary(p).length < 30 && (
                <div style={s.disabledHint}>
                  <Warning size={12} weight="fill" />
                  Le résumé doit faire au moins 30 caractères (actuellement {getSummary(p).length}).
                </div>
              )}
              <div style={s.actionsRow}>
                <button onClick={() => handleReject(p)} disabled={isProcessing} style={s.btnSecondary}>
                  <X size={13} weight="bold" /> Refuser
                </button>
                <button onClick={() => handleApprove(p)} disabled={isProcessing || getSummary(p).length < 30} style={s.btnPrimary}>
                  <CheckCircle size={13} weight="fill" /> Approuver et publier
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── SIGNALEMENTS PUBLIÉS (gestion + retrait à la demande) ─────
          Avant : pas de bouton pour retirer un signalement déjà publié
          sans demande de retrait → impossible de supprimer un test.
          Maintenant : liste collapsible avec bouton "Retirer" par row. */}
      {approved.length > 0 && (
        <details style={{ marginTop: '20px' }}>
          <summary style={s.sectionTitleClick}>
            Signalements actuellement en ligne · {approved.length}
          </summary>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approved.map(a => (
              <div key={a.id} style={s.approvedCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.approvedTitle}>{a.incident_type ?? 'Signalement'}</div>
                  <div style={s.approvedMeta}>
                    {a.public_city && <span>{a.public_city}</span>}
                    {a.public_month && <span>· {a.public_month}</span>}
                    {a.moderation_decided_at && <span>· publié {fmtAge(a.moderation_decided_at)}</span>}
                  </div>
                  {a.public_summary && (
                    <div style={s.approvedSummary}>{a.public_summary.slice(0, 140)}{a.public_summary.length > 140 ? '…' : ''}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {a.public_slug && (
                    <a href={`https://jasonmarinho.com/securite/signalements/${a.public_slug}`} target="_blank" rel="noopener" style={s.btnLink}>
                      <Eye size={12} /> Voir
                    </a>
                  )}
                  <button onClick={() => handleRemove(a.id)} disabled={isProcessing} style={s.btnDanger}>
                    <Trash size={12} weight="bold" /> Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '20px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', marginBottom: '24px' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '16px', marginBottom: '14px' },
  title: { fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', margin: 0 },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: '560px', lineHeight: 1.6 },
  stats: { display: 'flex', gap: '20px' },
  stat: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  statN: { fontSize: '22px', fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, color: 'var(--text)', lineHeight: 1 },
  statL: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '4px' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' },
  urgentSection: { padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '20px' },
  sectionTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  removalCard: { padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '10px' },
  removalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' as const },
  removalSlug: { fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text)' },
  removalMeta: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  removalSummary: { fontSize: '13px', color: 'var(--text-2)', margin: '8px 0', padding: '8px 10px', background: 'var(--surface)', borderRadius: '6px', borderLeft: '3px solid var(--text-muted)' },
  removalReason: { fontSize: '12.5px', color: 'var(--text-2)', marginTop: '6px', lineHeight: 1.6 },
  pendingCard: { padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '12px' },
  pendingHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  pendingDate: { fontSize: '11px', color: 'var(--text-muted)' },
  badge: { fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '12px' },
  privateBlock: { padding: '10px 12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '8px', marginBottom: '12px' },
  privateLabel: { fontSize: '10px', fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.5px', marginBottom: '6px' },
  privateRow: { fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '3px' },
  privateDesc: { fontSize: '12.5px', color: 'var(--text-2)', marginTop: '6px', lineHeight: 1.55, fontStyle: 'italic' },
  publicBlock: { padding: '10px 12px', background: 'rgba(255,213,107,0.06)', border: '1px solid rgba(255,213,107,0.18)', borderRadius: '8px', marginBottom: '12px' },
  publicLabel: { fontSize: '10px', fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '0.5px', marginBottom: '8px' },
  fieldLabel: { display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '8px', marginBottom: '4px' },
  fieldInput: { width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit' },
  fieldTextarea: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' as const, minHeight: '80px' },
  publishedPreview: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' },
  actionsRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  disabledHint: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 11px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '7px', fontSize: '12px', color: '#d97706', marginBottom: '10px', lineHeight: 1.5 },
  rebuildBox: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '14px', flexWrap: 'wrap' as const },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 11px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  empty: { padding: '24px', textAlign: 'center' as const, background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' },
  sectionTitleClick: { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', cursor: 'pointer', padding: '8px 0', userSelect: 'none' as const, listStyle: 'none' as const },
  approvedCard: { display: 'flex', gap: '12px', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'flex-start' },
  approvedTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' },
  approvedMeta: { fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginBottom: '6px' },
  approvedSummary: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, display: '-webkit-box', WebkitLineClamp: 2 as unknown as number, WebkitBoxOrient: 'vertical' as const },
}
