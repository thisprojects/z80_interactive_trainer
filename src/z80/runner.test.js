import { describe, it, expect } from 'vitest'
import { runProgram, runChallenge } from './runner.js'

const challenge = (tests) => ({ tests })

describe('runProgram', () => {
  it('runs with setup registers and memory', () => {
    const r = runProgram('LD A,(0x9000)\nADD A,B\nHALT', { registers: { B: 2 }, memory: { 0x9000: [40] } })
    expect(r.machine.getRegisters().A).toBe(42)
    expect(r.halted).toBe(true)
  })
  it('respects a custom step limit', () => {
    expect(runProgram('x: JR x', {}, 10).timedOut).toBe(true)
  })
})

describe('runChallenge requires.call', () => {
  const req = { requires: { call: { label: 'double', min: 3 } }, tests: [{ name: 't', setup: { registers: { A: 1 } }, expect: { registers: { A: 8 } } }] }
  const good = 'CALL double\nCALL double\nCALL double\nHALT\ndouble: ADD A,A\nRET'
  it('passes when the subroutine is defined and called enough', () => {
    expect(runChallenge(req, good).passed).toBe(true)
  })
  it('fails when the right answer is reached without the subroutine', () => {
    const r = runChallenge(req, 'ADD A,A\nADD A,A\nADD A,A\nHALT')
    expect(r.passed).toBe(false)
    expect(r.results[0].failures[0]).toMatchObject({ what: 'subroutine "double"', actual: 'no such label' })
  })
  it('reports how many calls were made', () => {
    const r = runChallenge(req, 'CALL double\nADD A,A\nADD A,A\nHALT\ndouble: ADD A,A\nRET')
    expect(r.results[0].failures[0].actual).toBe('called 1 time')
  })
  it('pluralises the requirement and the count', () => {
    const one = { requires: { call: { label: 'f', min: 1 } }, tests: [{ name: 't', expect: { registers: { A: 0 } } }] }
    expect(runChallenge(one, 'NOP\nHALT\nf: RET').results[0].failures[0]).toMatchObject({ expected: 'defined, and called at least 1 time', actual: 'called 0 times' })
  })
})

describe('runChallenge', () => {
  const src = 'LD A,5\nLD C,A\nLD B,0\nCALL 0x2D2B\nCALL 0x2DE3\nLD (0x9000),A\nHALT'
  it('passes when everything matches', () => {
    const r = runChallenge(challenge([{ name: 'ok', expect: { output: '5', registers: { A: 5 }, memory: { 0x9000: [5] } } }]), src)
    expect(r).toMatchObject({ ok: true, passed: true })
    expect(r.results[0].output).toBe('5')
  })
  it('ignores trailing whitespace in output', () => {
    const r = runChallenge(challenge([{ name: 'ws', expect: { output: '5\n\n' } }]), src)
    expect(r.passed).toBe(true)
  })
  it('reports each kind of mismatch', () => {
    const r = runChallenge(challenge([{ name: 'bad', expect: { output: '6', registers: { A: 9 }, memory: { 0x9000: [1, 2] } } }]), src)
    expect(r.passed).toBe(false)
    expect(r.results[0].failures.map((f) => f.what)).toEqual(['output', 'register A', 'memory at 0x9000'])
  })
  it('reports assembly errors', () => {
    const r = runChallenge(challenge([{ name: 'x', expect: { output: '' } }]), '  BOGUS')
    expect(r).toMatchObject({ ok: false, passed: false })
    expect(r.error).toMatch(/Unknown instruction/)
  })
  it('reports runtime errors per test', () => {
    const r = runChallenge(challenge([{ name: 'x', expect: { output: '' } }]), '  DB 0xdd, 0x00')
    expect(r.ok).toBe(true)
    expect(r.results[0]).toMatchObject({ passed: false })
    expect(r.results[0].error).toMatch(/Unsupported opcode DD/)
  })
  it('detects programs that never halt', () => {
    const r = runChallenge(challenge([{ name: 'x', expect: { output: '' } }]), 'x: JR x')
    expect(r.results[0].error).toMatch(/did not finish/)
    expect(r.passed).toBe(false)
  })
  it('tests with no expectations pass trivially', () => {
    expect(runChallenge(challenge([{ name: 'x' }]), 'HALT').passed).toBe(true)
  })
})
