'use client'

// Affichage d'une leçon (23/11/2026) : blocs de lib/formations/blocks.ts.
// Questions (« Vérifie ») et action de fin de module (« Passe à l'action »)
// sont interactives ; le reste est du texte mis en forme.
import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, XCircle, ArrowRight, Lightbulb, Warning, Calculator, PushPin,
  Target, Check, CalendarCheck, ChatCircleText, Copy, PencilSimpleLine, ThumbsUp, ThumbsDown, FileText,
} from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import { rememberLessonReturn } from './LessonReturnPill'
import { plainText, type Block, type CardBlock } from '@/lib/formations/blocks'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Gras, italique et code en ligne ; tout le reste est échappé. */
export function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="lc-mark">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="lc-em">$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-2);padding:1px 6px;border-radius:5px;font-size:0.92em;color:var(--accent-text)">$1</code>')
}

function Html({ text, as: Tag = 'span', style, className }: { text: string; as?: 'span' | 'p' | 'li'; style?: React.CSSProperties; className?: string }) {
  return <Tag style={style} className={className} dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className="lc-copy" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1800) }).catch(() => {})
    }}>
      {ok ? <Check size={13} weight="bold" /> : <Copy size={13} />} {ok ? 'Copié' : 'Copier'}
    </button>
  )
}

function ItemList({ style, items }: { style: string; items: string[] }) {
  if (style === 'step') return <ol className="lc-steps">{items.map((it, j) => <li key={j}><span className="lc-num">{j + 1}</span><Html text={it} /></li>)}</ol>
  return (
    <ul>{items.map((it, j) => (
      <li key={j} className="lc-li">
        {style === 'good' ? <CheckCircle size={17} weight="fill" color="var(--success-1)" />
          : style === 'bad' ? <XCircle size={17} weight="fill" color="var(--danger)" />
          : style === 'arrow' ? <ArrowRight size={15} weight="bold" color="var(--accent-text)" />
          : <span className="lc-dot" />}
        <Html text={it} />
      </li>
    ))}</ul>
  )
}

function CardView({ c, delay = 0 }: { c: CardBlock; delay?: number }) {
  return (
    <div className="lc-card" style={{ animationDelay: `${Math.min(delay, 8) * 60}ms` }}>
      {c.num && <span className="lc-card-n">{c.num}</span>}
      <div className="lc-card-b">
        <span className="lc-card-t"><span dangerouslySetInnerHTML={{ __html: formatInline(c.title) }} />{c.note && <span className="lc-card-note" dangerouslySetInnerHTML={{ __html: formatInline(c.note) }} />}</span>
        {c.body.length > 0 && <Html as="p" text={c.body.join('\n')} />}
        {c.list && <ItemList style={c.list.style} items={c.list.items} />}
      </div>
    </div>
  )
}

export type QuizState = Record<number, { picked: number; correct: boolean }>
export type ActionWhen = 'done' | 'ce-soir' | 'demain' | 'week-end'

export default function LessonContent({
  blocks, quiz, onAnswer, action, onAction, returnLabel,
}: {
  /** Libellé de la pastille « Revenir à ta leçon » (titre de la leçon) */
  returnLabel?: string
  blocks: Block[]
  quiz: QuizState
  onAnswer: (index: number, picked: number, correct: boolean) => void
  /** Choix déjà fait pour l'action de ce module (null = rien). */
  action: { when: ActionWhen; dueLabel?: string } | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void
}) {
  return (
    <div className="lc">
      {blocks.map((b, i) => <BlockView key={i} b={b} quiz={quiz} onAnswer={onAnswer} action={action} onAction={onAction} returnLabel={returnLabel} />)}
      <InlineStyle css={LC_CSS} />
    </div>
  )
}

const CALLOUT_META = {
  retenir: { title: 'À retenir', Icon: PushPin },
  erreur: { title: 'Erreur fréquente', Icon: Warning },
  exemple: { title: 'Exemple', Icon: Calculator },
  astuce: { title: 'Astuce', Icon: Lightbulb },
} as const

