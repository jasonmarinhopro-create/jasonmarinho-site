import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Scales, CalendarBlank, Info, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { loadFinances } from '@/lib/finances/load'
import { inScope } from '@/lib/finances/engine'
import {
  estimerFR, estimerPT, paysDesRecettes, FISCAL_CAT_LABEL, ABATTEMENT, PLAFOND_MICRO, PLAFOND_NON_CLASSE,
  type FiscalFR, type FiscalPT,
} from '@/lib/finances/fiscal'
import { Card, CardHead, Definition, Notice, ProgressBar, eur, pct, ui, COLORS } from '../_ui/ui'
import TaxCompare from './TaxCompare'

export const metadata = { title: 'Fiscalité, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function FiscalitePage({ searchParams }: { searchParams: { annee?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  const current = Number(data.today.slice(0, 4))
  const year = searchParams.annee === String(current - 1) ? current - 1 : current
  const input = { lines: data.allLines, charges: data.allCharges, logements: data.logements, year, today: data.today }
  const pays = paysDesRecettes(data.allLines, data.logements, year)
  const fr = pays.includes('FR') ? estimerFR(input) : null
  const pt = pays.includes('PT') ? estimerPT(input) : null

  // Part du logement choisi dans les recettes de l'année
  const part = data.scope.logement
    ? data.allLines.filter(l => !l.horsRevenus && l.aDeclarer && l.date.startsWith(String(year)) && inScope(l, data.scope)).reduce((s, l) => s + l.brut, 0)
    : null
  const totalFoyer = (fr?.recettesAnnee ?? 0) + (pt?.recettesAnnee ?? 0)

  return (
    <div style={ui.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
          Estimation de tes revenus de location meublée {year}, à déclarer en {year + 1}
        </p>
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          {[current, current - 1].map(y => (
            <Link key={y} href={y === current ? '/dashboard/finances/fiscalite' : `/dashboard/finances/fiscalite?annee=${y}`} scroll={false}
              style={{ padding: '6px 12px', borderRadius: 9, fontSize: 13, textDecoration: 'none', fontWeight: y === year ? 600 : 500, background: y === year ? 'var(--surface)' : 'transparent', color: y === year ? 'var(--accent-text)' : 'var(--text-3)' }}>
              {y}
            </Link>
          ))}
        </div>
      </div>

      {part !== null && totalFoyer > 0 && (
        <Notice>
          <Info size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
          Les plafonds fiscaux comptent <strong>tous tes logements ensemble</strong> : {data.scope.logement?.nom} représente {eur(part)} sur {eur(totalFoyer)} de recettes en {year}. Le calcul ci-dessous porte donc sur l&apos;ensemble.
        </Notice>
      )}

      {!fr && !pt && (
        <Card>
          <CardHead title={`Pas encore de recettes en ${year}`} sub="Dès que tes séjours auront un montant (ou tes paiements seront saisis dans le Journal), l'estimation apparaîtra ici." />
        </Card>
      )}

      {fr && <France fr={fr} year={year} current={current} />}
      {pt && <Portugal pt={pt} />}

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Estimation indicative, pas un conseil fiscal : ton impôt réel dépend de tout ton foyer. Fais valider ton choix de régime par un expert-comptable ou le service des impôts des entreprises.
      </p>
    </div>
  )
}

function France({ fr, year, current }: { fr: FiscalFR; year: number; current: number }) {
  const verdict = VERDICTS[fr.verdict]
  const aVenir = fr.recettesAnnee - fr.recettesAjour
  const nonClasse = fr.parCat.nonClasse
  const classeCdh = fr.parCat.classe + fr.parCat.cdh
  const abattTexte = (Object.keys(fr.parCat) as Array<keyof typeof fr.parCat>)
    .filter(c => fr.parCat[c] > 0)
    .map(c => `${Math.round(ABATTEMENT[c] * 100)} % (${FISCAL_CAT_LABEL[c].toLowerCase()})`)
    .join(', ') || '30 %'

  return (
    <>
      <Card style={{ background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 70%)', borderColor: 'var(--accent-border)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Scales size={26} weight="duotone" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)' }}>France · ton régime pour {year}</div>
            <h2 style={{ margin: '4px 0 6px', fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px, 2.6vw, 26px)', fontWeight: 500, color: 'var(--text)', lineHeight: 1.25 }}>{verdict.titre}</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{verdict.texte(fr)}</p>
          </div>
        </div>
      </Card>

      <div style={ui.grid2}>
        <Card>
          <CardHead title={`Tes recettes ${year}`} sub="Montant payé par les voyageurs, commissions comprises, cautions exclues." />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={ui.statLabel}>{year === current ? "Perçu à ce jour" : 'Total'}</div>
              <div style={ui.statValue}>{eur(fr.recettesAjour)}</div>
            </div>
            {aVenir > 0 && (
              <div>
                <div style={ui.statLabel}>Avec les séjours réservés</div>
                <div style={{ ...ui.statValue, color: 'var(--accent-text)' }}>{eur(fr.recettesAnnee)}</div>
              </div>
            )}
          </div>
          <Plafond label="Meublés non classés" montant={nonClasse} plafond={PLAFOND_NON_CLASSE} show={nonClasse > 0} />
          <Plafond label="Tous meublés (classés, chambres d'hôtes et non classés)" montant={fr.recettesAnnee} plafond={PLAFOND_MICRO} show={classeCdh > 0 || nonClasse > PLAFOND_NON_CLASSE} />
          {fr.exclues > 0 && <Definition>{fr.exclues} paiement{fr.exclues > 1 ? 's' : ''} marqué{fr.exclues > 1 ? 's' : ''} « hors fiscalité » dans le Journal ne {fr.exclues > 1 ? 'sont' : 'est'} pas compté{fr.exclues > 1 ? 's' : ''}.</Definition>}
        </Card>

        <Card>
          <CardHead title="Régime de chaque logement" sub="Déduit de sa fiche : type « chambres d'hôtes » ou étoiles de classement." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fr.logements.map(l => (
              <div key={l.logementId ?? l.nom} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', fontSize: 13.5, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{l.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {FISCAL_CAT_LABEL[l.cat]} · abattement {Math.round(ABATTEMENT[l.cat] * 100)} %
                    {l.cat === 'nonClasse' && l.logementId && <> · <Link href={`/dashboard/logements/${l.logementId}`} style={ui.link}>il est classé ?</Link></>}
                    {l.sansFiche && ' · sans fiche logement'}
                  </div>
                </div>
                <strong style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>{eur(l.recettes)}</strong>
              </div>
            ))}
          </div>
          <Definition>Un logement classé (1 à 5 étoiles) garde 50 % d&apos;abattement et le micro-BIC jusqu&apos;à {eur(PLAFOND_MICRO)}, contre 30 % et {eur(PLAFOND_NON_CLASSE)} sans classement.</Definition>
        </Card>
      </div>

      {fr.recettesAnnee > 0 && (
        <Card>
          <CardHead title="Micro-BIC ou régime réel" sub={`Sur tes recettes ${year}${aVenir > 0 ? ', séjours réservés compris' : ''}.`} />
          <TaxCompare
            baseMicro={fr.baseMicro} baseReel={fr.baseReel} recettes={fr.recettesAnnee} abattementTexte={abattTexte}
            commissions={fr.commissions} charges={fr.charges} amortissements={fr.amortissements}
            amortissementsSaisis={fr.amortissementsSaisis} microEligible={fr.microEligible}
          />
        </Card>
      )}

      {fr.lmpPossible && (
        <Notice tone="warn">
          Tes recettes dépassent 23 000 €. Tu deviens <strong>loueur en meublé professionnel (LMP)</strong> si, en plus, elles dépassent les autres revenus d&apos;activité de ton foyer (salaires, pensions…). Le LMP change la fiscalité et ajoute des cotisations sociales : parles-en à un comptable.
        </Notice>
      )}

      <Card>
        <CardHead title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CalendarBlank size={18} weight="duotone" color="var(--accent-text)" />Les échéances</span>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
          <div><strong style={{ color: 'var(--text)' }}>Au printemps {year + 1}</strong> : déclaration de tes revenus {year}. En micro-BIC, sur la déclaration 2042-C-PRO. Au réel, la liasse 2031 est à déposer avant, en général début mai.</div>
          <div><strong style={{ color: 'var(--text)' }}>Avant le 15 décembre</strong> : cotisation foncière des entreprises (CFE), sur ton espace professionnel impots.gouv.fr. Pas de CFE si tes recettes ne dépassent pas 5 000 €.</div>
          <div><strong style={{ color: 'var(--text)' }}>Chaque mois ou trimestre</strong> : reversement de la taxe de séjour à ta commune pour les réservations directes (les plateformes s&apos;en chargent pour leurs réservations).</div>
        </div>
      </Card>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Sources : seuils micro-BIC 2026 (<a href="https://www.legifiscal.fr/actualites-fiscales/4436-nouveaux-seuils-micro-entreprises-annee-2026.html" target="_blank" rel="noopener noreferrer" style={ui.link}>LégiFiscal</a>),
        chambres d&apos;hôtes à 50 % (<a href="https://www.aurep.com/publications-et-agenda/chambres-dhotes-et-regime-micro-bic-la-ligne-est-fixee/" target="_blank" rel="noopener noreferrer" style={ui.link}>AUREP</a>),
        prélèvements sociaux de 18,6 % sur la location meublée (<a href="https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux" target="_blank" rel="noopener noreferrer" style={ui.link}>impots.gouv.fr</a>).
      </p>
    </>
  )
}

const VERDICTS: Record<FiscalFR['verdict'], { titre: string; texte: (f: FiscalFR) => string }> = {
  aucun: { titre: 'Pas encore de recettes', texte: () => "L'estimation apparaîtra avec tes premiers séjours." },
  micro: {
    titre: 'Micro-BIC : le plus simple, et le plus avantageux avec tes chiffres',
    texte: f => `Base imposable de ${eur(f.baseMicro)} en micro-BIC contre ${eur(f.baseReel)} au réel. Tu déclares tes recettes brutes, l'abattement fait le reste.`,
  },
  micro_a_completer: {
    titre: 'Micro-BIC possible',
    texte: f => `Tes recettes restent sous les plafonds : base imposable de ${eur(f.baseMicro)} en micro-BIC. Pour savoir si le régime réel te ferait payer moins, ajoute l'amortissement de ton bien et de ton mobilier dans le Journal : c'est souvent lui qui fait gagner le réel.`,
  },
  reel_conseille: {
    titre: 'Le régime réel te ferait sans doute payer moins',
    texte: f => `Base imposable de ${eur(f.baseReel)} au réel contre ${eur(f.baseMicro)} en micro-BIC, grâce à tes charges et amortissements. Le réel demande une comptabilité : l'option se fait auprès du service des impôts des entreprises.`,
  },
  reel_ou_classement: {
    titre: 'Régime réel, ou micro-BIC si tu fais classer ton logement',
    texte: f => `Tes recettes de meublé non classé (${eur(f.parCat.nonClasse)}) dépassent ${eur(PLAFOND_NON_CLASSE)}. Un meublé classé (1 à 5 étoiles) garde le micro-BIC jusqu'à ${eur(PLAFOND_MICRO)} avec 50 % d'abattement. En pratique, le passage au réel intervient quand le plafond est dépassé deux années de suite.`,
  },
  reel_obligatoire: {
    titre: 'Régime réel',
    texte: f => `Tes recettes (${eur(f.recettesAnnee)}) dépassent ${eur(PLAFOND_MICRO)}, le plafond du micro-BIC. En pratique, le passage au réel intervient quand le plafond est dépassé deux années de suite.`,
  },
}

function Plafond({ label, montant, plafond, show }: { label: string; montant: number; plafond: number; show: boolean }) {
  if (!show) return null
  const over = montant > plafond
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: over ? COLORS.charges : 'var(--text)' }}>
          {eur(montant)} / {eur(plafond)}{over ? ' · dépassé' : ` · ${pct(montant / plafond)}`}
        </span>
      </div>
      <ProgressBar value={montant / plafond} color={over ? COLORS.charges : montant / plafond > 0.85 ? COLORS.commissions : 'var(--accent-text)'} />
    </div>
  )
}

