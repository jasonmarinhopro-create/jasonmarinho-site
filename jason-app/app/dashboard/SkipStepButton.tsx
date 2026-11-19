'use client'

import { useTransition } from 'react'
import { markOnboardingStep } from '@/lib/onboarding/actions'

// « Passer cette étape » de la carte Démarrage (19/11/2026, Jason : « pouvoir
// passer l'étape si ça ne les intéresse pas, surtout le calendrier »).
// Enregistré dans onboarding_completed_steps (suit le compte, tous appareils) ;
// l'action revalide l'Accueil.
export default function SkipStepButton({ stepKey }: { stepKey: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      onClick={() => start(async () => { await markOnboardingStep(stepKey, true) })}
      disabled={pending}
      style={{
        background: 'none', border: 'none', padding: '4px 2px', cursor: pending ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--text-3)',
        textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap',
      }}
    >
      {pending ? 'Un instant…' : 'Passer cette étape'}
    </button>
  )
}
