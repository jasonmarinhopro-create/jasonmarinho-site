'use client'

// Onglet Séquences : à gauche le chemin d'un contact (repéré, intéressé,
// inscrit, client) avec les séquences de chaque étape ; à droite l'éditeur
// de la séquence choisie (déclencheur, arrêt sur réponse, e-mails J+n dans le
// même fil, boucle et enchaînement en fin de séquence).

import { useEffect, useMemo, useState } from 'react'
import {
  Lightning, Users, EnvelopeSimple, Plus, Trash, ArrowUp, ArrowDown, PaperPlaneTilt, Eye, PencilSimple,
  WarningCircle, ArrowsClockwise, ArrowBendDownRight, Sparkle, Rocket, CheckCircle,
} from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { AUDIENCES, STAGES, STAGE_LABEL, renderTemplate, guessFirstName, type Audience, type Stage } from '@/lib/outreach/engine'
import { AMBER, tint } from '../_ui/theme'
import { saveSequence, setSequenceEnabled, deleteSequence, enrollInSequence, sendTestEmail, installPlaybook, type SequenceInput } from './actions'
import { ui, TRIGGER_LABEL, type SequenceRow, type ContactRow } from './shared'

type DraftStep = { key: string; id?: string; delay_days: number; subject: string; body: string; same_thread: boolean }
type Draft = Omit<SequenceInput, 'steps'> & { steps: DraftStep[] }

const EXAMPLE = { prenom: 'Marie', ville: 'Lyon', entreprise: 'Studio Lumière', nom: 'Marie Dupont' }

const GROUPS: Array<{ n: number; title: string; sub: string; match: (s: SequenceRow) => boolean }> = [
  { n: 1, title: 'Il est repéré', sub: 'Premier contact et relances', match: s => s.trigger !== 'etape' || !['interesse', 'a_repondu', 'inscrit', 'client'].includes(s.trigger_stage ?? '') },
  { n: 2, title: 'Il s\'intéresse', sub: 'Tu lui as répondu, il hésite encore', match: s => s.trigger === 'etape' && ['interesse', 'a_repondu'].includes(s.trigger_stage ?? '') },
  { n: 3, title: 'Il s\'inscrit', sub: 'Compte créé, pas encore client', match: s => s.trigger === 'etape' && s.trigger_stage === 'inscrit' },
  { n: 4, title: 'Il est client', sub: 'Ce qui arrive pendant l\'abonnement', match: s => s.trigger === 'etape' && s.trigger_stage === 'client' },
]

const WHO: Record<Audience, string> = { photographe: 'd\'un photographe', menage: 'd\'une équipe de ménage', hote: 'd\'un hôte', autre: 'd\'un contact' }

let keySeq = 0
const newKey = () => `k${++keySeq}`

function toDraft(s: SequenceRow): Draft {
  return {
    id: s.id, nom: s.nom, audience: s.audience, description: s.description, trigger: s.trigger, trigger_stage: s.trigger_stage, trigger_tag: s.trigger_tag ?? null,
    stop_on_reply: s.stop_on_reply, repeat_after_days: s.repeat_after_days, max_repeats: s.max_repeats,
    then_sequence_id: s.then_sequence_id, end_stage: s.end_stage,
    steps: s.steps.map(st => ({ key: st.id, id: st.id, delay_days: st.delay_days, subject: st.subject, body: st.body, same_thread: st.same_thread })),
  }
}

function cumulative(steps: Array<{ delay_days: number }>): number[] {
  let acc = 0
  return steps.map(s => (acc += s.delay_days))
}

