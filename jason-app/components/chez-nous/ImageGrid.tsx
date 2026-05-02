'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X } from '@phosphor-icons/react/dist/ssr'

/**
 * Affiche une grille d'images cliquables (lightbox simple au clic).
 */
export default function ImageGrid({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div style={{
        ...s.grid,
        gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
      }}>
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpen(i)}
            style={s.cell}
            aria-label={`Voir l'image ${i + 1}`}
          >
            <Image
              src={url}
              alt={`Image ${i + 1}`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, 400px"
              unoptimized
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div style={s.overlay} onClick={() => setOpen(null)}>
          <button onClick={() => setOpen(null)} style={s.closeBtn} aria-label="Fermer">
            <X size={18} weight="bold" />
          </button>
          <Image
            src={images[open]}
            alt={`Image ${open + 1}`}
            width={1600}
            height={1200}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', width: 'auto', height: 'auto' }}
            unoptimized
          />
        </div>
      )}
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gap: '8px',
    margin: '12px 0',
  },
  cell: {
    position: 'relative',
    aspectRatio: '1 / 1',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'zoom-in',
    background: 'var(--bg)',
    padding: 0,
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1100, padding: '20px',
  },
  closeBtn: {
    position: 'absolute', top: '20px', right: '20px',
    width: '40px', height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
