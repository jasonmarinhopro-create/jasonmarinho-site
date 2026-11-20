// Dernière version de la page d'arrivée gardée dans l'appareil (20/11/2026,
// Jason : « la dernière version de l'accueil affichée instantanément puis
// mise à jour en arrière-plan », méthode Linear / Notion).
//
// À l'ouverture de l'app, au lieu de l'écran au logo, on affiche la copie de
// la page d'arrivée (Accueil, Vue d'ensemble admin, fiche pro) prise à la
// dernière visite, figée (pas de clic), avec « Mise à jour… ». La vraie page
// arrive du serveur derrière et la remplace en fondu.
//
// Garde-fous :
// - copie liée au compte : affichée seulement si la session du navigateur
//   est celle du même compte (identifiant lu dans le cookie de session) ;
// - effacée à la déconnexion (signOutHere), périmée au bout de 7 jours ;
// - largeur d'écran proche de celle de la prise (sinon mise en page fausse) ;
// - une copie par mode (hôte ou pro / admin), 1,2 million de caractères au plus.
//
// Deux versions de la lecture : readLaunchSnapshot (navigateur, React) et
// SNAP_READ_JS (script en ligne, exécuté avant le premier affichage, quand
// React n'est pas encore là). Le test vérifie qu'elles répondent pareil.

export const SNAP_PREFIX = 'jm-snap:'
export const SNAP_HOME_PREFIX = 'jm-snap-home:'
export const SNAP_MAX_AGE_MS = 7 * 24 * 3600 * 1000
export const SNAP_MAX_BYTES = 1_200_000
export const SNAP_WIDTH_TOLERANCE = 80

export type SnapMode = 'admin' | 'user'

export interface LaunchSnapshot {
  v: 1
  /** compte */
  u: string
  /** page copiée */
  p: string
  /** largeur de l'écran à la prise */
  w: number
  /** date de la prise (ms) */
  t: number
  /** HTML du cadre (.dash-layout) */
  h: string
}

interface KV { getItem(k: string): string | null }

/** Mode de l'appareil (bascule admin restée active) */
export function snapMode(cookie: string): SnapMode {
  return cookie.split(/;\s*/).indexOf('jm-admin-mode=1') >= 0 ? 'admin' : 'user'
}

function b64(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return atob(s)
}

/** Identifiant du compte de la session du navigateur (cookie Supabase), sinon '' */
export function sessionUserId(cookie: string): string {
  try {
    const parts: Record<string, string> = {}
    let base = ''
    cookie.split(/;\s*/).forEach(c => {
      const i = c.indexOf('=')
      if (i < 0) return
      const name = c.slice(0, i)
      const m = /^(sb-.+-auth-token)(?:\.(\d+))?$/.exec(name)
      if (!m) return
      base = m[1]
      parts[m[2] === undefined ? '-1' : m[2]] = c.slice(i + 1)
    })
    if (!base) return ''
    let raw = parts['-1'] || ''
    if (!raw) { let n = 0; while (parts[String(n)] !== undefined) { raw += parts[String(n)]; n++ } }
    raw = decodeURIComponent(raw)
    if (raw.indexOf('base64-') === 0) raw = b64(raw.slice(7))
    const s = JSON.parse(raw)
    const token = Array.isArray(s) ? s[0] : s && s.access_token
    if (typeof token !== 'string') return ''
    const claims = JSON.parse(b64(token.split('.')[1] || ''))
    return typeof claims.sub === 'string' ? claims.sub : ''
  } catch {
    return ''
  }
}

// Pages où la copie peut s'afficher : le lancement, les pages d'arrivée
// (/dashboard renvoie un pro sur sa fiche) et la page copiée elle-même.
// Ailleurs (rechargement d'une autre page dans les 20 s du cookie jm-launch),
// l'écran au logo : jamais l'Accueil par-dessus une autre page.
export function snapAllowedOn(path: string, snapPath: string): boolean {
  return path === '/ouverture' || path === '/dashboard' || path === '/dashboard/admin' || path === snapPath
}

