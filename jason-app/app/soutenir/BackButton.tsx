'use client'
import { ArrowLeft } from '@phosphor-icons/react'

export default function BackButton({ label, style }: { label?: string; style?: React.CSSProperties }) {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '8px 14px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .15s',
        ...style,
      }}
    >
      <ArrowLeft size={15} weight="bold" />
      {label ?? 'Retour'}
    </button>
  )
}
