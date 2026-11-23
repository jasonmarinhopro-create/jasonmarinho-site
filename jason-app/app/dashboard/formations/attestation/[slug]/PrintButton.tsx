'use client'

import { Printer } from '@phosphor-icons/react/dist/ssr'

export default function PrintButton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '11px 20px' }}>
      <Printer size={16} weight="fill" /> Imprimer ou enregistrer en PDF
    </button>
  )
}
