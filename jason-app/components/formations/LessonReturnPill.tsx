'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, X } from '@phosphor-icons/react/dist/ssr'

/**
 * « Revenir à ta leçon » (24/11/2026). Jason : « quand j'ai appuyé sur un
 * bouton pour calculer des prix, ça m'a sorti de ma formation, je ne
 * comprenais plus rien ». Le bouton d'une action de leçon (LessonContent)
 * note l'adresse exacte de la leçon (étape comprise) ; tant qu'on est sur
 * une autre page de l'app, cette pastille propose d'y revenir.
 * Mémoire de l'onglet (sessionStorage), valable 3 heures.
 */
export const LESSON_RETURN_KEY = 'jm_lesson_return'
const MAX_AGE = 3 * 3600 * 1000

export function rememberLessonReturn(label: string) {
  try {
    sessionStorage.setItem(LESSON_RETURN_KEY, JSON.stringify({ href: window.location.pathname + window.location.search, label, at: Date.now() }))
  } catch { /* stockage indisponible : pas de pastille */ }
}

export default function LessonReturnPill() {
  const pathname = usePathname() ?? ''
  const [ret, setRet] = useState<{ href: string; label: string } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LESSON_RETURN_KEY)
      if (!raw) { setRet(null); return }
      const v = JSON.parse(raw) as { href: string; label: string; at: number }
      const onLesson = v.href.split('?')[0] === pathname
      if (Date.now() - v.at > MAX_AGE || onLesson) { sessionStorage.removeItem(LESSON_RETURN_KEY); setRet(null); return }
      setRet({ href: v.href, label: v.label })
    } catch { setRet(null) }
  }, [pathname])

  if (!ret) return null
  const clear = () => { try { sessionStorage.removeItem(LESSON_RETURN_KEY) } catch { /* rien */ } setRet(null) }
  return (
    <div className="lrp" role="region" aria-label="Retour à la formation">
      <Link href={ret.href} className="lrp-go" onClick={clear}>
        <ArrowLeft size={16} weight="bold" />
        <span><b>Revenir à ta leçon</b><small>{ret.label}</small></span>
      </Link>
      <button type="button" className="lrp-x" onClick={clear} aria-label="Fermer"><X size={14} weight="bold" /></button>
      <style>{`
        .lrp { position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 90; display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 8px; border-radius: 999px; background: #004C3F; box-shadow: 0 16px 40px -14px rgba(0,40,30,.7); animation: lrpIn .3s ease both; max-width: calc(100vw - 32px); }
        @keyframes lrpIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .lrp-go { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 8px; border-radius: 999px; color: #fff; text-decoration: none; min-width: 0; }
        .lrp-go svg { flex-shrink: 0; color: #FFD56B; }
        .lrp-go span { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
        .lrp-go b { font-size: 14px; }
        .lrp-go small { font-size: 12px; color: rgba(255,255,255,.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .lrp-x { width: 30px; height: 30px; border-radius: 50%; border: 0; background: rgba(255,255,255,.12); color: #fff; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
        @media (max-width: 767px) { .lrp { bottom: calc(84px + env(safe-area-inset-bottom)); } }
        @media (prefers-reduced-motion: reduce) { .lrp { animation: none; } }
      `}</style>
    </div>
  )
}
