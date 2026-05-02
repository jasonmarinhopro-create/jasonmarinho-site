'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { ImageSquare, Plus, X } from '@phosphor-icons/react/dist/ssr'
import { uploadPostImage } from '@/app/dashboard/chez-nous/actions'

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  max?: number
}

export default function ImageUploader({ value, onChange, max = 3 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    const remaining = max - value.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) {
      setError(`Maximum ${max} images atteint`)
      return
    }

    startTransition(async () => {
      const newUrls: string[] = []
      for (const file of toUpload) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadPostImage(fd)
        if (res.ok) newUrls.push(res.url)
        else { setError(res.error); break }
      }
      if (newUrls.length > 0) onChange([...value, ...newUrls])
    })
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div style={s.wrap}>
      {value.length > 0 && (
        <div style={s.grid}>
          {value.map((url, i) => (
            <div key={url} style={s.thumb}>
              <Image src={url} alt={`Image ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="120px" unoptimized />
              <button type="button" onClick={() => removeAt(i)} style={s.removeBtn} title="Retirer">
                <X size={11} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={s.addBtn}
            disabled={pending}
          >
            {pending ? (
              <>Envoi en cours…</>
            ) : (
              <>
                <Plus size={13} weight="bold" />
                {value.length === 0 ? (
                  <><ImageSquare size={13} /> Ajouter une image (optionnel)</>
                ) : (
                  <>Ajouter une autre ({value.length}/{max})</>
                )}
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </>
      )}

      {error && <p style={s.error}>{error}</p>}
      <p style={s.help}>JPEG, PNG, WebP, max 5 Mo · jusqu'à {max} images</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '8px',
  },
  thumb: {
    position: 'relative', aspectRatio: '1 / 1',
    borderRadius: '10px', overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  removeBtn: {
    position: 'absolute', top: '4px', right: '4px',
    width: '22px', height: '22px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--bg)', border: '1px dashed var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontWeight: 500,
    padding: '8px 14px', borderRadius: '8px',
    cursor: 'pointer', alignSelf: 'flex-start',
  },
  error: {
    color: '#fb7185', fontSize: '11px', margin: 0,
  },
  help: {
    fontSize: '11px', color: 'var(--text-muted)', margin: 0,
  },
}
