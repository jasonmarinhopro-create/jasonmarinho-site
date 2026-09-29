'use client'

// Onglet Réglages : boîte d'envoi (SMTP de Jason), rythme (plafond, jours,
// pause), signature, passage manuel et bonnes pratiques de délivrabilité.

import { useState } from 'react'
import { EnvelopeSimple, Gauge, Play, CheckCircle, WarningCircle, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { AMBER, tint } from '../_ui/theme'
import { saveSettings, runNow } from './actions'
import { ui, type MailConfig, type SettingsRow } from './shared'

const DAYS = [
  { n: 1, l: 'Lun' }, { n: 2, l: 'Mar' }, { n: 3, l: 'Mer' }, { n: 4, l: 'Jeu' }, { n: 5, l: 'Ven' }, { n: 6, l: 'Sam' }, { n: 7, l: 'Dim' },
]

export default function SettingsTab({ settings, config }: { settings: SettingsRow; config: MailConfig }) {
  const [cap, setCap] = useState(settings.daily_cap)
  const [days, setDays] = useState<number[]>(settings.send_days)
  const [paused, setPaused] = useState(settings.paused)
  const [signature, setSignature] = useState(settings.signature ?? 'Jason Marinho\nhttps://jasonmarinho.com')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null)

  async function save() {
    setBusy('save')
    const res = await saveSettings({ daily_cap: cap, send_days: days, paused, signature })
    setBusy(null)
    setMsg(res.ok ? { ok: 'Réglages enregistrés' } : { err: res.error })
  }
  async function run() {
    setBusy('run'); setMsg(null)
    const res = await runNow()
    setBusy(null)
    if (!res.ok) return setMsg({ err: res.error })
    const d = res.data!
    setMsg({ ok: `Passage terminé : ${d.sent} envoyé${d.sent > 1 ? 's' : ''}, ${d.replies} réponse${d.replies > 1 ? 's' : ''}, ${d.bounces} rebond${d.bounces > 1 ? 's' : ''}, ${d.signups} inscription${d.signups > 1 ? 's' : ''} détectée${d.signups > 1 ? 's' : ''}${d.errors ? `, ${d.errors} erreur${d.errors > 1 ? 's' : ''}` : ''}${d.skipped ? ` (${d.skipped})` : ''}.` })
  }

  return (
    <div style={s.grid}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<EnvelopeSimple size={18} weight="fill" />} title="Boîte d'envoi" sub="Les e-mails partent de ta vraie boîte, comme si tu écrivais toi-même : les réponses arrivent chez toi." />
          {config.configured ? (
            <div style={{ ...ui.notice, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}>
              <CheckCircle size={16} weight="fill" /> Branchée : envoi depuis <strong>{config.from}</strong>, réponses lues chaque jour d&apos;envoi.
            </div>
          ) : (
            <div style={{ ...ui.notice }}>
              <WarningCircle size={16} weight="fill" style={{ color: AMBER, flexShrink: 0, marginTop: '1px' }} /> Pas encore branchée : aucun e-mail ne peut partir.
            </div>
          )}
          <ol style={s.list}>
            <li>Prends une adresse à ton nom sur ton domaine (ex. jason@jasonmarinho.com, Google Workspace conseillé). Évite contact@ : une vraie personne répond mieux.</li>
            <li>Google : active la validation en deux étapes, puis crée un <strong>mot de passe d&apos;application</strong> (Compte Google, Sécurité).</li>
            <li>Sur Vercel, projet du dashboard, ajoute : <code style={s.code}>OUTREACH_SMTP_HOST</code> = smtp.gmail.com, <code style={s.code}>OUTREACH_SMTP_USER</code> = ton adresse, <code style={s.code}>OUTREACH_SMTP_PASS</code> = le mot de passe d&apos;application. Facultatif : <code style={s.code}>OUTREACH_FROM_NAME</code>.</li>
            <li>Redéploie, puis clique « M&apos;envoyer un essai » dans une séquence.</li>
          </ol>
          <p style={ui.sub}>Pourquoi pas Resend : ses conditions interdisent la prospection. Un compte fermé couperait aussi les e-mails de l&apos;app (contrats, cautions).</p>
        </section>

        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<ShieldCheck size={18} weight="fill" />} title="Pour arriver en boîte de réception" sub="Les bonnes pratiques qui évitent les courriers indésirables." />
          <ul style={s.list}>
            <li>Commence à 15 à 25 e-mails par jour la première semaine, puis augmente doucement.</li>
            <li>Vérifie que ton domaine a SPF, DKIM et DMARC (Google Workspace, Admin, Authentifier les e-mails).</li>
            <li>Des e-mails courts, en texte simple, sans image ni pièce jointe : c&apos;est déjà le cas des séquences.</li>
            <li>Réponds vite aux réponses : c&apos;est là que se font les inscriptions.</li>
            <li>Chaque e-mail porte un lien de désinscription en un clic et l&apos;en-tête de désinscription des messageries.</li>
          </ul>
        </section>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Head icon={<Gauge size={18} weight="fill" />} title="Rythme d'envoi" sub="Chaque jour d'envoi, vers 9 h (8 h en hiver), l'app lit ta boîte puis envoie les e-mails prévus." />
          <label style={ui.label}>
            Plafond par jour
            <input type="number" min={1} max={200} value={cap} onChange={e => setCap(parseInt(e.target.value) || 1)} style={{ ...ui.input, maxWidth: '140px' }} />
          </label>
          <div style={ui.label}>
            Jours d&apos;envoi
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DAYS.map(d => {
                const on = days.includes(d.n)
                return (
                  <button key={d.n} type="button" aria-pressed={on} onClick={() => setDays(p => on ? p.filter(x => x !== d.n) : [...p, d.n].sort())} style={{ ...s.day, ...(on ? s.dayOn : {}) }}>{d.l}</button>
                )
              })}
            </div>
          </div>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13.5px', color: 'var(--text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={paused} onChange={e => setPaused(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} />
            Mettre tous les envois en pause (réponses et inscriptions toujours suivies)
          </label>
          <label style={ui.label}>
            Signature (ajoutée sous chaque e-mail)
            <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={3} style={ui.textarea} />
          </label>
          <button type="button" onClick={save} disabled={busy === 'save'} style={{ ...ui.btn, alignSelf: 'flex-start' }}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
        </section>

        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<Play size={18} weight="fill" />} title="Dernier passage" sub={settings.last_run_at ? `Le ${new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}` : 'Aucun passage pour l\'instant.'} />
          {settings.last_run_summary && <p style={{ ...ui.sub, color: 'var(--text-2)' }} suppressHydrationWarning>{settings.last_run_summary}</p>}
          <button type="button" onClick={run} disabled={busy === 'run'} style={{ ...ui.btnGhost, alignSelf: 'flex-start' }}><Play size={14} weight="fill" /> {busy === 'run' ? 'Passage en cours…' : 'Lancer un passage maintenant'}</button>
          <p style={ui.sub}>Un passage manuel envoie aussi les e-mails du jour, même un jour sans envoi, dans la limite du plafond.</p>
        </section>

        {msg && <div style={{ ...ui.notice, ...(msg.ok ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' } : { background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }) }}>{msg.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />} {msg.ok ?? msg.err}</div>}
      </div>
    </div>
  )
}

function Head({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <h3 style={ui.cardTitle}>{title}</h3>
        <p style={{ ...ui.sub, marginTop: '4px' }} suppressHydrationWarning>{sub}</p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '16px', alignItems: 'start' },
  list: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.55 },
  code: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12px', padding: '1px 5px', borderRadius: '5px', background: 'var(--bg)', border: '1px solid var(--border)' },
  day: { padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  dayOn: { background: 'var(--accent-bg)', borderColor: 'var(--accent-text)', color: 'var(--accent-text)' },
}