/** HTML de la copie à afficher maintenant sur la page `path`, sinon '' */
export function readLaunchSnapshot(cookie: string, ls: KV, width: number, now: number, path: string): string {
  try {
    const u = sessionUserId(cookie)
    if (!u) return ''
    const s = JSON.parse(ls.getItem(SNAP_PREFIX + snapMode(cookie)) || 'null') as LaunchSnapshot | null
    if (!s || s.v !== 1 || s.u !== u || typeof s.h !== 'string') return ''
    if (!(now - s.t < SNAP_MAX_AGE_MS) || s.t > now + 60_000) return ''
    if (Math.abs(s.w - width) > SNAP_WIDTH_TOLERANCE) return ''
    if (!snapAllowedOn(path, s.p)) return ''
    return s.h
  } catch {
    return ''
  }
}

/** Page d'arrivée connue pour ce mode (où prendre la copie) */
export function snapHome(ls: KV, mode: SnapMode): string {
  try {
    const p = ls.getItem(SNAP_HOME_PREFIX + mode)
    if (p && /^\/dashboard[\w\-/]*$/.test(p)) return p
  } catch { /* ignore */ }
  return mode === 'admin' ? '/dashboard/admin' : '/dashboard'
}

/** Copie prête à ranger, ou null si trop lourde */
export function buildSnapshot(u: string, p: string, w: number, t: number, h: string): LaunchSnapshot | null {
  if (!u || !h || h.length > SNAP_MAX_BYTES) return null
  return { v: 1, u, p, w, t, h }
}

// Même lecture que readLaunchSnapshot, en JavaScript simple pour un script en
// ligne (pas de module ni de syntaxe récente). Appelée avec
// (document.cookie, localStorage, innerWidth, Date.now(), location.pathname).
export const SNAP_READ_JS = `function(c,ls,w,now,path){try{
function b(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return atob(s)}
var parts={},base='';c.split(/;\\s*/).forEach(function(x){var i=x.indexOf('=');if(i<0)return;var m=/^(sb-.+-auth-token)(?:\\.(\\d+))?$/.exec(x.slice(0,i));if(!m)return;base=m[1];parts[m[2]===undefined?'-1':m[2]]=x.slice(i+1)});
if(!base)return'';var raw=parts['-1']||'';if(!raw){var n=0;while(parts[String(n)]!==undefined){raw+=parts[String(n)];n++}}
raw=decodeURIComponent(raw);if(raw.indexOf('base64-')===0)raw=b(raw.slice(7));
var s=JSON.parse(raw);var tk=Array.isArray(s)?s[0]:s&&s.access_token;if(typeof tk!=='string')return'';
var cl=JSON.parse(b(tk.split('.')[1]||''));var u=typeof cl.sub==='string'?cl.sub:'';if(!u)return'';
var mode=c.split(/;\\s*/).indexOf('jm-admin-mode=1')>=0?'admin':'user';
var sn=JSON.parse(ls.getItem('${SNAP_PREFIX}'+mode)||'null');
if(!sn||sn.v!==1||sn.u!==u||typeof sn.h!=='string')return'';
if(!(now-sn.t<${SNAP_MAX_AGE_MS})||sn.t>now+60000)return'';
if(Math.abs(sn.w-w)>${SNAP_WIDTH_TOLERANCE})return'';
if(!(path==='/ouverture'||path==='/dashboard'||path==='/dashboard/admin'||path===sn.p))return'';
return sn.h}catch(e){return''}}`

/** Script en ligne posé juste après le conteneur vide de la copie */
export const SNAP_FILL_INLINE = `(function(){try{var el=document.currentScript&&document.currentScript.previousElementSibling;if(!el||el.innerHTML)return;var h=(${SNAP_READ_JS})(document.cookie,localStorage,innerWidth,Date.now(),location.pathname);if(h)el.innerHTML=h}catch(e){}})()`

/** Efface toutes les copies (déconnexion) */
export function clearLaunchSnapshots() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.indexOf(SNAP_PREFIX) === 0 || k.indexOf(SNAP_HOME_PREFIX) === 0)) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
