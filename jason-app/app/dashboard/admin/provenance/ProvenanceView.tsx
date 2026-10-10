import Link from 'next/link'
import { LinkSimple, UsersThree, ChartBar, Info, Warning, CursorClick, UserPlus, Eye } from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { LINK_DESTINATIONS, type AcqKind } from '@/lib/acquisition/rules'
import { SPACE_LABEL } from '@/lib/acquisition/report'
import type { ProvenanceData } from '@/lib/acquisition/load'
import { CreateLinkForm, CopyButton, ArchiveButton } from './LinkTools'

// Page « Liens & inscriptions » (10/10/2026, demande de Jason : savoir ce que
// rapporte chaque lien posté dans un groupe Facebook et d'où viennent les
// comptes créés). Règles dans lib/acquisition.

const KIND_COLOR: Partial<Record<AcqKind, string>> = {
  lien: 'var(--accent-text)', google: 'var(--accent-text)', facebook: AMBER, instagram: PINK, ia: PINK, 'e-mail': BROWN,
}
const colorOf = (k: AcqKind) => KIND_COLOR[k] ?? 'var(--text-3)'
const PERIODS = [['30j', '30 jours'], ['3m', '3 mois'], ['12m', '12 mois']] as const
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const destLabel = (url: string) => LINK_DESTINATIONS.find(d => d.url === url)?.label ?? url.replace(/^https:\/\//, '').replace(/\/$/, '')

export default function ProvenanceView({ data, periode }: { data: ProvenanceData; periode: string }) {
  const { report, missingMigration } = data
  const periodLabel = PERIODS.find(p => p[0] === periode)?.[1] ?? '30 jours'
  const active = report.links.filter(l => !l.archived)
  const archived = report.links.filter(l => l.archived)
  const top = report.byKind[0]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminHero
        section="Liens & inscriptions"
        title="D'où viennent"
        em="tes inscriptions"
        desc="Crée un lien court pour chaque post dans un groupe Facebook : tu vois combien de personnes cliquent, visitent et créent un compte. Chaque nouvelle inscription garde aussi sa provenance (Google, Facebook, IA, e-mail…)."
        aside={
          <div style={adminAsideCard}>
            <span style={s.asideLabel}><UserPlus size={15} weight="fill" color="var(--accent-text)" /> Inscriptions · {periodLabel}</span>
            <strong style={s.asideBig}>{report.signups}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {report.measured ? `${report.measured} avec provenance connue${top ? ` · en tête : ${top.label} (${top.pct} %)` : ''}` : 'Provenance mesurée pour les prochaines inscriptions'}
            </span>
          </div>
        }
      >
        <div style={s.chips}>
          {PERIODS.map(([k, label]) => (
            <Link key={k} href={`/dashboard/admin/provenance?periode=${k}`} style={k === periode ? s.chipOn : s.chip}>{label}</Link>
          ))}
        </div>
      </AdminHero>

      {missingMigration && (
        <div style={s.warn}>
          <Warning size={18} weight="fill" color={AMBER} style={{ flexShrink: 0 }} />
          <span>Colle la migration <strong>20261010_126_provenance.sql</strong> dans l&apos;éditeur SQL de Supabase : sans elle, les liens suivis ne peuvent pas être créés et la provenance des inscriptions n&apos;est pas gardée.</span>
        </div>
      )}

      <div style={s.grid2}>
        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><LinkSimple size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={s.title}>Créer un lien à partager</h2>
              <p style={s.sub}>Un lien par post ou par groupe : jasonmarinho.com/l/…, court et propre dans Facebook.</p>
            </div>
          </header>
          <CreateLinkForm />
        </section>

        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><ChartBar size={18} weight="fill" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={s.title}>Inscriptions par provenance</h2>
              <p style={s.sub}>{periodLabel}, {plural(report.signups, 'compte créé', 'comptes créés')}{report.signups - report.measured > 0 ? `, dont ${report.signups - report.measured} pas encore mesuré${report.signups - report.measured > 1 ? 's' : ''}` : ''}.</p>
            </div>
          </header>
          {report.byKind.length === 0 ? (
            <p style={s.text}>Aucune inscription mesurée sur la période. La provenance est enregistrée pour chaque nouveau compte, hôte comme pro.</p>
          ) : (
            <ul style={{ ...s.list, borderTop: 'none', gap: 10 }}>
              {report.byKind.map(k => (
                <li key={k.kind} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{k.label}</span>
                    <span style={{ color: 'var(--text-2)' }}><strong style={{ color: 'var(--text)' }}>{k.count}</strong> · {k.pct} %</span>
                  </div>
                  <div style={s.bar}><div style={{ ...s.barFill, width: `${Math.max(k.pct, 3)}%`, background: colorOf(k.kind) }} /></div>
                </li>
              ))}
            </ul>
          )}
          {report.bySpace.length > 0 && (
            <div style={s.chips}>
              {report.bySpace.map(sp => (
                <span key={sp.space} style={s.pill}>{sp.label} : <strong>{sp.count}</strong>{sp.measured < sp.count ? ` (${sp.measured} mesuré${sp.measured > 1 ? 's' : ''})` : ''}</span>
              ))}
            </div>
          )}
          <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            {report.measuredSince
              ? `Provenance mesurée depuis le ${dateFr(report.measuredSince)}. Seul le point d'entrée de la visite est gardé, pas le parcours.`
              : 'Mesure en place à partir de maintenant : les comptes créés avant restent « Pas encore mesuré ».'}
          </p>
        </section>
      </div>

      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><CursorClick size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Tes liens suivis</h2>
            <p style={s.sub}>Clics sur {periodLabel} (total entre parenthèses), visiteurs mesurés sur le site, comptes créés depuis le lien. Les aperçus de Facebook et WhatsApp ne comptent pas comme des clics.</p>
          </div>
        </header>
        {active.length === 0 ? (
          <p style={s.text}>Pas encore de lien. Crée le premier ci-dessus, puis colle-le dans ton prochain post de groupe Facebook.</p>
        ) : (
          <ul style={s.list}>{active.map(l => <LinkRowView key={l.id} l={l} />)}</ul>
        )}
        {archived.length > 0 && (
          <details>
            <summary style={s.more}>{plural(archived.length, 'lien archivé', 'liens archivés')}</summary>
            <ul style={s.list}>{archived.map(l => <LinkRowView key={l.id} l={l} />)}</ul>
          </details>
        )}
      </section>

      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(PINK, 14), color: PINK }}><UsersThree size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Dernières inscriptions</h2>
            <p style={s.sub}>Les 40 derniers comptes, avec leur espace et la provenance de leur visite.</p>
          </div>
        </header>
        <ul style={s.list}>
          {report.recent.map(m => (
            <li key={m.id} style={s.row}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <Link href={`/dashboard/admin/membres/${m.id}`} style={{ ...s.rowName, textDecoration: 'none' }}>{m.name}</Link>
                <span style={s.rowDetail}>{dateFr(m.created_at)} · {m.spaces.map(sp => SPACE_LABEL[sp]).join(', ')}</span>
              </div>
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: m.view.kind === 'inconnu' ? 'var(--text-3)' : 'var(--text)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: colorOf(m.view.kind), flexShrink: 0 }} />
                  {m.view.label}{m.view.detail ? ` · ${m.view.detail}` : ''}
                </span>
                {m.view.landing && <span style={s.rowDetail}>Arrivé sur {m.view.landing}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function LinkRowView({ l }: { l: ProvenanceData['report']['links'][number] }) {
  return (
    <li style={{ ...s.row, alignItems: 'flex-start' }}>
      <div style={{ flex: '2 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={s.rowName}>{l.label}</span>
        <span style={s.rowDetail}>{l.channelLabel} · vers {destLabel(l.destination)} · créé le {dateFr(l.created_at)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code style={{ fontSize: 13, color: 'var(--accent-text)', fontWeight: 600, overflowWrap: 'anywhere' }}>{l.url}</code>
          <CopyButton text={l.url} />
          <ArchiveButton id={l.id} archived={l.archived} />
        </div>
      </div>
      <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Stat icon={<CursorClick size={13} />} label="Clics" value={`${l.clicks}`} sub={`(${l.clicksTotal})`} />
        <Stat icon={<Eye size={13} />} label="Visiteurs" value={`${l.visitors}`} />
        <Stat icon={<UserPlus size={13} />} label="Comptes" value={`${l.signups.length}`} />
      </div>
      {(l.signups.length > 0 || l.lastClick) && (
        <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12.5, color: 'var(--text-3)' }}>
          {l.lastClick && <span>Dernier clic le {dateFr(l.lastClick)}.</span>}
          {l.signups.length > 0 && <span>Inscrits :</span>}
          {l.signups.map(sg => (
            <Link key={sg.id} href={`/dashboard/admin/membres/${sg.id}`} style={{ color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' }}>{sg.name}</Link>
          ))}
        </div>
      )}
    </li>
  )
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-3)' }}>{icon} {label}</span>
      <span style={{ fontSize: 18, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{value} {sub && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit' }}>{sub}</span>}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 16, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  text: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  note: { display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  chipOn: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  pill: { padding: '5px 10px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' },
  bar: { height: 8, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  asideLabel: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  asideBig: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 28, color: 'var(--text)', lineHeight: 1.15 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 2px', borderBottom: '1px solid var(--border)' },
  rowName: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' },
  rowDetail: { display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  more: { cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', padding: '10px 2px' },
  warn: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 35)}`, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 },
}
