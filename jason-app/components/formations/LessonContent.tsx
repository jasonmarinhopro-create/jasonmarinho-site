'use client'

// Affichage d'une leçon (23/11/2026) : blocs de lib/formations/blocks.ts.
// Questions (« Vérifie ») et action de fin de module (« Passe à l'action »)
// sont interactives ; le reste est du texte mis en forme.
import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, XCircle, ArrowRight, Lightbulb, Warning, Calculator, PushPin,
  Target, Check, CalendarCheck,
} from '@phosphor-icons/react/dist/ssr'
import type { Block } from '@/lib/formations/blocks'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Gras, italique et code en ligne ; tout le reste est échappé. */
export function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-2);padding:1px 6px;border-radius:5px;font-size:0.92em;color:var(--accent-text)">$1</code>')
}

function Html({ text, as: Tag = 'span', style }: { text: string; as?: 'span' | 'p' | 'li'; style?: React.CSSProperties }) {
  return <Tag style={style} dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
}

export type QuizState = Record<number, { picked: number; correct: boolean }>
export type ActionWhen = 'done' | 'ce-soir' | 'demain' | 'week-end'

export default function LessonContent({
  blocks, quiz, onAnswer, action, onAction,
}: {
  blocks: Block[]
  quiz: QuizState
  onAnswer: (index: number, picked: number, correct: boolean) => void
  /** Choix déjà fait pour l'action de ce module (null = rien). */
  action: { when: ActionWhen; dueLabel?: string } | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void
}) {
  return (
    <div className="lc">
      {blocks.map((b, i) => <BlockView key={i} b={b} quiz={quiz} onAnswer={onAnswer} action={action} onAction={onAction} />)}
      <style>{`
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
        .lc-planned { display: flex; align-items: center; gap: 8px; font-size: 14.5px; color: var(--text); font-weight: 500; animation: lcIn .35s ease both; }
        .lc-planned svg { color: var(--success-1); flex-shrink: 0; }
        @keyframes lcIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes lcPop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .lc-fig, .lc-why, .lc-planned { animation: none; } .lc-opt { transition: none; } }
        @media (max-width: 640px) { .lc { font-size: 15.5px; } .lc-fig strong { font-size: 26px; } }
      `}</style>
    </div>
  )
}

const CALLOUT_META = {
  retenir: { title: 'À retenir', Icon: PushPin },
  erreur: { title: 'Erreur fréquente', Icon: Warning },
  exemple: { title: 'Exemple chiffré', Icon: Calculator },
  astuce: { title: 'Astuce', Icon: Lightbulb },
} as const

function BlockView({ b, quiz, onAnswer, action, onAction }: {
  b: Block
  quiz: QuizState
  onAnswer: (index: number, picked: number, correct: boolean) => void
  action: { when: ActionWhen; dueLabel?: string } | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void
}) {
  switch (b.type) {
    case 'h2': return <h2 id={b.id}>{b.text}</h2>
    case 'h3': return <h3 id={b.id}>{b.text}</h3>
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
    case 'pre': return <pre className="lc-pre">{b.text}</pre>
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
            <span className="lc-callout-t">{title}</span>
            {b.text.map((t, j) => <Html key={j} as="p" text={t} />)}
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
    case 'action': return <ActionView b={b} state={action} onAction={onAction} />
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

function ActionView({ b, state, onAction }: {
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
          ? <Link prefetch={false} href={b.href} className="lc-btn" onClick={() => { if (!state) onAction(b.title, b.href, 'done') }}>{b.button || 'J\'y vais'} <ArrowRight size={15} weight="bold" /></Link>
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
