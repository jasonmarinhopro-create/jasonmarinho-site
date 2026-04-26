import { renderMarkdown } from '@/lib/chez-nous/markdown'

/**
 * Affiche un texte avec markdown léger (gras, italique, liens, sauts de ligne).
 * Le HTML est généré côté server par renderMarkdown qui échappe les inputs.
 */
export default function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const html = renderMarkdown(text)
  return (
    <div
      style={style}
      className="cn-rich"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
