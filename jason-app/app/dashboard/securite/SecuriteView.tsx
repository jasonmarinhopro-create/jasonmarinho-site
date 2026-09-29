'use client'

// Sécurité voyageur (refonte sept. 2026) : même esprit que les autres hubs
// (HubHero vert, 2 colonnes au-delà de ~1000 px de contenu). Une action
// principale : vérifier un voyageur. Puis : tes prochains voyageurs vérifiés
// automatiquement, signaler ou témoigner, tes signalements, et à droite les
// arnaques du moment (sourcées) et les protections déjà dans l'app.
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlass, ShieldCheck, ShieldWarning, Warning, CheckCircle, Info, PaperPlaneRight,
  Star, Trash, CaretDown, FileText, CreditCard, IdentificationCard, LinkSimple, Camera, Flag, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import { Card, CardHead, Notice, ui, dateCourte } from '../finances/_ui/ui'
import { ALL_INCIDENT_TYPES, POSITIVE_TYPES, isPositive, verdictOf, type Verdict } from '@/lib/securite/identifiers'
import Select from '@/components/ui/Select'
import { searchGuest, reportGuest, withdrawMyReport, contestReport, type SearchHit } from './actions'
import { markStepIfNotYet } from '@/lib/onboarding/client'

export interface MyReport {
  id: string
  qui: string
  incident_type: string
  reported_at: string
  positive: boolean
  statut: 'relecture' | 'valide' | 'publie' | 'refuse'
}

export interface UpcomingGuest {
  id: string
  nom: string
  arrivee: string
  logement: string | null
  verifiable: boolean
  motifs: string[]
}

const RED = 'var(--danger)'
const AMBER = '#B7791F'

const ARNAQUES: Array<{ titre: string; comment: string; reflexe: string; source?: { label: string; url: string } }> = [
  {
    titre: 'Faux virement Wero',
    comment: "Le « voyageur » t'envoie un SMS ou un e-mail qui imite une notification Wero, souvent avec un lien pour « valider » ou « débloquer » le paiement. Le virement n'existe pas et le lien sert à voler tes accès bancaires.",
    reflexe: "Wero n'envoie jamais de SMS ni d'e-mail avec un lien. Pour recevoir un paiement, tu n'as rien à faire : vérifie seulement dans ton appli bancaire.",
    source: { label: 'Wero, page sécurité', url: 'https://wero-wallet.eu/fr/securite' },
  },
  {
    titre: 'Le trop-perçu à rembourser',
    comment: "Le voyageur paie plus que prévu « par erreur » et te demande de rembourser la différence. Quelques jours plus tard, son paiement est annulé : tu as remboursé de l'argent qui n'a jamais existé.",
    reflexe: "Ne rembourse jamais un trop-perçu. Annule et fais repayer le bon montant par le lien de paiement du contrat.",
    source: { label: 'Les clés de la banque (FBF)', url: 'https://www.lesclesdelabanque.com/particulier/arnaques-locations-vacances/' },
  },
  {
    titre: 'Faux message Booking ou Airbnb',
    comment: "Un e-mail « de la plateforme » parle d'un voyageur mécontent ou d'un paiement à confirmer et te fait cliquer pour te connecter. Le but : prendre ton compte hôte, puis écrire à tes voyageurs pour leur voler leurs coordonnées bancaires.",
    reflexe: "N'utilise pas le lien : ouvre toi-même l'appli ou le site de la plateforme. Active la double authentification sur tes comptes hôte.",
    source: { label: 'The Register, mars 2025', url: 'https://www.theregister.com/2025/03/13/bookingdotcom_phishing_campaign/' },
  },
  {
    titre: 'La réservation directe sans contrat',
    comment: "Un voyageur pressé refuse le contrat et la caution, propose de payer en liquide à l'arrivée ou par un moyen que tu ne peux pas vérifier. En cas de dégât ou d'impayé, tu n'as ni preuve ni recours.",
    reflexe: "Contrat signé en ligne, paiement par lien, caution par empreinte : un voyageur honnête accepte sans discuter.",
  },
  {
    titre: 'La fausse réclamation après le séjour',
    comment: "Le voyageur affirme avoir trouvé de la saleté, des nuisibles ou une panne, parfois avec des photos retouchées ou générées par IA, pour obtenir un remboursement.",
    reflexe: "Des photos datées du logement avant chaque arrivée (ton équipe de ménage peut les envoyer depuis l'app) et une réponse factuelle, par écrit.",
  },
]

