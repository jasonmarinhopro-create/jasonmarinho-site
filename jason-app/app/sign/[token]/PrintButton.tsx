'use client'

export default function PrintButton() {
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
