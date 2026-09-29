'use client'

// Page Admin → Prospection : audience (photographes, ménage, hôtes) puis 4
// onglets. Données chargées par page.tsx (service role après vérification
// du rôle admin), prévisualisable avec des données fictives.

import { useState } from 'react'
import { Camera, Broom, House, Lightning, AddressBook, MagnifyingGlass, Gear, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import type { Audience } from '@/lib/outreach/engine'
import SequencesTab from './SequencesTab'
import ContactsTab from './ContactsTab'
import SourcesTab from './SourcesTab'
import SettingsTab from './SettingsTab'
import { ui, type ContactRow, type MailConfig, type SequenceRow, type SettingsRow } from './shared'

type Tab = 'sequences' | 'contacts' | 'sources' | 'reglages'

const AUD: Array<{ key: Audience; label: string; Icon: React.ElementType }> = [
  { key: 'photographe', label: 'Photographes', Icon: Camera },
  { key: 'menage', label: 'Équipes de ménage', Icon: Broom },
  { key: 'hote', label: 'Hôtes', Icon: House },
]
const TABS: Array<{ key: Tab; label: string; Icon: React.ElementType }> = [
  { key: 'sequences', label: 'Séquences', Icon: Lightning },
  { key: 'contacts', label: 'Contacts', Icon: AddressBook },
  { key: 'sources', label: 'Trouver des contacts', Icon: MagnifyingGlass },
  { key: 'reglages', label: 'Réglages', Icon: Gear },
]

export default function ProspectionView({ sequences, contacts, settings, config, today, initialTab = 'sequences' }: {
  sequences: SequenceRow[]; contacts: ContactRow[]; settings: SettingsRow; config: MailConfig; today: string; initialTab?: Tab
}) {
  const [audience, setAudience] = useState<Audience>('photographe')
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!config.configured && tab !== 'reglages' && (
        <button type="button" onClick={() => setTab('reglages')} style={{ ...ui.notice, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
          <WarningCircle size={17} weight="fill" style={{ color: '#B7791F', flexShrink: 0, marginTop: '1px' }} />
          <span><strong>Boîte d&apos;envoi pas encore branchée</strong> : tu peux préparer contacts et séquences, rien ne partira. Voir les réglages pour la brancher en 5 minutes.</span>
        </button>
      )}
      <div style={s.bar}>
        <div style={s.audiences} role="tablist" aria-label="Audience">
          {AUD.map(a => {
            const n = contacts.filter(c => c.audience === a.key).length
            const on = audience === a.key
            return (
              <button key={a.key} type="button" role="tab" aria-selected={on} onClick={() => setAudience(a.key)} style={{ ...s.aud, ...(on ? s.audOn : {}) }}>
                <a.Icon size={15} weight={on ? 'fill' : 'bold'} /> {a.label} <span style={{ ...s.count, ...(on ? { background: 'var(--accent-text)', color: 'var(--bg)' } : {}) }}>{n}</span>
              </button>
            )
          })}
        </div>
        <div style={s.tabs} role="tablist" aria-label="Section">
          {TABS.map(t => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} style={{ ...s.tab, ...(tab === t.key ? s.tabOn : {}) }}>
              <t.Icon size={15} weight={tab === t.key ? 'fill' : 'bold'} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sequences' && <SequencesTab audience={audience} sequences={sequences} contacts={contacts} />}
      {tab === 'contacts' && <ContactsTab audience={audience} contacts={contacts} sequences={sequences} today={today} />}
      {tab === 'sources' && <SourcesTab audience={audience} placesKey={config.placesKey} />}
      {tab === 'reglages' && <SettingsTab settings={settings} config={config} />}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: { display: 'flex', flexWrap: 'wrap', gap: '10px 16px', alignItems: 'center', justifyContent: 'space-between' },
  audiences: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  aud: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 13px', borderRadius: '999px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  audOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  count: { fontSize: '11px', fontWeight: 800, padding: '1px 7px', borderRadius: '999px', background: 'var(--bg)', color: 'var(--text-2)' },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)' },
  tab: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  tabOn: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
}
