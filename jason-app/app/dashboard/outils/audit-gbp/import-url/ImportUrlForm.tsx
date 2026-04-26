'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, CheckCircle, XCircle, ArrowRight, Star, Warning } from '@phosphor-icons/react'
import { previewMapsUrl, startAuditFromMapsUrl } from '../place-actions'
import type { PlacesImportResult } from '@/lib/audit-gbp/places-mapper'

interface Props {
  userId: string | null
}

export default function ImportUrlForm({ userId }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<PlacesImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!userId) {
    return <div style={s.gate}>Connecte-toi pour utiliser cette fonctionnalité.</div>
  }

  function onPreview() {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await previewMapsUrl(url)
      if (res.error || !res.ok) {
        setError(res.error ?? 'Erreur')
        return
      }
      setResult(res.ok)
    })
  }

  function onLaunch() {
    if (!result) return
    setError(null)
    startTransition(async () => {
      const res = await startAuditFromMapsUrl(result)
      if (res.error || !res.ok) {
        setError(res.error ?? 'Erreur')
        return
      }
      router.push(`/dashboard/outils/audit-gbp?session=${res.ok.sessionId}`)
    })
  }

  return (
    <div>
      {/* Input URL */}
      {!result && (
        <div style={s.formBlock}>
          <label style={s.label}>
            <span style={s.labelText}>URL Google Maps de ta fiche</span>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://share.google/... ou https://maps.google.com/..."
              style={s.input}
              disabled={isPending}
              onKeyDown={e => {
                if (e.key === 'Enter' && url.trim() && !isPending) {
                  e.preventDefault()
                  onPreview()
                }
              }}
            />
          </label>

          {error && (
            <div style={s.error}>
              <Warning size={14} weight="fill" /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={onPreview}
            disabled={!url.trim() || isPending}
            style={{
              ...s.btnPrimary,
              ...((!url.trim() || isPending) ? s.btnDisabled : {}),
            }}
          >
            <MapPin size={15} weight="fill" />
            {isPending ? 'Recherche en cours…' : 'Aperçu de la fiche'}
          </button>
        </div>
      )}

      {/* Aperçu */}
      {result && (
        <div style={s.preview}>
          <div style={s.previewHead}>
            <div style={s.previewIcon}>
              <CheckCircle size={20} color="#34d399" weight="fill" />
            </div>
            <div>
              <div style={s.previewTitle}>Fiche trouvée</div>
              <div style={s.previewSub}>
                {result.matchedFields.length} information{result.matchedFields.length > 1 ? 's' : ''} récupérée{result.matchedFields.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Méta de la fiche */}
          {result.meta.businessName && (
            <div style={s.metaCard}>
              <div style={s.metaName}>{result.meta.businessName}</div>
              {result.meta.city && <div style={s.metaCity}>{result.meta.city}</div>}
              {(result.meta.rating || result.meta.reviewCount) && (
                <div style={s.metaRating}>
                  {result.meta.rating && (
                    <span style={s.metaRatingNum}>
                      <Star size={13} color="#FFD56B" weight="fill" />
                      {result.meta.rating.toFixed(1)}/5
                    </span>
                  )}
                  {result.meta.reviewCount !== undefined && (
                    <span style={s.metaReviews}>{result.meta.reviewCount} avis</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Résumé numérique */}
          <div style={s.summary}>
            <div style={s.summaryBlock}>
              <div style={s.summaryNum}>{result.matchedFields.length}</div>
              <div style={s.summaryLabel}>champ{result.matchedFields.length > 1 ? 's' : ''} pré-rempli{result.matchedFields.length > 1 ? 's' : ''}</div>
            </div>
            <div style={s.summaryBlock}>
              <div style={{ ...s.summaryNum, color: 'var(--text-muted)' }}>
                {25 - result.prefilledQuestionIds.length}
              </div>
              <div style={s.summaryLabel}>question{(25 - result.prefilledQuestionIds.length) > 1 ? 's' : ''} restante{(25 - result.prefilledQuestionIds.length) > 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Liste détaillée */}
          <div style={s.detailList}>
            <div style={s.detailTitle}>Informations détectées :</div>
            {result.matchedFields.map((f, i) => (
              <div key={`m-${i}`} style={s.detailItem}>
                <CheckCircle size={13} color="#34d399" weight="fill" />
                <span>{f}</span>
              </div>
            ))}
            {result.unmatchedFields.map((f, i) => (
              <div key={`u-${i}`} style={{ ...s.detailItem, color: 'var(--text-muted)' }}>
                <XCircle size={13} color="var(--text-muted)" weight="fill" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={s.error}>
              <Warning size={14} weight="fill" /> {error}
            </div>
          )}

          {/* Actions */}
          <div style={s.actions}>
            <button
              type="button"
              onClick={() => { setResult(null); setError(null); setUrl('') }}
              disabled={isPending}
              style={s.btnGhost}
            >
              Essayer une autre URL
            </button>
            <button
              type="button"
              onClick={onLaunch}
              disabled={isPending}
              style={s.btnPrimary}
            >
              {isPending ? 'Préparation…' : "Lancer l'audit avec ces données"}
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  gate: { padding: '40px', textAlign: 'center' as const, color: 'var(--text-2)' },

  formBlock: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  label: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  labelText: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-3)',
  },
  input: {
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '8px', padding: '11px 14px',
    fontSize: '14px', color: 'var(--text)',
    fontFamily: 'inherit', marginBottom: '14px',
  },

  error: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '11px 14px',
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444', fontSize: '13px',
    borderRadius: '10px', marginTop: '10px', marginBottom: '14px',
  },

  preview: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  previewHead: {
    display: 'flex', alignItems: 'center', gap: '14px',
    paddingBottom: '18px', borderBottom: '1px solid var(--border)',
    marginBottom: '18px',
  },
  previewIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(52,211,153,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  previewSub: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' },

  metaCard: {
    padding: '14px 16px', marginBottom: '16px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)', borderRadius: '12px',
  },
  metaName: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
  },
  metaCity: { fontSize: '12.5px', color: 'var(--text-2)', marginTop: '2px' },
  metaRating: { display: 'flex', gap: '12px', marginTop: '8px' },
  metaRatingNum: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12.5px', fontWeight: 600, color: 'var(--text)',
  },
  metaReviews: { fontSize: '12.5px', color: 'var(--text-2)' },

  summary: {
    display: 'flex', gap: '12px',
    margin: '18px 0', padding: '14px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    borderRadius: '10px',
  },
  summaryBlock: { flex: 1, textAlign: 'center' as const },
  summaryNum: {
    fontSize: '24px', fontWeight: 700,
    color: '#34d399', fontFamily: 'var(--font-fraunces), serif',
  },
  summaryLabel: { fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' },

  detailList: { margin: '14px 0' },
  detailTitle: {
    fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: 'var(--text-3)', marginBottom: '10px',
  },
  detailItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: 'var(--text-2)',
    padding: '4px 0',
  },

  actions: {
    display: 'flex', gap: '10px', marginTop: '20px',
    paddingTop: '18px', borderTop: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  btnGhost: {
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '9px',
    padding: '10px 16px', fontSize: '13px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPrimary: {
    flex: 1, minWidth: '200px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    background: '#34d399', color: '#0a1628',
    border: 'none', borderRadius: '9px',
    padding: '11px 18px', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
}
