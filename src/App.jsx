import { useState } from 'react'
import challenges from './data/challenges.js'
import { useChallenge } from './hooks/useChallenge.js'
import { runChallenge } from './z80/runner.js'
import NavBar from './components/NavBar.jsx'
import InstructionPane from './components/InstructionPane.jsx'
import EditorPane from './components/EditorPane.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import CheatSheet from './components/CheatSheet.jsx'

export default function App() {
  const { challenge, code, setCode, select, reset, result, setResult, resetCount } = useChallenge(challenges)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const run = () => setResult(runChallenge(challenge, code))

  // Ctrl/Cmd+Enter runs the program. Captured before CodeMirror sees it, because the
  // editor would otherwise treat it as "insert a blank line".
  const onKeyDownCapture = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !showCheatSheet) {
      e.preventDefault()
      e.stopPropagation()
      run()
    }
  }

  return (
    <div className="flex h-dvh flex-col" onKeyDownCapture={onKeyDownCapture}>
      <NavBar
        challenges={challenges}
        selectedId={challenge.id}
        onSelect={select}
        onRun={run}
        onReset={reset}
        showCheatSheet={showCheatSheet}
        onToggleCheatSheet={() => setShowCheatSheet((v) => !v)}
      />
      {showCheatSheet ? <CheatSheet /> : (
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,2fr)_minmax(0,3fr)] md:grid-cols-[3fr_7fr] md:grid-rows-1">
        <InstructionPane challenge={challenge} />
        <div className="flex min-h-0 min-w-0 flex-col">
          <EditorPane key={`${challenge.id}:${resetCount}`} code={code} onChange={setCode} />
          <OutputPanel result={result} />
        </div>
      </main>
      )}
    </div>
  )
}
