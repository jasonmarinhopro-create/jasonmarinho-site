// Génère 3 propositions de texte de post, sur des angles différents, à
// partir d'un sujet donné par l'admin — et en évitant de répéter les
// publications récentes. Fetch brut vers l'API Anthropic plutôt qu'un
// SDK, cohérent avec lib/social/meta.ts — pas de dépendance de plus pour
// un seul appel.

const SYSTEM_PROMPT = `Tu écris les publications Facebook/Instagram de Jason Marinho, plateforme française pour les hôtes en location courte durée (LCD/Airbnb) et l'annuaire Driing.

Ton : chaleureux, direct, jamais corporate ni robotique — on s'adresse à des hôtes indépendants, pas à des entreprises. Phrases courtes.
Emojis : sobres, 0 à 2 maximum, jamais en rafale.
Hashtags : 0 à 3 pertinents maximum, à la fin seulement si utile.
Format : pas de markdown, pas de titres, pas d'astérisques.
Longueur : 2 à 5 phrases, adaptée à un post Instagram/Facebook.
N'invente jamais de chiffres, de témoignages ou de statistiques que l'utilisateur n'a pas donnés dans sa demande.

Génère TOUJOURS exactement 3 propositions distinctes pour le même sujet, sur 3 angles différents :
1. Une question qui interpelle le lecteur.
2. Un conseil concret et actionnable.
3. Une accroche directe, façon annonce.
Varie vraiment le vocabulaire, la structure de phrase et l'accroche entre les 3 — elles ne doivent pas se ressembler. Si des publications récentes sont listées dans la demande, ne réutilise aucune de leurs formulations ou accroches.

Réponds avec les 3 propositions séparées chacune par une ligne contenant exactement --- (rien d'autre sur cette ligne). Pas de numéro, pas de label ("Proposition 1" etc.), pas de texte avant, entre ou après — uniquement les 3 textes et les séparateurs.`

export interface PostVariant {
  text: string
}

export async function generatePostVariants(brief: string, recentPosts: string[] = []): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante')

  let userContent = brief
  if (recentPosts.length > 0) {
    userContent += '\n\nPublications récentes à ne pas répéter (évite ces formulations et ces accroches) :\n'
      + recentPosts.map(p => `- ${p.slice(0, 200)}`).join('\n')
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Anthropic API ${res.status}`)
  }
  const text = json?.content?.[0]?.text
  if (!text) throw new Error('Réponse vide')

  const variants = String(text)
    .split(/\n\s*---\s*\n?/)
    .map(v => v.trim())
    .filter(Boolean)

  if (variants.length === 0) throw new Error('Réponse vide')
  return variants.slice(0, 3)
}
