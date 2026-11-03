// Rangée du haut de Ma fiche (03/11/2026, Jason : « pour chercher son lien de
// fiche publique il faut descendre, ce n'est pas intuitif ») : le lien de la
// fiche, les statistiques des 30 derniers jours et les vues du mois, avant
// l'atelier. Avant, ces trois cartes étaient tout en bas de la colonne de droite.
import type { ReactNode } from 'react'
import ShareFicheBlock from '@/components/pro/ShareFicheBlock'
import ViewsTrend from '@/components/pros/ViewsTrend'
import type { ViewsTrend as ViewsTrendData } from '@/lib/pros/views'
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr'

export default function FicheOverview({ publicUrl, isActive, displayName, statsSlot, viewsTrend, metier }: {
  publicUrl: string | null
  isActive: boolean
  displayName: string
  statsSlot?: ReactNode
  viewsTrend?: ViewsTrendData
  metier: string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14, alignItems: 'stretch', marginBottom: 18 }}>
      {isActive && publicUrl ? (
        <ShareFicheBlock url={publicUrl} displayName={displayName} compact />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-fraunces), serif', fontSize: 15, color: 'var(--text)' }}>
            <ShareNetwork size={15} weight="fill" color="var(--accent-text)" /> Ton lien de fiche
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>Il apparaît ici dès que ta fiche est en ligne, avec un bouton pour le copier et ton QR code.</span>
        </div>
      )}
      {statsSlot}
      {viewsTrend && <ViewsTrend trend={viewsTrend} metier={metier} compact style={{ margin: 0 }} />}
    </div>
  )
}
