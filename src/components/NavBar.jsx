export default function NavBar({ challenges, selectedId, onSelect, onRun, onReset }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
      <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-emerald-400">Z80 Trainer</h1>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <span>Challenge</span>
        <select
          aria-label="Select challenge"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
        >
          {challenges.map((c, i) => (
            <option key={c.id} value={c.id}>
              {i + 1}. {c.title}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onRun}
          title="Run (Ctrl/Cmd+Enter)"
          className="rounded bg-emerald-700 px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Run
        </button>
      </div>
    </nav>
  )
}
