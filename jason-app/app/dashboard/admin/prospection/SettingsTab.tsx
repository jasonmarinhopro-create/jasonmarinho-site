'use client'

// Onglet Réglages : boîte d'envoi (SMTP de Jason), rythme (plafond, jours,
// pause), signature, passage manuel et bonnes pratiques de délivrabilité.

import { useState } from 'react'
import { EnvelopeSimple, Gauge, Play, CheckCircle, WarningCircle, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { AMBER, tint } from '../_ui/theme'
import { saveSettings, runNow } from './actions'
import { DEFAULT_SIGNATURE, LEGACY_DEFAULT_SIGNATURE, SIGNATURE_PHOTO_URL, signatureToHtml } from '@/lib/outreach/engine'
import { ui, type MailConfig, type SettingsRow } from './shared'

const DAYS = [
  { n: 1, l: 'Lun' }, { n: 2, l: 'Mar' }, { n: 3, l: 'Mer' }, { n: 4, l: 'Jeu' }, { n: 5, l: 'Ven' }, { n: 6, l: 'Sam' }, { n: 7, l: 'Dim' },
]

export default function SettingsTab({ settings, config }: { settings: SettingsRow; config: MailConfig }) {
  const [cap, setCap] = useState(settings.daily_cap)
  const [days, setDays] = useState<number[]>(settings.send_days)
  const [paused, setPaused] = useState(settings.paused)
  const [photo, setPhoto] = useState(settings.signature_photo)
  const [signature, setSignature] = useState(settings.signature && settings.signature.trim() !== LEGACY_DEFAULT_SIGNATURE ? settings.signature : DEFAULT_SIGNATURE)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null)
  const hostinger = /hostinger/i.test(config.host ?? '')

  async function save() {
    setBusy('save')
    const res = await saveSettings({ daily_cap: cap, send_days: days, paused, signature, signature_photo: photo })
    setBusy(null)
    setMsg(res.ok ? { ok: 'Réglages enregistrés' } : { err: res.error })
  }
  async function run() {
    setBusy('run'); setMsg(null)
    const res = await runNow()
    setBusy(null)
    if (!res.ok) return setMsg({ err: res.error })
    const d = res.data!
    setMsg({ ok: `Passage terminé : ${d.sent} envoyé${d.sent > 1 ? 's' : ''}, ${d.replies} réponse${d.replies > 1 ? 's' : ''}, ${d.bounces} rebond${d.bounces > 1 ? 's' : ''}, ${d.signups} inscription${d.signups > 1 ? 's' : ''} détectée${d.signups > 1 ? 's' : ''}${d.errors ? `, ${d.errors} erreur${d.errors > 1 ? 's' : ''}` : ''}${d.skipped ? ` (${d.skipped})` : ''}.${d.more ? ' La suite part en arrière-plan, au rythme de la boîte.' : ''}` })
  }

  return (
    <div style={s.grid}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<EnvelopeSimple size={18} weight="fill" />} title="Boîte d'envoi" sub="Les e-mails partent de ta vraie boîte, comme si tu écrivais toi-même : les réponses arrivent chez toi." />
          {config.configured ? (
            <div style={{ ...ui.notice, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}>
              <CheckCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} /> <span>Branchée : envoi depuis <strong>{config.from}</strong>, réponses lues chaque jour d&apos;envoi.</span>
            </div>
          ) : (
            <div style={{ ...ui.notice }}>
              <WarningCircle size={16} weight="fill" style={{ color: AMBER, flexShrink: 0, marginTop: '1px' }} /> <span>Pas encore branchée : aucun e-mail ne peut partir.</span>
            </div>
          )}
          <ol style={s.list}>
            <li>Une adresse à ton nom sur ton domaine, ex. <strong>jason@jasonmarinho.com</strong> (Hostinger Business Email). Évite contact@ : une vraie personne répond mieux.</li>
            <li>Dans Hostinger, garde une copie des messages dans la boîte même si tu les rediriges vers Gmail : l&apos;app y lit les réponses et les rebonds pour arrêter les relances.</li>
            <li>Sur Vercel, projet du dashboard, Settings, Environment Variables : <code style={s.code}>OUTREACH_SMTP_HOST</code> = smtp.hostinger.com, <code style={s.code}>OUTREACH_SMTP_PORT</code> = 465, <code style={s.code}>OUTREACH_SMTP_USER</code> = l&apos;adresse complète, <code style={s.code}>OUTREACH_SMTP_PASS</code> = le mot de passe de la boîte. La lecture des réponses passe par imap.hostinger.com (port 993) sans autre réglage. Facultatif : <code style={s.code}>OUTREACH_FROM_NAME</code>.</li>
            <li>Redéploie, puis clique « M&apos;envoyer un essai » dans une séquence.</li>
          </ol>
          <p style={ui.sub}>Autre fournisseur : Google Workspace (smtp.gmail.com, mot de passe d&apos;application) ou Zoho fonctionnent de la même façon.</p>
          <p style={ui.sub}>Pourquoi pas Resend : ses conditions interdisent la prospection. Un compte fermé couperait aussi les e-mails de l&apos;app (contrats, cautions).</p>
        </section>

        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<ShieldCheck size={18} weight="fill" />} title="Pour arriver en boîte de réception" sub="Les bonnes pratiques qui évitent les courriers indésirables." />
          <ul style={s.list}>
            <li>Commence à 15 à 25 e-mails par jour la première semaine, puis augmente doucement.</li>
            <li>Vérifie que ton domaine a SPF, DKIM et DMARC. Chez Hostinger : bouton « Résoudre » de l&apos;alerte « enregistrements manquants ». Un seul enregistrement SPF par domaine : s&apos;il en existe déjà un, fusionne-les.</li>
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
          {hostinger && cap > 80 && (
            <div style={ui.notice}>
              <WarningCircle size={16} weight="fill" style={{ color: AMBER, flexShrink: 0, marginTop: '1px' }} />
              <span>L&apos;offre Business Email gratuite de Hostinger permet 100 e-mails par jour, tes propres messages compris. Garde de la marge : 80 au plus.</span>
            </div>
          )}
          <p style={ui.sub}>Environ 7 secondes entre deux e-mails (jamais plus de 10 par minute, la limite de Hostinger) : un passage envoie quelques e-mails puis se relance tout seul jusqu&apos;au plafond.</p>
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
            <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={6} style={ui.textarea} />
          </label>
          <div style={s.sigPreview}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Aperçu dans l&apos;e-mail</span>
            {/* signatureToHtml échappe chaque ligne avant de la mettre en forme */}
            <div dangerouslySetInnerHTML={{ __html: signatureToHtml(signature || DEFAULT_SIGNATURE, photo ? SIGNATURE_PHOTO_URL : null) }} />
          </div>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13.5px', color: 'var(--text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={photo} onChange={e => setPhoto(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} />
            Afficher ma photo, comme dans Gmail
          </label>
          <p style={ui.sub}>Reprise de ta signature Gmail (contact@). Ta photo est une petite image (6 Ko) hébergée sur jasonmarinho.com, ton propre domaine : c&apos;est ce qui limite le risque d&apos;indésirables. Ligne 1 en gras, ligne 2 ta fonction, puis tes coordonnées.</p>
          <button type="button" onClick={save} disabled={busy === 'save'} style={{ ...ui.btn, alignSelf: 'flex-start' }}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
        </section>

        <section style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Head icon={<Play size={18} weight="fill" />} title="Dernier passage" sub={settings.last_run_at ? `Le ${new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}` : 'Aucun passage pour l\'instant.'} />
          {settings.last_run_summary && <p style={{ ...ui.sub, color: 'var(--text-2)' }} suppressHydrationWarning>{settings.last_run_summary}</p>}
          <button type="button" onClick={run} disabled={busy === 'run'} style={{ ...ui.btnGhost, alignSelf: 'flex-start' }}><Play size={14} weight="fill" /> {busy === 'run' ? 'Passage en cours…' : 'Lancer un passage maintenant'}</button>
          <p style={ui.sub}>Un passage manuel envoie aussi les e-mails du jour, même un jour sans envoi, dans la limite du plafond.</p>
        </section>

        {msg && <div style={{ ...ui.notice, ...(msg.ok ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' } : { background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }) }}>{msg.ok ? <CheckCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} /> : <WarningCircle size={16} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />} <span>{msg.ok ?? msg.err}</span></div>}
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
  sigPreview: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px 16px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)' },
  dayOn: { background: 'var(--accent-bg)', border: '1px solid var(--accent-text)', color: 'var(--accent-text)' },
}
