'use client'

// Lien de l'e-mail de bienvenue (31/10/2026, Jason : « oui au lien direct »).
// Avant : lien Supabase, puis page de connexion. Ici le jeton est vérifié dans
// le navigateur : la session est posée et on arrive dans l'espace, connecté.
// Vérifié au chargement par le script de la page, pas par une simple requête :
// les antivirus des messageries qui ouvrent les liens ne consomment pas le jeton.
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CircleNotch, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmerPage() {
  return (
    <Suspense fallback={null}>
      <Confirmer />
    </Suspense>
  )
}

function Confirmer() {
  const params = useSearchParams()
  const [echec, setEchec] = useState(false)

  useEffect(() => {
    const t = params?.get('t') ?? ''
    const type = params?.get('type') === 'magiclink' ? 'magiclink' : 'signup'
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(t)) { setEchec(true); return }
    const supabase = createClient()
    supabase.auth.verifyOtp({ token_hash: t, type }).then(async ({ error }) => {
      if (!error) { window.location.replace('/ouverture'); return }
      // Lien déjà utilisé sur cet appareil : la session existe déjà
      const { data } = await supabase.auth.getSession()
      if (data.session) window.location.replace('/ouverture')
      else setEchec(true)
    })
  }, [params])

  return (
    <div data-theme="light" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBFAF6', padding: '24px 16px', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>
      {echec ? (
        <div style={{ maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <WarningCircle size={44} weight="duotone" color="#B45309" />
          <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 28, margin: 0, color: '#0B1D0F' }}>Ce lien a expiré</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#4A5A4E' }}>
            Il est valable 24 heures et ne sert qu’une fois. Connecte-toi avec ton e-mail et ton mot de passe : si ton adresse n’est pas encore confirmée, tu pourras recevoir un nouveau lien.
          </p>
          <Link href="/auth/login" className="btn-primary" style={{ justifyContent: 'center', marginTop: 6 }}>Me connecter</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#004C3F', fontSize: 15 }} role="status">
          <CircleNotch size={22} style={{ animation: 'spin 1s linear infinite' }} />
          Ouverture de ton espace…
        </div>
      )}
    </div>
  )
}
