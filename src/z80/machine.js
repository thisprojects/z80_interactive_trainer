import { Z80Cpu } from './cpu.js'

export const PORT = { CHAR: 0x00, NUMBER: 0x01, NEWLINE: 0x02 }
export const DEFAULT_MAX_STEPS = 200000
export const MAX_OUTPUT = 20000 // characters kept; a runaway print loop cannot flood the page
export const TRUNCATED_MARK = '\n[output truncated]'

const REG_NAMES = ['B', 'C', 'D', 'E', 'H', 'L', null, 'A']

// A CPU + 64K RAM with the trainer's console I/O attached.
export class Machine {
  constructor() {
    this.output = ''
    this.truncated = false
    this.callCounts = new Map() // CALL target address -> times called
    this.memory = new Uint8Array(0x10000)
    this.cpu = new Z80Cpu({
      memory: this.memory,
      onOut: (port, value) => this.handleOut(port, value),
      onIn: (port) => {
        throw new Error(`IN from port ${port} is not supported (the console is output-only)`)
      },
      onCall: (target) => this.callCounts.set(target, (this.callCounts.get(target) ?? 0) + 1),
      onRst: (target, cpu) => {
        if (target !== 0x10) return false
        this.print(String.fromCharCode(cpu.a))
        return true
      },
    })
  }

  print(text) {
    if (this.truncated) return
    if (this.output.length + text.length > MAX_OUTPUT) {
      this.output = this.output.slice(0, MAX_OUTPUT) + TRUNCATED_MARK
      this.truncated = true
    } else this.output += text
  }

  handleOut(port, value) {
    if (port === PORT.CHAR) this.print(String.fromCharCode(value))
    else if (port === PORT.NUMBER) this.print(String(value))
    else if (port === PORT.NEWLINE) this.print('\n')
    else throw new Error(`OUT to port ${port} is not supported (use port 0, 1 or 2)`)
  }

  load(program) {
    for (const seg of program.segments) this.memory.set(seg.bytes, seg.addr)
    this.cpu.pc = program.entry
  }

  poke(addr, bytes) {
    this.memory.set(bytes, addr)
  }

  setRegisters(regs = {}) {
    const cpu = this.cpu
    for (const [name, value] of Object.entries(regs)) {
      const key = name.toUpperCase()
      if (key === 'BC') cpu.bc = value
      else if (key === 'DE') cpu.de = value
      else if (key === 'HL') cpu.hl = value
      else if (key === 'SP') cpu.sp = value
      else if (key === 'F') cpu.f = value & 0xff
      else if (key === 'IX') cpu.ix = value & 0xffff
      else if (key === 'IY') cpu.iy = value & 0xffff
      else if (REG_NAMES.includes(key)) cpu.r[REG_NAMES.indexOf(key)] = value & 0xff
      else throw new Error(`Unknown register "${name}"`)
    }
  }

  getRegisters() {
    const cpu = this.cpu
    const out = {}
    REG_NAMES.forEach((n, i) => { if (n) out[n] = cpu.r[i] })
    return { ...out, BC: cpu.bc, DE: cpu.de, HL: cpu.hl, IX: cpu.ix, IY: cpu.iy, SP: cpu.sp, F: cpu.f, PC: cpu.pc }
  }

  // Runs until HALT or the step limit. Returns { halted, steps, timedOut }.
  run(maxSteps = DEFAULT_MAX_STEPS) {
    let steps = 0
    while (!this.cpu.halted && steps < maxSteps) {
      this.cpu.step()
      steps++
    }
    return { halted: this.cpu.halted, steps, timedOut: !this.cpu.halted }
  }
}
