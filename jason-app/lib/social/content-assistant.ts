// Génère une proposition de texte de post à partir d'un sujet donné par
// l'admin. Fetch brut vers l'API Anthropic plutôt qu'un SDK, cohérent avec
// lib/social/meta.ts — pas de dépendance de plus pour un seul appel.

const SYSTEM_PROMPT = `Tu écris les publications Facebook/Instagram de Jason Marinho, plateforme française pour les hôtes en location courte durée (LCD/Airbnb) et l'annuaire Driing.

Ton : chaleureux, direct, jamais corporate ni robotique — on s'adresse à des hôtes indépendants, pas à des entreprises. Phrases courtes.
Emojis : sobres, 0 à 2 maximum, jamais en rafale.
Hashtags : 0 à 3 pertinents maximum, à la fin seulement si utile.
Format : pas de markdown, pas de titres, pas d'astérisques.
Longueur : 2 à 5 phrases, adaptée à un post Instagram/Facebook.
N'invente jamais de chiffres, de témoignages ou de statistiques que l'utilisateur n'a pas donnés dans sa demande.
Réponds uniquement avec le texte du post, sans commentaire ni introduction.`

export async function generatePostDraft(brief: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: brief }],
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Anthropic API ${res.status}`)
  }
  const text = json?.content?.[0]?.text
  if (!text) throw new Error('Réponse vide')
  return String(text).trim()
}
