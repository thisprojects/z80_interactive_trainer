import HintList from './Hint.jsx'

const DIFFICULTY_STYLE = {
  beginner: 'bg-emerald-900 text-emerald-300',
  intermediate: 'bg-amber-900 text-amber-300',
  advanced: 'bg-rose-900 text-rose-300',
}

export default function InstructionPane({ challenge }) {
  return (
    <aside aria-label="Instructions" className="min-w-0 space-y-5 overflow-y-auto bg-slate-900 p-4">
      <header>
        <div className="mb-1 flex gap-2 text-xs uppercase tracking-wide">
          <span className={`rounded px-2 py-0.5 ${DIFFICULTY_STYLE[challenge.difficulty] ?? DIFFICULTY_STYLE.beginner}`}>{challenge.difficulty}</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{challenge.category}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">{challenge.title}</h2>
        <p className="mt-2 text-sm text-slate-300">{challenge.description}</p>
      </header>

      <section aria-label="Task">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Your task</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
          {challenge.task.map((t, i) => (
            <li key={`${i}-${t}`}>{t}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Explanation">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Background</h3>
        <p className="text-sm text-slate-300">{challenge.explanation}</p>
      </section>

      <HintList key={challenge.id} hints={challenge.hints} />

      <section aria-label="Output ports" className="rounded bg-slate-800 p-3 text-xs text-slate-300">
        <h3 className="mb-1 font-semibold text-slate-200">Console ports</h3>
        <code className="block">OUT (0),A  prints a character</code>
        <code className="block">OUT (1),A  prints A as a number</code>
        <code className="block">OUT (2),A  prints a newline</code>
        <p className="mt-1">End your program with HALT. Ctrl/Cmd+Enter runs it.</p>
        <p className="mt-1">Tab indents inside the editor; press Esc, then Tab, to move focus out of it.</p>
        <p className="mt-1">Numbers: 42, 0x2A, $2A, 2Ah, %101010. Text: 'A' or "text" in DB.</p>
      </section>
    </aside>
  )
}
