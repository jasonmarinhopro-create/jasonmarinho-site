'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Camera, Broom, House, Check, Copy, ChatCircleText, CursorClick, Eye, UserPlus, Info, LinkSimple } from '@phosphor-icons/react/dist/ssr'
import { PRIVATE_AUDIENCES, PRIVATE_PLATFORMS, privateLinkCode, type PrivateAudience, type PrivatePlatform } from '@/lib/acquisition/rules'
import { buildPrivateMessage, privateMessageUrl, PRIVATE_KINDS, type PrivateKind } from '@/lib/acquisition/messages'
import { AMBER, PINK, tint } from '../_ui/theme'

// Onglet « Messages privés » de Provenance (12/10/2026, demande de Jason : « un
// message que je peux envoyer à des photographes ou des équipes de ménage en
// privé avec un lien tracé »). Texte dans lib/acquisition/messages.ts, un lien
// suivi par métier et par messagerie (rules.ts). Le message n'est jamais
// enregistré, seuls les clics, visites et inscriptions venus des liens sont comptés.

export interface PrivateLinkStat {
  code: string
  clicks: number
  clicksTotal: number
  visitors: number
  signups: Array<{ id: string; name: string }>
}

const COUNTER_KEY = 'jm-messages-prives-copies'
const AUDIENCE_ICON: Record<PrivateAudience, React.ReactNode> = {
  photographe: <Camera size={15} weight="bold" />,
  menage: <Broom size={15} weight="bold" />,
  hote: <House size={15} weight="bold" />,
}

const parisDay = () => new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })

function readCounter(): { day: string; today: number; total: number } {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTER_KEY) ?? 'null') as { day?: string; today?: number; total?: number } | null
    const day = parisDay()
    if (!raw) return { day, today: 0, total: 0 }
    return { day, today: raw.day === day ? raw.today ?? 0 : 0, total: raw.total ?? 0 }
  } catch {
    return { day: parisDay(), today: 0, total: 0 }
  }
}

