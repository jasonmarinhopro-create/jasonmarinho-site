'use client'

// Inscription en 3 temps (refonte du 31/10/2026, maquette validée par Jason) :
// 1. Profil (liste unique tirée de lib/auth/profils.ts : un métier = une entrée)
// 2. Compte (hôte, investisseur) ou présentation de la fiche (pros, qui
//    continuent sur l'inscription du site : fiche + paiement)
// 3. Confirmation : le lien de l'e-mail ouvre l'espace, déjà connecté.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Camera, ChartLineUp, Check, EnvelopeSimple, HouseLine, Sparkle, Wrench,
} from '@phosphor-icons/react/dist/ssr'
import JmLogo from '@/components/JmLogo'
import GoogleButton from '@/components/auth/GoogleButton'
import { captureAcquisition, storedAcquisition, acquisitionParams } from '@/lib/acquisition/client'
import {
  ACCUEIL, GROUPES, PROFILS, compteDansLApp, profil as trouverProfil, profilDepuisRole,
  type IconeProfil, type ProfilId,
} from '@/lib/auth/profils'

const ICONES: Record<IconeProfil, typeof HouseLine> = {
  maison: HouseLine, courbe: ChartLineUp, appareil: Camera, eclat: Sparkle, cle: Wrench,
}

const C = {
  vert: '#004C3F', vertFonce: '#00332A', jaune: '#FFD56B', texte: '#0B1D0F', doux: '#4A5A4E',
  discret: '#5C6B60', trait: '#E2E6E0', champ: '#D6DBD5', fond: '#FBFAF6', vertPale: '#EEF3EE',
}

const CSS = `
  .rf-panel { display: flex; }
  .rf-mbar { display: none; }
  .rf-choice:hover:not(:disabled) { border-color: rgba(0,76,63,0.45) !important; }
  .rf-input:focus { outline: none; border-color: #004C3F !important; box-shadow: 0 0 0 3px rgba(0,76,63,0.12); }
  .rf-link { color: #004C3F; text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 900px) {
    .rf-panel { display: none; }
    .rf-mbar { display: flex; }
    .rf-main { padding: 16px 16px 40px !important; }
    .rf-steps-label { display: none; }
  }
`

type Etape = 1 | 2 | 3

