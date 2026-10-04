import Link from 'next/link'
import { Receipt, ArrowRight } from '@phosphor-icons/react/dist/ssr'

// Encart de « Ma fiche » vers la page Facturation (Tiime / Indy, 04/10/2026)
export default function FacturationTeaser({ href }: { href: string }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--accent-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
        <Receipt size={16} weight="duotone" color="var(--accent-text)" /> Devis et factures
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
        En septembre 2027, la facture électronique devient obligatoire pour les micro-entreprises. Les deux outils gratuits que je recommande pour être prêt.
      </p>
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' }}>
        Voir mes conseils <ArrowRight size={14} weight="bold" />
      </Link>
    </div>
  )
}
