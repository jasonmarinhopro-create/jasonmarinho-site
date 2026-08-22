// Client Meta Graph API — Facebook Page + Instagram Business Account.
// Aucune revue d'app Meta requise tant qu'on publie uniquement sur les
// comptes de l'entreprise (Admin/Testeur de l'app en mode développement).

const API_VERSION = 'v21.0'
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`

class MetaApiError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message)
  }
}

async function graphFetch(path: string, params: Record<string, string>, method: 'GET' | 'POST' = 'GET') {
  const url = new URL(`${GRAPH_URL}${path}`)
  const init: RequestInit = { method }
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  } else {
    const body = new URLSearchParams(params)
    init.body = body
    init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  }
  const res = await fetch(url.toString(), init)
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new MetaApiError(json?.error?.message ?? `Meta API ${res.status}`, res.status, json)
  }
  return json
}

// ── OAuth ──────────────────────────────────────────────────────────

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('META_APP_ID manquante')
  const scope = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'instagram_basic',
    'instagram_content_publish',
    'business_management',
  ].join(',')
  const url = new URL(`https://www.facebook.com/${API_VERSION}/dialog/oauth`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeCodeForUserToken(code: string, redirectUri: string): Promise<string> {
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const json = await graphFetch('/oauth/access_token', {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })
  return json.access_token as string
}

// Échange le token utilisateur courte durée contre un token longue durée
// (~60 jours). Les Page Access Tokens dérivés de ce token n'expirent pas
// tant que ce token longue durée reste valide.
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresInSeconds: number | null }> {
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const json = await graphFetch('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  })
  return { accessToken: json.access_token as string, expiresInSeconds: json.expires_in ?? null }
}

export interface ManagedPage {
  id: string
  name: string
  accessToken: string
  instagramAccountId: string | null
  instagramUsername: string | null
}

// Liste les Pages gérées par l'utilisateur, avec leur Instagram Business
// Account lié quand il existe (une seule requête par page, coût faible —
// un compte ne gère typiquement qu'une poignée de pages).
export async function getManagedPages(userAccessToken: string): Promise<ManagedPage[]> {
  const json = await graphFetch('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token',
  })
  const pages = (json.data ?? []) as Array<{ id: string; name: string; access_token: string }>

  return Promise.all(pages.map(async (page) => {
    let instagramAccountId: string | null = null
    let instagramUsername: string | null = null
    try {
      const igJson = await graphFetch(`/${page.id}`, {
        access_token: page.access_token,
        fields: 'instagram_business_account{id,username}',
      })
      if (igJson.instagram_business_account) {
        instagramAccountId = igJson.instagram_business_account.id
        instagramUsername = igJson.instagram_business_account.username ?? null
      }
    } catch {
      // Pas d'IG lié ou permission manquante — on garde juste la page Facebook.
    }
    return { id: page.id, name: page.name, accessToken: page.access_token, instagramAccountId, instagramUsername }
  }))
}

// ── Publication ────────────────────────────────────────────────────

export interface PostContent {
  body: string
  mediaUrls: string[]
}

export async function publishToFacebook(pageId: string, pageAccessToken: string, post: PostContent): Promise<string> {
  const firstImage = post.mediaUrls[0]
  if (firstImage) {
    const json = await graphFetch(`/${pageId}/photos`, {
      access_token: pageAccessToken,
      url: firstImage,
      caption: post.body,
      published: 'true',
    }, 'POST')
    return json.post_id ?? json.id
  }
  const json = await graphFetch(`/${pageId}/feed`, {
    access_token: pageAccessToken,
    message: post.body,
  }, 'POST')
  return json.id
}

// Instagram exige au moins une image/vidéo — pas de post texte seul.
// Flux en 2 étapes : créer le conteneur média, puis le publier.
export async function publishToInstagram(igUserId: string, pageAccessToken: string, post: PostContent): Promise<string> {
  const imageUrl = post.mediaUrls[0]
  if (!imageUrl) throw new Error('Instagram exige au moins une image — aucun media_url fourni')

  const container = await graphFetch(`/${igUserId}/media`, {
    access_token: pageAccessToken,
    image_url: imageUrl,
    caption: post.body,
  }, 'POST')

  const published = await graphFetch(`/${igUserId}/media_publish`, {
    access_token: pageAccessToken,
    creation_id: container.id,
  }, 'POST')

  return published.id
}