export default function RegisterFlow({ google }: { google: boolean }) {
  const params = useSearchParams()
  const inviterRef = params?.get('ref') ?? null
  const inviterFrom = params?.get('from') ?? null
  const depart = inviterRef ? 'host' : profilDepuisRole(params?.get('role'))

  const [choix, setChoix] = useState<ProfilId | null>(depart)
  const [etape, setEtape] = useState<Etape>(depart ? 2 : 1)

  // Formulaire
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [driingOuvert, setDriingOuvert] = useState(false)
  const [isDriing, setIsDriing] = useState(false)
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(true)
  const [renvoiDans, setRenvoiDans] = useState(0)
  const [renvoye, setRenvoye] = useState(false)
  const formLoadedAt = useRef<number>(Date.now())

  useEffect(() => { captureAcquisition(params) }, [params])
  useEffect(() => {
    if (renvoiDans <= 0) return
    const t = setTimeout(() => setRenvoiDans(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [renvoiDans])

  const p = trouverProfil(choix)
  const investor = choix === 'investor'
  const panel = p ? { accroche: p.accroche, points: p.points } : ACCUEIL

  function choisir(id: ProfilId) {
    setChoix(id)
    setError('')
  }

  async function envoyer(): Promise<boolean> {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, fullName, isDriingMember: isDriing, newsletterConsent: newsletter,
        website, ts: formLoadedAt.current, isInvestor: investor, acquisition: storedAcquisition(),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || 'Une erreur est survenue.'); return false }
    setEmailSent(data.emailSent !== false)
    return true
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    try {
      if (await envoyer()) { setEtape(3); setRenvoiDans(60); setRenvoye(false) }
    } catch {
      setError('Erreur réseau. Réessaie.')
    }
    setLoading(false)
  }

  async function renvoyer() {
    if (renvoiDans > 0) return
    setRenvoiDans(60)
    try { if (await envoyer()) setRenvoye(true) } catch { setError('Erreur réseau. Réessaie.') }
  }

  const etapes = ['Profil', 'Compte', 'Confirmation']

  return (
    <div data-theme="light" style={{ minHeight: '100svh', display: 'flex', background: C.fond, color: C.texte, fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>
      <style>{CSS}</style>

      {/* Panneau de gauche (ordinateur) */}
      <aside className="rf-panel" style={{ flex: '0 0 clamp(340px, 34vw, 500px)', background: C.vert, color: '#fff', padding: 'clamp(32px,5vh,56px) clamp(32px,3.5vw,56px)', boxSizing: 'border-box', flexDirection: 'column', justifyContent: 'space-between', gap: 40, position: 'sticky', top: 0, height: '100svh' }}>
        <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,213,107,0.3)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><JmLogo size={20} /></span>
          <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 600 }}>Jason <em style={{ color: C.jaune }}>Marinho</em></span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <h1 key={panel.accroche} className="fade-up" style={{ margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(28px, 2.6vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{panel.accroche}</h1>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {panel.points.map(pt => (
              <li key={pt} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>
                <Check size={17} weight="bold" color={C.jaune} style={{ flex: 'none', marginTop: 2 }} />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Données hébergées en Europe. Jamais revendues.</p>
      </aside>

      <main className="rf-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '28px clamp(24px, 4vw, 56px)' }}>
        {/* Barre du haut */}
        <div className="rf-mbar" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.texte }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: C.vert, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><JmLogo size={17} /></span>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 600 }}>Jason <em style={{ color: C.vert }}>Marinho</em></span>
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <ol aria-label="Progression" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {etapes.map((nom, i) => {
              const n = (i + 1) as Etape
              const fait = n < etape, actif = n === etape
              const couleur = fait || actif ? C.vert : '#8A938C'
              return (
                <li key={nom} aria-current={actif ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: couleur }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: `1.5px solid ${couleur}`, background: fait ? C.vert : actif ? '#fff' : 'transparent', color: fait ? '#fff' : couleur }}>
                    {fait ? <Check size={12} weight="bold" /> : n}
                  </span>
                  <span className="rf-steps-label">{nom}</span>
                  {i < etapes.length - 1 && <span aria-hidden="true" style={{ width: 18, height: 1, background: C.champ }} />}
                </li>
              )
            })}
          </ol>
          <Link href="/auth/login" style={{ fontSize: 14, textDecoration: 'none', color: C.doux }}>Déjà un compte ? <strong style={{ color: C.vert }}>Se connecter</strong></Link>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 520, margin: '0 auto', padding: 'clamp(24px, 5vh, 48px) 0' }}>
          {inviterRef && etape < 3 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderRadius: 14, background: '#FFF7DF', border: '1px solid #F2DFA6', marginBottom: 24, fontSize: 14, lineHeight: 1.45 }}>
              <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: C.vert, color: C.jaune, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HouseLine size={17} weight="bold" /></span>
              <span>{inviterFrom ? <><strong>{inviterFrom}</strong> t’invite</> : 'Tu es invité'} à rejoindre l’espace des hôtes. Ton compte est gratuit.</span>
            </div>
          )}

          {etape === 1 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 style={titre}>Bienvenue. Tu es…</h2>
                <p style={{ margin: 0, fontSize: 15, color: C.doux, lineHeight: 1.55 }}>Choisis ton profil, l’espace s’adapte à ton métier. Tu pourras en ajouter un autre plus tard.</p>
              </div>
              {GROUPES.map(g => (
                <div key={g.id} role="radiogroup" aria-label={g.nom} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.discret }}>{g.nom}</span>
                  {PROFILS.filter(x => x.groupe === g.id).map(x => {
                    const sel = choix === x.id
                    const Icon = ICONES[x.icone]
                    const gratuit = x.pastille === 'Gratuit'
                    return (
                      <button
                        key={x.id}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        disabled={x.bientot}
                        onClick={() => choisir(x.id)}
                        onDoubleClick={() => { if (!x.bientot) { choisir(x.id); setEtape(2) } }}
                        className="rf-choice"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
                          padding: '13px 16px', minHeight: 64, borderRadius: 14, fontFamily: 'inherit', color: C.texte,
                          border: `1.5px solid ${sel ? C.vert : C.trait}`, background: sel ? '#F3F7F2' : '#fff',
                          cursor: x.bientot ? 'default' : 'pointer', opacity: x.bientot ? 0.6 : 1,
                          transition: 'border-color .15s, background .15s',
                        }}
                      >
                        <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 11, background: sel ? C.vert : C.vertPale, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
                          <Icon size={20} weight="duotone" color={sel ? C.jaune : C.vert} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>{x.titre}</span>
                          <span style={{ fontSize: 13.5, color: C.doux, lineHeight: 1.4 }}>{x.ligne}</span>
                        </span>
                        <span style={{ flex: 'none', fontSize: 12, fontWeight: 600, padding: '4px 9px', borderRadius: 99, whiteSpace: 'nowrap', background: gratuit ? '#E6F2E8' : x.bientot ? '#F1F3EF' : '#FFF3CC', color: gratuit ? '#1F5E33' : x.bientot ? C.discret : '#6B5200' }}>{x.pastille}</span>
                        <span aria-hidden="true" style={{ width: 20, height: 20, flex: 'none', borderRadius: '50%', border: `1.5px solid ${sel ? C.vert : '#C9D0C8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: sel ? C.vert : 'transparent' }} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
              <button type="button" className="btn-primary" disabled={!p || p.bientot} onClick={() => setEtape(2)} style={{ ...bouton, opacity: p ? 1 : 0.45 }}>
                Continuer <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          )}

          {etape === 2 && p && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <button type="button" onClick={() => setEtape(1)} style={pastilleRetour}>
                <ArrowLeft size={14} weight="bold" color={C.vert} />
                <span>{p.titre}</span>
                <span style={{ color: C.discret }}>Modifier</span>
              </button>

              {compteDansLApp(p) ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h2 style={titre}>Crée ton compte</h2>
                    <p style={{ margin: 0, fontSize: 15, color: C.doux }}>Gratuit, sans carte bancaire. Prêt en 30 secondes.</p>
                  </div>

                  {google && (
                    <>
                      <GoogleButton profil={investor ? 'investor' : 'host'} newsletter={newsletter} />
                      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: C.discret }}>
                        <span style={{ flex: 1, height: 1, background: C.trait }} />ou avec ton e-mail<span style={{ flex: 1, height: 1, background: C.trait }} />
                      </div>
                    </>
                  )}

                  <form onSubmit={creer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={labelStyle}>Prénom et nom
                      <input className="rf-input" style={champ} type="text" autoComplete="name" placeholder="Marie Dupont" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </label>
                    <label style={labelStyle}>Adresse e-mail
                      <input className="rf-input" style={champ} type="email" autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required />
                    </label>
                    <label style={labelStyle}>Mot de passe
                      <span style={{ position: 'relative', display: 'flex' }}>
                        <input className="rf-input" style={{ ...champ, flex: 1, minWidth: 0, paddingRight: 92 }} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="8 caractères minimum" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 6, top: 6, height: 38, padding: '0 12px', borderRadius: 9, border: 'none', background: '#F1F3EF', fontFamily: 'inherit', fontSize: 13, color: '#33443A', cursor: 'pointer' }}>
                          {showPassword ? 'Masquer' : 'Afficher'}
                        </button>
                      </span>
                      {password.length > 0 && password.length < 8 && (
                        <span style={{ fontSize: 12.5, fontWeight: 400, color: C.discret }}>Encore {8 - password.length} caractère{8 - password.length > 1 ? 's' : ''}</span>
                      )}
                    </label>

                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: C.doux, lineHeight: 1.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ width: 18, height: 18, margin: '1px 0 0', accentColor: C.vert, flex: 'none' }} />
                      <span>Recevoir « Le Check-in », la lettre de Jason pour les hôtes. Désinscription en un clic.</span>
                    </label>

                    {!investor && (driingOuvert ? (
                      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: '#F1F5F0', border: '1px solid #DCE5DC', fontSize: 13.5, lineHeight: 1.5, color: '#33443A', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isDriing} onChange={e => setIsDriing(e.target.checked)} style={{ width: 18, height: 18, margin: '1px 0 0', accentColor: C.vert, flex: 'none' }} />
                        <span>Je suis membre Driing. J’utilise l’adresse de mon compte Driing, mon accès Standard est activé sous 24 h.</span>
                      </label>
                    ) : (
                      <button type="button" onClick={() => setDriingOuvert(true)} className="rf-link" style={{ alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, cursor: 'pointer', minHeight: 32 }}>
                        Tu es membre Driing ?
                      </button>
                    ))}

                    {/* Champ piège pour les robots : jamais rempli par un humain */}
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input type="text" name="hp_do_not_fill" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
                    </div>

                    {error && <p role="alert" style={erreur}>{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading} style={bouton}>
                      {loading ? 'Création en cours…' : <>Créer mon compte gratuit <ArrowRight size={16} weight="bold" /></>}
                    </button>
                    <p style={{ margin: 0, fontSize: 12.5, color: C.discret, textAlign: 'center', lineHeight: 1.5 }}>
                      Tes données restent chez nous, voir la <a className="rf-link" href="https://jasonmarinho.com/politique-de-confidentialite">politique de confidentialité</a>.
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h2 style={titre}>Ta fiche en 3 étapes</h2>
                    <p style={{ margin: 0, fontSize: 15, color: C.doux, lineHeight: 1.55 }}>Environ 5 minutes. Ta fiche est enregistrée au fur et à mesure.</p>
                  </div>
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0, border: `1px solid ${C.trait}`, borderRadius: 16, background: '#fff' }}>
                    {[
                      { t: 'Ta fiche', d: 'Photos, formules, zone où tu interviens. Un aperçu se met à jour pendant que tu écris.' },
                      { t: 'Le paiement', d: 'Paiement sécurisé par Stripe. Ton compte est créé au même moment.' },
                      { t: 'En ligne', d: 'Tu arrives dans Ma fiche, déjà connecté, et les hôtes peuvent te contacter.' },
                    ].map((e, i) => (
                      <li key={e.t} style={{ display: 'flex', gap: 14, padding: '16px 18px', borderTop: i ? '1px solid #EEF0EC' : 'none' }}>
                        <span style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', background: C.vertPale, color: C.vert, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{e.t}</span>
                          <span style={{ fontSize: 13.5, color: C.doux, lineHeight: 1.45 }}>{e.d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 18px', borderRadius: 14, background: '#FFF7DF', border: '1px solid #F2DFA6' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Abonnement annuel, sans commission</span>
                    <span style={{ fontSize: 13.5, color: '#4A4022', lineHeight: 1.45 }}>39,98 € TTC par an pour les 20 premiers inscrits, puis 79,98 € TTC par an.</span>
                  </div>
                  <a
                    href={p.inscriptionPro}
                    rel="external noopener"
                    className="btn-primary"
                    style={{ ...bouton, textDecoration: 'none' }}
                    onClick={e => { const q = acquisitionParams(); if (q && p.inscriptionPro) e.currentTarget.href = `${p.inscriptionPro}?${q}` }}
                  >
                    Commencer ma fiche <ArrowRight size={16} weight="bold" />
                  </a>
                </>
              )}
            </div>
          )}

          {etape === 3 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: C.vertPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EnvelopeSimple size={28} weight="duotone" color={C.vert} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 style={titre}>{emailSent ? 'Plus qu’un clic' : 'Ton compte est créé'}</h2>
                {emailSent ? (
                  <p style={{ margin: 0, fontSize: 15, color: C.doux, lineHeight: 1.6 }}>
                    On t’a envoyé un lien à <strong style={{ color: C.texte, wordBreak: 'break-all' }}>{email}</strong>. Clique dessus et tu arrives directement dans ton espace, déjà connecté.
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 15, color: C.doux, lineHeight: 1.6 }}>
                    L’e-mail de confirmation n’est pas parti tout de suite. Réessaie dans une minute avec le bouton ci-dessous, ou <a className="rf-link" href="https://jasonmarinho.com/contact">écris-nous</a> et on débloque ton accès.
                  </p>
                )}
              </div>
              {emailSent && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href="https://mail.google.com" target="_blank" rel="noopener" style={boutonClair}>Ouvrir Gmail</a>
                  <a href="https://outlook.live.com/mail/" target="_blank" rel="noopener" style={boutonClair}>Ouvrir Outlook</a>
                </div>
              )}
              {error && <p role="alert" style={erreur}>{error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: C.doux, lineHeight: 1.5 }}>
                <span>
                  {renvoye ? 'Nouveau lien envoyé. ' : 'Rien reçu ? Regarde dans les spams, ou '}
                  <button type="button" onClick={renvoyer} disabled={renvoiDans > 0} className="rf-link" style={{ padding: 0, border: 'none', background: 'none', font: 'inherit', cursor: renvoiDans > 0 ? 'default' : 'pointer', opacity: renvoiDans > 0 ? 0.6 : 1 }}>
                    {renvoye ? 'renvoyer encore' : 'renvoie l’e-mail'}
                  </button>
                  {renvoiDans > 0 && ` (dans ${renvoiDans} s)`}
                </span>
                <span>Mauvaise adresse ? <button type="button" onClick={() => { setEtape(2); setError('') }} className="rf-link" style={{ padding: 0, border: 'none', background: 'none', font: 'inherit', cursor: 'pointer' }}>La corriger</button></span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const titre: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(28px, 3vw, 34px)', letterSpacing: '-0.02em', lineHeight: 1.15 }
const bouton: React.CSSProperties = { width: '100%', height: 52, justifyContent: 'center', fontSize: 16 }
const boutonClair: React.CSSProperties = { flex: '1 1 160px', height: 48, borderRadius: 12, border: '1px solid #D6DBD5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#0B1D0F', fontSize: 15, fontWeight: 500 }
const pastilleRetour: React.CSSProperties = { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px 7px 10px', minHeight: 36, borderRadius: 99, border: '1px solid #D6DBD5', background: '#fff', fontFamily: 'inherit', fontSize: 13.5, color: '#0B1D0F', cursor: 'pointer' }
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, fontWeight: 500, color: '#33443A' }
const champ: React.CSSProperties = { height: 50, padding: '0 16px', borderRadius: 12, border: '1px solid #D6DBD5', background: '#fff', fontFamily: 'inherit', fontSize: 16, color: '#0B1D0F', boxSizing: 'border-box', width: '100%' }
const erreur: React.CSSProperties = { margin: 0, fontSize: 13.5, color: '#B91C1C', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 10, padding: '10px 14px' }