const PROTECTIONS = [
  { icon: FileText, titre: 'Contrat signé en ligne', texte: 'Identité, dates, règlement et conditions d\'annulation acceptés avant l\'arrivée.', href: '/dashboard/contrats', cta: 'Contrats & paiements' },
  { icon: LinkSimple, titre: 'Paiement par lien Stripe', texte: 'Le loyer arrive sur ton compte : pas de virement à « vérifier », pas de trop-perçu.', href: '/dashboard/contrats', cta: 'Créer un contrat' },
  { icon: CreditCard, titre: 'Caution par empreinte', texte: 'Bloquée 2 jours avant l\'arrivée, libérée ou encaissée après le départ (formule Standard).', href: '/dashboard/aide/contrats-paiements/encaisser-loyer-caution', cta: 'Comment ça marche' },
  { icon: IdentificationCard, titre: 'Check-in en ligne', texte: 'Le voyageur remplit son identité et sa pièce d\'identité avant d\'arriver.', href: '/dashboard/voyageurs', cta: 'Mes voyageurs' },
  { icon: Camera, titre: 'Photos de fin de ménage', texte: 'L\'état du logement daté avant chaque arrivée : ta preuve en cas de litige.', href: '/dashboard/calendrier/menage', cta: 'Planning ménage' },
]

const VERDICT: Record<Verdict, { color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  aucun: { color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)', icon: ShieldCheck },
  positif: { color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)', icon: Star },
  vigilance: { color: AMBER, bg: 'rgba(255,213,107,0.14)', border: 'rgba(183,121,31,0.35)', icon: Warning },
  risque: { color: RED, bg: 'var(--danger-bg)', border: 'rgba(239,68,68,0.30)', icon: ShieldWarning },
  eleve: { color: RED, bg: 'var(--danger-bg)', border: 'rgba(239,68,68,0.30)', icon: ShieldWarning },
}

