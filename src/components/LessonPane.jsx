import HintList from './Hint.jsx'
import ConsolePorts from './ConsolePorts.jsx'

// `text` with `backticks` shows the quoted part as code.
function Inline({ text }) {
  return text.split('`').map((part, i) => (i % 2 ? (
    <code key={i} className="rounded bg-slate-800 px-1 font-mono text-[0.85em] text-emerald-300">{part}</code>
  ) : part))
}

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded bg-slate-950 p-2 font-mono text-xs leading-relaxed text-slate-200">{children}</pre>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'text':
      return <p className="text-sm text-slate-300"><Inline text={block.text} /></p>
    case 'tip':
      return (
        <p className="rounded border-l-4 border-amber-500 bg-slate-800 px-3 py-2 text-sm text-slate-200">
          <strong className="text-amber-300">Tip: </strong><Inline text={block.text} />
        </p>
      )
    case 'code':
      return (
        <figure className="space-y-1">
          <Code>{block.code}</Code>
          {block.prints !== undefined && (
            <figcaption className="text-xs text-slate-400">Prints: <code className="font-mono text-slate-200">{JSON.stringify(block.prints).slice(1, -1) || '(nothing)'}</code></figcaption>
          )}
          {block.caption && <figcaption className="text-xs text-slate-400"><Inline text={block.caption} /></figcaption>}
        </figure>
      )
    case 'compare':
      return (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">In a high-level language</div>
          <Code>{block.high}</Code>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">In Z80</div>
          <Code>{block.z80}</Code>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            {block.head && (
              <thead>
                <tr>{block.head.map((h) => <th key={h} className="pb-1 pr-3 font-semibold text-slate-200">{h}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')} className="border-t border-slate-800">
                  {row.map((cell, i) => <td key={`${i}-${cell}`} className="py-1 pr-3 font-mono text-xs"><Inline text={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

// The left pane in the Learn tab: a short lesson, then the task for the editor.
export default function LessonPane({ lesson, index, total, done, onPrevious, onNext }) {
  const last = index === total - 1
  return (
    <aside aria-label="Lesson" className="flex min-h-0 min-w-0 flex-col bg-slate-900">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <header>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
            <span className="rounded bg-sky-900 px-2 py-0.5 text-sky-300">{lesson.module}</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">Lesson {index + 1} of {total}</span>
            {done && <span className="rounded bg-emerald-900 px-2 py-0.5 text-emerald-300">✓ Done</span>}
          </div>
          <h2 className="text-xl font-bold text-slate-100">{lesson.title}</h2>
          <p className="mt-2 text-sm text-slate-300"><Inline text={lesson.intro} /></p>
        </header>

        <section aria-label="Lesson content" className="space-y-3">
          {lesson.content.map((block, i) => <Block key={`${i}-${block.type}`} block={block} />)}
        </section>

        <section aria-label="Task">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Your task</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
            {lesson.task.map((t, i) => <li key={`${i}-${t}`}><Inline text={t} /></li>)}
          </ul>
          <p className="mt-2 text-xs text-slate-400">Write the program in the editor, then press Run.</p>
        </section>

        <HintList key={lesson.id} hints={lesson.hints} />

        <ConsolePorts />
      </div>

      <nav aria-label="Lesson navigation" className="flex items-center justify-between gap-2 border-t border-slate-700 bg-slate-900 px-4 py-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={index === 0}
          className="cursor-pointer rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="cursor-pointer rounded bg-emerald-700 px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {last ? 'Go to Challenges →' : 'Next →'}
        </button>
      </nav>
    </aside>
  )
}
