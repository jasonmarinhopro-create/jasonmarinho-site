'use client'

// Encart « Fais revenir tes voyageurs en direct » de Mes voyageurs
// (partenariat Brevo du 06/10/2026) : combien de voyageurs directs peuvent
// recevoir une newsletter, export CSV pour Brevo (fait dans le navigateur,
// rien n'est envoyé), lien affilié vers l'e-mail marketing de Brevo.
// Règles : lib/voyageurs/newsletter.ts (plateformes exclues).

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { EnvelopeSimple, DownloadSimple, ArrowUpRight, X, Info } from '@phosphor-icons/react/dist/ssr'
import { newsletterAudience, toBrevoCsv, type NewsletterVoyageur } from '@/lib/voyageurs/newsletter'

const BREVO_EMAIL = 'https://get.brevo.com/ui6inugm9ub6'
const HIDE_KEY = 'jm-voyageurs-brevo-hidden'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

export default function NewsletterCard({ voyageurs, today }: { voyageurs: NewsletterVoyageur[]; today: string }) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    try { if (localStorage.getItem(HIDE_KEY) === '1') setHidden(true) } catch { /* stockage indisponible */ }
  }, [])
  const a = useMemo(() => newsletterAudience(voyageurs), [voyageurs])
  if (hidden) return null

  function hide() {
    setHidden(true)
    try { localStorage.setItem(HIDE_KEY, '1') } catch { /* stockage indisponible */ }
  }

  function exportCsv() {
    const blob = new Blob(['﻿' + toBrevoCsv(a.eligible)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `voyageurs-directs-${today}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const n = a.eligible.length
  return (
    <section style={s.card} aria-labelledby="newsletter-title">
      <div style={s.head}>
        <span style={s.icon}><EnvelopeSimple size={19} weight="bold" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="newsletter-title" style={s.title}>Fais revenir tes voyageurs en direct</h2>
          <p style={s.sub}>Une lettre par saison (dates encore libres, tarif fidélité) à ceux qui ont déjà réservé chez toi en direct : c&apos;est la réservation la moins chère à obtenir.</p>
        </div>
        <button type="button" onClick={hide} aria-label="Masquer cet encart" title="Masquer" style={s.close}><X size={14} weight="bold" /></button>
      </div>

      <div style={s.body}>
        <div style={s.count}>
          <strong style={s.big}>{n}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>
            {n > 1 ? 'voyageurs venus en direct, avec un e-mail' : 'voyageur venu en direct, avec un e-mail'}
          </span>
        </div>
        <ul style={s.list}>
          {a.platform > 0 && <li>{plural(a.platform, 'voyageur')} d&apos;Airbnb, Booking.com ou Vrbo : exclus, les plateformes l&apos;interdisent</li>}
          {a.unknownSource > 0 && <li>{plural(a.unknownSource, 'voyageur')} sans origine : indique « Direct » ou « Driing » dans sa fiche s&apos;il a réservé chez toi</li>}
          {a.noEmail > 0 && <li>{plural(a.noEmail, 'voyageur direct', 'voyageurs directs')} sans e-mail</li>}
          {a.platform + a.unknownSource + a.noEmail === 0 && <li>Tous tes voyageurs directs ont un e-mail.</li>}
        </ul>
      </div>

      <div style={s.actions}>
        <button type="button" onClick={exportCsv} disabled={n === 0} style={{ ...s.btn, opacity: n === 0 ? 0.5 : 1, cursor: n === 0 ? 'not-allowed' : 'pointer' }}>
          <DownloadSimple size={15} weight="bold" /> Exporter pour Brevo (CSV)
        </button>
        <a href={BREVO_EMAIL} target="_blank" rel="sponsored noopener" style={s.btn2}>
          Créer mon compte Brevo gratuit <ArrowUpRight size={13} weight="bold" />
        </a>
        <span style={s.mention}>Lien affilié · gratuit jusqu&apos;à 300 e-mails par jour</span>
      </div>

      <p style={s.note}>
        <Info size={13} weight="bold" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Le fichier est créé dans ton navigateur, rien n&apos;est envoyé. Écris seulement à des voyageurs qui ont pu refuser au moment de la réservation, propose-leur un séjour, laisse un lien de désinscription (Brevo l&apos;ajoute) et ne partage jamais la liste. <Link href="/dashboard/aide/logements-voyageurs/newsletter-voyageurs" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Le mode d&apos;emploi</Link>.
        </span>
      </p>
    </section>
  )
}

const s: Record<string, CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(16px, 2.2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
  head: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 18, color: 'var(--text)' },
  sub: { margin: '3px 0 0', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 720 },
  close: { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  body: { display: 'flex', flexWrap: 'wrap', gap: '12px 28px', alignItems: 'center' },
  count: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  big: { fontFamily: 'var(--font-fraunces), serif', fontSize: 28, fontWeight: 600, color: 'var(--accent-text)', lineHeight: 1 },
  list: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45, flex: '1 1 320px' },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 15px', borderRadius: 10, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 13.5, fontFamily: 'inherit' },
  btn2: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'transparent', color: 'var(--accent-text)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none' },
  mention: { fontSize: 12, color: 'var(--text-3)' },
  note: { display: 'flex', gap: 6, margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55 },
}
