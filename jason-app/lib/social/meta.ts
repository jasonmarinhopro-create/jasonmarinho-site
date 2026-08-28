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
  const url = new URL(`https://www.facebook.com/${API_VERSION}/dialog/oauth`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  // Meta a remplacé le paramètre `scope` brut par des "Configurations"
  // (Facebook Login for Business → Configurations) pour les permissions
  // Instagram Business — `instagram_business_basic` / `_content_publish`
  // ne sont plus fiables via `scope` seul. config_id référence une
  // configuration créée côté Meta qui embarque déjà les permissions.
  // Si META_LOGIN_CONFIG_ID est défini, ces permissions viennent de la
  // Configuration Meta elle-même (Facebook Login for Business →
  // Configurations) — l'ajouter ici ne suffit pas, il faut aussi les
  // ajouter côté Meta dans cette Configuration.
  const configId = process.env.META_LOGIN_CONFIG_ID
  if (configId) {
    url.searchParams.set('config_id', configId)
  } else {
    url.searchParams.set('scope', [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_business_basic',
      'instagram_business_content_publish',
      'business_management',
      // Réponses automatiques aux commentaires (cf. lib/social/comment-triggers.ts) :
      // s'abonner aux webhooks de Page + envoyer des réponses privées.
      'pages_manage_metadata',
      'pages_messaging',
      'instagram_manage_comments',
      'instagram_manage_messages',
    ].join(','))
  }
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
  const images = post.mediaUrls
  if (images.length === 1) {
    const json = await graphFetch(`/${pageId}/photos`, {
      access_token: pageAccessToken,
      url: images[0],
      caption: post.body,
      published: 'true',
    }, 'POST')
    return json.post_id ?? json.id
  }
  if (images.length > 1) {
    // Album multi-photos : chaque image est d'abord uploadée non publiée,
    // puis rattachée à un seul post via attached_media.
    const uploaded = await Promise.all(images.map(url => graphFetch(`/${pageId}/photos`, {
      access_token: pageAccessToken,
      url,
      published: 'false',
    }, 'POST')))
    const attachedMedia = JSON.stringify(uploaded.map(u => ({ media_fbid: u.id })))
    const json = await graphFetch(`/${pageId}/feed`, {
      access_token: pageAccessToken,
      message: post.body,
      attached_media: attachedMedia,
    }, 'POST')
    return json.id
  }
  const json = await graphFetch(`/${pageId}/feed`, {
    access_token: pageAccessToken,
    message: post.body,
  }, 'POST')
  return json.id
}

// Levée quand l'attente expire encore avec le conteneur toujours en cours de
// traitement (pas en erreur) — le conteneur reste valide côté Instagram, qui
// continue de le traiter en arrière-plan. On transporte son ID pour que
// l'appelant puisse le réutiliser au prochain essai plutôt que d'en créer un
// nouveau et reperdre le temps déjà investi.
export class InstagramMediaTimeoutError extends Error {
  constructor(public readonly creationId: string) {
    super('Le média met trop de temps à être traité par Instagram (délai dépassé).')
    this.name = 'InstagramMediaTimeoutError'
  }
}

// Instagram traite l'image de façon asynchrone après la création du
// conteneur média — publier avant la fin de ce traitement renvoie l'erreur
// "Media ID is not available". On attend status_code=FINISHED (poll toutes
// les 2s, jusqu'à ~52s — le gros du budget des 60s de la fonction, le reste
// couvrant la création du conteneur et l'appel media_publish) avant
// d'appeler media_publish.
async function waitForMediaReady(containerId: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < 26; attempt++) {
    const json = await graphFetch(`/${containerId}`, { access_token: token, fields: 'status_code' })
    if (json.status_code === 'FINISHED') return
    if (json.status_code === 'ERROR') throw new Error('Le traitement du média par Instagram a échoué (image invalide ou inaccessible).')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  throw new InstagramMediaTimeoutError(containerId)
}

// Instagram exige au moins une image/vidéo — pas de post texte seul.
// 1 image : conteneur média puis publication directe.
// 2+ images : chaque image devient un conteneur enfant (is_carousel_item),
// regroupés dans un conteneur CAROUSEL, puis publication de ce conteneur.
//
// `resumeCreationId` : si un essai précédent a expiré en attendant Instagram
// (InstagramMediaTimeoutError), le conteneur créé reste valide côté Instagram
// qui continue de le traiter en arrière-plan. On le réutilise au lieu d'en
// recréer un — sinon chaque "Réessayer" repart de zéro et retombe sur le
// même délai, ce qui explique un échec qui "revient tout le temps".
export async function publishToInstagram(igUserId: string, pageAccessToken: string, post: PostContent, resumeCreationId?: string | null): Promise<string> {
  const images = post.mediaUrls
  if (images.length === 0) throw new Error('Instagram exige au moins une image — aucun media_url fourni')

  let creationId: string
  if (resumeCreationId) {
    creationId = resumeCreationId
  } else if (images.length === 1) {
    const container = await graphFetch(`/${igUserId}/media`, {
      access_token: pageAccessToken,
      image_url: images[0],
      caption: post.body,
    }, 'POST')
    creationId = container.id
  } else {
    if (images.length > 10) throw new Error('Instagram limite les carrousels à 10 images maximum')
    const children = await Promise.all(images.map(image_url => graphFetch(`/${igUserId}/media`, {
      access_token: pageAccessToken,
      image_url,
      is_carousel_item: 'true',
    }, 'POST')))
    const carousel = await graphFetch(`/${igUserId}/media`, {
      access_token: pageAccessToken,
      media_type: 'CAROUSEL',
      caption: post.body,
      children: children.map(c => c.id).join(','),
    }, 'POST')
    creationId = carousel.id
  }

  await waitForMediaReady(creationId, pageAccessToken)

  const published = await graphFetch(`/${igUserId}/media_publish`, {
    access_token: pageAccessToken,
    creation_id: creationId,
  }, 'POST')

  return published.id
}

