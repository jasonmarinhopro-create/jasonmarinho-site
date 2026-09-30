// Écran de chargement à l'ouverture de l'app (30/09/2026, Jason : « une page
// de chargement à la place de la page blanche »). Envoyé avant toute requête
// pendant que le serveur vérifie la session et charge le compte : logo sur le
// vert de la marque (même fond que l'icône de l'app), barre qui avance, puis
// un second message au bout de 4 s. Composant serveur, sans JavaScript
// (animations CSS seulement). Ne s'affiche qu'au premier chargement : les
// changements de page gardent le menu et montrent le squelette de la page.
// Réutilisé par la page statique /ouverture (lancement de l'app installée)
// et pendant le passage mode admin / mode hôte (Sidebar.tsx).
import InlineStyle from '@/components/ui/InlineStyle'

const CSS = `
.jm-splash{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#004C3F;color:#fff;padding:24px;text-align:center}
.jm-splash img{width:88px;height:88px;border-radius:22px;box-shadow:0 18px 40px rgba(0,0,0,.25);animation:jmPulse 1.8s ease-in-out infinite}
.jm-splash-name{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;letter-spacing:-.02em;margin:0}
.jm-splash-name em{color:#FFD56B;font-style:italic;font-weight:300}
.jm-splash-bar{width:180px;height:4px;border-radius:4px;background:rgba(255,255,255,.15);overflow:hidden}
.jm-splash-bar span{display:block;width:40%;height:100%;border-radius:4px;background:#FFD56B;animation:jmSlide 1.2s ease-in-out infinite}
.jm-splash-msg{font-size:14.5px;color:rgba(255,255,255,.72);margin:0;min-height:44px;display:grid}
.jm-splash-msg span{grid-area:1/1}
.jm-splash-msg .m2{opacity:0;animation:jmIn .4s ease 4s forwards}
.jm-splash-msg .m1{animation:jmOut .4s ease 4s forwards}
@keyframes jmSlide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@keyframes jmPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes jmIn{to{opacity:1}}
@keyframes jmOut{to{opacity:0}}
.jm-splash--delayed{animation:jmAppear .25s ease .45s both}
.jm-splash--out{pointer-events:none;animation:jmVanish .35s ease .05s forwards}
@keyframes jmAppear{from{opacity:0}to{opacity:1}}
@keyframes jmVanish{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion: reduce){.jm-splash img,.jm-splash-bar span{animation:none}}
`

// Variantes (30/09/2026, Jason : « quand ça va vite, l'écran apparaît 0,1 s
// puis ça saute, on dirait un bug ») :
// - instant : visible tout de suite (suite de l'écran de /ouverture) ;
// - delayed : n'apparaît qu'après 0,45 s, donc jamais quand la page est rapide ;
// - out : posé par-dessus la page arrivée, s'efface en fondu (0,35 s).
export type SplashVariant = 'instant' | 'delayed' | 'out'

export default function ShellFallback({
  message = 'Ton espace se prépare…',
  later = 'Encore un instant, on rassemble tes réservations et tes chiffres.',
  variant = 'instant',
}: { message?: string; later?: string; variant?: SplashVariant } = {}) {
  const cls = variant === 'delayed' ? ' jm-splash--delayed' : variant === 'out' ? ' jm-splash--out' : ''
  return (
    <div className={`jm-splash${cls}`} role={variant === 'out' ? undefined : 'status'} aria-live={variant === 'out' ? undefined : 'polite'} aria-hidden={variant === 'out' ? true : undefined}>
      <InlineStyle css={CSS} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={88} height={88} />
      <p className="jm-splash-name">Jason <em>Marinho</em></p>
      <div className="jm-splash-bar" aria-hidden="true"><span /></div>
      <p className="jm-splash-msg">
        <span className="m1">{message}</span>
        <span className="m2">{later}</span>
      </p>
    </div>
  )
}
