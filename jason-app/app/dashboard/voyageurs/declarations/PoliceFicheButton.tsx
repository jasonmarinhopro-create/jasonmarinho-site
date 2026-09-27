'use client'

import { useState } from 'react'
import { FilePdf } from '@phosphor-icons/react/dist/ssr'
import { downloadPoliceFichePdf } from '@/lib/declarations/police-fiche-download'

export default function PoliceFicheButton({ id, voyageurNom }: { id: string; voyageurNom: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  return (
    <button
      type="button"
      disabled={loading}
      title={error || 'Télécharger la fiche de police (à conserver 6 mois)'}
      onClick={async () => {
        setLoading(true); setError('')
        const res = await downloadPoliceFichePdf(id, voyageurNom)
        if (res.error) setError(res.error)
        setLoading(false)
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
        borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)',
        color: error ? 'var(--danger)' : 'var(--text-2)', fontSize: '12px', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
      }}
    >
      <FilePdf size={12} weight="bold" /> {loading ? 'Génération…' : error ? 'Réessayer' : 'Fiche PDF'}
    </button>
  )
}
