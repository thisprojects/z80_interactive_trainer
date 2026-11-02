// The reminder box about printing and the editor, shared by the lesson and challenge panes.
export default function ConsolePorts() {
  return (
    <section aria-label="Output ports" className="rounded bg-slate-800 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-200">Console ports</h3>
      <code className="block">OUT (0),A  prints a character</code>
      <code className="block">OUT (1),A  prints A as a number</code>
      <code className="block">OUT (2),A  prints a newline</code>
      <p className="mt-1">End your program with HALT. Ctrl/Cmd+Enter runs it.</p>
      <p className="mt-1">Tab indents inside the editor; press Esc, then Tab, to move focus out of it.</p>
      <p className="mt-1">Numbers: 42, 0x2A, $2A, 2Ah, %101010. Text: 'A' or "text" in DB.</p>
    </section>
  )
}