// Abonne un nœud (Page Facebook OU compte Instagram Business — chacun a son
// propre edge subscribed_apps, l'abonnement de l'un ne couvre pas l'autre)
// aux webhooks de l'app pour les champs donnés — évite de dépendre du flow
// "Générer un token" du dashboard Meta (peu fiable, popup de login
// Instagram qui échoue souvent). Suffit à lui seul pour recevoir
// feed/comments dès lors que l'app a déjà l'URL de webhook + le champ
// correspondant activés côté App Dashboard.
export async function subscribePageWebhooks(nodeId: string, accessToken: string, fields: string[]): Promise<void> {
  await graphFetch(`/${nodeId}/subscribed_apps`, {
    access_token: accessToken,
    subscribed_fields: fields.join(','),
  }, 'POST')
}

// État réel de l'abonnement, tel que Meta le voit — sert à diagnostiquer
// sans deviner (ex : bouton "Diagnostiquer" dans Admin → Réseaux sociaux)
// plutôt que d'empiler des hypothèses sur pourquoi un webhook n'arrive pas.
export async function getSubscribedApps(nodeId: string, accessToken: string): Promise<Array<{ id: string; name?: string; subscribed_fields?: string[] }>> {
  const json = await graphFetch(`/${nodeId}/subscribed_apps`, { access_token: accessToken }, 'GET')
  return json.data ?? []
}

// Permissions réellement accordées sur un token stocké — un token créé
// avant l'ajout d'une permission (ex : instagram_manage_comments) ne
// l'embarque pas tant qu'il n'y a pas eu de reconnexion, même si la
// permission existe désormais côté Configuration Meta. Sert à vérifier ça
// directement plutôt que de supposer que "Reconnecter" a suffi.
// Config webhook de l'app elle-même (URL de callback, objets/champs
// actifs) telle que Meta l'a réellement enregistrée — indépendant de ce
// qu'affiche le dashboard Meta, qui peut ne pas refléter un enregistrement
// qui a échoué silencieusement.
export async function getAppSubscriptions(): Promise<Array<{ object: string; callback_url: string; active: boolean; fields: string[] }>> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET manquants')
  // Chaque entrée de "fields" est un objet ({ name, version }), pas une
  // simple chaîne — mappé vers son nom pour un affichage lisible.
  const json = await graphFetch(`/${appId}/subscriptions`, {
    access_token: `${appId}|${appSecret}`,
  }, 'GET')
  const data = (json.data ?? []) as Array<{ object: string; callback_url: string; active: boolean; fields: Array<string | { name: string }> }>
  return data.map(s => ({
    ...s,
    fields: s.fields.map(f => typeof f === 'string' ? f : f.name),
  }))
}

// Enregistre le webhook de l'app elle-même (URL + jeton + champs) via
// l'API plutôt que via le dashboard Meta — dont l'écran "Configurez les
// webhooks" s'est avéré ne pas sauvegarder réellement malgré un état de
// succès affiché (confirmé via getAppSubscriptions : aucune souscription
// enregistrée côté Meta). Meta valide le hub.challenge sur l'URL avant
// d'accepter, donc échoue franchement si le callback ne répond pas.
export async function subscribeAppWebhook(object: string, fields: string[]): Promise<void> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET manquants')
  if (!verifyToken) throw new Error('META_WEBHOOK_VERIFY_TOKEN manquant')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
  await graphFetch(`/${appId}/subscriptions`, {
    access_token: `${appId}|${appSecret}`,
    object,
    callback_url: `${appUrl}/api/social/webhook/meta`,
    verify_token: verifyToken,
    fields: fields.join(','),
  }, 'POST')
}

export async function debugTokenScopes(accessToken: string): Promise<string[]> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET manquants')
  const json = await graphFetch('/debug_token', {
    input_token: accessToken,
    access_token: `${appId}|${appSecret}`,
  }, 'GET')
  return json.data?.scopes ?? []
}

// ── Réponses automatiques aux commentaires ────────────────────────

// Réponse en message privé à un commentaire (pas un commentaire public) —
// même endpoint pour Facebook et Instagram. C'est la seule action possible
// pour "recontacter" un commentateur : Meta ne donne jamais son email.
export async function sendPrivateReply(commentId: string, pageAccessToken: string, message: string): Promise<string> {
  const json = await graphFetch(`/${commentId}/private_replies`, {
    access_token: pageAccessToken,
    message,
  }, 'POST')
  return json.id ?? 'ok'
}

// ── Stats d'engagement ────────────────────────────────────────────

export interface PostInsights {
  likeCount: number
  commentCount: number
}

export async function getFacebookPostInsights(postId: string, pageAccessToken: string): Promise<PostInsights> {
  const json = await graphFetch(`/${postId}`, {
    access_token: pageAccessToken,
    fields: 'likes.summary(true).limit(0),comments.summary(true).limit(0)',
  })
  return {
    likeCount: json.likes?.summary?.total_count ?? 0,
    commentCount: json.comments?.summary?.total_count ?? 0,
  }
}

export async function getInstagramMediaInsights(mediaId: string, pageAccessToken: string): Promise<PostInsights> {
  const json = await graphFetch(`/${mediaId}`, {
    access_token: pageAccessToken,
    fields: 'like_count,comments_count',
  })
  return {
    likeCount: json.like_count ?? 0,
    commentCount: json.comments_count ?? 0,
  }
}
