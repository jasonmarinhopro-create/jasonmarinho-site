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
@media (prefers-reduced-motion: reduce){.jm-splash img,.jm-splash-bar span{animation:none}}
`

export default function ShellFallback({
  message = 'Ton espace se prépare…',
  later = 'Encore un instant, on rassemble tes réservations et tes chiffres.',
}: { message?: string; later?: string } = {}) {
  return (
    <div className="jm-splash" role="status" aria-live="polite">
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