export default function MessagesPrivesTab({ stats, periodLabel }: { stats: PrivateLinkStat[]; periodLabel: string }) {
  const [audience, setAudience] = useState<PrivateAudience>('photographe')
  const [platform, setPlatform] = useState<PrivatePlatform>('instagram')
  const [kind, setKind] = useState<PrivateKind>('premier')
  const [vous, setVous] = useState(false)
  const [prenom, setPrenom] = useState('')
  const [ville, setVille] = useState('')
  const [copied, setCopied] = useState<'message' | 'lien' | null>(null)
  const [counter, setCounter] = useState<{ today: number; total: number } | null>(null)

  useEffect(() => { setCounter(readCounter()) }, [])

  const message = useMemo(
    () => buildPrivateMessage({ audience, platform, kind, prenom, ville, vous }),
    [audience, platform, kind, prenom, ville, vous],
  )
  const url = privateMessageUrl(audience, platform)

  const copy = (text: string, what: 'message' | 'lien') => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1800)
      if (what !== 'message') return
      const c = readCounter()
      const next = { day: c.day, today: c.today + 1, total: c.total + 1 }
      try { localStorage.setItem(COUNTER_KEY, JSON.stringify(next)) } catch { /* navigation privée */ }
      setCounter(next)
      // Le prénom change d'une personne à l'autre : on vide pour le suivant
      setPrenom('')
    }, () => undefined)
  }

  const byCode = new Map(stats.map(st => [st.code, st]))
  const totals = stats.reduce((a, st) => ({ clicks: a.clicks + st.clicks, visitors: a.visitors + st.visitors, signups: a.signups + st.signups.length }), { clicks: 0, visitors: 0, signups: 0 })

  return (
    <div style={s.grid}>
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><ChatCircleText size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Un message privé, prêt à envoyer</h2>
            <p style={s.sub}>Choisis à qui et où tu écris, ajoute le prénom, copie, colle. Le lien est suivi : tu vois ci-contre ce que chaque messagerie rapporte.</p>
          </div>
        </header>

        <Group label="À qui">
          {PRIVATE_AUDIENCES.map(a => (
            <Pill key={a.key} on={audience === a.key} onClick={() => setAudience(a.key)}>{AUDIENCE_ICON[a.key]} {a.label}</Pill>
          ))}
        </Group>
        <Group label="Où tu l'envoies">
          {PRIVATE_PLATFORMS.map(p => (
            <Pill key={p.key} on={platform === p.key} onClick={() => setPlatform(p.key)}>{p.label}</Pill>
          ))}
        </Group>
        <Group label="Quel message">
          {PRIVATE_KINDS.map(k => (
            <Pill key={k.key} on={kind === k.key} onClick={() => setKind(k.key)}>{k.label}</Pill>
          ))}
          <span style={s.hint}>{PRIVATE_KINDS.find(k => k.key === kind)?.hint}</span>
        </Group>
        <Group label="Ton">
          <Pill on={!vous} onClick={() => setVous(false)}>Tutoiement</Pill>
          <Pill on={vous} onClick={() => setVous(true)}>Vouvoiement</Pill>
        </Group>

        <div style={s.fields}>
          <label style={s.field}>
            <span style={s.lab}>Prénom (facultatif)</span>
            <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Ex. Julie" style={s.input} maxLength={40} />
          </label>
          <label style={s.field}>
            <span style={s.lab}>Ville (facultatif)</span>
            <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex. Lyon, Le Mans" style={s.input} maxLength={60} />
          </label>
        </div>

        <div style={s.preview}>{message}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => copy(message, 'message')} style={s.primary}>
            {copied === 'message' ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />} {copied === 'message' ? 'Message copié' : 'Copier le message'}
          </button>
          <button type="button" onClick={() => copy(url, 'lien')} style={s.secondary}>
            {copied === 'lien' ? <Check size={14} weight="bold" /> : <LinkSimple size={14} weight="bold" />} {copied === 'lien' ? 'Lien copié' : 'Copier le lien seul'}
          </button>
          {counter && (
            <span style={s.hint}>Copiés sur cet appareil : <strong>{counter.today}</strong> aujourd&apos;hui · {counter.total} en tout</span>
          )}
        </div>
        <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          Le lien {url.replace('https://', '')} mène à {PRIVATE_AUDIENCES.find(a => a.key === audience)?.landing}. Le prénom se vide après chaque copie, pour le message suivant.
        </p>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><CursorClick size={18} weight="fill" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={s.title}>Ce que rapportent tes messages</h2>
              <p style={s.sub}>{periodLabel} · <strong>{totals.clicks}</strong> clics, <strong>{totals.visitors}</strong> visiteurs, <strong>{totals.signups}</strong> {totals.signups > 1 ? 'inscriptions' : 'inscription'}. Total des clics depuis le début entre parenthèses.</p>
            </div>
          </header>
          {PRIVATE_AUDIENCES.map(a => (
            <div key={a.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={s.colTitle}>{a.label}</span>
              <ul style={s.list}>
                {PRIVATE_PLATFORMS.map(p => {
                  const st = byCode.get(privateLinkCode(a.key, p.key))
                  const active = audience === a.key && platform === p.key
                  return (
                    <li key={p.key} style={{ ...s.row, background: active ? tint('var(--accent-text)', 6) : 'transparent' }}>
                      <span style={{ flex: '1 1 80px', minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.label}</span>
                      <span style={s.stat} title="Clics sur la période (depuis le début)"><CursorClick size={13} /> {st?.clicks ?? 0} <span style={s.dim}>({st?.clicksTotal ?? 0})</span></span>
                      <span style={s.stat} title="Visiteurs mesurés sur le site"><Eye size={13} /> {st?.visitors ?? 0}</span>
                      <span style={s.stat} title="Comptes créés"><UserPlus size={13} /> {st?.signups.length ?? 0}</span>
                      {st && st.signups.length > 0 && (
                        <span style={{ flex: '1 1 100%', fontSize: 12.5, color: 'var(--text-3)' }}>
                          Inscrits :{' '}
                          {st.signups.map((sg, i) => (
                            <span key={sg.id}>{i > 0 && ', '}<Link href={`/dashboard/admin/membres/${sg.id}`} style={{ color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' }}>{sg.name}</Link></span>
                          ))}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            Un lien par métier et par messagerie, jamais un lien par personne : tu sais ce qui marche sans suivre qui a cliqué. Les aperçus de lien d&apos;Instagram, Facebook ou WhatsApp ne comptent pas comme des clics.
          </p>
        </section>

        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint(PINK, 14), color: PINK }}><Info size={18} weight="fill" /></span>
            <h2 style={s.title}>Pour que ça marche</h2>
          </header>
          <ul style={s.tips}>
            <li>Écris depuis un compte à ton nom, avec une photo : un message sans visage passe pour une arnaque.</li>
            <li>Mets le prénom et la ville : un message personnalisé reçoit plus de réponses qu&apos;un message copié en série.</li>
            <li>Une seule relance, 3 ou 4 jours plus tard. Si on te répond non, on ne relance plus.</li>
            <li>Espace tes envois sur la journée : les messageries limitent les comptes qui écrivent à beaucoup d&apos;inconnus d&apos;un coup.</li>
            <li>Quand quelqu&apos;un répond, passe en conversation normale : le lien envoyé mène déjà à l&apos;inscription.</li>
            <li>Hôtes : écris-leur seulement là où ils sont joignables en direct (groupes, Instagram, LinkedIn). Jamais par la messagerie Airbnb ou Booking, qui l&apos;interdit.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={s.lab}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} style={on ? s.pillOn : s.pill}>{children}</button>
}

const pillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 99, fontSize: 13.5,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

const s: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 16, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  lab: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  hint: { fontSize: 12.5, color: 'var(--text-3)' },
  pill: { ...pillBase, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)' },
  pillOn: { ...pillBase, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)' },
  fields: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 },
  input: { width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', minWidth: 0 },
  preview: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)', padding: '16px 18px', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' },
  primary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  secondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  note: { display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  colTitle: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 8px', borderBottom: '1px solid var(--border)', borderRadius: 8 },
  stat: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', minWidth: 44, whiteSpace: 'nowrap' },
  dim: { fontWeight: 500, color: 'var(--text-3)', fontSize: 12 },
  tips: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
}
