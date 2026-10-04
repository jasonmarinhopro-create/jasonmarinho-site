import Link from 'next/link'
import { Receipt, ArrowRight } from '@phosphor-icons/react/dist/ssr'

// Encart de « Ma fiche » vers les devis (04/10/2026). Pas de partenaires ici :
// ils sont proposés dans la page Devis, et masqués si le pro a déjà son outil.
export default function FacturationTeaser({ href }: { href: string }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--accent-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
        <Receipt size={16} weight="duotone" color="var(--accent-text)" /> Un devis en 2 minutes
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
        Une demande reçue ? Envoie un devis propre que ton client accepte en ligne, avec tes prestations habituelles déjà proposées.
      </p>
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' }}>
        Faire un devis <ArrowRight size={14} weight="bold" />
      </Link>
    </div>
  )
}
