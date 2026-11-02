import ItemMenu from './ItemMenu.jsx'

const TAB_LABELS = { learn: 'Learn', challenges: 'Challenges' }

export default function NavBar({
  tab = 'challenges', onTabChange, items, selectedId, onSelect, done, onRun, onReset,
  showCheatSheet = false, onToggleCheatSheet,
}) {
  return (
    <nav className="relative z-40 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
      <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-emerald-400">Z80 Trainer</h1>
      {onTabChange && (
        <div role="tablist" aria-label="Section" className="flex overflow-hidden rounded border border-slate-600 text-sm">
          {Object.entries(TAB_LABELS).map(([id, label]) => {
            const selected = !showCheatSheet && tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(id)}
                className={`px-3 py-1 ${selected ? 'bg-emerald-700 font-semibold text-white' : 'text-slate-200 hover:bg-slate-800'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
      {!showCheatSheet && (
        <ItemMenu
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          noun={tab === 'learn' ? 'lesson' : 'challenge'}
          done={done}
        />
      )}
      <div className="ml-auto flex gap-2">
        {onToggleCheatSheet && (
          <button
            type="button"
            onClick={onToggleCheatSheet}
            aria-pressed={showCheatSheet}
            className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
          >
            {showCheatSheet ? 'Back' : 'Cheat sheet'}
          </button>
        )}
        {!showCheatSheet && (
          <>
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
          </>
        )}
      </div>
    </nav>
  )
}
