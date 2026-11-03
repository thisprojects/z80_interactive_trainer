import { Z80Cpu } from './cpu.js'

// Stand-ins for the ZX Spectrum ROM routines the course uses, each trapped here instead of running
// ROM code (there is no ROM). All are real, and are the ones the reference book uses:
//  - CALL 0x1601 (CHAN-OPEN) opens the channel numbered in A. Channel 2 is the main screen.
//  - RST 0x10 (PRINT-A-1) prints the character whose code is in A. Code 13 is a newline.
//  - CALL 0x2D2B (STACK-BC) puts the number in BC on the ROM's calculator stack, then
//    CALL 0x2DE3 (PRINT-FP) prints the number on top of that stack as decimal digits.
export const ROM = { PRINT_A: 0x10, CHAN_OPEN: 0x1601, STACK_BC: 0x2d2b, PRINT_FP: 0x2de3 }
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
        if (target !== ROM.PRINT_A) return false
        this.printSpectrumChar(cpu.a)
        return true
      },
      onRom: (target, cpu) => this.romCall(target, cpu),
    })
  }

  print(text) {
    if (this.truncated) return
    if (this.output.length + text.length > MAX_OUTPUT) {
      this.output = this.output.slice(0, MAX_OUTPUT) + TRUNCATED_MARK
      this.truncated = true
    } else this.output += text
  }

  // RST 0x10. The real routine also handles colour and cursor control codes; here code 13 is a newline,
  // 32 to 126 are the printable ASCII characters and anything else prints a "?".
  printSpectrumChar(code) {
    if (code === 13) this.print('\n')
    else if (code >= 32 && code <= 126) this.print(String.fromCharCode(code))
    else this.print('?')
  }

  // A CALL to a ROM address. Returns true when the routine is emulated (so no real call is made).
  romCall(target, cpu) {
    if (target === ROM.CHAN_OPEN) {
      // Registers are left alone: the trainer preloads them with a task's inputs before the program runs.
      if (cpu.a !== 2) throw new Error('CALL 0x1601 only supports channel 2 (the main screen): load A with 2 first')
      return true
    }
    if (target === ROM.STACK_BC) {
      this.stacked = cpu.bc
      return true
    }
    if (target === ROM.PRINT_FP) {
      if (this.stacked === undefined) throw new Error('CALL 0x2DE3 prints the number on the ROM calculator stack: call 0x2D2B with the number in BC first')
      this.print(String(this.stacked))
      this.stacked = undefined
      // The real routine uses the registers freely (the book notes HL is left pointing somewhere else),
      // so they are not trusted afterwards. Zero them so a program that relies on them fails the tests.
      cpu.hl = 0
      cpu.bc = 0
      return true
    }
    return false
  }

  // Port 0xFE is the Spectrum's border colour and speaker port. It has no effect here, but it is a real port.
  // Nothing else is emulated, so other ports stop the program rather than being silently ignored.
  handleOut(port) {
    if ((port & 0xff) !== 0xfe) throw new Error(`OUT to port ${port} is not emulated (print with RST 0x10, as on the ZX Spectrum)`)
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