export default function SequencesTab({ audience, sequences, contacts }: { audience: Audience; sequences: SequenceRow[]; contacts: ContactRow[] }) {
  const { confirm, dialog } = useConfirm()
  const list = useMemo(() => sequences.filter(s => s.audience === audience).sort((a, b) => a.position - b.position), [sequences, audience])
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null)
  const selected = list.find(s => s.id === selectedId) ?? null
  const [draft, setDraft] = useState<Draft | null>(selected ? toDraft(selected) : null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null)
  const [preview, setPreview] = useState<Record<string, boolean>>({})
  const knownTags = useMemo(() => Array.from(new Set(contacts.filter(c => c.audience === audience).flatMap(c => c.tags ?? []))).sort((x, y) => x.localeCompare(y, 'fr')), [contacts, audience])

  // Changement d'audience : première séquence de la liste
  useEffect(() => {
    setSelectedId(list[0]?.id ?? null)
    setDraft(list[0] ? toDraft(list[0]) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience])
  // Séquence choisie ou données rechargées : on repart de la version enregistrée
  useEffect(() => {
    if (selected) setDraft(toDraft(selected))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, sequences])

  const saved = selected ? JSON.stringify(toDraft(selected)) : ''
  const dirty = !!draft && !!selected && JSON.stringify({ ...draft, steps: draft.steps.map(s => ({ ...s, key: s.id ?? s.key })) }) !== saved
  const isNew = !!draft && !draft.id

  const ready = contacts.filter(c => c.audience === audience && c.stage === 'a_contacter' && c.email && !c.active_sequence_id)

  function flash(m: { ok?: string; err?: string }) { setMsg(m); if (m.ok) setTimeout(() => setMsg(null), 3500) }

  async function select(id: string) {
    if (dirty && !(await confirm({ title: 'Modifications non enregistrées', message: 'Changer de séquence sans enregistrer ?', confirmLabel: 'Oui, quitter' }))) return
    setSelectedId(id)
  }

  function newSequence() {
    setSelectedId(null)
    setDraft({
      nom: 'Nouvelle séquence', audience, description: null, trigger: 'manuel', trigger_stage: null, trigger_tag: null, stop_on_reply: true,
      repeat_after_days: null, max_repeats: 0, then_sequence_id: null, end_stage: null,
      steps: [{ key: newKey(), delay_days: 0, subject: 'Bonjour {prenom}', body: 'Bonjour {prenom},\n\n', same_thread: false }],
    })
  }

  async function save() {
    if (!draft) return
    setBusy('save')
    const res = await saveSequence({ ...draft, steps: draft.steps.map(({ key: _k, ...s }) => s) })
    setBusy(null)
    if (!res.ok) return flash({ err: res.error })
    if (res.data?.id) setSelectedId(res.data.id)
    flash({ ok: 'Séquence enregistrée' })
  }

  async function toggle() {
    if (!selected) return
    if (dirty) return flash({ err: 'Enregistre d\'abord tes modifications.' })
    if (!selected.enabled && !(await confirm({
      title: 'Mettre la séquence en marche ?',
      message: selected.trigger === 'nouveau_contact'
        ? `Chaque contact « À contacter » de l'audience entrera dans la séquence au prochain passage (${ready.length} aujourd'hui), dans la limite du plafond d'envoi quotidien.`
        : 'Les personnes inscrites dans cette séquence recevront leurs e-mails aux dates prévues, les jours d\'envoi choisis dans les réglages.',
      confirmLabel: 'Mettre en marche',
    }))) return
    setBusy('toggle')
    const res = await setSequenceEnabled(selected.id, !selected.enabled)
    setBusy(null)
    if (!res.ok) flash({ err: res.error })
  }

  async function remove() {
    if (!selected) return
    if (!(await confirm({ title: 'Supprimer la séquence ?', message: `« ${selected.nom} » et le parcours des ${selected.counts.en_cours} personnes en cours seront supprimés. L'historique des envois reste.`, confirmLabel: 'Supprimer', danger: true }))) return
    setBusy('delete')
    const res = await deleteSequence(selected.id)
    setBusy(null)
    if (!res.ok) flash({ err: res.error })
    else setSelectedId(null)
  }

  async function launch() {
    if (!selected) return
    if (!(await confirm({
      title: `Lancer pour ${ready.length} contact${ready.length > 1 ? 's' : ''} ?`,
      message: `Les contacts « À contacter » de l'audience, qui ne sont dans aucune séquence, entrent dans « ${selected.nom} ».${selected.enabled ? '' : ' La séquence est en pause : rien ne partira tant que tu ne l\'as pas mise en marche.'} Les envois respectent le plafond quotidien.`,
      confirmLabel: 'Lancer',
    }))) return
    setBusy('launch')
    const res = await enrollInSequence(selected.id, ready.map(c => c.id))
    setBusy(null)
    if (!res.ok) flash({ err: res.error })
    else flash({ ok: `${res.data?.added ?? 0} contact${(res.data?.added ?? 0) > 1 ? 's' : ''} ajouté${(res.data?.added ?? 0) > 1 ? 's' : ''}` })
  }

  async function test(step: DraftStep) {
    setBusy(`test-${step.key}`)
    const res = await sendTestEmail(step.subject, step.body)
    setBusy(null)
    flash(res.ok ? { ok: `Essai envoyé à ${res.data?.to}` } : { err: res.error })
  }

  async function install() {
    setBusy('install')
    const res = await installPlaybook()
    setBusy(null)
    flash(res.ok ? { ok: `${res.data?.added ?? 0} séquence${(res.data?.added ?? 0) > 1 ? 's' : ''} ajoutée${(res.data?.added ?? 0) > 1 ? 's' : ''}, en pause` } : { err: res.error })
  }

  const upd = (patch: Partial<Draft>) => setDraft(d => d ? { ...d, ...patch } : d)
  const updStep = (key: string, patch: Partial<DraftStep>) => setDraft(d => d ? { ...d, steps: d.steps.map(s => s.key === key ? { ...s, ...patch } : s) } : d)
  const moveStep = (i: number, dir: -1 | 1) => setDraft(d => {
    if (!d) return d
    const steps = [...d.steps]
    const j = i + dir
    if (j < 0 || j >= steps.length) return d
    ;[steps[i], steps[j]] = [steps[j], steps[i]]
    return { ...d, steps }
  })

  const others = sequences.filter(s => s.id !== draft?.id && s.audience === audience)

  return (
    <div style={s.wrap}>
      {dialog}
      {/* ─── Le chemin ─── */}
      <aside style={s.path}>
        <div style={s.pathHead}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>Le chemin {WHO[audience]} chez nous</span>
          <button type="button" onClick={newSequence} style={ui.btnSoft}><Plus size={13} weight="bold" /> Séquence</button>
        </div>
        {!list.length && (
          <div style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={ui.sub}>Aucune séquence pour cette audience. J&apos;en ai préparé pour les photographes, les équipes de ménage et les hôtes : elles s&apos;installent en pause, tu les relis avant de les lancer.</p>
            <button type="button" onClick={install} disabled={busy === 'install'} style={ui.btn}><Sparkle size={14} weight="fill" /> Installer les séquences proposées</button>
          </div>
        )}
        {GROUPS.map(g => {
          const items = list.filter(x => GROUPS.find(gg => gg.match(x))?.n === g.n)
          return (
            <div key={g.n} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={s.groupHead}>
                <span><strong style={{ color: 'var(--text)' }}>{g.n} {g.title}</strong></span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'right' }}>{g.sub}</span>
              </div>
              {!items.length && <span style={{ ...ui.pill, alignSelf: 'flex-start', color: AMBER, borderColor: tint(AMBER, 35), background: tint(AMBER, 10) }}>personne n&apos;est accompagné ici</span>}
              {items.map(seq => {
                const on = seq.id === (draft?.id ?? selectedId)
                const days = cumulative(seq.steps)
                return (
                  <button key={seq.id} type="button" onClick={() => select(seq.id)} style={{ ...s.seqCard, ...(on ? s.seqCardOn : {}) }}>
                    <span style={{ ...ui.pill, alignSelf: 'flex-start', ...(seq.enabled ? { color: 'var(--accent-text)', border: '1px solid var(--accent-border)', background: 'var(--accent-bg)' } : {}) }}>
                      <span style={{ width: 6, height: 6, borderRadius: 9, background: seq.enabled ? 'var(--accent-text)' : 'var(--text-3)' }} /> {seq.enabled ? 'En marche' : 'En pause'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{seq.nom}</span>
                    <span style={s.trigLine}><Lightning size={12} weight="fill" /> {seq.trigger === 'etape' ? `Arrive à « ${STAGE_LABEL[seq.trigger_stage as Stage] ?? ''} »` : seq.trigger === 'etiquette' ? `Étiquette « ${seq.trigger_tag ?? ''} »` : TRIGGER_LABEL[seq.trigger]}</span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      {days.map((d, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>›</span>}
                          <span style={s.dayChip}>J{d}</span>
                        </span>
                      ))}
                    </span>
                    <span style={s.cardFoot}><Users size={13} /> <strong>{seq.counts.en_cours}</strong> personne{seq.counts.en_cours > 1 ? 's' : ''} dedans en ce moment</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </aside>

      {/* ─── Éditeur ─── */}
      <section style={s.editor}>
        {!draft ? (
          <div style={{ ...ui.card, textAlign: 'center', padding: '40px 20px' }}>
            <EnvelopeSimple size={28} weight="duotone" color="var(--accent-text)" />
            <p style={{ ...ui.sub, marginTop: '8px' }}>Choisis une séquence à gauche, ou crée-en une.</p>
          </div>
        ) : (
          <>
            <div style={s.edHead}>
              <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={draft.nom} onChange={e => upd({ nom: e.target.value })} style={s.nameInput} aria-label="Nom de la séquence" />
                {selected && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ ...ui.pill, color: 'var(--accent-text)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}>{selected.counts.en_cours} en cours</span>
                    <span style={ui.pill}>{selected.counts.terminee} terminée{selected.counts.terminee > 1 ? 's' : ''}</span>
                    <span style={ui.pill}>{selected.counts.arretee} arrêtée{selected.counts.arretee > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selected.trigger !== 'etape' && (
                    <button type="button" onClick={launch} disabled={!ready.length || busy === 'launch'} style={{ ...ui.btnGhost, opacity: ready.length ? 1 : 0.5 }} title="Les contacts « À contacter » qui ne sont dans aucune séquence">
                      <Rocket size={14} weight="bold" /> Lancer pour {ready.length} contact{ready.length > 1 ? 's' : ''}
                    </button>
                  )}
                  <button type="button" onClick={toggle} disabled={busy === 'toggle'} style={s.toggle} aria-pressed={selected.enabled}>
                    <span style={{ ...s.switch, ...(selected.enabled ? s.switchOn : {}) }}><span style={{ ...s.switchDot, ...(selected.enabled ? { left: '16px' } : {}) }} /></span>
                    {selected.enabled ? 'En marche' : 'En pause'}
                  </button>
                  <button type="button" onClick={remove} style={ui.btnDanger} aria-label="Supprimer la séquence"><Trash size={14} weight="bold" /></button>
                </div>
              )}
            </div>

            {msg && <div style={{ ...ui.notice, ...(msg.ok ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' } : { background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }) }}>{msg.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />} {msg.ok ?? msg.err}</div>}

            <div style={s.canvas}>
              <div style={s.column}>
                {/* Quand */}
                <div style={s.whenCard}>
                  <span style={s.whenIcon}><Lightning size={16} weight="fill" /></span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={s.kicker}>Quand</span>
                    <select value={draft.trigger} onChange={e => upd({ trigger: e.target.value as Draft['trigger'] })} style={ui.input}>
                      {(Object.keys(TRIGGER_LABEL) as Array<keyof typeof TRIGGER_LABEL>).map(k => <option key={k} value={k}>{TRIGGER_LABEL[k]}</option>)}
                    </select>
                    {draft.trigger === 'etape' && (
                      <select value={draft.trigger_stage ?? ''} onChange={e => upd({ trigger_stage: (e.target.value || null) as Stage | null })} style={ui.input}>
                        <option value="">Choisir l&apos;étape…</option>
                        {STAGES.filter(st => !['a_trouver', 'desinscrit', 'invalide'].includes(st.key)).map(st => <option key={st.key} value={st.key}>Le contact passe en « {st.label} »</option>)}
                      </select>
                    )}
                    {draft.trigger === 'etiquette' && (
                      <>
                        <input list="prosp-tags" value={draft.trigger_tag ?? ''} onChange={e => upd({ trigger_tag: e.target.value })} placeholder="Ex. Salon Lyon, Recommandé, Chaud…" style={ui.input} aria-label="Étiquette qui déclenche la séquence" />
                        <datalist id="prosp-tags">{knownTags.map(t => <option key={t} value={t} />)}</datalist>
                      </>
                    )}
                    <span style={ui.sub}>
                      {draft.trigger === 'etiquette' && 'Le contact entre dès que tu lui ajoutes cette étiquette (sur sa fiche, ou à plusieurs depuis la sélection).'}
                      {draft.trigger === 'manuel' && 'Tu choisis qui entre : bouton « Lancer » ou sélection dans l\'onglet Contacts.'}
                      {draft.trigger === 'nouveau_contact' && 'À chaque passage, les contacts « À contacter » de l\'audience, jamais contactés, entrent tout seuls.'}
                      {draft.trigger === 'etape' && 'Le contact entre dès qu\'il arrive à cette étape (à la main, ou quand l\'app détecte son inscription).'}
                    </span>
                  </div>
                </div>

                <div style={s.stopBox}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" checked={draft.stop_on_reply} onChange={e => upd({ stop_on_reply: e.target.checked })} style={{ marginTop: '3px', accentColor: 'var(--accent-text)' }} />
                    <span>
                      <strong>Une réponse du contact arrête la séquence.</strong>
                      <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-3)', marginTop: '2px' }}>La boîte est lue chaque jour ouvré : le contact passe en « A répondu » et tu reprends la main. Une désinscription ou un rebond arrêtent toujours tout.</span>
                    </span>
                  </label>
                </div>

                {draft.steps.map((st, i) => {
                  const here = selected?.atStep[i] ?? 0
                  const isPreview = !!preview[st.key]
                  const vars = { ...EXAMPLE, prenom: guessFirstName(EXAMPLE.prenom, EXAMPLE.nom) }
                  return (
                    <div key={st.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div style={s.connector}>
                        <span style={s.line} />
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <label style={s.delay}>
                            {i === 0 ? 'Départ +' : 'Puis +'}
                            <input type="number" min={0} max={90} value={st.delay_days} onChange={e => updStep(st.key, { delay_days: Math.max(0, Math.min(90, parseInt(e.target.value) || 0)) })} style={s.delayInput} aria-label={`Délai de l'e-mail ${i + 1}`} />
                            j
                          </label>
                          {i > 0 && (
                            <label style={s.thread}>
                              <input type="checkbox" checked={st.same_thread} onChange={e => updStep(st.key, { same_thread: e.target.checked })} style={{ accentColor: 'var(--accent-text)' }} />
                              dans le même fil
                            </label>
                          )}
                        </div>
                        <span style={s.line} />
                      </div>
                      <div style={s.stepCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px 10px', flexWrap: 'wrap' }}>
                          <span style={s.stepIcon}><EnvelopeSimple size={15} weight="bold" /></span>
                          <span style={s.kicker}>E-mail {i + 1}</span>
                          <span style={{ flex: 1 }} />
                          {here > 0 && <span style={{ ...ui.pill, color: 'var(--accent-text)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}><Users size={12} /> {here} ici</span>}
                          <button type="button" onClick={() => setPreview(p => ({ ...p, [st.key]: !p[st.key] }))} style={s.iconBtn} aria-label={isPreview ? 'Modifier' : 'Aperçu'} title={isPreview ? 'Modifier' : 'Aperçu avec un exemple'}>
                            {isPreview ? <PencilSimple size={14} weight="bold" /> : <Eye size={14} weight="bold" />}
                          </button>
                          <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} style={{ ...s.iconBtn, opacity: i === 0 ? 0.35 : 1 }} aria-label="Monter"><ArrowUp size={14} weight="bold" /></button>
                          <button type="button" onClick={() => moveStep(i, 1)} disabled={i === draft.steps.length - 1} style={{ ...s.iconBtn, opacity: i === draft.steps.length - 1 ? 0.35 : 1 }} aria-label="Descendre"><ArrowDown size={14} weight="bold" /></button>
                          <button type="button" onClick={() => setDraft(d => d ? { ...d, steps: d.steps.filter(x => x.key !== st.key) } : d)} disabled={draft.steps.length === 1} style={{ ...s.iconBtn, opacity: draft.steps.length === 1 ? 0.35 : 1 }} aria-label="Supprimer l'e-mail"><Trash size={14} weight="bold" /></button>
                        </div>
                        {isPreview ? (
                          <div style={s.previewBox}>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{i > 0 && st.same_thread ? 'Re: ' : ''}{renderTemplate(i > 0 && st.same_thread ? draft.steps[0].subject : st.subject, vars)}</div>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>{renderTemplate(st.body, vars)}</div>
                          </div>
                        ) : (
                          <>
                            <input value={st.subject} onChange={e => updStep(st.key, { subject: e.target.value })} style={{ ...ui.input, fontWeight: 700 }} placeholder="Objet" aria-label={`Objet de l'e-mail ${i + 1}`} />
                            {i > 0 && st.same_thread && <span style={ui.sub}>Dans le même fil, l&apos;objet affiché sera « Re: » + l&apos;objet du premier e-mail.</span>}
                            <textarea value={st.body} onChange={e => updStep(st.key, { body: e.target.value })} rows={Math.min(24, Math.max(6, st.body.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 68)), 1)))} style={ui.textarea} aria-label={`Texte de l'e-mail ${i + 1}`} />
                          </>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{st.body.split(/\s+/).filter(Boolean).length} mots · signature et lien de désinscription ajoutés</span>
                          <button type="button" onClick={() => test(st)} disabled={busy === `test-${st.key}`} style={ui.btnGhost}><PaperPlaneTilt size={13} weight="bold" /> {busy === `test-${st.key}` ? 'Envoi…' : 'M\'envoyer un essai'}</button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div style={s.connector}><span style={s.line} /></div>
                <button type="button" onClick={() => setDraft(d => d ? { ...d, steps: [...d.steps, { key: newKey(), delay_days: 4, subject: d.steps[0]?.subject ?? '', body: 'Bonjour {prenom},\n\n', same_thread: true }] } : d)} style={ui.btnSoft}>
                  <Plus size={13} weight="bold" /> Ajouter un e-mail
                </button>
                <div style={s.connector}><span style={s.line} /></div>

                {/* Fin de séquence */}
                <div style={s.endCard}>
                  <span style={s.kicker}>À la fin, sans réponse</span>
                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13.5px', color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={!!draft.repeat_after_days && draft.max_repeats > 0} onChange={e => upd(e.target.checked ? { repeat_after_days: 60, max_repeats: 1 } : { repeat_after_days: null, max_repeats: 0 })} style={{ accentColor: 'var(--accent-text)' }} />
                    <ArrowsClockwise size={15} weight="bold" color="var(--accent-text)" /> Recommencer
                    {!!draft.repeat_after_days && draft.max_repeats > 0 && (
                      <>
                        après <input type="number" min={7} max={365} value={draft.repeat_after_days} onChange={e => upd({ repeat_after_days: parseInt(e.target.value) || 60 })} style={s.delayInput} /> jours,
                        <input type="number" min={1} max={5} value={draft.max_repeats} onChange={e => upd({ max_repeats: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) })} style={s.delayInput} /> fois
                      </>
                    )}
                  </label>
                  <label style={ui.label}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowBendDownRight size={14} weight="bold" /> Puis passer dans la séquence</span>
                    <select value={draft.then_sequence_id ?? ''} onChange={e => upd({ then_sequence_id: e.target.value || null })} style={ui.input}>
                      <option value="">Aucune</option>
                      {others.map(o => <option key={o.id} value={o.id}>{o.nom}{o.enabled ? '' : ' (en pause)'}</option>)}
                    </select>
                  </label>
                  <label style={ui.label}>
                    Et mettre le contact en
                    <select value={draft.end_stage ?? ''} onChange={e => upd({ end_stage: (e.target.value || null) as Stage | null })} style={ui.input}>
                      <option value="">Ne rien changer</option>
                      {STAGES.filter(x => ['pas_interesse', 'contacte', 'a_contacter'].includes(x.key)).map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
                    </select>
                  </label>
                </div>

                <p style={{ ...ui.sub, textAlign: 'center', maxWidth: '520px' }}>
                  Variables : {'{prenom}'}, {'{ville}'}, {'{entreprise}'}. Écris {'{ à ville}'} pour « à Lyon » qui disparaît quand la ville est inconnue.
                  Audience : {AUDIENCES[draft.audience].plural.toLowerCase()}.
                </p>
              </div>
            </div>

            {(dirty || isNew) && (
              <div style={s.saveBar}>
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{isNew ? 'Nouvelle séquence, pas encore enregistrée' : 'Modifications non enregistrées'}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => selected ? setDraft(toDraft(selected)) : setDraft(null)} style={ui.btnGhost}>Annuler</button>
                  <button type="button" onClick={save} disabled={busy === 'save'} style={ui.btn}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'flex-start' },
  path: { flex: '1 1 320px', maxWidth: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
  pathHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--border)' },
  groupHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', fontSize: '13px', color: 'var(--text-2)', padding: '0 2px' },
  seqCard: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
  // `border` complet, jamais `borderColor` seul : React efface la couleur au
  // déselectionnement et la bordure restait noire (couleur du texte)
  seqCardOn: { border: '1px solid var(--accent-text)', boxShadow: '0 0 0 3px var(--accent-bg)' },
  trigLine: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-2)' },
  dayChip: { fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '7px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' },
  cardFoot: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: '8px' },
  editor: { flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px', position: 'relative' },
  edHead: { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' },
  nameInput: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', color: 'var(--text)', border: '1px solid transparent', background: 'transparent', padding: '4px 6px', marginLeft: '-6px', borderRadius: '10px', width: '100%', boxSizing: 'border-box' },
  toggle: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' },
  switch: { width: '34px', height: '20px', borderRadius: '999px', background: 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background .15s' },
  switchOn: { background: 'var(--accent-text)' },
  switchDot: { position: 'absolute', top: '2px', left: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .15s' },
  canvas: {
    borderRadius: '16px', padding: 'clamp(12px, 2vw, 22px) clamp(8px, 1.5vw, 14px)', border: '1px solid var(--border)',
    backgroundColor: 'var(--bg)', backgroundImage: 'radial-gradient(color-mix(in srgb, var(--text-3) 35%, transparent) 1px, transparent 1px)', backgroundSize: '16px 16px',
  },
  column: { maxWidth: '620px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' },
  whenCard: { width: '100%', display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '16px', background: 'color-mix(in srgb, var(--accent-bg) 70%, var(--surface))', border: '1px solid var(--accent-border)', boxSizing: 'border-box' },
  whenIcon: { width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kicker: { fontSize: '11px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)' },
  stopBox: { width: '100%', marginTop: '12px', padding: '12px 14px', borderRadius: '14px', background: tint(AMBER, 9), border: `1px dashed ${tint(AMBER, 40)}`, fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.5, boxSizing: 'border-box' },
  connector: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0' },
  line: { width: '2px', height: '14px', background: 'var(--border)' },
  delay: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-2)' },
  delayInput: { width: '52px', padding: '4px 6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', textAlign: 'center' },
  thread: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-2)', cursor: 'pointer' },
  stepCard: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', boxSizing: 'border-box' },
  stepIcon: { width: '30px', height: '30px', borderRadius: '9px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 },
  iconBtn: { width: '30px', height: '30px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  previewBox: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' },
  endCard: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 16px', borderRadius: '16px', background: 'var(--surface)', border: '1px dashed var(--accent-border)', boxSizing: 'border-box', marginBottom: '14px' },
  saveBar: { position: 'sticky', bottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--accent-border)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', zIndex: 5 },
}
