'use client'

// Espace équipe de ménage : « Mes ménages » des 2 prochaines semaines, tous
// clients confondus, avec bouton « Terminé » (+ photos, note) qui prévient
// l'hôte. Les plannings viennent des liens partagés par les hôtes.

import { useMemo, useState, useTransition } from 'react'
import {
  Broom, CheckCircle, Camera, MapPin, Clock, Warning, Trash, Plus, LinkSimple,
  ArrowCounterClockwise, X, CalendarCheck, Lightning, Storefront, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images/compress'
import { addPlanningLink, removePlanningLink, preparePhotoUploads, markMenageTermine, annulerMenageTermine } from './actions'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export interface PlanningClient { linkId: string; hostId: string; label: string; expired: boolean }
export interface PlanningSlot {
  id: string; hostId: string; clientLabel: string
  date: string; startTime: string; endTime: string
  logementName: string; adresse: string | null; notes: string | null
  sameDay: boolean; prochainCheckIn: string | null; fraisMenage: number | null
  done: { byMe: boolean; note: string | null; photoUrls: string[] } | null
}

const MAX_PHOTOS = 8

const STEPS = [
  { title: 'Ton client ouvre son Calendrier', desc: 'Bouton balai, puis « Copier le lien du planning ».' },
  { title: 'Il t’envoie le lien', desc: 'Par SMS, WhatsApp ou email.' },
  { title: 'Tu le colles ici', desc: 'Une seule fois : ses ménages se mettent à jour tout seuls.' },
]
const AMBER = '#B7791F'

function dayLabel(date: string, today: string): string {
  const d = new Date(date + 'T12:00:00')
  const t = new Date(today + 'T12:00:00')
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000)
  const nice = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  if (diff === 0) return `Aujourd'hui · ${nice}`
  if (diff === 1) return `Demain · ${nice}`
  if (diff === -1) return `Hier · ${nice}`
  return nice.charAt(0).toUpperCase() + nice.slice(1)
}

