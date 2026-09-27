// CSS écrit dans le code, injecté tel quel (sept. 2026).
//
// Pourquoi : React 18 échappe ' " & < > dans le texte d'une balise
// <style>{`...`}</style>. Côté serveur le CSS arrive donc cassé
// (`.a &gt; .b`, `content: &#x27;&#x27;`) et, côté navigateur, le texte ne
// correspond plus : erreur d'hydratation (React #418/#425) et page re-rendue.
// Pour un sélecteur enfant (>) ou des guillemets, passer par ce composant.
//
// Uniquement pour du CSS constant écrit par nous : jamais de donnée
// utilisateur ici (pas d'échappement). Garde-fou : lib/ui/inline-style-guard.test.ts
export default function InlineStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
