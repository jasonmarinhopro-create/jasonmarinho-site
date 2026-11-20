// Suivi d'activité d'un pro, visible seulement par l'admin dans l'aperçu de
// sa fiche (17/11/2026, demande de Jason). Ne lit que des colonnes de
// fonctionnement (date, statut, page d'origine des demandes ; statut des
// clients du carnet) : jamais le nom, l'e-mail, le téléphone, le message de
// l'hôte ni les notes du pro (politique de confidentialité, partie 6).
import { ChartBar, Tray, CheckCircle, Hourglass, AddressBook } from '@phosphor-icons/react/dist/ssr'
import { getServiceClient } from '@/lib/supabase/service'
import { allRows } from '@/lib/supabase/all-rows'
import { METIERS, type ProKind } from '@/lib/pros/metiers'
import { buildSuivi, STATUTS_DEMANDE, type SuiviContact, type SuiviClient, type SuiviActivite } from '@/lib/pros/suivi-activite'
import RelativeTime from '@/components/ui/RelativeTime'

const CLIENT_LABEL: Record<string, [string, string]> = { prospect: ['prospect', 'prospects'], client: ['client', 'clients'], fidele: ['fidèle', 'fidèles'], 'sans statut': ['sans statut', 'sans statut'] }
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export async function SuiviActivitePanel({ kind, proId }: { kind: ProKind; proId: string }) {
  const m = METIERS[kind]
  const db = getServiceClient()
  let suivi: SuiviActivite | null = null
  try {
    const [contacts, clients] = await Promise.all([
      allRows<SuiviContact>((a, b) => db.from(m.contactsTable).select('created_at, status, source_url').eq(m.idColumn, proId).order('created_at').order('id').range(a, b)),
      allRows<SuiviClient>((a, b) => db.from('pro_clients').select('statut').eq('owner_kind', kind).eq('owner_id', proId).order('id').range(a, b)),
    ])
    if (!contacts.error && !clients.error) suivi = buildSuivi(contacts.rows, clients.rows, new Date())
  } catch { suivi = null }
  return <SuiviActiviteCard suivi={suivi} />
}

export function SuiviActiviteCard({ suivi }: { suivi: SuiviActivite | null }) {
  return (
    <section style={s.card} aria-label="Suivi d'activité du pro">
      <div style={s.head}>
        <span style={s.icon}><ChartBar size={17} weight="duotone" /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.title}>Suivi d&apos;activité</div>
          <div style={s.sub}>Ce que le pro fait de ses demandes, sans le contenu des messages ni l&apos;identité des hôtes</div>
        </div>
      </div>
      {!suivi ? (
        <p style={s.muted}>Données indisponibles pour le moment (base lente). Recharge la page dans un instant.</p>
      ) : (
        <div style={s.body}>
          <div style={s.kpis}>
            <Kpi Icon={Tray} label="Demandes reçues" value={String(suivi.total)} hint={`${suivi.derniers30} sur 30 jours · ${suivi.directes} par la fiche, ${suivi.trouverUnPro} par Trouver un pro`} />
            <Kpi Icon={CheckCircle} label="Traitées" value={suivi.tauxTraite === null ? '–' : `${suivi.tauxTraite} %`} hint="Statut changé par le pro (répondue, devis, gagnée ou perdue)" />
            <Kpi Icon={Hourglass} label="En attente" value={String(suivi.enAttente)} hint={suivi.plusVieilleAttenteJours === null ? 'Aucune demande en attente' : `La plus ancienne depuis ${suivi.plusVieilleAttenteJours} j`} alert={suivi.plusVieilleAttenteJours !== null && suivi.plusVieilleAttenteJours >= 3} />
            <Kpi Icon={AddressBook} label="Carnet clients" value={String(suivi.clients)} hint={suivi.clientsParStatut.length ? suivi.clientsParStatut.map(c => `${c.n} ${CLIENT_LABEL[c.statut]?.[c.n > 1 ? 1 : 0] ?? c.statut}`).join(', ') : 'Vide'} />
          </div>
          <div style={s.cols}>
            <div style={s.block}>
              <div style={s.blockTitle}>Où en sont ses demandes</div>
              {STATUTS_DEMANDE.map(([k, label]) => {
                const n = suivi.parStatut[k]
                const pct = suivi.total ? Math.round((n / suivi.total) * 100) : 0
                return (
                  <div key={k} style={s.row}>
                    <span style={s.rowLabel}>{label}</span>
                    <span style={s.barTrack}><span style={{ ...s.bar, width: `${pct}%`, background: k === 'nouvelle' ? '#C9A227' : k === 'perdue' ? 'var(--text-muted)' : 'var(--accent-text)' }} /></span>
                    <span style={s.rowN}>{n}</span>
                  </div>
                )
              })}
              <div style={s.foot}>Dernière demande : {suivi.derniere ? <RelativeTime iso={suivi.derniere} /> : 'aucune'}</div>
            </div>
            <div style={s.block}>
              <div style={s.blockTitle}>Demandes par mois</div>
              <div style={s.months}>
                {suivi.parMois.map(({ mois, n }) => {
                  const max = Math.max(1, ...suivi.parMois.map(x => x.n))
                  return (
                    <div key={mois} style={s.month}>
                      <span style={s.monthN}>{n}</span>
                      <span style={{ ...s.monthBar, height: `${Math.max(4, Math.round((n / max) * 64))}px`, opacity: n ? 1 : 0.35 }} />
                      <span style={s.monthL}>{MOIS[Number(mois.slice(5)) - 1]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Kpi({ Icon, label, value, hint, alert }: { Icon: typeof Tray; label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <div style={{ ...s.kpi, ...(alert ? { border: '1px solid rgba(201,162,39,.55)', background: 'rgba(255,213,107,.12)' } : {}) }}>
      <span style={s.kpiLabel}><Icon size={14} weight="bold" /> {label}</span>
      <span style={s.kpiValue}>{value}</span>
      <span style={s.kpiHint}>{hint}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, minWidth: 0 },
  head: { display: 'flex', alignItems: 'flex-start', gap: 11 },
  icon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--accent-bg, rgba(0,76,63,.08))', color: 'var(--accent-text)', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 16, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--text-3)' },
  body: { display: 'flex', flexDirection: 'column', gap: 16 },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 },
  kpi: { display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-2)', minWidth: 0 },
  kpiLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 26, lineHeight: 1.1, color: 'var(--text)' },
  kpiHint: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 },
  cols: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 },
  block: { display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', minWidth: 0 },
  blockTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 },
  row: { display: 'grid', gridTemplateColumns: '130px 1fr 28px', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barTrack: { height: 8, borderRadius: 99, background: 'var(--bg-2)', overflow: 'hidden' },
  bar: { display: 'block', height: '100%', borderRadius: 99 },
  rowN: { fontSize: 12.5, fontWeight: 600, color: 'var(--text)', textAlign: 'right' },
  foot: { fontSize: 12, color: 'var(--text-3)', marginTop: 4 },
  months: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', alignItems: 'end', gap: 8, height: 110 },
  month: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  monthN: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  monthBar: { width: '100%', maxWidth: 34, borderRadius: 6, background: 'var(--accent-text)' },
  monthL: { fontSize: 11.5, color: 'var(--text-3)' },
}
