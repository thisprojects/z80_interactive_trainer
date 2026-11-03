// The reminder box about printing and the editor, shared by the lesson and challenge panes.
export default function ConsolePorts() {
  return (
    <section aria-label="Screen routines" className="rounded bg-slate-800 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-200">Screen routines</h3>
      <code className="block">LD A,2 / CALL 0x1601   open the screen (once)</code>
      <code className="block">RST 0x10             prints the character in A</code>
      <code className="block">LD A,13 / RST 0x10   prints a newline</code>
      <code className="block">CALL 0x2D2B + 0x2DE3  print BC as a number</code>
      <p className="mt-1">End your program with HALT. Ctrl/Cmd+Enter runs it.</p>
      <p className="mt-1">Tab indents inside the editor; press Esc, then Tab, to move focus out of it.</p>
      <p className="mt-1">Numbers: 42, 0x2A, $2A, 2Ah, %101010. Text: 'A' or "text" in DB.</p>
    </section>
  )
}
