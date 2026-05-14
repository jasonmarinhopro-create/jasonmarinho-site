'use client'

import { useEffect } from 'react'

export default function PrintButton() {
  // Auto-déclenche l'impression si on arrive sur la page avec ?print=1
  // (utilisé depuis le dashboard hôte pour ouvrir directement en PDF).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') === '1') {
      // Léger délai pour laisser le layout se stabiliser avant le snapshot.
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }} className="no-print">
      <button
        onClick={() => window.print()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#1e3d2f',
          border: '1px solid #2d5a3f',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '14px',
          color: '#a5c4b0',
          cursor: 'pointer',
        }}
      >
        Télécharger / Imprimer le contrat (PDF)
      </button>
    </div>
  )
}
