import { useCallback, useMemo, useState } from 'react'

const SELECTED_KEY = 'z80_trainer:selected'
const codeKey = (id) => `z80_trainer:code:${id}`

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

// Tracks the selected challenge, the user's code for it, and the last run result.
export function useChallenge(challenges) {
  const initialId = (() => {
    const saved = readStore(SELECTED_KEY)
    return challenges.some((c) => c.id === saved) ? saved : challenges[0].id
  })()
  const [selectedId, setSelectedId] = useState(initialId)
  const [codes, setCodes] = useState({})
  const [result, setResult] = useState(null)
  const [resetCount, setResetCount] = useState(0) // bumped by Reset so the editor can be rebuilt from the starter code

  const challenge = challenges.find((c) => c.id === selectedId)
  // read the saved code once per challenge, not on every render
  const saved = useMemo(() => readStore(codeKey(selectedId)), [selectedId])
  const code = codes[selectedId] ?? saved ?? challenge.starterCode

  const select = useCallback((id) => {
    setSelectedId(id)
    setResult(null)
    writeStore(SELECTED_KEY, id)
  }, [])

  const setCode = useCallback((value) => {
    setCodes((prev) => ({ ...prev, [selectedId]: value }))
    setResult(null) // an old verdict no longer describes the edited code
    writeStore(codeKey(selectedId), value)
  }, [selectedId])

  const reset = useCallback(() => {
    setCodes((prev) => ({ ...prev, [selectedId]: challenge.starterCode }))
    setResetCount((n) => n + 1)
    removeStore(codeKey(selectedId)) // forget the saved copy so future starter-code updates show up
    setResult(null)
  }, [challenge, selectedId])

  return { challenge, code, setCode, select, reset, result, setResult, resetCount }
}
