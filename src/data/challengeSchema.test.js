import { describe, it, expect } from 'vitest'
import challenges from './challenges.js'
import { validateChallenge, validateChallenges } from './challengeSchema.js'

const good = () => structuredClone(challenges[0])

describe('validateChallenge', () => {
  it('accepts a valid challenge', () => {
    expect(validateChallenge(good())).toEqual([])
  })
  it('rejects non-objects', () => {
    expect(validateChallenge(null)).toEqual(['challenge must be an object'])
  })
  it('reports each missing or bad field', () => {
    const c = { id: 'Bad Id', difficulty: 'impossible', task: [], hints: [{ title: 'x' }], tests: [{ name: '', expect: {} }] }
    const errors = validateChallenge(c).join('\n')
    for (const part of ['title', 'description', 'explanation', 'starterCode', 'id must be lowercase', 'difficulty', 'task', 'hints', 'tests[0].name', 'tests[0].expect']) {
      expect(errors).toContain(part)
    }
  })
  it('requires starter code to begin with ORG 0x8000', () => {
    const c = good()
    c.starterCode = '        LD A,1\n        HALT\n'
    expect(validateChallenge(c)).toContain('starterCode must begin with ORG 0x8000')
    c.starterCode = '  org 0x8000\n HALT'
    expect(validateChallenge(c)).toEqual([])
  })
  it('rejects unknown categories', () => {
    const c = good()
    c.category = 'witchcraft'
    expect(validateChallenge(c).join('\n')).toContain('category must be one of')
  })
  it('validates the optional requires.call field', () => {
    const c = good()
    c.requires = { call: { label: 'f', min: 2 } }
    expect(validateChallenge(c)).toEqual([])
    c.requires = { call: { label: 'f', min: 0 } }
    expect(validateChallenge(c).join('\n')).toContain('requires.call')
    c.requires = {}
    expect(validateChallenge(c).join('\n')).toContain('requires.call')
  })
  it('rejects an empty tests array', () => {
    const c = good()
    c.tests = []
    expect(validateChallenge(c)).toContain('tests must be a non-empty array')
  })
})

describe('validateChallenges', () => {
  it('flags duplicate ids and prefixes errors with the id', () => {
    const a = good()
    const b = { ...good(), title: '' }
    const errors = validateChallenges([a, b, null])
    expect(errors).toContain(`duplicate id "${a.id}"`)
    expect(errors.some((e) => e.startsWith(`challenge ${a.id}: title`))).toBe(true)
    expect(errors.some((e) => e.startsWith('challenge 2:'))).toBe(true)
  })
})
