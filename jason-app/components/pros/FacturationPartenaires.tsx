// Page « Facturation » des espaces photographe et ménage (04/10/2026), guide
// de la facture électronique 2027. Décision de Jason : l'app fait les devis
// (page Devis), les factures se font dans une plateforme agréée : nos
// partenaires Tiime et Indy, repliés si le pro a déjà son outil
// (has_invoicing_tool). Liens affiliés : rel="sponsored noopener" + mention.

import {
  Receipt, ArrowSquareOut, CalendarBlank, CheckCircle, Lightbulb, User, Buildings,
  FileText, Star, ListChecks,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { TIIME_URL, INDY_URL } from '@/lib/pros/invoicing-partners'

const COMPARATIF_URL = 'https://jasonmarinho.com/comparatif-indy-tiime-henrri'
const INDY_PAGE_URL = 'https://jasonmarinho.com/partenaires/indy'

const eur = (n: number) => `${n.toLocaleString('fr-FR')} €`

export default function FacturationPartenaires({ kind, hasTool = false, tool = null }: { kind: 'photographer' | 'cleaner'; hasTool?: boolean; tool?: string | null }) {
  const devisHref = kind === 'photographer' ? '/dashboard/ma-fiche-photographe/devis' : '/dashboard/ma-fiche-menage/devis'
  const metier = kind === 'photographer' ? 'photographe' : 'équipe de ménage'
  const pro = kind === 'photographer'
    ? 'une agence immobilière, une conciergerie ou une société'
    : 'une conciergerie ou une société'
  const seuilTva = FISCAL_PARAMS_2026.tva.seuilServices
  const plafondMicro = FISCAL_PARAMS_2026.microBic.classe.plafond

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%' }}>
      <HubHero
        eyebrowIcon={<Receipt size={14} weight="bold" />}
        eyebrow="Facturation"
        title={<>Tes factures, <HeroEm>déjà prêtes pour 2027</HeroEm></>}
        desc={<>Dès septembre 2027, toutes les petites entreprises devront passer par une plateforme agréée par l&apos;État pour facturer : micro-entreprise ou société, avec ou sans TVA. Tes devis, tu les fais ici en 2 minutes. Pour les factures, autant prendre le bon outil dès maintenant.</>}
        steps={[
          ['Fais', 'ton devis ici'],
          ['Fais accepter', 'en ligne par ton client'],
          ['Facture', 'avec ton outil agréé'],
        ]}
        aside={
          <div style={{ ...heroCard, minWidth: 260 }}>
            <div style={s.asideTitle}><CalendarBlank size={16} weight="bold" /> Le calendrier</div>
            <Step date="Depuis le 1er sept. 2026" text="Tu dois pouvoir recevoir des factures électroniques (celles de tes fournisseurs)." done />
            <Step date="1er sept. 2027" text="Tes factures aux pros deviennent électroniques et tes ventes aux particuliers sont déclarées aux impôts (e-reporting)." />
            <Step date="Les devis" text="Pas concernés par la réforme." done />
          </div>
        }
      >
        <Link href={devisHref} style={heroCta}><Receipt size={16} weight="bold" /> Faire un devis</Link>
      </HubHero>

      <div style={s.cols}>
        <div style={s.colMain}>
          {hasTool ? (
            <section style={s.card}>
              <h2 style={s.h2}><CheckCircle size={18} weight="duotone" color="var(--accent-text)" /> Tu factures déjà avec {tool || 'ton outil'}</h2>
              <p style={{ ...s.p, margin: 0 }}>Vérifie seulement qu&apos;il est (ou sera) plateforme agréée avant septembre 2027. Ce réglage se change dans la page Devis.</p>
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--accent-text)' }}>Voir les outils que je recommande</summary>
                <div style={{ marginTop: 14 }}>
                <div style={s.partners}>
                  <Partner
                    name="Tiime"
                    badge="Mon conseil pour démarrer"
                    tagline="Devis et factures, gratuitement"
                    points={[
                      'Devis et factures illimités dans l\'offre gratuite, sans carte bancaire',
                      'Facture électronique : envoi et réception (plateforme agréée)',
                      'Simple à prendre en main, en micro-entreprise comme en société',
                    ]}
                    cta="Créer mon compte gratuit"
                    href={TIIME_URL}
                    more={{ label: 'Comparer Tiime, Indy et Henrri', href: COMPARATIF_URL }}
                    legal="Lien affilié : Tiime verse une commission à Jason Marinho si tu t'inscris par ce lien, sans aucun surcoût pour toi."
                    featured
                  />
                  <Partner
                    name="Indy"
                    badge="1er mois offert"
                    tagline="Facturation, suivi de tes recettes et compte pro"
                    points={[
                      'Offre gratuite : facturation, facture électronique (plateforme agréée), suivi des recettes',
                      'Un compte pro si tu veux séparer tes dépenses perso et pro',
                      'Code PREMIERMOIS : 1er mois offert sur les offres payantes, sans engagement',
                    ]}
                    cta="Essayer Indy"
                    href={INDY_URL}
                    more={{ label: 'Mon avis sur Indy', href: INDY_PAGE_URL }}
                    legal="Lien affilié : Indy verse une commission à Jason Marinho si tu t'inscris par ce lien, sans aucun surcoût pour toi."
                  />
                </div>
                </div>
              </details>
            </section>
          ) : (
            <>
            <div style={s.partners}>
              <Partner
                name="Tiime"
                badge="Mon conseil pour démarrer"
                tagline="Devis et factures, gratuitement"
                points={[
                  'Devis et factures illimités dans l\'offre gratuite, sans carte bancaire',
                  'Facture électronique : envoi et réception (plateforme agréée)',
                  'Simple à prendre en main, en micro-entreprise comme en société',
                ]}
                cta="Créer mon compte gratuit"
                href={TIIME_URL}
                more={{ label: 'Comparer Tiime, Indy et Henrri', href: COMPARATIF_URL }}
                legal="Lien affilié : Tiime verse une commission à Jason Marinho si tu t'inscris par ce lien, sans aucun surcoût pour toi."
                featured
              />
              <Partner
                name="Indy"
                badge="1er mois offert"
                tagline="Facturation, suivi de tes recettes et compte pro"
                points={[
                  'Offre gratuite : facturation, facture électronique (plateforme agréée), suivi des recettes',
                  'Un compte pro si tu veux séparer tes dépenses perso et pro',
                  'Code PREMIERMOIS : 1er mois offert sur les offres payantes, sans engagement',
                ]}
                cta="Essayer Indy"
                href={INDY_URL}
                more={{ label: 'Mon avis sur Indy', href: INDY_PAGE_URL }}
                legal="Lien affilié : Indy verse une commission à Jason Marinho si tu t'inscris par ce lien, sans aucun surcoût pour toi."
              />
            </div>
            </>
          )}

          <section style={s.card}>
            <h2 style={s.h2}><Lightbulb size={18} weight="duotone" color="var(--accent-text)" /> Lequel choisir ?</h2>
            <div style={s.choice}>
              <div style={s.choiceRow}>
                <strong style={s.choiceWho}>Tu veux juste faire tes devis et tes factures</strong>
                <span>Tiime, offre gratuite. Le plus simple pour un {metier} qui démarre.</span>
              </div>
              <div style={s.choiceRow}>
                <strong style={s.choiceWho}>Tu veux aussi suivre tes recettes et avoir un compte pro</strong>
                <span>Indy, qui regroupe facturation, suivi et compte pro au même endroit.</span>
              </div>
              <div style={s.choiceRow}>
                <strong style={s.choiceWho}>Tu es en société (SASU, EURL, SARL…)</strong>
                <span>Les deux facturent aussi pour une société, TVA comprise. Si tu as un expert-comptable, demande-lui d&apos;abord quelle plateforme il utilise : prends la même, ta compta suivra toute seule.</span>
              </div>
              <div style={s.choiceRow}>
                <strong style={s.choiceWho}>Tu as déjà un outil de facturation</strong>
                <span>Vérifie qu&apos;il est (ou sera) plateforme agréée. Sinon, change avant septembre 2027.</span>
              </div>
            </div>
            <p style={s.tip}>Choisis-en un seul et gardes-y toutes tes factures : la numérotation doit rester continue, et changer d&apos;outil en cours d&apos;année complique ta comptabilité.</p>
          </section>

          <section style={s.card}>
            <h2 style={s.h2}><FileText size={18} weight="duotone" color="var(--accent-text)" /> Ce qui change selon ton client</h2>
            <div style={s.cases}>
              <Case icon={<User size={18} weight="duotone" />} title="Un hôte particulier" text="Ta facture peut rester un PDF envoyé par e-mail. À partir de septembre 2027, ta plateforme déclare la vente aux impôts pour toi (e-reporting)." />
              <Case icon={<Buildings size={18} weight="duotone" />} title="Un pro" text={`Si ton client est ${pro}, ta facture devra être électronique dès septembre 2027 : elle part par ta plateforme, plus par e-mail.`} />
              <Case icon={<Receipt size={18} weight="duotone" />} title="Tes devis" text="La réforme ne les concerne pas : fais-les directement dans l'app, ton client les accepte en ligne. Tu reprends ensuite les lignes dans ta facture." />
            </div>
          </section>
        </div>

        <aside style={s.colSide}>
          <section style={s.card}>
            <h2 style={s.h2}><ListChecks size={18} weight="duotone" color="var(--accent-text)" /> Sur chaque facture</h2>
            <ul style={s.list}>
              {[
                'Entreprise individuelle : ton nom suivi de « EI » et ton SIRET. Société : forme, capital, SIREN et ville du RCS',
                'Un numéro unique, sans trou ni doublon',
                'La date, le détail de la prestation et le prix',
                'Sans TVA : « TVA non applicable, art. 293 B du CGI » (art. L. 233-3 du CIBS à partir de 2027)',
                'Avec TVA : ton numéro de TVA, le taux et le montant de TVA par ligne',
                'Client pro : délai de paiement, pénalités de retard et indemnité de 40 €',
                'En 2027 : SIREN du client pro, nature de l\'opération (prestation de services) et, si tu factures la TVA, l\'option pour la TVA sur les débits',
              ].map(t => (
                <li key={t} style={s.li}><CheckCircle size={16} weight="fill" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: 2 }} />{t}</li>
              ))}
            </ul>
            <p style={s.small}>Tiime et Indy ajoutent ces mentions pour toi.</p>
          </section>

          <section style={s.card}>
            <h2 style={s.h2}><Star size={18} weight="duotone" color="var(--accent-text)" /> Bon à savoir</h2>
            <p style={s.p}>Micro-entreprise ou société, tu peux rester sans TVA (franchise en base) tant que ton chiffre d&apos;affaires reste sous <strong>{eur(seuilTva)}</strong> par an pour des prestations de services. Au-delà, ou si tu as choisi de la facturer, tu factures la TVA.</p>
            <p style={s.p}>Le plafond de la micro-entreprise pour les services est de <strong>{eur(plafondMicro)}</strong> par an.</p>
            <p style={{ ...s.p, margin: 0 }}>Le calendrier est le même pour tous les photographes et équipes de ménage : seules les grandes entreprises et les ETI émettent déjà en électronique depuis septembre 2026.</p>
          </section>

          <p style={s.sources}>
            Sources : calendrier de la facturation électronique (<a href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique" target="_blank" rel="noopener noreferrer" style={s.link}>impots.gouv.fr</a>),
            mentions obligatoires (<a href="https://entreprendre.service-public.gouv.fr/vosdroits/F31808" target="_blank" rel="noopener noreferrer" style={s.link}>service-public.fr</a>),
            seuils 2026 (<a href="https://www.legifiscal.fr/actualites-fiscales/4436-nouveaux-seuils-micro-entreprises-annee-2026.html" target="_blank" rel="noopener noreferrer" style={s.link}>LégiFiscal</a>).
          </p>
        </aside>
      </div>
    </div>
  )
}

