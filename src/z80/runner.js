import { assemble } from './assembler.js'
import { Machine } from './machine.js'

const hex = (n, w = 2) => '0x' + n.toString(16).toUpperCase().padStart(w, '0')

// Assemble and run source once with an optional setup ({ registers, memory }).
export function runProgram(source, setup = {}, maxSteps) {
  const program = assemble(source)
  const machine = new Machine()
  machine.load(program)
  machine.setRegisters(setup.registers)
  for (const [addr, bytes] of Object.entries(setup.memory || {})) machine.poke(Number(addr), bytes)
  const result = machine.run(maxSteps)
  return { machine, program, ...result, output: machine.output }
}

const normalise = (s) => s.replace(/\s+$/, '')

function checkTest(challenge, source, test) {
  const failures = []
  let run
  try {
    run = runProgram(source, test.setup)
  } catch (err) {
    return { name: test.name, passed: false, error: err.message, failures: [] }
  }
  if (run.timedOut) {
    return {
      name: test.name, passed: false, output: run.output,
      error: 'Program did not finish (missing HALT or an infinite loop?)', failures: [],
    }
  }
  const { expect = {} } = test
  if (expect.output !== undefined && normalise(run.output) !== normalise(expect.output)) {
    failures.push({ what: 'output', expected: expect.output, actual: run.output })
  }
  const call = challenge.requires?.call
  if (call) {
    const target = run.program.symbols.get(call.label.toLowerCase())
    const made = target === undefined ? 0 : run.machine.callCounts.get(target) ?? 0
    if (made < call.min) {
      failures.push({
        what: `subroutine "${call.label}"`,
        expected: `defined, and called at least ${call.min} time${call.min === 1 ? '' : 's'}`,
        actual: target === undefined ? 'no such label' : `called ${made} time${made === 1 ? '' : 's'}`,
      })
    }
  }
  const regs = run.machine.getRegisters()
  for (const [name, want] of Object.entries(expect.registers || {})) {
    const got = regs[name.toUpperCase()]
    if (got !== want) failures.push({ what: `register ${name.toUpperCase()}`, expected: String(want), actual: String(got) })
  }
  for (const [addr, bytes] of Object.entries(expect.memory || {})) {
    const got = Array.from(run.machine.memory.slice(Number(addr), Number(addr) + bytes.length))
    if (got.some((v, i) => v !== bytes[i])) {
      failures.push({ what: `memory at ${hex(Number(addr), 4)}`, expected: bytes.join(', '), actual: got.join(', ') })
    }
  }
  return { name: test.name, passed: failures.length === 0, output: run.output, failures }
}

// Run every test case of a challenge against the user's source.
export function runChallenge(challenge, source) {
  try {
    assemble(source)
  } catch (err) {
    return { ok: false, error: err.message, results: [], passed: false }
  }
  const results = challenge.tests.map((t) => checkTest(challenge, source, t))
  return { ok: true, results, passed: results.every((r) => r.passed) }
}
