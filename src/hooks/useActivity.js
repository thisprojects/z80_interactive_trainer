import { useCallback, useMemo, useState } from 'react'

// localStorage can throw (private windows, blocked storage), so wrap every access.
export function readStore(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore: progress simply isn't remembered
  }
}

export function removeStore(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// Where each group of items keeps its state in localStorage. The challenge keys are the
// original ones, so work saved before lessons existed is still found.
export const CHALLENGE_KEYS = { selected: 'z80_trainer:selected', code: (id) => `z80_trainer:code:${id}` }
export const LESSON_KEYS = { selected: 'z80_trainer:lesson:selected', code: (id) => `z80_trainer:lesson:code:${id}` }

// Challenges that became lessons with the same task. Code saved under the old challenge id is
// moved to the lesson, so nobody loses work from before the course existed.
const MOVED_TO_LESSON = {
  'copy-registers': 'copying-registers', 'inc-dec': 'inc-dec', 'bit-twiddle': 'bit-twiddle',
  'print-number': 'print-number', 'count-up': 'loop-counter', 'print-hello': 'strings',
  'copy-block': 'block-copy', subroutine: 'subroutine', 'stack-swap': 'stack',
}

export function migrateLegacyWork() {
  for (const [oldId, lessonId] of Object.entries(MOVED_TO_LESSON)) {
    const old = readStore(CHALLENGE_KEYS.code(oldId))
    if (old === null) continue
    if (readStore(LESSON_KEYS.code(lessonId)) === null) writeStore(LESSON_KEYS.code(lessonId), old)
    removeStore(CHALLENGE_KEYS.code(oldId))
  }
}

// Tracks the selected item (a lesson or a challenge), the user's code for it, and the last run result.
export function useActivity(items, keys = CHALLENGE_KEYS) {
  const [selectedId, setSelectedId] = useState(() => {
    const saved = readStore(keys.selected)
    return items.some((c) => c.id === saved) ? saved : items[0].id
  })
  const [codes, setCodes] = useState({})
  const [result, setResult] = useState(null)
  const [resetCount, setResetCount] = useState(0) // bumped by Reset so the editor can be rebuilt from the starter code

  const item = items.find((c) => c.id === selectedId)
  const index = items.indexOf(item)
  // read the saved code once per item, not on every render
  const saved = useMemo(() => readStore(keys.code(selectedId)), [keys, selectedId])
  const code = codes[selectedId] ?? saved ?? item.starterCode

  const select = useCallback((id) => {
    setSelectedId(id)
    setResult(null)
    writeStore(keys.selected, id)
  }, [keys])

  const setCode = useCallback((value) => {
    setCodes((prev) => ({ ...prev, [selectedId]: value }))
    setResult(null) // an old verdict no longer describes the edited code
    writeStore(keys.code(selectedId), value)
  }, [keys, selectedId])

  const reset = useCallback(() => {
    setCodes((prev) => ({ ...prev, [selectedId]: item.starterCode }))
    setResetCount((n) => n + 1)
    removeStore(keys.code(selectedId)) // forget the saved copy so future starter-code updates show up
    setResult(null)
  }, [item, keys, selectedId])

  return { item, index, code, setCode, select, reset, result, setResult, resetCount }
}

const DONE_KEY = 'z80_trainer:done'

function readDone() {
  try {
    const parsed = JSON.parse(readStore(DONE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

// The ids of lessons and challenges whose tests have passed, remembered in this browser.
export function useProgress() {
  const [done, setDone] = useState(() => new Set(readDone()))
  const markDone = useCallback((id) => {
    setDone((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev).add(id)
      writeStore(DONE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])
  return { done, markDone }
}

const TAB_KEY = 'z80_trainer:tab'
export const TABS = ['learn', 'challenges']

// Which group is showing: 'learn' (lessons) or 'challenges'. Remembered across visits.
export function useTab() {
  const [tab, setTabState] = useState(() => {
    const saved = readStore(TAB_KEY)
    return TABS.includes(saved) ? saved : 'learn'
  })
  const setTab = useCallback((value) => {
    setTabState(value)
    writeStore(TAB_KEY, value)
  }, [])
  return [tab, setTab]
}
