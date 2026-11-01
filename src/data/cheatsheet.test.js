import { describe, it, expect } from 'vitest'
import { PARADIGMS, MNEMONICS } from './cheatsheet.js'
import { runProgram } from '../z80/runner.js'

// What each example prints, so the comments on the page are checked too.
const OUTPUT = {
  'counted-loop': '54321', 'count-up': '12345', while: '5', nested: '****\n****\n****\n',
  'loop-16': '', 'if-else': 'L', equal: '=', max: '9', 'bit-test': '1', array: '10',
  string: 'Hello', subroutine: '6', stack: '', copy: 'H', multiply: '4284',
}

describe('cheat sheet data', () => {
  it('has an expected output for every example', () => {
    expect(Object.keys(OUTPUT).sort()).toEqual(PARADIGMS.map((p) => p.id).sort())
  })

  it.each(PARADIGMS.map((p) => [p.title, p]))('example "%s" runs to HALT with the documented output', (_t, p) => {
    const run = runProgram(p.code)
    expect(run.halted).toBe(true)
    expect(run.output).toBe(OUTPUT[p.id])
  })

  it('leaves the registers the comments promise', () => {
    expect(runProgram(PARADIGMS.find((p) => p.id === 'loop-16').code).machine.getRegisters().HL).toBe(300)
    expect(runProgram(PARADIGMS.find((p) => p.id === 'stack').code).machine.getRegisters().BC).toBe(0x0509)
  })

  it('has non-empty mnemonic groups', () => {
    for (const g of MNEMONICS) expect(g.rows.length).toBeGreaterThan(0)
  })
})
