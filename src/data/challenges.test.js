import { describe, it, expect } from 'vitest'
import challenges from './challenges.js'
import { validateChallenges } from './challengeSchema.js'
import solutions from './solutions.js'
import { runChallenge } from '../z80/runner.js'

describe('challenges data', () => {
  it('has at least 20 challenges', () => {
    expect(challenges.length).toBeGreaterThanOrEqual(20)
  })

  it('all follow the schema with unique ids', () => {
    expect(validateChallenges(challenges)).toEqual([])
  })

  it('has a solution for every challenge and none left over', () => {
    expect(Object.keys(solutions).sort()).toEqual(challenges.map((c) => c.id).sort())
  })

  describe.each(challenges.map((c) => [c.id, c]))('%s', (_id, challenge) => {
    it('its reference solution passes every test', () => {
      const result = runChallenge(challenge, solutions[challenge.id])
      expect(result.error).toBeUndefined()
      expect(result.results.filter((r) => !r.passed)).toEqual([])
      expect(result.passed).toBe(true)
    })

    it('the starter code does not already pass', () => {
      const result = runChallenge(challenge, challenge.starterCode)
      expect(result.passed).toBe(false)
    })
  })
})
