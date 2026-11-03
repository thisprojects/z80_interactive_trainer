// A small emulated text screen: a fixed grid of characters fed by the program's printed output.
// Lines wrap at COLS characters and the oldest lines scroll off the top once there are more than ROWS.
export const COLS = 40
export const ROWS = 12

// Turn the output string into at most ROWS lines of at most COLS characters.
export function layoutScreen(output) {
  const lines = []
  for (const text of output.split('\n')) {
    if (text === '') lines.push('')
    for (let i = 0; i < text.length; i += COLS) lines.push(text.slice(i, i + COLS))
  }
  return lines.slice(-ROWS)
}

export default function Screen({ output }) {
  const lines = layoutScreen(output)
  return (
    <div role="img" aria-label={`Screen output: ${output}`} className="inline-block rounded border border-slate-600 bg-black p-2">
      <pre aria-hidden="true" className="m-0 text-xs leading-tight text-emerald-300" style={{ minWidth: `${COLS}ch` }}>
        {lines.join('\n') || ' '}
      </pre>
    </div>
  )
}