const STATUT: Record<MyReport['statut'], { label: string; color: string; bg: string }> = {
  relecture: { label: 'En relecture', color: AMBER, bg: 'rgba(255,213,107,0.16)' },
  valide: { label: 'Visible par les hôtes', color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  publie: { label: 'Publié anonymisé', color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  refuse: { label: 'Non retenu', color: 'var(--text-3)', bg: 'var(--bg-2)' },
}

function moisAnnee(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

const plural = (n: number, s: string, p = `${s}s`) => `${n} ${n > 1 ? p : s}`

export default function SecuriteView({ totalNegative, totalPositive, myReports, upcoming, initialQuery, prefill }: {
  totalNegative: number
  totalPositive: number
  myReports: MyReport[]
  upcoming: UpcomingGuest[]
  initialQuery: string
  prefill: { email: string; phone: string; full_name: string } | null
}) {
  // ── Recherche ────────────────────────────────────────────────────────
  const [query, setQuery] = useState(initialQuery)
  const [search, setSearch] = useState<{ label: string; kind: string; hits: SearchHit[] } | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, startSearch] = useTransition()
  const [contested, setContested] = useState<Record<string, 'form' | 'sent'>>({})
  const [contestReason, setContestReason] = useState('')

  function runSearch(q: string) {
    setSearchError('')
    startSearch(async () => {
      const res = await searchGuest(q)
      if (res.error) { setSearch(null); setSearchError(res.error); return }
      setSearch({ label: res.label ?? q, kind: res.kind ?? '', hits: res.results })
      void markStepIfNotYet('reported_search')
    })
  }

  useEffect(() => {
    void markStepIfNotYet('reported_view')
    if (initialQuery) runSearch(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Signaler / témoigner ────────────────────────────────────────────
  const formRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'probleme' | 'positif' | null>(prefill ? 'probleme' : null)
  const emptyForm = { email: '', phone: '', full_name: '', incident_type: '', description: '', make_public: false, public_summary: '', public_city: '' }
  const [form, setForm] = useState({ ...emptyForm, ...(prefill ?? {}) })
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState<'probleme' | 'positif' | null>(null)
  const [isSending, startSend] = useTransition()

  useEffect(() => {
    if (prefill) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [prefill])

  function openForm(m: 'probleme' | 'positif', fromSearch?: string) {
    setMode(m)
    setSent(null)
    setFormError('')
    if (fromSearch) {
      const isEmail = fromSearch.includes('@')
      const isPhone = /^\+?[\d\s.()/-]+$/.test(fromSearch)
      setForm(f => ({ ...f, email: isEmail ? fromSearch : f.email, phone: isPhone ? fromSearch : f.phone, full_name: !isEmail && !isPhone ? fromSearch : f.full_name }))
    }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!mode) return
    const incident = form.incident_type || (mode === 'positif' ? POSITIVE_TYPES[0] : '')
    if (!incident) { setFormError('Choisis un motif.'); return }
    setFormError('')
    startSend(async () => {
      const res = await reportGuest({ ...form, incident_type: incident, make_public: mode === 'probleme' && form.make_public })
      if (res.error) { setFormError(res.error); return }
      setSent(mode)
      setMode(null)
      setForm(emptyForm)
    })
  }

  // ── Mes signalements ────────────────────────────────────────────────
  const [mine, setMine] = useState(myReports)
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null)
  const [withdrawMsg, setWithdrawMsg] = useState<Record<string, string>>({})
  const [isWithdrawing, startWithdraw] = useTransition()

  function withdraw(id: string) {
    startWithdraw(async () => {
      const res = await withdrawMyReport(id)
      setConfirmWithdraw(null)
      if (res.error) { setWithdrawMsg(m => ({ ...m, [id]: res.error! })); return }
      if (res.requested) { setWithdrawMsg(m => ({ ...m, [id]: 'Publié sur le site : Jason le retire et te confirme par e-mail.' })); return }
      setMine(list => list.filter(r => r.id !== id))
    })
  }

  const hasIdentifier = !!(form.email.trim() || form.phone.trim() || form.full_name.trim())
  const negatives = search?.hits.filter(h => !isPositive(h.incident_type)) ?? []
  const positives = search?.hits.filter(h => isPositive(h.incident_type)) ?? []
  const verdict = search ? verdictOf(negatives.length, positives.length) : null

  const flaggedUpcoming = upcoming.filter(u => u.motifs.length > 0)
  const uncheckable = upcoming.filter(u => !u.verifiable)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const upcomingShown = showAllUpcoming ? upcoming : upcoming.slice(0, 6)

  return (
    <div style={ui.page}>
      <HubHero
        eyebrowIcon={<ShieldCheck size={14} weight="fill" />}
        eyebrow="Sécurité voyageur"
        title={<>Vérifie un voyageur <HeroEm>avant</HeroEm> de dire oui</>}
        desc="Cherche son e-mail, son téléphone ou son prénom et son nom dans la base tenue par les hôtes de la communauté. Chaque signalement est relu par Jason avant d'apparaître."
        aside={
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>La base de la communauté</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={s.heroNum}>{totalNegative}</div>
                <div style={s.heroLabel}>{totalNegative > 1 ? 'signalements validés' : 'signalement validé'}</div>
              </div>
              <div>
                <div style={s.heroNum}>{totalPositive}</div>
                <div style={s.heroLabel}>{totalPositive > 1 ? 'témoignages positifs' : 'témoignage positif'}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {mine.length > 0
                ? <>Tu y as contribué {mine.length > 1 ? `${mine.length} fois` : 'une fois'}. Merci.</>
                : <>Plus les hôtes signalent, plus la base protège tout le monde.</>}
            </div>
          </div>
        }
      >
        <form onSubmit={e => { e.preventDefault(); runSearch(query) }} style={s.searchRow} role="search">
          <div style={s.searchBox}>
            <MagnifyingGlass size={18} color="var(--text-3)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="marie.dupont@gmail.com, 06 12 34 56 78 ou Marie Dupont"
              aria-label="E-mail, téléphone ou prénom et nom du voyageur"
              style={s.searchInput}
            />
          </div>
          <button type="submit" disabled={isSearching || query.trim().length < 3} style={{ ...ui.btn, padding: '12px 20px', fontSize: 14.5, opacity: isSearching || query.trim().length < 3 ? 0.6 : 1 }}>
            {isSearching ? 'Recherche…' : 'Vérifier'}
          </button>
        </form>
        {searchError
          ? <p role="alert" style={{ margin: '10px 0 0', fontSize: 13.5, color: RED, fontWeight: 600 }}>{searchError}</p>
          : <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>L&apos;e-mail et le téléphone sont plus sûrs que le nom (homonymes). Le téléphone marche avec ou sans +33.</p>}
      </HubHero>

      {/* ── Résultat ─────────────────────────────────────────────────── */}
      {search && verdict && (
        <section aria-live="polite" style={{ ...ui.card, borderColor: VERDICT[verdict].border, padding: 0, overflow: 'hidden' }} className="fade-up">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 'clamp(16px,2.2vw,22px)', background: VERDICT[verdict].bg }}>
            {(() => { const Icon = VERDICT[verdict].icon; return <Icon size={30} weight="fill" color={VERDICT[verdict].color} style={{ flexShrink: 0 }} /> })()}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 20, color: VERDICT[verdict].color, lineHeight: 1.25 }}>
                {verdict === 'aucun' && <>Aucun signalement pour « {search.label} »</>}
                {verdict === 'positif' && <>Que des bons retours pour « {search.label} »</>}
                {verdict === 'vigilance' && <>1 signalement : sois vigilant</>}
                {verdict === 'risque' && <>{negatives.length} signalements : prudence</>}
                {verdict === 'eleve' && <>{negatives.length} signalements : risque élevé</>}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {verdict === 'aucun' && <>Ce voyageur n&apos;est pas dans la base. Ça ne garantit rien : la base ne connaît que les voyageurs déjà croisés par un hôte de la communauté. Garde les bons réflexes : contrat, paiement par lien, caution.</>}
                {verdict === 'positif' && <>{plural(positives.length, 'hôte a laissé', 'hôtes ont laissé')} un témoignage positif, aucun signalement.</>}
                {(verdict === 'vigilance' || verdict === 'risque' || verdict === 'eleve') && <>
                  {plural(negatives.length, 'signalement')} d&apos;hôte{negatives.length > 1 ? 's' : ''}{positives.length > 0 ? ` et ${plural(positives.length, 'témoignage positif', 'témoignages positifs')}` : ''}. Lis les faits ci-dessous, puis décide : demande plus d&apos;informations, exige contrat et caution, ou refuse.
                </>}
              </p>
            </div>
          </div>

          {search.hits.length > 0 && (
            <div style={{ padding: 'clamp(14px,2vw,20px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...negatives, ...positives].map(h => {
                const pos = isPositive(h.incident_type)
                return (
                  <div key={h.id} style={{ ...s.hit, borderLeftColor: pos ? 'var(--accent-text)' : RED }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ ...s.badge, color: pos ? 'var(--accent-text)' : RED, background: pos ? 'var(--accent-bg)' : 'var(--danger-bg)' }}>{h.incident_type}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{moisAnnee(h.reported_at)}</span>
                    </div>
                    {h.description && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{h.description}</p>}
                    <div style={{ marginTop: 8 }}>
                      {contested[h.id] === 'sent' ? (
                        <span style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 600 }}>Merci : Jason vérifie ce signalement.</span>
                      ) : contested[h.id] === 'form' ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input value={contestReason} onChange={e => setContestReason(e.target.value)} placeholder="Pourquoi ? (facultatif)" style={{ ...s.input, flex: '1 1 220px', padding: '7px 10px', fontSize: 13 }} />
                          <button type="button" style={ui.btnGhost} onClick={() => {
                            const reason = contestReason
                            setContested(c => ({ ...c, [h.id]: 'sent' }))
                            setContestReason('')
                            void contestReport({ entry_id: h.id, reason })
                          }}>Envoyer à Jason</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setContested(c => ({ ...c, [h.id]: 'form' }))} style={s.textBtn}>
                          <Flag size={12} /> Ce signalement te semble faux ?
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ padding: '12px clamp(14px,2vw,20px)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, flex: '1 1 300px' }}>
              Témoignages d&apos;hôtes relus avant publication. Ce ne sont pas des décisions de justice.
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={ui.btnGhost} onClick={() => openForm('probleme', search.label)}><Warning size={14} /> Signaler ce voyageur</button>
              <button type="button" style={ui.btnGhost} onClick={() => openForm('positif', search.label)}><Star size={14} /> Témoigner</button>
            </div>
          </div>
        </section>
      )}

      <div style={s.cols}>
        {/* ── Colonne principale ─────────────────────────────────────── */}
        <div style={s.main}>
          <Card>
            <CardHead
              title="Tes prochains voyageurs"
              sub="Vérifiés automatiquement dans la base : ceux qui arrivent dans les 60 jours."
            />
            {upcoming.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
                Aucune arrivée saisie dans les 60 jours. Les réservations Airbnb et Booking importées ne donnent ni nom ni contact : ajoute le voyageur depuis <Link href="/dashboard/reservations" style={ui.link}>Mes réservations</Link> pour qu&apos;il soit vérifié.
              </p>
            ) : (
              <>
                <Notice tone={flaggedUpcoming.length > 0 ? 'warn' : 'ok'}>
                  {flaggedUpcoming.length > 0
                    ? <><strong>{plural(flaggedUpcoming.length, 'voyageur signalé', 'voyageurs signalés')}</strong> parmi tes {upcoming.length} prochaines arrivées. Ouvre sa fiche et sécurise la réservation.</>
                    : <><strong>Aucun signalement</strong> pour tes {plural(upcoming.length, 'prochaine arrivée', 'prochaines arrivées')}{uncheckable.length > 0 ? ` (${uncheckable.length} sans e-mail ni téléphone, donc pas vérifiable${uncheckable.length > 1 ? 's' : ''})` : ''}.</>}
                </Notice>
                <ul style={s.list}>
                  {upcomingShown.map(u => (
                    <li key={u.id} style={s.row}>
                      <span style={{ ...s.dot, background: u.motifs.length > 0 ? RED : u.verifiable ? 'var(--accent-text)' : 'var(--border-2)' }} aria-hidden />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link href={`/dashboard/voyageurs/${u.id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{u.nom}</Link>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                          Arrive le {dateCourte(u.arrivee)}{u.logement ? ` · ${u.logement}` : ''}
                        </div>
                        {u.motifs.length > 0 && <div style={{ fontSize: 12.5, color: RED, marginTop: 2 }}>Signalé : {u.motifs.join(', ')}</div>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: u.motifs.length > 0 ? RED : u.verifiable ? 'var(--accent-text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {u.motifs.length > 0 ? 'Signalé' : u.verifiable ? 'RAS' : 'Pas de contact'}
                      </span>
                    </li>
                  ))}
                </ul>
                {upcoming.length > 6 && (
                  <button type="button" style={{ ...s.textBtn, marginTop: 8 }} onClick={() => setShowAllUpcoming(v => !v)}>
                    {showAllUpcoming ? 'Voir moins' : `Voir les ${upcoming.length} arrivées`}
                  </button>
                )}
              </>
            )}
          </Card>

          <div ref={formRef} id="signaler" style={{ scrollMarginTop: 16 }}>
            <Card>
              <CardHead
                title="Signaler ou témoigner"
                sub="Un problème réel avec un voyageur, ou au contraire un voyageur parfait : partage-le avec les autres hôtes."
              />
              {sent && (
                <div style={{ marginBottom: 12 }}>
                  <Notice tone="ok">
                    <strong>{sent === 'positif' ? 'Témoignage envoyé.' : 'Signalement envoyé.'}</strong> Jason le relit avant qu&apos;il apparaisse dans les recherches. Tu le retrouves dans « Mes signalements ».
                  </Notice>
                </div>
              )}
              <div style={s.segment} role="tablist" aria-label="Type de retour">
                <button type="button" role="tab" aria-selected={mode === 'probleme'} onClick={() => { setMode(m => m === 'probleme' ? null : 'probleme'); setForm(f => ({ ...f, incident_type: '' })) }}
                  style={{ ...s.segBtn, ...(mode === 'probleme' ? { background: 'var(--danger-bg)', color: RED, border: '1px solid rgba(239,68,68,0.35)' } : {}) }}>
                  <Warning size={16} weight={mode === 'probleme' ? 'fill' : 'regular'} /> J&apos;ai eu un problème
                </button>
                <button type="button" role="tab" aria-selected={mode === 'positif'} onClick={() => { setMode(m => m === 'positif' ? null : 'positif'); setForm(f => ({ ...f, incident_type: POSITIVE_TYPES[0] })) }}
                  style={{ ...s.segBtn, ...(mode === 'positif' ? { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' } : {}) }}>
                  <Star size={16} weight={mode === 'positif' ? 'fill' : 'regular'} /> Tout s&apos;est bien passé
                </button>
              </div>

              {mode && (
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                  <fieldset style={s.fieldset}>
                    <legend style={s.label}>Le voyageur <span style={s.labelHint}>(au moins un champ)</span></legend>
                    <div style={s.fields3}>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="E-mail" aria-label="E-mail du voyageur" style={s.input} />
                      <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Téléphone" aria-label="Téléphone du voyageur" style={s.input} />
                      <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Prénom et nom" aria-label="Prénom et nom du voyageur" style={s.input} />
                    </div>
                  </fieldset>

                  <div style={s.fieldCol}>
                    <span style={s.label}>{mode === 'positif' ? 'Ce qui s\'est bien passé' : 'Motif'}</span>
                    <Select
                      value={form.incident_type}
                      onChange={v => setForm(f => ({ ...f, incident_type: v }))}
                      options={(mode === 'positif' ? [...POSITIVE_TYPES] : ALL_INCIDENT_TYPES).map(tp => ({ value: tp, label: tp }))}
                      placeholder="Choisis un motif"
                      ariaLabel={mode === 'positif' ? 'Ce qui s\'est bien passé' : 'Motif du signalement'}
                      minWidth="100%"
                      triggerStyle={{ width: '100%' }}
                    />
                  </div>

                  <label style={s.fieldCol}>
                    <span style={s.label}>Les faits</span>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder={mode === 'positif'
                        ? 'Ex. : séjour de 5 nuits, logement rendu propre, communication rapide et polie.'
                        : 'Ex. : 8 personnes présentes au lieu de 2, musique jusqu\'à 3 h, voisins qui ont appelé. Reste factuel, sans insulte ni supposition.'}
                      style={{ ...s.input, resize: 'vertical', minHeight: 100 }}
                      required
                    />
                    <span style={{ fontSize: 12, color: form.description.trim().length >= 20 ? 'var(--accent-text)' : 'var(--text-3)' }}>
                      {form.description.trim().length >= 20 ? 'Assez détaillé' : `Encore ${20 - form.description.trim().length} caractères au minimum`}
                    </span>
                  </label>

                  {mode === 'probleme' && (
                    <div style={s.optIn}>
                      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.make_public} onChange={e => setForm(f => ({ ...f, make_public: e.target.checked }))} style={{ marginTop: 3, accentColor: 'var(--accent-text)', width: 16, height: 16, flexShrink: 0 }} />
                        <span>
                          <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>Publier aussi une version anonymisée sur jasonmarinho.com</strong>
                          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 2 }}>
                            Pour prévenir les hôtes hors de l&apos;app. Ni nom, ni e-mail, ni téléphone, ni date exacte : seulement ton résumé, relu par Jason.
                          </span>
                        </span>
                      </label>
                      {form.make_public && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                          <textarea
                            value={form.public_summary}
                            onChange={e => setForm(f => ({ ...f, public_summary: e.target.value }))}
                            rows={3}
                            maxLength={600}
                            placeholder="Résumé public, sans aucune donnée personnelle (30 caractères minimum)."
                            aria-label="Résumé public anonymisé"
                            style={{ ...s.input, resize: 'vertical' }}
                          />
                          <input value={form.public_city} onChange={e => setForm(f => ({ ...f, public_city: e.target.value }))} placeholder="Ville (facultatif, sans rue ni quartier)" aria-label="Ville" style={s.input} />
                        </div>
                      )}
                    </div>
                  )}

                  {formError && <p role="alert" style={{ margin: 0, fontSize: 13.5, color: RED, fontWeight: 600 }}>{formError}</p>}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="submit" disabled={isSending || !hasIdentifier || form.description.trim().length < 20}
                      style={{ ...ui.btn, padding: '11px 18px', opacity: isSending || !hasIdentifier || form.description.trim().length < 20 ? 0.55 : 1 }}>
                      <PaperPlaneRight size={15} weight="bold" />
                      {isSending ? 'Envoi…' : mode === 'positif' ? 'Envoyer le témoignage' : 'Envoyer le signalement'}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Relu par Jason avant d&apos;apparaître. Tu restes anonyme pour les autres hôtes.</span>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {mine.length > 0 && (
            <Card>
              <CardHead title="Mes signalements" sub="Ce que tu as partagé et où ça en est." />
              <ul style={s.list}>
                {mine.map(r => (
                  <li key={r.id} style={{ ...s.row, flexWrap: 'wrap' }}>
                    <span style={{ ...s.dot, background: r.positive ? 'var(--accent-text)' : RED }} aria-hidden />
                    <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' }}>{r.qui}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{r.incident_type} · {moisAnnee(r.reported_at)}</div>
                      {withdrawMsg[r.id] && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>{withdrawMsg[r.id]}</div>}
                    </div>
                    <span style={{ ...s.badge, color: STATUT[r.statut].color, background: STATUT[r.statut].bg }}>{STATUT[r.statut].label}</span>
                    {confirmWithdraw === r.id ? (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button type="button" disabled={isWithdrawing} onClick={() => withdraw(r.id)} style={{ ...ui.btnGhost, color: RED, borderColor: 'rgba(239,68,68,0.35)' }}>{isWithdrawing ? '…' : 'Retirer'}</button>
                        <button type="button" onClick={() => setConfirmWithdraw(null)} style={ui.btnGhost}>Annuler</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmWithdraw(r.id)} style={s.iconBtn} aria-label="Retirer ce signalement" title="Retirer ce signalement">
                        <Trash size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Colonne latérale ───────────────────────────────────────── */}
        <aside style={s.side}>
          <Card>
            <CardHead title="Arnaques du moment" sub="Ce que les hôtes voient passer en 2026, et le bon réflexe." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ARNAQUES.map((a, i) => (
                <details key={a.titre} style={s.details} open={i === 0}>
                  <summary style={s.summary}>
                    <Warning size={15} weight="fill" color={AMBER} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{a.titre}</span>
                    <CaretDown size={14} color="var(--text-3)" />
                  </summary>
                  <div style={{ padding: '0 12px 12px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{a.comment}</p>
                    <p style={s.reflexe}><CheckCircle size={14} weight="fill" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: 2 }} /><span>{a.reflexe}</span></p>
                    {a.source && (
                      <a href={a.source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Source : {a.source.label}</a>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Tes protections dans l'app" sub="La base aide à repérer. Ce qui protège vraiment une réservation directe :" />
            <ul style={{ ...s.list, gap: 12 }}>
              {PROTECTIONS.map(p => (
                <li key={p.titre} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={s.protIcon}><p.icon size={17} color="var(--accent-text)" /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.titre}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{p.texte}</div>
                    <Link href={p.href} style={{ ...ui.link, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>{p.cta} <ArrowRight size={12} /></Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55, padding: '0 4px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Base réservée aux membres, traitée selon le RGPD. Une personne signalée peut demander le retrait d&apos;un signalement public sur{' '}
              <a href="https://jasonmarinho.com/securite/contester-signalement" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)' }}>cette page</a>.
              En cas de litige grave, la base ne remplace pas une plainte ou un avocat.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  heroNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 30, lineHeight: 1.1, color: 'var(--text)' },
  heroLabel: { fontSize: 12.5, color: 'var(--text-3)' },
  searchRow: { display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 },
  searchBox: {
    flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--border-2)', minWidth: 0,
  },
  searchInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '12px 0',
    fontFamily: 'inherit', fontSize: 15, color: 'var(--text)',
  },
  cols: { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  main: { flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  side: { flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  hit: { padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid' },
  badge: { display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' },
  textBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--text-3)', textDecoration: 'underline', textUnderlineOffset: 3 },
  list: { listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid var(--border)' },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  segment: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  segBtn: {
    flex: '1 1 200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px',
    borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  fieldset: { border: 'none', margin: 0, padding: 0, minWidth: 0 },
  fields3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, marginTop: 6 },
  fieldCol: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', padding: 0 },
  labelHint: { fontWeight: 500, color: 'var(--text-3)' },
  input: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 12px',
    fontFamily: 'inherit', fontSize: 14, color: 'var(--text)', outline: 'none', minWidth: 0,
  },
  optIn: { padding: '12px 14px', borderRadius: 12, background: 'rgba(255,213,107,0.10)', border: '1px solid rgba(183,121,31,0.25)' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' },
  details: { borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' },
  summary: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', listStyle: 'none' },
  reflexe: { display: 'flex', gap: 8, margin: '10px 0 8px', padding: '8px 10px', borderRadius: 10, background: 'var(--accent-bg)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 },
  protIcon: { width: 32, height: 32, borderRadius: 10, background: 'var(--accent-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
}
