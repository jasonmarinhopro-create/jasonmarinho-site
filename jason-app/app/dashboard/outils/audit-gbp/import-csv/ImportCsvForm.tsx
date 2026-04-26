'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UploadSimple, CheckCircle, XCircle, ArrowRight, FileCsv, Warning } from '@phosphor-icons/react'
import { parseCsv, csvRowToAnswers, type ImportResult } from '@/lib/audit-gbp/csv-mapper'
import { startAuditSession, saveAuditAnswers } from '../actions'

interface Props {
  userId: string | null
}

export default function ImportCsvForm({ userId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<ImportResult | null>(null)
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [selectedRowIdx, setSelectedRowIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function processFile(file: File) {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Le fichier doit être au format CSV.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result as string
        const rows = parseCsv(text)
        if (rows.length === 0) {
          setError('Le fichier est vide ou mal formaté.')
          return
        }
        setAllRows(rows)
        setSelectedRowIdx(0)
        setParseResult(csvRowToAnswers(rows[0]))
      } catch (err) {
        setError('Erreur lors de la lecture du fichier : ' + (err as Error).message)
      }
    }
    reader.onerror = () => setError('Impossible de lire le fichier.')
    reader.readAsText(file, 'utf-8')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function onSelectRow(idx: number) {
    setSelectedRowIdx(idx)
    setParseResult(csvRowToAnswers(allRows[idx]))
  }

  function startAudit() {
    if (!userId || !parseResult) return
    setError(null)
    startTransition(async () => {
      const session = await startAuditSession({
        businessName: parseResult.meta.businessName || undefined,
        city: parseResult.meta.city || undefined,
      })
      if (session.error || !session.ok) {
        setError(session.error ?? 'Erreur création session.')
        return
      }
      // On stocke aussi la liste des keys auto-remplies pour les badges UI
      const save = await saveAuditAnswers(session.ok.sessionId, {
        ...parseResult.prefilled,
        __prefilled_keys: parseResult.prefilledQuestionIds,
      })
      if (save.error) {
        setError(save.error)
        return
      }
      router.push(`/dashboard/outils/audit-gbp?session=${session.ok.sessionId}`)
    })
  }

  if (!userId) {
    return <div style={s.gate}>Connecte-toi pour utiliser cette fonctionnalité.</div>
  }

  return (
    <div style={s.container}>
      {/* ── Drop zone (avant import) ── */}
      {!parseResult && (
        <div
          style={{
            ...s.dropzone,
            ...(isDragging ? s.dropzoneActive : {}),
          }}
          onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) processFile(file)
            }}
          />
          <UploadSimple size={32} color="#FFD56B" weight="duotone" />
          <div style={s.dropzoneTitle}>
            Glisse-dépose ton fichier CSV ici
          </div>
          <div style={s.dropzoneDesc}>
            ou clique pour le sélectionner
          </div>
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <div style={s.error}>
          <Warning size={14} weight="fill" /> {error}
        </div>
      )}

      {/* ── Aperçu après import ── */}
      {parseResult && (
        <div style={s.preview}>
          <div style={s.previewHead}>
            <div style={s.previewIcon}>
              <FileCsv size={20} color="#FFD56B" weight="fill" />
            </div>
            <div>
              <div style={s.previewTitle}>Fichier importé avec succès</div>
              <div style={s.previewSub}>
                {allRows.length} fiche{allRows.length > 1 ? 's' : ''} détectée{allRows.length > 1 ? 's' : ''} dans le CSV
              </div>
            </div>
          </div>

          {/* Sélecteur de fiche si plusieurs */}
          {allRows.length > 1 && (
            <div style={s.rowSelector}>
              <div style={s.rowSelectorLabel}>Choisis la fiche à auditer :</div>
              <div style={s.rowSelectorGrid}>
                {allRows.slice(0, 10).map((row, idx) => {
                  const name = row['Business name'] || row['Nom'] || row["Nom de l'établissement"] || `Fiche ${idx + 1}`
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectRow(idx)}
                      style={{
                        ...s.rowChoice,
                        ...(selectedRowIdx === idx ? s.rowChoiceActive : {}),
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
                {allRows.length > 10 && (
                  <span style={s.rowMore}>
                    + {allRows.length - 10} autres fiches non affichées
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Méta-données */}
          {parseResult.meta.businessName && (
            <div style={s.metaRow}>
              <span style={s.metaLabel}>Nom :</span>
              <span style={s.metaValue}>{parseResult.meta.businessName}</span>
            </div>
          )}
          {parseResult.meta.city && (
            <div style={s.metaRow}>
              <span style={s.metaLabel}>Ville :</span>
              <span style={s.metaValue}>{parseResult.meta.city}</span>
            </div>
          )}

          {/* Résumé des correspondances */}
          <div style={s.summary}>
            <div style={s.summaryBlock}>
              <div style={s.summaryNum}>{parseResult.matchedFields.length}</div>
              <div style={s.summaryLabel}>champ{parseResult.matchedFields.length > 1 ? 's' : ''} pré-rempli{parseResult.matchedFields.length > 1 ? 's' : ''}</div>
            </div>
            <div style={s.summaryBlock}>
              <div style={{ ...s.summaryNum, color: 'var(--text-muted)' }}>
                {25 - Object.keys(parseResult.prefilled).length}
              </div>
              <div style={s.summaryLabel}>question{(25 - Object.keys(parseResult.prefilled).length) > 1 ? 's' : ''} restante{(25 - Object.keys(parseResult.prefilled).length) > 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Liste détaillée */}
          <div style={s.detailList}>
            <div style={s.detailTitle}>Champs détectés :</div>
            {parseResult.matchedFields.map((f, i) => (
              <div key={i} style={s.detailItem}>
                <CheckCircle size={13} color="#34d399" weight="fill" />
                <span>{f}</span>
              </div>
            ))}
            {parseResult.unmatchedFields.map((f, i) => (
              <div key={i} style={{ ...s.detailItem, color: 'var(--text-muted)' }}>
                <XCircle size={13} color="var(--text-muted)" weight="fill" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={s.actions}>
            <button
              type="button"
              onClick={() => {
                setParseResult(null)
                setAllRows([])
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              style={s.btnGhost}
            >
              Importer un autre fichier
            </button>
            <button
              type="button"
              onClick={startAudit}
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
  container: {},

  /* Drop zone */
  dropzone: {
    background: 'var(--surface)', border: '2px dashed var(--border)',
    borderRadius: '16px', padding: '48px 24px',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: '8px',
    cursor: 'pointer', textAlign: 'center' as const,
    transition: 'all 0.2s',
  },
  dropzoneActive: {
    borderColor: '#FFD56B',
    background: 'rgba(255,213,107,0.04)',
    transform: 'scale(1.01)',
  },
  dropzoneTitle: {
    fontSize: '15px', fontWeight: 600,
    color: 'var(--text)', marginTop: '8px',
  },
  dropzoneDesc: {
    fontSize: '13px', color: 'var(--text-2)',
  },

  /* Erreur */
  error: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '11px 14px',
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444', fontSize: '13px',
    borderRadius: '10px', marginTop: '12px',
  },

  /* Aperçu */
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
    background: 'rgba(255,213,107,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
  },
  previewSub: {
    fontSize: '12px', color: 'var(--text-3)', marginTop: '2px',
  },

  /* Sélecteur de fiche */
  rowSelector: { marginBottom: '16px' },
  rowSelectorLabel: {
    fontSize: '12px', color: 'var(--text-3)',
    marginBottom: '8px', fontWeight: 500,
  },
  rowSelectorGrid: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  rowChoice: {
    fontSize: '12px', padding: '7px 12px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-2)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  rowChoiceActive: {
    borderColor: '#FFD56B',
    background: 'rgba(255,213,107,0.1)',
    color: '#FFD56B', fontWeight: 600,
  },
  rowMore: {
    fontSize: '11px', color: 'var(--text-muted)',
    fontStyle: 'italic' as const, padding: '7px 0',
  },

  /* Méta */
  metaRow: {
    display: 'flex', gap: '8px',
    fontSize: '13px', padding: '5px 0',
  },
  metaLabel: {
    color: 'var(--text-3)', minWidth: '60px',
  },
  metaValue: {
    color: 'var(--text)', fontWeight: 500,
  },

  /* Résumé numérique */
  summary: {
    display: 'flex', gap: '12px',
    margin: '18px 0', padding: '14px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    borderRadius: '10px',
  },
  summaryBlock: {
    flex: 1, textAlign: 'center' as const,
  },
  summaryNum: {
    fontSize: '24px', fontWeight: 700,
    color: '#34d399', fontFamily: 'var(--font-fraunces), serif',
  },
  summaryLabel: {
    fontSize: '11px', color: 'var(--text-3)',
    marginTop: '2px',
  },

  /* Liste détaillée */
  detailList: {
    margin: '14px 0',
  },
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

  /* Actions */
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
    background: '#FFD56B', color: '#0a1628',
    border: 'none', borderRadius: '9px',
    padding: '11px 18px', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
