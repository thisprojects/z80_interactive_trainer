function TestResult({ r }) {
  return (
    <li className="rounded border border-slate-700 p-2">
      <div className={r.passed ? 'text-emerald-400' : 'text-red-400'}>
        {r.passed ? '✓' : '✗'} {r.name}
      </div>
      {r.error && <div className="mt-1 text-red-300">{r.error}</div>}
      {r.failures.map((f) => (
        <div key={f.what} className="mt-1 text-xs text-slate-300">
          <div>{f.what}</div>
          <pre className="whitespace-pre-wrap text-emerald-300">expected: {f.expected}</pre>
          <pre className="whitespace-pre-wrap text-red-300">actual: {f.actual}</pre>
        </div>
      ))}
    </li>
  )
}

export default function OutputPanel({ result }) {
  return (
    <section aria-label="Results" aria-live="polite" className="h-[30%] min-h-24 shrink-0 overflow-y-auto md:h-56 md:min-h-0 border-t border-slate-700 bg-slate-950 p-3 font-mono text-sm">
      {!result && <p className="text-slate-400">Press Run to test your program.</p>}
      {result && !result.ok && (
        <p role="alert" className="text-red-400">
          Assembly error: {result.error}
        </p>
      )}
      {result?.ok && (
        <>
          <p className={`mb-2 font-semibold ${result.passed ? 'text-emerald-400' : 'text-amber-300'}`}>
            {result.passed ? 'All tests passed. Well done!' : 'Some tests failed.'}
          </p>
          <ul className="space-y-2">
            {result.results.map((r) => (
              <TestResult key={r.name} r={r} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
