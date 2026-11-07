'use client'

import { createBrowserClient, parse, serialize, type CookieOptions } from '@supabase/ssr'
import { mayRemoveAuthCookie } from './session-cookies'

// Déconnexions surprises (07/11/2026, Jason : « en mode admin je clique et ça
// me déconnecte une fois ») : au retour sur un onglet resté ouvert plus d'une
// heure, le navigateur et une dizaine de préchargements de pages renouvellent
// la session en même temps. Supabase refuse les doublons (409 « too many
// concurrent token refresh ») et la bibliothèque efface alors les cookies de
// session : déconnexion, alors que le renouvellement gagnant venait de
// réussir. Ici, le navigateur n'efface plus les cookies de session qu'au
// moment d'une vraie déconnexion (signOutHere). Une session réellement
// invalide est purgée par le middleware, qui redirige vers la connexion.
let signingOut = false

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return parse(document.cookie)[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          document.cookie = serialize(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          if (!mayRemoveAuthCookie(name, signingOut)) return
          document.cookie = serialize(name, '', { ...options, maxAge: 0 })
        },
      },
    },
  )
}

/** Déconnexion voulue : seul cas où le navigateur efface les cookies de session */
export async function signOutHere() {
  signingOut = true
  try {
    await createClient().auth.signOut()
  } finally {
    signingOut = false
  }
}
