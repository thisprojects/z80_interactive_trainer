import CheatSheet from './CheatSheet.jsx'
import EditorPane from './EditorPane.jsx'
import Screen from './Screen.jsx'

const hex = (n, w) => '0x' + n.toString(16).toUpperCase().padStart(w, '0')

// Free-form mode: the cheat sheet on the left, the editor on the right with an output box beneath it.
export default function SandboxPane({ code, onChange, result, editorKey }) {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,2fr)_minmax(0,3fr)] md:grid-cols-[1fr_1fr] md:grid-rows-1">
      <div className="flex min-h-0 min-w-0 flex-col border-b border-slate-700 md:border-b-0 md:border-r">
        <CheatSheet embedded />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col">
        <EditorPane key={editorKey} code={code} onChange={onChange} />
        <section aria-label="Output" className="h-[35%] min-h-0 shrink-0 overflow-auto border-t border-slate-700 bg-slate-950 p-3 md:h-72">
          {!result && <p className="text-sm text-slate-300">Press Run to see your program&apos;s output here.</p>}
          {result?.error && (
            <div className="space-y-2">
              {result.output && <Screen output={result.output} />}
              <p role="alert" className="font-mono text-sm text-red-300">{result.error}</p>
            </div>
          )}
          {result && !result.error && (
            <div className="space-y-2">
              <Screen output={result.output} />
              <p className="text-sm text-slate-300">
                {result.timedOut ? 'Stopped: the program ran too long (is there an endless loop?).' : 'Finished (HALT).'}
                {result.truncated ? ' Output was cut short.' : ''}
              </p>
              <p className="font-mono text-xs text-slate-400">
                A={hex(result.registers.A, 2)} BC={hex(result.registers.BC, 4)} DE={hex(result.registers.DE, 4)} HL={hex(result.registers.HL, 4)}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