function Portugal({ pt }: { pt: FiscalPT }) {
  return (
    <Card>
      <CardHead title="Portugal · Alojamento Local" sub="Régime simplifié (catégorie B) pour un AL en appartement ou maison." />
      <div style={ui.kpis}>
        <div><div style={ui.statLabel}>Recettes</div><div style={ui.statValue}>{eur(pt.recettesAnnee)}</div></div>
        <div><div style={ui.statLabel}>Coefficient</div><div style={ui.statValue}>{String(pt.coefficient).replace('.', ',')}</div></div>
        <div><div style={ui.statLabel}>Revenu imposable estimé</div><div style={ui.statValue}>{eur(pt.base)}</div></div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Plafond label="Exonération d'IVA (art. 53 CIVA)" montant={pt.recettesAnnee} plafond={pt.seuilIva} show />
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
          {pt.sousSeuilIva
            ? `Sous ${eur(pt.seuilIva)} de chiffre d'affaires, un résident fiscal portugais peut rester exonéré d'IVA. Depuis juillet 2025, un non-résident n'y a plus droit.`
            : `Au-delà de ${eur(pt.seuilIva)}, l'IVA à 6 % s'applique à l'hébergement (Portugal continental).`}
          {' '}Chaque séjour doit être facturé sur le Portail des Finances (e-fatura) ou avec un logiciel certifié.
        </p>
      </div>
      <Definition>
        Sources : <a href="https://portal.occ.pt/index.php/pt-pt/noticias/regime-especial-de-isencao-do-iva-artigo-53o-civa" target="_blank" rel="noopener noreferrer" style={ui.link}>Ordem dos Contabilistas Certificados</a> (seuil de 15 000 € depuis 2025). Fais valider par un contabilista certificado.
      </Definition>
      <Link href="/dashboard/guide" style={{ ...ui.link, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 13 }}>Guide LCD <ArrowRight size={13} /></Link>
    </Card>
  )
}
