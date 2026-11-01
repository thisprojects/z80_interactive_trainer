import { useState } from 'react'

// One accordion item. The hint text is not rendered until the user opens it.
export function Hint({ title, body, spoiler = false, code }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded border ${spoiler ? 'border-rose-800' : 'border-slate-700'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-slate-800 ${spoiler ? 'text-rose-300' : 'text-amber-300'}`}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-700 px-3 py-2 text-sm text-slate-300">
          <p>{body}</p>
          {spoiler && code && (
            <pre className="overflow-x-auto rounded bg-slate-950 p-2 font-mono text-xs leading-relaxed text-slate-200">{code}</pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function HintList({ hints }) {
  return (
    <section aria-label="Hints" className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hints</h3>
      {hints.map((h) => (
        <Hint key={h.title} {...h} />
      ))}
    </section>
  )
}
