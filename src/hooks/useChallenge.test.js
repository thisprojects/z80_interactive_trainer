import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChallenge, readStore, writeStore } from './useChallenge.js'

const list = [
  { id: 'a', starterCode: 'A start' },
  { id: 'b', starterCode: 'B start' },
]

afterEach(() => vi.restoreAllMocks())

describe('useChallenge', () => {
  it('starts on the first challenge with its starter code', () => {
    const { result } = renderHook(() => useChallenge(list))
    expect(result.current.challenge.id).toBe('a')
    expect(result.current.code).toBe('A start')
    expect(result.current.result).toBeNull()
  })
  it('remembers the selection and per-challenge code', () => {
    const first = renderHook(() => useChallenge(list))
    act(() => first.result.current.select('b'))
    act(() => first.result.current.setCode('my code'))
    expect(first.result.current.code).toBe('my code')
    first.unmount()
    const second = renderHook(() => useChallenge(list))
    expect(second.result.current.challenge.id).toBe('b')
    expect(second.result.current.code).toBe('my code')
  })
  it('ignores a stale saved selection', () => {
    localStorage.setItem('z80_trainer:selected', 'gone')
    const { result } = renderHook(() => useChallenge(list))
    expect(result.current.challenge.id).toBe('a')
  })
  it('clears the result on select and reset restores the starter code', () => {
    const { result } = renderHook(() => useChallenge(list))
    act(() => result.current.setResult({ ok: true }))
    act(() => result.current.select('b'))
    expect(result.current.result).toBeNull()
    act(() => result.current.setCode('edited'))
    act(() => result.current.setResult({ ok: true }))
    act(() => result.current.reset())
    expect(result.current.code).toBe('B start')
    expect(result.current.result).toBeNull()
  })
  it('counts resets so the editor can be rebuilt', () => {
    const { result } = renderHook(() => useChallenge(list))
    expect(result.current.resetCount).toBe(0)
    act(() => result.current.reset())
    act(() => result.current.reset())
    expect(result.current.resetCount).toBe(2)
  })
  it('clears a stale result when the code is edited', () => {
    const { result } = renderHook(() => useChallenge(list))
    act(() => result.current.setResult({ ok: true, passed: true }))
    act(() => result.current.setCode('changed'))
    expect(result.current.result).toBeNull()
  })
  it('reset forgets the saved copy', () => {
    const { result } = renderHook(() => useChallenge(list))
    act(() => result.current.setCode('mine'))
    expect(localStorage.getItem('z80_trainer:code:a')).toBe('mine')
    act(() => result.current.reset())
    expect(localStorage.getItem('z80_trainer:code:a')).toBeNull()
    expect(result.current.code).toBe('A start')
  })
  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readStore('x')).toBeNull()
    expect(() => writeStore('x', 'y')).not.toThrow()
    const { result } = renderHook(() => useChallenge(list))
    act(() => result.current.setCode('still works'))
    expect(result.current.code).toBe('still works')
  })
})
