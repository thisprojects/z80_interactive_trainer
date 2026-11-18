import { useState } from 'react'
import challenges from './data/challenges.js'
import lessons from './data/lessons.js'
import { useActivity, useProgress, useSandbox, useTab, CHALLENGE_KEYS, LESSON_KEYS } from './hooks/useActivity.js'
import { runChallenge, runProgram } from './z80/runner.js'
import NavBar from './components/NavBar.jsx'
import InstructionPane from './components/InstructionPane.jsx'
import LessonPane from './components/LessonPane.jsx'
import EditorPane from './components/EditorPane.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import CheatSheet from './components/CheatSheet.jsx'
import SandboxPane from './components/SandboxPane.jsx'

export default function App() {
  const [tab, setTab] = useTab()
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const { done, markDone } = useProgress()
  const lessonState = useActivity(lessons, LESSON_KEYS)
  const challengeState = useActivity(challenges, CHALLENGE_KEYS)

  const sandboxState = useSandbox()

  const sandbox = tab === 'sandbox'
  const learning = tab === 'learn'
  const current = learning ? lessonState : challengeState
  const { item, code, setCode, select, reset, result, setResult, resetCount } = current

  const buildsOn = learning ? [] : (item.uses ?? []).map((id) => lessons.find((l) => l.id === id)?.title).filter(Boolean)

  const runSandbox = () => {
    try {
      const run = runProgram(sandboxState.code)
      sandboxState.setResult({
        output: run.output, timedOut: run.timedOut, truncated: run.machine.truncated,
        registers: run.machine.getRegisters(),
      })
    } catch (err) {
      sandboxState.setResult({ error: err.message, output: err.output })
    }
  }

  const run = () => {
    if (sandbox) return runSandbox()
    const verdict = runChallenge(item, code)
    setResult(verdict)
    if (verdict.passed) markDone(item.id)
  }

  const changeTab = (next) => {
    setTab(next)
    setShowCheatSheet(false)
  }
  const goTo = (offset) => lessonState.select(lessons[lessonState.index + offset].id)
  const next = () => (lessonState.index === lessons.length - 1 ? changeTab('challenges') : goTo(1))

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
        tab={tab}
        onTabChange={changeTab}
        items={learning ? lessons : challenges}
        selectedId={item.id}
        onSelect={select}
        done={done}
        onRun={run}
        onReset={sandbox ? sandboxState.reset : reset}
        showCheatSheet={showCheatSheet}
        onToggleCheatSheet={() => setShowCheatSheet((v) => !v)}
      />
      {sandbox ? (
        <SandboxPane
          code={sandboxState.code}
          onChange={sandboxState.setCode}
          result={sandboxState.result}
          editorKey={`sandbox:${sandboxState.resetCount}`}
        />
      ) : showCheatSheet ? <CheatSheet /> : (
        <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,2fr)_minmax(0,3fr)] md:grid-cols-[3fr_7fr] md:grid-rows-1">
          {learning ? (
            <LessonPane
              lesson={item}
              index={lessonState.index}
              total={lessons.length}
              done={done.has(item.id)}
              onPrevious={() => goTo(-1)}
              onNext={next}
            />
          ) : (
            <InstructionPane challenge={item} done={done.has(item.id)} buildsOn={buildsOn} />
          )}
          <div className="flex min-h-0 min-w-0 flex-col">
            <EditorPane key={`${tab}:${item.id}:${resetCount}`} code={code} onChange={setCode} />
            <OutputPanel result={result} />
          </div>
        </main>
      )}
    </div>
  )
}
