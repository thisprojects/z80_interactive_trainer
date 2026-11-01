import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { z80Language } from '../z80/z80Language.js'

// The editor's text area is what screen readers land on, so it needs its own name; the
// wrapping <section> label is not inherited by it.
const extensions = [z80Language, EditorView.contentAttributes.of({ 'aria-label': 'Z80 assembly code editor' })]

export default function EditorPane({ code, onChange }) {
  return (
    <section aria-label="Code editor" className="min-h-0 flex-1 overflow-auto">
      <CodeMirror
        value={code}
        onChange={onChange}
        extensions={extensions}
        theme="dark"
        height="100%"
        style={{ height: '100%' }}
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
    </section>
  )
}
