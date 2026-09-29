// Écran complet (bandeau + onglets), sans accès aux données : rendu par
// page.tsx et par un aperçu avec des données fictives.

import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import ProspectionView from './ProspectionView'
import type { ContactRow, MailConfig, SequenceRow, SettingsRow, Stats } from './shared'

export default function ProspectionScreen(props: { sequences: SequenceRow[]; contacts: ContactRow[]; settings: SettingsRow; config: MailConfig; stats: Stats }) {
  const { stats, settings, config, sequences } = props
  const running = sequences.filter(s => s.enabled).length
  const inProgress = sequences.reduce((n, s) => n + s.counts.en_cours, 0)
  const rate = stats.contacted30 ? Math.round((stats.replies30 / stats.contacted30) * 100) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <AdminHero
        section="Prospection"
        title="Trouve tes pros,"
        em="écris-leur au bon moment"
        desc="Photographes, équipes de ménage et hôtes trouvés dans les bases publiques, des séquences d'e-mails qui s'arrêtent dès qu'on te répond, envoyées depuis ta propre boîte."
        aside={
          <div style={adminAsideCard}>
            <span style={kicker}>Aujourd&apos;hui</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={big}>{stats.sentToday}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>/ {settings.daily_cap} e-mails envoyés</span>
            </div>
            <div style={bar}><div style={{ ...barFill, width: `${Math.min(100, (stats.sentToday / Math.max(1, settings.daily_cap)) * 100)}%` }} /></div>
            <Row k="Envoyés sur 7 jours" v={`${stats.sent7}`} />
            <Row k="Réponses sur 30 jours" v={`${stats.replies30}${rate !== null ? ` (${rate} %)` : ''}`} />
            <Row k="Séquences en marche" v={`${running}, ${inProgress} personne${inProgress > 1 ? 's' : ''} dedans`} />
            {stats.errors7 > 0 && <Row k="Erreurs sur 7 jours" v={`${stats.errors7}`} warn />}
            <Row k="Boîte d'envoi" v={config.configured ? (config.from ?? 'branchée') : 'à brancher'} warn={!config.configured} />
            {settings.paused && <Row k="Envois" v="en pause" warn />}
          </div>
        }
      />
      <ProspectionView sequences={props.sequences} contacts={props.contacts} settings={settings} config={config} />
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', padding: '4px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-3)' }}>{k}</span>
      <strong style={{ color: warn ? '#8A5A12' : 'var(--text)', textAlign: 'right', overflowWrap: 'anywhere' }}>{v}</strong>
    </div>
  )
}

const kicker: React.CSSProperties = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--accent-text)' }
const big: React.CSSProperties = { fontFamily: 'var(--font-fraunces), serif', fontSize: '34px', color: 'var(--text)', lineHeight: 1 }
const bar: React.CSSProperties = { height: '6px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }
const barFill: React.CSSProperties = { height: '100%', borderRadius: '999px', background: 'var(--accent-text)' }
