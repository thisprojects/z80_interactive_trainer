import { useState } from 'react'

// One accordion item. The hint text is not rendered until the user opens it.
export function Hint({ title, body }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded border border-slate-700">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-amber-300 hover:bg-slate-800"
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="border-t border-slate-700 px-3 py-2 text-sm text-slate-300">{body}</p>}
    </div>
  )
}

export default function HintList({ hints }) {
  return (
    <section aria-label="Hints" className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hints</h3>
      {hints.map((h) => (
        <Hint key={h.title} title={h.title} body={h.body} />
      ))}
    </section>
  )
}