// Les actions (markMenageTermine, addPlanningLink…) appellent revalidatePath sur
// cette page : leur réponse contient déjà le planning à jour, pas de router.refresh().
export default function PlanningMenage({ clients, slots, today, unavailable = false, annuaire = null }: {
  clients: PlanningClient[]; slots: PlanningSlot[]; today: string; unavailable?: boolean
  /** Équipe pas encore dans l'annuaire : proposer la fiche (null si déjà publiée) */
  annuaire?: { hasFiche: boolean; founderLeft: number } | null
}) {
  const [pending, startTransition] = useTransition()
  const [openId, setOpenId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [cancelErr, setCancelErr] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const byDay = useMemo(() => {
    const m = new Map<string, PlanningSlot[]>()
    for (const s of slots) { if (!m.has(s.date)) m.set(s.date, []); m.get(s.date)!.push(s) }
    return [...m.entries()]
  }, [slots])

  const weekEnd = new Date(new Date(today + 'T12:00:00').getTime() + 6 * 86_400_000).toISOString().slice(0, 10)
  const thisWeek = slots.filter(s => s.date >= today && s.date <= weekEnd)
  const doneWeek = thisWeek.filter(s => s.done).length
  const todayList = slots.filter(s => s.date === today)
  const todayLeft = todayList.filter(s => !s.done).length
  const rushWeek = thisWeek.filter(s => s.sameDay && !s.done).length
  const lateCount = slots.filter(s => s.date < today && !s.done).length
  const activeClients = clients.filter(c => !c.expired).length
  const expiredClients = clients.length - activeClients
  const todayNice = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  function openDone(id: string) { setOpenId(id); setFiles([]); setNote(''); setError(null) }

  async function valider(s: PlanningSlot) {
    setBusy(s.id); setError(null)
    try {
      let paths: string[] = []
      if (files.length) {
        const prep = await preparePhotoUploads({ hostId: s.hostId, date: s.date, count: files.length })
        if ('error' in prep) throw new Error(prep.error)
        const sb = createClient()
        paths = await Promise.all(prep.uploads.map(async (u, i) => {
          // 1280 px suffisent pour constater l'état d'une pièce : ~2x plus léger
          // que 1600 px (stockage Supabase gratuit limité à 1 Go)
          const blob = await compressImage(files[i], 1280, 0.72)
          const { error } = await sb.storage.from('menage-photos').uploadToSignedUrl(u.path, u.token, blob, { contentType: 'image/jpeg' })
          if (error) throw new Error('Une photo n’a pas pu être envoyée. Réessaie avec une connexion plus stable.')
          return u.path
        }))
      }
      const res = await markMenageTermine({ hostId: s.hostId, date: s.date, logementName: s.logementName, note, photos: paths })
      if ('error' in res) throw new Error(res.error)
      setOpenId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setBusy(null)
    }
  }

  async function annuler(s: PlanningSlot) {
    if (!(await confirm({ message: 'Annuler « terminé » pour ce ménage ? Les photos envoyées seront supprimées.', confirmLabel: 'Annuler « terminé »', cancelLabel: 'Garder', danger: true }))) return
    setCancelErr(null)
    startTransition(async () => {
      const res = await annulerMenageTermine({ hostId: s.hostId, date: s.date, logementName: s.logementName })
      if ('error' in res) setCancelErr(res.error)
    })
  }

  function ajouterLien() {
    setLinkMsg(null)
    startTransition(async () => {
      const res = await addPlanningLink(linkInput, labelInput)
      if ('error' in res) { setLinkMsg({ ok: false, text: res.error }); return }
      setLinkInput(''); setLabelInput('')
      setLinkMsg({ ok: true, text: 'Planning ajouté.' })
    })
  }

  async function retirerLien(c: PlanningClient) {
    if (!(await confirm({ message: `Retirer le planning de ${c.label} ? Tu pourras le rajouter avec son lien.`, confirmLabel: 'Retirer', danger: true }))) return
    startTransition(async () => { await removePlanningLink(c.linkId) })
  }

  if (unavailable) {
    return (
      <div style={s.empty}>
        <Broom size={26} color="var(--text-3)" />
        <div style={s.emptyTitle}>Planning bientôt disponible</div>
        <div style={s.emptyDesc}>Cette fonctionnalité est en cours d’activation. Reviens dans quelques instants.</div>
      </div>
    )
  }

  return (
    <div>
      {dialog}
      <HubHero
        eyebrowIcon={<Broom size={14} weight="fill" />}
        eyebrow={`Mes ménages · ${todayNice}`}
        title={<>Tes ménages, <HeroEm>planifiés tout seuls</HeroEm></>}
        desc="Les ménages de tes clients sur 2 semaines, calculés à partir de leurs réservations Airbnb, Booking et directes. Quand c’est fini, marque « Terminé » avec quelques photos : ton client est prévenu tout de suite."
        steps={[['Colle', 'le lien de ton client'], ['Fais', 'le ménage prévu'], ['Marque', '« Terminé » avec photos']]}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0 }}>
            <div style={s.asideTitle}>Aujourd’hui</div>
            <div style={s.asideBig}>
              {todayList.length === 0 ? 'Aucun ménage' : todayLeft === 0 ? 'Tout est fait' : `${todayLeft} ménage${todayLeft > 1 ? 's' : ''} à faire`}
            </div>
            <div style={s.asideRows}>
              <span style={s.asideRow}><CalendarCheck size={15} weight="duotone" color="var(--accent-text)" /> <strong>{doneWeek}/{thisWeek.length}</strong>&nbsp;faits sur 7 jours</span>
              {rushWeek > 0 && <span style={s.asideRow}><Lightning size={15} weight="fill" color={AMBER} /> <strong>{rushWeek}</strong>&nbsp;avec arrivée le jour même</span>}
              {lateCount > 0 && <span style={s.asideRow}><Warning size={15} weight="fill" color="var(--danger-text)" /> <strong>{lateCount}</strong>&nbsp;d’hier pas encore marqué{lateCount > 1 ? 's' : ''}</span>}
              <span style={s.asideRow}><LinkSimple size={15} color="var(--accent-text)" /> <strong>{activeClients}</strong>&nbsp;client{activeClients > 1 ? 's' : ''} connecté{activeClients > 1 ? 's' : ''}{expiredClients > 0 ? `, ${expiredClients} lien${expiredClients > 1 ? 's' : ''} expiré${expiredClients > 1 ? 's' : ''}` : ''}</span>
            </div>
          </div>
        }
      />
      {cancelErr && <div style={{ ...s.error, marginBottom: 14 }}><Warning size={13} /> {cancelErr}</div>}

      <style>{`
        .pm-grid { display: grid; grid-template-columns: minmax(0, 1fr) clamp(340px, 24vw, 420px); gap: 24px; align-items: start; }
        .pm-aside { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; }
        .pm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
        @media (max-width: 1100px) {
          .pm-grid { grid-template-columns: minmax(0, 1fr); }
          .pm-aside { position: static; }
        }
        @media (max-width: 480px) { .pm-cards { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div className="pm-grid">
        <div style={{ minWidth: 0 }}>
          {clients.length === 0 ? (
            <div style={s.onboard}>
              <Broom size={28} weight="duotone" color="var(--accent-text)" />
              <div style={s.emptyTitle}>Ajoute le planning de ton premier client</div>
              <div style={s.emptyDesc}>Dès que tu colles son lien, ses ménages des 2 prochaines semaines apparaissent ici, jour par jour.</div>
              <ol style={s.steps}>
                {STEPS.map((step, i) => (
                  <li key={i} style={s.step}>
                    <span style={s.stepNum}>{i + 1}</span>
                    <span><strong style={{ color: 'var(--text)' }}>{step.title}</strong><br />{step.desc}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : slots.length === 0 ? (
            <div style={s.empty}>
              <Broom size={26} color="var(--text-3)" />
              <div style={s.emptyTitle}>Aucun ménage prévu d’ici 2 semaines</div>
              <div style={s.emptyDesc}>Dès qu’un client reçoit une réservation, le ménage du départ apparaît ici.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {byDay.map(([date, list]) => (
                <section key={date}>
                  <div style={{ ...s.day, ...(date === today ? { color: 'var(--accent-text)' } : {}) }}>{dayLabel(date, today)}</div>
                  <div className="pm-cards">
                    {list.map(slot => (
                      <article key={slot.id} style={{ ...s.card, ...(slot.done ? s.cardDone : {}) }}>
                        <div style={s.cardTop}>
                          <div style={{ minWidth: 0 }}>
                            <div style={s.logement}>{slot.logementName}</div>
                            <div style={s.meta}>
                              <span style={s.metaItem}><Clock size={13} /> {slot.startTime} à {slot.endTime}</span>
                              <span style={s.metaItem}>{clients.length > 1 ? slot.clientLabel : ''}</span>
                              {slot.fraisMenage ? <span style={s.metaItem}>{slot.fraisMenage} €</span> : null}
                            </div>
                          </div>
                          {slot.done ? (
                            <span style={s.doneBadge}><CheckCircle size={14} weight="fill" /> Terminé</span>
                          ) : slot.sameDay ? (
                            <span style={s.rushBadge}><Lightning size={13} weight="fill" /> Arrivée le jour même</span>
                          ) : null}
                        </div>

                        {slot.adresse && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(slot.adresse)}`} target="_blank" rel="noopener noreferrer" style={s.address}>
                            <MapPin size={13} /> {slot.adresse}
                          </a>
                        )}
                        {slot.notes && <div style={s.notes}>{slot.notes}</div>}

                        {slot.done ? (
                          <div style={{ marginTop: 10 }}>
                            {slot.done.note && <div style={s.notes}>« {slot.done.note} »</div>}
                            {slot.done.photoUrls.length > 0 && (
                              <div style={s.thumbs}>
                                {slot.done.photoUrls.map(u => (
                                  <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={u} alt="Photo du ménage" style={s.thumb} />
                                  </a>
                                ))}
                              </div>
                            )}
                            {slot.done.byMe ? (
                              <button onClick={() => annuler(slot)} disabled={pending} style={s.linkBtn}>
                                <ArrowCounterClockwise size={13} /> Annuler « terminé »
                              </button>
                            ) : !slot.done.photoUrls.length && (
                              <div style={s.hint}>Coché par ton client.</div>
                            )}
                          </div>
                        ) : openId === slot.id ? (
                          <div style={s.panel}>
                            <label style={s.fileLabel}>
                              <Camera size={16} /> {files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} choisie${files.length > 1 ? 's' : ''}` : 'Ajouter des photos (conseillé)'}
                              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))} />
                            </label>
                            <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
                              placeholder="Un mot pour ton client (optionnel) : linge manquant, casse, produit à racheter…" style={s.textarea} />
                            {error && <div style={s.error}><Warning size={13} /> {error}</div>}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button onClick={() => valider(slot)} disabled={busy === slot.id} style={s.primary}>
                                <CheckCircle size={15} weight="fill" /> {busy === slot.id ? 'Envoi…' : 'Valider le ménage'}
                              </button>
                              <button onClick={() => setOpenId(null)} disabled={busy === slot.id} style={s.secondary}><X size={13} /> Fermer</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                            <button onClick={() => openDone(slot.id)} style={{ ...s.primary, ...s.primaryFull }}>
                              <CheckCircle size={15} /> Marquer terminé
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="pm-aside">
          {annuaire && <AnnuaireCard {...annuaire} />}
          {/* ── Plannings des clients ─────────────────────────────────────── */}
          <section style={s.card}>
            <div style={s.logement}>Plannings de mes clients</div>
            <p style={s.sub}>
              Ton client t’envoie son lien depuis son Calendrier Jason Marinho (bouton balai). Colle-le ici une seule fois : ses ménages s’affichent ensuite automatiquement.
            </p>
            {clients.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0' }}>
                {clients.map(c => (
                  <div key={c.linkId} style={s.clientRow}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: 'var(--text)' }}>{c.label}</span>
                      {c.expired && <span style={s.expired}>Lien expiré : demande-lui le nouveau</span>}
                    </span>
                    <button onClick={() => retirerLien(c)} disabled={pending} style={{ ...s.linkBtn, marginTop: 0, marginLeft: 'auto' }} aria-label={`Retirer ${c.label}`}>
                      <Trash size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <label style={s.fieldLabel}>Lien du planning
                <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://app.jasonmarinho.com/api/calendar/menage-feed?token=…" style={s.input} />
              </label>
              <label style={s.fieldLabel}>Nom du client
                <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Ex : Marie, Studio Vieux-Port" style={s.input} />
              </label>
              <button onClick={ajouterLien} disabled={pending || !linkInput.trim()} style={{ ...s.primary, ...s.primaryFull, ...(pending || !linkInput.trim() ? s.primaryDisabled : {}) }}>
                <Plus size={14} weight="bold" /> Ajouter ce planning
              </button>
            </div>
            {linkMsg && <div style={{ ...s.hint, color: linkMsg.ok ? 'var(--accent-text)' : 'var(--danger-text)' }}>{linkMsg.ok ? <LinkSimple size={12} /> : <Warning size={12} />} {linkMsg.text}</div>}
          </section>
          <section style={s.tip}>
            <div style={{ ...s.logement, fontSize: 14 }}>Bon à savoir</div>
            <ul style={s.tipList}>
              <li>Les ménages suivent les réservations Airbnb, Booking et directes de tes clients.</li>
              <li>« Arrivée le jour même » : des voyageurs arrivent le jour du ménage, à faire en priorité.</li>
              <li>Les photos sont visibles uniquement par ton client, et conservées 90 jours avant d’être supprimées automatiquement.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

// Proposition de fiche dans l'annuaire (05/10/2026) : l'équipe utilise déjà
// l'app avec ses clients ; d'autres hôtes de sa ville la cherchent.
function AnnuaireCard({ hasFiche, founderLeft }: { hasFiche: boolean; founderLeft: number }) {
  const price = founderLeft > 0
    ? <>39,98 € par an, à vie, pour les <strong>{founderLeft} dernière{founderLeft > 1 ? 's' : ''} place{founderLeft > 1 ? 's' : ''} Fondateur</strong></>
    : <>79,98 € par an</>
  return (
    <section style={{ ...s.card, gap: 8, border: '1px solid var(--accent-border)', background: 'color-mix(in srgb, var(--accent-text) 6%, var(--surface))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Storefront size={18} weight="duotone" color="var(--accent-text)" />
        <div style={s.logement}>Trouve d’autres clients</div>
      </div>
      <p style={{ ...s.sub, margin: 0 }}>
        L’annuaire de Jason Marinho et ses guides ménage de 60 villes sont lus par des hôtes qui cherchent une équipe près de chez eux.
        Avec ta fiche, ils te trouvent et t’écrivent directement : sans commission, les demandes arrivent dans ton espace et par e-mail.
      </p>
      <p style={{ ...s.sub, margin: 0 }}>{price}, TVA non applicable.</p>
      <Link href={hasFiche ? '/dashboard/ma-fiche-menage' : '/dashboard/creer-fiche-menage'} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        {hasFiche ? 'Terminer ma fiche' : 'Créer ma fiche'} <ArrowRight size={13} weight="bold" />
      </Link>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideTitle: { fontSize: 12, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  asideBig: { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, color: 'var(--text)', lineHeight: 1.2 },
  asideRows: { display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 },
  asideRow: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-2)', flexWrap: 'wrap' },
  sub: { fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 620, margin: '4px 0 0' },
  day: { fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 8px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column' },
  cardDone: { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  logement: { fontSize: 15.5, fontWeight: 600, color: 'var(--text)' },
  meta: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-2)' },
  doneBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent-text)', whiteSpace: 'nowrap' },
  rushBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#8A5A12', background: 'rgba(255,213,107,0.22)', border: '1px solid rgba(183,121,31,0.30)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' },
  address: { display: 'flex', width: 'fit-content', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--accent-text)', marginTop: 8, textDecoration: 'none' },
  notes: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, marginTop: 6 },
  thumbs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' },
  panel: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' },
  fileLabel: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px dashed var(--border-2)', color: 'var(--text-2)', fontSize: 13.5, cursor: 'pointer', width: 'fit-content' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', minWidth: 0 },
  // Vert de marque, même bouton que le reste de l'app (heroCta)
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' },
  primaryFull: { width: '100%', padding: '11px 16px' },
  primaryDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  fieldLabel: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  onboard: { padding: '40px 28px', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 },
  steps: { listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, width: '100%', maxWidth: 760, marginTop: 18, textAlign: 'left' },
  step: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  stepNum: { flexShrink: 0, width: 24, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg-2)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 700 },
  tip: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 14, padding: '14px 16px' },
  tipList: { margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 },
  secondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12.5, cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  hint: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-3)', marginTop: 8 },
  error: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--danger-text)' },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' },
  expired: { fontSize: 11.5, fontWeight: 600, color: 'var(--danger-text)' },
  empty: { padding: '36px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' },
  emptyDesc: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 440 },
}