function Step({ date, text, done }: { date: string; text: string; done?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ ...s.dot, background: done ? 'var(--accent-text)' : 'rgba(255,213,107,0.9)' }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{date}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  )
}

function Partner({ name, badge, tagline, points, cta, href, more, legal, featured }: {
  name: string
  badge: string
  tagline: string
  points: string[]
  cta: string
  href: string
  more: { label: string; href: string }
  legal: string
  featured?: boolean
}) {
  return (
    <section style={{ ...s.card, ...s.partner, border: featured ? '1px solid var(--accent-border)' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={s.partnerName}>{name}</div>
        <span style={s.badge}>{badge}</span>
      </div>
      <div style={s.tagline}>{tagline}</div>
      <ul style={s.list}>
        {points.map(p => (
          <li key={p} style={s.li}><CheckCircle size={16} weight="fill" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: 2 }} />{p}</li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={href} target="_blank" rel="sponsored noopener" style={featured ? s.btn : s.btnGhost}>
            {cta} <ArrowSquareOut size={14} weight="bold" />
          </a>
          <a href={more.href} target="_blank" rel="noopener" style={s.link}>{more.label}</a>
        </div>
        <div style={s.legal}>{legal}</div>
      </div>
    </section>
  )
}

function Case({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={s.case}>
      <span style={s.caseIcon}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{text}</div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 999, marginTop: 4, flexShrink: 0 },
  cols: { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' },
  colMain: { flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  colSide: { flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  partners: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 'clamp(18px, 2vw, 24px)' },
  partner: { display: 'flex', flexDirection: 'column', gap: 12 },
  partnerName: { fontFamily: 'var(--font-fraunces), serif', fontSize: 26, color: 'var(--text)' },
  badge: { fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' },
  tagline: { fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' },
  h2: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-fraunces), serif', fontSize: 19, fontWeight: 400, color: 'var(--text)', margin: '0 0 14px' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 },
  li: { display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 17px', borderRadius: 12, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  link: { fontSize: 13, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: 3 },
  legal: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  choice: { display: 'flex', flexDirection: 'column', gap: 10 },
  choiceRow: { display: 'flex', flexDirection: 'column', gap: 3, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 },
  choiceWho: { color: 'var(--text)', fontSize: 14 },
  tip: { margin: '14px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(255,213,107,0.45)' },
  cases: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 },
  case: { display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' },
  caseIcon: { width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  p: { margin: '0 0 10px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 },
  small: { margin: '12px 0 0', fontSize: 12.5, color: 'var(--text-muted)' },
  sources: { margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 },
}
