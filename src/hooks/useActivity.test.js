import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActivity as useChallenge, readStore, writeStore, useProgress, useTab, LESSON_KEYS, migrateLegacyWork } from './useActivity.js'

const list = [
  { id: 'a', starterCode: 'A start' },
  { id: 'b', starterCode: 'B start' },
]

afterEach(() => vi.restoreAllMocks())

describe('useActivity', () => {
  it('starts on the first challenge with its starter code', () => {
    const { result } = renderHook(() => useChallenge(list))
    expect(result.current.item.id).toBe('a')
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
    expect(second.result.current.item.id).toBe('b')
    expect(second.result.current.code).toBe('my code')
  })
  it('ignores a stale saved selection', () => {
    localStorage.setItem('z80_trainer:selected', 'gone')
    const { result } = renderHook(() => useChallenge(list))
    expect(result.current.item.id).toBe('a')
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

describe('useActivity with another key set', () => {
  it('keeps lessons apart from challenges and reports the index', () => {
    const lessons = renderHook(() => useChallenge(list, LESSON_KEYS))
    act(() => lessons.result.current.select('b'))
    act(() => lessons.result.current.setCode('lesson code'))
    expect(lessons.result.current.index).toBe(1)
    expect(localStorage.getItem('z80_trainer:lesson:selected')).toBe('b')
    expect(localStorage.getItem('z80_trainer:lesson:code:b')).toBe('lesson code')
    const challenges = renderHook(() => useChallenge(list))
    expect(challenges.result.current.item.id).toBe('a')
    expect(challenges.result.current.code).toBe('A start')
  })
})

describe('useProgress', () => {
  it('remembers completed ids, once each', () => {
    const first = renderHook(() => useProgress())
    expect(first.result.current.done.size).toBe(0)
    act(() => first.result.current.markDone('a'))
    act(() => first.result.current.markDone('a'))
    act(() => first.result.current.markDone('b'))
    expect([...first.result.current.done]).toEqual(['a', 'b'])
    expect(JSON.parse(localStorage.getItem('z80_trainer:done'))).toEqual(['a', 'b'])
    const second = renderHook(() => useProgress())
    expect([...second.result.current.done]).toEqual(['a', 'b'])
  })
  it('ignores damaged saved data', () => {
    localStorage.setItem('z80_trainer:done', '{not json')
    expect(renderHook(() => useProgress()).result.current.done.size).toBe(0)
    localStorage.setItem('z80_trainer:done', '{"a":1}')
    expect(renderHook(() => useProgress()).result.current.done.size).toBe(0)
    localStorage.setItem('z80_trainer:done', '["a",5,"c"]')
    expect([...renderHook(() => useProgress()).result.current.done]).toEqual(['a', 'c'])
  })
})

describe('useTab', () => {
  it('defaults to learn, remembers the choice and ignores junk', () => {
    const first = renderHook(() => useTab())
    expect(first.result.current[0]).toBe('learn')
    act(() => first.result.current[1]('challenges'))
    expect(renderHook(() => useTab()).result.current[0]).toBe('challenges')
    localStorage.setItem('z80_trainer:tab', 'nonsense')
    expect(renderHook(() => useTab()).result.current[0]).toBe('learn')
  })
})

describe('migrateLegacyWork', () => {
  it('moves code saved for a challenge that became a lesson, once', () => {
    localStorage.setItem('z80_trainer:code:count-up', 'old count-up work')
    localStorage.setItem('z80_trainer:code:inc-dec', 'old inc-dec work')
    localStorage.setItem('z80_trainer:lesson:code:inc-dec', 'newer lesson work')
    localStorage.setItem('z80_trainer:code:countdown', 'a challenge that still exists')
    migrateLegacyWork()
    expect(localStorage.getItem('z80_trainer:lesson:code:loop-counter')).toBe('old count-up work')
    expect(localStorage.getItem('z80_trainer:code:count-up')).toBeNull()
    expect(localStorage.getItem('z80_trainer:lesson:code:inc-dec')).toBe('newer lesson work') // never overwritten
    expect(localStorage.getItem('z80_trainer:code:inc-dec')).toBeNull()
    expect(localStorage.getItem('z80_trainer:code:countdown')).toBe('a challenge that still exists')
    migrateLegacyWork() // harmless the second time
    expect(localStorage.getItem('z80_trainer:lesson:code:loop-counter')).toBe('old count-up work')
  })
})