function BlockView({ b, quiz, onAnswer, action, onAction, returnLabel }: {
  returnLabel?: string
  b: Block
  quiz: QuizState
  onAnswer: (index: number, picked: number, correct: boolean) => void
  action: { when: ActionWhen; dueLabel?: string } | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void
}) {
  switch (b.type) {
    case 'h2': return <h2 id={b.id}>{b.text}</h2>
    case 'h3': return <h3 id={b.id}>{b.badge && <span className={`lc-badge${/^\d+$/.test(b.badge) ? ' n' : ''}`}>{b.badge}</span>}{b.text}</h3>
    case 'label': {
      // « CHARGES FIXES (même si le logement est vide) » : la précision en plus petit
      const m = /^(.*?)\s*(\(.*\))\s*$/.exec(b.text)
      return <div className="lc-label">{m ? m[1] : b.text}{m && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: 'var(--text-3)', marginLeft: '6px' }}>{m[2]}</span>}</div>
    }
    case 'p': return <Html as="p" text={b.text} />
    case 'list':
      return (
        <ul>
          {b.items.map((it, j) => (
            <li key={j} className="lc-li">
              {b.style === 'good' ? <CheckCircle size={18} weight="fill" color="var(--success-1)" />
                : b.style === 'bad' ? <XCircle size={18} weight="fill" color="var(--danger)" />
                : b.style === 'arrow' ? <ArrowRight size={16} weight="bold" color="var(--accent-text)" />
                : <span className="lc-dot" />}
              <Html text={it} />
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="lc-steps">
          {b.items.map((it, j) => <li key={j}><span className="lc-num">{j + 1}</span><Html text={it} /></li>)}
        </ol>
      )
    case 'quote':
      return b.source
        ? <Html as="p" text={b.text} style={{ fontSize: '12.5px', color: 'var(--text-muted)' }} />
        : <div className="lc-quote"><Html text={b.text} /></div>
    case 'table':
      return (
        <div className="lc-table">
          <table>
            <thead><tr>{b.headers.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Html text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case 'pre':
      return (
        <div className="lc-model">
          <div className="lc-msg-h"><span><FileText size={14} weight="fill" /> Modèle</span><CopyButton text={b.text} /></div>
          <pre className="lc-pre">{b.text}</pre>
        </div>
      )
    case 'card': return <CardView c={b} />
    case 'cards': return <div className="lc-cards">{b.items.map((c, j) => <CardView key={j} c={c} delay={j} />)}</div>
    case 'compare':
      return (
        <div className="lc-compare">
          <div className="lc-col g">
            <span className="lc-col-t"><ThumbsUp size={15} weight="fill" /> À faire</span>
            <ul>{b.good.map((it, j) => <li key={j} className="lc-li"><CheckCircle size={18} weight="fill" color="var(--success-1)" /><Html text={it} /></li>)}</ul>
          </div>
          <div className="lc-col b">
            <span className="lc-col-t"><ThumbsDown size={15} weight="fill" /> À éviter</span>
            <ul>{b.bad.map((it, j) => <li key={j} className="lc-li"><XCircle size={18} weight="fill" color="var(--danger)" /><Html text={it} /></li>)}</ul>
          </div>
        </div>
      )
    case 'punch': return <Html as="p" text={b.text} style={{}} className="lc-punch" />
    case 'message':
      return (
        <div className="lc-msg">
          <div className="lc-msg-h"><span><ChatCircleText size={15} weight="fill" /> Message type</span><CopyButton text={plainText(b.lines)} /></div>
          <div className="lc-msg-b">{b.lines.map((l, j) => <Html key={j} as="p" text={l} />)}</div>
        </div>
      )
    case 'exercise':
      return (
        <div className="lc-ex">
          <span className="lc-ex-t"><PencilSimpleLine size={15} weight="fill" /> À toi de jouer{b.title ? ` · ${b.title}` : ''}</span>
          <div className="lc">{b.blocks.map((x, j) => <BlockView key={j} b={x} quiz={quiz} onAnswer={onAnswer} action={action} onAction={onAction} />)}</div>
        </div>
      )
    case 'bref':
      return (
        <div className="lc-bref">
          <span className="lc-bref-t">En bref</span>
          <ol>{b.items.map((it, j) => <Html key={j} as="li" text={it} />)}</ol>
        </div>
      )
    case 'callout': {
      const { title, Icon } = CALLOUT_META[b.kind]
      return (
        <div className={`lc-callout lc-${b.kind}`}>
          <Icon size={20} weight="fill" />
          <div className="lc-callout-b">
            <span className="lc-callout-t">{b.title ?? title}</span>
            {b.text.map((t, j) => <Html key={j} as="p" text={t} />)}
            {b.list && <ItemList style={b.list.style} items={b.list.items} />}
          </div>
        </div>
      )
    }
    case 'figures':
      return (
        <div className="lc-figs">
          {b.items.map((f, j) => (
            <div key={j} className="lc-fig" style={{ animationDelay: `${j * 90}ms` }}>
              <strong>{f.value}</strong><span>{f.label}</span>
            </div>
          ))}
        </div>
      )
    case 'quiz': return <QuizView b={b} state={quiz[b.index]} onAnswer={onAnswer} />
    case 'action': return <ActionView b={b} state={action} onAction={onAction} returnLabel={returnLabel} />
  }
}

function QuizView({ b, state, onAnswer }: {
  b: Extract<Block, { type: 'quiz' }>
  state?: { picked: number; correct: boolean }
  onAnswer: (index: number, picked: number, correct: boolean) => void
}) {
  const done = !!state
  return (
    <div className="lc-quiz" role="group" aria-label={`Question : ${b.question}`}>
      <span className="lc-quiz-t"><Target size={14} weight="fill" /> Vérifie</span>
      <div className="lc-quiz-q">{b.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {b.options.map((o, j) => {
          const cls = !done ? '' : o.correct ? ' lc-opt-good' : state!.picked === j ? ' lc-opt-bad' : ' lc-opt-dim'
          return (
            <button key={j} type="button" className={`lc-opt${cls}`} disabled={done} onClick={() => onAnswer(b.index, j, o.correct)}>
              {done && o.correct && <CheckCircle size={18} weight="fill" color="var(--success-1)" />}
              {done && !o.correct && state!.picked === j && <XCircle size={18} weight="fill" color="var(--danger)" />}
              <span>{o.text}</span>
            </button>
          )
        })}
      </div>
      {done && (
        <div className="lc-why" aria-live="polite">
          <b>{state!.correct ? 'Bonne réponse.' : 'Pas tout à fait.'}</b>{b.explanation ? <> <span dangerouslySetInnerHTML={{ __html: formatInline(b.explanation) }} /></> : null}
        </div>
      )}
    </div>
  )
}

const WHEN_LABEL: Record<Exclude<ActionWhen, 'done'>, string> = {
  'ce-soir': 'Ce soir', demain: 'Demain', 'week-end': 'Ce week-end',
}

function ActionView({ b, state, onAction, returnLabel }: {
  returnLabel?: string
  b: Extract<Block, { type: 'action' }>
  state: { when: ActionWhen; dueLabel?: string } | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void
}) {
  const [busy, setBusy] = useState(false)
  const pick = (w: ActionWhen) => { setBusy(true); onAction(b.title, b.href, w) }
  return (
    <div className="lc-action">
      <span className="lc-action-t"><Target size={14} weight="fill" /> Passe à l&apos;action</span>
      <div className="lc-action-h">{b.title}</div>
      {b.text && <Html as="p" text={b.text} />}
      {b.href && (
        b.href.startsWith('/') && !b.href.startsWith('//')
          ? <>
              <Link prefetch={false} href={b.href} className="lc-btn" onClick={() => { rememberLessonReturn(returnLabel ?? b.title); if (!state) onAction(b.title, b.href, 'done') }}>{b.button || 'J\'y vais'} <ArrowRight size={15} weight="bold" /></Link>
              <small className="lc-return-hint">La page s&apos;ouvre dans l&apos;app ; un bouton « Revenir à ta leçon » te ramène ici.</small>
            </>
          : null
      )}
      {!b.href && !state && (
        <button type="button" className="lc-btn" disabled={busy} onClick={() => pick('done')}><Check size={15} weight="bold" /> C&apos;est fait</button>
      )}
      {state ? (
        <div className="lc-planned">
          {state.when === 'done'
            ? <><CheckCircle size={18} weight="fill" /> Action faite, bravo.</>
            : <><CalendarCheck size={18} weight="fill" /> C&apos;est noté : rappel {state.dueLabel ?? WHEN_LABEL[state.when].toLowerCase()} dans ta cloche.</>}
        </div>
      ) : (
        <div className="lc-when">
          <span>Pas maintenant ? Choisis ton moment :</span>
          {(Object.keys(WHEN_LABEL) as Array<Exclude<ActionWhen, 'done'>>).map(w => (
            <button key={w} type="button" className="lc-chip" disabled={busy} onClick={() => pick(w)}>{WHEN_LABEL[w]}</button>
          ))}
        </div>
      )}
    </div>
  )
}

const LC_CSS = `
        .lc { display: flex; flex-direction: column; gap: 18px; font-size: 16px; line-height: 1.75; color: var(--text-2); }
        .lc h2 { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(22px, 2.4vw, 28px); line-height: 1.2; color: var(--text); margin: 18px 0 0; scroll-margin-top: 90px; }
        .lc h3 { font-size: 17px; font-weight: 600; color: var(--text); margin: 8px 0 0; scroll-margin-top: 90px; }
        .lc p { margin: 0; }
        .lc-label { font-size: 12px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--accent-text); margin-top: 4px; }
        .lc ul, .lc ol { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 9px; }
        .lc-li { display: flex; gap: 10px; align-items: flex-start; }
        .lc-li svg, .lc-dot { flex-shrink: 0; margin-top: 6px; }
        .lc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-text); margin-top: 11px; }
        .lc-steps li { display: flex; gap: 12px; align-items: flex-start; }
        .lc-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--accent-bg); border: 1px solid var(--accent-border); color: var(--accent-text); font-weight: 700; font-size: 13px; display: grid; place-items: center; margin-top: 1px; }
        .lc-quote { border-left: 3px solid var(--accent-border); padding: 2px 0 2px 14px; font-size: 14.5px; }
        .lc-source { font-size: 12.5px; color: var(--text-muted); }
        .lc-table { overflow-x: auto; border: 1px solid var(--border); border-radius: 12px; }
        .lc-table table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .lc-table th { text-align: left; padding: 10px 14px; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-3); background: var(--surface); border-bottom: 1px solid var(--border); }
        .lc-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
        .lc-table tr:last-child td { border-bottom: 0; }
        .lc-pre { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; font-size: 14px; line-height: 1.65; white-space: pre-wrap; margin: 0; font-family: inherit; }
        .lc-bref { background: var(--accent-bg); border: 1px solid var(--accent-border); border-radius: 16px; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
        .lc-bref-t { font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-text); }
        .lc-bref ol { counter-reset: b; gap: 6px; }
        .lc-bref li { display: flex; gap: 10px; color: var(--text); font-size: 15.5px; line-height: 1.55; }
        .lc-bref li::before { counter-increment: b; content: counter(b); flex-shrink: 0; font-weight: 700; color: var(--accent-text); min-width: 14px; }
        .lc-callout { border-radius: 14px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--border); background: var(--surface); }
        .lc-callout svg { flex-shrink: 0; margin-top: 3px; }
        .lc-callout-b ul { gap: 6px; margin-top: 4px; }
        .lc-callout-b { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 15px; line-height: 1.65; }
        .lc-callout-t { font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .lc-retenir { background: var(--accent-bg); border-color: var(--accent-border); }
        .lc-retenir .lc-callout-t, .lc-retenir svg { color: var(--accent-text); }
        .lc-erreur { background: var(--danger-bg); border-color: var(--danger-border); }
        .lc-erreur .lc-callout-t, .lc-erreur svg { color: var(--danger); }
        .lc-exemple { background: rgba(255,213,107,0.10); border-color: rgba(255,213,107,0.35); }
        .lc-exemple .lc-callout-t, .lc-exemple svg { color: #FFD56B; }
        [data-theme=light] .lc-exemple .lc-callout-t, [data-theme=light] .lc-exemple svg { color: #8A6A10; }
        .lc-astuce .lc-callout-t, .lc-astuce svg { color: var(--accent-text); }
        .lc-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .lc-fig { border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; background: var(--surface); display: flex; flex-direction: column; gap: 2px; animation: lcPop .5s ease both; }
        .lc-fig strong { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 30px; line-height: 1.1; color: var(--accent-text); font-variant-numeric: tabular-nums; }
        .lc-fig span { font-size: 13px; color: var(--text-3); line-height: 1.4; }
        .lc-quiz { border: 1.5px solid var(--accent-border); border-radius: 16px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; background: var(--bg); }
        .lc-quiz-t { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-text); }
        .lc-quiz-q { font-weight: 600; color: var(--text); font-size: 16px; line-height: 1.5; }
        .lc-opt { text-align: left; width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); border-radius: 12px; padding: 11px 14px; font: inherit; font-size: 15px; line-height: 1.45; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: background .15s, border .15s, transform .15s; }
        .lc-opt:hover:not(:disabled) { border: 1px solid var(--accent-border); background: var(--accent-bg); }
        .lc-opt:disabled { cursor: default; }
        .lc-opt:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
        .lc-opt-good { border: 1.5px solid var(--success-1) !important; background: var(--success-bg) !important; color: var(--text) !important; }
        .lc-opt-bad { border: 1.5px solid var(--danger) !important; background: var(--danger-bg) !important; }
        .lc-opt-dim { opacity: .55; }
        .lc-opt svg { flex-shrink: 0; margin-top: 2px; }
        .lc-why { font-size: 14.5px; line-height: 1.6; padding: 10px 14px; border-radius: 12px; background: var(--surface-2); animation: lcIn .35s ease both; }
        .lc-why b { color: var(--text); }
        .lc-action { border: 1.5px dashed var(--accent-border); border-radius: 18px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; background: var(--accent-bg); }
        .lc-action-t { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-text); }
        .lc-action-h { font-family: var(--font-fraunces), serif; font-size: 21px; color: var(--text); line-height: 1.25; }
        .lc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; border-radius: 12px; background: var(--accent-text); color: var(--bg); font-weight: 700; font-size: 14.5px; text-decoration: none; border: 0; cursor: pointer; font-family: inherit; align-self: flex-start; }
        .lc-when { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 14px; }
        .lc-chip { border: 1px solid var(--border); background: var(--bg); color: var(--text-2); border-radius: 999px; padding: 6px 13px; font: inherit; font-size: 13.5px; cursor: pointer; }
        .lc-chip:hover { border: 1px solid var(--accent-border); color: var(--accent-text); }
        .lc-return-hint { font-size: 12.5px; color: var(--text-3); margin-top: -4px; }
        .lc-planned { display: flex; align-items: center; gap: 8px; font-size: 14.5px; color: var(--text); font-weight: 500; animation: lcIn .35s ease both; }
        .lc-planned svg { color: var(--success-1); flex-shrink: 0; }
        .lc-mark { color: var(--text); font-weight: 600; background: linear-gradient(180deg, transparent 58%, rgba(255,213,107,.38) 58%); padding: 0 1px; border-radius: 2px; }
        [data-theme=light] .lc-mark { background: linear-gradient(180deg, transparent 58%, rgba(255,213,107,.55) 58%); }
        .lc-em { color: var(--accent-text); font-style: italic; }
        .lc h3 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .lc-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 99px; background: var(--accent-text); color: var(--bg); font-size: 11.5px; font-weight: 700; letter-spacing: .03em; white-space: nowrap; }
        .lc-badge.n { width: 26px; height: 26px; padding: 0; justify-content: center; border-radius: 50%; font-size: 13px; }
        .lc-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap: 12px; align-items: start; }
        .lc-card { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); min-width: 0; animation: lcIn .35s ease both; }
        .lc-card-n { flex-shrink: 0; width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; font-weight: 700; font-size: 14px; color: #2A2100; background: linear-gradient(150deg, #FFE39A, #FFD56B); box-shadow: 0 6px 14px -8px rgba(229,181,63,.9); }
        .lc-card-b { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 15px; line-height: 1.6; }
        .lc-card-t { font-weight: 700; color: var(--text); font-size: 15.5px; line-height: 1.35; }
        .lc-card-note { font-weight: 500; color: var(--text-3); font-size: 13px; margin-left: 6px; }
        .lc-card ul, .lc-card ol { gap: 6px; }
        .lc-compare { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 12px; }
        .lc-col { border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .lc-col.g { background: var(--success-bg); border: 1px solid rgba(99,214,131,.35); }
        .lc-col.b { background: var(--danger-bg); border: 1px solid var(--danger-border); }
        .lc-col-t { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .lc-col.g .lc-col-t { color: var(--success-1); }
        .lc-col.b .lc-col-t { color: var(--danger); }
        .lc-col ul { gap: 8px; font-size: 15px; line-height: 1.55; }
        .lc-punch { position: relative; padding: 14px 18px 14px 20px; border-radius: 14px; background: linear-gradient(100deg, rgba(255,213,107,.16), rgba(255,213,107,.04)); font-family: var(--font-fraunces), serif; font-size: 19px; line-height: 1.45; color: var(--text); }
        .lc-punch::before { content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 4px; border-radius: 4px; background: #FFD56B; }
        .lc-punch .lc-mark { background: none; padding: 0; color: var(--accent-text); }
        .lc-msg { border-radius: 18px; border: 1px solid var(--accent-border); background: var(--surface); overflow: hidden; }
        .lc-msg-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px 9px 14px; background: var(--accent-bg); font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-text); }
        .lc-msg-h span { display: inline-flex; align-items: center; gap: 7px; }
        .lc-copy { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--accent-border); background: var(--bg); color: var(--accent-text); border-radius: 99px; padding: 4px 11px; font: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0; text-transform: none; cursor: pointer; }
        .lc-msg-b { position: relative; margin: 14px 16px 16px; padding: 12px 15px; border-radius: 4px 16px 16px 16px; background: var(--surface-2); font-size: 15px; line-height: 1.6; color: var(--text); }
        .lc-msg-b .lc-em { color: var(--text); font-style: normal; }
        .lc-msg-b p + p { margin-top: 4px; }
        .lc-ex { border-radius: 18px; border: 1.5px dashed rgba(229,181,63,.6); background: rgba(255,213,107,.07); padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
        .lc-ex-t { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #FFD56B; }
        [data-theme=light] .lc-ex-t { color: #8A6A10; }
        .lc-ex .lc { gap: 12px; }
        .lc-table th { background: var(--accent-bg); color: var(--accent-text); }
        .lc-table td:first-child { font-weight: 600; color: var(--text); }
        .lc-table tbody tr:nth-child(even) td { background: var(--surface); }
        .lc-model { border-radius: 16px; border: 1px solid var(--border); overflow: hidden; }
        .lc-model .lc-msg-h { background: var(--surface); color: var(--text-3); }
        .lc-model .lc-pre { border: 0; border-radius: 0; }
        @keyframes lcIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes lcPop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .lc-fig, .lc-why, .lc-planned { animation: none; } .lc-opt { transition: none; } }
        @media (max-width: 640px) { .lc { font-size: 15.5px; } .lc-fig strong { font-size: 26px; } }
      `
