import { useState } from 'react'
import { MNEMONICS, PARADIGMS, REGISTERS, FLAGS, CONDITIONS } from '../data/cheatsheet.js'

function RefTable({ caption, rows }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map(([term, meaning]) => (
          <tr key={term} className="border-t border-slate-800 align-top">
            <th scope="row" className="w-2/5 whitespace-nowrap py-1 pr-3 font-mono font-normal text-emerald-300">{term}</th>
            <td className="py-1 text-slate-300">{meaning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function CheatSheet() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const groups = MNEMONICS
    .map((g) => ({ ...g, rows: g.rows.filter(([a, b]) => !q || `${a} ${b}`.toLowerCase().includes(q)) }))
    .filter((g) => g.rows.length > 0)

  return (
    <main aria-label="Cheat sheet" className="min-h-0 flex-1 overflow-y-auto bg-slate-900 px-4 py-4">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h2 className="text-xl font-bold text-slate-100">Z80 cheat sheet</h2>
          <p className="mt-1 text-sm text-slate-300">
            The instructions this trainer supports, then patterns for loops, conditionals and subroutines.
            Every example is a complete program: paste it into the editor and press Run.
          </p>
        </header>

        <section aria-label="Registers, flags and conditions" className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Registers</h3>
            <RefTable caption="Registers" rows={REGISTERS} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Flags</h3>
            <RefTable caption="Flags" rows={FLAGS} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Conditions (cc)</h3>
            <RefTable caption="Conditions" rows={CONDITIONS} />
          </div>
        </section>

        <section aria-label="Instructions">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Instructions</h3>
            <input
              type="search"
              aria-label="Filter instructions"
              placeholder="Filter, e.g. loop or LDIR"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100"
            />
          </div>
          <p className="mb-3 text-xs text-slate-400">
            r = A B C D E H L, n = 8-bit number, nn = 16-bit number or label, rr = register pair, e = label (relative), b = bit 0-7.
          </p>
          {groups.length === 0 && <p className="text-sm text-slate-400">No instructions match “{query}”.</p>}
          <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
            {groups.map((g) => (
              <div key={g.title}>
                <h4 className="mb-1 font-semibold text-slate-100">{g.title}</h4>
                <RefTable caption={g.title} rows={g.rows} />
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Common patterns">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Common patterns</h3>
          <div className="grid gap-5 lg:grid-cols-2">
            {PARADIGMS.map((p) => (
              <article key={p.id} aria-label={p.title} className="min-w-0 rounded bg-slate-800 p-3">
                <h4 className="font-semibold text-slate-100">{p.title}</h4>
                <p className="mb-2 mt-1 text-sm text-slate-300">{p.blurb}</p>
                <pre className="overflow-x-auto rounded bg-slate-950 p-2 font-mono text-xs leading-relaxed text-slate-200">{p.code}</pre>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
