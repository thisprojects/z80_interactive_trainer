import { assemble } from './assembler.js'
import { Machine } from './machine.js'

const hex = (n, w = 2) => '0x' + n.toString(16).toUpperCase().padStart(w, '0')

// A memory key in a test is either an address (9000, 0x9000) or the name of a label the
// learner's program defines, so a task can say "make an array called scores" and check it.
function resolveAddress(key, program) {
  if (/^\d+$/.test(String(key))) return Number(key)
  return program.symbols.get(String(key).toLowerCase())
}

// Assemble and run source once with an optional setup ({ registers, memory }).
export function runProgram(source, setup = {}, maxSteps) {
  const program = assemble(source)
  const machine = new Machine()
  machine.load(program)
  machine.setRegisters(setup.registers)
  for (const [where, bytes] of Object.entries(setup.memory || {})) {
    const addr = resolveAddress(where, program)
    if (addr === undefined) throw new Error(`The test needs a label called "${where}", but your program does not define one`)
    machine.poke(addr, bytes)
  }
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
  for (const [where, bytes] of Object.entries(expect.memory || {})) {
    const addr = resolveAddress(where, run.program)
    if (addr === undefined) {
      failures.push({ what: `label "${where}"`, expected: 'defined in your program', actual: 'no such label' })
      continue
    }
    const got = Array.from(run.machine.memory.slice(addr, addr + bytes.length))
    if (got.some((v, i) => v !== bytes[i])) {
      const named = /^\d+$/.test(String(where)) ? hex(addr, 4) : `${where} (${hex(addr, 4)})`
      failures.push({ what: `memory at ${named}`, expected: bytes.join(', '), actual: got.join(', ') })
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
