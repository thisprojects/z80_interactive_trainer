import { describe, it, expect } from 'vitest'
import challenges from './challenges.js'
import lessons from './lessons.js'
import { validateChallenges } from './challengeSchema.js'
import solutions from './solutions.js'
import { runChallenge } from '../z80/runner.js'

describe('challenges data', () => {
  it('has a healthy number of challenges', () => {
    expect(challenges.length).toBeGreaterThanOrEqual(10)
  })

  it('all follow the schema with unique ids', () => {
    expect(validateChallenges(challenges)).toEqual([])
  })

  it('has a solution for every challenge and lesson and none left over', () => {
    expect(Object.keys(solutions).sort()).toEqual([...challenges, ...lessons].map((c) => c.id).sort())
  })

  it('shares no id between lessons and challenges', () => {
    const ids = [...lessons, ...challenges].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  describe.each(challenges.map((c) => [c.id, c]))('%s', (_id, challenge) => {
    it('its reference solution passes every test', () => {
      const result = runChallenge(challenge, solutions[challenge.id])
      expect(result.error).toBeUndefined()
      expect(result.results.filter((r) => !r.passed)).toEqual([])
      expect(result.passed).toBe(true)
    })

    it('ends with a spoiler hint whose code is a working solution', () => {
      const last = challenge.hints.at(-1)
      expect(last.spoiler).toBe(true)
      expect(last.title).toMatch(/spoiler/i)
      expect(challenge.hints.length).toBeGreaterThanOrEqual(2) // pointers come before the answer
      expect(challenge.hints.slice(0, -1).some((h) => h.spoiler)).toBe(false)
      const result = runChallenge(challenge, last.code)
      expect(result.error).toBeUndefined()
      expect(result.passed).toBe(true)
    })

    it('lists the lessons it builds on', () => {
      expect(challenge.uses.length).toBeGreaterThan(0)
      expect(challenge.uses.every((id) => lessons.some((l) => l.id === id))).toBe(true)
    })

    it('the starter code does not already pass', () => {
      const result = runChallenge(challenge, challenge.starterCode)
      expect(result.passed).toBe(false)
    })
  })
})
